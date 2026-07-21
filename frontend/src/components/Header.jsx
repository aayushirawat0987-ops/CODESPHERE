import React from 'react';

export default function Header({
  onTriggerSurge,
  onClearQueue,
  isSurging,
  isRefreshing,
  currentView,
  onViewChange,
  onGoHome,
}) {
  const isKiosk = currentView === 'patient';

  return (
    <header className="app-header">
      <div className="header-left">
        <button
          id="header-home-btn"
          onClick={onGoHome}
          title="Back to home"
          style={{
            background: 'linear-gradient(135deg, #0096c7, #005b9f)',
            border: 'none',
            borderRadius: '12px',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: 900,
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(0,150,199,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          V
        </button>

        <div className="title-block">
          <div className="brand-row">
            <h1 className="brand-title">VITALIS <span className="brand-accent">/ TriageAI</span></h1>
            <span
              className={isKiosk ? 'clinical-tag btn-warning' : 'clinical-tag'}
              style={isKiosk ? { background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', border: '1px solid #d97706' } : {}}
            >
              {isKiosk ? 'Self-Check-In Kiosk' : 'Clinical Decision-Support'}
            </span>
          </div>
          <p className="brand-subtitle">
            AI-assisted urgency evaluation and clinical safety guardrails. Human staff retains full override control.
          </p>
        </div>
      </div>

      <div className="header-center" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto', marginRight: '20px' }}>
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
          className={`btn ${currentView === 'contact' ? 'btn-primary' : 'btn-secondary-ghost'}`}
          onClick={() => onViewChange('contact')}
        >
          Contact
        </button>
      </div>

      <div className="header-actions">
        {isKiosk ? (
          <button
            className="btn btn-warning"
            onClick={() => {
              const confirmExit = window.confirm('Are you a clinician? Click OK to exit Kiosk Mode and return to the Nurse Dashboard.');
              if (confirmExit) onViewChange('triage');
            }}
            title="Clinician password / verification gate"
          >
            Exit Kiosk (Staff Only)
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
              {isSurging ? 'Simulating Surge...' : 'Demo Surge'}
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
