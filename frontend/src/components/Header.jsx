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
  isSidebarCollapsed
}) {
  const t = TRANSLATIONS[staffLang] || TRANSLATIONS.en;

  const roleEmoji = currentUser ? (
    currentUser.role === 'doctor' ? '👨‍⚕️' :
    currentUser.role === 'nurse' ? '🩺' :
    currentUser.role === 'patient' ? '👤' : '⚙️'
  ) : '👤';

  return (
    <header style={{
      marginLeft: isSidebarCollapsed ? '70px' : '250px',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      background: '#ffffff', borderBottom: '1px solid var(--border-color)',
      padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 850, boxShadow: '0 2px 10px rgba(0,0,0,0.04)', flexWrap: 'wrap', gap: '12px'
    }}>
      
      {/* Left Title & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
              VITALIS MEDICAL CENTER
            </h2>
            <span className="clinical-tag" style={{ background: audienceMode === 'patient' ? 'rgba(5,150,105,0.12)' : 'rgba(0,150,199,0.12)', color: audienceMode === 'patient' ? '#059669' : '#0077b6', fontSize: '0.72rem' }}>
              {audienceMode === 'patient' ? '👤 Patient View' : '🏥 Command Center'}
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
            Emergency Acute Triage & Hospital Management System
          </p>
        </div>
      </div>

      {/* Center Audience & View Mode Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '3px', borderRadius: '18px', border: '1px solid #cbd5e1' }}>
        <button
          onClick={() => onAudienceModeChange && onAudienceModeChange('clinician')}
          style={{
            padding: '4px 12px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
            background: audienceMode === 'clinician' ? '#0096c7' : 'transparent',
            color: audienceMode === 'clinician' ? '#fff' : '#64748b'
          }}
        >
          👨‍⚕️ Clinical Mode
        </button>
        <button
          onClick={() => onAudienceModeChange && onAudienceModeChange('patient')}
          style={{
            padding: '4px 12px', borderRadius: '14px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem',
            background: audienceMode === 'patient' ? '#059669' : 'transparent',
            color: audienceMode === 'patient' ? '#fff' : '#64748b'
          }}
        >
          👤 Patient Mode
        </button>
      </div>

      {/* Right Controls, Language & User Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0077b6' }}>🌐 Lang:</span>
          <select
            value={audienceMode === 'patient' ? patientLang : staffLang}
            onChange={(e) => {
              if (audienceMode === 'patient') onPatientLangChange && onPatientLangChange(e.target.value);
              else onStaffLangChange && onStaffLangChange(e.target.value);
            }}
            style={{ background: 'transparent', border: 'none', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', color: '#0f172a' }}
          >
            <option value="en">🇺🇸 EN</option>
            <option value="hi">🇮🇳 HI</option>
          </select>
        </div>

        {/* Surge Simulation Button */}
        <button
          className="btn btn-warning"
          onClick={onTriggerSurge}
          disabled={isSurging}
          style={{ fontSize: '0.78rem', padding: '6px 12px' }}
        >
          {isSurging ? '⏳ Simulating...' : t.demoSurge}
        </button>

        {/* User Account Badge Button */}
        <button
          onClick={onOpenAuth}
          style={{
            background: '#f8fafc', border: '1.5px solid #0096c7', color: '#0f172a',
            padding: '5px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <span>{roleEmoji}</span>
          <span>{currentUser ? currentUser.name : 'Log In'}</span>
        </button>
      </div>

    </header>
  );
}
