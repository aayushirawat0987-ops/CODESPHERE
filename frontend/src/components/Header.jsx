import React from 'react';

export default function Header({ onTriggerSurge, onClearQueue, isSurging, isRefreshing, currentView, onViewChange }) {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="logo-icon">✚</div>
        <div className="title-block">
          <div className="brand-row">
            <h1 className="brand-title">VITALIS <span className="brand-accent">/ TriageAI</span></h1>
            <span className="clinical-tag">Clinical Decision-Support</span>
          </div>
          <p className="brand-subtitle">
            AI-assisted urgency evaluation & clinical safety guardrails • Human staff retains 100% override control
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
      </div>

      <div className="header-actions">
        {currentView === 'triage' && (
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

