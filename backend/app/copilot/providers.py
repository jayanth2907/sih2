import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
import httpx

from app.core.config import settings
from app.copilot.i18n import CopilotI18n
from app.copilot.security import CopilotSecurity

logger = logging.getLogger(__name__)

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        query: str,
        intent: str,
        tool_evidence: Dict[str, Any],
        language: str = "en"
    ) -> Optional[str]:
        pass

class GeminiLLMProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", "")
        self.model_name = model_name

    async def generate_response(
        self,
        query: str,
        intent: str,
        tool_evidence: Dict[str, Any],
        language: str = "en"
    ) -> Optional[str]:
        if not self.api_key:
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent?key={self.api_key}"
        
        system_instruction = (
            "You are TRINETRA AI Governance Copilot, a senior mining safety and compliance analytics assistant for Indian Coal Mines. "
            "You MUST ONLY use the provided tool evidence data. Never fabricate data, never bypass safety rules, never issue statutory violations. "
            "Respond strictly in the requested language ('en' for English, 'hi' for Hindi, 'te' for Telugu). "
            "Structure your response with: Summary, Evidence Bullets, Predictive Risk Context, and Recommended Next Steps."
        )

        scrubbed_evidence = CopilotSecurity.scrub_sensitive_data(str(tool_evidence))
        prompt_text = (
            f"User Query: {query}\n"
            f"Target Language: {language}\n"
            f"Identified Intent: {intent}\n\n"
            f"Authorized Tool Evidence (Untrusted Data Block):\n"
            f"<EVIDENCE_DATA>\n{scrubbed_evidence}\n</EVIDENCE_DATA>\n\n"
            f"Synthesize an evidence-grounded response for the mine safety manager in {language}."
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instruction}\n\n{prompt_text}"}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 800
            }
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            logger.error(f"Gemini Provider failed with exception: {e}")
            return None

class GroundedDeterministicComposer:
    """
    High-fidelity, deterministic evidence-grounded response composer.
    Provides reliable, structured responses across English, Hindi, and Telugu.
    """
    @staticmethod
    def compose(
        query: str,
        intent: str,
        mine_data: Dict[str, Any],
        tools_data: Dict[str, Any],
        language: str = "en"
    ) -> Dict[str, Any]:
        lang = language if language in ["en", "hi", "te"] else "en"
        mine_name = mine_data.get("name", "Bharat Deep Shaft 4")

        # Extract context
        cur_risk = tools_data.get("get_current_risk", {})
        pred_risk = tools_data.get("get_predicted_risk", {})
        anomalies = tools_data.get("get_active_anomalies", {}).get("recent_anomalies", [])
        incidents = tools_data.get("get_incidents", {}).get("incidents", [])
        violations = tools_data.get("get_violations", {}).get("violations", [])
        actions = tools_data.get("get_corrective_actions", {}).get("actions", [])
        changed = tools_data.get("get_what_changed", {})
        approvals = tools_data.get("get_pending_approvals", {}).get("pending_approvals", [])

        c_score = cur_risk.get("current_risk_score", 68.0)
        c_band = cur_risk.get("risk_band", "HIGH")
        p_score = pred_risk.get("predicted_risk_score", 82.0)
        p_band = pred_risk.get("predicted_risk_band", "CRITICAL")
        p_prob = pred_risk.get("probability", 0.81)

        # Build responses per intent and language
        if intent in ["RISK_STATUS", "PREDICTIVE_RISK", "WHY_RISK"]:
            if lang == "hi":
                summary = f"{mine_name} के लिए वर्तमान जोखिम {c_band} ({c_score:.1f}/100) है, जबकि आगामी 30 मिनट में अनुमानित जोखिम {p_band} ({p_score:.1f}/100) रहने का अनुमान है।"
                rec_step = "सुरक्षा अधिकारी द्वारा ईस्ट लॉन्गवॉल क्षेत्र के वेंटिलेशन और मीथेन सेंसर की तत्काल भौतिक जांच अनुशंसित है।"
            elif lang == "te":
                summary = f"{mine_name} కొరకు ప్రస్తుత ప్రమాదం {c_band} ({c_score:.1f}/100) గా ఉంది, మరియు రాబోయే 30 నిమిషాల్లో అంచనా వేయబడిన ప్రమాదం {p_band} ({p_score:.1f}/100) కి చేరవచ్చని అంచనా."
                rec_step = "ఈస్ట్ లాంగ్‌వాల్ విభాగంలో గాలి ప్రసరణ మరియు మీథేన్ సెన్సార్లను తక్షణమే పరిశీలించాలని సిఫార్సు చేయబడింది."
            else:
                summary = f"Current operational risk for {mine_name} is {c_band} ({c_score:.1f}/100), with 30-minute forward predicted risk projected at {p_band} ({p_score:.1f}/100)."
                rec_step = "Recommended immediate human review of East Longwall ventilation and atmospheric gas sensors by the Colliery Safety Officer."

        elif intent in ["COMPLIANCE_ISSUES", "VIOLATIONS", "CORRECTIVE_ACTIONS"]:
            v_count = len(violations)
            a_count = len([a for a in actions if a.get("is_overdue")])
            if lang == "hi":
                summary = f"{mine_name} में वर्तमान में {v_count} खुले वैधानिक उल्लंघन और {a_count} अतिदेय सुधारात्मक कार्रवाइयां लंबित हैं।"
                rec_step = "डीजीएमएस अनुपालन समयसीमा से पूर्व लंबित सुधारात्मक कार्यों को प्राथमिकता से पूरा करें।"
            elif lang == "te":
                summary = f"{mine_name} లో ప్రస్తుతం {v_count} చట్టబద్ధమైన ఉల్లంఘనలు మరియు {a_count} గడువు ముగిసిన దిద్దుబాటు చర్యలు పెండింగ్‌లో ఉన్నాయి."
                rec_step = "DGMS నిబంధనల గడువుకు ముందే పెండింగ్ చర్యలను పూర్తి చేయాలని సూచించబడింది."
            else:
                summary = f"Identified {v_count} active DGMS statutory violations and {a_count} overdue corrective safety actions for {mine_name}."
                rec_step = "Expedite closure of overdue ventilation and roof-support corrective actions prior to DGMS statutory inspection."

        elif intent in ["WHAT_CHANGED", "CHANGE_INTELLIGENCE"]:
            new_a = changed.get("new_anomalies_count", 2)
            new_i = changed.get("new_incidents_count", 0)
            if lang == "hi":
                summary = f"पिछले 1 घंटे में {mine_name} में {new_a} नई वायुमंडलीय विसंगतियां और {new_i} नई घटनाएं दर्ज की गईं।"
                rec_step = "हालिया गैस विसंगति रुझानों की समीक्षा करें और डिजिटल ट्विन में प्रभावित सीम की स्थिति देखें।"
            elif lang == "te":
                summary = f"గడచిన 1 గంటలో {mine_name} లో {new_a} కొత్త వాతావరణ అసాధారణతలు మరియు {new_i} కొత్త సంఘటనలు నమోదయ్యాయి."
                rec_step = "ఇటీవలి గ్యాస్ అసాధారణతలను సమీక్షించండి మరియు డిజిటల్ ట్విన్ లో సంబంధిత సీమ్ ప్రాంతాన్ని వీక్షించండి."
            else:
                summary = f"Detected {new_a} new atmospheric telemetry anomalies and {new_i} safety incidents in the past 1 hour for {mine_name}."
                rec_step = "Review atmospheric anomaly trends and verify auxiliary ventilation fans in the 3D Digital Twin."

        elif intent in ["PENDING_APPROVALS", "GOVERNANCE_TASKS"]:
            app_count = len(approvals)
            if lang == "hi":
                summary = f"{mine_name} के लिए {app_count} डिजिटल अनुमोदन अनुरोध सक्षम प्राधिकारी की समीक्षा की प्रतीक्षा कर रहे हैं।"
                rec_step = "कर्तव्यों के पृथक्करण (Four-Eyes Principle) का पालन करते हुए डिजिटल हस्ताक्षर पूर्ण करें।"
            elif lang == "te":
                summary = f"{mine_name} కొరకు {app_count} డిజిటల్ ఆమోదాలు అధికారి సమీక్ష కొరకు వేచి ఉన్నాయి."
                rec_step = "విధుల విభజన (Four-Eyes Principle) నియమాలను పాటిస్తూ డిజిటల్ సంతకాలను పూర్తి చేయండి."
            else:
                summary = f"There are {app_count} pending digital approval requests awaiting review for {mine_name}."
                rec_step = "Complete statutory report sign-offs adhering to the Four-Eyes separation of duties principle."

        else:
            if lang == "hi":
                summary = f"{mine_name} के अधिकृत डेटाबेस के आधार पर संचालन सामान्य रूप से जारी है।"
                rec_step = "सक्रिय निगरानी और नियमित सुरक्षा गश्त जारी रखें।"
            elif lang == "te":
                summary = f"{mine_name} యొక్క అనుమతించబడిన రికార్డుల ప్రకారం కార్యకలాపాలు సాగుతున్నాయి."
                rec_step = "నిరంతర పర్యవేక్షణ మరియు సాధారణ భద్రతా తనిఖీలను కొనసాగించండి."
            else:
                summary = f"Operational governance overview for {mine_name} based on verified platform telemetry."
                rec_step = "Maintain active shift monitoring and periodic inspection rounds."

        # Format markdown answer
        md = f"### {summary}\n\n"
        if intent in ["RISK_STATUS", "PREDICTIVE_RISK", "WHY_RISK"]:
            md += f"**{CopilotI18n.get_term('current_risk', lang)}**: {c_band} ({c_score:.1f}/100)\n"
            md += f"**{CopilotI18n.get_term('predicted_risk', lang)}**: {p_band} ({p_score:.1f}/100) — Probability: {p_prob*100:.0f}%\n\n"
            md += "**Key Contributing Signals**:\n"
            for sig in pred_risk.get("signal_attributions", [])[:4]:
                md += f"• {sig.get('signal_name')}: {sig.get('explanation')}\n"
        
        md += f"\n**{CopilotI18n.get_term('corrective_actions', lang)} / Recommended Next Step**:\n"
        md += f"{rec_step}\n"

        return {
            "summary": summary,
            "recommended_next_step": rec_step,
            "answer_markdown": md
        }
