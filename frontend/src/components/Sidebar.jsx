import React from 'react';

export default function Sidebar({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse
}) {
  const role = currentUser ? currentUser.role : 'guest';

  // Role-Specific Distinct Navigation Menus
  const PATIENT_MENU = [
    { id: 'pat_home', label: '🏠 Home Dashboard', icon: '🏠' },
    { id: 'pat_symptoms', label: '🩺 AI Symptom Check', icon: '🩺' },
    { id: 'voice', label: '🎙️ Voice Analysis', icon: '🎙️' },
    { id: 'face', label: '📷 Face Analysis', icon: '📷' },
    { id: 'calendar', label: '📅 My Appointments', icon: '📅' },
    { id: 'pat_reports', label: '📄 Reports & Prescriptions', icon: '📄' },
    { id: 'pat_profile', label: '👤 Personal Profile', icon: '👤' },
  ];

  const DOCTOR_MENU = [
    { id: 'doc_dash', label: '🏠 Doctor Dashboard', icon: '🩺' },
    { id: 'doc_patients', label: '📋 Assigned Patients', icon: '📋' },
    { id: 'doc_timeline', label: '📜 Medical History', icon: '📜' },
    { id: 'doc_ai_reports', label: '🤖 AI Differential Reports', icon: '🤖' },
    { id: 'doc_notes', label: '📝 Consultation Notes', icon: '📝' },
    { id: 'doc_prescriptions', label: '💊 Prescriptions Writer', icon: '💊' },
    { id: 'calendar', label: '📅 Appointment Schedule', icon: '📅' },
    { id: 'analytics', label: '📊 Hospital Analytics', icon: '📊' },
  ];

  const NURSE_MENU = [
    { id: 'nurse_dash', label: '🏠 Nurse Dashboard', icon: '🩺' },
    { id: 'nurse_registration', label: '📋 Patient Registration', icon: '📋' },
    { id: 'nurse_queue', label: '🚨 Live Triage Queue', icon: '🚨' },
    { id: 'nurse_vitals', label: '📊 Vital Signs Recording', icon: '📊' },
    { id: 'nurse_admissions', label: '🏥 Admissions & Discharges', icon: '🏥' },
    { id: 'calendar', label: '📅 Appointments Queue', icon: '📅' },
  ];

  const ADMIN_MENU = [
    { id: 'admin_dash', label: '🏠 Admin Command Center', icon: '⚙️' },
    { id: 'admin_patients', label: '👥 Patients Directory', icon: '👥' },
    { id: 'admin_doctors', label: '👨‍⚕️ Doctor Management', icon: '👨‍⚕️' },
    { id: 'admin_nurses', label: '🩺 Nurse Management', icon: '🩺' },
    { id: 'admin_depts', label: '🏥 Bed & Department Control', icon: '🏥' },
    { id: 'calendar', label: '📅 Appointments Overview', icon: '📅' },
    { id: 'analytics', label: '📊 System Analytics', icon: '📊' },
    { id: 'admin_logs', label: '📜 System Audit Trail', icon: '📜' },
  ];

  let activeMenu = PATIENT_MENU;
  if (role === 'doctor') activeMenu = DOCTOR_MENU;
  else if (role === 'nurse') activeMenu = NURSE_MENU;
  else if (role === 'admin') activeMenu = ADMIN_MENU;

  return (
    <aside style={{
      width: isCollapsed ? '70px' : '250px', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 900,
      boxShadow: '4px 0 20px rgba(0,0,0,0.15)', overflowX: 'hidden'
    }}>
      
      {/* Top Brand Logo & Collapse Toggle */}
      <div>
        <div style={{
          padding: '20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          {!isCollapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', background: '#0096c7',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', color: '#fff'
              }}>
                V
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>VITALIS</h3>
                <span style={{ fontSize: '0.68rem', color: '#00d4ff', fontWeight: 700, textTransform: 'uppercase' }}>{role} PORTAL</span>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
              borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: isCollapsed ? '0 auto' : '0'
            }}
          >
            {isCollapsed ? '⏩' : '⏪'}
          </button>
        </div>

        {/* User Status Card */}
        {!isCollapsed && currentUser && (
          <div style={{ padding: '12px 16px', margin: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Active Account</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00d4ff', fontWeight: 800, textTransform: 'capitalize', marginTop: '2px' }}>
              ● {role.toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 8px' }}>
          {activeMenu.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                title={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
                  borderRadius: '12px', border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: isActive ? 'linear-gradient(135deg, #0096c7, #0077b6)' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontWeight: isActive ? 900 : 600, fontSize: '0.85rem',
                  boxShadow: isActive ? '0 4px 12px rgba(0,150,199,0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>{item.icon}</span>
                {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Logout Button */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onLogout}
          title="Log Out"
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
            borderRadius: '12px', border: 'none', background: 'rgba(220,38,38,0.15)', color: '#fca5a5',
            fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>🚪</span>
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>

    </aside>
  );
}
