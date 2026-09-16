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
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


ALLOWED_TOOLS = [
    "check_volunteer_availability",
    "check_shift_overlap",
    "check_shelter_capacity",
    "check_resource_stock",
]


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
        violations: List[Dict[str, str]] = []
        warnings: List[Dict[str, str]] = []
        checks: List[Dict[str, Any]] = []

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
            "allowed_tools": self.allowed_tools,
            "status": "COMPLETED",
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
