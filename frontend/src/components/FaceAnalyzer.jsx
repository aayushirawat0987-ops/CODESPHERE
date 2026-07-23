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

  // 8-Point Observation Simulation Controls
  const [simPain, setSimPain] = useState(6);
  const [simDroop, setSimDroop] = useState(false);
  const [simPallor, setSimPallor] = useState(false);
  const [simCyanosis, setSimCyanosis] = useState(false);
  const [simSwelling, setSimSwelling] = useState(false);
  const [simEyeAbnormal, setSimEyeAbnormal] = useState(false);
  const [simFatigue, setSimFatigue] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const startWebcam = async () => {
    setError('');
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      
      streamRef.current = stream;
      setIsCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (err) {
      console.warn('Webcam access error:', err);
      setError('Camera permission denied or camera offline. Generated AI facial vision snapshot below.');
      generateSimulatedSnapshot();
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

  const generateSimulatedSnapshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 640, 480);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 640; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke();
    }
    for (let y = 0; y < 480; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
    }

    ctx.fillStyle = simCyanosis ? '#94a3b8' : simPallor ? '#cbd5e1' : '#fde047';
    ctx.beginPath();
    ctx.ellipse(320, 230, 110, 140, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(280, 200, 14, 0, Math.PI * 2);
    ctx.arc(360, simDroop ? 215 : 200, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = simCyanosis ? '#3b82f6' : '#00d4ff';
    ctx.beginPath();
    ctx.arc(282, 198, 4, 0, Math.PI * 2);
    ctx.arc(362, simDroop ? 213 : 198, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = simCyanosis ? '#2563eb' : '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    if (simPain >= 7) {
      ctx.arc(320, 290, 25, Math.PI, Math.PI * 2);
    } else {
      ctx.arc(320, 270, 25, 0, Math.PI);
    }
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setImagePreview(dataUrl);
    return dataUrl;
  };

  const captureSnapshot = () => {
    if (videoRef.current && isCameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      stopWebcam();
      runFaceAnalysis(dataUrl);
    }
  };

  const runFaceAnalysis = async (imgBase64 = null) => {
    setIsScanning(true);
    setError('');
    const targetImage = imgBase64 || imagePreview || generateSimulatedSnapshot();
    
    try {
      const payload = {
        image_base64: targetImage,
        pain_scale: simPain,
        facial_droop: simDroop,
        pallor: simPallor,
        cyanosis: simCyanosis,
        swelling: simSwelling,
        eye_abnormal: simEyeAbnormal,
        fatigue: simFatigue
      };
      
      const result = await analyzeFaceImage(payload);
      setAnalysis(result);
    } catch (err) {
      setError('Face analysis failed: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target.result;
        setImagePreview(base64);
        stopWebcam();
        runFaceAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const cfg = analysis ? (DISTRESS_CONFIG[analysis.distress_level] || DISTRESS_CONFIG.Low) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff', padding: '24px 28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>📷</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                Multi-Observation Facial Vision Diagnostic Scanner
              </h2>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
              Evaluates 8 distinct visual clinical observations: Pain expression, FAST Asymmetry, Eye signs, Swelling, Pallor, Cyanosis, Fatigue, and Acute Distress.
            </p>
          </div>

          <div style={{ background: 'rgba(0,212,255,0.15)', border: '1px solid #00d4ff', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, color: '#00d4ff' }}>
            ● 8-Point Observation Breakdown
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Camera & Adjusters Card */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ position: 'relative', width: '100%', height: '260px', background: '#0f172a', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            
            {isCameraActive && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {!isCameraActive && imagePreview && (
              <img
                src={imagePreview}
                alt="Patient Facial Snapshot"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {!isCameraActive && !imagePreview && (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>👤</span>
                <p style={{ fontSize: '0.85rem' }}>Camera inactive. Click 'Start Camera' or '⚡ AI Face Snapshot'.</p>
              </div>
            )}

            {(isCameraActive || imagePreview || isScanning) && (
              <>
                <div style={{
                  position: 'absolute', inset: '10%', border: simDroop || simCyanosis ? '2px dashed #ef4444' : '2px dashed #00d4ff', borderRadius: '50%',
                  boxShadow: simDroop || simCyanosis ? '0 0 20px rgba(239,68,68,0.4)' : '0 0 20px rgba(0,212,255,0.3)', pointerEvents: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <div style={{ width: '80%', height: '2px', background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)', animation: 'scanLine 2s linear infinite' }} />
                </div>
                <div style={{
                  position: 'absolute', top: '12px', left: '12px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', color: '#00d4ff', fontSize: '0.75rem', fontWeight: 700
                }}>
                  ● MULTI-VISION SCAN: {simDroop ? 'FAST ASYMMETRY' : simCyanosis ? 'CYANOSIS HYPOXIA' : 'LOCK 98.6%'}
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {!isCameraActive ? (
              <button
                onClick={startWebcam}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem', color: '#fff', background: 'linear-gradient(135deg, #0096c7, #005b9f)'
                }}
              >
                📹 Start Camera
              </button>
            ) : (
              <button
                onClick={captureSnapshot}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem', color: '#fff', background: 'linear-gradient(135deg, #059669, #047857)'
                }}
              >
                📸 Capture Snapshot
              </button>
            )}

            <button
              onClick={() => {
                const url = generateSimulatedSnapshot();
                runFaceAnalysis(url);
              }}
              style={{
                flex: 1, padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.85rem', color: '#fff', background: 'linear-gradient(135deg, #7c3aed, #5b21b6)'
              }}
            >
              ⚡ AI Face Snapshot
            </button>

            <label style={{
              padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)',
              cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', background: '#f8fafc'
            }}>
              📁 Upload
              <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          {/* 8-Point Visual Adjusters Panel */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              🎛️ Clinical Visual Feature Adjusters
            </span>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Facial Pain Expression Level: <strong>{simPain}/10</strong></span>
              <input type="range" min="1" max="10" value={simPain} onChange={e => setSimPain(Number(e.target.value))} style={{ width: '120px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simDroop} onChange={e => setSimDroop(e.target.checked)} /> FAST Facial Droop
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simPallor} onChange={e => setSimPallor(e.target.checked)} /> Skin Pallor
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simCyanosis} onChange={e => setSimCyanosis(e.target.checked)} /> Perioral Cyanosis
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simSwelling} onChange={e => setSimSwelling(e.target.checked)} /> Facial Swelling
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simEyeAbnormal} onChange={e => setSimEyeAbnormal(e.target.checked)} /> Eye Ptosis / Redness
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={simFatigue} onChange={e => setSimFatigue(e.target.checked)} /> Fatigue / Lethargy
              </label>
            </div>

            <button
              onClick={() => runFaceAnalysis()}
              disabled={isScanning}
              style={{
                padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '0.85rem', color: '#fff', background: '#0284c7', marginTop: '4px'
              }}
            >
              {isScanning ? '⏳ Evaluating 8 Facial Observations...' : '🔍 Analyze All 8 Observations'}
            </button>
          </div>
        </div>

        {/* 8-Point Observation Results Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', margin: 0 }}>
            Facial Observation Assessment
          </h3>

          {error && (
            <div style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '10px', padding: '14px', color: '#b45309', fontSize: '0.875rem' }}>
              ℹ️ {error}
            </div>
          )}

          {isScanning && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: '#0096c7', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
              Analyzing 8 distinct visual observations...
            </div>
          )}

          {!analysis && !isScanning && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Click 'Analyze All 8 Observations' to view individual findings for Pain expression, Facial asymmetry, Eye signs, Swelling, Pallor, Cyanosis, Fatigue, and Distress.
            </div>
          )}

          {analysis && cfg && !isScanning && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Summary Banner */}
              <div style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: cfg.color }}>{analysis.detected_expression}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Engine: {analysis.ai_vision_mode}</div>
                </div>
                <span style={{ background: cfg.color, color: '#fff', padding: '4px 12px', borderRadius: '12px', fontWeight: 800, fontSize: '0.8rem' }}>
                  {analysis.distress_level} Distress
                </span>
              </div>

              {/* 8 Observations Breakdown List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Evaluated Observations Breakdown (8 Items)
                </span>
                
                {(analysis.observations_breakdown || []).map((obs, idx) => {
                  const isBad = obs.severity === 'High' || obs.severity === 'Critical';
                  const isMod = obs.severity === 'Moderate';
                  const obsColor = isBad ? '#dc2626' : isMod ? '#d97706' : '#059669';
                  const obsBg = isBad ? 'rgba(220,38,38,0.06)' : isMod ? 'rgba(217,119,6,0.06)' : '#f8fafc';
                  
                  return (
                    <div key={idx} style={{ background: obsBg, border: `1px solid ${isBad ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{obs.name}</strong>
                        <span style={{ background: obsColor, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800 }}>
                          {obs.status}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {obs.explanation}
                      </p>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scanLine { 0% { transform: translateY(-90px); } 100% { transform: translateY(90px); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
