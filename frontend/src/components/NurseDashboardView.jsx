import React, { useState } from 'react';
import NurseDashboard from './NurseDashboard';
import PatientForm from './PatientForm';

export default function NurseDashboardView({
  patients,
  onIntakeSubmit,
  isLoadingIntake,
  onOpenOverride,
  onOpenProfile,
  onOpenReport,
  lastUpdated,
  patientLang = 'en',
  staffLang = 'en',
  audienceMode = 'clinician'
}) {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'registration' | 'vitals' | 'admissions'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0077b6, #023e8a)', borderRadius: '16px', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
            🩺 Nurse Emergency Triage & Patient Care Workspace
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#90e0ef' }}>
            Walk-in Registration • Vital Signs Monitoring • Bed Admissions & Discharges
          </p>
        </div>

        {/* Action Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setActiveTab('queue')}
            style={{
              padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'queue' ? '#ffffff' : 'transparent', color: activeTab === 'queue' ? '#0077b6' : '#fff'
            }}
          >
            🚨 Live Triage Queue ({patients.length})
          </button>

          <button
            onClick={() => setActiveTab('registration')}
            style={{
              padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'registration' ? '#ffffff' : 'transparent', color: activeTab === 'registration' ? '#0077b6' : '#fff'
            }}
          >
            📋 Register Walk-in Patient
          </button>

          <button
            onClick={() => setActiveTab('admissions')}
            style={{
              padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem',
              background: activeTab === 'admissions' ? '#ffffff' : 'transparent', color: activeTab === 'admissions' ? '#0077b6' : '#fff'
            }}
          >
            🏥 Bed Admissions & Discharges
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeTab === 'queue' && (
        <NurseDashboard
          patients={patients}
          onOpenOverride={onOpenOverride}
          onOpenProfile={onOpenProfile}
          onOpenReport={onOpenReport}
          lastUpdated={lastUpdated}
          patientLang={patientLang}
          staffLang={staffLang}
          audienceMode={audienceMode}
        />
      )}

      {activeTab === 'registration' && (
        <div style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
          <PatientForm
            onSubmit={onIntakeSubmit}
            isLoading={isLoadingIntake}
            lang={staffLang}
          />
        </div>
      )}

      {activeTab === 'admissions' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
            🏥 Hospital Bed Admissions & Discharges Log
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#15803d', marginBottom: '8px' }}>
                🟢 Bed #102 - Occupied (David Ross)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                Admitted: 2026-07-23 14:30 • Emergency Department<br />
                Vitals: HR 98, Temp 102.4°F, SpO2 98%
              </div>
              <button className="btn btn-secondary-ghost" style={{ marginTop: '10px', fontSize: '0.78rem' }}>
                📄 Mark Discharged
              </button>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#dc2626', marginBottom: '8px' }}>
                🔴 Bed #104 - Critical ICU (James Vance)
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                Admitted: 2026-07-23 15:10 • Cardiac Care Unit<br />
                Vitals: HR 104, BP 146/92, SpO2 93%
              </div>
              <button className="btn btn-secondary-ghost" style={{ marginTop: '10px', fontSize: '0.78rem' }}>
                📄 Update Care Directives
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
