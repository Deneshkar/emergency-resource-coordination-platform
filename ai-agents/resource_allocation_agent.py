#!/usr/bin/env python3
"""
Emergency Resource Coordination Platform (ERCP)
Resource Allocation Agent Module — Student 3

Purpose:
    Build a deterministic, auditable allocation proposal for an incident based
    on the available resource and volunteer pool. This is intentionally isolated
    from the other student modules: it does not modify the DB directly and only
    produces proposal data for approval and downstream validation.

Data contract:
    Input payload (dict):
    {
        "incident_id": 12,
        "category": "Fire",
        "priority": "High",
        "location": "Sector 4",
        "required_resources": [
            {"resource_type": "Vehicle", "quantity": 2, "purpose": "Rescue"},
            {"resource_type": "Medical", "quantity": 1, "purpose": "Triage"}
        ],
        "available_resources": [
            {"id": 1, "name": "Ambulance 2", "resourceType": "Vehicle", "status": "Available"},
            {"id": 2, "name": "Medic Kit A", "resourceType": "Medical", "status": "Available"}
        ],
        "available_volunteers": [
            {"id": 101, "name": "Ava", "skill": "Medical", "isAvailable": True},
            {"id": 102, "name": "Ben", "skill": "Logistics", "isAvailable": True}
        ]
    }

Output payload:
    {
        "agent_id": "agent-resource-allocation-03",
        "timestamp": "...",
        "incident_id": 12,
        "status": "COMPLETED",
        "allocation_plan": {
            "plan_title": "Resource Allocation Plan",
            "phase": "Dispatch Readiness",
            "requires_human_approval": True,
            "assignments": [...],
            "resource_gaps": [...],
            "constraints": [...],
            "warnings": [...],
            "proposed_tasks": [...]
        }
    }
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

ALLOWED_TOOLS = [
    "get_available_resources",
    "get_available_volunteers",
    "check_resource_coverage",
    "propose_task_assignment",
]


def _load_dotenv():
    here = os.path.dirname(os.path.abspath(__file__))
    for path in (os.path.join(here, ".env"), os.path.join(here, "..", ".env")):
        try:
            if os.path.isfile(path):
                with open(path, encoding="utf-8") as f:
                    for raw in f:
                        line = raw.strip()
                        if not line or line.startswith("#") or "=" not in line:
                            continue
                        key, value = line.split("=", 1)
                        key = key.strip()
                        value = value.strip().strip('"').strip("'")
                        if key and key not in os.environ:
                            os.environ[key] = value
        except Exception:
            pass


_load_dotenv()


class ResourceAllocationAgent:
    """Deterministic, approval-oriented resource allocation planner."""

    def __init__(self, agent_id: str = "agent-resource-allocation-03"):
        self.agent_id = agent_id
        self.role = "Resource Allocation Agent"
        self.allowed_tools = list(ALLOWED_TOOLS)

    def execute_tool(self, tool_name: str, parameters: Optional[Dict[str, Any]] = None):
        if tool_name not in self.allowed_tools:
            raise ValueError(
                f"Security Violation: Tool '{tool_name}' is not in the explicit allow-list. "
                f"Allowed tools are: {', '.join(self.allowed_tools)}"
            )

        parameters = parameters or {}
        if tool_name == "get_available_resources":
            return self.get_available_resources(parameters)
        if tool_name == "get_available_volunteers":
            return self.get_available_volunteers(parameters)
        if tool_name == "check_resource_coverage":
            return self.check_resource_coverage(parameters)
        if tool_name == "propose_task_assignment":
            return self.propose_task_assignment(parameters)
        return {"status": "Executed", "tool": tool_name}

    def get_available_resources(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        items = payload.get("resources", payload.get("available_resources", [])) or []
        available = [
            {
                "id": item.get("id", item.get("ResourceId")),
                "name": item.get("name", item.get("Name", "Unknown Resource")),
                "resourceType": item.get("resourceType", item.get("ResourceType", "Unknown")),
                "status": item.get("status", item.get("Status", "Available")),
            }
            for item in items
            if str(item.get("status", item.get("Status", "Available")).lower()) == "available"
        ]
        return {
            "tool": "get_available_resources",
            "available_resources": available,
            "count": len(available),
            "status": "COMPLETED",
        }

    def get_available_volunteers(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        items = payload.get("volunteers", payload.get("available_volunteers", [])) or []
        available = [
            {
                "id": item.get("id", item.get("Id")),
                "name": item.get("name", item.get("Name", "Unknown Volunteer")),
                "skill": item.get("skill", item.get("Skill", "General")),
                "isAvailable": bool(item.get("isAvailable", item.get("IsAvailable", True))),
            }
            for item in items
            if bool(item.get("isAvailable", item.get("IsAvailable", True)))
        ]
        return {
            "tool": "get_available_volunteers",
            "available_volunteers": available,
            "count": len(available),
            "status": "COMPLETED",
        }

    def check_resource_coverage(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        required = payload.get("required_resources", payload.get("requirements", [])) or []
        resources = payload.get("resources", payload.get("available_resources", [])) or []
        coverage = []
        gaps = []

        for requirement in required:
            req_type = str(requirement.get("resource_type", requirement.get("resourceType", "Unknown")))
            qty = int(requirement.get("quantity", requirement.get("Quantity", 0)))
            match = [
                r for r in resources
                if str(r.get("resourceType", r.get("ResourceType", "Unknown"))).lower() == req_type.lower()
                and str(r.get("status", r.get("Status", "Available")).lower()) == "available"
            ]
            available_qty = len(match)
            shortage = max(0, qty - available_qty)
            coverage.append({
                "resource_type": req_type,
                "required": qty,
                "available": available_qty,
                "shortage": shortage,
                "passed": shortage == 0,
            })
            if shortage > 0:
                gaps.append({
                    "resource_type": req_type,
                    "missing_qty": shortage,
                    "message": f"Need {shortage} more {req_type} resources to meet the requirement.",
                })

        return {
            "tool": "check_resource_coverage",
            "coverage": coverage,
            "gaps": gaps,
            "passed": len(gaps) == 0,
            "status": "COMPLETED",
        }

    def propose_task_assignment(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        incident = payload.get("incident") or payload
        required = payload.get("required_resources", payload.get("requirements", [])) or []
        resources = payload.get("resources", payload.get("available_resources", [])) or []
        volunteers = payload.get("volunteers", payload.get("available_volunteers", [])) or []

        tasks: List[Dict[str, Any]] = []
        assigned_resources: List[Dict[str, Any]] = []
        assigned_volunteers: List[Dict[str, Any]] = []
        resource_gaps: List[Dict[str, Any]] = []
        warnings: List[Dict[str, Any]] = []
        constraints: List[str] = []

        # Resource matching
        for requirement in required:
            req_type = str(requirement.get("resource_type", requirement.get("resourceType", "Unknown")))
            qty = int(requirement.get("quantity", requirement.get("Quantity", 0)))
            candidates = [
                r for r in resources
                if str(r.get("resourceType", r.get("ResourceType", "Unknown"))).lower() == req_type.lower()
                and str(r.get("status", r.get("Status", "Available")).lower()) == "available"
            ]
            used = 0
            for candidate in candidates[:qty]:
                used += 1
                assigned_resources.append({
                    "id": candidate.get("id", candidate.get("Id")),
                    "name": candidate.get("name", candidate.get("Name", "Unknown Resource")),
                    "resourceType": candidate.get("resourceType", candidate.get("ResourceType", req_type)),
                    "status": candidate.get("status", candidate.get("Status", "Available")),
                    "purpose": requirement.get("purpose", requirement.get("Purpose", "Incident response")),
                })
                tasks.append({
                    "task_type": "Resource Deployment",
                    "resource_id": candidate.get("id", candidate.get("Id")),
                    "resource_name": candidate.get("name", candidate.get("Name", "Unknown Resource")),
                    "resource_type": req_type,
                    "purpose": requirement.get("purpose", requirement.get("Purpose", "Incident response")),
                    "location": incident.get("location", incident.get("Location", "Unknown Location")),
                })

            shortage = max(0, qty - used)
            if shortage > 0:
                resource_gaps.append({
                    "resource_type": req_type,
                    "required": qty,
                    "assigned": used,
                    "missing": shortage,
                    "message": f"Shortage of {shortage} {req_type} resource(s) for this incident.",
                })
                constraints.append(f"Resource shortage: {shortage} {req_type} unavailable.")

        # Volunteer matching
        volunteer_pool = [
            v for v in volunteers
            if bool(v.get("isAvailable", v.get("IsAvailable", True)))
        ]
        for idx, volunteer in enumerate(volunteer_pool[: max(1, len(tasks))]):
            assigned_volunteers.append({
                "id": volunteer.get("id", volunteer.get("Id")),
                "name": volunteer.get("name", volunteer.get("Name", f"Volunteer {idx + 1}")),
                "skill": volunteer.get("skill", volunteer.get("Skill", "General")),
            })
            tasks.append({
                "task_type": "Volunteer Support",
                "volunteer_id": volunteer.get("id", volunteer.get("Id")),
                "volunteer_name": volunteer.get("name", volunteer.get("Name", f"Volunteer {idx + 1}")),
                "skill": volunteer.get("skill", volunteer.get("Skill", "General")),
                "location": incident.get("location", incident.get("Location", "Unknown Location")),
            })

        if not tasks:
            warnings.append({
                "code": "W0_NO_ASSIGNMENTS",
                "message": "No resource or volunteer assignments were recommended because the input pool is empty.",
            })
            constraints.append("No suitable resources or volunteers currently available.")

        return {
            "tool": "propose_task_assignment",
            "incident_id": incident.get("incident_id", incident.get("incidentId", None)),
            "assigned_resources": assigned_resources,
            "assigned_volunteers": assigned_volunteers,
            "resource_gaps": resource_gaps,
            "warnings": warnings,
            "constraints": constraints,
            "tasks": tasks,
            "status": "COMPLETED",
        }

    def allocate_for_incident(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        incident = payload.get("incident", payload) if isinstance(payload, dict) else {}
        resources = payload.get("available_resources", payload.get("resources", [])) or []
        volunteers = payload.get("available_volunteers", payload.get("volunteers", [])) or []
        required = payload.get("required_resources", payload.get("requirements", [])) or []

        if not required:
            required = [
                {"resource_type": "Vehicle", "quantity": 1, "purpose": "Emergency response"},
                {"resource_type": "Medical", "quantity": 1, "purpose": "Triage"},
            ]
        # Deterministic default estimate if the incident is high priority or large-scale.
        priority = str(incident.get("priority", incident.get("Priority", "Medium")).upper())
        affected_count = int(incident.get("affected_count", incident.get("affectedCount", 0)))
        if priority in {"HIGH", "CRITICAL"} or affected_count > 10:
            required = [
                {"resource_type": "Vehicle", "quantity": 2, "purpose": "Emergency response"},
                {"resource_type": "Medical", "quantity": 2, "purpose": "Triage"},
                {"resource_type": "Personnel", "quantity": max(2, affected_count // 10), "purpose": "On-ground support"},
            ]

        coverage = self.check_resource_coverage({
            "required_resources": required,
            "resources": resources,
        })
        proposal = self.propose_task_assignment({
            "incident": incident,
            "required_resources": required,
            "resources": resources,
            "volunteers": volunteers,
        })

        gaps = coverage.get("gaps", [])
        warnings = proposal.get("warnings", [])
        constraints = proposal.get("constraints", [])

        if not coverage.get("passed", False):
            warnings.append({
                "code": "W1_RESOURCE_SHORTAGE",
                "message": "The resource pool does not fully cover the estimated requirement. Partial allocation is proposed for review.",
            })

        # Human approval is required for all allocation proposals.
        plan = {
            "plan_title": f"Resource Allocation Plan for {incident.get('title', incident.get('Title', 'Emergency Incident'))}",
            "phase": "Dispatch Readiness",
            "requires_human_approval": True,
            "incident_id": incident.get("incident_id", incident.get("incidentId", None)),
            "priority": incident.get("priority", incident.get("Priority", "Medium")),
            "location": incident.get("location", incident.get("Location", "Unknown Location")),
            "required_resources": required,
            "resource_coverage": coverage.get("coverage", []),
            "resource_gaps": gaps,
            "assignments": proposal.get("tasks", []),
            "assigned_resources": proposal.get("assigned_resources", []),
            "assigned_volunteers": proposal.get("assigned_volunteers", []),
            "shelter_allocations": ([{
                "shelter_id": int(payload["nearest_shelter"]["id"]),
                "incoming_count": affected_count,
            }] if payload.get("nearest_shelter") and affected_count > 0 and
                int(payload["nearest_shelter"].get("available_capacity", 0)) > 0 else []),
            "warnings": warnings,
            "constraints": constraints,
            "recommendation": "REVISE" if gaps else "APPROVE",
            "status": "COMPLETED",
        }

        return {
            "agent_id": self.agent_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "incident_id": incident.get("incident_id", incident.get("incidentId", None)),
            "plan_id": payload.get("plan_id"),
            "situation_assessment_id": payload.get("situation_assessment_id"),
            "tool_calls": self.allowed_tools,
            "status": "COMPLETED",
            "allocation_plan": plan,
            "allocated_resources": proposal.get("assigned_resources", []),
            "allocated_volunteers": proposal.get("assigned_volunteers", []),
            "resource_gaps": gaps,
            "warnings": warnings,
            "constraints": constraints,
            "allowed_tools": self.allowed_tools,
        }


def main():
    parser = argparse.ArgumentParser(description="Resource Allocation Agent for ERCP")
    parser.add_argument("--json", type=str, help="Input JSON payload")
    parser.add_argument("--stdin", action="store_true", help="Read one JSON payload from stdin")
    parser.add_argument("--task", type=str, default="allocate", help="Task to execute: allocate")
    args = parser.parse_args()

    payload = {}
    if args.stdin:
        payload = json.load(sys.stdin)
    elif args.json:
        try:
            payload = json.loads(args.json)
        except Exception as exc:
            sys.stderr.write(f"Error parsing JSON payload: {exc}\n")
            sys.exit(1)
    else:
        payload = {
            "incident_id": 1,
            "title": "Demo Emergency",
            "category": "Fire",
            "priority": "High",
            "location": "Sector 4",
            "required_resources": [
                {"resource_type": "Vehicle", "quantity": 2, "purpose": "Rescue"},
                {"resource_type": "Medical", "quantity": 1, "purpose": "Triage"},
            ],
            "available_resources": [
                {"id": 1, "name": "Ambulance 2", "resourceType": "Vehicle", "status": "Available"},
                {"id": 2, "name": "Medic Kit A", "resourceType": "Medical", "status": "Available"},
            ],
            "available_volunteers": [
                {"id": 101, "name": "Ava", "skill": "Medical", "isAvailable": True},
                {"id": 102, "name": "Ben", "skill": "Logistics", "isAvailable": True},
            ],
        }

    agent = ResourceAllocationAgent()
    result = agent.allocate_for_incident(payload)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
