import React from 'react';

const NAV_ITEMS = [
  { id: 'triage',   label: '🏥 Triage',   title: 'Triage Dashboard' },
  { id: 'calendar', label: '📅 Calendar',  title: 'Patient Calendar' },
  { id: 'voice',    label: '🎙️ Voice AI',  title: 'Voice Symptom Analyzer' },
];

export default function Header({ onTriggerSurge, onClearQueue, isSurging, isRefreshing, currentView, onViewChange, onGoHome }) {
  return (
    <header className="app-header">
      <div className="header-left">
        {/* Home/Logo button */}
        <button
          id="header-home-btn"
          onClick={onGoHome}
          title="Back to home"
          style={{
            background: 'linear-gradient(135deg, #0096c7, #005b9f)',
            border: 'none', borderRadius: '12px',
            width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', fontWeight: 900, color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 0 15px rgba(0,150,199,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >✚</button>

        <div className="title-block">
          <div className="brand-row">
            <h1 className="brand-title">VITALIS <span className="brand-accent">/ TriageAI</span></h1>
            <span className="clinical-tag">Clinical Decision-Support</span>
          </div>
          <p className="brand-subtitle">
            AI-assisted urgency evaluation &amp; clinical safety guardrails • Human staff retains 100% override control
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}-btn`}
            className={`btn ${currentView === item.id ? 'btn-primary' : ''}`}
            style={{
              padding: '8px 18px',
              fontSize: '0.85rem',
              background: currentView === item.id ? 'linear-gradient(135deg, #0096c7, #005b9f)' : 'transparent',
              color: currentView === item.id ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px',
              boxShadow: currentView === item.id ? '0 2px 10px rgba(0,91,159,0.3)' : 'none',
            }}
            onClick={() => onViewChange(item.id)}
            title={item.title}
          >
            {item.label}
          </button>
        ))}
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
              {isSurging ? '⚡ Simulating Surge...' : '⚡ Demo Surge'}
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
