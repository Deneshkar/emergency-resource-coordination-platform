import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-agents")))
from resource_allocation_agent import ResourceAllocationAgent


class ResourceAllocationTests(unittest.TestCase):
    def test_preserves_planner_requirements_for_high_priority_incident(self):
        result = ResourceAllocationAgent().allocate_for_incident({
            "incident_id": 7, "priority": "High", "affected_count": 30,
            "required_resources": [{"resource_type": "Vehicle", "quantity": 1}],
            "available_resources": [{"id": 4, "resourceType": "Vehicle", "status": "Available"}],
            "available_volunteers": [{"id": "driver", "skill": "Driver", "isAvailable": True}],
        })
        self.assertEqual(result["allocation_plan"]["required_resources"],
                         [{"resource_type": "Vehicle", "quantity": 1}])
        self.assertEqual(result["allocation_plan"]["resource_gaps"], [])

    def test_matches_certified_skills_and_reports_gaps(self):
        result = ResourceAllocationAgent().allocate_for_incident({
            "incident_id": 42,
            "title": "Flood",
            "priority": "Medium",
            "required_resources": [
                {"resource_type": "Medical", "quantity": 1},
                {"resource_type": "Vehicle", "quantity": 1},
            ],
            "available_resources": [
                {"id": 1, "resourceType": "Medical", "status": "Available"},
                {"id": 2, "resourceType": "Vehicle", "status": "Available"},
            ],
            "available_volunteers": [
                {"id": "general", "skill": "General support", "isAvailable": True},
                {"id": "emt", "skill": "Medical EMT", "isAvailable": True},
            ],
        })

        self.assertEqual(result["status"], "COMPLETED")
        self.assertEqual([v["id"] for v in result["allocated_volunteers"]], ["emt"])
        self.assertEqual(result["allocation_plan"]["recommendation"], "REVISE")
        self.assertTrue(any(g.get("kind") == "VolunteerSkill" for g in result["resource_gaps"]))
        self.assertTrue(result["allocation_plan"]["requires_human_approval"])


if __name__ == "__main__":
    unittest.main()
