import React, { useState, useMemo } from 'react';
import { addCalendarPatient, updateCalendarPatient, deleteCalendarPatient } from '../api';

export default function CalendarView({ patients, onPatientsUpdated }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState({ name: '', age: '', gender: 'Male', problem: '' });

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
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
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
      setFormData({ name: '', age: '', gender: 'Male', problem: '' });
      onPatientsUpdated();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (p) => {
    setEditingPatient(p);
    setFormData({ name: p.name, age: p.age, gender: p.gender, problem: p.problem });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this patient?")) {
      try {
        await deleteCalendarPatient(id);
        onPatientsUpdated();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingPatient(null);
    setFormData({ name: '', age: '', gender: 'Male', problem: '' });
  };

  return (
    <div className="calendar-container" style={{ padding: '20px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Patient Calendar</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary-ghost" onClick={prevMonth}>&lt; Prev</button>
          <h3 style={{ margin: 0, alignSelf: 'center' }}>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button className="btn btn-secondary-ghost" onClick={nextMonth}>Next &gt;</button>
        </div>
      </div>

      <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>{d}</div>
        ))}
        
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} />)}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayPatients = getPatientsForDate(dateStr);
          const hasPatients = dayPatients.length > 0;
          
          return (
            <div 
              key={day} 
              onClick={() => handleDateClick(dateStr)}
              style={{
                border: `1px solid ${hasPatients ? 'var(--urgency-yellow)' : 'var(--border-color)'}`,
                borderRadius: '8px',
                minHeight: '80px',
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: hasPatients ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = hasPatients ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 0, 0, 0.02)'}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{day}</div>
              {hasPatients && (
                <div style={{ fontSize: '0.8rem', color: 'var(--urgency-yellow)' }}>
                  {dayPatients.length} patient{dayPatients.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95%' }}>
            <div className="modal-header">
              <h2 className="card-title">Patients for {selectedDate}</h2>
              <button className="btn btn-secondary-ghost" onClick={() => setShowModal(false)} style={{ padding: '4px 10px' }}>✕</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isEditing ? (
                <>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Search patients by name..." 
                      value={searchQuery} 
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>+ Add Patient</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                    {patientsForSelectedDate.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)' }}>No patients found.</p>
                    ) : (
                      patientsForSelectedDate.map(p => (
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: 'rgba(0, 0, 0, 0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '4px' }}>{p.name}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                              {p.age} y/o • {p.gender} • <span style={{ color: 'var(--urgency-red)' }}>{p.problem}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary-ghost" style={{ padding: '6px 12px', fontSize: '0.9rem' }} onClick={() => handleEdit(p)}>Edit</button>
                            <button className="btn" style={{ padding: '6px 12px', fontSize: '0.9rem', backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#ff4d4d', border: '1px solid #ff4d4d' }} onClick={() => handleDelete(p.id)}>Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <h3>{editingPatient ? 'Edit Patient' : 'Add New Patient'}</h3>
                  
                  <div className="form-group">
                    <label>Full Name</label>
                    <input required className="input-field" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Age</label>
                      <input required className="input-field" type="number" min="0" max="150" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                    </div>
                    
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Gender</label>
                      <select required className="input-field" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>One-word Problem (e.g. Fever, Migraine)</label>
                    <input required className="input-field" type="text" value={formData.problem} onChange={e => setFormData({...formData, problem: e.target.value})} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Patient</button>
                    <button type="button" className="btn btn-secondary-ghost" onClick={cancelEdit}>Cancel</button>
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
