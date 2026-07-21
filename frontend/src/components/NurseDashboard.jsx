import React, { useState } from 'react';
import UrgencyBadge from './UrgencyBadge';

export default function NurseDashboard({ patients, onOpenOverride, lastUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.complaint.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterSeverity === 'high') return p.effective_urgency_score >= 8;
    if (filterSeverity === 'moderate') return p.effective_urgency_score >= 4 && p.effective_urgency_score < 8;
    if (filterSeverity === 'low') return p.effective_urgency_score < 4;
    return true;
  });

  const highCount = patients.filter((p) => p.effective_urgency_score >= 8).length;
  const modCount = patients.filter((p) => p.effective_urgency_score >= 4 && p.effective_urgency_score < 8).length;
  const lowCount = patients.filter((p) => p.effective_urgency_score < 4).length;

  return (
    <div className="card dashboard-card">
      <div className="dashboard-top-bar">
        <div className="title-with-count">
          <h2 className="card-title">
            <span className="icon">🩺</span> Live Triage Queue
          </h2>
          <span className="queue-count-pill">{patients.length} Active Patients</span>
        </div>
        <div className="last-sync-tag">
          Auto-refresh active • Updated {lastUpdated || 'just now'}
        </div>
      </div>

      {/* Metrics Counter Cards */}
      <div className="metrics-grid">
        <div 
          className={`metric-card metric-red ${filterSeverity === 'high' ? 'active' : ''}`}
          onClick={() => setFilterSeverity(filterSeverity === 'high' ? 'all' : 'high')}
        >
          <div className="metric-val">{highCount}</div>
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
      <div className="controls-row">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search by patient name or chief complaint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pill-group">
          <button 
            className={`filter-btn ${filterSeverity === 'all' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('all')}
          >
            All ({patients.length})
          </button>
          <button 
            className={`filter-btn filter-red ${filterSeverity === 'high' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('high')}
          >
            High ({highCount})
          </button>
          <button 
            className={`filter-btn filter-yellow ${filterSeverity === 'moderate' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('moderate')}
          >
            Moderate ({modCount})
          </button>
          <button 
            className={`filter-btn filter-green ${filterSeverity === 'low' ? 'active' : ''}`}
            onClick={() => setFilterSeverity('low')}
          >
            Low ({lowCount})
          </button>
        </div>
      </div>

      {/* Patients Queue List */}
      <div className="queue-container">
        {filteredPatients.length === 0 ? (
          <div className="empty-queue-state">
            <div className="empty-icon">🏥</div>
            <h3>No Triage Patients in Queue</h3>
            <p>Use the Patient Intake form or click "Trigger Demo Surge" above to populate realistic ER patient arrivals.</p>
          </div>
        ) : (
          filteredPatients.map((patient, index) => {
            let rowSeverity = 'row-green';
            if (patient.effective_urgency_score >= 8) rowSeverity = 'row-red';
            else if (patient.effective_urgency_score >= 4) rowSeverity = 'row-yellow';

            return (
              <div key={patient.id} className={`patient-row ${rowSeverity}`}>
                <div className="row-rank-col">
                  <span className="rank-num">#{index + 1}</span>
                  <span className="time-stamp">{patient.created_at}</span>
                </div>

                <div className="row-badge-col">
                  <UrgencyBadge 
                    score={patient.effective_urgency_score} 
                    isOverridden={patient.is_overridden} 
                  />
                </div>

                <div className="row-content-col">
                  <div className="patient-header-line">
                    <h3 className="patient-name-title">
                      {patient.name}
                      {(patient.age || patient.gender) && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({patient.age ? `${patient.age} y/o` : ''}
                          {patient.age && patient.gender ? ', ' : ''}
                          {patient.gender || ''})
                        </span>
                      )}
                    </h3>
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

                  {/* Detailed Clinical Profile Section */}
                  {(patient.medical_history || patient.allergies || patient.current_medications) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '8px 0', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      {patient.medical_history && (
                        <div>
                          <strong>Medical History:</strong> <span style={{ color: 'var(--text-primary)' }}>{patient.medical_history}</span>
                        </div>
                      )}
                      {patient.current_medications && (
                        <div>
                          <strong>Active Medications:</strong> <span style={{ color: 'var(--text-secondary)' }}>{patient.current_medications}</span>
                        </div>
                      )}
                      {patient.allergies && (
                        <div>
                          <strong>Allergies:</strong> <span style={{ color: '#b91c1c', fontWeight: 'bold' }}>{patient.allergies}</span>
                        </div>
                      )}
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
                    <span className="rationale-label">🧠 AI + Clinical Rule Rationale:</span>
                    <p className="rationale-text">{patient.combined_rationale}</p>
                  </div>

                  {/* Staff Override Detail line if applicable */}
                  {patient.is_overridden && patient.override && (
                    <div className="override-detail-banner">
                      <span className="override-icon">🔒</span>
                      <span>
                        <strong>Staff Override by {patient.override.staff_name}:</strong> Urgency locked at {patient.override.score}/10 — <em>"{patient.override.reason}"</em> ({patient.override.overridden_at})
                      </span>
                    </div>
                  )}
                </div>

                <div className="row-actions-col">
                  <button
                    className={`btn ${patient.is_overridden ? 'btn-override-active' : 'btn-override-default'}`}
                    onClick={() => onOpenOverride(patient)}
                    title="Staff manual override score"
                  >
                    {patient.is_overridden ? '✏️ Edit Override' : '⚡ Override Score'}
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
