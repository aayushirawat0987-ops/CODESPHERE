import React, { useState, useEffect } from 'react';
import { fetchAuditLogs, fetchDailyStats, registerUser } from '../api';

export default function AdminDashboardView({ patients, currentUser }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dailyRecords'); // 'dailyRecords' | 'auditLogs' | 'hospitalStaff'

  // New Staff Registration State
  const [newStaffRole, setNewStaffRole] = useState('doctor');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('password123');
  const [newStaffDept, setNewStaffDept] = useState('Cardiology / ER');
  const [regMsg, setRegMsg] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    fetchDailyStats(selectedDate)
      .then(data => setDailyStats(data))
      .catch(err => console.error(err));
    
    fetchAuditLogs()
      .then(data => setAuditLogs(data))
      .catch(err => console.error(err));
  }, [selectedDate]);

  const handleAdminCreateStaff = async (e) => {
    e.preventDefault();
    if (!newStaffName || !newStaffUsername) return;

    setRegLoading(true);
    setRegMsg('');
    try {
      const res = await registerUser({
        username: newStaffUsername.trim(),
        password: newStaffPassword,
        name: newStaffName.trim(),
        role: newStaffRole,
        department: newStaffDept.trim()
      });
      setRegMsg(`✅ Account created for ${res.user.name} (${newStaffRole.toUpperCase()})!`);
      setNewStaffName('');
      setNewStaffUsername('');
      const updatedLogs = await fetchAuditLogs();
      setAuditLogs(updatedLogs);
    } catch (err) {
      setRegMsg(`❌ ${err.message}`);
    } finally {
      setRegLoading(false);
    }
  };

  const totalRegistered = patients.length + 24;
  const criticalCount = patients.filter(p => p.effective_urgency_score >= 8).length;
  const overrideCount = patients.filter(p => p.is_overridden).length;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #334155)', borderRadius: '16px', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            ⚙️ Hospital Administration & Staff Control Center
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
          🏥 Staff Registration & Bed Control
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

      {/* TAB 3: STAFF REGISTRATION & MANAGEMENT */}
      {activeTab === 'hospitalStaff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Admin Register Staff Form */}
          <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 900, color: '#0369a1' }}>
              ➕ Register New Doctor, Nurse, or Admin Staff Account
            </h3>

            {regMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', background: regMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: regMsg.startsWith('✅') ? '#166534' : '#b91c1c', border: regMsg.startsWith('✅') ? '1px solid #86efac' : '1px solid #fca5a5' }}>
                {regMsg}
              </div>
            )}

            <form onSubmit={handleAdminCreateStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Staff Role</label>
                <select className="input-field" value={newStaffRole} onChange={e => setNewStaffRole(e.target.value)}>
                  <option value="doctor">👨‍⚕️ Doctor</option>
                  <option value="nurse">🩺 Nurse</option>
                  <option value="admin">⚙️ Administrator</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dr. Robert Chen, MD"
                  value={newStaffName}
                  onChange={e => setNewStaffName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Username</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. dr_chen"
                  value={newStaffUsername}
                  onChange={e => setNewStaffUsername(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Default Password</label>
                <input
                  type="text"
                  className="input-field"
                  value={newStaffPassword}
                  onChange={e => setNewStaffPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Department</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Neurology / Trauma"
                  value={newStaffDept}
                  onChange={e => setNewStaffDept(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={regLoading} style={{ height: '40px' }}>
                {regLoading ? 'Creating...' : '➕ Register Staff'}
              </button>
            </form>
          </div>

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
        </div>
      )}

    </div>
  );
}
