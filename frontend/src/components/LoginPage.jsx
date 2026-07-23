import React, { useState } from 'react';
import { loginUser, registerUser } from '../api';

export default function LoginPage({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('doctor'); // 'patient' | 'doctor' | 'nurse' | 'admin'
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const PRESETS = [
    { role: 'doctor', username: 'doctor', name: 'Dr. Sarah Jenkins', title: '👨‍⚕️ Doctor', dept: 'Cardiology / ER' },
    { role: 'nurse', username: 'nurse', name: 'Nurse Mary Rivera', title: '🩺 Nurse', dept: 'Emergency Triage' },
    { role: 'patient', username: 'patient', name: 'John Doe', title: '👤 Patient', dept: 'Outpatient' },
    { role: 'admin', username: 'admin', name: 'Admin Alex Vance', title: '⚙️ Administrator', dept: 'Hospital Admin' },
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
      if (isRegister) {
        const res = await registerUser({
          username: username.trim(),
          password,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role: selectedRole
        });
        onLoginSuccess(res.user);
      } else {
        const res = await loginUser(username.trim(), password);
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', padding: '20px', boxSizing: 'border-box'
    }}>
      <div style={{
        maxWidth: '920px', width: '100%', display: 'grid', gridTemplateColumns: '1.1fr 1fr',
        background: '#ffffff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        
        {/* Left Branding Panel */}
        <div style={{
          background: 'linear-gradient(135deg, #0096c7 0%, #005b9f 100%)', padding: '40px', color: '#ffffff',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 900, color: '#0077b6'
              }}>
                V
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '0.5px' }}>VITALIS</h2>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>Hospital Command Center System</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 12px', lineHeight: 1.3 }}>
              Enterprise AI Triage & Clinical Decision Support
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
              Secure role-based authentication with automatic Patient ID generation (<strong style={{ color: '#fff' }}>VIT-2026-XXXXXX</strong>), scannable QR codes, and persistent SQLite storage.
            </p>
          </div>

          {/* Quick Demo Login Presets */}
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              ⚡ Single-Click Quick Demo Login:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickLogin(p)}
                  disabled={loading}
                  style={{
                    padding: '8px 10px', borderRadius: '10px', border: 'none', background: '#ffffff',
                    color: '#0f172a', textAlign: 'left', cursor: 'pointer', transition: 'transform 0.15s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.78rem' }}>{p.title}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{p.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          {/* Role Selection Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
            {['doctor', 'nurse', 'patient', 'admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                style={{
                  flex: 1, padding: '8px 4px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: '0.78rem', textTransform: 'capitalize',
                  background: selectedRole === r ? '#ffffff' : 'transparent',
                  color: selectedRole === r ? '#0096c7' : '#64748b',
                  boxShadow: selectedRole === r ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'
                }}
              >
                {r === 'doctor' ? '👨‍⚕️ Doctor' : r === 'nurse' ? '🩺 Nurse' : r === 'patient' ? '👤 Patient' : '⚙️ Admin'}
              </button>
            ))}
          </div>

          <h3 style={{ margin: '0 0 4px', fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>
            {isRegister ? `Register New ${selectedRole.toUpperCase()}` : `${selectedRole.toUpperCase()} Login`}
          </h3>
          <p style={{ margin: '0 0 20px', fontSize: '0.8rem', color: '#64748b' }}>
            {selectedRole === 'patient' ? 'Patients can self-register or log in to view their own records.' : `Restricted area. Only authorized ${selectedRole}s may log in.`}
          </p>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>Full Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>Email Address</label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="jane@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>Phone Number</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="+1 (555) 000-1122"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '4px', display: 'block' }}>
                Username / Patient ID
              </label>
              <input
                type="text"
                className="input-field"
                placeholder={selectedRole === 'patient' ? 'e.g. patient or VIT-2026-000001' : 'e.g. doctor, nurse, admin'}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Password</label>
                <span onClick={() => alert('Demo password is: password123')} style={{ fontSize: '0.72rem', color: '#0096c7', cursor: 'pointer', fontWeight: 700 }}>
                  Forgot Password?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#64748b'
                  }}
                >
                  {showPassword ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#64748b', cursor: 'pointer' }}>
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Remember Me
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '12px', fontSize: '0.9rem', marginTop: '6px' }}>
              {loading ? 'Authenticating...' : isRegister ? `📝 Register & Access System` : `🔐 Log In as ${selectedRole.toUpperCase()}`}
            </button>
          </form>

          {selectedRole === 'patient' && (
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.82rem', color: '#64748b' }}>
              {isRegister ? (
                <>Already have a Patient ID? <span onClick={() => setIsRegister(false)} style={{ color: '#0096c7', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Log In</span></>
              ) : (
                <>New Patient? <span onClick={() => setIsRegister(true)} style={{ color: '#0096c7', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}>Register Patient Account</span></>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
