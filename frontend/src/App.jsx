import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PatientForm from './components/PatientForm';
import NurseDashboard from './components/NurseDashboard';
import OverrideModal from './components/OverrideModal';
import PatientProfileModal from './components/PatientProfileModal';
import MedicalReportModal from './components/MedicalReportModal';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import VoiceAnalyzer from './components/VoiceAnalyzer';
import FaceAnalyzer from './components/FaceAnalyzer';
import ContactPage from './components/ContactPage';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import DoctorDashboardView from './components/DoctorDashboardView';
import PatientDashboardView from './components/PatientDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
import { fetchPatients, submitIntake, applyOverride, triggerSurge, clearQueue, fetchCalendarPatients } from './api';
import './App.css';

export default function App() {
  // 'landing' | 'triage' | 'analytics' | 'calendar' | 'voice' | 'face' | 'contact' | 'doctor_dashboard' | 'patient_dashboard' | 'admin_dashboard'
  const [appState, setAppState] = useState('landing');
  const [currentView, setCurrentView] = useState('triage');
  const [showContactOnLanding, setShowContactOnLanding] = useState(false);

  // Authentication & Current User State
  const [currentUser, setCurrentUser] = useState({
    id: 'usr_doc_1',
    username: 'doctor',
    name: 'Dr. Sarah Jenkins, MD',
    role: 'doctor',
    department: 'Cardiology / ER'
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Multi-Language & Audience View Mode States
  const [patientLang, setPatientLang] = useState('en'); // 'en' | 'hi'
  const [staffLang, setStaffLang] = useState('en'); // 'en' | 'hi'
  const [audienceMode, setAudienceMode] = useState('clinician'); // 'clinician' | 'patient'

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
    } catch (e) {}
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
    if (appState === 'landing') return;
    loadPatients();
    loadCalendarPatients();
    const interval = setInterval(loadPatients, 3000);
    return () => clearInterval(interval);
  }, [loadPatients, loadCalendarPatients, appState]);

  const handleIntakeSubmit = async (patientData, resetForm) => {
    setIsLoadingIntake(true);
    try {
      const newRecord = await submitIntake(patientData);
      showToast(`✅ Intake processed for ${newRecord.name} (Assigned Score: ${newRecord.effective_urgency_score}/10)`);
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

  const handleEnterDashboard = () => {
    setAppState('dashboard');
    setCurrentView('triage');
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    showToast(`🔑 Switched user to ${user.name} (${user.role.toUpperCase()})`);
    if (user.role === 'doctor') setCurrentView('doctor_dashboard');
    else if (user.role === 'patient') { setCurrentView('patient_dashboard'); setAudienceMode('patient'); }
    else if (user.role === 'admin') setCurrentView('admin_dashboard');
    else setCurrentView('triage');
  };

  // Show landing page if not entered yet
  if (appState === 'landing') {
    return (
      <>
        <LandingPage 
          onEnter={handleEnterDashboard}
          onContact={() => setShowContactOnLanding(true)}
        />
        {showContactOnLanding && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
          }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: '12px', maxWidth: '700px',
              width: '100%', maxHeight: '90vh', overflow: 'auto', position: 'relative'
            }}>
              <button
                onClick={() => setShowContactOnLanding(false)}
                style={{
                  position: 'sticky', top: '10px', right: '10px', float: 'right',
                  background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
                  zIndex: 1001, color: '#666'
                }}
              >
                ✕
              </button>
              <div style={{ padding: '30px' }}>
                <ContactPage
                  onSubmitSuccess={(message) => {
                    showToast(message);
                    setTimeout(() => setShowContactOnLanding(false), 2000);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

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

      {/* Top Navigation Bar with Language & View Mode Controls */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        patientLang={patientLang}
        onPatientLangChange={setPatientLang}
        staffLang={staffLang}
        onStaffLangChange={setStaffLang}
        audienceMode={audienceMode}
        onAudienceModeChange={setAudienceMode}
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
              <PatientForm
                onSubmit={handleIntakeSubmit}
                isLoading={isLoadingIntake}
                lang={audienceMode === 'patient' ? patientLang : staffLang}
              />
            </aside>
            <section className="column-dashboard">
              <NurseDashboard
                patients={patients}
                onOpenOverride={(p) => setOverridePatient(p)}
                onOpenProfile={(p) => setProfilePatient(p)}
                onOpenReport={(p) => setReportPatient(p)}
                lastUpdated={lastUpdated}
                patientLang={patientLang}
                staffLang={staffLang}
                audienceMode={audienceMode}
              />
            </section>
          </div>
        )}

        {currentView === 'doctor_dashboard' && (
          <DoctorDashboardView
            patients={patients}
            currentUser={currentUser}
            onOpenOverride={(p) => setOverridePatient(p)}
            onOpenReport={(p) => setReportPatient(p)}
          />
        )}

        {currentView === 'patient_dashboard' && (
          <PatientDashboardView
            currentUser={currentUser}
            patients={patients}
            onOpenReport={(p) => setReportPatient(p)}
            lang={patientLang}
          />
        )}

        {currentView === 'admin_dashboard' && (
          <AdminDashboardView
            patients={patients}
            currentUser={currentUser}
          />
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

      {/* Auth & Role Switcher Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Staff Override Modal Dialog */}
      {overridePatient && (
        <OverrideModal
          patient={overridePatient}
          onClose={() => setOverridePatient(null)}
          onSave={handleSaveOverride}
        />
      )}

      {/* Detailed Patient Profile Modal */}
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

      {/* Printable Medical Triage Report Modal */}
      {reportPatient && (
        <MedicalReportModal
          patient={reportPatient}
          onClose={() => setReportPatient(null)}
          patientLang={patientLang}
          staffLang={staffLang}
          audienceMode={audienceMode}
        />
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="toast-banner">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clinical Disclaimer Footer */}
      <footer className="app-footer">
        <p>
          <strong>⚠️ Vitalis TriageAI Decision-Support System:</strong> FOR DEMONSTRATION &amp; TRIAGE STAFF SUPPORT ONLY.
          NOT A DIAGNOSTIC MEDICAL DEVICE. Emergency clinicians maintain complete authority and final decision control at all times.
        </p>
      </footer>
    </div>
  );
}
