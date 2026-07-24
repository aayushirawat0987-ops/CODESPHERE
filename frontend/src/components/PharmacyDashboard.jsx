import React, { useMemo, useState } from 'react';
import { updateMedicineStatus } from '../api';
import UrgencyBadge from './UrgencyBadge';

export default function PharmacyDashboard({ patients, onRefresh, showToast, lastUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const [busyIds, setBusyIds] = useState(() => new Set());

  const pharmacyPatients = useMemo(
    () =>
      patients.filter(
        (p) => p.prescription && p.treatment_status !== 'Treatment Completed' && !dismissedIds.has(p.id)
      ),
    [patients, dismissedIds]
  );

  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return pharmacyPatients.filter((patient) =>
      patient.name.toLowerCase().includes(term) ||
      (patient.complaint || '').toLowerCase().includes(term) ||
      (patient.id || '').toLowerCase().includes(term)
    );
  }, [pharmacyPatients, searchTerm]);

  const counts = useMemo(() => {
    const pending = pharmacyPatients.filter((p) => p.treatment_status === 'Medication Ordered').length;
    const preparing = pharmacyPatients.filter((p) => p.treatment_status === 'Preparing Medicines').length;
    const ready = pharmacyPatients.filter((p) => p.treatment_status === 'Ready for Pickup').length;
    const completed = patients.filter((p) => p.treatment_status === 'Treatment Completed').length;
    return { pending, preparing, ready, completed };
  }, [pharmacyPatients, patients]);

  const statusLabel = {
    pending: 'Medication Ordered',
    preparing: 'Preparing Medicines',
    ready: 'Ready for Pickup'
  };

  const visiblePatients = filteredPatients.filter(
    (patient) => patient.treatment_status === statusLabel[activeTab]
  );

  const updateStatus = async (patientId, newStatus) => {
    // Dispensing closes out this patient's pharmacy visit entirely — remove the row
    // immediately (optimistic) so the pharmacist can move straight to the next patient.
    const isDispensing = newStatus === 'Dispensed';

    if (isDispensing) {
      setDismissedIds((prev) => new Set(prev).add(patientId));
    } else {
      setBusyIds((prev) => new Set(prev).add(patientId));
    }

    try {
      await updateMedicineStatus(patientId, { status: newStatus });
      showToast(
        isDispensing ? 'Medicine dispensed. Treatment completed.' : `Pharmacy updated to ${newStatus}.`
      );
      onRefresh();
    } catch (error) {
      showToast(`Pharmacy update failed: ${error.message}`);
      // Roll back the optimistic removal so the patient doesn't silently vanish on failure
      if (isDispensing) {
        setDismissedIds((prev) => {
          const next = new Set(prev);
          next.delete(patientId);
          return next;
        });
      }
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(patientId);
        return next;
      });
    }
  };

  return (
    <div className="card dashboard-card hospital-dashboard-card">
      <div className="dashboard-header-row">
        <div>
          <p className="section-subtitle">Pharmacy & Supply Chain</p>
          <h2>Medical Order Fulfillment Dashboard</h2>
          <p className="dashboard-caption">
            Track prescriptions, stage medicine preparation, and close the treatment cycle in real time.
          </p>
        </div>
        <div className="meta-pill">Updated {lastUpdated || 'just now'}</div>
      </div>

      <div className="summary-grid">
        <div className="summary-card summary-blue">
          <span>Pending Orders</span>
          <strong>{counts.pending}</strong>
        </div>
        <div className="summary-card summary-yellow">
          <span>Preparing</span>
          <strong>{counts.preparing}</strong>
        </div>
        <div className="summary-card summary-green">
          <span>Ready for Pickup</span>
          <strong>{counts.ready}</strong>
        </div>
        <div className="summary-card summary-purple">
          <span>Completed Treatments</span>
          <strong>{counts.completed}</strong>
        </div>
      </div>

      <div className="panel panel-left pharmacy-panel">
        <div className="panel-top-row">
          <div className="input-search-wrap">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search pharmacy orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-pill-group">
            {['pending', 'preparing', 'ready'].map((tab) => (
              <button
                key={tab}
                className={`filter-pill ${activeTab === tab ? 'filter-pill-active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'pending' ? 'Ordered' : tab === 'preparing' ? 'Preparing' : 'Ready'}
                {' '}({counts[tab]})
              </button>
            ))}
          </div>
        </div>

        <div className="patient-table">
          {visiblePatients.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💊</div>
              <p>No pharmacy orders match the current filter.</p>
            </div>
          ) : (
            visiblePatients.map((patient) => {
              const rx = patient.prescription || {};
              const isBusy = busyIds.has(patient.id);
              return (
                <div key={patient.id} className="table-row pharmacy-row">
                  <div>
                    <div className="patient-name">{patient.name}</div>
                    <div className="patient-meta">
                      {rx.medicine_name || 'No medicine recorded'}
                      {rx.dosage ? ` • ${rx.dosage}` : ''}
                      {rx.frequency ? ` • ${rx.frequency}` : ''}
                      {rx.duration ? ` • ${rx.duration}` : ''}
                    </div>
                    {rx.notes && <div className="patient-meta pharmacy-rx-notes">📝 {rx.notes}</div>}
                    {rx.follow_up && <div className="patient-meta pharmacy-rx-notes">📅 Follow-up: {rx.follow_up}</div>}
                  </div>
                  <div className="patient-right">
                    <UrgencyBadge score={patient.effective_urgency_score} compact />
                    <span className={`status-pill status-${patient.treatment_status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {patient.treatment_status}
                    </span>
                  </div>
                  <div className="pharmacy-actions">
                    <button
                      className="btn btn-secondary-ghost"
                      disabled={isBusy}
                      onClick={() => updateStatus(patient.id, 'Preparing Medicines')}
                    >
                      Preparing Medicines
                    </button>
                    <button
                      className="btn btn-secondary-ghost"
                      disabled={isBusy}
                      onClick={() => updateStatus(patient.id, 'Ready for Pickup')}
                    >
                      Medicine Ready
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={isBusy}
                      onClick={() => updateStatus(patient.id, 'Dispensed')}
                    >
                      Medicine Dispensed
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
