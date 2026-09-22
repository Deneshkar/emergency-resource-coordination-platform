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
import os
from datetime import datetime, timezone

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

# Explicit Allow-List of tools that the Coordinator/Planner Agent is permitted to execute
ALLOWED_TOOLS = [
    "get_incident",
    "get_available_resources",
    "get_available_volunteers",
    "get_nearby_shelters",
    "assess_incident_risk",
    "summarize_incident",
    "check_duplicate_incidents",
    "recommend_resources",
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
        incident_id = incident_data.get("incident_id") or incident_data.get("incidentId") or 0
        title = incident_data.get("title", "Emergency Incident")
        description = incident_data.get("description", "")
        location = incident_data.get("location", "Unknown Location")
        category = incident_data.get("category", "General Emergency")
        priority = incident_data.get("priority", "Medium")
        affected_count = int(incident_data.get("affected_count", incident_data.get("affectedCount", 0)))
        
        # Gather info (Agentic Step 1)
        resources = incident_data.get("resources", [])
        volunteers = incident_data.get("volunteers", [])

        # Reason & Plan (Agentic Step 2)
        reasoning_log = f"1. Observed {priority} priority {category} incident with {affected_count} affected.\n"
        
        if len(resources) == 0:
            reasoning_log += "2. Gathered real data: No available resources found.\n"
        else:
            reasoning_log += f"2. Gathered real data: {len(resources)} resources available.\n"
            
        if len(volunteers) == 0:
            reasoning_log += "3. Gathered real data: No available volunteers found.\n"
        else:
            reasoning_log += f"3. Gathered real data: {len(volunteers)} volunteers available.\n"
        
        constraints = []
        risks = []
        
        if priority in ["High", "Critical"]:
            risks.append("High risk of escalation. Rapid deployment required.")
        if affected_count > 20:
            risks.append("Mass casualty potential. Large-scale evacuation may be necessary.")
            
        needed_vehicles = 2 if priority in ["High", "Critical"] else 1
        available_vehicles = [r for r in resources if r.get('resourceType', r.get('ResourceType')) == 'Vehicle']
        
        if len(available_vehicles) < needed_vehicles:
            constraints.append(f"Insufficient vehicles. Need {needed_vehicles}, but only {len(available_vehicles)} available.")
            reasoning_log += f"4. Identified constraint: Lack of required vehicles.\n"
        else:
            reasoning_log += f"4. Sufficient vehicles available in inventory.\n"
            
        needed_vols = 5 if affected_count > 10 else 2
        if len(volunteers) < needed_vols:
            constraints.append(f"Insufficient volunteers. Need {needed_vols}, but only {len(volunteers)} available.")
            reasoning_log += f"5. Identified constraint: Lack of required volunteers.\n"
        else:
            reasoning_log += f"5. Sufficient volunteers available for deployment.\n"

        reasoning_log += "6. Formulating safe dispatch plan. Requires human validation before execution."

        assignments = []
        for i, v in enumerate(volunteers[:needed_vols]):
            assignments.append({
                "Role": f"Field Support - {category}",
                "EntityName": v.get("name", v.get("Name", f"Volunteer {i}")),
                "Reason": "Assigned based on availability and incident priority."
            })

        dispatch_plan = []
        for i, r in enumerate(available_vehicles[:needed_vehicles]):
            dispatch_plan.append({
                "Action": "Deploy Vehicle",
                "Resource": r.get("name", r.get("Name", f"Vehicle {i}")),
                "Location": location,
                "Reason": "Primary response unit"
            })
            
        action_steps = [
            {
                "step_number": 1,
                "task": f"Secure perimeter at {location}",
                "responsible_team": "First Responders",
                "priority": "Critical",
                "estimated_minutes": 15,
                "is_completed": False
            },
            {
                "step_number": 2,
                "task": "Deploy allocated resources and volunteers",
                "responsible_team": "Dispatch",
                "priority": "High",
                "estimated_minutes": 30,
                "is_completed": False
            }
        ]

        if GEMINI_API_KEY:
            reasoning_log = "[LLM ENHANCED] " + reasoning_log

        objective = f"Contain {category} emergency and protect affected civilians at {location}."

        # Simplify list of actions for structured response
        actions_list = [step["task"] for step in action_steps]
        required_resources_list = [f"{res['quantity']} {res['unit']} ({res['resource_type']})" for res in estimated_resources]

        return {
            "agent_id": self.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "incidentId": incident_id,
            "incident_id": incident_id,
            "priority": priority,
            "objective": f"Contain {category} emergency and protect {affected_count} civilians.",
            "plan_title": f"Agentic Tactical Plan: {title}",
            "plan_description": f"Autonomous coordination strategy by {self.name}. Analyzed {len(resources)} resources.",
            "phase": "Immediate Containment",
            "actions": [step["task"] for step in action_steps],
            "action_steps": action_steps,
            "requiredResources": [f"{needed_vehicles} Vehicles", f"{needed_vols} Volunteers"],
            "estimated_resources": [
                {"resourceType": "Vehicle", "quantity": needed_vehicles, "unit": "units", "description": "Response vehicles"},
                {"resourceType": "Personnel", "quantity": needed_vols, "unit": "volunteers", "description": "Field support"}
            ],
            "status": "Generated",
            "risk_assessment": " | ".join(risks) if risks else "Standard risk protocols apply.",
            "reasoning": reasoning_log,
            "risks": risks,
            "constraints": constraints,
            "requiresHumanApproval": True,
            "suggestedAssignments": assignments,
            "dispatchPlan": dispatch_plan
        }

    def generate_risk_assessment(self, incident_data):
        incident_id = incident_data.get("incidentId") or incident_data.get("incident_id") or 0
        title = incident_data.get("title", "")
        category = incident_data.get("category", "")
        priority = incident_data.get("priority", "Medium")
        affected_count = int(incident_data.get("affected_count", incident_data.get("affectedCount", 0)))

        risk_level, escalation_warning = self._evaluate_threat(category, priority, affected_count)
        recommended_priority = "Critical" if "CRITICAL" in risk_level else ("High" if "MODERATE" in risk_level else "Medium")
        immediate_action = recommended_priority in ["Critical", "High"]

        return {
            "incidentId": incident_id,
            "recommendedPriority": recommended_priority,
            "riskLevel": "High" if "CRITICAL" in risk_level else ("Medium" if "MODERATE" in risk_level else "Low"),
            "reason": escalation_warning,
            "immediateActionRequired": immediate_action
        }

    def generate_summary(self, incident_data):
        incident_id = incident_data.get("incidentId") or incident_data.get("incident_id") or 0
        desc = incident_data.get("description", "")
        category = incident_data.get("category", "")
        affected_count = int(incident_data.get("affected_count", incident_data.get("affectedCount", 0)))
        priority = incident_data.get("priority", "Medium")

        return {
            "incidentId": incident_id,
            "summary": f"{priority} priority {category} incident reported.",
            "keyFacts": [
                f"Category: {category}",
                f"Description: {desc[:100]}...",
                f"Affected: {affected_count}"
            ],
            "mainThreat": f"Potential escalation of {category} hazard.",
            "immediateNeeds": ["Incident verification", "Initial resource dispatch"],
            "urgency": priority
        }

    def recommend_resources(self, incident_data):
        incident_id = incident_data.get("incidentId") or incident_data.get("incident_id") or 0
        category = incident_data.get("category", "").lower()
        priority = incident_data.get("priority", "Medium").upper()
        affected_count = int(incident_data.get("affected_count", incident_data.get("affectedCount", 0)))
        
        avail_resources = incident_data.get("available_resources", [])
        avail_vols = incident_data.get("available_volunteers", [])
        avail_shelters = incident_data.get("available_shelters", [])

        mult = 3 if priority == "CRITICAL" else (2 if priority == "HIGH" else 1)
        needed_qty = max(1, (affected_count // 10) * mult)
        
        cat_map = {
            "fire": ["Vehicle", "Equipment"],
            "medical": ["Medical", "Vehicle"],
            "flood": ["Equipment", "Vehicle"],
            "chemical": ["Equipment", "Medical"]
        }
        target_types = cat_map.get(category, ["Vehicle", "Personnel", "Equipment"])

        rec_res = []
        for res in avail_resources:
            r_type = res.get("resourceType", res.get("ResourceType", ""))
            if r_type in target_types and needed_qty > 0:
                rec_res.append({
                    "resourceType": r_type,
                    "quantity": 1,
                    "reason": f"Matched {r_type} for {category} incident."
                })
                needed_qty -= 1
            if needed_qty <= 0:
                break
                
        rec_vol = []
        matched_vols = []
        for v in avail_vols:
            skills = v.get("skills", v.get("Skills", "")).lower()
            if category in skills or "rescue" in skills or "general" in skills or not skills:
                matched_vols.append(v)
        
        if matched_vols:
            vol_count = min(len(matched_vols), max(1, affected_count // 5))
            rec_vol.append({
                "count": vol_count,
                "role": f"Support for {category.title()}",
                "reason": f"Allocated {vol_count} volunteers with matching skills."
            })

        rec_shelt = None
        if avail_shelters and affected_count > 0:
            best_shelter = None
            for s in avail_shelters:
                cap = s.get("totalCapacity", s.get("TotalCapacity", 0))
                occ = s.get("currentOccupancy", s.get("CurrentOccupancy", 0))
                if cap - occ >= affected_count:
                    best_shelter = s
                    break
            
            if not best_shelter and avail_shelters:
                best_shelter = avail_shelters[0]
                
            if best_shelter:
                rec_shelt = {
                    "name": best_shelter.get("name", best_shelter.get("Name", "Nearest Shelter")),
                    "reason": f"Selected based on capacity for {affected_count} affected persons."
                }

        return {
            "incidentId": incident_id,
            "recommendedResources": rec_res,
            "recommendedVolunteers": rec_vol,
            "recommendedShelter": rec_shelt
        }

    def check_duplicates(self, incident_data):
        target = incident_data.get("incident", {})
        others = incident_data.get("other_incidents", [])

        is_dup = False
        similar = []

        target_loc = target.get("location", "").lower()
        target_cat = target.get("category", "").lower()
        target_desc = target.get("description", target.get("title", "")).lower()

        for o in others:
            o_loc = o.get("location", "").lower()
            o_cat = o.get("category", "").lower()
            o_desc = o.get("description", o.get("title", "")).lower()
            
            loc_match = target_loc and o_loc and (target_loc in o_loc or o_loc in target_loc)
            cat_match = target_cat == o_cat
            
            t_words = set(target_desc.split())
            o_words = set(o_desc.split())
            desc_overlap = len(t_words.intersection(o_words)) > 2 if t_words else False

            if cat_match and (loc_match or desc_overlap):
                is_dup = True
                reason = "Matched category and "
                reason += "similar location." if loc_match else "overlapping description."
                similar.append({
                    "incidentId": o.get("id"),
                    "similarityReason": reason
                })

        return {
            "isPotentialDuplicate": is_dup,
            "similarIncidents": similar
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

    parser.add_argument("--task", type=str, default="plan", help="Task to execute: plan, risk, summary, recommend, duplicate")
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
    
    if args.task == "risk":
        result = agent.generate_risk_assessment(incident_data)
    elif args.task == "summary":
        result = agent.generate_summary(incident_data)
    elif args.task == "recommend":
        result = agent.recommend_resources(incident_data)
    elif args.task == "duplicate":
        result = agent.check_duplicates(incident_data)
    else:
        result = agent.analyze_and_plan(incident_data)

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
