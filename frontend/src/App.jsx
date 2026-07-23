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

  // Play Web Audio API chime sound on surge / alerts
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
    } catch (e) {
      // Audio not permitted or unaccessible
    }
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
      alert(`Error submitting intake: ${err.message}`);
    } finally {
      setIsLoadingIntake(false);
    }
  };

  const handleTriggerSurge = async () => {
    setIsSurging(true);
    playAlertChime();
    try {
      await triggerSurge();
      showToast('⚡ Surge simulation started! 9 patients entering triage queue...');
      let count = 0;
      const surgeInterval = setInterval(() => {
        loadPatients();
        count++;
        if (count > 5) clearInterval(surgeInterval);
      }, 800);
    } catch (err) {
      alert(`Surge simulation error: ${err.message}`);
    } finally {
      setTimeout(() => setIsSurging(false), 3000);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('Clear all patient records from the queue?')) {
      try {
        await clearQueue();
        showToast('🗑️ Triage queue cleared.');
        loadPatients();
      } catch (err) {
        alert(`Error clearing queue: ${err.message}`);
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
        />
      )}

      {/* Printable Medical Triage Report Modal */}
      {reportPatient && (
        <MedicalReportModal
          patient={reportPatient}
          onClose={() => setReportPatient(null)}
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
