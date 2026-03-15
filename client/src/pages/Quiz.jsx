import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { generateQuiz } from '../api/cvApi';

const CATEGORIES = ['Mixed', 'Technical Skills', 'Work Experience', 'Projects', 'Education', 'Achievements'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

function Quiz() {
  const navigate = useNavigate();
  const [cvData, setCvData] = useState(null);
  const [stage, setStage] = useState('setup');
  const [difficulty, setDifficulty] = useState('medium');
  const [categories, setCategories] = useState(['Mixed']);
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [xp, setXp] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('cvData');
    if (!stored) { navigate('/'); return; }
    setCvData(JSON.parse(stored));
  }, [navigate]);

  const handleTimeout = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      setTimerActive(false);
      setResults(prev => [...prev, { question: questions[currentQ], selected: null, correct: false }]);
    }
  }, [answered, questions, currentQ]);

  useEffect(() => {
    if (!timerActive || answered) return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive, answered, handleTimeout]);

  const startQuiz = async () => {
    if (!cvData) return;
    setLoading(true);
    try {
      const result = await generateQuiz(cvData.cvText, difficulty, categories.join(', '), questionCount);
      // Shuffle options so correct answer isn't always B
const shuffled = result.questions.map(q => {
  const options = [...q.options];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  // Reassign ids after shuffle
  const relabelled = options.map((opt, idx) => ({
    ...opt,
    id: ['a', 'b', 'c', 'd'][idx]
  }));
  // Find where the correct answer text ended up
  const originalCorrectText = q.options.find(o => o.id === q.correctAnswer)?.text;
  const newCorrectId = relabelled.find(o => o.text === originalCorrectText)?.id;
  return {
    ...q,
    options: relabelled,
    correctAnswer: newCorrectId || q.correctAnswer
  };
});
setQuestions(shuffled);
      setCurrentQ(0);
      setScore(0);
      setXp(0);
      setResults([]);
      setSelected(null);
      setAnswered(false);
      setTimeLeft(30);
      setTimerActive(true);
      setStage('quiz');
    } catch (err) {
      alert('Failed to generate questions. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (optionId) => {
    if (answered) return;
    setSelected(optionId);
    setAnswered(true);
    setTimerActive(false);

    const q = questions[currentQ];
    const isCorrect = optionId === q.correctAnswer;
    if (isCorrect) {
      const xpGain = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30;
      setScore(s => s + 1);
      setXp(x => x + xpGain);
    }
    setResults(prev => [...prev, { question: q, selected: optionId, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentQ + 1 >= questions.length) {
      setStage('results');
      return;
    }
    setCurrentQ(q => q + 1);
    setSelected(null);
    setAnswered(false);
    setShowExplanation(false);
    setTimeLeft(30);
    setTimerActive(true);
  };

  const diffColor = { easy: 'bg-green-50 text-green-700 border-green-200', medium: 'bg-amber-50 text-amber-700 border-amber-200', hard: 'bg-red-50 text-red-600 border-red-200' };
  const diffActiveBg = { easy: '#EAF3DE', medium: '#FAEEDA', hard: '#FCEBEB' };
  const diffActiveText = { easy: '#3B6D11', medium: '#633806', hard: '#A32D2D' };
  const diffActiveBorder = { easy: '#97C459', medium: '#EF9F27', hard: '#E24B4A' };

  // SETUP SCREEN
  if (stage === 'setup') {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Quiz Mode</h1>
            <p className="text-gray-500">Questions generated from your own CV — answer them like an interviewer is asking</p>
          </div>

          {/* Difficulty */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Difficulty</p>
            <div className="flex gap-3">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className="px-5 py-2 rounded-full text-sm font-medium border transition-all capitalize"
                  style={difficulty === d ? {
                    background: diffActiveBg[d],
                    color: diffActiveText[d],
                    borderColor: diffActiveBorder[d]
                  } : { background: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }}
                >
                  {d === 'easy' ? '🟢' : d === 'medium' ? '🟡' : '🔴'} {d}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
<div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Category</p>
  <p className="text-xs text-gray-400 mb-3">Select one or more</p>
  <div className="grid grid-cols-3 gap-2">
    {CATEGORIES.map(c => {
      const selected = categories.includes(c);
      return (
        <button
          key={c}
          onClick={() => {
            if (c === 'Mixed') {
              setCategories(['Mixed']);
              return;
            }
            setCategories(prev => {
              const without = prev.filter(x => x !== 'Mixed');
              if (prev.includes(c)) {
                const next = without.filter(x => x !== c);
                return next.length === 0 ? ['Mixed'] : next;
              } else {
                return [...without, c];
              }
            });
          }}
          className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center justify-between gap-1 ${
            selected
              ? 'bg-brand-50 text-brand-600 border-brand-400'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <span>{c}</span>
          {selected && <span className="text-brand-400 text-xs">✓</span>}
        </button>
      );
    })}
  </div>
</div>

          {/* Count */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Number of questions</p>
            <div className="flex gap-3">
              {[5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setQuestionCount(n)}
                  className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                    questionCount === n
                      ? 'bg-brand-50 text-brand-600 border-brand-400'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
  onClick={startQuiz}
  disabled={loading}
  className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
>
  {loading ? (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Generating questions from your CV...
      </div>
      <span className="text-xs opacity-75">This takes 10-15 seconds — hang tight</span>
    </div>
  ) : (
    'Start Quiz →'
  )}
</button>
        </div>
      </Layout>
    );
  }

  // QUIZ SCREEN
  if (stage === 'quiz' && questions.length > 0) {
    const q = questions[currentQ];
    const progress = ((currentQ) / questions.length) * 100;
    const timerColor = timeLeft <= 10 ? '#E24B4A' : timeLeft <= 20 ? '#EF9F27' : '#1D9E75';

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200">
                Q <strong>{currentQ + 1}</strong> / {questions.length}
              </span>
              <span className="px-3 py-1 bg-brand-50 text-brand-600 text-xs rounded-full border border-brand-100">
                XP <strong>+{xp}</strong>
              </span>
            </div>
            <span className="text-sm font-medium" style={{ color: timerColor }}>
              ⏱ {timeLeft}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-100 rounded-full mb-6">
            <div className="h-1 bg-brand-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          {/* Question Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-4">
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border mb-3 ${diffColor[difficulty]}`}>
              {q.category}
            </span>
            <p className="text-base font-medium text-gray-900 leading-relaxed mb-5">{q.question}</p>

            <div className="space-y-2">
              {q.options.map((opt) => {
                let style = 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50';
                if (answered) {
                  if (opt.id === q.correctAnswer) style = 'border-green-400 bg-green-50 text-green-800';
                  else if (opt.id === selected && selected !== q.correctAnswer) style = 'border-red-400 bg-red-50 text-red-700';
                  else style = 'border-gray-100 bg-gray-50 text-gray-400';
                } else if (selected === opt.id) {
                  style = 'border-brand-400 bg-brand-50 text-brand-800';
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${style}`}
                  >
                    <span className="font-medium mr-2">{opt.id.toUpperCase()}.</span> {opt.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation */}
          {answered && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
              <div className="flex items-center gap-2 mb-2">
                {selected === q.correctAnswer ? (
                  <span className="text-green-600 font-medium text-sm">✅ Correct! +{difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30} XP</span>
                ) : (
                  <span className="text-red-500 font-medium text-sm">❌ {selected === null ? 'Time ran out!' : 'Incorrect'}</span>
                )}
              </div>
              {showExplanation && (
                <p className="text-sm text-gray-600 leading-relaxed">{q.explanation}</p>
              )}
              <button
                onClick={() => setShowExplanation(s => !s)}
                className="text-xs text-brand-600 mt-2 underline"
              >
                {showExplanation ? 'Hide' : 'Show'} explanation
              </button>
            </div>
          )}

          {answered && (
            <button
              onClick={handleNext}
              className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors"
            >
              {currentQ + 1 >= questions.length ? 'See results →' : 'Next question →'}
            </button>
          )}
        </div>
      </Layout>
    );
  }

  // RESULTS SCREEN
  if (stage === 'results') {
    const percentage = Math.round((score / questions.length) * 100);
    const verdict = percentage >= 80 ? '🏆 Excellent!' : percentage >= 60 ? '👍 Good effort!' : '📚 Keep practising!';

    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '📚'}</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">{verdict}</h2>
            <p className="text-gray-500">You scored {score} out of {questions.length}</p>
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-semibold text-gray-900">{percentage}%</div>
              <div className="text-xs text-gray-400 mt-1">Accuracy</div>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-semibold text-brand-600">{xp}</div>
              <div className="text-xs text-gray-400 mt-1">XP earned</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-semibold text-gray-900">{questions.length - score}</div>
              <div className="text-xs text-gray-400 mt-1">To review</div>
            </div>
          </div>

          {/* Per question results */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Question breakdown</h3>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${r.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className="text-sm">{r.correct ? '✅' : '❌'}</span>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.question.question}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStage('setup')}
              className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors"
            >
              Try again →
            </button>
            <button
              onClick={() => navigate('/mock')}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Mock Interview →
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}

export default Quiz;