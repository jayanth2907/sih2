import re
from typing import Dict, List, Any
from app.copilot.schemas import CopilotQuickPrompt

class CopilotI18n:
    LANGUAGES = ["en", "hi", "te"]

    TERMS: Dict[str, Dict[str, str]] = {
        "mine": {"en": "Mine", "hi": "खदान", "te": "గని"},
        "level": {"en": "Seam Level", "hi": "सीम स्तर", "te": "సీమ్ స్థాయి"},
        "zone": {"en": "Spatial Zone", "hi": "स्थानिक क्षेत्र", "te": "ప్రాంతీయ విభాగం"},
        "current_risk": {"en": "Current Operational Risk", "hi": "वर्तमान परिचालन जोखिम", "te": "ప్రస్తుత కార్యాచరణ ప్రమాదం"},
        "predicted_risk": {"en": "Predicted Risk (30-min)", "hi": "अनुमानित जोखिम (30 मिनट)", "te": "అంచనా వేయబడిన ప్రమాదం (30 నిమిషాలు)"},
        "methane": {"en": "Methane (CH4)", "hi": "मीथेन (CH4)", "te": "మీథేన్ (CH4)"},
        "carbon_monoxide": {"en": "Carbon Monoxide (CO)", "hi": "कार्बन मोनोऑक्साइड (CO)", "te": "కార్బన్ మోనాక్సైడ్ (CO)"},
        "ventilation": {"en": "Ventilation Velocity", "hi": "वायुसंचार वेग", "te": "గాలి ప్రసరణ వేగం"},
        "anomalies": {"en": "Atmospheric Anomalies", "hi": "वायुमंडलीय विसंगतियां", "te": "వాతావరణ అసాధారణతలు"},
        "incidents": {"en": "Safety Incidents", "hi": "सुरक्षा घटनाएं", "te": "భద్రతా సంఘటనలు"},
        "violations": {"en": "DGMS Statutory Violations", "hi": "डीजीएमएस वैधानिक उल्लंघन", "te": "DGMS చట్టబద్ధమైన ఉల్లంఘనలు"},
        "corrective_actions": {"en": "Corrective Actions", "hi": "सुधारात्मक कार्रवाइयां", "te": "దిద్దుబాటు చర్యలు"},
        "attendance": {"en": "Shift Muster Roll", "hi": "शिफ्ट मस्टर रोल", "te": "షిఫ్ట్ మస్టర్ రోల్"},
        "production": {"en": "Shift Production Target", "hi": "शिफ्ट उत्पादन लक्ष्य", "te": "షిఫ్ట్ ఉత్పత్తి లక్ష్యం"},
        "grievances": {"en": "Workforce Grievances", "hi": "कार्यबल शिकायतें", "te": "కార్మికుల ఫిర్యాదులు"},
        "approvals": {"en": "Digital Sign-offs", "hi": "डिजिटल अनुमोदन", "te": "డిజిటల్ ఆమోదాలు"},
        "focus_3d": {"en": "FOCUS IN 3D", "hi": "3D में देखें", "te": "3D లో వీక్షించండి"},
        "view_evidence": {"en": "VIEW EVIDENCE", "hi": "साक्ष्य देखें", "te": "సాక్ష్యాలను చూడండి"},
        "view_tasks": {"en": "VIEW GOVERNANCE TASKS", "hi": "प्रशासनिक कार्य देखें", "te": "పరిపాలనా పనులను చూడండి"},
        "view_incidents": {"en": "VIEW INCIDENTS", "hi": "घटनाएं देखें", "te": "సంఘటనలను చూడండి"},
        "view_violations": {"en": "VIEW VIOLATIONS", "hi": "उल्लंघन देखें", "te": "ఉల్లంఘనలను చూడండి"}
    }

    QUICK_PROMPTS: List[CopilotQuickPrompt] = [
        CopilotQuickPrompt(
            id="p1",
            category="Risk Intelligence",
            prompt_en="Which zones have the highest risk and why?",
            prompt_hi="किन क्षेत्रों में सबसे अधिक जोखिम है और क्यों?",
            prompt_te="ఏ ప్రాంతాల్లో అత్యధిక ప్రమాదం ఉంది మరియు ఎందుకు?"
        ),
        CopilotQuickPrompt(
            id="p2",
            category="Predictive Risk",
            prompt_en="Show me the forward 30-minute predicted risk escalation.",
            prompt_hi="मुझे आगामी 30 मिनट का अनुमानित जोखिम रुझान दिखाएं।",
            prompt_te="రాబోయే 30 నిమిషాల అంచనా ప్రమాద ధోరణిని చూపించండి."
        ),
        CopilotQuickPrompt(
            id="p3",
            category="Telemetry",
            prompt_en="What atmospheric anomalies occurred recently?",
            prompt_hi="हाल ही में कौन सी वायुमंडलीय विसंगतियां हुईं?",
            prompt_te="ఇటీవల ఎలాంటి వాతావరణ అసాధారణతలు సంభవించాయి?"
        ),
        CopilotQuickPrompt(
            id="p4",
            category="Compliance",
            prompt_en="Show all overdue safety corrective actions and DGMS violations.",
            prompt_hi="सभी लंबित सुरक्षा सुधारात्मक कार्रवाइयां और डीजीएमएस उल्लंघन दिखाएं।",
            prompt_te="గడువు ముగిసిన భద్రతా చర్యలు మరియు DGMS ఉల్లంఘనలను చూపించండి."
        ),
        CopilotQuickPrompt(
            id="p5",
            category="Change Intelligence",
            prompt_en="What changed in the last hour across this mine?",
            prompt_hi="इस खदान में पिछले एक घंटे में क्या बदलाव आया?",
            prompt_te="గడచిన గంటలో ఈ గనిలో ఏమి మార్పులు జరిగాయి?"
        ),
        CopilotQuickPrompt(
            id="p6",
            category="Governance",
            prompt_en="Which digital sign-offs and approvals are currently pending?",
            prompt_hi="वर्तमान में कौन से डिजिटल अनुमोदन लंबित हैं?",
            prompt_te="ప్రస్తుతం ఏ డిజిటల్ ఆమోదాలు పెండింగ్‌లో ఉన్నాయి?"
        )
    ]

    @staticmethod
    def detect_language(text: str, fallback_lang: str = "en") -> str:
        """Detects if query is written in Hindi (Devanagari) or Telugu, else uses fallback."""
        if not text:
            return fallback_lang
        # Devanagari range: \u0900-\u097F
        if re.search(r"[\u0900-\u097F]", text):
            return "hi"
        # Telugu range: \u0C00-\u0C7F
        if re.search(r"[\u0C00-\u0C7F]", text):
            return "te"
        return fallback_lang if fallback_lang in ["en", "hi", "te"] else "en"

    @staticmethod
    def get_term(key: str, lang: str = "en") -> str:
        lang_key = lang if lang in ["en", "hi", "te"] else "en"
        return CopilotI18n.TERMS.get(key, {}).get(lang_key, key)
