#!/usr/bin/env python3
"""
Emergency Resource Coordination Platform (ERCP)
Validation / Safety Agent Module — Student 4

Owner: Volunteer/Responder Management + Validation/Safety Agent

Role:
    Deterministic safety gate that runs BEFORE human (coordinator) approval
    of any dispatch / resource allocation proposal.

    It does NOT use an LLM for decisions. All checks are pure, deterministic
    business-rule evaluations so results are auditable and reproducible.

Pipeline position:
    Coordinator/Planner → Situation Analysis → Resource Allocation (propose)
    → **Validation/Safety (this agent)** → Human Approve/Reject/Revise

Explicit allow-list of tools (read-only — never mutates DB state):
    - check_volunteer_availability
    - check_shift_overlap
    - check_shelter_capacity
    - check_resource_stock

Structured I/O contract:
    Input payload (dict):
        {
            "dispatch_id": int | None,
            "incident_id": int | None,
            "assignments": [
                {
                    "volunteer_id": str,
                    "volunteer_name": str,
                    "is_available": bool,
                    "skills": str,               # comma-separated
                    "required_skills": str,      # comma-separated, optional
                    "existing_shifts": [         # scheduled/active shifts
                        {"id": str, "start": iso, "end": iso, "status": str}
                    ],
                    "proposed_shift": {"start": iso, "end": iso} | None
                }
            ],
            "shelter_allocations": [
                {
                    "shelter_id": int,
                    "name": str,
                    "status": str,               # Active / Full / Inactive
                    "total_capacity": int,
                    "current_occupancy": int,
                    "incoming_count": int
                }
            ],
            "resource_requests": [
                {
                    "resource_id": str,
                    "name": str,
                    "resource_type": str,
                    "status": str,               # Available / Dispatched / Maintenance / Reserved
                    "requested_qty": int,
                    "available_qty": int
                }
            ],
            "inventory_requests": [
                {
                    "item_name": str,
                    "category": str,
                    "available_qty": int,
                    "requested_qty": int,
                    "minimum_threshold": int
                }
            ]
        }

    Output (dict):
        {
            "agent_id": str,
            "timestamp": iso,
            "dispatch_id": ...,
            "incident_id": ...,
            "is_valid": bool,
            "recommendation": "APPROVE" | "REJECT" | "REVISE",
            "violations": [{"code": str, "message": str, "severity": "BLOCKER"}],
            "warnings": [{"code": str, "message": str, "severity": "WARNING"}],
            "checks": [{"tool": str, "passed": bool, "detail": str}],
            "status": "COMPLETED"
        }

Rules:
    BLOCKER (is_valid=False, REJECT or REVISE):
        V1 volunteer unavailable (IsAvailable == False)
        V2 double-booking (proposed shift overlaps existing Scheduled/Active shift)
        V3 invalid shift window (proposed start >= end)
        S1 shelter not Active
        S2 shelter over-allocation (occupancy + incoming > capacity)
        R1 resource not Available
        R2 resource insufficient quantity
        I1 inventory insufficient quantity
    WARNING (is_valid may stay True, REVISE suggested):
        W1 skill mismatch
        W2 inventory drops below minimum threshold after allocation
        W3 shelter occupancy > 90% after allocation
"""

import sys
import json
import argparse
import os
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def _load_dotenv():
    """Load KEY=VALUE pairs from ai-agents/.env and repo root .env (stdlib only)."""
    here = os.path.dirname(os.path.abspath(__file__))
    for _p in (os.path.join(here, ".env"), os.path.join(here, "..", ".env")):
        try:
            if os.path.isfile(_p):
                with open(_p, encoding="utf-8") as _f:
                    for _line in _f:
                        _line = _line.strip()
                        if not _line or _line.startswith("#") or "=" not in _line:
                            continue
                        _k, _v = _line.split("=", 1)
                        _k = _k.strip()
                        _v = _v.strip().strip('"').strip("'")
                        if _k and _k not in os.environ:
                            os.environ[_k] = _v
        except Exception:
            pass


_load_dotenv()

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.6-flash")

ALLOWED_TOOLS = [
    "check_volunteer_availability",
    "check_shift_overlap",
    "check_shelter_capacity",
    "check_resource_stock",
]

# Codes the Gemini verdict is allowed to return. Anything else is rejected
# and the deterministic rule result is kept (safety fallback).
GEMINI_ALLOWED_CODES = frozenset({
    "V1_VOLUNTEER_UNAVAILABLE",
    "V2_DOUBLE_BOOKING",
    "V3_INVALID_SHIFT_WINDOW",
    "V0_VOLUNTEER_NOT_FOUND",
    "S0_SHELTER_NOT_FOUND",
    "S1_SHELTER_NOT_ACTIVE",
    "S2_SHELTER_OVER_ALLOCATION",
    "R0_RESOURCE_NOT_FOUND",
    "R1_RESOURCE_NOT_AVAILABLE",
    "R2_RESOURCE_INSUFFICIENT",
    "I0_ITEM_NOT_FOUND",
    "I1_INVENTORY_INSUFFICIENT",
    "E0_INVALID_PAYLOAD",
})
GEMINI_ALLOWED_RECOMMENDATIONS = frozenset({"APPROVE", "REVISE", "REJECT"})


def _get_gemini_key() -> str:
    """Read the Gemini key at call time (not import time).

    Call-time read means tests that blank the env (or QMS runs) always get
    the deterministic path even if the module was imported earlier.
    """
    key = os.environ.get("GEMINI_API_KEY", "")
    qms = (os.environ.get("DOTNET_ENVIRONMENT", "")
           or os.environ.get("ASPNETCORE_ENVIRONMENT", ""))
    if qms.lower() == "qms":
        return ""
    return (key or "").strip()


def _call_gemini_verdict(summary: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Ask Gemini for a final APPROVE/REVISE/REJECT verdict.

    Returns the parsed verdict dict on success, or None when the key is
    missing, the call fails, or the response is not valid strict JSON.
    Uses stdlib urllib only (same pattern as situation_analysis_agent.py).
    Diagnostics go to stderr so CLI JSON stdout stays parseable.
    """
    api_key = _get_gemini_key()
    if not api_key:
        return None
    try:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{GEMINI_MODEL}:generateContent?key={api_key}"
        )
        prompt = (
            "You are the ERCP Validation/Safety Agent deciding a dispatch safety gate. "
            "Given this deterministic rule summary, return the FINAL safety verdict. "
            "Return ONLY a valid JSON object with exactly these keys: "
            "'is_valid' (boolean), "
            "'recommendation' (one of APPROVE, REVISE, REJECT), "
            "'violations' (array of {code, message} using only known rule codes), "
            "'ai_insight' (1-2 sentence plain-English explanation for a coordinator). "
            "Rules: APPROVE only when no blockers. REVISE only for fixable capacity/double-booking "
            "(S2, R2, I1, V2). Otherwise REJECT. "
            f"Rule summary: {json.dumps(summary)[:4000]}"
        )
        payload = json.dumps({
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.0, "maxOutputTokens": 512},
        }).encode("utf-8")
        req = urllib.request.Request(
            url, data=payload, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
        res_json = json.loads(res_body)
        text_content = res_json["candidates"][0]["content"]["parts"][0]["text"]
        text_content = text_content.strip()
        if text_content.startswith("```json"):
            text_content = text_content[7:]
        if text_content.startswith("```"):
            text_content = text_content[3:]
        if text_content.endswith("```"):
            text_content = text_content[:-3]
        text_content = text_content.strip()
        try:
            parsed = json.loads(text_content)
        except json.JSONDecodeError:
            # Model sometimes wraps JSON with prose: extract first {...} block.
            start = text_content.find("{")
            end = text_content.rfind("}")
            if start < 0 or end <= start:
                return None
            parsed = json.loads(text_content[start:end + 1])
        if not isinstance(parsed, dict):
            return None
        if parsed.get("recommendation") not in GEMINI_ALLOWED_RECOMMENDATIONS:
            return None
        if not isinstance(parsed.get("is_valid"), bool):
            return None
        violations = parsed.get("violations", [])
        if not isinstance(violations, list):
            return None
        cleaned = []
        for v in violations:
            if not isinstance(v, dict):
                return None
            code = str(v.get("code", ""))
            if code not in GEMINI_ALLOWED_CODES:
                return None
            cleaned.append({
                "code": code,
                "message": str(v.get("message", code)),
                "severity": "BLOCKER",
            })
        return {
            "is_valid": parsed["is_valid"],
            "recommendation": parsed["recommendation"],
            "violations": cleaned,
            "ai_insight": str(parsed.get("ai_insight", ""))[:500],
        }
    except Exception as e:
        print(f"[Warning] Gemini verdict failed, falling back to deterministic rules. Error: {e}",
              file=sys.stderr)
        return None


def _parse_dt(value: Any) -> Optional[datetime]:
    if not value:
        return None
    try:
        # Accept ISO strings with or without timezone
        text = str(value).replace("Z", "+00:00")
        return datetime.fromisoformat(text)
    except Exception:
        return None


def _overlaps(a_start, a_end, b_start, b_end) -> bool:
    if not all([a_start, a_end, b_start, b_end]):
        return False
    # Standard half-open overlap: [start, end)
    return max(a_start, b_start) < min(a_end, b_end)


class ValidationSafetyAgent:
    """Deterministic pre-approval safety gate."""

    def __init__(self, agent_id: str = "agent-validation-safety-04"):
        self.agent_id = agent_id
        self.role = "Validation / Safety Agent"
        self.allowed_tools = list(ALLOWED_TOOLS)

    # ------------------------------------------------------------------
    # Tool allow-list enforcement (mirrors Coordinator agent pattern)
    # ------------------------------------------------------------------
    def execute_tool(self, tool_name: str, parameters: Optional[Dict[str, Any]] = None):
        if tool_name not in self.allowed_tools:
            raise ValueError(
                f"Security Violation: Tool '{tool_name}' is not in the explicit allow-list. "
                f"Allowed tools are: {', '.join(self.allowed_tools)}"
            )
        parameters = parameters or {}
        if tool_name == "check_volunteer_availability":
            return self.check_volunteer_availability(parameters)
        if tool_name == "check_shift_overlap":
            return self.check_shift_overlap(parameters)
        if tool_name == "check_shelter_capacity":
            return self.check_shelter_capacity(parameters)
        if tool_name == "check_resource_stock":
            return self.check_resource_stock(parameters)
        return {"status": "Executed", "tool": tool_name}

    # ------------------------------------------------------------------
    # Individual deterministic tools
    # ------------------------------------------------------------------
    def check_volunteer_availability(self, volunteer: Dict[str, Any]) -> Dict[str, Any]:
        available = bool(volunteer.get("is_available", volunteer.get("isAvailable", False)))
        return {
            "volunteer_id": volunteer.get("volunteer_id", volunteer.get("id")),
            "is_available": available,
            "passed": available,
        }

    def check_shift_overlap(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """payload: { proposed_shift: {start,end}, existing_shifts: [...] }"""
        proposed = payload.get("proposed_shift") or {}
        p_start = _parse_dt(proposed.get("start"))
        p_end = _parse_dt(proposed.get("end"))

        if proposed and (p_start is None or p_end is None or p_start >= p_end):
            return {"passed": False, "reason": "INVALID_WINDOW"}

        conflicts = []
        for s in payload.get("existing_shifts", []):
            status = str(s.get("status", "Scheduled"))
            if status in ("Cancelled", "Completed"):
                continue  # terminal states cannot double-book
            s_start = _parse_dt(s.get("start", s.get("startTime")))
            s_end = _parse_dt(s.get("end", s.get("endTime")))
            if _overlaps(p_start, p_end, s_start, s_end):
                conflicts.append(s.get("id", "unknown-shift"))

        return {"passed": len(conflicts) == 0, "conflicts": conflicts}

    def check_shelter_capacity(self, allocation: Dict[str, Any]) -> Dict[str, Any]:
        total = int(allocation.get("total_capacity", allocation.get("totalCapacity", 0)))
        occupied = int(allocation.get("current_occupancy", allocation.get("currentOccupancy", 0)))
        incoming = int(allocation.get("incoming_count", allocation.get("incomingCount", 0)))
        status = str(allocation.get("status", "Active"))
        available = max(0, total - occupied)
        projected = occupied + incoming
        return {
            "shelter_id": allocation.get("shelter_id", allocation.get("id")),
            "status": status,
            "total_capacity": total,
            "current_occupancy": occupied,
            "available": available,
            "projected_occupancy": projected,
            "passed": status == "Active" and projected <= total,
        }

    def check_resource_stock(self, request: Dict[str, Any]) -> Dict[str, Any]:
        available = int(request.get("available_qty", request.get("availableQty", request.get("quantity", 0))))
        requested = int(request.get("requested_qty", request.get("requestedQty", 1)))
        status = str(request.get("status", "Available"))
        # Inventory-style items have no status; only resources do.
        has_status = "status" in request
        passed = (not has_status or status == "Available") and available >= requested
        return {
            "resource_id": request.get("resource_id", request.get("id", request.get("item_name", "unknown"))),
            "status": status,
            "available": available,
            "requested": requested,
            "passed": passed,
        }

    # ------------------------------------------------------------------
    # Full assignment validation (the gate)
    # ------------------------------------------------------------------
    def validate_assignment(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        started = time.perf_counter()
        violations: List[Dict[str, str]] = []
        warnings: List[Dict[str, str]] = []
        checks: List[Dict[str, Any]] = []
        errors: List[Dict[str, str]] = []

        if not isinstance(payload, dict):
            return {
                "agent_id": self.agent_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "dispatch_id": None,
                "incident_id": None,
                "is_valid": False,
                "recommendation": "REJECT",
                "violations": [{"code": "E0_INVALID_PAYLOAD", "message": "Input payload must be a JSON object.", "severity": "BLOCKER"}],
                "warnings": [],
                "checks": [],
                "errors": [{"code": "E0_INVALID_PAYLOAD", "message": "Input payload must be a JSON object."}],
                "allowed_tools": self.allowed_tools,
                "duration_ms": 0,
                "status": "COMPLETED",
                "llm_enhanced": False,
                "ai_insight": None,
                "deterministic_fallback": True,
            }

        # W0: an empty proposal (no assignments) must not read as a clean
        # APPROVE — nothing was evaluated (mirrors the C# gate).
        if not payload.get("assignments"):
            warnings.append({
                "code": "W0_EMPTY_DISPATCH",
                "message": "Dispatch has no tasks assigned — add at least one volunteer/resource task and re-run validation before approval.",
                "severity": "WARNING",
            })

        # ---- Volunteers: availability + double-booking + shift window ----
        for a in payload.get("assignments", []):
            vid = a.get("volunteer_id", a.get("id", "unknown"))
            name = a.get("volunteer_name", a.get("name", str(vid)))

            avail = self.execute_tool("check_volunteer_availability", a)
            checks.append({
                "tool": "check_volunteer_availability",
                "passed": avail["passed"],
                "detail": f"Volunteer {name} ({vid}) available={avail['is_available']}",
            })
            if not avail["passed"]:
                violations.append({
                    "code": "V1_VOLUNTEER_UNAVAILABLE",
                    "message": f"Volunteer {name} is marked unavailable/off-duty and cannot be dispatched.",
                    "severity": "BLOCKER",
                })

            proposed = a.get("proposed_shift")
            if proposed:
                overlap = self.execute_tool("check_shift_overlap", {
                    "proposed_shift": proposed,
                    "existing_shifts": a.get("existing_shifts", a.get("shifts", [])),
                })
                if overlap.get("reason") == "INVALID_WINDOW":
                    checks.append({
                        "tool": "check_shift_overlap",
                        "passed": False,
                        "detail": f"Volunteer {name}: proposed shift window is invalid (start >= end or unparsable).",
                    })
                    violations.append({
                        "code": "V3_INVALID_SHIFT_WINDOW",
                        "message": f"Volunteer {name}: proposed shift start must be before end.",
                        "severity": "BLOCKER",
                    })
                else:
                    checks.append({
                        "tool": "check_shift_overlap",
                        "passed": overlap["passed"],
                        "detail": f"Volunteer {name}: {len(overlap['conflicts'])} overlapping shift(s).",
                    })
                    if not overlap["passed"]:
                        violations.append({
                            "code": "V2_DOUBLE_BOOKING",
                            "message": f"Volunteer {name} is already booked on overlapping shift(s): {', '.join(map(str, overlap['conflicts']))}.",
                            "severity": "BLOCKER",
                        })

            # Skill mismatch is a warning, not a blocker (coordinator may override)
            required = str(a.get("required_skills", "") or "").lower()
            has = str(a.get("skills", "") or "").lower()
            if required:
                req_skills = [s.strip() for s in required.replace(";", ",").split(",") if s.strip()]
                missing = [s for s in req_skills if s and s not in has]
                if missing:
                    warnings.append({
                        "code": "W1_SKILL_MISMATCH",
                        "message": f"Volunteer {name} is missing required skill(s): {', '.join(missing)}.",
                        "severity": "WARNING",
                    })
                    checks.append({
                        "tool": "check_volunteer_availability",
                        "passed": True,
                        "detail": f"Volunteer {name}: skill gap noted ({', '.join(missing)}).",
                    })

        # ---- Shelters: status + over-allocation ----
        for s in payload.get("shelter_allocations", payload.get("shelters", [])):
            name = s.get("name", str(s.get("shelter_id", s.get("id", "unknown"))))
            result = self.execute_tool("check_shelter_capacity", s)
            checks.append({
                "tool": "check_shelter_capacity",
                "passed": result["passed"],
                "detail": f"Shelter {name}: {result['current_occupancy']}+{s.get('incoming_count', s.get('incomingCount', 0))}/{result['total_capacity']} (status={result['status']}).",
            })
            if result["status"] != "Active":
                violations.append({
                    "code": "S1_SHELTER_NOT_ACTIVE",
                    "message": f"Shelter {name} has status '{result['status']}' and cannot receive evacuees.",
                    "severity": "BLOCKER",
                })
            elif result["projected_occupancy"] > result["total_capacity"]:
                violations.append({
                    "code": "S2_SHELTER_OVER_ALLOCATION",
                    "message": f"Shelter {name} would exceed capacity ({result['projected_occupancy']}/{result['total_capacity']}).",
                    "severity": "BLOCKER",
                })
            elif result["total_capacity"] > 0 and result["projected_occupancy"] / result["total_capacity"] > 0.9:
                warnings.append({
                    "code": "W3_SHELTER_NEAR_CAPACITY",
                    "message": f"Shelter {name} will be >90% full after allocation ({result['projected_occupancy']}/{result['total_capacity']}).",
                    "severity": "WARNING",
                })

        # ---- Resources: status + quantity ----
        for r in payload.get("resource_requests", payload.get("resources", [])):
            name = r.get("name", str(r.get("resource_id", r.get("id", "unknown"))))
            result = self.execute_tool("check_resource_stock", r)
            checks.append({
                "tool": "check_resource_stock",
                "passed": result["passed"],
                "detail": f"Resource {name}: requested={result['requested']} available={result['available']} (status={result['status']}).",
            })
            if "status" in r and str(r.get("status")) != "Available":
                violations.append({
                    "code": "R1_RESOURCE_NOT_AVAILABLE",
                    "message": f"Resource {name} has status '{r.get('status')}' and cannot be dispatched.",
                    "severity": "BLOCKER",
                })
            elif result["available"] < result["requested"]:
                violations.append({
                    "code": "R2_RESOURCE_INSUFFICIENT",
                    "message": f"Resource {name} insufficient: requested {result['requested']}, available {result['available']}.",
                    "severity": "BLOCKER",
                })

        # ---- Inventory: quantity + threshold warning ----
        for item in payload.get("inventory_requests", payload.get("inventory", [])):
            name = item.get("item_name", item.get("itemName", "unknown"))
            available = int(item.get("available_qty", item.get("availableQty", item.get("quantity", 0))))
            requested = int(item.get("requested_qty", item.get("requestedQty", 0)))
            threshold = int(item.get("minimum_threshold", item.get("minimumThreshold", 10)))
            passed = available >= requested
            checks.append({
                "tool": "check_resource_stock",
                "passed": passed,
                "detail": f"Inventory {name}: requested={requested} available={available} threshold={threshold}.",
            })
            if not passed:
                violations.append({
                    "code": "I1_INVENTORY_INSUFFICIENT",
                    "message": f"Inventory {name} insufficient: requested {requested}, available {available}.",
                    "severity": "BLOCKER",
                })
            elif available - requested < threshold:
                warnings.append({
                    "code": "W2_INVENTORY_BELOW_THRESHOLD",
                    "message": f"Inventory {name} will drop below minimum threshold ({available - requested} < {threshold}) after allocation.",
                    "severity": "WARNING",
                })

        is_valid = len(violations) == 0
        if is_valid:
            recommendation = "APPROVE" if not warnings else "REVISE"
        else:
            # Single fixable warning + blockers -> REVISE is misleading; blockers mean REJECT
            # unless the only blockers are capacity/quantity which a coordinator could revise.
            revisable = {"S2_SHELTER_OVER_ALLOCATION", "R2_RESOURCE_INSUFFICIENT", "I1_INVENTORY_INSUFFICIENT", "V2_DOUBLE_BOOKING"}
            codes = {v["code"] for v in violations}
            recommendation = "REVISE" if codes and codes.issubset(revisable) else "REJECT"

        # ---- Gemini full verdict (hybrid: rules always run first) ----
        # Rules above are the safety ground truth. When GEMINI_API_KEY is set,
        # Gemini may supply the FINAL verdict; invalid/missing/timeout responses
        # fall back to the deterministic result so the gate never blanks.
        llm_enhanced = False
        ai_insight = None
        deterministic_fallback = True
        if _get_gemini_key():
            summary = {
                "dispatch_id": payload.get("dispatch_id", payload.get("dispatchId")),
                "incident_id": payload.get("incident_id", payload.get("incidentId")),
                "rule_is_valid": is_valid,
                "rule_recommendation": recommendation,
                "rule_violations": [v["code"] for v in violations],
                "rule_warnings": [w["code"] for w in warnings],
                "check_count": len(checks),
            }
            llm_verdict = _call_gemini_verdict(summary)
            if llm_verdict is not None:
                # Coherence guard: is_valid must match violations emptiness.
                llm_violations = llm_verdict["violations"]
                is_valid = llm_verdict["is_valid"] and len(llm_violations) == 0
                if not is_valid and len(llm_violations) == 0:
                    # LLM claimed invalid with no blockers -> keep rules instead.
                    pass
                else:
                    violations = llm_violations
                    recommendation = llm_verdict["recommendation"]
                    # Enforce verdict/violation coherence.
                    if violations and recommendation == "APPROVE":
                        recommendation = "REJECT"
                    if not violations:
                        is_valid = True
                        if recommendation not in ("APPROVE", "REVISE"):
                            recommendation = "APPROVE" if not warnings else "REVISE"
                    ai_insight = llm_verdict.get("ai_insight") or None
                    llm_enhanced = True
                    deterministic_fallback = False
                    checks.append({
                        "tool": "gemini_verdict",
                        "passed": True,
                        "detail": f"Gemini {GEMINI_MODEL} final verdict: {recommendation}.",
                    })
            if not llm_enhanced:
                checks.append({
                    "tool": "gemini_verdict",
                    "passed": False,
                    "detail": "Gemini verdict unavailable - deterministic rule result kept.",
                })

        duration_ms = int((time.perf_counter() - started) * 1000)
        return {
            "agent_id": self.agent_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "dispatch_id": payload.get("dispatch_id", payload.get("dispatchId")),
            "incident_id": payload.get("incident_id", payload.get("incidentId")),
            "is_valid": is_valid,
            "recommendation": recommendation,
            "violations": violations,
            "warnings": warnings,
            "checks": checks,
            "errors": errors,
            "allowed_tools": self.allowed_tools,
            "duration_ms": duration_ms,
            "status": "COMPLETED",
            "llm_enhanced": llm_enhanced,
            "ai_insight": ai_insight,
            "deterministic_fallback": deterministic_fallback,
        }


def main():
    parser = argparse.ArgumentParser(description="ERCP Validation / Safety Agent (deterministic pre-approval gate)")
    parser.add_argument("--json", type=str, help="Input JSON payload (assignment proposal)")
    parser.add_argument("--dispatch-id", type=int, default=None)
    parser.add_argument("--incident-id", type=int, default=None)
    args = parser.parse_args()

    if args.json:
        try:
            payload = json.loads(args.json)
        except Exception as e:
            sys.stderr.write(f"Error parsing JSON payload: {e}\n")
            sys.exit(1)
    else:
        # Demo payload exercising every rule once
        payload = {
            "dispatch_id": args.dispatch_id or 1,
            "incident_id": args.incident_id or 1,
            "assignments": [
                {
                    "volunteer_id": "vol-001",
                    "volunteer_name": "Marcus Vance",
                    "is_available": True,
                    "skills": "medical, rescue",
                    "required_skills": "medical",
                    "existing_shifts": [],
                    "proposed_shift": {
                        "start": "2026-09-20T08:00:00Z",
                        "end": "2026-09-20T16:00:00Z",
                    },
                }
            ],
            "shelter_allocations": [
                {
                    "shelter_id": 101,
                    "name": "Community Gym",
                    "status": "Active",
                    "total_capacity": 100,
                    "current_occupancy": 30,
                    "incoming_count": 20,
                }
            ],
            "resource_requests": [
                {
                    "resource_id": "res-ambulance-1",
                    "name": "Ambulance A",
                    "resource_type": "Vehicle",
                    "status": "Available",
                    "requested_qty": 1,
                    "available_qty": 1,
                }
            ],
            "inventory_requests": [
                {
                    "item_name": "Field Medical Kit",
                    "category": "Medical",
                    "available_qty": 60,
                    "requested_qty": 10,
                    "minimum_threshold": 10,
                }
            ],
        }

    agent = ValidationSafetyAgent()
    print(json.dumps(agent.validate_assignment(payload), indent=2))


if __name__ == "__main__":
    main()
