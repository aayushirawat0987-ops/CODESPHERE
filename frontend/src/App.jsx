import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import PatientForm from './components/PatientForm';
import NurseDashboard from './components/NurseDashboard';
import OverrideModal from './components/OverrideModal';
import { fetchPatients, submitIntake, applyOverride, triggerSurge, clearQueue, fetchCalendarPatients } from './api';
import CalendarView from './components/CalendarView';
import './App.css';

export default function App() {
  const [patients, setPatients] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingIntake, setIsLoadingIntake] = useState(false);
  const [isSurging, setIsSurging] = useState(false);
  const [overridePatient, setOverridePatient] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  
  const [currentView, setCurrentView] = useState('triage'); // 'triage' or 'calendar'
  const [calendarPatients, setCalendarPatients] = useState([]);

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
    loadPatients();
    loadCalendarPatients();
    const interval = setInterval(loadPatients, 3000);
    return () => clearInterval(interval);
  }, [loadPatients, loadCalendarPatients]);

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
    try {
      await triggerSurge();
      showToast('⚡ Surge simulation started! 9 patients entering triage queue...');
      // Poll rapidly for 5 seconds to show patients arriving live
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

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Header
        onTriggerSurge={handleTriggerSurge}
        onClearQueue={handleClearQueue}
        isSurging={isSurging}
        isRefreshing={isRefreshing}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Main Grid Workspace */}
      <main className="main-content">
        {currentView === 'triage' ? (
          <div className="grid-layout">
            {/* Left Column: Patient Intake Form */}
            <aside className="column-intake">
              <PatientForm onSubmit={handleIntakeSubmit} isLoading={isLoadingIntake} />
            </aside>

            {/* Right Column: Live Nurse Dashboard */}
            <section className="column-dashboard">
              <NurseDashboard
                patients={patients}
                onOpenOverride={(p) => setOverridePatient(p)}
                lastUpdated={lastUpdated}
              />
            </section>
          </div>
        ) : (
          <CalendarView 
            patients={calendarPatients} 
            onPatientsUpdated={loadCalendarPatients} 
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

      {/* Notification Toast */}
      {toastMessage && (
        <div className="toast-banner">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clinical Disclaimer Footer */}
      <footer className="app-footer">
        <p>
          <strong>⚠️ Vitalis TriageAI Decision-Support System:</strong> FOR DEMONSTRATION & TRIAGE STAFF SUPPORT ONLY.
          NOT A DIAGNOSTIC MEDICAL DEVICE. Emergency clinicians maintain complete authority and final decision control at all times.
        </p>
      </footer>
    </div>
  );
}
