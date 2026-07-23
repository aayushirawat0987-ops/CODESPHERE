import React, { useState } from 'react';
import { TRANSLATIONS } from '../languageDictionary';

const COMMON_SYMPTOM_TAGS_EN = [
  '🌡️ Fever', '🧠 Headache', '💫 Dizziness', '🤮 Vomiting', '💧 Diarrhea',
  '🤢 Abdominal Pain', '💔 Chest Pain', '🫁 Shortness of Breath', '🗣️ Cough',
  '🗣️ Sore Throat', '🦴 Back Pain', '🦵 Joint Pain', '🦒 Neck Pain',
  '👂 Ear Pain', '👁️ Eye Pain', '🔴 Skin Rash', '🔥 Burns', '🐝 Allergic Reaction',
  '😰 Anxiety', '🧊 Dehydration', '🪫 Weakness', '😵 Loss of Consciousness',
  '⚡ Seizures', '💥 Trauma', '🦴 Fractures', '🩸 Bleeding', '🤰 Pregnancy Complaint',
  '🚽 Urinary Symptoms', '📈 High Blood Pressure', '📉 Low Blood Pressure'
];

const COMMON_SYMPTOM_TAGS_HI = [
  '🌡️ बुखार (Fever)', '🧠 सिरदर्द (Headache)', '💫 चक्कर (Dizziness)', '🤮 उल्टी (Vomiting)',
  '💧 दस्त (Diarrhea)', '🤢 पेट दर्द (Abdominal Pain)', '💔 छाती में दर्द (Chest Pain)',
  '🫁 सांस लेने में तकलीफ (Shortness of Breath)', '🗣️ खांसी (Cough)', '🗣️ गले में खराश (Sore Throat)',
  '🦴 पीठ दर्द (Back Pain)', '🦵 जोड़ों में दर्द (Joint Pain)', '🦒 गर्दन में अकड़न (Neck Pain)',
  '👂 कान दर्द (Ear Pain)', '👁️ आंख दर्द (Eye Pain)', '🔴 त्वचा दाने (Skin Rash)', '🔥 जलन (Burns)',
  '🐝 एलर्जी (Allergy)', '😰 घबराहट (Anxiety)', '🧊 पानी की कमी (Dehydration)', '🪫 कमजोरी (Weakness)',
  '😵 बेहोशी (Fainting)', '⚡ दौरे (Seizures)', '💥 चोट (Trauma)', '🦴 हड्डी टूटना (Fracture)',
  '🩸 खून बहना (Bleeding)', '🤰 गर्भावस्था समस्या (Pregnancy)', '🚽 पेशाब में जलन (Urinary)'
];

export default function PatientForm({ onSubmit, isLoading, lang = 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const symptomTags = lang === 'hi' ? COMMON_SYMPTOM_TAGS_HI : COMMON_SYMPTOM_TAGS_EN;

  const [name, setName] = useState('');
  const [complaint, setComplaint] = useState('');
  const [painScale, setPainScale] = useState(5);
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [spo2, setSpo2] = useState('');
  const [respRate, setRespRate] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [diabetes, setDiabetes] = useState(false);
  const [hypertension, setHypertension] = useState(false);
  const [heartDisease, setHeartDisease] = useState(false);
  const [asthma, setAsthma] = useState(false);
  const [otherHistory, setOtherHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');

  const toggleSymptomTag = (tagText) => {
    const cleanTag = tagText.replace(/^[\p{Emoji}\s]+/u, '').trim();
    if (complaint.toLowerCase().includes(cleanTag.toLowerCase())) {
      const regex = new RegExp(`(?:,\\s*)?${cleanTag}`, 'gi');
      const updated = complaint.replace(regex, '').replace(/^,\s*/, '').trim();
      setComplaint(updated);
    } else {
      if (!complaint.trim()) {
        setComplaint(cleanTag);
      } else {
        setComplaint(prev => `${prev}, ${cleanTag}`);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !complaint.trim()) {
      alert(lang === 'hi' ? 'कृपया मरीज़ का नाम और मुख्य समस्या दर्ज करें।' : 'Please fill in patient name and chief complaint.');
      return;
    }

    const conditions = [];
    if (diabetes) conditions.push('Diabetes');
    if (hypertension) conditions.push('Hypertension');
    if (heartDisease) conditions.push('Heart Disease');
    if (asthma) conditions.push('Asthma');
    if (otherHistory.trim()) conditions.push(otherHistory.trim());
    const compiledHistory = conditions.join(', ') || null;

    const payload = {
      name: name.trim(),
      complaint: complaint.trim(),
      pain_scale: parseInt(painScale, 10),
      vitals: {
        heart_rate: heartRate ? parseInt(heartRate, 10) : null,
        temperature: temperature ? parseFloat(temperature) : null,
        blood_pressure: bloodPressure.trim() || null,
        spo2: spo2 ? parseInt(spo2, 10) : null,
        resp_rate: respRate ? parseInt(respRate, 10) : null,
        height: height.trim() || null,
        weight: weight.trim() || null
      },
      blood_group: bloodGroup,
      emergency_contact: emergencyContact.trim() || null,
      age: age ? parseInt(age, 10) : null,
      gender: gender || null,
      medical_history: compiledHistory,
      allergies: allergies.trim() || null,
      current_medications: medications.trim() || null
    };

    onSubmit(payload, () => {
      setName('');
      setComplaint('');
      setPainScale(5);
      setHeartRate('');
      setTemperature('');
      setBloodPressure('');
      setSpo2('');
      setRespRate('');
      setHeight('');
      setWeight('');
      setEmergencyContact('');
      setAge('');
      setGender('Male');
      setDiabetes(false);
      setHypertension(false);
      setHeartDisease(false);
      setAsthma(false);
      setOtherHistory('');
      setAllergies('');
      setMedications('');
    });
  };

  const loadPreset = (presetType) => {
    setDiabetes(false);
    setHypertension(false);
    setHeartDisease(false);
    setAsthma(false);
    setOtherHistory('');
    setAllergies('');
    setMedications('');

    if (presetType === 'fever_vomiting') {
      setName('David Ross');
      setComplaint(lang === 'hi' ? 'तेज़ बुखार, सिरदर्द, बदन दर्द और उल्टी' : 'High fever, severe pounding headache, muscle aches, and repeated vomiting.');
      setPainScale(7);
      setHeartRate(98);
      setTemperature(102.4);
      setBloodPressure('124/82');
      setSpo2(98);
      setRespRate(18);
      setAge(42);
      setGender('Male');
    } else if (presetType === 'chest_breath') {
      setName('James Vance');
      setComplaint(lang === 'hi' ? 'छाती में तेज़ दबाव, सांस लेने में तकलीफ और पसीना आना' : 'Substernal chest pressure, shortness of breath, and diaphoresis.');
      setPainScale(8);
      setHeartRate(104);
      setTemperature(98.8);
      setBloodPressure('146/92');
      setSpo2(93);
      setRespRate(24);
      setAge(68);
      setGender('Male');
      setHeartDisease(true);
      setHypertension(true);
    } else if (presetType === 'allergy_rash') {
      setName('Chloe Bennett');
      setComplaint(lang === 'hi' ? 'त्वचा पर दाने, सूजन, और गले में खुजली' : 'Widespread skin rash, hives, facial swelling, and throat itching.');
      setPainScale(5);
      setHeartRate(92);
      setTemperature(98.6);
      setBloodPressure('114/72');
      setSpo2(99);
      setRespRate(16);
      setAge(24);
      setGender('Female');
    } else if (presetType === 'ankle') {
      setName('Emily Carter');
      setComplaint(lang === 'hi' ? 'पैर के टखने में मोच और सूजन' : 'Rolled left ankle on trail with moderate swelling.');
      setPainScale(4);
      setHeartRate(72);
      setTemperature(98.6);
      setBloodPressure('118/76');
      setSpo2(99);
      setRespRate(14);
      setAge(29);
      setGender('Female');
    }
  };

  return (
    <div className="card intake-card">
      <div className="card-header">
        <h2 className="card-title">
          <span className="icon">📋</span> {t.intakeTitle}
        </h2>
        <span className="badge-outline">Auto Patient ID (VIT-2026-XXXXXX)</span>
      </div>

      {/* Demo Presets */}
      <div className="preset-bar">
        <span className="preset-label">{t.demoPresets}</span>
        <button type="button" className="btn-chip" onClick={() => loadPreset('fever_vomiting')}>
          🧠 {lang === 'hi' ? 'बुखार + सिरदर्द + उल्टी' : 'Fever + Headache + Vomiting'}
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('chest_breath')}>
          💔 {lang === 'hi' ? 'छाती दर्द + सांस फूलना' : 'Chest Pressure + Shortness of Breath'}
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('allergy_rash')}>
          🐝 {lang === 'hi' ? 'एलर्जी + दाने' : 'Allergic Rash + Swelling'}
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('ankle')}>
          🦶 {lang === 'hi' ? 'पैर में मोच' : 'Sprained Ankle'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="intake-form">
        <div className="form-group">
          <label htmlFor="patient-name">{t.fullName} <span className="req">*</span></label>
          <input
            id="patient-name"
            type="text"
            className="input-field"
            placeholder={lang === 'hi' ? 'उदा. राजेश शर्मा' : 'e.g. Jane Doe'}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="patient-age">{t.age}</label>
            <input
              id="patient-age"
              type="number"
              min="0"
              max="150"
              className="input-field"
              placeholder="e.g. 45"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="patient-gender">{t.gender}</label>
            <select
              id="patient-gender"
              className="input-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Male">{t.male}</option>
              <option value="Female">{t.female}</option>
              <option value="Other">{t.other}</option>
            </select>
          </div>
        </div>

        {/* Interactive Multi-Symptom Tag Selector */}
        <div className="form-group">
          <label style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{t.symptomSelector}</span>
            <span style={{ fontSize: '0.75rem', color: '#0096c7', fontWeight: 600 }}>{t.symptomSelectorHint}</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem', maxHeight: '130px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {symptomTags.map((tagText, idx) => {
              const cleanTag = tagText.replace(/^[\p{Emoji}\s]+/u, '').trim();
              const isSelected = complaint.toLowerCase().includes(cleanTag.toLowerCase());
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleSymptomTag(tagText)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: isSelected ? '1px solid #0096c7' : '1px solid #cbd5e1',
                    background: isSelected ? 'rgba(0,150,199,0.15)' : '#ffffff',
                    color: isSelected ? '#0077b6' : 'var(--text-primary)',
                    fontWeight: isSelected ? 800 : 500,
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  {isSelected ? `✓ ${tagText}` : tagText}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="chief-complaint">{t.chiefComplaint} <span className="req">*</span></label>
          <textarea
            id="chief-complaint"
            className="input-field textarea-field"
            rows="3"
            placeholder={t.chiefComplaintPlaceholder}
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <div className="label-with-val">
            <label htmlFor="pain-scale">{t.painScale}</label>
            <span className={`pain-val pain-${painScale}`}>
              {painScale} / 10 {painScale >= 8 ? t.painSevere : painScale >= 5 ? t.painModerate : t.painMild}
            </span>
          </div>
          <input
            id="pain-scale"
            type="range"
            min="1"
            max="10"
            className="slider-input"
            value={painScale}
            onChange={(e) => setPainScale(e.target.value)}
          />
        </div>

        {/* Extended Vitals Section */}
        <div className="vitals-section" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 className="section-subtitle">{t.vitalsTitle}</h3>
          
          <div className="vitals-grid">
            <div className="form-group">
              <label htmlFor="heart-rate">{t.heartRate}</label>
              <input
                id="heart-rate"
                type="number"
                className="input-field"
                placeholder="e.g. 80"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="temperature">{t.temp}</label>
              <input
                id="temperature"
                type="number"
                step="0.1"
                className="input-field"
                placeholder="e.g. 98.6"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="blood-pressure">{t.bloodPressure}</label>
              <input
                id="blood-pressure"
                type="text"
                className="input-field"
                placeholder="e.g. 120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>🫁 Oxygen SpO2 (%)</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 98"
                value={spo2}
                onChange={(e) => setSpo2(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>🌬️ Resp Rate (bpm)</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 16"
                value={respRate}
                onChange={(e) => setRespRate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>🩸 Blood Group</label>
              <select className="input-field" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-wrap">
              <span className="spinner"></span> {t.analyzing}
            </span>
          ) : (
            t.submitBtn
          )}
        </button>
      </form>
    </div>
  );
}
