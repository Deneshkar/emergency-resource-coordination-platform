import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-agents")))
from situation_analysis_agent import SituationAnalysisAgent
from coordinator_planner_agent import CoordinatorPlannerAgent
from resource_allocation_agent import ResourceAllocationAgent
from validation_safety_agent import ValidationSafetyAgent


class AgentHandoffTests(unittest.TestCase):
    def test_planner_uses_assessment_and_live_snapshot(self):
        plan = CoordinatorPlannerAgent().analyze_and_plan({
            "incident_id": 21, "title": "Flood", "category": "Flood",
            "priority": "Medium", "affected_count": 3,
            "situation_assessment": {"assessment_id": 9, "urgency_level": "Critical"},
            "resources": [{"id": 4, "resourceType": "Vehicle", "status": "Available"}],
            "volunteers": [{"id": "v", "status": "Available"}],
            "shelters": [{"id": 2, "status": "Active", "totalCapacity": 10,
                          "currentOccupancy": 1}],
        })
        self.assertEqual(plan["situation_assessment_id"], 9)
        self.assertEqual(plan["priority"], "Critical")
        self.assertEqual(plan["nearby_shelter_count"], 1)
        self.assertEqual(plan["tool_calls"], plan["allowed_tools"])

    def test_allocator_preserves_specialists_for_specialist_tasks(self):
        required = [
            {"resource_type": "Personnel", "quantity": 1},
            {"resource_type": "Medical", "quantity": 1},
        ]
        result = ResourceAllocationAgent().allocate_for_incident({
            "incident_id": 5, "required_resources": required,
            "available_resources": [
                {"id": 1, "resourceType": "Personnel", "status": "Available"},
                {"id": 2, "resourceType": "Medical", "status": "Available"}],
            "available_volunteers": [
                {"id": "emt", "skill": "Medical EMT", "isAvailable": True},
                {"id": "general", "skill": "General response", "isAvailable": True}],
        })
        self.assertEqual(result["resource_gaps"], [])
        self.assertEqual({v["id"] for v in result["allocated_volunteers"]},
                         {"emt", "general"})

    def test_evacuations_propose_shelter_and_safety_blocks_overcrowding(self):
        allocation = ResourceAllocationAgent().allocate_for_incident({
            "incident_id": 6, "title": "Evacuate residents", "affected_count": 5,
            "required_resources": [{"resource_type": "Personnel", "quantity": 1}],
            "available_resources": [{"id": 1, "resourceType": "Personnel", "status": "Available"}],
            "available_volunteers": [{"id": "responder", "skill": "General response",
                                      "isAvailable": True}],
            "nearest_shelter": {"id": 8, "available_capacity": 1},
        })
        proposed = allocation["allocation_plan"]["shelter_allocations"]
        self.assertEqual(proposed, [{"shelter_id": 8, "incoming_count": 5}])
        safety = ValidationSafetyAgent().validate_assignment({
            "dispatch_id": 10, "incident_id": 6,
            "assignments": [{"volunteer_id": "responder", "is_available": True}],
            "shelter_allocations": [{"shelter_id": 8, "name": "School", "status": "Active",
                                     "total_capacity": 10, "current_occupancy": 9,
                                     "incoming_count": 5}],
        })
        self.assertFalse(safety["is_valid"])
        self.assertEqual(safety["recommendation"], "REVISE")
        self.assertIn("S2_SHELTER_OVER_ALLOCATION", {v["code"] for v in safety["violations"]})

    def test_unlisted_situation_tool_is_rejected(self):
        with self.assertRaises(ValueError):
            SituationAnalysisAgent().execute_tool("delete_incident", {})

    def test_safety_accepts_emt_as_medical_qualification(self):
        result = ValidationSafetyAgent().validate_assignment({
            "dispatch_id": 4, "incident_id": 2,
            "assignments": [{"volunteer_id": "v", "is_available": True,
                             "skills": "EMT", "required_skill_any": ["medical", "emt", "nurse"]}],
        })
        self.assertEqual(result["recommendation"], "APPROVE")
        self.assertNotIn("W1_SKILL_MISMATCH", {w["code"] for w in result["warnings"]})

    def test_safety_blocks_overlapping_volunteer_shift(self):
        result = ValidationSafetyAgent().validate_assignment({
            "dispatch_id": 10, "incident_id": 2,
            "assignments": [{
                "volunteer_id": "v1", "is_available": True,
                "proposed_shift": {"start": "2026-10-17T10:00:00+00:00",
                                   "end": "2026-10-17T18:00:00+00:00"},
                "existing_shifts": [{"id": "shift-1", "status": "Scheduled",
                                     "start": "2026-10-17T12:00:00+00:00",
                                     "end": "2026-10-17T16:00:00+00:00"}],
            }],
        })
        self.assertEqual(result["recommendation"], "REVISE")
        self.assertIn("V2_DOUBLE_BOOKING", {v["code"] for v in result["violations"]})
        self.assertTrue(any(c["tool"] == "check_shift_overlap" and not c["passed"]
                            for c in result["checks"]))


if __name__ == "__main__":
    unittest.main()
