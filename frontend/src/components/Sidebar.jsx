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

  const menuItems = [
    { id: 'triage', label: '🏠 Dashboard & Queue', icon: '🩺', roles: ['doctor', 'nurse', 'admin', 'patient'] },
    { id: 'doctor_dashboard', label: '👨‍⚕️ Doctor Workspace', icon: '🩺', roles: ['doctor', 'admin'] },
    { id: 'patient_dashboard', label: '👤 Patient Portal', icon: '👤', roles: ['patient', 'doctor', 'nurse', 'admin'] },
    { id: 'admin_dashboard', label: '⚙️ Admin Settings', icon: '⚙️', roles: ['admin'] },
    { id: 'calendar', label: '📅 Calendar & Appts', icon: '📅', roles: ['doctor', 'nurse', 'admin', 'patient'] },
    { id: 'analytics', label: '📊 Hospital Analytics', icon: '📊', roles: ['doctor', 'nurse', 'admin'] },
    { id: 'voice', label: '🎙️ Voice AI NLP', icon: '🎙️', roles: ['doctor', 'nurse', 'admin', 'patient'] },
    { id: 'face', label: '📷 Face Vision Scanner', icon: '📷', roles: ['doctor', 'nurse', 'admin', 'patient'] },
  ];

  const allowedItems = menuItems.filter(item => item.roles.includes(role));

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
                <span style={{ fontSize: '0.68rem', color: '#00d4ff', fontWeight: 700 }}>HOSPITAL OS</span>
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
            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Active User</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: '#fff', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#00d4ff', fontWeight: 800, textTransform: 'capitalize', marginTop: '2px' }}>
              ● {currentUser.role}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 8px' }}>
          {allowedItems.map(item => {
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
