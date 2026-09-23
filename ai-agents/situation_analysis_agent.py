"""
Situation Analysis Agent (Student 2 - SE3090 Team Project)
Domain: Emergency Resource Coordination Platform

Role: Analyzes incident severity/urgency against current resource inventory and shelter capacity.
Input: Incident Data + Resource/Inventory/Shelter Data
Output: Structured Urgency Assessment & Gap Analysis JSON
"""

import json
import os
import urllib.request
import urllib.error
from typing import Dict, List, Any


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

class SituationAnalysisAgent:
    def __init__(self, agent_id: str = "agent-situation-analysis-02"):
        self.agent_id = agent_id
        self.role = "Situation Analysis Agent"
        self.allowed_tools = [
            "calculate_urgency_score",
            "evaluate_inventory_deficiencies",
            "find_nearest_available_shelter"
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

        llm_enhanced = False

        if GEMINI_API_KEY:
            try:
                # LLM Integration
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={GEMINI_API_KEY}"
                
                prompt = (
                    f"Analyze this emergency incident: {incident.get('title')} - {incident.get('description')}. "
                    f"Priority reported: {incident.get('priority')}. "
                    "Return ONLY a valid JSON object with: "
                    "'urgency_score' (integer 0-100), "
                    "'urgency_level' (string: Critical, High, Medium, Low), "
                    "'ai_insight' (a short 1-sentence tactical summary)."
                )
                
                payload = json.dumps({
                    "contents": [{"parts": [{"text": prompt}]}]
                }).encode('utf-8')
                
                req = urllib.request.Request(url, data=payload, headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    res_body = response.read().decode('utf-8')
                    res_json = json.loads(res_body)
                    text_content = res_json['candidates'][0]['content']['parts'][0]['text']
                    
                    # Clean markdown code blocks if any
                    if text_content.startswith('```json'):
                        text_content = text_content[7:-3]
                    elif text_content.startswith('```'):
                        text_content = text_content[3:-3]
                        
                    llm_data = json.loads(text_content.strip())
                    
                    score_res["urgency_score"] = llm_data.get("urgency_score", score_res["urgency_score"])
                    score_res["urgency_level"] = llm_data.get("urgency_level", score_res["urgency_level"])
                    summary = f"[LLM ENHANCED] AI Insight: {llm_data.get('ai_insight', 'Analyzed.')} " + summary
                    llm_enhanced = True
            except Exception as e:
                # Fallback to deterministic logic on any failure
                print(f"[Warning] Gemini API failed, falling back to deterministic rules. Error: {e}")

        return {
            "agent_id": self.agent_id,
            "incident_id": incident.get("id"),
            "urgency_score": score_res["urgency_score"],
            "urgency_level": score_res["urgency_level"],
            "analysis_summary": summary,
            "nearest_shelter": best_shelter,
            "resource_deficiencies": deficiencies,
            "llm_enhanced": llm_enhanced,
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
