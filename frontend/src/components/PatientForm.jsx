import React, { useState } from 'react';
 
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
      // Clear form after successful submit
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
    // Reset clinical history first
    setDiabetes(false);
    setHypertension(false);
    setHeartDisease(false);
    setAsthma(false);
    setOtherHistory('');
    setAllergies('');
    setMedications('');

    if (presetType === 'chest_pain') {
      setName('James Vance');
      setComplaint('Substernal chest pressure and mild shortness of breath while walking up stairs.');
      setPainScale(8);
      setHeartRate(104);
      setTemperature(98.8);
      setBloodPressure('146/92');
      setAge(68);
      setGender('Male');
      setHeartDisease(true);
      setHypertension(true);
      setMedications('Lisinopril, Aspirin');
      setAllergies('Penicillin');
    } else if (presetType === 'ankle') {
      setName('Emily Carter');
      setComplaint('Rolled left ankle on hiking trail 2 hours ago. Moderate swelling, able to bear slight weight.');
      setPainScale(4);
      setHeartRate(72);
      setTemperature(98.6);
      setBloodPressure('118/76');
      setAge(29);
      setGender('Female');
      setAllergies('Sulfa Drugs');
    } else if (presetType === 'sepsis') {
      setName('Harold Miller');
      setComplaint('Post-surgical chills, dizziness, lethargy, and warm abdominal surgical incision site.');
      setPainScale(6);
      setHeartRate(124);
      setTemperature(101.8);
      setBloodPressure('102/62');
      setAge(74);
      setGender('Male');
      setDiabetes(true);
      setMedications('Metformin');
    }
  };

  return (
    <div className="card intake-card">
      <div className="card-header">
        <h2 className="card-title">
          <span className="icon">📋</span> Patient Intake
        </h2>
        <span className="badge-outline">Step 1: Enter Vitals & Symptoms</span>
      </div>

      {/* Quick Preset Buttons for Live Demos */}
      <div className="preset-bar">
        <span className="preset-label">Quick Demo Presets:</span>
        <button type="button" className="btn-chip" onClick={() => loadPreset('chest_pain')}>
          💔 Chest Pressure
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

        <div className="form-group">
          <label htmlFor="chief-complaint">Main Chief Complaint <span className="req">*</span></label>
          <textarea
            id="chief-complaint"
            className="input-field textarea-field"
            rows="3"
            placeholder="Describe symptoms in patient's plain language (e.g. sharp right lower side stomach pain, nausea)..."
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
              <span className="spinner"></span> Analyzing AI Reasoner...
            </span>
          ) : (
            '⚡ Evaluate & Submit to Triage Queue'
          )}
        </button>
      </form>
    </div>
  );
}
