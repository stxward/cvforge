import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { startMockInterview, scoreAnswer } from '../api/cvApi';

const COMPANY_TYPES = [
  { id: 'startup', label: 'Startup', desc: 'Fast-paced, direct' },
  { id: 'corporate', label: 'Corporate', desc: 'Formal, structured' },
  { id: 'faang', label: 'FAANG', desc: 'Technical, deep' },
];

function ScoreBar({ label, value }) {
  const color = value >= 8 ? '#1D9E75' : value >= 6 ? '#EF9F27' : '#E24B4A';
  return (
    <div className="flex-1">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-semibold" style={{ color }}>{value.toFixed(1)}</div>
    </div>
  );
}

function MockInterview() {
  const navigate = useNavigate();
  const [cvData, setCvData] = useState(null);
  const [stage, setStage] = useState('setup');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [company, setCompany] = useState('startup');
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [scores, setScores] = useState(null);
  const [allScores, setAllScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [followUp, setFollowUp] = useState(null);
  const [isFollowUp, setIsFollowUp] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cvData');
    if (!stored) { navigate('/'); return; }
    const parsed = JSON.parse(stored);
    setCvData(parsed);

    // Extract suggested roles from CV analysis
    const analysis = parsed.analysis;
    if (analysis?.experience?.length > 0) {
      // Pull roles from experience titles
      const roles = analysis.experience.slice(0, 6).map(e => {
        // Clean up role titles
        return e.split(' at ')[0].trim();
      });
      setSuggestedRoles([...new Set(roles)]);
      setRole(roles[0] || '');
    } else {
      // Fallback generic roles
      setSuggestedRoles(['Software Engineer', 'Data Analyst', 'Product Manager', 'Business Analyst', 'Project Manager', 'Marketing Manager']);
      setRole('Software Engineer');
    }
  }, [navigate]);

  const finalRole = customRole.trim() || role;

  const startInterview = async () => {
    if (!finalRole) return;
    setLoading(true);
    try {
      const result = await startMockInterview(cvData.cvText, finalRole, company);
      setQuestions(result.questions);
      setCurrentQ(0);
      setAnswer('');
      setScores(null);
      setAllScores([]);
      setFollowUp(null);
      setIsFollowUp(false);
      setStage('interview');
    } catch (err) {
      alert('Failed to start interview. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setScoring(true);
    try {
      const q = isFollowUp ? followUp : questions[currentQ].question;
      const result = await scoreAnswer(q, answer, cvData.cvText);
      setScores(result.scores);
      setAllScores(prev => [...prev, { question: q, answer, scores: result.scores }]);
    } catch (err) {
      alert('Failed to score answer. Try again.');
    } finally {
      setScoring(false);
    }
  };

  const handleNext = () => {
    if (scores?.followUpQuestion && !isFollowUp) {
      setFollowUp(scores.followUpQuestion);
      setIsFollowUp(true);
      setAnswer('');
      setScores(null);
      setShowHint(false);
      return;
    }
    if (currentQ + 1 >= questions.length) {
      const mockResults = JSON.parse(localStorage.getItem('mockResults') || '[]');
      mockResults.push({ count: allScores.length, role: finalRole, company, date: new Date().toISOString() });
      localStorage.setItem('mockResults', JSON.stringify(mockResults));
      setStage('results');
      return;
    }
    setCurrentQ(q => q + 1);
    setAnswer('');
    setScores(null);
    setShowHint(false);
    setFollowUp(null);
    setIsFollowUp(false);
  };

  const companyColor = { startup: '#1D9E75', corporate: '#534AB7', faang: '#D85A30' };

  // SETUP
  if (stage === 'setup') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Mock Interview</h1>
            <p className="text-gray-500">Answer open-ended questions from your CV — scored on Relevance, Clarity, Depth and STAR format</p>
          </div>

          {/* Role — dynamic from CV */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Target role</p>
            <p className="text-xs text-gray-400 mb-3">Suggested based on your CV</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {suggestedRoles.map(r => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setCustomRole(''); }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    role === r && !customRole
                      ? 'bg-brand-50 text-brand-600 border-brand-400'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={customRole}
                onChange={e => { setCustomRole(e.target.value); setRole(''); }}
                placeholder="Or type a custom role e.g. ML Engineer, UX Designer..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-brand-400 bg-white"
              />
              {customRole && (
                <button
                  onClick={() => setCustomRole('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            {finalRole && (
              <p className="text-xs text-brand-600 mt-2">
                Interviewing for: <strong>{finalRole}</strong>
              </p>
            )}
          </div>

          {/* Company type */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Interview style</p>
            <div className="grid grid-cols-3 gap-3">
              {COMPANY_TYPES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCompany(c.id)}
                  className="p-4 rounded-xl border text-left transition-all"
                  style={company === c.id
                    ? { borderColor: companyColor[c.id], background: companyColor[c.id] + '15', borderWidth: '1.5px' }
                    : { borderColor: '#e5e7eb' }
                  }
                >
                  <div className="text-sm font-medium text-gray-800 mb-1">{c.label}</div>
                  <div className="text-xs text-gray-400">{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startInterview}
            disabled={loading || !finalRole}
            className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Preparing your interview...
              </>
            ) : `Start interview as ${finalRole} →`}
          </button>
        </div>
      </Layout>
    );
  }

  // INTERVIEW
  if (stage === 'interview' && questions.length > 0) {
    const currentQuestion = isFollowUp ? followUp : questions[currentQ].question;
    const currentHint = questions[currentQ]?.hint;
    const progress = (currentQ / questions.length) * 100;

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Q <strong>{currentQ + 1}</strong> / {questions.length}
              </span>
              {isFollowUp && (
                <span className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200 font-medium">
                  Follow-up
                </span>
              )}
              <span className="px-3 py-1 text-xs rounded-full font-medium"
                style={{ background: companyColor[company] + '15', color: companyColor[company] }}>
                {finalRole}
              </span>
            </div>
          </div>

          <div className="h-1 bg-gray-100 rounded-full mb-6">
            <div className="h-1 rounded-full transition-all" style={{ width: `${progress}%`, background: '#7F77DD' }} />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center text-sm font-medium text-brand-600">AI</div>
              <div className="text-sm font-medium text-gray-700">Interviewer</div>
            </div>
            <p className="text-base text-gray-900 leading-relaxed">{currentQuestion}</p>
          </div>

          {currentHint && (
            <div className="mb-4">
              <button onClick={() => setShowHint(h => !h)} className="text-xs text-amber-600 underline">
                {showHint ? 'Hide' : 'Show'} STAR coach hint
              </button>
              {showHint && (
                <div className="mt-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 leading-relaxed">
                  💡 {currentHint}
                </div>
              )}
            </div>
          )}

          {!scores && (
            <>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here — use STAR format: Situation, Task, Action, Result"
                className="w-full min-h-32 border border-gray-200 rounded-2xl p-4 text-sm text-gray-800 bg-white resize-y mb-4 focus:outline-none focus:border-brand-400"
              />
              <button
                onClick={submitAnswer}
                disabled={!answer.trim() || scoring}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {scoring ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Scoring your answer...
                  </>
                ) : 'Submit answer →'}
              </button>
            </>
          )}

          {scores && (
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex gap-4 mb-4">
                  <ScoreBar label="Relevance" value={scores.relevance} />
                  <ScoreBar label="Clarity" value={scores.clarity} />
                  <ScoreBar label="Depth" value={scores.depth} />
                  <ScoreBar label="STAR format" value={scores.starFormat} />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{scores.feedback}</p>
              </div>

              {scores.strongPoints?.length > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-xs font-medium text-green-700 mb-2">✅ Strong points</p>
                  {scores.strongPoints.map((p, i) => (
                    <p key={i} className="text-sm text-green-800">• {p}</p>
                  ))}
                </div>
              )}

              {scores.improvements?.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-medium text-red-600 mb-2">📌 To improve</p>
                  {scores.improvements.map((p, i) => (
                    <p key={i} className="text-sm text-red-700">• {p}</p>
                  ))}
                </div>
              )}

              <button
                onClick={handleNext}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors"
              >
                {scores.followUpQuestion && !isFollowUp ? 'Answer follow-up →'
                  : currentQ + 1 >= questions.length ? 'See results →'
                  : 'Next question →'}
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

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🎙️</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Interview complete!</h2>
            <p className="text-gray-500">{allScores.length} questions · {finalRole} · {company}</p>
          </div>

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

          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Answer breakdown</h3>
            <div className="space-y-4">
              {allScores.map((r, i) => (
                <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-gray-800 mb-1">Q{i + 1}: {r.question}</p>
                  <div className="flex gap-3">
                    <span className="text-xs text-gray-500">Relevance: <strong>{r.scores.relevance}</strong></span>
                    <span className="text-xs text-gray-500">Clarity: <strong>{r.scores.clarity}</strong></span>
                    <span className="text-xs text-gray-500">STAR: <strong>{r.scores.starFormat}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStage('setup')}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors">
              Try again →
            </button>
            <button onClick={() => navigate('/voice')}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              🎙️ Voice Interview →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}

export default MockInterview;