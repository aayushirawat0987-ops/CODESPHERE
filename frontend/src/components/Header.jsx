import React from 'react';

export default function Header({ onTriggerSurge, onClearQueue, isSurging, isRefreshing, currentView, onViewChange }) {
  const isKiosk = currentView === 'patient';

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">✚</div>
        <div className="title-block">
          <div className="brand-row">
            <h1 className="brand-title">VITALIS <span className="brand-accent">/ TriageAI</span></h1>
            <span className={isKiosk ? "clinical-tag btn-warning" : "clinical-tag"} style={isKiosk ? { background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', border: '1px solid #d97706' } : {}}>
              {isKiosk ? "Self-Check-In Kiosk" : "Clinical Decision-Support"}
            </span>
          </div>
          <p className="brand-subtitle">
            {isKiosk 
              ? "Distraction-free patient registration portal • Confidential & HIPAA secure intake" 
              : "AI-assisted urgency evaluation & clinical safety guardrails • Human staff retains override control"}
          </p>
        </div>
      </div>

      <div className="header-center" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', marginRight: '20px' }}>
        {!isKiosk ? (
          <>
            <button 
              className={`btn ${currentView === 'triage' ? 'btn-primary' : 'btn-secondary-ghost'}`}
              onClick={() => onViewChange('triage')}
            >
              Triage Dashboard
            </button>
            <button 
              className={`btn ${currentView === 'calendar' ? 'btn-primary' : 'btn-secondary-ghost'}`}
              onClick={() => onViewChange('calendar')}
            >
              Patient Calendar
            </button>
            <button 
              className="btn btn-secondary-ghost"
              onClick={() => onViewChange('patient')}
              title="Open standalone patient self-registration check-in kiosk"
            >
              🖥️ Patient Kiosk
            </button>
          </>
        ) : (
          <div style={{ fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
            Patient Self-Check-In Portal
          </div>
        )}
      </div>

      <div className="header-actions">
        {isKiosk ? (
          <button 
            className="btn btn-warning" 
            onClick={() => {
              const confirmExit = window.confirm("Are you a clinician? Click OK to exit Kiosk Mode and return to the Nurse Dashboard.");
              if (confirmExit) onViewChange('triage');
            }}
            title="Clinician password / verification gate"
          >
            🔒 Exit Kiosk (Staff Only)
          </button>
        ) : currentView === 'triage' && (
          <>
            <div className="live-status-pill">
              <span className={`pulse-dot ${isRefreshing ? 'refreshing' : ''}`}></span>
              <span className="live-text">Live Queue</span>
            </div>

            <button 
              className="btn btn-surge" 
              onClick={onTriggerSurge} 
              disabled={isSurging}
              title="Simulate rapid arrival of 9 realistic ER patients"
            >
              {isSurging ? '⚡ Simulating Surge...' : '⚡ Trigger Demo Surge'}
            </button>

            <button 
              className="btn btn-secondary-ghost" 
              onClick={onClearQueue}
              title="Reset triage queue for a fresh demo run"
            >
              Reset Queue
            </button>
          </>
        )}
      </div>
    </header>
  );
}
