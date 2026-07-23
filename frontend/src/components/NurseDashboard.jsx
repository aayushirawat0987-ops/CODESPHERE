import React, { useState } from 'react';
import UrgencyBadge from './UrgencyBadge';

export default function NurseDashboard({ patients, onOpenOverride, onOpenProfile, onOpenReport, lastUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterDept, setFilterDept] = useState('all');

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.complaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterSeverity === 'high') return p.effective_urgency_score >= 8;
    if (filterSeverity === 'moderate') return p.effective_urgency_score >= 4 && p.effective_urgency_score < 8;
    if (filterSeverity === 'low') return p.effective_urgency_score < 4;

    if (filterDept === 'trauma') return p.effective_urgency_score >= 8;
    if (filterDept === 'cardiology') return (p.complaint || '').toLowerCase().includes('chest') || (p.complaint || '').toLowerCase().includes('heart');
    if (filterDept === 'urgent') return p.effective_urgency_score >= 5 && p.effective_urgency_score < 8;

    return true;
  });

  const criticalCount = patients.filter((p) => p.effective_urgency_score >= 8).length;
  const modCount = patients.filter((p) => p.effective_urgency_score >= 4 && p.effective_urgency_score < 8).length;
  const lowCount = patients.filter((p) => p.effective_urgency_score < 4).length;

  const totalToday = patients.length + 18;
  const avgWaitTime = patients.length > 0 ? Math.round(patients.reduce((acc, p) => acc + (10 - p.effective_urgency_score) * 6, 0) / patients.length) : 12;

  const getAlertIcon = (complaint = '', flags = []) => {
    const c = complaint.toLowerCase();
    const flagText = flags.join(' ').toLowerCase();
    if (c.includes('stroke') || c.includes('speech') || flagText.includes('fast alert') || c.includes('droop')) return { icon: '🧠', label: 'Stroke Alert', color: '#dc2626' };
    if (c.includes('chest') || c.includes('cardiac') || c.includes('heart')) return { icon: '❤️', label: 'Cardiac Event', color: '#dc2626' };
    if (flagText.includes('sepsis') || (c.includes('fever') && c.includes('heart'))) return { icon: '🚨', label: 'Sepsis Risk', color: '#d97706' };
    if (c.includes('breath') || c.includes('choking') || c.includes('respiratory')) return { icon: '🫁', label: 'Respiratory Distress', color: '#0077b6' };
    if (c.includes('bleed') || c.includes('fracture') || c.includes('gunshot') || c.includes('trauma')) return { icon: '🩸', label: 'Acute Trauma', color: '#b91c1c' };
    return null;
  };

  return (
    <div className="card dashboard-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* COMMAND CENTER SUMMARY BAR */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '16px', padding: '20px', color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🏥</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
                HOSPITAL COMMAND CENTER & EMERGENCY TRIAGE
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Live ER Surveillance • Auto-refresh active • Updated {lastUpdated || 'just now'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00d4ff' }}>DYNAMIC AI ACTIVE</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Patients Today</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginTop: '2px' }}>{totalToday}</div>
          </div>

          <div style={{ background: criticalCount > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.06)', border: criticalCount > 0 ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: criticalCount > 0 ? '#fca5a5' : '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Critical Cases</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: criticalCount > 0 ? '#ef4444' : '#fff', marginTop: '2px' }}>{criticalCount}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Queue Waiting</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#00d4ff', marginTop: '2px' }}>{patients.length}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Avg Wait Time</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', marginTop: '2px' }}>{avgWaitTime}m</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>On-Duty Staff</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>14 / 18</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Bed Occupancy</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#a855f7', marginTop: '2px' }}>84%</div>
          </div>
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="metrics-grid">
        <div 
          className={`metric-card metric-red ${filterSeverity === 'high' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
        >
          <div className="metric-val">{criticalCount}</div>
          <div className="metric-label">High / Critical (8-10)</div>
        </div>

        <div 
          className={`metric-card metric-yellow ${filterSeverity === 'moderate' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'moderate' ? 'all' : 'moderate')}
        >
          <div className="metric-val">{modCount}</div>
          <div className="metric-label">Moderate (4-7)</div>
        </div>

        <div 
          className={`metric-card metric-green ${filterSeverity === 'low' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'low' ? 'all' : 'low')}
        >
          <div className="metric-val">{lowCount}</div>
          <div className="metric-label">Low Urgency (1-3)</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="controls-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: '240px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search by patient name, ID (#), or symptoms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pill-group">
          <button 
            className={`filter-btn ${filterSeverity === 'all' && filterDept === 'all' ? 'active' : ''}`}
            onClick={() => { setFilterSeverity('all'); setFilterDept('all'); }}
          >
            All Patients ({patients.length})
          </button>
        </div>
      </div>

      {/* Triage Queue List */}
      <div className="patient-list">
        {filteredPatients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🩺</span>
            <h3>No Triage Patients Match Filter</h3>
            <p>Try clearing your search query or click "Demo Surge" above to populate incoming emergency patients.</p>
          </div>
        ) : (
          filteredPatients.map((patient, index) => {
            let rowSeverity = 'row-green';
            if (patient.effective_urgency_score >= 8) rowSeverity = 'row-red';
            else if (patient.effective_urgency_score >= 4) rowSeverity = 'row-yellow';

            const alertBadge = getAlertIcon(patient.complaint, patient.all_red_flags || []);
            const waitMin = Math.max(0, Math.round((10 - patient.effective_urgency_score) * 7.5));
            const ai = patient.ai_reasoning || {};
            const symptoms = ai.extracted_symptoms || [];
            const concerns = ai.possible_clinical_concerns || [];
            const dept = ai.recommended_department || (patient.effective_urgency_score >= 8 ? 'Emergency Department' : 'General Triage');

            return (
              <div key={patient.id} className={`patient-row ${rowSeverity}`} style={{ transition: 'all 0.3s ease' }}>
                <div className="row-rank-col">
                  <span className="rank-num">#{index + 1}</span>
                  <span className="time-stamp">{patient.created_at}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', marginTop: '4px' }}>
                    #{patient.id}
                  </span>
                </div>

                <div className="row-badge-col">
                  <UrgencyBadge 
                    score={patient.effective_urgency_score} 
                    isOverridden={patient.is_overridden} 
                  />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: patient.effective_urgency_score >= 8 ? '#dc2626' : '#d97706', textAlign: 'center' }}>
                    {patient.effective_urgency_score >= 8 ? '🚨 PRIORITY 1' : `${waitMin}m wait`}
                  </span>
                </div>

                <div className="row-content-col">
                  <div className="patient-header-line">
                    <h3 className="patient-name-title" onClick={() => onOpenProfile(patient)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ textDecoration: 'underline' }}>{patient.name}</span>
                      {(patient.age || patient.gender) && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                          ({patient.age ? `${patient.age} y/o` : ''}
                          {patient.age && patient.gender ? ', ' : ''}
                          {patient.gender || ''})
                        </span>
                      )}
                    </h3>

                    {/* Department Badge */}
                    <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', padding: '2px 8px', borderRadius: '10px', fontSize: '0.73rem', fontWeight: 700 }}>
                      🏥 {dept}
                    </span>

                    {/* Alert Type Badge */}
                    {alertBadge && (
                      <span style={{ background: 'rgba(220,38,38,0.1)', border: `1px solid ${alertBadge.color}`, color: alertBadge.color, padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{alertBadge.icon}</span>
                        {alertBadge.label}
                      </span>
                    )}

                    <div className="vitals-chips">
                      <span className="chip chip-pain">Pain: {patient.pain_scale}/10</span>
                      {patient.vitals?.heart_rate && (
                        <span className={`chip ${patient.vitals.heart_rate > 100 ? 'chip-warning' : ''}`}>
                          HR: {patient.vitals.heart_rate} bpm
                        </span>
                      )}
                      {patient.vitals?.temperature && (
                        <span className={`chip ${patient.vitals.temperature > 100.4 ? 'chip-warning' : ''}`}>
                          Temp: {patient.vitals.temperature}°F
                        </span>
                      )}
                      {patient.vitals?.blood_pressure && (
                        <span className="chip">BP: {patient.vitals.blood_pressure}</span>
                      )}
                    </div>
                  </div>

                  <p className="patient-complaint">
                    <strong>Chief Complaint:</strong> "{patient.complaint}"
                  </p>

                  {/* Extracted Symptoms Tags */}
                  {symptoms.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', margin: '4px 0 6px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Symptoms:</span>
                      {symptoms.map((s, sIdx) => (
                        <span key={sIdx} style={{ background: 'rgba(0,150,199,0.08)', border: '1px solid rgba(0,150,199,0.25)', color: '#0077b6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Possible Concerns (Non-definitive) */}
                  {concerns.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#475569', background: '#f8fafc', borderLeft: '3px solid #0096c7', padding: '4px 10px', borderRadius: '0 6px 6px 0', margin: '4px 0 6px' }}>
                      <strong>AI Observations:</strong> {concerns.slice(0, 2).join(' • ')}
                    </div>
                  )}

                  {/* Red Flags List */}
                  {patient.all_red_flags && patient.all_red_flags.length > 0 && (
                    <div className="red-flags-block">
                      <span className="flags-header">🚩 Red Flags Detected:</span>
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
                  <div className="rationale-box">
                    <span className="rationale-label">🧠 AI + Safety Rationale:</span>
                    <p className="rationale-text">{patient.combined_rationale}</p>
                  </div>

                  {/* Staff Override Detail line */}
                  {patient.is_overridden && patient.override && (
                    <div className="override-detail-banner">
                      <span className="override-icon">🔒</span>
                      <span>
                        <strong>Staff Override by {patient.override.staff_name}:</strong> Urgency locked at {patient.override.score}/10 — <em>"{patient.override.reason}"</em> ({patient.override.overridden_at})
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions Column */}
                <div className="row-actions-col" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    className="btn btn-secondary-ghost"
                    onClick={() => onOpenProfile(patient)}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    👤 Full Profile
                  </button>

                  <button
                    className="btn btn-secondary-ghost"
                    onClick={() => onOpenReport(patient)}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    🖨️ Report
                  </button>

                  <button
                    className={`btn ${patient.is_overridden ? 'btn-override-active' : 'btn-override-default'}`}
                    onClick={() => onOpenOverride(patient)}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {patient.is_overridden ? '✏️ Edit Score' : '⚡ Override'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
