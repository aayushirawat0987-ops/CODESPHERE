import React from 'react';
import { TRANSLATIONS } from '../languageDictionary';
import PatientQRCode from './PatientQRCode';

export default function MedicalReportModal({
  patient,
  onClose,
  patientLang = 'en',
  staffLang = 'en',
  audienceMode = 'clinician'
}) {
  const [reportType, setReportType] = React.useState(audienceMode === 'patient' ? 'patient' : 'clinical');

  if (!patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const lang = reportType === 'patient' ? patientLang : staffLang;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const score = patient.effective_urgency_score;
  const isCritical = score >= 8;
  const isHigh = score >= 6 && score < 8;
  const isModerate = score >= 4 && score < 6;
  const badgeColor = isCritical ? '#dc2626' : isHigh ? '#d97706' : isModerate ? '#0077b6' : '#059669';
  const badgeLabel = isCritical ? 'CRITICAL (ESI 1/2)' : isHigh ? 'HIGH URGENCY (ESI 2)' : isModerate ? 'MODERATE (ESI 3)' : 'LOW URGENCY (ESI 4/5)';

  const vitals = patient.vitals || {};
  const ai = patient.ai_reasoning || {};
  const formattedPatId = patient.patient_id || `VIT-2026-000${patient.id}`;

  const extractedSymptoms = ai.extracted_symptoms || [];
  const department = ai.recommended_department || (isCritical ? 'Emergency Department / Trauma' : 'General Triage');
  const confidence = ai.confidence_level || 'High';
  const disclaimer = ai.disclaimer || 'Clinical Decision Support Only - Not a Medical Diagnosis';

  const patSummary = lang === 'hi'
    ? (ai.patient_summary_hi || `आपने बताया कि आप महसूस कर रहे हैं: "${patient.complaint}"। हमारी मेडिकल टीम आपकी जांच कर रही है।`)
    : (ai.patient_summary_en || `You reported feeling: "${patient.complaint}". Our healthcare team is reviewing your symptoms to care for you.`);
  
  const patSteps = lang === 'hi'
    ? (ai.patient_next_steps_hi && ai.patient_next_steps_hi.length > 0 ? ai.patient_next_steps_hi : ["कृपया मेडिकल टीम द्वारा बुलाए जाने तक आराम से बैठें।", "यदि दर्द बढ़े तो नर्स को सूचित करें।"])
    : (ai.patient_next_steps_en && ai.patient_next_steps_en.length > 0 ? ai.patient_next_steps_en : ["Please rest quietly until called by the medical team.", "Tell a nurse if your symptoms change."]);

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div className="modal-card print-container" style={{ maxWidth: '840px', width: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#fff', color: '#1e293b', borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="no-print" style={{ padding: '14px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>📄 {reportType === 'patient' ? t.patientSummaryReport : t.officialClinicalReport}</span>
            <div style={{ display: 'flex', background: '#1e293b', borderRadius: '14px', padding: '2px', border: '1px solid #334155' }}>
              <button
                onClick={() => setReportType('patient')}
                style={{
                  padding: '4px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                  background: reportType === 'patient' ? '#059669' : 'transparent', color: reportType === 'patient' ? '#fff' : '#94a3b8'
                }}
              >
                👤 {t.patientViewTab}
              </button>
              <button
                onClick={() => setReportType('clinical')}
                style={{
                  padding: '4px 10px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
                  background: reportType === 'clinical' ? '#0096c7' : 'transparent', color: reportType === 'clinical' ? '#fff' : '#94a3b8'
                }}
              >
                👨‍⚕️ {t.clinicalViewTab}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              🖨️ {t.printReport}
            </button>
            <button onClick={onClose} className="btn btn-secondary-ghost" style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#fff' }}>
              {t.close}
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="printable-report" style={{ padding: '36px', overflowY: 'auto', flex: 1, fontFamily: 'Arial, sans-serif' }}>
          
          {/* Hospital Header */}
          <div style={{ borderBottom: '3px solid #0096c7', paddingBottom: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#005b9f', fontWeight: 900, letterSpacing: '0.5px' }}>
                VITALIS MEDICAL CENTER
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Department of Emergency Medicine & Acute Clinical Triage<br />
                {reportType === 'patient' ? 'Patient Personal Health & Next Steps Summary' : 'AI-Driven Decision-Support Record & Staff Audit Log'}
              </p>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', gap: '16px', alignItems: 'center' }}>
              <PatientQRCode patientId={formattedPatId} size={85} />
              <div>
                <div style={{ background: badgeColor, color: '#fff', padding: '6px 14px', borderRadius: '8px', fontWeight: 900, fontSize: '0.85rem', display: 'inline-block' }}>
                  {badgeLabel}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: '#0f172a', fontWeight: 900, fontFamily: 'monospace' }}>
                  Patient ID: {formattedPatId}
                </p>
              </div>
            </div>
          </div>

          {/* REPORT TYPE 1: PATIENT-FRIENDLY REPORT */}
          {reportType === 'patient' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ margin: '0 0 10px', color: '#166534', fontSize: '1.1rem', fontWeight: 900 }}>
                  {t.patientViewBanner} ({patient.name})
                </h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#15803d', fontWeight: 800 }}>
                    {t.whatAiNoticed}
                  </h4>
                  <p style={{ margin: 0, fontSize: '1rem', color: '#14532d', lineHeight: '1.6' }}>
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
            </div>
          ) : (
            /* REPORT TYPE 2: OFFICIAL CLINICAL REPORT */
            <>
              {/* Patient Demographics */}
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                  1. PATIENT DEMOGRAPHICS & INTAKE SUMMARY
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                  <div><strong>Full Name:</strong> {patient.name}</div>
                  <div><strong>Patient ID:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 900 }}>{formattedPatId}</span></div>
                  <div><strong>Age / Gender:</strong> {patient.age != null ? `${patient.age} yrs` : 'N/A'} / {patient.gender || 'N/A'}</div>
                  <div><strong>Intake Time:</strong> {patient.created_at}</div>
                  <div><strong>Self Pain Score:</strong> {patient.pain_scale}/10</div>
                  <div><strong>Recommended Dept:</strong> 🏥 {department}</div>
                </div>
              </div>

              {/* Chief Complaint */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0f172a' }}>
                  2. PRIMARY CHIEF COMPLAINT & EXTRACTED SYMPTOMS
                </h3>
                <div style={{ background: '#fff', border: '1.5px solid #0096c7', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, marginBottom: '10px' }}>
                  "{patient.complaint}"
                </div>

                {extractedSymptoms.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {extractedSymptoms.map((s, idx) => (
                      <span key={idx} style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', padding: '3px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Rationale */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#0f172a' }}>
                  3. CLINICAL REASONING & RISK ASSESSMENT
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                  {lang === 'hi' ? (ai.clinician_rationale_hi || patient.combined_rationale) : patient.combined_rationale}
                </p>
              </div>
            </>
          )}

          {/* Footer Disclaimer */}
          <div style={{ marginTop: '30px', paddingTop: '14px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
            {disclaimer} • Generated by Vitalis AI ER Triage Assistant
          </div>

        </div>
      </div>
    </div>
  );
}
