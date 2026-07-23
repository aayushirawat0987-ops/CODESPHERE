import React from 'react';

export default function MedicalReportModal({ patient, onClose }) {
  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const score = patient.effective_urgency_score;
  const isCritical = score >= 8;
  const isHigh = score >= 6 && score < 8;
  const isModerate = score >= 4 && score < 6;
  const badgeColor = isCritical ? '#dc2626' : isHigh ? '#d97706' : isModerate ? '#0077b6' : '#059669';
  const badgeLabel = isCritical ? 'CRITICAL (ESI 1/2)' : isHigh ? 'HIGH URGENCY (ESI 2)' : isModerate ? 'MODERATE (ESI 3)' : 'LOW URGENCY (ESI 4/5)';

  const vitals = patient.vitals || {};
  const ai = patient.ai_reasoning || {};
  const override = patient.override || null;

  const extractedSymptoms = ai.extracted_symptoms || [];
  const possibleConcerns = ai.possible_clinical_concerns || [];
  const nextSteps = ai.recommended_next_steps || [];
  const department = ai.recommended_department || (isCritical ? 'Emergency Department / Trauma' : 'General Triage');
  const confidence = ai.confidence_level || 'High';
  const disclaimer = ai.disclaimer || 'Clinical Decision Support Only - Not a Medical Diagnosis';

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card print-container" style={{ maxWidth: '820px', width: '92vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#fff', color: '#1e293b', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Top Control Bar */}
        <div className="no-print" style={{ padding: '14px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄 Official Hospital Triage Decision Support Report</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🖨️ Print / Export PDF
            </button>
            <button onClick={onClose} className="btn btn-secondary-ghost" style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#fff' }}>
              Close
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="printable-report" style={{ padding: '36px', overflowY: 'auto', flex: 1, fontFamily: 'Arial, sans-serif' }}>
          
          {/* Hospital Header */}
          <div style={{ borderBottom: '3px solid #0096c7', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#005b9f', fontWeight: 900, letterSpacing: '0.5px' }}>
                VITALIS MEDICAL CENTER
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Department of Emergency Medicine & Acute Clinical Triage<br />
                AI-Driven Decision-Support Record & Staff Audit Log
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ background: badgeColor, color: '#fff', padding: '6px 14px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', display: 'inline-block' }}>
                {badgeLabel}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Report Date: {new Date().toLocaleDateString()}<br />
                Record ID: <strong>#{patient.id}</strong>
              </p>
            </div>
          </div>

          {/* Patient Demographics */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
              1. PATIENT DEMOGRAPHICS & INTAKE SUMMARY
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
              <div><strong>Full Name:</strong> {patient.name}</div>
              <div><strong>Age / Gender:</strong> {patient.age != null ? `${patient.age} yrs` : 'N/A'} / {patient.gender || 'N/A'}</div>
              <div><strong>Intake Time:</strong> {patient.created_at}</div>
              <div><strong>Self Pain Score:</strong> {patient.pain_scale}/10</div>
              <div><strong>Recommended Dept:</strong> 🏥 {department}</div>
              <div><strong>AI Confidence:</strong> {confidence} Confidence</div>
              <div><strong>Medical History:</strong> {patient.medical_history || 'None'}</div>
              <div><strong>Known Allergies:</strong> {patient.allergies || 'NKDA'}</div>
              <div><strong>Active Meds:</strong> {patient.current_medications || 'None'}</div>
            </div>
          </div>

          {/* Chief Complaint & Extracted Symptoms */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0f172a' }}>
              2. PRIMARY CHIEF COMPLAINT & EXTRACTED SYMPTOMS
            </h3>
            <div style={{ background: '#fff', border: '1.5px solid #0096c7', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, marginBottom: '10px' }}>
              "{patient.complaint}"
            </div>

            {extractedSymptoms.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Identified Symptoms:</span>
                {extractedSymptoms.map((sym, idx) => (
                  <span key={idx} style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1', padding: '3px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700 }}>
                    {sym}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Vitals Summary Grid */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0f172a' }}>
              3. PHYSIOLOGICAL VITAL SIGNS
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px' }}>Vital Parameter</th>
                  <th style={{ padding: '8px' }}>Observed Value</th>
                  <th style={{ padding: '8px' }}>Reference Range</th>
                  <th style={{ padding: '8px' }}>Status / Flags</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Heart Rate</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{vitals.heart_rate != null ? `${vitals.heart_rate} bpm` : 'N/A'}</td>
                  <td style={{ padding: '8px', color: '#64748b' }}>60 - 100 bpm</td>
                  <td style={{ padding: '8px', color: vitals.heart_rate > 110 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                    {vitals.heart_rate > 120 ? '🚨 Tachycardia Alert' : 'Normal'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Temperature</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{vitals.temperature != null ? `${vitals.temperature}°F` : 'N/A'}</td>
                  <td style={{ padding: '8px', color: '#64748b' }}>97.8 - 99.1°F</td>
                  <td style={{ padding: '8px', color: vitals.temperature > 101 ? '#dc2626' : '#059669', fontWeight: 700 }}>
                    {vitals.temperature > 101.5 ? '🚨 Pyrexia / Fever' : 'Normal'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px' }}>Blood Pressure</td>
                  <td style={{ padding: '8px', fontWeight: 700 }}>{vitals.blood_pressure || 'N/A'}</td>
                  <td style={{ padding: '8px', color: '#64748b' }}>120/80 mmHg</td>
                  <td style={{ padding: '8px', color: '#0096c7', fontWeight: 700 }}>Recorded</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI Decision Support & Differential */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0f172a' }}>
              4. AI DECISION SUPPORT & CLINICAL DIFFERENTIAL OBSERVED
            </h3>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '14px', fontSize: '0.85rem', lineHeight: '1.5' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Effective Urgency Score:</strong> <span style={{ color: badgeColor, fontWeight: 900, fontSize: '1rem' }}>{score}/10</span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Clinical Rationale:</strong> {patient.combined_rationale || ai.rationale}
              </div>

              {possibleConcerns.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Possible Clinical Concerns (Non-Definitive Differential):</strong>
                  <ul style={{ margin: '4px 0 8px', paddingLeft: '20px' }}>
                    {possibleConcerns.map((concern, idx) => (
                      <li key={idx}>• {concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {nextSteps.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <strong>Recommended Next Steps:</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '20px', color: '#0369a1' }}>
                    {nextSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {patient.all_red_flags && patient.all_red_flags.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Active Red Flags ({patient.all_red_flags.length}):</strong>
                  <ul style={{ margin: '4px 0 0', paddingLeft: '20px', color: '#b91c1c' }}>
                    {patient.all_red_flags.map((flag, idx) => (
                      <li key={idx}><strong>{flag}</strong></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Clinician Verification & Disclaimer */}
          <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '16px', marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a' }}>
              5. CLINICIAN VERIFICATION & SIGN-OFF
            </h3>
            {override ? (
              <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid #7c3aed', borderRadius: '8px', padding: '12px', fontSize: '0.85rem' }}>
                <div><strong>Staff Override Applied:</strong> Urgency Score set to {override.score}/10</div>
                <div><strong>Override Reason:</strong> {override.reason}</div>
                <div><strong>Verified By:</strong> {override.staff_name} ({override.overridden_at})</div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                No manual override applied. AI recommendation accepted by attending triage nurse.
              </p>
            )}

            <div style={{ marginTop: '12px', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
              🛡️ {disclaimer}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '12px', fontSize: '0.8rem' }}>
              <div>
                __________________________________________<br />
                Attending Triage Nurse Signature
              </div>
              <div>
                __________________________________________<br />
                ER Resident / Chief Medical Officer
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
