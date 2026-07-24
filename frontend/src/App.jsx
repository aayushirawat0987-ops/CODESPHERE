import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ProtectedComponent from './components/ProtectedComponent';
import PatientForm from './components/PatientForm';
import NurseDashboard from './components/NurseDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import OverrideModal from './components/OverrideModal';
import PatientProfileModal from './components/PatientProfileModal';
import MedicalReportModal from './components/MedicalReportModal';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import VoiceAnalyzer from './components/VoiceAnalyzer';
import FaceAnalyzer from './components/FaceAnalyzer';
import ContactPage from './components/ContactPage';
import DoctorDashboardView from './components/DoctorDashboardView';
import PatientDashboardView from './components/PatientDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import LandingPage from './components/LandingPage';
import { fetchPatients, submitIntake, applyOverride, triggerSurge, clearQueue, fetchCalendarPatients } from './api';
import './App.css';

export default function App() {
  // 'landing' | 'triage' | 'analytics' | 'calendar' | 'voice' | 'face' | 'contact'
  const [appState, setAppState] = useState('landing');
  const [currentView, setCurrentView] = useState('triage');
  const [showContactOnLanding, setShowContactOnLanding] = useState(false);
  const [backendError, setBackendError] = useState(false);

  // Auth & user state
  const [currentUser, setCurrentUser] = useState(null);

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Language & audience mode
  const [patientLang, setPatientLang] = useState('en');
  const [staffLang, setStaffLang] = useState('en');
  const [audienceMode, setAudienceMode] = useState('clinician');

  const [patients, setPatients] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingIntake, setIsLoadingIntake] = useState(false);
  const [isSurging, setIsSurging] = useState(false);

  // Modals state
  const [overridePatient, setOverridePatient] = useState(null);
  const [profilePatient, setProfilePatient] = useState(null);
  const [reportPatient, setReportPatient] = useState(null);

  const [lastUpdated, setLastUpdated] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [calendarPatients, setCalendarPatients] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) { }
  };

  const loadPatients = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchPatients();
      setPatients(data);
      setLastUpdated(new Date().toLocaleTimeString());
      setBackendError(false);
    } catch (err) {
      console.error('Failed polling patients:', err);
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError') || err.message.includes('fetch')) {
        setBackendError(true);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const loadCalendarPatients = useCallback(async () => {
    try {
      const data = await fetchCalendarPatients();
      setCalendarPatients(data);
    } catch (err) {
      console.error('Failed fetching calendar patients:', err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    loadPatients();
    loadCalendarPatients();
    const interval = setInterval(loadPatients, 3000);
    return () => clearInterval(interval);
  }, [loadPatients, loadCalendarPatients, currentUser]);

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleIntakeSubmit = async (patientData, resetForm) => {
    setIsLoadingIntake(true);
    try {
      const newRecord = await submitIntake(patientData);
      showToast(`✅ Intake processed for ${newRecord.name} (Assigned ID: ${newRecord.patient_id})`);
      resetForm();
      loadPatients();
    } catch (err) {
      alert(`Intake Submission Failed: ${err.message}`);
    } finally {
      setIsLoadingIntake(false);
    }
  };

  const handleTriggerSurge = async () => {
    setIsSurging(true);
    playAlertChime();
    showToast('🚨 Emergency Surge Simulation Started!');
    try {
      await triggerSurge();
      setTimeout(() => {
        loadPatients();
        setIsSurging(false);
      }, 3500);
    } catch (err) {
      alert(`Surge simulation failed: ${err.message}`);
      setIsSurging(false);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Are you sure you want to clear the entire triage queue?')) {
      try {
        await clearQueue();
        showToast('🗑️ Triage Queue Cleared');
        loadPatients();
      } catch (err) {
        alert(`Clear queue failed: ${err.message}`);
      }
    }
  };

  const handleSaveOverride = async (overrideData) => {
    if (!overridePatient) return;
    try {
      await applyOverride(overridePatient.id, overrideData);
      showToast(`🔒 Staff override saved for ${overridePatient.name} (New Score: ${overrideData.score}/10)`);
      setOverridePatient(null);
      loadPatients();
    } catch (err) {
      alert(`Override failed: ${err.message}`);
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    showToast(`🔑 Welcome, ${user.name} (${user.role.toUpperCase()})`);

    // Role-based initial view routing
    if (user.role === 'doctor') setCurrentView('doctor_dashboard');
    else if (user.role === 'patient') { setCurrentView('patient_dashboard'); setAudienceMode('patient'); }
    else if (user.role === 'admin') setCurrentView('admin_dashboard');
    else setCurrentView('triage');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAppState('landing');
    showToast('🚪 Logged out successfully');
  };

  // If on landing page, show LandingPage
  if (appState === 'landing') {
    return (
      <>
        <LandingPage
          onEnter={() => setAppState('app')}
          onContact={() => { setAppState('contact'); setCurrentView('contact'); }}
        />
        {toastMessage && (
          <div className="toast-banner">
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  // Contact page accessible without login
  if (appState === 'contact' && !currentUser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f0ff 50%, #f0f7ff 100%)',
        padding: '0'
      }}>
        {/* Simple Header for Contact Page */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 32px',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,150,199,0.1)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
               onClick={() => setAppState('landing')}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0096c7, #0077b6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '1.1rem', color: '#fff'
            }}>V</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
                VITALIS <span style={{ color: '#0096c7' }}>/ TriageAI</span>
              </h2>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setAppState('landing')}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: '1px solid #cbd5e1',
                background: '#fff', color: '#334155', fontWeight: 700, fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
            >← Back to Home</button>
            <button
              onClick={() => setAppState('app')}
              style={{
                padding: '8px 18px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #0096c7, #0077b6)', color: '#fff',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >Open Dashboard →</button>
          </div>
        </header>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 20px' }}>
          <ContactPage onSubmitSuccess={(message) => showToast(message)} />
        </div>
        {toastMessage && (
          <div className="toast-banner">
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // If unauthenticated, show modern hospital login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const mainMarginLeft = isSidebarCollapsed ? '70px' : '250px';

  return (
    <div className="app-container">
      {/* Emergency Surge Alert Banner */}
      {isSurging && (
        <div style={{
          background: 'linear-gradient(90deg, #dc2626, #b91c1c, #dc2626)',
          color: '#fff', padding: '10px 20px', textAlign: 'center', fontWeight: 900,
          fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase',
          boxShadow: '0 4px 20px rgba(220,38,38,0.5)', animation: 'pulse 1s infinite'
        }}>
          🚨 EMERGENCY SURGE IN PROGRESS — 9 HIGH-ACUITY PATIENTS ARRIVING IN QUEUE
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Top Navigation Bar */}
      <div style={{ marginLeft: mainMarginLeft, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Header
          currentUser={currentUser}
          onOpenAuth={handleLogout}
          audienceMode={audienceMode}
          onAudienceModeChange={setAudienceMode}
          onTriggerSurge={handleTriggerSurge}
          onClearQueue={handleClearQueue}
          isSurging={isSurging}
          isRefreshing={isRefreshing}
          currentView={currentView}
          onViewChange={handleViewChange}
          isSidebarCollapsed={isSidebarCollapsed}
          onGoHome={() => setAppState('landing')}
        />

        {/* Main Workspace Views */}
        <main className="main-content">
          {/* Backend Connection Error Banner */}
          {backendError && (
            <div style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
              border: '1px solid #f59e0b',
              borderRadius: '14px',
              padding: '20px 24px',
              margin: '0 0 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 4px 12px rgba(245,158,11,0.15)',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem' }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem', marginBottom: '4px' }}>
                  Backend Server Not Reachable
                </div>
                <div style={{ color: '#78350f', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Could not connect to the backend at <code style={{ background: 'rgba(0,0,0,0.08)', padding: '2px 6px', borderRadius: '4px' }}>http://localhost:8000</code>.
                  Please start the backend server by running <code style={{ background: 'rgba(0,0,0,0.08)', padding: '2px 6px', borderRadius: '4px' }}>node server.js</code> in the <strong>backend</strong> directory.
                </div>
              </div>
              <button
                onClick={() => { setBackendError(false); loadPatients(); }}
                style={{
                  padding: '8px 16px', borderRadius: '10px', border: 'none',
                  background: '#f59e0b', color: '#fff', fontWeight: 700,
                  fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                }}
              >🔄 Retry</button>
            </div>
          )}
          {currentView === 'triage' && (
            <div className="grid-layout">
              <aside className="column-intake">
                <PatientForm onSubmit={handleIntakeSubmit} isLoading={isLoadingIntake} />
              </aside>
              <section className="column-dashboard">
                <NurseDashboard
                  patients={patients}
                  onOpenOverride={(p) => setOverridePatient(p)}
                  onOpenProfile={(p) => setProfilePatient(p)}
                  onOpenReport={(p) => setReportPatient(p)}
                  lastUpdated={lastUpdated}
                />
              </section>
            </div>
          )}

          {currentView === 'doctor_dashboard' && (
            <DoctorDashboardView patients={patients} />
          )}

          {currentView === 'patient_dashboard' && (
            <PatientDashboardView currentUser={currentUser} patients={patients} />
          )}

          {currentView === 'admin_dashboard' && (
            <AdminDashboardView />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView patients={patients} />
          )}

          {currentView === 'calendar' && (
            <CalendarView
              patients={calendarPatients}
              onPatientsUpdated={loadCalendarPatients}
            />
          )}

          {currentView === 'voice' && (
            <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <VoiceAnalyzer />
            </div>
          )}

          {currentView === 'face' && (
            <div className="card" style={{ maxWidth: '950px', margin: '0 auto' }}>
              <FaceAnalyzer />
            </div>
          )}

          {currentView === 'contact' && (
            <ContactPage
              onSubmitSuccess={(message) => showToast(message)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {overridePatient && (
        <OverrideModal
          patient={overridePatient}
          onClose={() => setOverridePatient(null)}
          onSave={handleSaveOverride}
        />
      )}

      {profilePatient && (
        <PatientProfileModal
          patient={profilePatient}
          onClose={() => setProfilePatient(null)}
          onOpenOverride={(p) => { setProfilePatient(null); setOverridePatient(p); }}
          onOpenReport={(p) => { setProfilePatient(null); setReportPatient(p); }}
          patientLang={patientLang}
          staffLang={staffLang}
          audienceMode={audienceMode}
        />
      )}

      {reportPatient && (
        <MedicalReportModal
          patient={reportPatient}
          onClose={() => setReportPatient(null)}
          patientLang={patientLang}
          staffLang={staffLang}
          audienceMode={audienceMode}
        />
      )}

      {/* Notification Toast Banner */}
      {toastMessage && (
        <div className="toast-banner">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
