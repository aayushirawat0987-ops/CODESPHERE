/**
 * UI Localization Dictionary (English & Hindi)
 * --------------------------------------------
 * Provides translations for UI elements, labels, buttons, and patient-friendly guidance.
 */

export const TRANSLATIONS = {
  en: {
    // Header & Global Nav
    appName: "Vitalis",
    appSub: "AI ER & Urgent Care Intake System",
    demoSurge: "⚡ Trigger Demo Surge",
    clearQueue: "🗑️ Clear Queue",
    patientLang: "Patient Language",
    staffLang: "Staff Language",
    modeClinician: "👨‍⚕️ Doctor/Nurse Mode",
    modePatient: "👤 Patient-Friendly Mode",

    // Intake Form
    intakeTitle: "Patient Intake & AI Symptom Evaluation",
    intakeStep: "Step 1: Enter Patient Information",
    demoPresets: "Quick Demo Presets:",
    fullName: "Patient Full Name",
    age: "Age",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    symptomSelector: "⚡ Tap Common Symptoms to Select",
    symptomSelectorHint: "Select all that apply",
    chiefComplaint: "Chief Complaint / What are you feeling?",
    chiefComplaintPlaceholder: "Describe your symptoms in your own words (e.g., severe headache, fever, vomiting)...",
    painScale: "Self-Reported Pain Scale (1 - 10)",
    painMild: "🟢 Mild Pain",
    painModerate: "🟡 Moderate Pain",
    painSevere: "🔴 Severe Pain",
    clinicalHistory: "Medical History (Optional)",
    comorbidities: "Existing Medical Conditions",
    allergies: "Known Allergies",
    medications: "Active Medications",
    vitalsTitle: "Vital Signs (Optional)",
    heartRate: "Heart Rate (bpm)",
    temp: "Temperature (°F)",
    bloodPressure: "Blood Pressure",
    submitBtn: "⚡ Evaluate & Submit Intake",
    analyzing: "Analyzing symptoms with AI...",

    // Dashboard
    commandCenter: "HOSPITAL COMMAND CENTER & TRIAGE QUEUE",
    liveSurveillance: "Live ER Surveillance • Auto-refresh active",
    patientsToday: "Patients Today",
    criticalCases: "Critical Cases",
    queueWaiting: "Queue Waiting",
    avgWaitTime: "Avg Wait Time",
    searchPlaceholder: "Search by patient name, ID (#), or symptoms...",
    allPatients: "All Patients",
    priority1: "🚨 PRIORITY 1 - IMMEDIATE",
    estimatedWait: "est. wait",
    chiefComplaintLabel: "Chief Complaint:",
    symptomsLabel: "Observed Symptoms:",
    aiObservationsLabel: "AI Clinical Observations:",
    redFlagsLabel: "🚩 Red Flags:",
    rationaleLabel: "🧠 Clinical Rationale:",
    fullProfile: "👤 Full Profile",
    report: "🖨️ Report",
    override: "⚡ Override",
    editScore: "✏️ Edit Score",
    noPatientsMatch: "No Patients Match Filter",

    // Patient Friendly View Cards
    patientViewBanner: "YOUR PERSONALIZED HEALTH SUMMARY",
    whatAiNoticed: "What We Observed:",
    whatYouShouldDo: "What You Should Do Next:",
    listenAudio: "🔊 Listen to Summary (Audio)",
    speaking: "🔊 Speaking...",
    reassuringNote: "Don't panic. Our medical team is ready to help you.",
    visitEmergencyImmediately: "Please visit the emergency department as soon as possible.",

    // Modals
    close: "Close",
    printReport: "🖨️ Print Report",
    patientSummaryReport: "📄 Patient Health Summary",
    officialClinicalReport: "📄 Official Medical Triage Report",
    patientViewTab: "👤 Patient Summary (Simple)",
    clinicalViewTab: "👨‍⚕️ Clinical Details (Doctor)",

    // Voice & Face
    voiceTitle: "Hands-Free Voice Symptom Intake",
    voiceSubtitle: "Speak naturally in your preferred language to record symptoms.",
    startRecord: "🎙️ Start Voice Recording",
    stopRecord: "⏹️ Stop & Analyze",
    faceTitle: "AI Facial Visual Diagnostic Scanner",
    faceSubtitle: "Analyzes 8 visual observations including pain expression, asymmetry, and cyanosis.",
    analyzeFace: "🔍 Analyze Facial Features",
  },

  hi: {
    // Header & Global Nav
    appName: "वाइटालिस",
    appSub: "एआई आपातकालीन अस्पताल सेवन प्रणाली",
    demoSurge: "⚡ सिमुलेशन शुरू करें",
    clearQueue: "🗑️ सूची साफ़ करें",
    patientLang: "मरीज़ की भाषा",
    staffLang: "डॉक्टर/नर्स की भाषा",
    modeClinician: "👨‍⚕️ डॉक्टर/नर्स मोड",
    modePatient: "👤 सरल मरीज़ मोड",

    // Intake Form
    intakeTitle: "मरीज़ पंजीकरण और लक्षण मूल्यांकन",
    intakeStep: "चरण 1: मरीज़ की जानकारी दर्ज करें",
    demoPresets: "त्वरित उदाहरण चुनें:",
    fullName: "मरीज़ का पूरा नाम",
    age: "उम्र",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    symptomSelector: "⚡ अपने लक्षण चुनें (टैप करें)",
    symptomSelectorHint: "सभी लागू लक्षण चुनें",
    chiefComplaint: "मुख्य लक्षण / आप कैसा महसूस कर रहे हैं?",
    chiefComplaintPlaceholder: "अपने शब्दों में अपने लक्षण बताएं (जैसे: तेज़ सिरदर्द, बुखार, उल्टी आना)...",
    painScale: "दर्द का स्तर (1 - 10)",
    painMild: "🟢 हल्का दर्द",
    painModerate: "🟡 मध्यम दर्द",
    painSevere: "🔴 तेज़ / गंभीर दर्द",
    clinicalHistory: "चिकित्सा इतिहास (वैकल्पिक)",
    comorbidities: "मौजूदा बीमारियां",
    allergies: "एलर्जी",
    medications: "दवाइयां",
    vitalsTitle: "शारीरिक स्थिति / वाइटल्स (वैकल्पिक)",
    heartRate: "दिल की धड़कन (bpm)",
    temp: "शरीर का तापमान (°F)",
    bloodPressure: "ब्लड प्रेशर (रक्तचाप)",
    submitBtn: "⚡ जांच करें और जमा करें",
    analyzing: "एआई द्वारा लक्षणों की जांच हो रही है...",

    // Dashboard
    commandCenter: "अस्पताल आपातकालीन कमांड सेंटर",
    liveSurveillance: "लाइव निगरानी चालू है",
    patientsToday: "आज के कुल मरीज़",
    criticalCases: "गंभीर मामले",
    queueWaiting: "प्रतीक्षा सूची",
    avgWaitTime: "औसत प्रतीक्षा समय",
    searchPlaceholder: "मरीज़ के नाम या लक्षणों से खोजें...",
    allPatients: "सभी मरीज़",
    priority1: "🚨 प्राथमिकता 1 - तुरंत इलाज",
    estimatedWait: "अनुमानित प्रतीक्षा",
    chiefComplaintLabel: "मुख्य समस्या:",
    symptomsLabel: "देखे गए लक्षण:",
    aiObservationsLabel: "एआई निष्कर्ष:",
    redFlagsLabel: "🚩 मुख्य चेतावनी संकेत:",
    rationaleLabel: "🧠 चिकित्सकीय विश्लेषण:",
    fullProfile: "👤 पूरी प्रोफ़ाइल",
    report: "🖨️ रिपोर्ट",
    override: "⚡ बदलाव करें",
    editScore: "✏️ स्कोर बदलें",
    noPatientsMatch: "कोई मरीज़ नहीं मिला",

    // Patient Friendly View Cards
    patientViewBanner: "आपकी स्वास्थ्य संबंधी आसान जानकारी",
    whatAiNoticed: "हमने क्या देखा:",
    whatYouShouldDo: "अब आपको क्या करना चाहिए:",
    listenAudio: "🔊 बोलकर सुनें (ऑडियो)",
    speaking: "🔊 आवाज़ चालू है...",
    reassuringNote: "घबराएं नहीं। हमारी डॉक्टरों की टीम आपकी मदद के लिए तैयार है।",
    visitEmergencyImmediately: "कृपया जल्द से जल्द अस्पताल के आपातकालीन (इमरजेंसी) विभाग में जाएं।",

    // Modals
    close: "बंद करें",
    printReport: "🖨️ प्रिंट रिपोर्ट",
    patientSummaryReport: "📄 आसान मरीज़ स्वास्थ्य रिपोर्ट",
    officialClinicalReport: "📄 आधिकारिक मेडिकल रिपोर्ट",
    patientViewTab: "👤 आसान मरीज़ विवरण",
    clinicalViewTab: "👨‍⚕️ डॉक्टर/नर्स मेडिकल विवरण",

    // Voice & Face
    voiceTitle: "आवाज़ द्वारा लक्षण रिकॉर्डिंग",
    voiceSubtitle: "अपनी भाषा में बोलकर अपने लक्षण दर्ज करें।",
    startRecord: "🎙️ बोलकर रिकॉर्ड करें",
    stopRecord: "⏹️ रोकें और जांचें",
    faceTitle: "चेहरा और दृष्टि स्कैन एआई",
    faceSubtitle: "चेहरे के दर्द, सूजन और असमानता का विश्लेषण करता है।",
    analyzeFace: "🔍 चेहरे की जांच करें",
  }
};

/**
 * Text-to-Speech (TTS) Helper for English & Hindi
 */
export function speakText(text, lang = 'en') {
  if (!window.speechSynthesis) {
    alert("Voice speech synthesis is not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel(); // Stop any previous speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9; // Slightly calmer, slower pace for clarity
  utterance.pitch = 1.0;

  if (lang === 'hi') {
    utterance.lang = 'hi-IN';
  } else {
    utterance.lang = 'en-US';
  }

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en'));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
}
