import React, { useState } from 'react';
import UrgencyBadge from './UrgencyBadge';
import PatientQRCode from './PatientQRCode';
import { TRANSLATIONS, speakText } from '../languageDictionary';

export default function NurseDashboard({
  patients,
  onOpenOverride,
  onOpenProfile,
  onOpenReport,
  lastUpdated,
  patientLang = 'en',
  staffLang = 'en',
  audienceMode = 'clinician'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [speakingId, setSpeakingId] = useState(null);

  const lang = audienceMode === 'patient' ? patientLang : staffLang;
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const filteredPatients = patients.filter((p) => {
    const patIdStr = (p.patient_id || p.id || '').toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patIdStr.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterSeverity === 'high') return p.effective_urgency_score >= 8;
    if (filterSeverity === 'moderate') return p.effective_urgency_score >= 4 && p.effective_urgency_score < 8;
    if (filterSeverity === 'low') return p.effective_urgency_score < 4;

    return true;
  });

  const criticalCount = patients.filter((p) => p.effective_urgency_score >= 8).length;
  const modCount = patients.filter((p) => p.effective_urgency_score >= 4 && p.effective_urgency_score < 8).length;
  const lowCount = patients.filter((p) => p.effective_urgency_score < 4).length;

  const totalToday = patients.length + 18;
  const avgWaitTime = patients.length > 0 ? Math.round(patients.reduce((acc, p) => acc + (10 - p.effective_urgency_score) * 6, 0) / patients.length) : 12;

  const handleSpeakSummary = (p) => {
    const ai = p.ai_reasoning || {};
    const textToSpeak = lang === 'hi'
      ? (ai.patient_summary_hi || `आपने बताया कि आप महसूस कर रहे हैं: ${p.complaint}। हमारी मेडिकल टीम आपकी देखरेख के लिए तैयार है।`)
      : (ai.patient_summary_en || `You reported feeling ${p.complaint}. Our healthcare team is reviewing your symptoms to care for you.`);
    
    setSpeakingId(p.id);
    speakText(textToSpeak, lang);
    setTimeout(() => setSpeakingId(null), 7000);
  };

  return (
    <div className="card dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* COMMAND CENTER SUMMARY BAR */}
      <div style={{
        background: audienceMode === 'patient' ? 'linear-gradient(135deg, #065f46, #047857)' : 'linear-gradient(135deg, #0f172a, #1e293b)',
        borderRadius: '16px', padding: '20px', color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>{audienceMode === 'patient' ? '👤' : '🏥'}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
                {audienceMode === 'patient' ? t.patientViewBanner : t.commandCenter}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                {t.liveSurveillance} • Auto Patient ID Generation (VIT-2026-XXXXXX)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7' }}>
              DYNAMIC AI ACTIVE
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        {audienceMode === 'clinician' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.patientsToday}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{totalToday}</div>
            </div>

            <div style={{ background: criticalCount > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)', border: criticalCount > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: criticalCount > 0 ? '#fca5a5' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.criticalCases}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: criticalCount > 0 ? '#ef4444' : '#fff', marginTop: '2px' }}>{criticalCount}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.queueWaiting}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00d4ff', marginTop: '2px' }}>{patients.length}</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{t.avgWaitTime}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>{avgWaitTime}m</div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Metrics */}
      <div className="metrics-grid">
        <div 
          className={`metric-card metric-red ${filterSeverity === 'high' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
        >
          <div className="metric-val">{criticalCount}</div>
          <div className="metric-label">{t.criticalCases} (8-10)</div>
        </div>

        <div 
          className={`metric-card metric-yellow ${filterSeverity === 'moderate' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'moderate' ? 'all' : 'moderate')}
        >
          <div className="metric-val">{modCount}</div>
          <div className="metric-label">{lang === 'hi' ? 'मध्यम जोखिम (4-7)' : 'Moderate (4-7)'}</div>
        </div>

        <div 
          className={`metric-card metric-green ${filterSeverity === 'low' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'low' ? 'all' : 'low')}
        >
          <div className="metric-val">{lowCount}</div>
          <div className="metric-label">{lang === 'hi' ? 'सामान्य स्थिति (1-3)' : 'Low Urgency (1-3)'}</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="controls-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: '240px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search by Patient ID (VIT-2026-XXXXXX), name, or symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Triage Queue List */}
      <div className="patient-list">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🩺</span>
            <h3>{t.noPatientsMatch}</h3>
          </div>
        ) : (
          filteredPatients.map((patient, index) => {
            let rowSeverity = 'row-green';
            if (patient.effective_urgency_score >= 8) rowSeverity = 'row-red';
            else if (patient.effective_urgency_score >= 4) rowSeverity = 'row-yellow';

            const waitMin = Math.max(0, Math.round((10 - patient.effective_urgency_score) * 7.5));
            const ai = patient.ai_reasoning || {};
            const formattedPatId = patient.patient_id || `VIT-2026-000${patient.id}`;

            const patSummary = lang === 'hi'
              ? (ai.patient_summary_hi || `आपने बताया कि आप महसूस कर रहे हैं: "${patient.complaint}"। हमारी टीम आपकी देखरेख कर रही है।`)
              : (ai.patient_summary_en || `You reported feeling: "${patient.complaint}". Our healthcare team is reviewing your symptoms to care for you.`);
            
            const patSteps = lang === 'hi'
              ? (ai.patient_next_steps_hi && ai.patient_next_steps_hi.length > 0 ? ai.patient_next_steps_hi : ["कृपया शांति से आराम करें।", "यदि दर्द बढ़े तो नर्स को तुरंत बताएं।"])
              : (ai.patient_next_steps_en && ai.patient_next_steps_en.length > 0 ? ai.patient_next_steps_en : ["Please rest quietly until called by the medical team.", "Tell a nurse if your symptoms change."]);

            return (
              <div key={patient.id} className={`patient-row ${rowSeverity}`} style={{ transition: 'all 0.3s ease' }}>
                <div className="row-rank-col">
                  <span className="rank-num">#{index + 1}</span>
                  <span className="time-stamp">{patient.created_at}</span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#0096c7', marginTop: '4px', fontFamily: 'monospace' }}>
                    {formattedPatId}
                  </span>
                </div>

                <div className="row-badge-col">
                  <UrgencyBadge 
                    score={patient.effective_urgency_score} 
                    isOverridden={patient.is_overridden} 
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: patient.effective_urgency_score >= 8 ? '#dc2626' : '#d97706', textAlign: 'center' }}>
                    {patient.effective_urgency_score >= 8 ? t.priority1 : `${waitMin}m ${t.estimatedWait}`}
                  </span>
                </div>

                <div className="row-content-col">
                  <div className="patient-header-line">
                    <h3 className="patient-name-title" onClick={() => onOpenProfile(patient)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ textDecoration: 'underline' }}>{patient.name}</span>
                      <span style={{ background: '#0096c7', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 900, fontFamily: 'monospace' }}>
                        {formattedPatId}
                      </span>
                    </h3>

                    {/* Speech TTS Audio Button */}
                    <button
                      onClick={() => handleSpeakSummary(patient)}
                      style={{
                        background: speakingId === patient.id ? '#059669' : '#0096c7',
                        color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '14px',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {speakingId === patient.id ? t.speaking : t.listenAudio}
                    </button>
                  </div>

                  {/* PATIENT-FRIENDLY VIEW MODE */}
                  {audienceMode === 'patient' ? (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px', marginTop: '6px' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#166534', marginBottom: '4px' }}>
                        {t.whatAiNoticed}
                      </div>
                      <p style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#14532d', lineHeight: '1.5', fontWeight: 600 }}>
                        {patSummary}
                      </p>

                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#166534', marginBottom: '4px' }}>
                        {t.whatYouShouldDo}
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#14532d', lineHeight: '1.5' }}>
                        {patSteps.map((step, sIdx) => (
                          <li key={sIdx}><strong>{step}</strong></li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    /* CLINICIAN PROFESSIONAL VIEW MODE */
                    <>
                      <p className="patient-complaint" style={{ marginTop: '4px' }}>
                        <strong>{t.chiefComplaintLabel}</strong> "{patient.complaint}"
                      </p>

                      {/* Extracted Symptoms Chips */}
                      {ai.extracted_symptoms && ai.extracted_symptoms.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '4px 0' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{t.symptomsLabel}</span>
                          {ai.extracted_symptoms.map((s, sIdx) => (
                            <span key={sIdx} style={{ background: 'rgba(0,150,199,0.08)', border: '1px solid rgba(0,150,199,0.25)', color: '#0077b6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Red Flags List */}
                      {patient.all_red_flags && patient.all_red_flags.length > 0 && (
                        <div className="red-flags-block" style={{ marginTop: '6px' }}>
                          <span className="flags-header">{t.redFlagsLabel}</span>
                          <div className="flags-list">
                            {patient.all_red_flags.map((flag, idx) => (
                              <span key={idx} className="red-flag-pill">
                                {flag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Clinical Rationale */}
                      <div className="rationale-box" style={{ marginTop: '6px' }}>
                        <span className="rationale-label">{t.rationaleLabel}</span>
                        <p className="rationale-text">
                          {lang === 'hi' ? (ai.clinician_rationale_hi || patient.combined_rationale) : patient.combined_rationale}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Actions Column */}
                <div className="row-actions-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="btn btn-secondary-ghost"
                    onClick={() => onOpenProfile(patient)}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {t.fullProfile}
                  </button>

                  <button
                    className="btn btn-secondary-ghost"
                    onClick={() => onOpenReport(patient)}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {t.report}
                  </button>

                  {audienceMode === 'clinician' && (
                    <button
                      className={`btn ${patient.is_overridden ? 'btn-override-active' : 'btn-override-default'}`}
                      onClick={() => onOpenOverride(patient)}
                      style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    >
                      {patient.is_overridden ? t.editScore : t.override}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
