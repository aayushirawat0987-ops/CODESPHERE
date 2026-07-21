import React, { useState } from 'react';

export default function OverrideModal({ patient, onClose, onSave }) {
  const [newScore, setNewScore] = useState(patient.effective_urgency_score || 5);
  const [reason, setReason] = useState('');
  const [staffName, setStaffName] = useState('Dr. / RN Intake');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Please enter a clinical reason for overriding the AI score.');
      return;
    }

    onSave({
      score: parseInt(newScore, 10),
      reason: reason.trim(),
      staff_name: staffName.trim()
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-icon">⚕️</span>
            <h3>Staff Urgency Override</h3>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-patient-summary">
          <div className="patient-meta-header">
            <strong>{patient.name}</strong> • Pain: {patient.pain_scale}/10
          </div>
          <p className="complaint-text">"{patient.complaint}"</p>
          <div className="current-score-row">
            <span>Current AI Score: <strong>{patient.ai_reasoning?.urgency_score || patient.effective_urgency_score}/10</strong></span>
            {patient.is_overridden && <span className="override-flag">Currently Overridden</span>}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="override-form">
          <div className="form-group">
            <label htmlFor="staff-score">New Urgency Score (1 - 10)</label>
            <div className="score-picker-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                let colorClass = 'pick-green';
                if (num >= 8) colorClass = 'pick-red';
                else if (num >= 4) colorClass = 'pick-yellow';

                return (
                  <button
                    key={num}
                    type="button"
                    className={`score-btn ${colorClass} ${parseInt(newScore, 10) === num ? 'active' : ''}`}
                    onClick={() => setNewScore(num)}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="override-reason">Clinical Rationale for Override <span className="req">*</span></label>
            <textarea
              id="override-reason"
              className="input-field textarea-field"
              rows="3"
              placeholder="Provide clinical reasoning for adjusting urgency score (e.g. Visual observation of distress, patient history, abnormal ECG)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="staff-name">Staff Member Name / ID</label>
            <input
              id="staff-name"
              type="text"
              className="input-field"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-warning">
              🔒 Confirm & Lock Staff Override
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
