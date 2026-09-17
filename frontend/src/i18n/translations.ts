export type SupportedLanguage = 'en' | 'hi' | 'te';

export interface Translations {
  appName: string;
  appSubtitle: string;
  liveDashboard: string;
  aiRiskIntelligence: string;
  aiCopilot: string;
  operationalAlerts: string;
  productionLogs: string;
  workforceMuster: string;
  contractorsSla: string;
  atmosphereEnv: string;
  sensorsTelemetry: string;
  minesLevels: string;
  cctvMachinery: string;
  safetyIncidents: string;
  dgmsViolations: string;
  grievanceRedressal: string;
  statutoryReports: string;
  digitalSignoffs: string;
  spatialTwin: string;
  riskAuditTrail: string;
  currentRisk: string;
  predictedRisk: string;
  horizon: string;
  probability: string;
  focusIn3D: string;
  viewEvidence: string;
  viewTasks: string;
  viewViolations: string;
  viewIncidents: string;
  askCopilotPlaceholder: string;
  sendQuery: string;
  clearChat: string;
  quickActions: string;
  dataProvenance: string;
  evidenceSignals: string;
  recommendedAction: string;
  insufficientData: string;
  systemNormal: string;
  criticalAlert: string;
  warningAlert: string;
  fieldOperations: string;
  startInspection: string;
  reportIncident: string;
  recordObservation: string;
  captureEvidence: string;
  syncQueue: string;
  syncNow: string;
  onlineStatus: string;
  offlineStatus: string;
  syncingStatus: string;
  pendingSyncCount: string;
  gpsAccuracy: string;
  sha256Hash: string;
  integrationsHealth: string;
  auditIntegrity: string;
  circuitBreaker: string;
  sourceProvenance: string;
  demoControlCenter: string;
  languageSelect: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'TRINETRA',
    appSubtitle: 'Mine Governance AI',
    liveDashboard: 'Live Dashboard',
    demoControlCenter: 'Demo Control Center',
    aiRiskIntelligence: 'AI Risk Intelligence',
    aiCopilot: 'AI Governance Copilot',
    fieldOperations: 'Field Operations',
    integrationsHealth: 'Integrations & Health',
    auditIntegrity: 'Cryptographic Audit Integrity',
    circuitBreaker: 'Circuit Breaker',
    sourceProvenance: 'Source Provenance',
    startInspection: 'Start Inspection',
    reportIncident: 'Report Incident',
    recordObservation: 'Record Observation',
    captureEvidence: 'Capture Evidence',
    syncQueue: 'Sync Queue',
    syncNow: 'Sync Now',
    onlineStatus: 'ONLINE',
    offlineStatus: 'OFFLINE (Local Queue Active)',
    syncingStatus: 'SYNCING...',
    pendingSyncCount: 'Pending Synchronization',
    gpsAccuracy: 'GPS Accuracy',
    sha256Hash: 'SHA-256 Evidence Hash',
    operationalAlerts: 'Operational Alerts',
    productionLogs: 'Production Logs',
    workforceMuster: 'Workforce & Muster',
    contractorsSla: 'Contractors & SLA',
    atmosphereEnv: 'Atmosphere & Env',
    sensorsTelemetry: 'Sensors & Telemetry',
    minesLevels: 'Mines & Levels',
    cctvMachinery: 'CCTV & Machinery',
    safetyIncidents: 'Safety Incidents',
    dgmsViolations: 'DGMS Violations',
    grievanceRedressal: 'Grievance Redressal',
    statutoryReports: 'Statutory Reports',
    digitalSignoffs: 'Digital Sign-offs',
    spatialTwin: '3D Spatial Twin',
    riskAuditTrail: 'Risk & Audit Trail',
    currentRisk: 'Current Operational Risk',
    predictedRisk: 'Predicted Risk (30m)',
    horizon: 'Prediction Horizon',
    probability: 'Escalation Probability',
    focusIn3D: 'FOCUS IN 3D',
    viewEvidence: 'VIEW EVIDENCE',
    viewTasks: 'VIEW GOVERNANCE TASKS',
    viewViolations: 'VIEW VIOLATIONS',
    viewIncidents: 'VIEW INCIDENTS',
    askCopilotPlaceholder: 'Ask a governance or safety question about your authorized mine data...',
    sendQuery: 'Send Query',
    clearChat: 'Clear History',
    quickActions: 'Quick Governance Queries',
    dataProvenance: 'Data Source: REAL BACKEND DATA | SIMULATED TELEMETRY',
    evidenceSignals: 'Grounding Evidence & Observed Signals',
    recommendedAction: 'Recommended Statutory Next Step',
    insufficientData: 'Insufficient telemetry data to generate reliable prediction.',
    systemNormal: 'All parameters within DGMS statutory limits.',
    criticalAlert: 'CRITICAL ESCALATION',
    warningAlert: 'STATUTORY WARNING',
    languageSelect: 'Language'
  },
  hi: {
    appName: 'त्रिनेत्र (TRINETRA)',
    appSubtitle: 'खदान प्रशासन एवं सुरक्षा AI',
    liveDashboard: 'लाइव डैशबोर्ड',
    demoControlCenter: 'डेमो कंट्रोल सेंटर',
    aiRiskIntelligence: 'AI जोखिम विश्लेषण',
    aiCopilot: 'AI गवर्नेंस कोपायलट',
    fieldOperations: 'फील्ड ऑपरेशन्स',
    integrationsHealth: 'एकीकरण एवं स्वास्थ्य',
    auditIntegrity: 'क्रिप्टोग्राफिक ऑडिट अखंडता',
    circuitBreaker: 'सर्किट ब्रेकर',
    sourceProvenance: 'स्रोत प्रमाणिकता',
    startInspection: 'निरीक्षण शुरू करें',
    reportIncident: 'घटना दर्ज करें',
    recordObservation: 'अवलोकन दर्ज करें',
    captureEvidence: 'साक्ष्य कैप्चर करें',
    syncQueue: 'सिंक कतार',
    syncNow: 'अभी सिंक करें',
    onlineStatus: 'ऑनलाइन',
    offlineStatus: 'ऑफलाइन (स्थानीय कतार सक्रिय)',
    syncingStatus: 'सिंक्रनाइज़ हो रहा है...',
    pendingSyncCount: 'लंबित सिंक्रनाइज़ेशन',
    gpsAccuracy: 'जीपीएस सटीकता',
    sha256Hash: 'SHA-256 साक्ष्य हैश',
    operationalAlerts: 'परिचालन चेतावनियां',
    productionLogs: 'उत्पादन विवरण',
    workforceMuster: 'कार्यबल एवं उपस्थिति',
    contractorsSla: 'ठेकेदार एवं SLA',
    atmosphereEnv: 'पर्यावरण एवं गैस निगरानी',
    sensorsTelemetry: 'सेंसर एवं टेलीमेट्री',
    minesLevels: 'खदानें एवं सीम स्तर',
    cctvMachinery: 'CCTV एवं भारी मशीनरी',
    safetyIncidents: 'सुरक्षा घटनाएं',
    dgmsViolations: 'DGMS वैधानिक उल्लंघन',
    grievanceRedressal: 'शिकायत निवारण',
    statutoryReports: 'वैधानिक रिपोर्ट',
    digitalSignoffs: 'डिजिटल अनुमोदन',
    spatialTwin: '3D स्थानिक डिजिटल ट्विन',
    riskAuditTrail: 'जोखिम एवं ऑडिट ट्रेल',
    currentRisk: 'वर्तमान परिचालन जोखिम',
    predictedRisk: 'अनुमानित जोखिम (30 मिनट)',
    horizon: 'पूर्वानुमान समय-सीमा',
    probability: 'वृद्धि की संभावना',
    focusIn3D: '3D में देखें',
    viewEvidence: 'साक्ष्य देखें',
    viewTasks: 'प्रशासनिक कार्य देखें',
    viewViolations: 'उल्लंघन देखें',
    viewIncidents: 'घटनाएं देखें',
    askCopilotPlaceholder: 'अपनी अधिकृत खदान से संबंधित सुरक्षा या प्रशासनिक प्रश्न पूछें...',
    sendQuery: 'प्रश्न भेजें',
    clearChat: 'इतिहास साफ करें',
    quickActions: 'त्वरित प्रशासनिक प्रश्न',
    dataProvenance: 'डेटा स्रोत: वास्तविक बैकएंड डेटा | सिम्युलेटेड टेलीमेट्री',
    evidenceSignals: 'सत्यापित साक्ष्य एवं संकेत',
    recommendedAction: 'अनुशंसित वैधानिक आगामी कदम',
    insufficientData: 'विश्वसनीय पूर्वानुमान के लिए अपर्याप्त डेटा।',
    systemNormal: 'सभी पैरामीटर DGMS वैधानिक सीमा में हैं।',
    criticalAlert: 'गंभीर जोखिम चेतावनी',
    warningAlert: 'वैधानिक चेतावनी',
    languageSelect: 'भाषा'
  },
  te: {
    appName: 'త్రినేత్ర (TRINETRA)',
    appSubtitle: 'గనుల పరిపాలన & భద్రత AI',
    liveDashboard: 'లైవ్ డాష్‌బోర్డ్',
    demoControlCenter: 'డెమో కంట్రోల్ సెంటర్',
    aiRiskIntelligence: 'AI ప్రమాద విశ్లేషణ',
    aiCopilot: 'AI గవర్నెన్స్ కోపైలట్',
    fieldOperations: 'ఫీల్డ్ ఆపరేషన్స్',
    integrationsHealth: 'ఇంటిగ్రేషన్లు & ఆరోగ్యం',
    auditIntegrity: 'క్రిప్టోగ్రాఫిక్ ఆడిట్ సమగ్రత',
    circuitBreaker: 'సర్క్యూట్ బ్రేకర్',
    sourceProvenance: 'మూల ప్రామాణికత',
    startInspection: 'తనిఖీ ప్రారంభించండి',
    reportIncident: 'సంఘటన నమోదు చేయండి',
    recordObservation: 'పరిశీలన నమోదు చేయండి',
    captureEvidence: 'సాక్ష్యాలను సేకరించండి',
    syncQueue: 'సింక్ క్యూ',
    syncNow: 'ఇప్పుడే సింక్ చేయండి',
    onlineStatus: 'ఆన్‌లైన్',
    offlineStatus: 'ఆఫ్‌లైన్ (లోకల్ క్యూ యాక్టివ్)',
    syncingStatus: 'సింక్ అవుతోంది...',
    pendingSyncCount: 'పెండింగ్ సింక్రొనైజేషన్',
    gpsAccuracy: 'జీపీఎస్ ఖచ్చితత్వం',
    sha256Hash: 'SHA-256 సాక్ష్య హ్యాష్',
    operationalAlerts: 'కార్యాచరణ హెచ్చరికలు',
    productionLogs: 'ఉత్పత్తి వివరాలు',
    workforceMuster: 'కార్మికులు & హాజరు',
    contractorsSla: 'కాంట్రాక్టర్లు & SLA',
    atmosphereEnv: 'వాతావరణం & పర్యావరణం',
    sensorsTelemetry: 'సెన్సార్లు & టెలిమెట్రీ',
    minesLevels: 'గనులు & స్థాయిలు',
    cctvMachinery: 'CCTV & యంత్రాలు',
    safetyIncidents: 'భద్రతా సంఘటనలు',
    dgmsViolations: 'DGMS చట్టబద్ధ ఉల్లంఘనలు',
    grievanceRedressal: 'ఫిర్యాదుల పరిష్కారం',
    statutoryReports: 'చట్టబద్ధ నివేదికలు',
    digitalSignoffs: 'డిజిటల్ ఆమోదాలు',
    spatialTwin: '3D డిజిటల్ ట్విన్',
    riskAuditTrail: 'ప్రమాద & ఆడిట్ చరిత్ర',
    currentRisk: 'ప్రస్తుత కార్యాచరణ ప్రమాదం',
    predictedRisk: 'అంచనా వేసిన ప్రమాదం (30ని)',
    horizon: 'అంచనా సమయ పరిమితి',
    probability: 'పెరిగే సంభావ్యత',
    focusIn3D: '3D లో వీక్షించండి',
    viewEvidence: 'సాక్ష్యాలను చూడండి',
    viewTasks: 'పరిపాలనా పనులను చూడండి',
    viewViolations: 'ఉల్లంఘనలను చూడండి',
    viewIncidents: 'సంఘటనలను చూడండి',
    askCopilotPlaceholder: 'మీ గని సమాచారం మరియు భద్రతపై ప్రశ్న అడగండి...',
    sendQuery: 'ప్రశ్న పంపండి',
    clearChat: 'చరిత్ర తొలగించండి',
    quickActions: 'త్వరిత పరిపాలనా ప్రశ్నలు',
    dataProvenance: 'డేటా మూలం: వాస్తవ బ్యాకెండ్ డేటా | సిమ్యులేటెడ్ టెలిమెట్రీ',
    evidenceSignals: 'నిరూపిత సాక్ష్యాలు & సంకేతాలు',
    recommendedAction: 'సిఫార్సు చేయబడిన తదుపరి చర్య',
    insufficientData: 'ఖచ్చితమైన అంచనాకు సరిపడా డేటా లేదు.',
    systemNormal: 'అన్ని పారామితులు చట్టబద్ధమైన పరిమితుల్లో ఉన్నాయి.',
    criticalAlert: 'తీవ్ర హెచ్చరిక',
    warningAlert: 'చట్టబద్ధ హెచ్చరిక',
    languageSelect: 'భాష'
  }
};
