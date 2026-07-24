import React, { useState, useEffect } from 'react';
import { fetchAuditLogs, fetchDailyStats, registerUser } from '../api';
import PatientQRCode from './PatientQRCode';

export default function AdminDashboardView({ patients, currentUser, currentView = 'admin_dash' }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStats, setDailyStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Sync tab with sidebar currentView prop
  const getInitialTab = (view) => {
    if (view === 'admin_doctors') return 'doctors';
    if (view === 'admin_nurses') return 'nurses';
    if (view === 'admin_patients') return 'patients';
    if (view === 'admin_depts') return 'depts';
    if (view === 'admin_logs') return 'auditLogs';
    return 'dailyRecords';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab(currentView));

  useEffect(() => {
    setActiveTab(getInitialTab(currentView));
  }, [currentView]);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');

  // New Staff Registration State
  const [newStaffRole, setNewStaffRole] = useState('doctor');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPassword, setNewStaffPassword] = useState('password123');
  const [newStaffDept, setNewStaffDept] = useState('Cardiology / ER');
  const [regMsg, setRegMsg] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Mock Doctors & Nurses List for Management
  const [doctorsList, setDoctorsList] = useState([
    { id: 'doc_1', name: 'Dr. Sarah Jenkins, MD', username: 'doctor', dept: 'Cardiology / ER', status: 'On Duty', patientsAssigned: 4, phone: '+1 (555) 234-5678' },
    { id: 'doc_2', name: 'Dr. Robert Chen, MD', username: 'dr_chen', dept: 'Neurology / Trauma', status: 'On Duty', patientsAssigned: 2, phone: '+1 (555) 345-6789' },
    { id: 'doc_3', name: 'Dr. Amanda Foster, MD', username: 'dr_foster', dept: 'Pediatric ER', status: 'Available', patientsAssigned: 1, phone: '+1 (555) 456-7890' }
  ]);

  const [nursesList, setNursesList] = useState([
    { id: 'nur_1', name: 'Nurse Mary Rivera, RN', username: 'nurse', dept: 'Emergency Triage', status: 'On Shift', shift: 'Day Shift (07:00 - 15:00)', phone: '+1 (555) 876-5432' },
    { id: 'nur_2', name: 'Nurse David Miller, RN', username: 'nur_david', dept: 'Acute Care', status: 'On Shift', shift: 'Day Shift (07:00 - 15:00)', phone: '+1 (555) 765-4321' },
    { id: 'nur_3', name: 'Nurse Jessica Taylor, RN', username: 'nur_jessica', dept: 'Pediatrics', status: 'Off Shift', shift: 'Night Shift (23:00 - 07:00)', phone: '+1 (555) 654-3210' }
  ]);

  const [bedsList, setBedsList] = useState([
    { id: 'bed_101', room: 'ER Bay 1', bed: 'Bed 101', status: 'Occupied', patientName: 'David Ross', patId: 'VIT-2026-000001', dept: 'Emergency' },
    { id: 'bed_102', room: 'ER Bay 2', bed: 'Bed 102', status: 'Available', patientName: '-', patId: '-', dept: 'Emergency' },
    { id: 'bed_201', room: 'ICU Room 1', bed: 'Bed 201', status: 'Occupied', patientName: 'James Vance', patId: 'VIT-2026-000002', dept: 'ICU / Cardiac' },
    { id: 'bed_202', room: 'ICU Room 2', bed: 'Bed 202', status: 'Occupied', patientName: 'Chloe Bennett', patId: 'VIT-2026-000003', dept: 'ICU' },
    { id: 'bed_301', room: 'Ward 3A', bed: 'Bed 301', status: 'Available', patientName: '-', patId: '-', dept: 'General Ward' }
  ]);

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
      
      if (newStaffRole === 'doctor') {
        setDoctorsList(prev => [...prev, { id: `doc_${Date.now()}`, name: res.user.name, username: res.user.username, dept: newStaffDept, status: 'On Duty', patientsAssigned: 0, phone: res.user.phone || '+1 (555) 000-1122' }]);
      } else if (newStaffRole === 'nurse') {
        setNursesList(prev => [...prev, { id: `nur_${Date.now()}`, name: res.user.name, username: res.user.username, dept: newStaffDept, status: 'On Shift', shift: 'Day Shift', phone: res.user.phone || '+1 (555) 000-1122' }]);
      }

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

  const filteredPatients = patients.filter(p => {
    const patIdStr = (p.patient_id || p.id || '').toLowerCase();
    return p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           patIdStr.includes(searchTerm.toLowerCase()) ||
           p.complaint.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
            Administrator: <strong style={{ color: '#00d4ff' }}>{currentUser ? currentUser.name : 'Admin Alex Vance'}</strong> | Mode: <strong style={{ color: '#6ee7b7' }}>Persistent SQLite Database</strong>
          </p>
        </div>

        {/* Date Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>📅 Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            onClick={e => e.target.showPicker && e.target.showPicker()}
            style={{
              background: '#1e293b', color: '#ffffff', border: '1.5px solid #00d4ff',
              borderRadius: '6px', padding: '6px 10px', fontSize: '0.85rem', fontWeight: 800,
              cursor: 'pointer', colorScheme: 'dark'
            }}
          />
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('dailyRecords')}
          className={`btn ${activeTab === 'dailyRecords' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          📊 Overview ({selectedDate})
        </button>

        <button
          onClick={() => setActiveTab('doctors')}
          className={`btn ${activeTab === 'doctors' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          👨‍⚕️ Doctor Management ({doctorsList.length})
        </button>

        <button
          onClick={() => setActiveTab('nurses')}
          className={`btn ${activeTab === 'nurses' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          🩺 Nurse Management ({nursesList.length})
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`btn ${activeTab === 'patients' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          👥 Patients Directory ({patients.length})
        </button>

        <button
          onClick={() => setActiveTab('depts')}
          className={`btn ${activeTab === 'depts' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          🏥 Bed & Department Control
        </button>

        <button
          onClick={() => setActiveTab('auditLogs')}
          className={`btn ${activeTab === 'auditLogs' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          style={{ fontSize: '0.82rem', padding: '8px 14px' }}
        >
          📜 Audit Trail ({auditLogs.length})
        </button>
      </div>

      {/* VIEW 1: DAILY HOSPITAL RECORDS & OVERVIEW */}
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

      {/* VIEW 2: DOCTOR MANAGEMENT WORKSPACE */}
      {activeTab === 'doctors' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 900, color: '#0369a1' }}>
              ➕ Register & Onboard New Doctor
            </h3>
            {regMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', background: regMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: regMsg.startsWith('✅') ? '#166534' : '#b91c1c' }}>
                {regMsg}
              </div>
            )}
            <form onSubmit={handleAdminCreateStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Doctor Name</label>
                <input required className="input-field" type="text" placeholder="Dr. Robert Chen, MD" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Username</label>
                <input required className="input-field" type="text" placeholder="dr_chen" value={newStaffUsername} onChange={e => setNewStaffUsername(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Department</label>
                <input className="input-field" type="text" placeholder="Neurology / ER" value={newStaffDept} onChange={e => setNewStaffDept(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={regLoading} style={{ height: '40px' }}>
                {regLoading ? 'Registering...' : '➕ Register Doctor'}
              </button>
            </form>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
              👨‍⚕️ Official Medical Staff Directory ({doctorsList.length} Doctors)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {doctorsList.map(doc => (
                <div key={doc.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>{doc.name}</span>
                    <span style={{ background: '#059669', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      ● {doc.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0096c7', fontWeight: 700, marginTop: '4px' }}>
                    Department: {doc.dept}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                    Username: <strong>{doc.username}</strong> • Phone: {doc.phone}<br />
                    Active Patient Queue: <strong>{doc.patientsAssigned} Patients</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: NURSE MANAGEMENT WORKSPACE */}
      {activeTab === 'nurses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: '#f0f9ff', border: '1.5px solid #7dd3fc', borderRadius: '16px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 900, color: '#0369a1' }}>
              ➕ Register & Onboard New Nurse
            </h3>
            {regMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700, marginBottom: '12px', background: regMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: regMsg.startsWith('✅') ? '#166534' : '#b91c1c' }}>
                {regMsg}
              </div>
            )}
            <form onSubmit={(e) => { setNewStaffRole('nurse'); handleAdminCreateStaff(e); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Nurse Name</label>
                <input required className="input-field" type="text" placeholder="Nurse Jessica Taylor, RN" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Username</label>
                <input required className="input-field" type="text" placeholder="nur_jessica" value={newStaffUsername} onChange={e => setNewStaffUsername(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Department</label>
                <input className="input-field" type="text" placeholder="Emergency Triage" value={newStaffDept} onChange={e => setNewStaffDept(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={regLoading} style={{ height: '40px' }}>
                {regLoading ? 'Registering...' : '➕ Register Nurse'}
              </button>
            </form>
          </div>

          <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
              🩺 Registered Nursing Staff Directory ({nursesList.length} Nurses)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {nursesList.map(nur => (
                <div key={nur.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>{nur.name}</span>
                    <span style={{ background: '#0096c7', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                      ● {nur.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0077b6', fontWeight: 700, marginTop: '4px' }}>
                    Unit: {nur.dept}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                    Username: <strong>{nur.username}</strong> • Phone: {nur.phone}<br />
                    Shift Assignment: <strong>{nur.shift}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PATIENTS DIRECTORY WORKSPACE */}
      {activeTab === 'patients' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
              👥 Permanent Patients Database ({filteredPatients.length} Patients)
            </h3>

            <input
              type="text"
              className="input-field"
              placeholder="Search by Patient ID (VIT-2026-XXXXXX) or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ maxWidth: '300px', fontSize: '0.82rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredPatients.map(p => {
              const patId = p.patient_id || `VIT-2026-000${p.id}`;
              return (
                <div key={p.id} style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '14px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <PatientQRCode patientId={patId} size={75} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#0096c7', fontFamily: 'monospace' }}>
                      {patId}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
                      {p.age} yrs • {p.gender} • Intake: {p.created_at}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600, marginTop: '4px' }}>
                      Complaint: "{p.complaint}"
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 5: BED & DEPARTMENT CONTROL WORKSPACE */}
      {activeTab === 'depts' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
            🏥 Hospital Department & Bed Occupancy Management
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {bedsList.map(bed => (
              <div key={bed.id} style={{ background: '#f8fafc', border: `1.5px solid ${bed.status === 'Occupied' ? '#ef4444' : '#10b981'}`, borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.95rem', color: '#0f172a' }}>{bed.room} - {bed.bed}</span>
                  <span style={{ background: bed.status === 'Occupied' ? '#dc2626' : '#059669', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 800 }}>
                    {bed.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0077b6', fontWeight: 700, marginTop: '4px' }}>
                  Unit: {bed.dept}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                  Current Patient: <strong>{bed.patientName}</strong> ({bed.patId})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 6: AUDIT TRAIL LOGS */}
      {activeTab === 'auditLogs' && (
        <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
            📜 Permanent System Audit Trail & Security Logs
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

    </div>
  );
}
