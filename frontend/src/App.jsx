import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PatientForm from './components/PatientForm';
import NurseDashboard from './components/NurseDashboard';
import OverrideModal from './components/OverrideModal';
import CalendarView from './components/CalendarView';
import VoiceAnalyzer from './components/VoiceAnalyzer';
import LandingPage from './components/LandingPage';
import { fetchPatients, submitIntake, applyOverride, triggerSurge, clearQueue, fetchCalendarPatients } from './api';
import './App.css';

export default function App() {
  // 'landing' | 'triage' | 'calendar' | 'voice'
  const [appState, setAppState] = useState('landing');
  const [currentView, setCurrentView] = useState('triage');

  const [patients, setPatients] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingIntake, setIsLoadingIntake] = useState(false);
  const [isSurging, setIsSurging] = useState(false);
  const [overridePatient, setOverridePatient] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [calendarPatients, setCalendarPatients] = useState([]);
  const [patientSubmitted, setPatientSubmitted] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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
      if (currentView === 'patient') {
        setPatientSubmitted(true);
      }
    } catch (err) {
      alert(`Error submitting intake: ${err.message}`);
    } finally {
      setIsLoadingIntake(false);
    }
  };

  const handleTriggerSurge = async () => {
    setIsSurging(true);
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
      setTimeout(() => setIsSurging(false), 2000);
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

  // Show landing if not entered yet
  if (appState === 'landing') {
    return <LandingPage onEnter={handleEnterDashboard} />;
  }

  return (
    <div className="app-container">
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

      {/* Main Grid Workspace */}
      <main className="main-content">
<<<<<<< HEAD
        {currentView === 'triage' && (
=======
        {currentView === 'patient' ? (
          patientSubmitted ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <div className="card" style={{ maxWidth: '550px', textAlign: 'center', padding: '2.5rem', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
                <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', display: 'inline-block' }}>✅</div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, marginBottom: '1rem', color: 'var(--green-text)' }}>Intake Submitted Successfully!</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                  Thank you for registering. Your details have been submitted securely to the clinical triage queue. Please make your way to the waiting lounge—our medical team will call you shortly.
                </p>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', justifyContent: 'center' }}
                  onClick={() => setPatientSubmitted(false)}
                >
                  ➕ Register Another Patient / New Intake
                </button>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '600px', margin: '1.5rem auto' }}>
              <PatientForm onSubmit={handleIntakeSubmit} isLoading={isLoadingIntake} />
            </div>
          )
        ) : currentView === 'triage' ? (
>>>>>>> da19188f27e6a05b1e8cb7108e3dacc4482b82e7
          <div className="grid-layout">
            <aside className="column-intake">
              <PatientForm onSubmit={handleIntakeSubmit} isLoading={isLoadingIntake} />
            </aside>
            <section className="column-dashboard">
              <NurseDashboard
                patients={patients}
                onOpenOverride={(p) => setOverridePatient(p)}
                lastUpdated={lastUpdated}
              />
            </section>
          </div>
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
      </main>

      {/* Staff Override Modal Dialog */}
      {overridePatient && (
        <OverrideModal
          patient={overridePatient}
          onClose={() => setOverridePatient(null)}
          onSave={handleSaveOverride}
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
