import React from 'react';
import { TRANSLATIONS } from '../languageDictionary';

export default function Header({
  currentUser,
  onOpenAuth,
  patientLang = 'en',
  onPatientLangChange,
  staffLang = 'en',
  onStaffLangChange,
  audienceMode = 'clinician',
  onAudienceModeChange,
  onTriggerSurge,
  onClearQueue,
  isSurging,
  isRefreshing,
  currentView,
  onViewChange,
  onGoHome,
}) {
  const isKiosk = currentView === 'patient';
  const t = TRANSLATIONS[staffLang] || TRANSLATIONS.en;

  const roleEmoji = currentUser ? (
    currentUser.role === 'doctor' ? '👨‍⚕️' :
    currentUser.role === 'nurse' ? '🩺' :
    currentUser.role === 'patient' ? '👤' : '⚙️'
  ) : '👤';

  return (
    <header className="app-header" style={{ flexDirection: 'column', gap: '12px', padding: '16px 24px' }}>
      
      {/* Top Main Row */}
      <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Left Brand Title */}
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          >
            V
          </button>

          <div className="title-block">
            <div className="brand-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="brand-title" style={{ margin: 0 }}>VITALIS <span className="brand-accent">/ TriageAI</span></h1>
              <span className="clinical-tag" style={{ background: audienceMode === 'patient' ? 'rgba(5,150,105,0.15)' : 'rgba(0,150,199,0.15)', color: audienceMode === 'patient' ? '#059669' : '#0077b6' }}>
                {audienceMode === 'patient' ? '👤 Patient View' : '🏥 Hospital System'}
              </span>
            </div>
            <p className="brand-subtitle" style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Persistent SQLite Database Hospital Platform • Bilingual (English & हिन्दी).
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="header-center" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn ${currentView === 'triage' ? 'btn-primary' : 'btn-secondary-ghost'}`}
            onClick={() => onViewChange('triage')}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            Triage Queue
          </button>
          
          {currentUser && currentUser.role === 'doctor' && (
            <button
              className={`btn ${currentView === 'doctor_dashboard' ? 'btn-primary' : 'btn-secondary-ghost'}`}
              onClick={() => onViewChange('doctor_dashboard')}
              style={{ fontSize: '0.82rem', padding: '6px 12px', background: currentView === 'doctor_dashboard' ? '#0096c7' : 'rgba(0,150,199,0.12)', color: '#0077b6' }}
            >
              👨‍⚕️ Doctor Portal
            </button>
          )}

          {currentUser && currentUser.role === 'patient' && (
            <button
              className={`btn ${currentView === 'patient_dashboard' ? 'btn-primary' : 'btn-secondary-ghost'}`}
              onClick={() => onViewChange('patient_dashboard')}
              style={{ fontSize: '0.82rem', padding: '6px 12px', background: currentView === 'patient_dashboard' ? '#059669' : 'rgba(5,150,105,0.12)', color: '#059669' }}
            >
              👤 Patient Portal
            </button>
          )}

          {currentUser && currentUser.role === 'admin' && (
            <button
              className={`btn ${currentView === 'admin_dashboard' ? 'btn-primary' : 'btn-secondary-ghost'}`}
              onClick={() => onViewChange('admin_dashboard')}
              style={{ fontSize: '0.82rem', padding: '6px 12px', background: currentView === 'admin_dashboard' ? '#334155' : 'rgba(51,65,85,0.12)', color: '#334155' }}
            >
              ⚙️ Admin Portal
            </button>
          )}

          <button
            className={`btn ${currentView === 'analytics' ? 'btn-primary' : 'btn-secondary-ghost'}`}
            onClick={() => onViewChange('analytics')}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            📊 Analytics
          </button>
          <button
            className={`btn ${currentView === 'calendar' ? 'btn-primary' : 'btn-secondary-ghost'}`}
            onClick={() => onViewChange('calendar')}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            📅 Calendar
          </button>
          <button
            className={`btn ${currentView === 'voice' ? 'btn-primary' : 'btn-secondary-ghost'}`}
            onClick={() => onViewChange('voice')}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            🎙️ Voice AI
          </button>
          <button
            className={`btn ${currentView === 'face' ? 'btn-primary' : 'btn-secondary-ghost'}`}
            onClick={() => onViewChange('face')}
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            📷 Face Vision
          </button>
        </div>

        {/* Right Actions */}
        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          
          {/* User Auth Badge */}
          <button
            onClick={onOpenAuth}
            style={{
              background: '#1e293b', border: '1px solid #00d4ff', color: '#fff',
              padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span>{roleEmoji}</span>
            <span>{currentUser ? currentUser.name : 'Switch Role / Login'}</span>
          </button>

          <button
            className="btn btn-warning"
            onClick={onTriggerSurge}
            disabled={isSurging}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {isSurging ? '⏳ Simulating...' : t.demoSurge}
          </button>

          <button
            className="btn btn-secondary-ghost"
            onClick={onClearQueue}
            title="Clear all patients"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            {t.clearQueue}
          </button>
        </div>
      </div>

      {/* Bottom Language & Audience Selector Bar */}
      <div style={{
        display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
        paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.3)', borderRadius: '8px', padding: '8px 12px'
      }}>
        
        {/* Audience Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)' }}>View Mode:</span>
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: '20px', padding: '2px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => onAudienceModeChange && onAudienceModeChange('clinician')}
              style={{
                padding: '4px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
                background: audienceMode === 'clinician' ? '#0096c7' : 'transparent',
                color: audienceMode === 'clinician' ? '#fff' : '#94a3b8'
              }}
            >
              👨‍⚕️ Doctor / Nurse Mode
            </button>
            <button
              onClick={() => onAudienceModeChange && onAudienceModeChange('patient')}
              style={{
                padding: '4px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
                background: audienceMode === 'patient' ? '#059669' : 'transparent',
                color: audienceMode === 'patient' ? '#fff' : '#94a3b8'
              }}
            >
              👤 Patient-Friendly Mode
            </button>
          </div>
        </div>

        {/* Independent Language Pickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          {/* Patient Language Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d4ff' }}>👤 Patient Language:</span>
            <select
              value={patientLang}
              onChange={(e) => onPatientLangChange && onPatientLangChange(e.target.value)}
              style={{
                background: '#1e293b', color: '#fff', border: '1px solid #00d4ff', borderRadius: '8px',
                padding: '3px 8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Staff Language Selector (Independent) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b' }}>🩺 Staff Language:</span>
            <select
              value={staffLang}
              onChange={(e) => onStaffLangChange && onStaffLangChange(e.target.value)}
              style={{
                background: '#1e293b', color: '#fff', border: '1px solid #f59e0b', borderRadius: '8px',
                padding: '3px 8px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

      </div>
    </header>
  );
}
