import React, { useState, useMemo } from 'react';
import { addCalendarPatient, updateCalendarPatient, deleteCalendarPatient } from '../api';

const DOCTORS_ON_DUTY = [
  { name: 'Dr. Sarah Chen', role: 'ER Chief Physician', status: 'On Duty (4 Admissions)', color: '#059669', icon: '👩‍⚕️' },
  { name: 'Dr. Marcus Vance', role: 'Attending Neurologist', status: 'Available for Consult', color: '#0096c7', icon: '👨‍⚕️' },
  { name: 'Dr. Elena Rostova', role: 'Cardiology Specialist', status: 'In OR (Surgery)', color: '#d97706', icon: '👩‍⚕️' }
];

export default function CalendarView({ patients, onPatientsUpdated }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', gender: 'Male', problem: '', doctor: 'Dr. Sarah Chen', time: '10:00 AM' });

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setSearchQuery('');
    setShowModal(true);
    setIsEditing(false);
  };

  const getPatientsForDate = (dateStr) => {
    return patients.filter(p => p.date === dateStr);
  };

  const patientsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return getPatientsForDate(selectedDate).filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.problem.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [patients, selectedDate, searchQuery]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateCalendarPatient(editingPatient.id, { ...formData, date: selectedDate });
      } else {
        await addCalendarPatient({ ...formData, date: selectedDate });
      }
      setIsEditing(false);
      setEditingPatient(null);
      setFormData({ name: '', age: '', gender: 'Male', problem: '', doctor: 'Dr. Sarah Chen', time: '10:00 AM' });
      onPatientsUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditingPatient(p);
    setFormData({ name: p.name, age: p.age, gender: p.gender, problem: p.problem, doctor: p.doctor || 'Dr. Sarah Chen', time: p.time || '10:00 AM' });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this appointment?')) {
      try {
        await deleteCalendarPatient(id);
        onPatientsUpdated();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Calendar Header Controls */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📅 Hospital Calendar & Appointments
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Schedule and manage doctor consultations by date
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '4px 10px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>📅 Target Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              onClick={e => e.target.showPicker && e.target.showPicker()}
              style={{ background: 'transparent', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
            />
          </div>

          <button className="btn btn-secondary-ghost" onClick={prevMonth}>◀ Prev</button>
          <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', minWidth: '130px', textAlign: 'center' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary-ghost" onClick={nextMonth}>Next ▶</button>

          <button className="btn btn-primary" onClick={() => { setSelectedDate(new Date().toISOString().split('T')[0]); setShowModal(true); setIsEditing(true); }}>
            + Book Appointment
          </button>
        </div>
      </div>

      {/* Doctor Availability Bar */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'block' }}>
          Attending Physicians & Specialist Availability
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {DOCTORS_ON_DUTY.map((doc, idx) => (
            <div key={idx} style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>{doc.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{doc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.role}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: doc.color, marginTop: '2px' }}>● {doc.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '8px 0', borderBottom: '2px solid var(--border-color)', textTransform: 'uppercase' }}>
              {d}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayPatients = getPatientsForDate(dateStr);
            const hasPatients = dayPatients.length > 0;
            const isSelected = selectedDate === dateStr;
            
            return (
              <div 
                key={day} 
                onClick={() => handleDateClick(dateStr)}
                style={{
                  border: `2px solid ${isSelected ? '#0096c7' : hasPatients ? '#0096c7' : 'var(--border-color)'}`,
                  borderRadius: '10px',
                  minHeight: '90px',
                  padding: '10px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgba(0, 150, 199, 0.15)' : hasPatients ? 'rgba(0, 150, 199, 0.06)' : '#f8fafc',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{day}</div>
                
                {hasPatients && (
                  <div style={{ background: '#0096c7', color: '#fff', borderRadius: '12px', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 800, textAlign: 'center' }}>
                    {dayPatients.length} Consult{dayPatients.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Appointment Modal */}
      {showModal && (
        <div className="modal-backdrop" style={{ zIndex: 1300 }}>
          <div className="modal-card" style={{ maxWidth: '520px', width: '92vw', padding: '0', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                📅 Appointments for {selectedDate}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!isEditing ? (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Filter appointments..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>+ Schedule Consult</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                    {patientsForSelectedDate.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No appointments scheduled for {selectedDate}. Click "+ Schedule Consult" above to add one.</p>
                    ) : (
                      patientsForSelectedDate.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{p.name}</div>
                            <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              {p.age} y/o • {p.gender} • <strong style={{ color: '#0096c7' }}>{p.problem}</strong>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-secondary-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleEdit(p)}>Edit</button>
                            <button className="btn" style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid #ef4444' }} onClick={() => handleDelete(p.id)}>Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>{editingPatient ? 'Edit Appointment' : 'Schedule New Consult'}</h4>
                  
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Selected Date</label>
                    <input
                      type="date"
                      className="input-field"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      onClick={e => e.target.showPicker && e.target.showPicker()}
                      style={{ cursor: 'pointer' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Patient Full Name</label>
                    <input required className="input-field" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Age</label>
                      <input required className="input-field" type="number" min="0" max="150" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Gender</label>
                      <select className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Chief Problem / Complaint</label>
                    <input required className="input-field" type="text" value={formData.problem} onChange={e => setFormData({...formData, problem: e.target.value})} />
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button type="button" className="btn btn-secondary-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save Appointment</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
