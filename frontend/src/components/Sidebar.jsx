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
    { id: 'triage', label: 'Dashboard & Queue', roles: ['doctor', 'nurse', 'admin', 'patient'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
      ),
    },
    { id: 'doctor_dashboard', label: 'Doctor Workspace', roles: ['doctor', 'admin'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
          <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
        </svg>
      ),
    },
    { id: 'patient_dashboard', label: 'Patient Portal', roles: ['patient', 'doctor', 'nurse', 'admin'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    { id: 'admin_dashboard', label: 'Admin Settings', roles: ['admin'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    },
    { type: 'divider' },
    { id: 'calendar', label: 'Calendar', roles: ['doctor', 'nurse', 'admin', 'patient'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    { id: 'analytics', label: 'Analytics', roles: ['doctor', 'nurse', 'admin'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
    { type: 'divider' },
    { id: 'voice', label: 'Voice AI', roles: ['doctor', 'nurse', 'admin', 'patient'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      ),
    },
    { id: 'face', label: 'Face Scanner', roles: ['doctor', 'nurse', 'admin', 'patient'],
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      ),
    },
  ];

  const allowedItems = menuItems.filter(item => item.type === 'divider' || item.roles.includes(role));

  return (
    <aside className={`sidebar-nav-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand & Toggle */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-inner">
          <div className="sidebar-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          {!isCollapsed && <span className="sidebar-brand-text">Vitalis</span>}
        </div>
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}>
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
      </div>

      {/* User Card */}
      {!isCollapsed && currentUser && (
        <div className="sidebar-user-card">
          <div className="sidebar-user-role-label">Active User</div>
          <div className="sidebar-user-name">{currentUser.name}</div>
          <div className="sidebar-user-role">● {currentUser.role}</div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav-list">
        {allowedItems.map((item, idx) => {
          if (item.type === 'divider') {
            return <div key={`div-${idx}`} className="sidebar-divider" />;
          }
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-${item.id}`}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onViewChange(item.id)}
              title={isCollapsed ? item.label : ''}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {isActive && !isCollapsed && <span className="sidebar-active-indicator" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout */}
      <div className="sidebar-bottom">
        <button className="sidebar-logout-btn" onClick={onLogout} title="Log Out">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
