#!/usr/bin/env python3
"""
Emergency Resource Coordination Platform (ERCP)
AI Coordinator / Planner Agent Module

Responsible for:
1. Threat & Risk Assessment based on incident telemetry and parameters.
2. Generating multi-phase tactical action plans for emergency response.
3. Estimating required emergency resources (personnel, vehicles, medical gear).
4. Generating coordination directives for sub-agents (Situation Analysis, Resource Allocation, Safety/Validation).
"""

import sys
import json
import argparse
from datetime import datetime, timezone

# Explicit Allow-List of tools that the Coordinator/Planner Agent is permitted to execute
ALLOWED_TOOLS = [
    "get_incident",
    "get_available_resources",
    "get_available_volunteers",
    "get_nearby_shelters",
    "create_response_plan"
]

class CoordinatorPlannerAgent:
    def __init__(self, name="AI-Coordinator-Alpha"):
        self.name = name
        self.allowed_tools = ALLOWED_TOOLS

    def execute_tool(self, tool_name, parameters=None):
        """
        Safety check & invocation for allowed agent tools.
        Disallows high-impact operations like deleting incidents or modifying DB state directly.
        """
        if tool_name not in self.allowed_tools:
            raise ValueError(
                f"Security Violation: Tool '{tool_name}' is not in the explicit allow-list. "
                f"Allowed tools are: {', '.join(self.allowed_tools)}"
            )

        # Simulation stubs for allowed read-only/planning tools
        if tool_name == "get_incident":
            return {"incidentId": parameters.get("incident_id") if parameters else 0, "status": "Retrieved"}
        elif tool_name == "get_available_resources":
            return {"status": "Available", "resources": ["Engine-1", "Ambulance-A"]}
        elif tool_name == "get_available_volunteers":
            return {"status": "Available", "volunteersCount": 15}
        elif tool_name == "get_nearby_shelters":
            return {"status": "Available", "shelters": ["Central High Shelter"]}
        elif tool_name == "create_response_plan":
            return {"status": "DraftCreated"}

        return {"status": "Executed", "tool": tool_name}

    def analyze_and_plan(self, incident_data):
        incident_id = incident_data.get("incident_id", 0)
        if not incident_id:
            incident_id = incident_data.get("incidentId", 0)

        title = incident_data.get("title", "Emergency Incident")
        description = incident_data.get("description", "")
        location = incident_data.get("location", "Unknown Location")
        category = incident_data.get("category", "General Emergency")
        priority = incident_data.get("priority", "Medium")
        affected_count = int(incident_data.get("affected_count", incident_data.get("affectedCount", 0)))
        custom_directives = incident_data.get("custom_directives", "")
        focus_phase = incident_data.get("focus_phase", "")

        # 1. Threat & Risk Matrix Evaluation
        risk_level, escalation_warning = self._evaluate_threat(category, priority, affected_count)

        # 2. Determine Staging Phase
        primary_phase = focus_phase if focus_phase else self._determine_primary_phase(priority, affected_count)

        # 3. Generate Tactical Action Steps
        action_steps = self._generate_action_steps(category, priority, affected_count, location)

        # 4. Estimate Resource Allocations
        estimated_resources = self._estimate_resources(category, priority, affected_count)

        # 5. Formulate Sub-Agent Directives
        agent_directives = self._formulate_subagent_directives(category, priority, location)

        plan_title = f"AI Coordinator Tactical Plan: {title}"
        if custom_directives:
            plan_title += " (Customized)"

        plan_description = (
            f"Autonomous coordination strategy by {self.name} for {category} incident at '{location}'. "
            f"Evaluated Risk: {risk_level}. Stated Impact: ~{affected_count} affected individuals."
        )

        objective = f"Contain {category} emergency and protect affected civilians at {location}."

        # Simplify list of actions for structured response
        actions_list = [step["task"] for step in action_steps]
        required_resources_list = [f"{res['quantity']} {res['unit']} ({res['resource_type']})" for res in estimated_resources]

        return {
            "agent_id": self.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            # Structured AI Output requirements
            "incidentId": incident_id,
            "priority": priority,
            "objective": objective,
            "actions": actions_list,
            "requiredResources": required_resources_list,
            "status": "Generated",
            # Additional detailed schema attributes for backend model mapping
            "incident_id": incident_id,
            "plan_title": plan_title,
            "plan_description": plan_description,
            "phase": primary_phase,
            "risk_assessment": f"[{risk_level}] {escalation_warning}",
            "action_steps": action_steps,
            "estimated_resources": estimated_resources,
            "subagent_directives": agent_directives,
            "allowed_tools": self.allowed_tools
        }

    def _evaluate_threat(self, category, priority, affected_count):
        if priority.upper() in ["CRITICAL", "HIGH"] or affected_count > 30:
            risk_level = "CRITICAL THREAT"
            escalation_warning = (
                f"High hazard severity detected for {category}. Risk of rapid escalation, "
                "mass casualty potential, or severe infrastructural failure. Immediate intervention required."
            )
        elif priority.upper() == "MEDIUM" or affected_count > 5:
            risk_level = "MODERATE THREAT"
            escalation_warning = (
                f"Moderate disruption expected for {category}. Active monitoring and controlled response recommended."
            )
        else:
            risk_level = "LOW THREAT"
            escalation_warning = "Low immediate threat. Standard monitoring and localized containment protocols apply."

        return risk_level, escalation_warning

    def _determine_primary_phase(self, priority, affected_count):
        if priority.upper() == "CRITICAL" or affected_count > 50:
            return "Immediate Life Containment & Mass Evacuation"
        elif priority.upper() == "HIGH":
            return "Resource Mobilization & Perimeter Lockdown"
        elif priority.upper() == "MEDIUM":
            return "Tactical Field Operations & Staging"
        else:
            return "Initial Scene Assessment & Monitoring"

    def _generate_action_steps(self, category, priority, affected_count, location):
        steps = []
        
        # Step 1: Staging Command
        steps.append({
            "step_number": 1,
            "task": f"Establish Incident Command Post & Emergency Perimeter at {location}.",
            "responsible_team": "Unified First Responder Command",
            "priority": "Critical",
            "estimated_minutes": 15,
            "is_completed": False
        })

        # Category specific steps
        cat_lower = category.lower()
        if "fire" in cat_lower:
            steps.append({
                "step_number": 2,
                "task": "Deploy interior fire suppression lines and thermal cameras.",
                "responsible_team": "Fire Rescue Crew Alpha",
                "priority": "Critical",
                "estimated_minutes": 20,
                "is_completed": False
            })
            steps.append({
                "step_number": 3,
                "task": "Isolate natural gas feeds and high-voltage power grids in affected zone.",
                "responsible_team": "Utility Emergency Services",
                "priority": "High",
                "estimated_minutes": 25,
                "is_completed": False
            })
        elif "flood" in cat_lower:
            steps.append({
                "step_number": 2,
                "task": "Deploy inflatable swift-water rescue craft for stranded civilians.",
                "responsible_team": "Aquatic Rescue Task Force",
                "priority": "Critical",
                "estimated_minutes": 30,
                "is_completed": False
            })
            steps.append({
                "step_number": 3,
                "task": "Deploy sandbag barriers and auxiliary dewatering pumps near hospital zone.",
                "responsible_team": "Public Works & Logistics",
                "priority": "High",
                "estimated_minutes": 45,
                "is_completed": False
            })
        elif "medical" in cat_lower:
            steps.append({
                "step_number": 2,
                "task": "Setup START protocol medical triage tent and ambulance staging area.",
                "responsible_team": "Emergency Medical Services",
                "priority": "Critical",
                "estimated_minutes": 15,
                "is_completed": False
            })
            steps.append({
                "step_number": 3,
                "task": "Coordinate emergency transport routes with regional Trauma Level 1 facilities.",
                "responsible_team": "Hospital Network Coordinator",
                "priority": "High",
                "estimated_minutes": 20,
                "is_completed": False
            })
        else:
            steps.append({
                "step_number": 2,
                "task": "Deploy hazard assessment teams and perform initial victim search.",
                "responsible_team": "Emergency Response Unit",
                "priority": "High",
                "estimated_minutes": 30,
                "is_completed": False
            })

        # Evacuation step
        if affected_count > 10 or priority.upper() in ["CRITICAL", "HIGH"]:
            steps.append({
                "step_number": len(steps) + 1,
                "task": f"Organize structured evacuation for approx {max(affected_count, 20)} residents to designated safe zone.",
                "responsible_team": "Evacuation & Transit Support",
                "priority": "High",
                "estimated_minutes": 45,
                "is_completed": False
            })

        # Final Phase
        steps.append({
            "step_number": len(steps) + 1,
            "task": "Perform post-containment safety inspection and submit situation report.",
            "responsible_team": "AI Coordinator Agent",
            "priority": "Medium",
            "estimated_minutes": 60,
            "is_completed": False
        })

        return steps

    def _estimate_resources(self, category, priority, affected_count):
        mult = 3 if priority.upper() == "CRITICAL" else (2 if priority.upper() == "HIGH" else 1)
        res = [
            {
                "resource_type": "Personnel",
                "quantity": max(6, (affected_count // 2 if affected_count else 10) * mult),
                "unit": "Emergency Responders",
                "description": "First responders, paramedics, and rescue personnel."
            },
            {
                "resource_type": "Vehicle",
                "quantity": 2 * mult,
                "unit": "Emergency Response Vehicles",
                "description": "Primary suppression, ambulance, or mobile command units."
            },
            {
                "resource_type": "Medical",
                "quantity": max(10, affected_count * 2),
                "unit": "Field Medical Kits",
                "description": "Trauma kits, oxygen, burn care, and IV fluids."
            }
        ]
        return res

    def _formulate_subagent_directives(self, category, priority, location):
        return {
            "SituationAnalysisAgent": f"Request real-time weather and spatial hazard overlay for {location}.",
            "ResourceAllocationAgent": f"Lock reserve inventory for {category} response with {priority} priority level.",
            "ValidationSafetyAgent": "Verify responder safety protocols and structural integrity prior to team entry."
        }

def main():
    parser = argparse.ArgumentParser(description="AI Coordinator / Planner Agent for ERCP")
    parser.add_argument("--json", type=str, help="Input JSON payload with incident details")
    parser.add_argument("--title", type=str, help="Incident Title")
    parser.add_argument("--category", type=str, default="General Emergency", help="Incident Category")
    parser.add_argument("--priority", type=str, default="Medium", help="Incident Priority")
    parser.add_argument("--location", type=str, default="Unknown", help="Incident Location")

    args = parser.parse_args()

    incident_data = {}
    if args.json:
        try:
            incident_data = json.loads(args.json)
        except Exception as e:
            sys.stderr.write(f"Error parsing JSON payload: {e}\n")
            sys.exit(1)
    else:
        incident_data = {
            "title": args.title or "Demo Emergency Incident",
            "category": args.category,
            "priority": args.priority,
            "location": args.location
        }

    agent = CoordinatorPlannerAgent()
    plan = agent.analyze_and_plan(incident_data)

    print(json.dumps(plan, indent=2))

if __name__ == "__main__":
    main()
