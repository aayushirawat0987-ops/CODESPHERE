import React, { useState, useRef, useEffect } from 'react';
import { analyzeFaceImage } from '../api';

const DISTRESS_CONFIG = {
  Critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: '#ef4444', emoji: '🚨', glow: 'rgba(220,38,38,0.4)' },
  High:     { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: '#f59e0b', emoji: '⚠️', glow: 'rgba(217,119,6,0.4)' },
  Moderate: { color: '#0077b6', bg: 'rgba(0,119,182,0.10)',  border: '#0096c7', emoji: '🔷', glow: 'rgba(0,150,199,0.4)' },
  Low:      { color: '#059669', bg: 'rgba(5,150,105,0.10)',  border: '#10b981', emoji: '✅', glow: 'rgba(16,185,129,0.4)' },
};

export default function FaceAnalyzer() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  // Landmark sliders / simulation controls
  const [simPain, setSimPain] = useState(6);
  const [simDroop, setSimDroop] = useState(false);
  const [simPallor, setSimPallor] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startWebcam = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      setError('Could not access camera. Please allow webcam permissions or upload an image file.');
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, []);

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setImagePreview(dataUrl);
    stopWebcam();
    runFaceAnalysis(dataUrl);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      stopWebcam();
      runFaceAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runFaceAnalysis = async (dataUrl = null) => {
    setIsScanning(true);
    setError('');
    try {
      const res = await analyzeFaceImage({
        image_base64: dataUrl || imagePreview,
        pain_scale: simPain,
        facial_droop: simDroop,
        pallor: simPallor
      });
      setAnalysis(res);
    } catch (err) {
      setError('Facial vision analysis failed: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const cfg = analysis ? DISTRESS_CONFIG[analysis.distress_level] || DISTRESS_CONFIG.Low : null;

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.6rem' }}>📷</span>
          AI Facial Distress & Vision Analyzer
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Real-time computer-vision triage scanner detecting facial pain expressions, FAST stroke asymmetry, and pallor
        </p>
      </div>

      {/* Main Scanner Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Camera / Viewport Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          
          <div style={{ position: 'relative', width: '100%', height: '280px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {/* Live Video Feed */}
            {isCameraActive && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Captured Image Preview */}
            {!isCameraActive && imagePreview && (
              <img
                src={imagePreview}
                alt="Patient Facial Snapshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {/* Empty Viewport Placeholder */}
            {!isCameraActive && !imagePreview && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>👤</span>
                <p style={{ fontSize: '0.85rem' }}>Camera inactive. Click 'Start Camera' or upload a photo.</p>
              </div>
            )}

            {/* Facial Scanner Overlay Grid */}
            {(isCameraActive || imagePreview || isScanning) && (
              <div style={{
                position: 'absolute', inset: '10%', border: '2px dashed rgba(0,212,255,0.7)', borderRadius: '50%',
                boxShadow: '0 0 20px rgba(0,212,255,0.3)', pointerEvents: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{ width: '80%', height: '2px', background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)', animation: 'scanLine 2s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {!isCameraActive ? (
              <button
                onClick={startWebcam}
                style={{
                  flex: 1, padding: '12px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.9rem', color: '#fff',
                  background: 'linear-gradient(135deg, #0096c7, #005b9f)', boxShadow: '0 4px 14px rgba(0,91,159,0.3)'
                }}
              >
                📹 Start Camera
              </button>
            ) : (
              <button
                onClick={captureSnapshot}
                style={{
                  flex: 1, padding: '12px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.9rem', color: '#fff',
                  background: 'linear-gradient(135deg, #059669, #047857)', boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
                }}
              >
                📸 Capture & Scan
              </button>
            )}

            <label style={{
              flex: 1, padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-color)',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)',
              background: '#f8fafc', textAlign: 'center'
            }}>
              📁 Upload Photo
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Quick Simulation Toggles */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
              Facial Landmark & Clinical Adjusters
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Facial Pain Expression Level: <strong>{simPain}/10</strong></span>
              <input type="range" min="1" max="10" value={simPain} onChange={e => setSimPain(Number(e.target.value))} style={{ width: '120px' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simDroop} onChange={e => setSimDroop(e.target.checked)} />
                Facial Droop (FAST Sign)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simPallor} onChange={e => setSimPallor(e.target.checked)} />
                Skin Pallor / Cyanosis
              </label>
            </div>

            <button
              onClick={() => runFaceAnalysis()}
              disabled={isScanning}
              style={{
                padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.85rem', color: '#fff', background: '#0284c7'
              }}
            >
              {isScanning ? '⏳ Scanning Face...' : '🔍 Analyze Facial Indicators'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', pb: '12px' }}>
            Facial Vision Diagnostic Results
          </h3>

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '14px', color: '#b91c1c', fontSize: '0.875rem' }}>
              ⚠️ {error}
            </div>
          )}

          {isScanning && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#0096c7', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Running Facial Neural Vision Model...
            </div>
          )}

          {!analysis && !isScanning && !error && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Start camera, take a snapshot, or click 'Analyze Facial Indicators' to view vision AI triage feedback.
            </div>
          )}

          {analysis && cfg && !isScanning && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'modalIn 0.3s ease-out' }}>
              
              {/* Summary Card */}
              <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.4rem' }}>{cfg.emoji}</span>
                  <span style={{ background: cfg.color, color: '#fff', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.75rem' }}>
                    {analysis.distress_level} Distress
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: cfg.color, marginBottom: '4px' }}>
                  {analysis.detected_expression}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Vision Mode: <strong>{analysis.ai_vision_mode}</strong>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pain Index</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: cfg.color }}>{analysis.facial_pain_score}/10</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>FAST Stroke Risk</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: analysis.stroke_asymmetry_risk === 'High' ? '#dc2626' : '#059669' }}>
                    {analysis.stroke_asymmetry_risk}
                  </div>
                </div>
              </div>

              {/* Red Flags */}
              {analysis.red_flags.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#dc2626' }}>Red Flag Alerts</span>
                  {analysis.red_flags.map((flag, idx) => (
                    <div key={idx} style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '8px 12px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600 }}>
                      {flag}
                    </div>
                  ))}
                </div>
              )}

              {/* Clinical Recommendations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Clinical Next Steps</span>
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                    <span style={{ width: '18px', height: '18px', background: '#0096c7', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
                      {idx + 1}
                    </span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLine { 0% { transform: translateY(-100px); } 100% { transform: translateY(100px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
