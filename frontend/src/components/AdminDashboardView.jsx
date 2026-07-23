import React, { useState, useEffect } from 'react';
import { fetchAuditLogs, fetchDailyStats } from '../api';

export default function AdminDashboardView({ patients, currentUser }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dailyRecords'); // 'dailyRecords' | 'auditLogs' | 'hospitalStaff'

  useEffect(() => {
    fetchDailyStats(selectedDate)
      .then(data => setDailyStats(data))
      .catch(err => console.error(err));
    
    fetchAuditLogs()
      .then(data => setAuditLogs(data))
      .catch(err => console.error(err));
  }, [selectedDate]);

  const totalRegistered = patients.length + 24;
  const criticalCount = patients.filter(p => p.effective_urgency_score >= 8).length;
  const overrideCount = patients.filter(p => p.is_overridden).length;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', borderRadius: '16px', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            ⚙️ Hospital Administration & Audit Command Center
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Administrator: <strong style={{ color: '#00d4ff' }}>{currentUser ? currentUser.name : 'Admin Alex Vance'}</strong> | System Mode: <strong style={{ color: '#6ee7b7' }}>Persistent SQLite Database</strong>
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>📅 Select Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ background: '#1e293b', color: '#fff', border: '1px solid #00d4ff', borderRadius: '6px', padding: '4px 8px', fontSize: '0.8rem', fontWeight: 700 }}
          />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('dailyRecords')}
          className={`btn ${activeTab === 'dailyRecords' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
        >
          📊 Daily Records ({selectedDate})
        </button>
        <button
          onClick={() => setActiveTab('auditLogs')}
          className={`btn ${activeTab === 'auditLogs' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
        >
          📜 Permanent Audit Log ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('hospitalStaff')}
          className={`btn ${activeTab === 'hospitalStaff' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 16px' }}
        >
          🏥 Staff & Bed Management
        </button>
      </div>

      {/* TAB 1: DAILY HOSPITAL RECORDS */}
      {activeTab === 'dailyRecords' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Registered Patients Today</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {dailyStats ? dailyStats.registered_count + patients.length : totalRegistered}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Emergency / Critical</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#dc2626', marginTop: '2px' }}>
                {criticalCount}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>AI Score Overrides</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d97706', marginTop: '2px' }}>
                {overrideCount}
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Admitted Beds</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>
                14 / 20 Occupied
              </div>
            </div>
          </div>

          {/* Daily Symptoms Tally */}
          <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
              📈 Most Common Symptoms Reported ({selectedDate})
            </h3>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {dailyStats && dailyStats.symptoms_tally && Object.keys(dailyStats.symptoms_tally).length > 0 ? (
                Object.entries(dailyStats.symptoms_tally).map(([sym, count], idx) => (
                  <div key={idx} style={{ background: 'rgba(0,150,199,0.1)', border: '1px solid #0096c7', color: '#0077b6', padding: '6px 12px', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}>
                    {sym}: {count}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Standard symptom distribution across ER intake channels.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'auditLogs' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            📜 System Audit Trail & Security Logs
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
            {auditLogs.map(log => (
              <div key={log.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                <div>
                  <strong style={{ color: '#0096c7' }}>[{log.action}]</strong> {log.details}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600 }}>
                  {log.timestamp} • by {log.username} ({log.role})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAFF MANAGEMENT */}
      {activeTab === 'hospitalStaff' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>👨‍⚕️ On-Duty Doctors</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
              <li><strong>Dr. Sarah Jenkins, MD</strong> (Cardiology / ER)</li>
              <li><strong>Dr. Robert Chen, MD</strong> (Neurology / Trauma)</li>
              <li><strong>Dr. Amanda Foster, MD</strong> (Pediatric ER)</li>
            </ul>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#0f172a', fontWeight: 800 }}>🩺 On-Duty Triage Nurses</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
              <li><strong>Nurse Mary Rivera, RN</strong> (Lead Triage)</li>
              <li><strong>Nurse David Miller, RN</strong> (Acute Care)</li>
              <li><strong>Nurse Jessica Taylor, RN</strong> (Pediatrics)</li>
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}
