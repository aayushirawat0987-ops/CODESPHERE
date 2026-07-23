/**
 * Multilingual Voice Symptom Map Dataset
 * ---------------------------------------
 * Multi-language keyword mapping supporting English, Spanish, Hindi, French,
 * German, Chinese, Arabic, Russian, Portuguese, Italian, Japanese, and Korean.
 */

const VOICE_SYMPTOM_MAP = [
  {
    keywords: [
      "chest pain", "heart", "cardiac", "heart attack", "myocardial",
      "dolor de pecho", "corazón", "ataque al corazón",
      "छाती में दर्द", "दिल का दौरा", "हार्ट अटैक",
      "douleur thoracique", "coeur", "crise cardiaque",
      "brustschmerzen", "herzinfarkt", "herz",
      "胸痛", "心脏病", "心肌梗塞",
      "ألم في الصدر", "نوبة قلبية", "قلب",
      "боль в груди", "инфаркт", "сердце",
      "dor no peito", "coração", "ataque cardíaco",
      "dolore al petto", "attacco di cuore",
      "胸の痛み", "心臓発作",
      "가슴 통증", "심장 마비"
    ],
    problem: "Possible Cardiac Event",
    severity: "Critical",
    score: 10,
    recs: ["Immediate ECG", "Cardiac enzyme panel", "Call cardiologist"]
  },
  {
    keywords: [
      "can't breathe", "difficulty breathing", "shortness of breath", "choking", "asthma", "respiratory",
      "no puedo respirar", "falta de aire", "asfixia", "asma",
      "सांस लेने में तकलीफ", "दम घुटना", "सांस फूलना", "अस्थमा",
      "difficulté à respirer", "essoufflement", "étouffement", "asthme",
      "atemnot", "schwer atmen", "erstickung", "asthma",
      "呼吸困难", "气短", "窒息", "哮喘",
      "صعوبة في التنفس", "ضيق في التنفس", "اختناق", "ربو",
      "трудно дышать", "одышка", "удушье", "астма",
      "dificuldade para respirar", "falta de ar", "falta de ar", "asma",
      "difficoltà a respirare", "affanno", "asma",
      "呼吸困難", "息切れ", "ぜんそく",
      "숨이 차다", "호흡 곤란", "천식"
    ],
    problem: "Respiratory Distress",
    severity: "Critical",
    score: 9,
    recs: ["Check SpO2", "Administer O2", "Prep bronchodilator"]
  },
  {
    keywords: [
      "stroke", "can't speak", "face drooping", "numbness", "paralysis", "slurred",
      "derrame", "ictus", "no puedo hablar", "parálisis", "cara caída",
      "स्ट्रोक", "लकवा", "बोलने में दिक्कत", "मुंह टेढ़ा",
      "accident vasculaire", "avc", "paralysie", "visage affaissé",
      "schlaganfall", "lähmung", "sprachstörung",
      "中风", "面瘫", "无法说话", "麻木",
      "سكتة دماغية", "شلل", "صعوبة في الكلام",
      "инсульт", "паралич", "онемение",
      "avc", "derrame", "paralisia", "dificuldade de falar",
      "ictus", "paralisi", "difficoltà a parlare",
      "脳卒中", "麻痺", "しゃべれない",
      "뇌졸중", "마비", "말이 어눌함"
    ],
    problem: "Possible Stroke / Neurological Event",
    severity: "Critical",
    score: 10,
    recs: ["FAST assessment", "Immediate CT scan", "Neurology consult"]
  },
  {
    keywords: [
      "unconscious", "unresponsive", "fainted", "collapsed", "not waking",
      "inconsciente", "desmayado", "no responde",
      "बेहोश", "गिर पड़ा", "होश नहीं",
      "inconscient", "évanoui", "sans réponse",
      "bewusstlos", "ohnmächtig", "zusammengebrochen",
      "昏迷", "晕倒", "无反应",
      "فقدان الوعي", "إغماء", "لا يستجيب",
      "без сознания", "обморок", "упал",
      "inconsciente", "desmaiou", "sem resposta",
      "svenuto", "inconsciente",
      "気失った", "意識不明",
      "의식 불명", "기절"
    ],
    problem: "Loss of Consciousness",
    severity: "Critical",
    score: 10,
    recs: ["Check airway", "GCS assessment", "IV access"]
  },
  {
    keywords: [
      "severe pain", "unbearable pain", "pain 10", "excruciating",
      "dolor severo", "dolor insoportable", "mucho dolor",
      "गंभीर दर्द", "असहनीय दर्द", "बहुत तेज दर्द",
      "douleur intense", "douleur insupportable",
      "starke schmerzen", "unerträgliche schmerzen",
      "剧痛", "严重疼痛", "无法忍受",
      "ألم شديد", "ألم لا يطاق",
      "сильная боль", "невыносимая боль",
      "dor intensa", "dor insuportável",
      "dolore severo", "dolore insopportabile",
      "激しい痛み", "耐えられない痛み",
      "심한 통증", "극심한 통증"
    ],
    problem: "Severe Pain Management",
    severity: "High",
    score: 8,
    recs: ["Pain scale assessment", "Analgesic protocol", "Identify source"]
  },
  {
    keywords: [
      "bleeding", "hemorrhage", "blood loss", "wound", "laceration",
      "sangrado", "hemorragia", "sangre", "herida",
      "खून बहना", "रक्तस्राव", "चोट", "घाव",
      "saignement", "hémorragie", "perte de sang",
      "blutung", "blutverlust", "wunde",
      "出血", "流血", "伤口",
      "نزيف", "فقدان الدم", "جرح",
      "кровотечение", "потеря крови", "раны",
      "sangramento", "hemorragia", "sangue",
      "sanguinamento", "emorragia",
      "出血", "怪我",
      "출혈", "피가 나다"
    ],
    problem: "Active Hemorrhage / Trauma",
    severity: "High",
    score: 8,
    recs: ["Apply pressure", "Blood type & cross", "Surgical consult"]
  },
  {
    keywords: [
      "fever", "high temperature", "burning up", "chills", "sweating", "infection",
      "fiebre", "temperatura alta", "escalofríos", "infección",
      "बुखार", "तेज बुखार", "ठंड लगना", "संक्रमण",
      "fièvre", "frissons", "température élevée", "infection",
      "fieber", "hohe temperatur", "schüttelfrost", "infektion",
      "发烧", "高烧", "发冷", "感染",
      "حمى", "ارتفاع الحرارة", "قشعريرة", "التهاب",
      "температура", "лихорадка", "озноб", "инфекция",
      "febre", "temperatura alta", "calafrios", "infecção",
      "febbre", "brividi", "infezione",
      "発熱", "熱がある", "寒気",
      "열이 나다", "고열", "오한"
    ],
    problem: "Fever / Possible Infection",
    severity: "Moderate",
    score: 6,
    recs: ["Temperature check", "CBC & culture", "Antipyretics"]
  },
  {
    keywords: [
      "vomiting", "nausea", "throwing up", "stomach", "abdominal pain", "belly pain",
      "vómito", "náuseas", "dolor de estómago", "dolor abdominal",
      "उल्टी", "पेट दर्द", "जी मिचलाना",
      "vomissement", "nausée", "mal de ventre", "douleur abdominale",
      "erbrechen", "übelkeit", "bauchschmerzen",
      "呕吐", "恶心", "腹痛", "胃痛",
      "قيء", "غثيان", "ألم في البطن", "مغص",
      "рвота", "тошнота", "боль в животе",
      "vômito", "náusea", "dor de barriga", "dor abdominal",
      "vomito", "nausea", "mal di pancia",
      "吐き気", "嘔吐", "腹痛",
      "구토", "메스꺼움", "복통"
    ],
    problem: "Gastrointestinal Distress",
    severity: "Moderate",
    score: 5,
    recs: ["Abdominal exam", "Fluid balance", "GI workup if persistent"]
  },
  {
    keywords: [
      "headache", "migraine", "head pain", "pounding head",
      "dolor de cabeza", "migraña",
      "सिरदर्द", "माईग्रेन", "सिर में दर्द",
      "mal de tête", "migraine",
      "kopfschmerzen", "migräne",
      "头痛", "偏头痛",
      "صداع", "شقيقة",
      "головная боль", "мигрень",
      "dor de cabeça", "enxaqueca",
      "mal di testa", "emicrania",
      "頭痛", "片頭痛",
      "두통", "편두통"
    ],
    problem: "Headache / Possible Migraine",
    severity: "Moderate",
    score: 5,
    recs: ["Neurological screen", "Blood pressure check", "Analgesics"]
  },
  {
    keywords: [
      "fracture", "broken bone", "can't move", "injury", "trauma", "fall", "accident",
      "fractura", "hueso roto", "caída", "lesión",
      "अस्थि भंग", "हड्डी टूटना", "चोट", "दुर्घटना",
      "fracture", "os cassé", "blessure", "chute",
      "fraktur", "knochenbruch", "verletzung", "sturz",
      "骨折", "摔伤", "受伤", "意外",
      "كسر", "إصابة", "سقوط", "حادث",
      "перелом", "травма", "падение", "авария",
      "fratura", "osso quebrado", "lesão", "queda",
      "frattura", "osso rotto", "caduta",
      "骨折", "転倒", "怪我",
      "골절", "부상", "낙상"
    ],
    problem: "Musculoskeletal Injury / Fracture",
    severity: "Moderate",
    score: 6,
    recs: ["X-ray", "Immobilize limb", "Pain management"]
  },
  {
    keywords: [
      "dizzy", "dizziness", "vertigo", "lightheaded", "balance",
      "mareo", "vértigo", "desequilibrio",
      "चक्कर आना", "चक्कर", "संतुलन बिगड़ना",
      "vertige", "étourdissement",
      "schwindel", "schwindelig",
      "眩晕", "头晕",
      "دوخة", "دوار",
      "головокружение", "вертиго",
      "tontura", "vertigem",
      "capogiro", "vertigini",
      "めまい", "立ちくらみ",
      "어지러움", "현기증"
    ],
    problem: "Dizziness / Vertigo",
    severity: "Low",
    score: 4,
    recs: ["BP check", "ENT assessment", "Hydration status"]
  },
  {
    keywords: [
      "rash", "allergic", "itching", "swelling", "hives", "allergy",
      "alergia", "hinchazón", "picazón", "erupción",
      "एलर्जी", "खुजली", "सूजन", "चकत्ते",
      "allergie", "démangeaison", "gonflement", "éruption",
      "allergie", "juckreiz", "schwellung",
      "过敏", "发痒", "肿胀", "皮疹",
      "حساسية", "حكة", "تورم", "طفح جلدي",
      "аллергия", "зуд", "отек", "сыпь",
      "alergia", "coceira", "inchaço",
      "allergia", "prurito", "gonfiore",
      "アレルギー", "かゆみ", "発疹",
      "알레르기", "가려움", "부종"
    ],
    problem: "Allergic Reaction / Dermatological",
    severity: "Moderate",
    score: 6,
    recs: ["Check for anaphylaxis", "Antihistamines", "EpiPen if severe"]
  }
];

module.exports = { VOICE_SYMPTOM_MAP };
