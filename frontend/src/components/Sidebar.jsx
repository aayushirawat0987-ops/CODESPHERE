import React from 'react';

/* ── SVG ICON LIBRARY ── */
const Icons = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  doctor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21v-2a4 4 0 014-4h4"/><circle cx="9" cy="7" r="4"/>
      <path d="M16 11v4m-2-2h4"/><circle cx="16" cy="19" r="2"/>
    </svg>
  ),
  patient: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  admin: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  analytics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  voice: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
    </svg>
  ),
  face: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  pharmacy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 9h9m-4.5-4.5v9"/>
    </svg>
  ),
  contact: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  collapse: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/>
    </svg>
  ),
  expand: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/>
    </svg>
  ),
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
};

/* ── MENU CONFIGURATION ── */
const MENU_SECTIONS = [
  {
    label: 'CLINICAL',
    items: [
      { id: 'triage', label: 'Dashboard & Queue', icon: 'dashboard', roles: ['doctor', 'nurse', 'admin', 'patient'] },
      { id: 'doctor_dashboard', label: 'Doctor Workspace', icon: 'doctor', roles: ['doctor', 'admin'] },
      { id: 'patient_dashboard', label: 'Patient Portal', icon: 'patient', roles: ['patient', 'doctor', 'nurse', 'admin'] },
      { id: 'pharmacy', label: 'Pharmacy Orders', icon: 'pharmacy', roles: ['doctor', 'nurse', 'admin'] },
      { id: 'admin_dashboard', label: 'Admin Settings', icon: 'admin', roles: ['admin'] },
    ]
  },
  {
    label: 'AI TOOLS',
    items: [
      { id: 'voice', label: 'Voice AI Analysis', icon: 'voice', roles: ['doctor', 'nurse', 'admin', 'patient'] },
      { id: 'face', label: 'Face Vision Scanner', icon: 'face', roles: ['doctor', 'nurse', 'admin', 'patient'] },
    ]
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'calendar', label: 'Calendar & Appts', icon: 'calendar', roles: ['doctor', 'nurse', 'admin', 'patient'] },
      { id: 'analytics', label: 'Hospital Analytics', icon: 'analytics', roles: ['doctor', 'nurse', 'admin'] },
      { id: 'contact', label: 'Contact Doctor', icon: 'contact', roles: ['doctor', 'nurse', 'admin', 'patient'] },
    ]
  }
];

export default function Sidebar({
  currentView,
  onViewChange,
  currentUser,
  onLogout,
  isCollapsed,
  onToggleCollapse
}) {
  const role = currentUser ? currentUser.role : 'guest';

  const roleColor = {
    doctor: '#0ea5e9',
    nurse: '#10b981',
    patient: '#8b5cf6',
    admin: '#f59e0b'
  }[role] || '#94a3b8';

  const roleEmoji = {
    doctor: '👨‍⚕️',
    nurse: '🩺',
    patient: '👤',
    admin: '⚙️'
  }[role] || '👤';

  return (
    <aside className={`vs-sidebar ${isCollapsed ? 'vs-sidebar--collapsed' : ''}`}>
      {/* ── BRAND HEADER ── */}
      <div className="vs-sidebar__brand">
        <div className="vs-sidebar__brand-inner" onClick={onToggleCollapse} style={{ cursor: 'pointer' }}>
          <div className="vs-sidebar__logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.9)"/>
              <path d="M2 17l10 5 10-5" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!isCollapsed && (
            <div className="vs-sidebar__brand-text">
              <span className="vs-sidebar__brand-name">VITALIS</span>
              <span className="vs-sidebar__brand-sub">Hospital OS</span>
            </div>
          )}
        </div>
        <button
          className="vs-sidebar__toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? Icons.expand : Icons.collapse}
        </button>
      </div>

      {/* ── USER CARD ── */}
      {currentUser && (
        <div className={`vs-sidebar__user ${isCollapsed ? 'vs-sidebar__user--mini' : ''}`}>
          <div className="vs-sidebar__user-avatar" style={{ background: roleColor }}>
            {isCollapsed ? (
              <span style={{ fontSize: '0.85rem' }}>{roleEmoji}</span>
            ) : (
              currentUser.name.charAt(0).toUpperCase()
            )}
          </div>
          {!isCollapsed && (
            <div className="vs-sidebar__user-info">
              <div className="vs-sidebar__user-name">{currentUser.name}</div>
              <div className="vs-sidebar__user-role" style={{ color: roleColor }}>
                <span className="vs-sidebar__user-dot" style={{ background: roleColor }} />
                {currentUser.role}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NAVIGATION ── */}
      <nav className="vs-sidebar__nav">
        {MENU_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => item.roles.includes(role));
          if (visibleItems.length === 0) return null;

          return (
            <div className="vs-sidebar__section" key={section.label}>
              {!isCollapsed && (
                <div className="vs-sidebar__section-label">{section.label}</div>
              )}
              {isCollapsed && <div className="vs-sidebar__divider" />}
              {visibleItems.map(item => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    className={`vs-sidebar__item ${isActive ? 'vs-sidebar__item--active' : ''}`}
                    onClick={() => onViewChange(item.id)}
                    title={item.label}
                  >
                    {isActive && <div className="vs-sidebar__item-indicator" />}
                    <span className="vs-sidebar__item-icon">
                      {Icons[item.icon] || Icons.dashboard}
                    </span>
                    {!isCollapsed && (
                      <span className="vs-sidebar__item-label">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── FOOTER ── */}
      <div className="vs-sidebar__footer">
        {!isCollapsed && (
          <div className="vs-sidebar__status">
            <span className="vs-sidebar__status-dot" />
            <span className="vs-sidebar__status-text">System Online</span>
          </div>
        )}
        <button className="vs-sidebar__logout" onClick={onLogout} title="Log Out">
          {Icons.logout}
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
