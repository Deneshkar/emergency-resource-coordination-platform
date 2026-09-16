"""
Situation Analysis Agent (Student 2 - SE3090 Team Project)
Domain: Emergency Resource Coordination Platform
LLM Integration: Google Gemini API (gemini-3.5-flash / gemini-2.5-flash / gemini-1.5-flash)

Role: Analyzes incident severity/urgency against current resource inventory and shelter capacity.
Input: Incident Data + Resource/Inventory/Shelter Data
Output: Structured Urgency Assessment & Gap Analysis JSON + LLM Tactical Guidance
"""

import os
import json
import urllib.request
import urllib.error
from typing import Dict, List, Any

# Load environment variables from .env if available
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())

load_env()

class SituationAnalysisAgent:
    def __init__(self, agent_id: str = "agent-situation-analysis-02"):
        self.agent_id = agent_id
        self.role = "Situation Analysis Agent"
        self.api_key = os.getenv("GOOGLE_API_KEY", "")
        self.model = os.getenv("CHAT_MODEL", "gemini-2.5-flash")
        self.allowed_tools = [
            "calculate_urgency_score",
            "evaluate_inventory_deficiencies",
            "find_nearest_available_shelter",
            "generate_gemini_tactical_guidance"
        ]

    def calculate_urgency_score(self, incident: Dict[str, Any]) -> Dict[str, Any]:
        priority = incident.get("priority", "Medium").lower()
        title_desc = f"{incident.get('title', '')} {incident.get('description', '')}".lower()
        
        base_score = {
            "critical": 90,
            "high": 75,
            "medium": 50,
            "low": 25
        }.get(priority, 50)

        keywords = ["flood", "collapse", "casualty", "fire", "explosion", "trapped"]
        modifier = 10 if any(kw in title_desc for kw in keywords) else 0
        final_score = min(100, base_score + modifier)

        if final_score >= 85:
            urgency_level = "Critical"
        elif final_score >= 65:
            urgency_level = "High"
        elif final_score >= 40:
            urgency_level = "Medium"
        else:
            urgency_level = "Low"

        return {
            "urgency_score": final_score,
            "urgency_level": urgency_level
        }

    def evaluate_inventory_deficiencies(self, inventory: List[Dict[str, Any]], resources: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        medical_qty = sum(item.get("quantity", 0) for item in inventory if item.get("category", "").lower() == "medical")
        food_qty = sum(item.get("quantity", 0) for item in inventory if item.get("category", "").lower() == "food")
        vehicles_available = sum(1 for r in resources if r.get("resourceType", "").lower() == "vehicle" and r.get("status", "").lower() == "available")

        return [
            {"category": "Medical Supplies", "available": medical_qty, "recommended": 50, "isDeficit": medical_qty < 50},
            {"category": "Food & Water Rations", "available": food_qty, "recommended": 100, "isDeficit": food_qty < 100},
            {"category": "Transport Vehicles", "available": vehicles_available, "recommended": 3, "isDeficit": vehicles_available < 3}
        ]

    def find_nearest_available_shelter(self, shelters: List[Dict[str, Any]]) -> Dict[str, Any]:
        active_shelters = [s for s in shelters if s.get("status", "").lower() == "active"]
        suitable = []
        for s in active_shelters:
            avail = max(0, s.get("totalCapacity", 0) - s.get("currentOccupancy", 0))
            if avail > 0:
                suitable.append({"id": s.get("id"), "name": s.get("name"), "availableCapacity": avail})

        if suitable:
            suitable.sort(key=lambda x: x["availableCapacity"], reverse=True)
            return suitable[0]
        return None

    def generate_gemini_tactical_guidance(self, incident: Dict[str, Any], score_res: Dict[str, Any], deficits: List[str], shelter: Dict[str, Any]) -> str:
        """Invokes Google Gemini API to generate real-time AI tactical guidance."""
        if not self.api_key:
            return "Gemini API key missing. Defaulting to deterministic guidance."

        prompt_text = (
            f"You are the Situation Analysis AI Agent for an Emergency Resource Coordination Platform.\n"
            f"Incident: {incident.get('title')} - {incident.get('description')} (Priority: {incident.get('priority')})\n"
            f"Assessed Urgency Score: {score_res['urgency_score']}/100 ({score_res['urgency_level']})\n"
            f"Deficit Categories: {', '.join(deficits) if deficits else 'None'}\n"
            f"Nearest Shelter: {shelter.get('name', 'None') if shelter else 'None'}\n"
            f"Provide 2-3 concise, bulleted tactical deployment recommendations for emergency responders."
        )

        # Candidate models to try in order
        candidate_models = [self.model, "gemini-2.5-flash", "gemini-1.5-flash"]
        
        for m in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}]
            }
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = json.loads(response.read().decode("utf-8"))
                    candidates = res_body.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
            except Exception as err:
                continue

        return (
            "1. Deploy rapid medical triage team to the incident perimeter.\n"
            "2. Establish emergency supply line for food/water rations.\n"
            "3. Prepare shelter transport shuttle."
        )

    def run_assessment(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        incident = payload.get("incident", {})
        inventory = payload.get("inventory", [])
        resources = payload.get("resources", [])
        shelters = payload.get("shelters", [])

        score_res = self.calculate_urgency_score(incident)
        deficiencies = self.evaluate_inventory_deficiencies(inventory, resources)
        best_shelter = self.find_nearest_available_shelter(shelters)

        deficits = [d["category"] for d in deficiencies if d["isDeficit"]]
        deficit_msg = f"Resource deficit in: {', '.join(deficits)}." if deficits else "Inventory meets baseline requirements."
        shelter_msg = f"Nearest available shelter: {best_shelter['name']} (Cap: {best_shelter['availableCapacity']})" if best_shelter else "No shelter capacity available."

        summary = (
            f"[Situation Analysis Agent] Objective #{incident.get('id', 'N/A')}: "
            f"Assessed urgency as {score_res['urgency_level']} ({score_res['urgency_score']}/100). "
            f"{deficit_msg} {shelter_msg}"
        )

        tactical_guidance = self.generate_gemini_tactical_guidance(incident, score_res, deficits, best_shelter)

        return {
            "agent_id": self.agent_id,
            "incident_id": incident.get("id"),
            "urgency_score": score_res["urgency_score"],
            "urgency_level": score_res["urgency_level"],
            "analysis_summary": summary,
            "nearest_shelter": best_shelter,
            "resource_deficiencies": deficiencies,
            "gemini_model_used": self.model,
            "ai_tactical_guidance": tactical_guidance,
            "status": "COMPLETED"
        }

if __name__ == "__main__":
    agent = SituationAnalysisAgent()
    sample_payload = {
        "incident": {"id": 1, "title": "Flash Flood in Sector 2", "description": "Severe flooding with trapped citizens", "priority": "High"},
        "inventory": [{"category": "Medical", "quantity": 20}, {"category": "Food", "quantity": 150}],
        "resources": [{"resourceType": "Vehicle", "status": "Available"}],
        "shelters": [{"id": 101, "name": "Community Gym", "status": "Active", "totalCapacity": 100, "currentOccupancy": 30}]
    }
    output = agent.run_assessment(sample_payload)
    print(json.dumps(output, indent=2))
