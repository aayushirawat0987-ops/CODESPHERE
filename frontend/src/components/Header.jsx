import React from 'react';

export default function Header({
  currentUser,
  onOpenAuth,
  audienceMode = 'clinician',
  onAudienceModeChange,
  onTriggerSurge,
  onClearQueue,
  isSurging,
  isRefreshing,
  currentView,
  onViewChange,
  isSidebarCollapsed
}) {
  const roleEmoji = currentUser ? (
    currentUser.role === 'doctor' ? '👨‍⚕️' :
    currentUser.role === 'nurse' ? '🩺' :
    currentUser.role === 'patient' ? '👤' : '⚙️'
  ) : '👤';

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="title-block">
          <div className="brand-row">
            <h1 className="brand-title">VITALIS <span className="brand-accent">/ TriageAI</span></h1>
            <span className="clinical-tag" style={{
              background: audienceMode === 'patient' ? 'rgba(5,150,105,0.12)' : undefined,
              color: audienceMode === 'patient' ? '#059669' : undefined
            }}>
              {audienceMode === 'patient' ? '👤 Patient View' : '🏥 Command Center'}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Audience Mode Switcher */}
        <div className="header-mode-switcher">
          <button
            className={`mode-btn ${audienceMode === 'clinician' ? 'active' : ''}`}
            onClick={() => onAudienceModeChange && onAudienceModeChange('clinician')}
          >
            👨‍⚕️ Clinical
          </button>
          <button
            className={`mode-btn ${audienceMode === 'patient' ? 'active patient' : ''}`}
            onClick={() => onAudienceModeChange && onAudienceModeChange('patient')}
          >
            👤 Patient
          </button>
        </div>

        {/* Live status */}
        <div className="live-status-pill">
          <span className={`pulse-dot ${isRefreshing ? 'refreshing' : ''}`}></span>
          <span className="live-text">Live</span>
        </div>

        {/* Surge — triage view only */}
        {currentView === 'triage' && (
          <button
            className="btn btn-surge"
            onClick={onTriggerSurge}
            disabled={isSurging}
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            {isSurging ? '⏳ Simulating...' : '⚡ Demo Surge'}
          </button>
        )}

        {/* Notifications bell */}
        <button className="header-icon-btn" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="header-notif-badge">3</span>
        </button>

        {/* User badge */}
        <button className="header-avatar-btn" onClick={onOpenAuth} title={currentUser ? currentUser.name : 'Log In'}>
          <span className="header-avatar-initials">
            {currentUser ? currentUser.name.charAt(0).toUpperCase() : roleEmoji}
          </span>
        </button>
      </div>
    </header>
  );
}
