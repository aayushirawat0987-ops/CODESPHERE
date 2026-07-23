import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('doctor');
  const [department, setDepartment] = useState('Cardiology / ER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PRESETS = [
    { username: 'doctor', role: 'doctor', name: 'Dr. Sarah Jenkins', title: '👨‍⚕️ Doctor' },
    { username: 'nurse', role: 'nurse', name: 'Nurse Mary Rivera', title: '🩺 Nurse' },
    { username: 'patient', role: 'patient', name: 'John Doe', title: '👤 Patient' },
    { username: 'admin', role: 'admin', name: 'Admin Alex Vance', title: '⚙️ Admin' },
  ];

  const handleQuickLogin = async (preset) => {
    setLoading(true);
    setError('');
    try {
      const res = await loginUser(preset.username, 'password123');
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        const res = await loginUser(username, password);
        onLoginSuccess(res.user);
      } else {
        const res = await registerUser({ username, password, name, role, department });
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 1300 }}>
      <div className="modal-card" style={{ maxWidth: '520px', width: '92vw', borderRadius: '20px', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
              🔑 Hospital User Authentication
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Role-Based Access for Patients, Doctors, Nurses, and Administrators
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}>
            ✕
          </button>
        </div>

        {/* Preset Quick Login Buttons */}
        <div style={{ padding: '16px 24px 0', background: '#f8fafc' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
            ⚡ Single-Click Quick Login Presets:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickLogin(p)}
                disabled={loading}
                style={{
                  padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1',
                  background: '#ffffff', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f172a' }}>{p.title}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mode === 'register' && (
              <>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Dr. Alex Smith"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>System Role</label>
                    <select
                      className="input-field"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                    >
                      <option value="doctor">👨‍⚕️ Doctor</option>
                      <option value="nurse">🩺 Nurse</option>
                      <option value="patient">👤 Patient</option>
                      <option value="admin">⚙️ Admin</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Department</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Cardiology"
                      value={department}
                      onChange={e => setDepartment(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="Enter username (e.g. doctor, nurse)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '6px', padding: '12px' }}>
              {loading ? 'Authenticating...' : mode === 'login' ? '🔐 Log In' : '📝 Register Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.82rem', color: '#64748b' }}>
            {mode === 'login' ? (
              <>Don't have an account? <span onClick={() => setMode('register')} style={{ color: '#0096c7', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Register Here</span></>
            ) : (
              <>Already registered? <span onClick={() => setMode('login')} style={{ color: '#0096c7', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Log In Here</span></>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
