import React, { useState } from 'react';
import { TRANSLATIONS, speakText } from '../languageDictionary';
import PatientQRCode from './PatientQRCode';

export default function PatientProfileModal({
  patient,
  onClose,
  onOpenOverride,
  onOpenReport,
  patientLang = 'en',
  staffLang = 'en',
  audienceMode = 'clinician'
}) {
  const [activeTab, setActiveTab] = useState(audienceMode === 'patient' ? 'patientView' : 'overview');
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!patient) return null;

  const lang = activeTab === 'patientView' ? patientLang : staffLang;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const score = patient.effective_urgency_score;
  const isCritical = score >= 8;
  const badgeBg = isCritical ? '#dc2626' : score >= 6 ? '#d97706' : score >= 4 ? '#0077b6' : '#059669';

  const vitals = patient.vitals || {};
  const ai = patient.ai_reasoning || {};

  const formattedPatId = patient.patient_id || `VIT-2026-000${patient.id}`;

  const patSummary = lang === 'hi'
    ? (ai.patient_summary_hi || `आपने बताया कि आप महसूस कर रहे हैं: "${patient.complaint}"। हमारी मेडिकल टीम आपकी जांच कर रही है।`)
    : (ai.patient_summary_en || `You reported feeling: "${patient.complaint}". Our healthcare team is reviewing your symptoms to care for you.`);
  
  const patSteps = lang === 'hi'
    ? (ai.patient_next_steps_hi && ai.patient_next_steps_hi.length > 0 ? ai.patient_next_steps_hi : ["कृपया मेडिकल टीम द्वारा बुलाए जाने तक आराम से बैठें।", "यदि दर्द बढ़े तो नर्स को सूचित करें।"])
    : (ai.patient_next_steps_en && ai.patient_next_steps_en.length > 0 ? ai.patient_next_steps_en : ["Please rest quietly until called by the medical team.", "Tell a nurse if your symptoms change."]);

  const handleSpeak = () => {
    setIsSpeaking(true);
    speakText(patSummary, lang);
    setTimeout(() => setIsSpeaking(false), 7000);
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-card" style={{ maxWidth: '880px', width: '94vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRadius: '20px' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: badgeBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.4rem' }}>
              {score}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{patient.name}</h3>
                <span style={{ background: '#0096c7', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 900, fontFamily: 'monospace' }}>
                  {formattedPatId}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Intake Registered: {patient.created_at}
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.2rem' }}>
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: '#f8fafc', padding: '0 24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('patientView')}
            style={{
              padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === 'patientView' ? 800 : 600, fontSize: '0.875rem',
              color: activeTab === 'patientView' ? '#059669' : 'var(--text-secondary)',
              borderBottom: activeTab === 'patientView' ? '3px solid #059669' : '3px solid transparent'
            }}
          >
            {t.patientViewTab}
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === 'overview' ? 800 : 600, fontSize: '0.875rem',
              color: activeTab === 'overview' ? '#0096c7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'overview' ? '3px solid #0096c7' : '3px solid transparent'
            }}
          >
            {t.clinicalViewTab}
          </button>

          <button
            onClick={() => setActiveTab('vitals')}
            style={{
              padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: activeTab === 'vitals' ? 800 : 600, fontSize: '0.875rem',
              color: activeTab === 'vitals' ? '#0096c7' : 'var(--text-secondary)',
              borderBottom: activeTab === 'vitals' ? '3px solid #0096c7' : '3px solid transparent'
            }}
          >
            📊 {t.vitalsTitle}
          </button>
        </div>

        {/* Contents */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PATIENT VIEW TAB */}
          {activeTab === 'patientView' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '20px' }}>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#166534' }}>
                      {t.patientViewBanner}
                    </span>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857', marginTop: '2px', fontFamily: 'monospace' }}>
                      Official Patient ID: {formattedPatId}
                    </div>
                  </div>

                  <button
                    onClick={handleSpeak}
                    style={{
                      background: isSpeaking ? '#047857' : '#059669', color: '#fff', border: 'none',
                      padding: '8px 16px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer'
                    }}
                  >
                    {isSpeaking ? t.speaking : t.listenAudio}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'center' }}>
                  <div>
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#15803d', fontWeight: 800 }}>
                        {t.whatAiNoticed}
                      </h4>
                      <p style={{ margin: 0, fontSize: '1.05rem', color: '#14532d', lineHeight: '1.6', fontWeight: 600 }}>
                        {patSummary}
                      </p>
                    </div>

                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#15803d', fontWeight: 800 }}>
                        {t.whatYouShouldDo}
                      </h4>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.95rem', color: '#14532d', lineHeight: '1.7' }}>
                        {patSteps.map((step, idx) => (
                          <li key={idx}><strong>{step}</strong></li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* QR Code Scanner Display */}
                  <div style={{ textAlign: 'center' }}>
                    <PatientQRCode patientId={formattedPatId} size={110} />
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, display: 'block', marginTop: '4px' }}>
                      Scan QR Code for Record
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* CLINICAL VIEW TAB */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Permanent Patient ID</div>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0096c7', marginTop: '4px', fontFamily: 'monospace' }}>
                    {formattedPatId}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Pain Level</div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', color: patient.pain_scale >= 8 ? '#dc2626' : '#d97706', marginTop: '4px' }}>
                    {patient.pain_scale}/10 Self-Reported
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Recommended Dept</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0369a1', marginTop: '4px' }}>
                    🏥 {ai.recommended_department || 'Emergency Department'}
                  </div>
                </div>
              </div>

              {/* Chief Complaint */}
              <div style={{ background: 'rgba(0,150,199,0.06)', border: '1px solid rgba(0,150,199,0.2)', borderRadius: '14px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', fontWeight: 800, color: '#0077b6' }}>
                  {t.chiefComplaintLabel}
                </h4>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  "{patient.complaint}"
                </p>
              </div>
            </div>
          )}

          {/* VITALS TAB */}
          {activeTab === 'vitals' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>❤️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.heartRate}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: vitals.heart_rate > 110 ? '#dc2626' : '#059669' }}>
                  {vitals.heart_rate != null ? `${vitals.heart_rate} bpm` : 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>🫁</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Oxygen SpO2</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: vitals.spo2 && vitals.spo2 < 95 ? '#dc2626' : '#059669' }}>
                  {vitals.spo2 != null ? `${vitals.spo2}%` : '98%'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>🌡️</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.temp}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: vitals.temperature > 101 ? '#dc2626' : '#059669' }}>
                  {vitals.temperature != null ? `${vitals.temperature}°F` : 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-color)', borderRadius: '14px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>🩺</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.bloodPressure}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0096c7' }}>
                  {vitals.blood_pressure || 'N/A'}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => onOpenReport(patient)}>
            {t.printReport}
          </button>
          <button className="btn btn-secondary-ghost" onClick={onClose}>
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
}
