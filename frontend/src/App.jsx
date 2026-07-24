import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ProtectedComponent from './components/ProtectedComponent';
import PatientForm from './components/PatientForm';
import NurseDashboard from './components/NurseDashboard';
import OverrideModal from './components/OverrideModal';
import PatientProfileModal from './components/PatientProfileModal';
import MedicalReportModal from './components/MedicalReportModal';
import AnalyticsView from './components/AnalyticsView';
import CalendarView from './components/CalendarView';
import VoiceAnalyzer from './components/VoiceAnalyzer';
import FaceAnalyzer from './components/FaceAnalyzer';
import { fetchPatients, submitIntake, applyOverride, triggerSurge, clearQueue, fetchCalendarPatients } from './api';
import './App.css';

export default function App() {
  // App authentication state
  const [currentUser, setCurrentUser] = useState(null); // null when unauthenticated
  const [currentView, setCurrentView] = useState('triage'); // 'triage' | 'doctor_dashboard' | 'patient_dashboard' | 'admin_dashboard' | 'calendar' | 'analytics' | 'voice' | 'face'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Multi-Language & Audience View Mode States
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
      if (resetForm) resetForm();
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
    
    // Set default initial view based on role
    if (user.role === 'doctor') {
      setCurrentView('doc_dash');
      setAudienceMode('clinician');
    } else if (user.role === 'nurse') {
      setCurrentView('nurse_dash');
      setAudienceMode('clinician');
    } else if (user.role === 'patient') {
      setCurrentView('pat_home');
      setAudienceMode('patient');
    } else if (user.role === 'admin') {
      setCurrentView('admin_dash');
      setAudienceMode('clinician');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('🚪 Logged out successfully');
  };

  // If unauthenticated, show modern hospital login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      {/* Fixed Left Sidebar — Primary Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Right side: Header + Content */}
      <div className={`app-main-wrapper ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Emergency Surge Alert Banner */}
        {isSurging && (
          <div className="surge-alert-banner">
            🚨 EMERGENCY SURGE IN PROGRESS — HIGH-ACUITY PATIENTS ARRIVING
          </div>
        )}

        {/* Top Header */}
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
          onViewChange={setCurrentView}
          isSidebarCollapsed={isSidebarCollapsed}
        />

      {/* Main Workspace Area */}
      <main className="main-content" style={{ marginLeft: mainMarginLeft, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', padding: '24px' }}>
        
        {/* View 1: Triage Dashboard & Queue */}
        {currentView === 'triage' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['nurse', 'doctor', 'admin', 'patient']} onRedirectLogin={handleLogout}>
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
          </ProtectedComponent>
        )}

        {/* View 2: Doctor Workspace */}
        {currentView === 'doctor_dashboard' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['doctor', 'admin']} onRedirectLogin={handleLogout}>
            <DoctorDashboardView
              patients={patients}
              currentUser={currentUser}
              onOpenOverride={(p) => setOverridePatient(p)}
              onOpenReport={(p) => setReportPatient(p)}
            />
          </ProtectedComponent>
        )}

        {/* View 3: Patient Personal Portal */}
        {currentView === 'patient_dashboard' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['patient', 'doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <PatientDashboardView
              currentUser={currentUser}
              patients={patients}
              onOpenReport={(p) => setReportPatient(p)}
              lang={patientLang}
            />
          </ProtectedComponent>
        )}

        {/* View 4: Admin Settings & Audit Center */}
        {currentView === 'admin_dashboard' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['admin']} onRedirectLogin={handleLogout}>
            <AdminDashboardView
              patients={patients}
              currentUser={currentUser}
            />
          </ProtectedComponent>
        )}

        {/* View 5: Analytics */}
        {currentView === 'analytics' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <AnalyticsView patients={patients} />
          </ProtectedComponent>
        )}

        {/* View 6: Calendar */}
        {currentView === 'calendar' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'admin', 'patient']} onRedirectLogin={handleLogout}>
            <CalendarView
              patients={calendarPatients}
              onPatientsUpdated={loadCalendarPatients}
            />
          </ProtectedComponent>
        )}

        {/* View 7: Voice AI */}
        {currentView === 'voice' && (
          <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <VoiceAnalyzer />
          </div>
        )}

        {/* View 8: Face Diagnostic Scanner */}
        {currentView === 'face' && (
          <div className="card" style={{ maxWidth: '950px', margin: '0 auto' }}>
            <FaceAnalyzer />
          </div>
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

      {/* Toast */}
      {toastMessage && (
        <div className="toast-banner">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
