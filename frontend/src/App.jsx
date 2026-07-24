import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ProtectedComponent from './components/ProtectedComponent';
import PatientForm from './components/PatientForm';
import NurseDashboard from './components/NurseDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import Sidebar from './components/Sidebar';
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
import { fetchPatients, submitIntake, applyOverride, triggerSurge, clearQueue, fetchCalendarPatients } from './api';
import './App.css';

export default function App() {
  // 'landing' | 'triage' | 'analytics' | 'calendar' | 'voice' | 'face' | 'contact'
  const [appState, setAppState] = useState('landing');
  const [currentView, setCurrentView] = useState('triage');
  const [showContactOnLanding, setShowContactOnLanding] = useState(false);

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
    } catch (err) {
      console.error('Failed polling patients:', err);
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
    showToast('🚪 Logged out successfully');
  };

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

      {/* Top Navigation Bar */}
      <Header
        onTriggerSurge={handleTriggerSurge}
        onClearQueue={handleClearQueue}
        isSurging={isSurging}
        isRefreshing={isRefreshing}
        currentView={currentView}
        onViewChange={handleViewChange}
        onGoHome={() => setAppState('landing')}
      />

      {/* Main Workspace Views */}
      <main className="main-content">
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
