import React, { useState } from 'react';

export default function PatientProfileModal({ patient, onClose, onOpenOverride, onOpenReport }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'vitals' | 'ai' | 'timeline'

  if (!patient) return null;

  const score = patient.effective_urgency_score;
  const isCritical = score >= 8;
  const isHigh = score >= 6 && score < 8;
  const isModerate = score >= 4 && score < 6;
  const badgeBg = isCritical ? '#dc2626' : isHigh ? '#d97706' : isModerate ? '#0077b6' : '#059669';
  const badgeLabel = isCritical ? 'Critical Urgency' : isHigh ? 'High Urgency' : isModerate ? 'Moderate Urgency' : 'Low Urgency';

  const waitMinutes = Math.max(0, Math.round((10 - score) * 7.5));
  const waitText = isCritical ? 'Immediate / Priority 1' : `${waitMinutes} min estimated wait`;

  const vitals = patient.vitals || {};
  const ai = patient.ai_reasoning || {};
  const rules = patient.rule_check || {};
  const override = patient.override || null;

  const extractedSymptoms = ai.extracted_symptoms || [];
  const urgencyContributions = ai.symptom_urgency_contributions || [];
  const possibleConcerns = ai.possible_clinical_concerns || [];
  const nextSteps = ai.recommended_next_steps || [];
  const department = ai.recommended_department || (isCritical ? 'Emergency Department / Trauma' : 'General Triage');
  const confidence = ai.confidence_level || 'High';
  const disclaimer = ai.disclaimer || 'Clinical Decision Support Only - Not a Medical Diagnosis';

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: '880px', width: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '20px' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: badgeBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
              {score}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{patient.name}</h3>
                <span style={{ background: badgeBg, color: '#fff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {badgeLabel}
                </span>
                {patient.is_overridden && (
                  <span style={{ background: 'rgba(124, 58, 237, 0.3)', border: '1px solid #7c3aed', color: '#c4b5fd', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                    🔒 Staff Overridden
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Patient ID: <strong style={{ color: '#00d4ff' }}>#{patient.id}</strong> | Registered: {patient.created_at} | Est. Wait: <strong>{waitText}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', padding: '0 24px' }}>
          {[
            { id: 'overview', label: '👤 Clinical Overview' },
            { id: 'vitals', label: '📊 Vital Signs & Status' },
            { id: 'ai', label: '🤖 Dynamic AI Decision Support' },
            { id: 'timeline', label: '⏱️ Event Timeline' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                fontWeight: activeTab === tab.id ? 800 : 600,
                fontSize: '0.875rem',
                color: activeTab === tab.id ? '#0096c7' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '3px solid #0096c7' : '3px solid transparent'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Demographics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Demographics</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                    {patient.age != null ? `${patient.age} yrs` : 'Age N/A'} • {patient.gender || 'Gender N/A'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pain Level</div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: patient.pain_scale >= 8 ? '#dc2626' : '#d97706', marginTop: '4px' }}>
                    {patient.pain_scale}/10 Self-Reported
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Recommended Dept</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0369a1', marginTop: '4px' }}>
                    🏥 {department}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AI Confidence</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: badgeBg, marginTop: '4px' }}>
                    {confidence} Confidence
                  </div>
                </div>
              </div>

              {/* Chief Complaint */}
              <div style={{ background: 'rgba(0,150,199,0.06)', border: '1px solid rgba(0,150,199,0.2)', borderRadius: '14px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 800, color: '#0077b6', textTransform: 'uppercase' }}>
                  🗣️ Primary Chief Complaint
                </h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: 600 }}>
                  "{patient.complaint}"
                </p>
              </div>

              {/* Extracted Symptoms Tags */}
              {extractedSymptoms.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    🔍 Extracted Clinical Symptoms ({extractedSymptoms.length})
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {extractedSymptoms.map((sym, idx) => (
                      <span key={idx} style={{ background: 'rgba(0,150,199,0.1)', border: '1px solid #0096c7', color: '#0077b6', padding: '5px 12px', borderRadius: '16px', fontWeight: 700, fontSize: '0.85rem' }}>
                        {sym}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Possible Clinical Concerns (Multi-item Differential) */}
              {possibleConcerns.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                    🏥 Possible Clinical Concerns (Non-Definitive Differential)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {possibleConcerns.map((concern, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderLeft: '4px solid #0284c7', borderRadius: '8px', padding: '10px 14px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        • {concern}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Red Flags */}
              {patient.all_red_flags && patient.all_red_flags.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase' }}>
                    🚨 Active Red Flag Alerts ({patient.all_red_flags.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {patient.all_red_flags.map((flag, idx) => (
                      <div key={idx} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 600 }}>
                        {flag}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medical History */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Medical History</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{patient.medical_history || 'None reported'}</p>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <h5 style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Allergies & Meds</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                    <strong>Allergies:</strong> {patient.allergies || 'NKDA'}<br />
                    <strong>Meds:</strong> {patient.current_medications || 'None'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VITALS */}
          {activeTab === 'vitals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>❤️</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Heart Rate</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: vitals.heart_rate > 110 ? '#dc2626' : '#059669', margin: '4px 0' }}>
                    {vitals.heart_rate != null ? `${vitals.heart_rate} bpm` : 'N/A'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {vitals.heart_rate > 120 ? '🚨 Tachycardia Risk' : 'Normal resting range'}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>🌡️</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Body Temperature</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: vitals.temperature > 101 ? '#dc2626' : '#059669', margin: '4px 0' }}>
                    {vitals.temperature != null ? `${vitals.temperature}°F` : 'N/A'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {vitals.temperature > 101.5 ? '🚨 Pyrexia / Fever Alert' : 'Normal thermal status'}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>🩺</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Blood Pressure</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0096c7', margin: '4px 0' }}>
                    {vitals.blood_pressure || 'N/A'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Systolic / Diastolic
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DYNAMIC AI DECISION SUPPORT */}
          {activeTab === 'ai' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Rationale Box */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                <h4 style={{ margin: '0 0 10px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🤖 Dynamic AI Clinical Rationale
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {patient.combined_rationale || ai.rationale || 'AI evaluation completed based on patient profile and vitals.'}
                </p>
              </div>

              {/* Symptom Urgency Contributions Breakdown */}
              {urgencyContributions.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 800, color: '#0077b6' }}>
                    ⚡ Symptom Urgency Score Contributions
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {urgencyContributions.map((contrib, cIdx) => (
                      <li key={cIdx}><strong>{contrib}</strong></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Next Steps */}
              {nextSteps.length > 0 && (
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '18px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', fontWeight: 800, color: '#059669' }}>
                    📋 Recommended Clinical Next Steps
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {nextSteps.map((step, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        <span style={{ width: '22px', height: '22px', background: '#059669', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>
                          {idx + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Safety Disclaimer */}
              <div style={{ padding: '12px 16px', background: 'rgba(0,150,199,0.06)', border: '1px solid rgba(0,150,199,0.2)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                🛡️ {disclaimer}
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '10px 0' }}>
              {[
                { time: patient.created_at, title: 'Patient Registered at Triage Desk', desc: `Complaining of ${patient.complaint}`, icon: '📝' },
                { time: patient.created_at, title: 'Vital Signs & Symptoms Evaluated', desc: `HR: ${vitals.heart_rate || 'N/A'} bpm, Temp: ${vitals.temperature || 'N/A'}°F, BP: ${vitals.blood_pressure || 'N/A'}`, icon: '🩺' },
                { time: patient.created_at, title: 'Dynamic AI & Safety Rule Engine Evaluated', desc: `Assigned Urgency Score: ${score}/10 (Recommended Dept: ${department})`, icon: '🤖' },
                ...(override ? [{ time: override.overridden_at, title: 'Staff Override Applied', desc: `Score set to ${override.score}/10 by ${override.staff_name}`, icon: '🔒' }] : [])
              ].map((evt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                    {evt.icon}
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{evt.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.time}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>{evt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-secondary-ghost"
            onClick={() => onOpenOverride(patient)}
          >
            🔒 Adjust Staff Score
          </button>
          
          <button
            className="btn btn-primary"
            onClick={() => onOpenReport(patient)}
            style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}
          >
            🖨️ Print Hospital Triage Report
          </button>

          <button className="btn btn-secondary-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
