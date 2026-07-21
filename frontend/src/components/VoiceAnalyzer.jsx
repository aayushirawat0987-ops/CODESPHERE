import React, { useState, useRef, useEffect } from 'react';
import { analyzeVoiceTranscript } from '../api';

const SEVERITY_CONFIG = {
  Critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: '#ef4444', emoji: '🚨', glow: 'rgba(220,38,38,0.4)' },
  High:     { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: '#f59e0b', emoji: '⚠️', glow: 'rgba(217,119,6,0.4)' },
  Moderate: { color: '#0077b6', bg: 'rgba(0,119,182,0.10)',  border: '#0096c7', emoji: '🔶', glow: 'rgba(0,150,199,0.4)' },
  Low:      { color: '#059669', bg: 'rgba(5,150,105,0.10)',  border: '#10b981', emoji: '✅', glow: 'rgba(16,185,129,0.4)' },
};

export default function VoiceAnalyzer() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [pulseLevel, setPulseLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [history, setHistory] = useState([]);
  const [manualText, setManualText] = useState('');
  const [inputMode, setInputMode] = useState('voice'); // 'voice' | 'text'

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const pulseRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pulseRef.current) clearInterval(pulseRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Chrome or Edge, or switch to text input mode.');
      return;
    }

    setError('');
    setTranscript('');
    setAnalysis(null);
    setRecordingTime(0);

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + ' ';
      }
      setTranscript(full.trim());
    };

    recognition.onerror = (event) => {
      setError(`Microphone error: ${event.error}. Try text input mode.`);
      stopRecording();
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);

    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    pulseRef.current = setInterval(() => setPulseLevel(Math.random()), 120);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pulseRef.current) clearInterval(pulseRef.current);
    setPulseLevel(0);
  };

  const runAnalysis = async (text) => {
    if (!text.trim()) { setError('No speech or text detected. Please try again.'); return; }
    setIsAnalyzing(true);
    setError('');
    try {
      const result = await analyzeVoiceTranscript(text.trim());
      setAnalysis(result);
      setHistory(prev => [{ transcript: text.trim(), result, timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch (err) {
      setError('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStopAndAnalyze = () => {
    stopRecording();
    setTimeout(() => runAnalysis(transcript), 300);
  };

  const handleTextAnalyze = () => {
    runAnalysis(manualText);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const cfg = analysis ? SEVERITY_CONFIG[analysis.severity] || SEVERITY_CONFIG.Low : null;

  // Waveform bars
  const bars = Array.from({ length: 24 }, (_, i) => {
    const h = isRecording ? 8 + Math.abs(Math.sin((i + pulseLevel * 20) * 0.7)) * 40 : 6;
    return h;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🎙️</span>
            Voice Symptom Analyzer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Speak your symptoms naturally — AI detects the condition & assigns an urgency score
          </p>
        </div>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-color)' }}>
          {['voice', 'text'].map(mode => (
            <button key={mode} onClick={() => setInputMode(mode)}
              style={{
                padding: '6px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                background: inputMode === mode ? 'linear-gradient(135deg,#0096c7,#005b9f)' : 'transparent',
                color: inputMode === mode ? '#fff' : 'var(--text-secondary)',
              }}>
              {mode === 'voice' ? '🎤 Voice' : '⌨️ Text'}
            </button>
          ))}
        </div>
      </div>

      {/* Recorder / Text Input Panel */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '28px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
        {inputMode === 'voice' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            
            {/* Waveform Visualizer */}
            <div style={{
              width: '100%', maxWidth: '480px', height: '80px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
              background: 'rgba(0,150,199,0.04)', borderRadius: '12px',
              border: `1px solid ${isRecording ? 'rgba(0,150,199,0.3)' : 'var(--border-color)'}`,
              padding: '12px', transition: 'border-color 0.3s',
            }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: '6px', height: `${h}px`, borderRadius: '3px', transition: 'height 0.1s',
                  background: isRecording
                    ? `hsl(${200 + i * 4}, 80%, ${40 + h}%)`
                    : 'var(--border-color)',
                }} />
              ))}
            </div>

            {/* Timer */}
            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '10px', height: '10px', background: '#dc2626', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatTime(recordingTime)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recording...</span>
              </div>
            )}

            {/* Record Button */}
            <button
              id="voice-record-btn"
              onClick={isRecording ? handleStopAndAnalyze : startRecording}
              style={{
                width: '90px', height: '90px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: isRecording
                  ? 'linear-gradient(135deg, #dc2626, #991b1b)'
                  : 'linear-gradient(135deg, #0096c7, #005b9f)',
                color: '#fff', fontSize: '2rem',
                boxShadow: isRecording
                  ? '0 0 0 8px rgba(220,38,38,0.2), 0 0 30px rgba(220,38,38,0.4)'
                  : '0 0 0 6px rgba(0,150,199,0.15), 0 8px 24px rgba(0,91,159,0.35)',
                transition: 'all 0.3s ease',
                transform: isRecording ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {isRecording ? '⏹' : '🎤'}
            </button>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              {isRecording ? 'Click to stop & analyze' : 'Click to start speaking your symptoms'}
            </p>

            {/* Live Transcript */}
            {transcript && (
              <div style={{
                width: '100%', background: 'rgba(0,150,199,0.05)', border: '1px solid rgba(0,150,199,0.2)',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>TRANSCRIPT</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{transcript}</p>
              </div>
            )}
          </div>
        ) : (
          /* Text Input Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Describe the patient's symptoms in plain language:
            </label>
            <textarea
              id="voice-text-input"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="e.g. I have severe chest pain and difficulty breathing, my heart is racing..."
              rows={5}
              style={{
                width: '100%', padding: '14px', background: '#f1f5f9',
                border: '1px solid var(--border-color)', borderRadius: '10px',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                resize: 'vertical', outline: 'none', lineHeight: 1.6,
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
            />
            <button
              id="voice-analyze-btn"
              onClick={handleTextAnalyze}
              disabled={isAnalyzing || !manualText.trim()}
              style={{
                alignSelf: 'flex-end', padding: '12px 28px', borderRadius: '10px', border: 'none',
                cursor: isAnalyzing || !manualText.trim() ? 'not-allowed' : 'pointer', fontWeight: 700,
                fontSize: '0.95rem', color: '#fff',
                background: 'linear-gradient(135deg, #0096c7, #005b9f)',
                opacity: isAnalyzing || !manualText.trim() ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(0,91,159,0.3)', transition: 'all 0.2s',
              }}
            >
              {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Symptoms'}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '14px 16px', color: '#b91c1c', fontSize: '0.875rem', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <span>⚠️</span> <span>{error}</span>
        </div>
      )}

      {/* Analyzing Indicator */}
      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-color)', borderTopColor: '#0096c7', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          Analyzing symptoms with AI engine...
        </div>
      )}

      {/* Analysis Result */}
      {analysis && cfg && !isAnalyzing && (
        <div style={{
          background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '16px', overflow: 'hidden',
          boxShadow: `0 8px 30px ${cfg.glow}`,
          animation: 'modalIn 0.3s ease-out',
        }}>
          {/* Result Header */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>{cfg.emoji}</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: cfg.color, marginBottom: '3px' }}>
                  Detected Condition
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: cfg.color }}>
                  {analysis.detected_problem}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', align: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Severity Badge */}
              <div style={{ background: cfg.color, color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                {analysis.severity} Severity
              </div>
              {/* Confidence */}
              <div style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${cfg.border}`, color: cfg.color, padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                {analysis.confidence} Confidence
              </div>
            </div>
          </div>

          {/* Score + Details */}
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '24px', alignItems: 'start' }}>
            {/* AI Score Dial */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: `conic-gradient(${cfg.color} ${analysis.ai_score * 36}deg, rgba(0,0,0,0.08) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${cfg.glow}`,
              }}>
                <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: cfg.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: cfg.color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{analysis.ai_score}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: cfg.color }}>/ 10</span>
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Score</span>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Keywords */}
              {analysis.keywords_found.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    🔍 Detected Keywords
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {analysis.keywords_found.map(kw => (
                      <span key={kw} style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${cfg.border}`, color: cfg.color, padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  📋 Clinical Recommendations
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      <span style={{ width: '20px', height: '20px', background: cfg.color, color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ padding: '12px 24px', borderTop: `1px solid ${cfg.border}`, background: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ⚠️ This is a decision-support tool only. Clinicians retain full diagnostic authority.
          </div>
        </div>
      )}

      {/* Analysis History */}
      {history.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📜 Recent Analyses
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((item, i) => {
              const hcfg = SEVERITY_CONFIG[item.result.severity] || SEVERITY_CONFIG.Low;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: hcfg.bg, border: `2px solid ${hcfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900, color: hcfg.color, flexShrink: 0 }}>
                    {item.result.ai_score}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: hcfg.color }}>{item.result.detected_problem}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{item.transcript.slice(0, 60)}{item.transcript.length > 60 ? '...' : ''}"
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                    <span style={{ background: hcfg.color, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 }}>{item.result.severity}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
