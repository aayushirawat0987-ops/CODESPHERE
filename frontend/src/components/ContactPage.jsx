import React, { useState } from 'react';
import { Building2, Send, Stethoscope } from 'lucide-react';

const initialForm = {
  doctorName: '',
  hospitalName: '',
  patientName: '',
  aiScore: '',
  urgencyLevel: 'Moderate',
  contactNumber: '',
  email: '',
  message: '',
};

export default function ContactPage({ onSubmitSuccess }) {
  const [formData, setFormData] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    onSubmitSuccess?.(`Contact request submitted to Dr. ${formData.doctorName}`);
  };

  if (submitted) {
    return (
      <section className="contact-page">
        <div className="contact-confirmation card">
          <div className="contact-confirmation-icon">Sent</div>
          <h2>Contact Request Submitted</h2>
          <p>
            Your request for Dr. {formData.doctorName} at {formData.hospitalName} has been recorded.
            The care team can review the AI score and patient details from this contact note.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => {
              setFormData(initialForm);
              setSubmitted(false);
            }}
          >
            Create Another Contact
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="contact-page">
      <div className="contact-shell">
        <div className="contact-intro">
          <div className="contact-kicker">
            <Stethoscope size={18} />
            Doctor Contact
          </div>
          <h2>Contact the Doctor</h2>
          <p>
            Share the doctor, hospital, AI urgency score, and patient context so the clinical team
            has the right information before responding.
          </p>
          <div className="contact-info-strip">
            <span><Building2 size={16} /> Hospital desk</span>
            <span>Clinical handoff</span>
            <span>AI score review</span>
          </div>
        </div>

        <form className="contact-form card" onSubmit={handleSubmit}>
          <div className="contact-form-grid">
            <div className="form-group">
              <label htmlFor="doctor-name">Doctor Name</label>
              <input
                id="doctor-name"
                className="input-field"
                type="text"
                value={formData.doctorName}
                onChange={(e) => updateField('doctorName', e.target.value)}
                placeholder="Dr. Meera Sharma"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="hospital-name">Hospital Name</label>
              <input
                id="hospital-name"
                className="input-field"
                type="text"
                value={formData.hospitalName}
                onChange={(e) => updateField('hospitalName', e.target.value)}
                placeholder="City Care Hospital"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="patient-name">Patient Name</label>
              <input
                id="patient-name"
                className="input-field"
                type="text"
                value={formData.patientName}
                onChange={(e) => updateField('patientName', e.target.value)}
                placeholder="Patient full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ai-score">AI Score</label>
              <input
                id="ai-score"
                className="input-field"
                type="number"
                min="1"
                max="10"
                value={formData.aiScore}
                onChange={(e) => updateField('aiScore', e.target.value)}
                placeholder="1-10"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="urgency-level">Urgency Level</label>
              <select
                id="urgency-level"
                className="input-field"
                value={formData.urgencyLevel}
                onChange={(e) => updateField('urgencyLevel', e.target.value)}
              >
                <option>Critical</option>
                <option>High</option>
                <option>Moderate</option>
                <option>Low</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="contact-number">Contact Number</label>
              <input
                id="contact-number"
                className="input-field"
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => updateField('contactNumber', e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
            </div>

            <div className="form-group contact-wide">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                className="input-field"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div className="form-group contact-wide">
              <label htmlFor="contact-message">Clinical Notes</label>
              <textarea
                id="contact-message"
                className="input-field textarea-field"
                rows="5"
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Add symptoms, concern, timing, or handoff notes..."
                required
              />
            </div>
          </div>

          <button className="btn btn-primary contact-submit" type="submit">
            <Send size={17} />
            Submit Contact Request
          </button>
        </form>
      </div>
    </section>
  );
}
