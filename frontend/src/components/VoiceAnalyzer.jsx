import React, { useState, useRef, useEffect } from 'react';
import { analyzeVoiceTranscript } from '../api';

const SEVERITY_CONFIG = {
  Critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)', border: '#ef4444', emoji: '🚨', glow: 'rgba(220,38,38,0.4)' },
  High:     { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: '#f59e0b', emoji: '⚠️', glow: 'rgba(217,119,6,0.4)' },
  Moderate: { color: '#0077b6', bg: 'rgba(0,119,182,0.10)',  border: '#0096c7', emoji: '🔶', glow: 'rgba(0,150,199,0.4)' },
  Low:      { color: '#059669', bg: 'rgba(5,150,105,0.10)',  border: '#10b981', emoji: '✅', glow: 'rgba(16,185,129,0.4)' },
};

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: '🇺🇸 English' },
  { code: 'es-ES', label: '🇪🇸 Spanish (Español)' },
  { code: 'hi-IN', label: '🇮🇳 Hindi (हिन्दी)' },
  { code: 'fr-FR', label: '🇫🇷 French (Français)' },
  { code: 'de-DE', label: '🇩🇪 German (Deutsch)' },
  { code: 'zh-CN', label: '🇨🇳 Chinese (中文)' },
  { code: 'ar-SA', label: '🇸🇦 Arabic (العربية)' },
  { code: 'ru-RU', label: '🇷🇺 Russian (Русский)' },
  { code: 'pt-BR', label: '🇧🇷 Portuguese (Português)' },
  { code: 'it-IT', label: '🇮🇹 Italian (Italiano)' },
  { code: 'ja-JP', label: '🇯🇵 Japanese (日本語)' },
  { code: 'ko-KR', label: '🇰🇷 Korean (한국어)' }
];

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
  const [selectedLang, setSelectedLang] = useState('en-US');

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
    recognition.lang = selectedLang;

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
      setHistory(prev => [{ transcript: text.trim(), result, timestamp: new Date().toLocaleTimeString(), lang: selectedLang }, ...prev.slice(0, 4)]);
    } catch (err) {
      setError('Analysis failed: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStopAndAnalyze = () => {
    stopRecording();
    setTimeout(() => {
      runAnalysis(transcript);
    }, 300);
  };

  const handleTextAnalyze = () => {
    runAnalysis(manualText);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const cfg = analysis ? (SEVERITY_CONFIG[analysis.severity] || SEVERITY_CONFIG.Low) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '860px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #0f172a, #003554)', color: '#fff', padding: '24px 28px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>🎙️</span>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-heading)' }}>
                Voice Symptom Intake & Dynamic NLP
              </h2>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
              Hands-free voice recording with multi-symptom extraction & dynamic clinical decision support.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setInputMode('voice')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                background: inputMode === 'voice' ? '#0096c7' : 'rgba(255,255,255,0.1)', color: '#fff'
              }}
            >
              🎤 Live Voice Mode
            </button>
            <button
              onClick={() => setInputMode('text')}
              style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem',
                background: inputMode === 'text' ? '#0096c7' : 'rgba(255,255,255,0.1)', color: '#fff'
              }}
            >
              ⌨️ Text Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Interface Card */}
      <div className="card" style={{ padding: '28px', borderRadius: '16px' }}>
        
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <label style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Select Spoken Language:
          </label>
          <select
            value={selectedLang}
            onChange={e => setSelectedLang(e.target.value)}
            disabled={isRecording}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-color)',
              background: '#f8fafc', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem'
            }}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.label}</option>
            ))}
          </select>
        </div>

        {inputMode === 'voice' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            
            {/* Visualizer Circle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isRecording && (
                <div style={{
                  position: 'absolute', width: `${140 + pulseLevel * 60}px`, height: `${140 + pulseLevel * 60}px`,
                  borderRadius: '50%', background: 'rgba(0,150,199,0.15)', border: '2px solid rgba(0,150,199,0.3)',
                  transition: 'all 0.1s ease-out', pointerEvents: 'none'
                }} />
              )}
              
              <button
                id="voice-record-btn"
                onClick={isRecording ? handleStopAndAnalyze : startRecording}
                disabled={isAnalyzing}
                style={{
                  width: '110px', height: '110px', borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: isRecording
                    ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
                    : 'linear-gradient(135deg, #0096c7, #005b9f)',
                  color: '#fff', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isRecording ? '0 0 30px rgba(220,38,38,0.5)' : '0 8px 24px rgba(0,150,199,0.35)',
                  transition: 'all 0.2s ease', zIndex: 2
                }}
              >
                {isRecording ? '⏹️' : '🎙️'}
              </button>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isRecording ? '#dc2626' : 'var(--text-primary)' }}>
                {isRecording ? `Recording... (${formatTime(recordingTime)})` : 'Click microphone to record natural speech intake'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {isRecording ? 'Speak naturally describing all symptoms (chest pain, fever, vomiting, etc.)' : 'Supports natural multi-symptom conversations & combinations'}
              </p>
            </div>

            {/* Live Transcript */}
            {transcript && (
              <div style={{ width: '100%', background: 'rgba(0,150,199,0.05)', border: '1px solid rgba(0,150,199,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                <span style={{ fontSize: '0.75rem', color: '#0096c7', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  SPEECH TRANSCRIPT ({selectedLang})
                </span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>"{transcript}"</p>
              </div>
            )}
          </div>
        ) : (
          /* Text Input Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Describe the patient's symptoms in any natural spoken phrasing:
            </label>
            <textarea
              id="voice-text-input"
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              placeholder="e.g. Patient complains of severe headache, fever for 2 days, dizziness, and repeated vomiting..."
              rows={5}
              style={{
                width: '100%', padding: '14px', background: '#f1f5f9',
                border: '1px solid var(--border-color)', borderRadius: '10px',
                color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem',
                resize: 'vertical', outline: 'none', lineHeight: 1.6
              }}
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
                opacity: isAnalyzing || !manualText.trim() ? 0.6 : 1
              }}
            >
              {isAnalyzing ? '⏳ Analyzing...' : '🔍 Analyze Speech Symptoms'}
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', padding: '14px 16px', color: '#b91c1c', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-color)', borderTopColor: '#0096c7', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          Analyzing speech transcript with Multi-Symptom NLP engine...
        </div>
      )}

      {/* Multi-Symptom Analysis Results Card */}
      {analysis && cfg && !isAnalyzing && (
        <div style={{
          background: cfg.bg, border: `1.5px solid ${cfg.border}`, borderRadius: '16px', overflow: 'hidden',
          boxShadow: `0 8px 30px ${cfg.glow}`
        }}>
          {/* Result Header */}
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '2rem' }}>{cfg.emoji}</span>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: cfg.color, marginBottom: '3px' }}>
                  Extracted Clinical Presentation
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: cfg.color }}>
                  {analysis.detected_problem}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ background: cfg.color, color: '#fff', padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.85rem' }}>
                {analysis.severity} Severity
              </span>
              <span style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${cfg.border}`, color: cfg.color, padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '0.8rem' }}>
                Dept: {analysis.recommended_department || 'General Triage'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Extracted Symptoms Tags */}
            {analysis.detected_symptoms && analysis.detected_symptoms.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: cfg.color, textTransform: 'uppercase', marginBottom: '8px' }}>
                  🔍 Identified Symptoms ({analysis.detected_symptoms.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {analysis.detected_symptoms.map((symptom, idx) => (
                    <span key={idx} style={{ background: '#ffffff', border: `1px solid ${cfg.border}`, color: cfg.color, padding: '5px 12px', borderRadius: '16px', fontSize: '0.82rem', fontWeight: 700 }}>
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Possible Clinical Concerns (Multi-Item) */}
            {analysis.possible_clinical_concerns && analysis.possible_clinical_concerns.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: cfg.color, textTransform: 'uppercase', marginBottom: '8px' }}>
                  🏥 Possible Clinical Concerns (Non-Definitive Differential)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {analysis.possible_clinical_concerns.map((concern, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${cfg.border}`, padding: '10px 14px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      • {concern}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Next Steps */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: cfg.color, textTransform: 'uppercase', marginBottom: '8px' }}>
                  📋 Recommended Clinical Evaluation Steps
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      <span style={{ width: '22px', height: '22px', background: cfg.color, color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>
                        {i + 1}
                      </span>
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Disclaimer */}
          <div style={{ padding: '12px 24px', borderTop: `1px solid ${cfg.border}`, background: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            🛡️ {analysis.disclaimer || 'Clinical Decision Support Only - Not a Medical Diagnosis'}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-primary)' }}>
            📜 Recent Voice & Natural Language Assessments
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map((item, i) => {
              const hcfg = SEVERITY_CONFIG[item.result.severity] || SEVERITY_CONFIG.Low;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: hcfg.bg, border: `2px solid ${hcfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900, color: hcfg.color, flexShrink: 0 }}>
                    {item.result.ai_score}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: hcfg.color }}>{item.result.detected_problem}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      "{item.transcript}"
                    </div>
                  </div>
                  <span style={{ background: hcfg.color, color: '#fff', padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700 }}>{item.result.severity}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
