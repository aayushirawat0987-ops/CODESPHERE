import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import ProtectedComponent from './components/ProtectedComponent';
import PatientForm from './components/PatientForm';
import NurseDashboardView from './components/NurseDashboardView';
import DoctorDashboardView from './components/DoctorDashboardView';
import PatientDashboardView from './components/PatientDashboardView';
import AdminDashboardView from './components/AdminDashboardView';
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
  const [currentView, setCurrentView] = useState('doc_dash'); // Role-based dynamic view
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  // If unauthenticated, render modern hospital login page
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const mainMarginLeft = isSidebarCollapsed ? '70px' : '250px';

  return (
    <div className="app-container" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Collapsible Left Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Top Command Center Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setCurrentUser(null)}
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
        onViewChange={setCurrentView}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Main Workspace Area */}
      <main className="main-content" style={{ marginLeft: mainMarginLeft, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', padding: '24px' }}>
        
        {/* PATIENT VIEWS */}
        {(currentView === 'pat_home' || currentView === 'pat_reports' || currentView === 'pat_profile') && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['patient', 'doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <PatientDashboardView
              currentUser={currentUser}
              patients={patients}
              onOpenReport={(p) => setReportPatient(p)}
              lang={patientLang}
            />
          </ProtectedComponent>
        )}

        {currentView === 'pat_symptoms' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['patient', 'doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <div style={{ maxWidth: '750px', margin: '0 auto' }}>
              <PatientForm
                onSubmit={handleIntakeSubmit}
                isLoading={isLoadingIntake}
                lang={patientLang}
              />
            </div>
          </ProtectedComponent>
        )}

        {/* DOCTOR VIEWS */}
        {(currentView === 'doc_dash' || currentView === 'doc_patients' || currentView === 'doc_timeline' || currentView === 'doc_ai_reports' || currentView === 'doc_notes' || currentView === 'doc_prescriptions') && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['doctor', 'admin']} onRedirectLogin={handleLogout}>
            <DoctorDashboardView
              patients={patients}
              currentUser={currentUser}
              onOpenOverride={(p) => setOverridePatient(p)}
              onOpenReport={(p) => setReportPatient(p)}
            />
          </ProtectedComponent>
        )}

        {/* NURSE VIEWS */}
        {(currentView === 'nurse_dash' || currentView === 'nurse_registration' || currentView === 'nurse_queue' || currentView === 'nurse_vitals' || currentView === 'nurse_admissions') && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['nurse', 'admin']} onRedirectLogin={handleLogout}>
            <NurseDashboardView
              patients={patients}
              onIntakeSubmit={handleIntakeSubmit}
              isLoadingIntake={isLoadingIntake}
              onOpenOverride={(p) => setOverridePatient(p)}
              onOpenProfile={(p) => setProfilePatient(p)}
              onOpenReport={(p) => setReportPatient(p)}
              lastUpdated={lastUpdated}
              patientLang={patientLang}
              staffLang={staffLang}
              audienceMode={audienceMode}
            />
          </ProtectedComponent>
        )}

        {/* ADMIN VIEWS */}
        {(currentView === 'admin_dash' || currentView === 'admin_patients' || currentView === 'admin_doctors' || currentView === 'admin_nurses' || currentView === 'admin_depts' || currentView === 'admin_logs') && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['admin']} onRedirectLogin={handleLogout}>
            <AdminDashboardView
              patients={patients}
              currentUser={currentUser}
            />
          </ProtectedComponent>
        )}

        {/* COMMON SHARED VIEWS WITH ACCESS CONTROL */}
        {currentView === 'analytics' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <AnalyticsView patients={patients} />
          </ProtectedComponent>
        )}

        {currentView === 'calendar' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['doctor', 'nurse', 'admin', 'patient']} onRedirectLogin={handleLogout}>
            <CalendarView
              patients={calendarPatients}
              onPatientsUpdated={loadCalendarPatients}
            />
          </ProtectedComponent>
        )}

        {currentView === 'voice' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['patient', 'doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
              <VoiceAnalyzer />
            </div>
          </ProtectedComponent>
        )}

        {currentView === 'face' && (
          <ProtectedComponent currentUser={currentUser} allowedRoles={['patient', 'doctor', 'nurse', 'admin']} onRedirectLogin={handleLogout}>
            <div className="card" style={{ maxWidth: '950px', margin: '0 auto' }}>
              <FaceAnalyzer />
            </div>
          </ProtectedComponent>
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
