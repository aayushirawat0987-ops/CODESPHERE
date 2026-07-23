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
  return (
    <header className="app-header">
      <div className="header-left">
        <button
          id="header-home-btn"
          onClick={onGoHome}
          title="Back to home"
          className="header-logo-btn"
        >
          V
        </button>

        <div className="title-block">
          <div className="brand-row">
            <h1 className="brand-title">VITALIS <span className="brand-accent">/ TriageAI</span></h1>
            <span className="clinical-tag">Clinical Decision-Support</span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Live status pill — always visible */}
        <div className="live-status-pill">
          <span className={`pulse-dot ${isRefreshing ? 'refreshing' : ''}`}></span>
          <span className="live-text">Live Queue</span>
        </div>

        {/* Surge & Clear only on triage view */}
        {currentView === 'triage' && (
          <>
            <button
              className="btn btn-surge"
              onClick={onTriggerSurge}
              disabled={isSurging}
              title="Simulate rapid arrival of 9 realistic ER patients"
            >
              {isSurging ? 'Simulating...' : '⚡ Demo Surge'}
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

        {/* Notifications bell */}
        <button className="header-icon-btn" title="Notifications">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span className="header-notif-badge">3</span>
        </button>

        {/* Profile avatar */}
        <button className="header-avatar-btn" title="Profile">
          <span className="header-avatar-initials">DR</span>
        </button>
      </div>
    </header>
  );
}
