import { startMockInterview, scoreVoiceAnswer, textToSpeech } from '../api/cvApi';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';


const PERSONAS = [
  { id: 'alex', name: 'Alex', role: 'Senior Interviewer', style: 'Technical · Calm', bg: '#CECBF6', color: '#3C3489', company: 'faang' },
  { id: 'sara', name: 'Sara', role: 'Startup Founder', style: 'Fast-paced · Blunt', bg: '#9FE1CB', color: '#085041', company: 'startup' },
  { id: 'marcus', name: 'Marcus', role: 'HR Director', style: 'Formal · Structured', bg: '#FAC775', color: '#633806', company: 'corporate' },
];

function WaveBar({ active }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {[...Array(9)].map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full transition-all duration-150"
          style={{
            background: active ? '#7F77DD' : '#d1d5db',
            height: active ? `${Math.random() * 24 + 8}px` : '6px',
          }}
        />
      ))}
    </div>
  );
}

function VoiceInterview() {
  const navigate = useNavigate();
  const [cvData, setCvData] = useState(null);
  const [stage, setStage] = useState('setup');
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [scores, setScores] = useState(null);
  const [allScores, setAllScores] = useState([]);
  const [scoring, setScoring] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [totalFillers, setTotalFillers] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('cvData');
    if (!stored) { navigate('/'); return; }
    setCvData(JSON.parse(stored));
  }, [navigate]);

  useEffect(() => {
    if (stage === 'live') {
      timerRef.current = setInterval(() => setSessionTime(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [stage]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const speak = async (text, onEnd) => {
  try {
    setIsSpeaking(true);
    setWaveActive(true);

    const audioData = await textToSpeech(text, persona.id);
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);

    audio.onended = () => {
      setIsSpeaking(false);
      setWaveActive(false);
      URL.revokeObjectURL(url);
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      setIsSpeaking(false);
      setWaveActive(false);
      fallbackSpeak(text, onEnd);
    };

    await audio.play();

  } catch (error) {
    console.error('ElevenLabs speak error:', error);
    fallbackSpeak(text, onEnd);
  }
};

const fallbackSpeak = (text, onEnd) => {
  synthRef.current.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.95;
  utt.pitch = 1;
  utt.volume = 1;
  const voices = synthRef.current.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') || voices.find(v => v.lang === 'en-US');
  if (preferred) utt.voice = preferred;
  utt.onstart = () => { setIsSpeaking(true); setWaveActive(true); };
  utt.onend = () => {
    setIsSpeaking(false);
    setWaveActive(false);
    if (onEnd) onEnd();
  };
  synthRef.current.speak(utt);
};

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported. Use Chrome.'); return; }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      let final = '';
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) setTranscript(t => t + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (e) => console.error('Speech error:', e.error);
    recognition.onend = () => { setIsListening(false); setWaveActive(false); setInterimTranscript(''); };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setWaveActive(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setWaveActive(false);
    setInterimTranscript('');
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const startSession = async () => {
    setLoading(true);
    try {
      const cvAnalysis = JSON.parse(localStorage.getItem('cvData') || '{}');
const detectedRole = cvAnalysis?.analysis?.experience?.[0]?.split(' at ')?.[0] || 'Professional';
const result = await startMockInterview(cvData.cvText, detectedRole, persona.company);
      setQuestions(result.questions);
      setCurrentQ(0);
      setTranscript('');
      setScores(null);
      setAllScores([]);
      setSessionTime(0);
      setTotalFillers(0);
      setStage('live');
      setTimeout(() => {
        speak(`Hi, I'm ${persona.name}. Let's begin. ${result.questions[0].question}`);
      }, 500);
    } catch (err) {
      alert('Failed to start session. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitVoiceAnswer = async () => {
    const fullTranscript = transcript + interimTranscript;
    if (!fullTranscript.trim()) return;
    stopListening();
    setScoring(true);
    try {
      const q = questions[currentQ].question;
      const result = await scoreVoiceAnswer(q, fullTranscript, cvData.cvText);
      setScores(result.scores);
      setTotalFillers(f => f + (result.scores.totalFillers || 0));
      setAllScores(prev => [...prev, { question: q, transcript: fullTranscript, scores: result.scores }]);
    } catch (err) {
      alert('Failed to score. Try again.');
    } finally {
      setScoring(false);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      synthRef.current.cancel();
      const voiceResults = JSON.parse(localStorage.getItem('voiceResults') || '[]');
voiceResults.push({ count: allScores.length, persona: persona.name, date: new Date().toISOString() });
localStorage.setItem('voiceResults', JSON.stringify(voiceResults));
      setStage('results');
      return;
    }
    const nextQ = currentQ + 1;
    setCurrentQ(nextQ);
    setTranscript('');
    setInterimTranscript('');
    setScores(null);
    speak(questions[nextQ].question);
  };

  const fillerCount = (scores) => {
    if (!scores?.fillerWords) return 0;
    return Object.values(scores.fillerWords).reduce((a, b) => a + b, 0);
  };

  // SETUP
  if (stage === 'setup') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">🎙️ Voice Interview</h1>
            <p className="text-gray-500">Speak your answers out loud — just like the real thing. AI listens, scores, and fires back follow-ups.</p>
          </div>

          {/* Persona selection */}
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Choose your interviewer</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setPersona(p)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  persona.id === p.id ? 'border-2 border-brand-400 bg-brand-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold mb-3"
                  style={{ background: p.bg, color: p.color }}
                >
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-sm font-medium text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-400 mt-0.5 mb-2">{p.role}</div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: p.bg, color: p.color }}>
                  {p.style}
                </span>
              </button>
            ))}
          </div>

          {/* Mic check */}
          {/* Mic check */}
{!window.SpeechRecognition && !window.webkitSpeechRecognition ? (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 mb-6">
    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
    <div>
      <p className="text-sm font-medium text-red-700">Voice not supported in this browser</p>
      <p className="text-xs text-red-500 mt-0.5">Please open Hirely in <strong>Google Chrome</strong> for voice interview support</p>
    </div>
  </div>
) : (
  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-4 mb-6">
    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-700">Microphone ready</p>
      <p className="text-xs text-gray-400">Uses your browser mic — works best in Chrome</p>
    </div>
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="7" y="1" width="6" height="10" rx="3" fill="#9ca3af"/>
      <path d="M3 9C3 13 6.13 16 10 16C13.87 16 17 13 17 9" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <line x1="10" y1="16" x2="10" y2="19" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  </div>
)}

          <button
            onClick={startSession}
            disabled={loading}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Preparing your interviewer...
              </>
            ) : `Start interview with ${persona.name} →`}
          </button>
        </div>
      </Layout>
    );
  }

  // LIVE SESSION
  if (stage === 'live' && questions.length > 0) {
    const q = questions[currentQ];
    const fullTranscript = transcript + interimTranscript;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Live with {persona.name}
              </span>
              <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full border border-red-200 font-medium">
                ● REC
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ background: i < currentQ ? '#7F77DD' : i === currentQ ? '#534AB7' : '#e5e7eb' }}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">{formatTime(sessionTime)}</span>
            </div>
          </div>

          {/* Live stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-semibold text-brand-600">{currentQ + 1}/{questions.length}</div>
              <div className="text-xs text-gray-400">Question</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-semibold text-amber-500">{totalFillers}</div>
              <div className="text-xs text-gray-400">Fillers so far</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-lg font-semibold text-gray-700">{formatTime(sessionTime)}</div>
              <div className="text-xs text-gray-400">Session time</div>
            </div>
          </div>

          {/* Interviewer bubble */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ background: persona.bg, color: persona.color }}
              >
                {persona.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800">{persona.name}</div>
                <div className="text-xs text-gray-400">{persona.role}</div>
              </div>
              {isSpeaking && (
                <div className="ml-auto">
                  <WaveBar active={waveActive} />
                </div>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{q.question}</p>
            <button
              onClick={() => speak(q.question)}
              className="mt-3 text-xs text-brand-600 underline"
            >
              Repeat question
            </button>
          </div>

          {/* Live transcript */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your answer — live transcript</span>
              {isListening && (
                <span className="text-xs text-red-500 font-medium">● Listening</span>
              )}
            </div>
            <div className="min-h-16 text-sm text-gray-700 leading-relaxed">
              {fullTranscript || (
                <span className="text-gray-300">Start speaking — your words will appear here...</span>
              )}
            </div>
            {isListening && (
              <div className="mt-3">
                <WaveBar active={waveActive} />
              </div>
            )}
          </div>

          {/* Mic button */}
          {!scores && (
            <div className="text-center mb-4">
              <button
                onClick={toggleMic}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all"
                style={{
                  background: isListening ? '#E24B4A' : '#f3f4f6',
                  boxShadow: isListening ? '0 0 0 8px rgba(226,75,74,0.15)' : 'none'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="8" y="2" width="8" height="13" rx="4" fill={isListening ? 'white' : '#6b7280'}/>
                  <path d="M4 11C4 15.4 7.13 19 12 19C16.87 19 20 15.4 20 11" stroke={isListening ? 'white' : '#6b7280'} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke={isListening ? 'white' : '#6b7280'} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              <p className="text-xs text-gray-400">
                {isListening ? 'Tap to stop · speaking now' : 'Tap to speak'}
              </p>

              {fullTranscript && !isListening && (
                <button
                  onClick={submitVoiceAnswer}
                  disabled={scoring}
                  className="mt-4 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto"
                >
                  {scoring ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Scoring...
                    </>
                  ) : 'Submit answer →'}
                </button>
              )}
            </div>
          )}

          {/* Score feedback */}
          {scores && (
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex gap-4 mb-3">
                  {[
                    { label: 'Relevance', val: scores.relevance },
                    { label: 'Clarity', val: scores.clarity },
                    { label: 'Depth', val: scores.depth },
                    { label: 'STAR', val: scores.starFormat },
                  ].map(s => (
                    <div key={s.label} className="flex-1 text-center">
                      <div className="text-xl font-semibold" style={{ color: s.val >= 8 ? '#1D9E75' : s.val >= 6 ? '#EF9F27' : '#E24B4A' }}>
                        {s.val}
                      </div>
                      <div className="text-xs text-gray-400">{s.label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{scores.feedback}</p>
              </div>

              {/* Filler words */}
              {scores.totalFillers > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs font-medium text-amber-700 mb-2">Filler words detected</p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(scores.fillerWords || {}).filter(([, v]) => v > 0).map(([k, v]) => (
                      <span key={k} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                        "{k}" × {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Annotated transcript */}
              {scores.annotatedTranscript?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Annotated transcript</p>
                  <p className="text-sm leading-relaxed">
                    {scores.annotatedTranscript.map((seg, i) => (
                      <span
                        key={i}
                        className="rounded px-0.5"
                        style={{
                          background: seg.type === 'strong' ? '#EAF3DE' :
                            seg.type === 'filler' ? '#FAEEDA' :
                            seg.type === 'missing' ? '#FCEBEB' : 'transparent',
                          color: seg.type === 'strong' ? '#27500A' :
                            seg.type === 'filler' ? '#633806' :
                            seg.type === 'missing' ? '#A32D2D' : '#374151'
                        }}
                      >
                        {seg.text}{' '}
                      </span>
                    ))}
                  </p>
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors"
              >
                {currentQ + 1 >= questions.length ? 'See results →' : 'Next question →'}
              </button>
            </div>
          )}
        </div>
      </Layout>
    );
  }

  // RESULTS
  if (stage === 'results') {
    const avg = (key) => allScores.length
      ? (allScores.reduce((s, r) => s + (r.scores[key] || 0), 0) / allScores.length).toFixed(1)
      : 0;
    const totalFillersAll = allScores.reduce((s, r) => s + (r.scores.totalFillers || 0), 0);

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎙️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Session complete!</h2>
            <p className="text-gray-500">{allScores.length} questions · {formatTime(sessionTime)} · with {persona.name}</p>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Relevance', key: 'relevance' },
              { label: 'Clarity', key: 'clarity' },
              { label: 'Depth', key: 'depth' },
              { label: 'STAR format', key: 'starFormat' },
            ].map(s => (
              <div key={s.key} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-semibold text-gray-900">{avg(s.key)}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filler summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
            <h3 className="text-sm font-medium text-amber-800 mb-3">Total filler words — {totalFillersAll}</h3>
            <div className="flex gap-2 flex-wrap">
              {allScores.flatMap(r => Object.entries(r.scores.fillerWords || {}))
                .reduce((acc, [k, v]) => { acc[k] = (acc[k] || 0) + v; return acc; }, {})
                && Object.entries(
                  allScores.flatMap(r => Object.entries(r.scores.fillerWords || {}))
                    .reduce((acc, [k, v]) => { acc[k] = (acc[k] || 0) + v; return acc; }, {})
                ).filter(([, v]) => v > 0).map(([k, v]) => (
                  <span key={k} className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                    "{k}" — {v} times
                  </span>
                ))
              }
            </div>
          </div>

          {/* Per question */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Question breakdown</h3>
            <div className="space-y-4">
              {allScores.map((r, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-800 mb-2">Q{i + 1}: {r.question}</p>
                  <div className="flex gap-3 mb-1">
                    <span className="text-xs text-gray-500">Relevance: <strong>{r.scores.relevance}</strong></span>
                    <span className="text-xs text-gray-500">Clarity: <strong>{r.scores.clarity}</strong></span>
                    <span className="text-xs text-gray-500">STAR: <strong>{r.scores.starFormat}</strong></span>
                    <span className="text-xs text-amber-600">Fillers: <strong>{r.scores.totalFillers || 0}</strong></span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2">{r.transcript}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStage('setup'); setTranscript(''); setScores(null); }}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors"
            >
              New session →
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Dashboard →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}

export default VoiceInterview;