import React, { useState } from 'react';

const COMMON_SYMPTOM_TAGS = [
  '🌡️ Fever', '🧠 Headache', '💫 Dizziness', '🤮 Vomiting', '💧 Diarrhea',
  '🤢 Abdominal Pain', '💔 Chest Pain', '🫁 Shortness of Breath', '🗣️ Cough',
  '🗣️ Sore Throat', '🦴 Back Pain', '🦵 Joint Pain', '🦒 Neck Pain',
  '👂 Ear Pain', '👁️ Eye Pain', '🔴 Skin Rash', '🔥 Burns', '🐝 Allergic Reaction',
  '😰 Anxiety', '🧊 Dehydration', '🪫 Weakness', '😵 Loss of Consciousness',
  '⚡ Seizures', '💥 Trauma', '🦴 Fractures', '🩸 Bleeding', '🤰 Pregnancy Complaint',
  '🚽 Urinary Symptoms', '📈 High Blood Pressure', '📉 Low Blood Pressure',
  '🍬 High Blood Sugar', '📉 Low Blood Sugar'
];

export default function PatientForm({ onSubmit, isLoading }) {
  const [name, setName] = useState('');
  const [complaint, setComplaint] = useState('');
  const [painScale, setPainScale] = useState(5);
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [bloodPressure, setBloodPressure] = useState('');
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
    // Strip leading emoji
    const cleanTag = tagText.replace(/^[\p{Emoji}\s]+/u, '').trim();
    if (complaint.toLowerCase().includes(cleanTag.toLowerCase())) {
      // Remove symptom from complaint text
      const regex = new RegExp(`(?:,\\s*)?${cleanTag}`, 'gi');
      const updated = complaint.replace(regex, '').replace(/^,\s*/, '').trim();
      setComplaint(updated);
    } else {
      // Append symptom to complaint text
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
      alert('Please fill in patient name and chief complaint.');
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
        blood_pressure: bloodPressure.trim() || null
      },
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
      setComplaint('High fever, severe pounding headache, muscle aches, and repeated vomiting for 2 days.');
      setPainScale(7);
      setHeartRate(98);
      setTemperature(102.4);
      setBloodPressure('124/82');
      setAge(42);
      setGender('Male');
    } else if (presetType === 'chest_breath') {
      setName('James Vance');
      setComplaint('Substernal chest pressure, shortness of breath, and diaphoresis while walking.');
      setPainScale(8);
      setHeartRate(104);
      setTemperature(98.8);
      setBloodPressure('146/92');
      setAge(68);
      setGender('Male');
      setHeartDisease(true);
      setHypertension(true);
      setMedications('Lisinopril, Aspirin');
    } else if (presetType === 'sepsis') {
      setName('Harold Miller');
      setComplaint('Post-surgical chills, dizziness, lethargy, shivering, and warm abdominal incision.');
      setPainScale(7);
      setHeartRate(124);
      setTemperature(101.8);
      setBloodPressure('102/62');
      setAge(74);
      setGender('Male');
      setDiabetes(true);
    } else if (presetType === 'allergy_rash') {
      setName('Chloe Bennett');
      setComplaint('Widespread skin rash, hives, facial swelling, and mild throat itching after seafood.');
      setPainScale(5);
      setHeartRate(92);
      setTemperature(98.6);
      setBloodPressure('114/72');
      setAge(24);
      setGender('Female');
      setAllergies('Seafood');
    } else if (presetType === 'ankle') {
      setName('Emily Carter');
      setComplaint('Rolled left ankle on trail 2 hours ago. Moderate swelling, able to bear slight weight.');
      setPainScale(4);
      setHeartRate(72);
      setTemperature(98.6);
      setBloodPressure('118/76');
      setAge(29);
      setGender('Female');
    }
  };

  return (
    <div className="card intake-card">
      <div className="card-header">
        <h2 className="card-title">
          <span className="icon">📋</span> Patient Intake & AI Multi-Symptom Analyzer
        </h2>
        <span className="badge-outline">Step 1: Enter Vitals & Dynamic Symptoms</span>
      </div>

      {/* Demo Presets */}
      <div className="preset-bar">
        <span className="preset-label">Multi-Symptom Demo Presets:</span>
        <button type="button" className="btn-chip" onClick={() => loadPreset('fever_vomiting')}>
          🧠 Fever + Headache + Vomiting
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('chest_breath')}>
          💔 Chest Pressure + Shortness of Breath
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('allergy_rash')}>
          🐝 Allergic Rash + Facial Swelling
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('sepsis')}>
          🚨 Sepsis Alert (HR+Fever)
        </button>
        <button type="button" className="btn-chip" onClick={() => loadPreset('ankle')}>
          🦶 Sprained Ankle
        </button>
      </div>

      <form onSubmit={handleSubmit} className="intake-form">
        <div className="form-group">
          <label htmlFor="patient-name">Patient Full Name <span className="req">*</span></label>
          <input
            id="patient-name"
            type="text"
            className="input-field"
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="patient-age">Age</label>
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
            <label htmlFor="patient-gender">Gender</label>
            <select
              id="patient-gender"
              className="input-field"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Interactive Multi-Symptom Tag Selector */}
        <div className="form-group">
          <label style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>⚡ Interactive Multi-Symptom Selector (Tap to combine)</span>
            <span style={{ fontSize: '0.75rem', color: '#0096c7', fontWeight: 600 }}>Multiple symptoms supported</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '0.75rem', maxHeight: '140px', overflowY: 'auto', padding: '8px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            {COMMON_SYMPTOM_TAGS.map((tagText, idx) => {
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
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? `✓ ${tagText}` : tagText}
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="chief-complaint">Main Chief Complaint <span className="req">*</span></label>
          <textarea
            id="chief-complaint"
            className="input-field textarea-field"
            rows="3"
            placeholder="Describe any combination of symptoms in patient's plain language (e.g. fever, severe headache, dizziness, vomiting)..."
            value={complaint}
            onChange={(e) => setComplaint(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <div className="label-with-val">
            <label htmlFor="pain-scale">Self-Reported Pain Scale (1 - 10)</label>
            <span className={`pain-val pain-${painScale}`}>
              {painScale} / 10 {painScale >= 8 ? '🔴 Severe' : painScale >= 5 ? '🟡 Moderate' : '🟢 Mild'}
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

        <div className="vitals-section" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 className="section-subtitle">Clinical History</h3>
          
          <div className="form-group">
            <label style={{ marginBottom: '0.5rem', display: 'block' }}>Pre-existing Diseases / Comorbidities</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={diabetes} onChange={e => setDiabetes(e.target.checked)} /> Diabetes
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={hypertension} onChange={e => setHypertension(e.target.checked)} /> Hypertension
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={heartDisease} onChange={e => setHeartDisease(e.target.checked)} /> Heart Disease
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', cursor: 'pointer', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={asthma} onChange={e => setAsthma(e.target.checked)} /> Asthma
              </label>
            </div>
            <input
              type="text"
              className="input-field"
              placeholder="Other conditions (comma separated)"
              value={otherHistory}
              onChange={e => setOtherHistory(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-allergies">Known Allergies</label>
            <input
              id="patient-allergies"
              type="text"
              className="input-field"
              placeholder="e.g. Penicillin, Peanuts or 'None'"
              value={allergies}
              onChange={e => setAllergies(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="patient-medications">Current Active Medications</label>
            <input
              id="patient-medications"
              type="text"
              className="input-field"
              placeholder="e.g. Aspirin, Metformin"
              value={medications}
              onChange={e => setMedications(e.target.value)}
            />
          </div>
        </div>

        <div className="vitals-section">
          <h3 className="section-subtitle">Vitals (Optional)</h3>
          <div className="vitals-grid">
            <div className="form-group">
              <label htmlFor="heart-rate">Heart Rate (bpm)</label>
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
              <label htmlFor="temperature">Temp (°F)</label>
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
              <label htmlFor="blood-pressure">Blood Pressure</label>
              <input
                id="blood-pressure"
                type="text"
                className="input-field"
                placeholder="e.g. 120/80"
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary submit-btn" disabled={isLoading}>
          {isLoading ? (
            <span className="spinner-wrap">
              <span className="spinner"></span> Analyzing Dynamic Multi-Symptom AI...
            </span>
          ) : (
            '⚡ Evaluate & Submit to Triage Queue'
          )}
        </button>
      </form>
    </div>
  );
}
