import React, { useState, useEffect } from 'react';
import { fetchPatientTimeline, submitCalendarPatient } from '../api';
import { speakText } from '../languageDictionary';
import PatientQRCode from './PatientQRCode';

export default function PatientDashboardView({ currentUser, patients, onOpenReport, lang = 'en' }) {
  const [userTimeline, setUserTimeline] = useState([]);
  const [showApptModal, setShowApptModal] = useState(false);
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('10:00 AM');
  const [apptProblem, setApptProblem] = useState('Routine Checkup');
  const [uploadedFiles, setUploadedFiles] = useState(['Blood_Test_Report_2026.pdf']);

  const patientName = currentUser ? currentUser.name : 'John Doe';
  const myRecord = patients.find(p => p.name.toLowerCase() === patientName.toLowerCase()) || patients[0];
  const formattedPatId = myRecord ? (myRecord.patient_id || `VIT-2026-000${myRecord.id}`) : 'VIT-2026-000001';

  useEffect(() => {
    if (myRecord) {
      fetchPatientTimeline(myRecord.id)
        .then(data => setUserTimeline(data))
        .catch(err => console.error(err));
    }
  }, [myRecord]);

  const handleBookAppt = async (e) => {
    e.preventDefault();
    try {
      await submitCalendarPatient({
        patient_id: formattedPatId,
        name: patientName,
        age: myRecord ? (myRecord.age || 35) : 35,
        gender: myRecord ? (myRecord.gender || 'Male') : 'Male',
        problem: apptProblem,
        date: apptDate,
        time: apptTime
      });
      alert('✅ Appointment successfully booked!');
      setShowApptModal(false);
      if (myRecord) {
        const updated = await fetchPatientTimeline(myRecord.id);
        setUserTimeline(updated);
      }
    } catch (err) {
      alert(`Booking failed: ${err.message}`);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => [...prev, file.name]);
      alert(`✅ Uploaded ${file.name} to your permanent health record.`);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #065f46, #047857)', borderRadius: '16px', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
              👤 Patient Personal Health Portal
            </h2>
            <span style={{ background: '#ffffff', color: '#047857', padding: '2px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 900, fontFamily: 'monospace' }}>
              {formattedPatId}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#a7f3d0' }}>
            Welcome back, <strong>{patientName}</strong> | Permanent Health ID: <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{formattedPatId}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <PatientQRCode patientId={formattedPatId} size={80} />
          <button onClick={() => setShowApptModal(true)} className="btn btn-primary" style={{ background: '#0096c7', border: 'none' }}>
            📅 Book New Appointment
          </button>
        </div>
      </div>

      {/* Grid Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Latest AI Triage Assessment Card */}
        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 900, color: '#166534' }}>
            📋 Your Latest Health & Symptom Summary ({formattedPatId})
          </h3>

          {myRecord ? (
            <div>
              <div style={{ fontSize: '0.9rem', color: '#14532d', lineHeight: 1.6, fontWeight: 600 }}>
                {lang === 'hi' 
                  ? (myRecord.ai_reasoning ? myRecord.ai_reasoning.patient_summary_hi : `आपने बताया कि आप महसूस कर रहे हैं: ${myRecord.complaint}`) 
                  : (myRecord.ai_reasoning ? myRecord.ai_reasoning.patient_summary_en : `You reported feeling: ${myRecord.complaint}`)
                }
              </div>

              <div style={{ marginTop: '14px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => speakText(myRecord.ai_reasoning ? myRecord.ai_reasoning.patient_summary_en : myRecord.complaint, lang)}
                  className="btn btn-primary"
                  style={{ background: '#059669', fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  🔊 Listen (Audio)
                </button>
                <button
                  onClick={() => onOpenReport(myRecord)}
                  className="btn btn-secondary-ghost"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                >
                  📄 View Full Health Report
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#166534', fontSize: '0.85rem' }}>No recent emergency triage records.</div>
          )}
        </div>

        {/* Upload Medical Records Card */}
        <div style={{ background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
            📁 Uploaded Medical Reports & Documents
          </h3>

          <div style={{ marginBottom: '12px' }}>
            <label className="btn btn-secondary-ghost" style={{ cursor: 'pointer', display: 'inline-block', fontSize: '0.8rem' }}>
              📤 Upload Medical File (PDF / Image)
              <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {uploadedFiles.map((fname, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                📄 {fname} <span style={{ color: '#059669', fontSize: '0.72rem', float: 'right' }}>Saved</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Personal Medical Timeline */}
      <div style={{ background: '#ffffff', border: '1.5px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>
          📜 Your Complete Medical Timeline ({formattedPatId})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {userTimeline.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>No historical visits or prescriptions found.</div>
          ) : (
            userTimeline.map(evt => (
              <div key={evt.id} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>{evt.title}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{evt.date}</span>
                </div>
                {evt.author && (
                  <div style={{ fontSize: '0.78rem', color: '#0096c7', fontWeight: 700, marginTop: '2px' }}>
                    Author: {evt.author}
                  </div>
                )}
                <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '6px', lineHeight: 1.5 }}>
                  {evt.details}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showApptModal && (
        <div className="modal-backdrop" style={{ zIndex: 1400 }}>
          <div className="modal-card" style={{ maxWidth: '440px', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: '1.1rem', fontWeight: 900 }}>📅 Book Doctor Appointment</h3>
            
            <form onSubmit={handleBookAppt} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Appointment Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={apptDate}
                  onChange={e => setApptDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Preferred Time</label>
                <select className="input-field" value={apptTime} onChange={e => setApptTime(e.target.value)}>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Reason / Chief Complaint</label>
                <input
                  type="text"
                  className="input-field"
                  value={apptProblem}
                  onChange={e => setApptProblem(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirm Booking</button>
                <button type="button" onClick={() => setShowApptModal(false)} className="btn btn-secondary-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
