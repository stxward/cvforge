import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadCV, analyseCV, getRoleSuggestions } from '../api/cvApi';

const features = [
  {
    icon: '◎',
    title: 'Industry-aware scoring',
    desc: 'AI detects your field and scores against real industry standards',
    color: '#7C3AED'
  },
  {
    icon: '◇',
    title: 'MCQ Quiz mode',
    desc: 'Questions pulled from your CV across 6 categories, 3 difficulty levels',
    color: '#3B82F6'
  },
  {
    icon: '◈',
    title: 'Mock Interview',
    desc: 'Open-ended questions scored on Relevance, Clarity, Depth and STAR format',
    color: '#06B6D4'
  },
  {
    icon: '🎙️',
    title: 'Voice Interview',
    desc: 'Human AI voices ask questions — you speak your answers live',
    color: '#8B5CF6'
  },
  {
    icon: '▦',
    title: 'Smart Dashboard',
    desc: 'Radar charts, heatmaps, XP levels and progress tracking',
    color: '#EC4899'
  },
  {
    icon: '⟐',
    title: 'Role match score',
    desc: 'Paste a job description and get a real compatibility percentage',
    color: '#F59E0B'
  },
];

const stats = [
  { value: '6+', label: 'Analysis dimensions' },
  { value: '3', label: 'Interview modes' },
  { value: 'AI', label: 'Powered engine' },
];

function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [showJD, setShowJD] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStep, setLoadingStep] = useState('');
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const fetchRoles = async (f) => {
    setRolesLoading(true);
    try {
      const uploadResult = await uploadCV(f);
      localStorage.setItem('uploadedCvText', uploadResult.cvText);
      localStorage.setItem('uploadedFileName', uploadResult.fileName);
      localStorage.setItem('uploadedWordCount', uploadResult.wordCount);
      const result = await getRoleSuggestions(uploadResult.cvText);
      setSuggestedRoles(result.roles || []);
    } catch (err) {
      console.error('Role fetch error:', err);
    } finally {
      setRolesLoading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setFileName(f.name); setError(null); await fetchRoles(f); }
  };

  const handleFileInput = async (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setFileName(f.name); setError(null); await fetchRoles(f); }
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const cvText = localStorage.getItem('uploadedCvText');
      const fileName = localStorage.getItem('uploadedFileName');
      const wordCount = localStorage.getItem('uploadedWordCount');
      setLoadingStep('Analysing with AI...');
      const analysisResult = await analyseCV(cvText, targetRole, jobDescription);
      localStorage.setItem('cvData', JSON.stringify({
        fileName, wordCount, cvText,
        analysis: analysisResult.analysis,
        targetRole, jobDescription
      }));
      navigate('/analysis');
    } catch (err) {
      setError('Something went wrong. Make sure your backend is running.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Navbar inline since Layout fullWidth */}
      <nav className="w-full sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer">
            <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center shadow-brand">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 13L8 3L13 13M5.5 9H10.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-base font-semibold text-gray-900 tracking-tight">
              CV<span className="gradient-text">Forge</span>
            </span>
          </div>
          <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
            {[
              { label: 'Upload', path: '/' },
              { label: 'Analysis', path: '/analysis' },
              { label: 'Quiz', path: '/quiz' },
              { label: 'Mock Interview', path: '/mock' },
              { label: '🎙️ Voice', path: '/voice' },
              { label: 'Dashboard', path: '/dashboard' },
            ].map(tab => (
              <button key={tab.path} onClick={() => navigate(tab.path)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  tab.path === '/' ? 'bg-white text-gray-900 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-800'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold">S</div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-blue-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200 rounded-full filter blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-200 rounded-full filter blur-3xl opacity-20 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12">
          {/* Badge */}
          <div className="flex justify-center mb-6 animate-fadeUp">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-50 border border-violet-200 rounded-full text-xs font-medium text-violet-700">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              AI-powered interview prep
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-6 animate-fadeUp" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
              Turn your CV into
              <br />
              <span className="gradient-text">interview readiness</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
              Upload your resume — AI analyses every line and builds a personalised prep arena just for you
            </p>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-10 animate-fadeUp" style={{ animationDelay: '0.2s' }}>
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Upload zone */}
          <div className="animate-fadeUp" style={{ animationDelay: '0.3s' }}>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !loading && !rolesLoading && document.getElementById('fileInput').click()}
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-violet-400 bg-violet-50 scale-[1.01]'
                  : fileName
                  ? 'border-violet-300 bg-violet-50/50'
                  : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/30'
              }`}
            >
              <input id="fileInput" type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileInput} />

              {fileName ? (
                <div>
                  <div className="w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand animate-float">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.97 16.97 21 12 21C7.03 21 3 16.97 3 12C3 7.03 7.03 3 12 3C16.97 3 21 7.03 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-violet-700 mb-1">{fileName}</p>
                  <p className="text-sm text-gray-400">
                    {rolesLoading ? 'Detecting relevant roles from your CV...' : 'Ready — select your target role below'}
                  </p>
                  {rolesLoading && (
                    <div className="flex justify-center mt-3">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="w-14 h-14 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 15V4M8 8L12 4L16 8" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M3 18H21" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-1">Drop your CV here or click to browse</p>
                  <p className="text-sm text-gray-400 mb-4">We'll parse every line and build your personalised prep session</p>
                  <div className="flex gap-2 justify-center">
                    {['PDF', 'DOCX', 'Plain text'].map(f => (
                      <span key={f} className="px-3 py-1 bg-gray-50 text-gray-400 text-xs rounded-full border border-gray-200">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Target role */}
          {fileName && (
            <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-card animate-fadeUp">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Target job role</p>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Data Scientist, Product Manager, UX Designer..."
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white mb-3 transition-all"
              />
              <div className="flex flex-wrap gap-2">
                {rolesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="4"/>
                      <path className="opacity-75" fill="#9ca3af" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Detecting roles from your CV...
                  </div>
                ) : (
                  suggestedRoles.map(r => (
                    <button key={r} onClick={() => setTargetRole(r)}
                      className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-all ${
                        targetRole === r
                          ? 'bg-violet-600 text-white border-violet-600 shadow-brand'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                      }`}>
                      {r}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* JD matcher */}
          {fileName && (
            <div className="mt-3 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-card animate-fadeUp">
              <button onClick={() => setShowJD(s => !s)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
                <div className="text-left">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Job description matcher</p>
                  <p className="text-xs text-gray-400 mt-0.5">Optional — paste a JD to get keyword gap analysis</p>
                </div>
                <span className={`text-gray-400 transition-transform duration-200 ${showJD ? 'rotate-180' : ''}`}>
                  ↓
                </span>
              </button>
              {showJD && (
                <div className="px-5 pb-5">
                  <textarea
                    value={jobDescription}
                    onChange={e => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here..."
                    className="w-full min-h-28 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 bg-white resize-y transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fadeIn">
              {error}
            </div>
          )}

          {/* CTA Button */}
          {fileName && (
            <div className="flex justify-center mt-6 animate-fadeUp">
              <button
                onClick={handleAnalyse}
                disabled={loading || rolesLoading}
                className="relative px-8 py-3.5 gradient-bg text-white rounded-xl text-sm font-semibold shadow-brand hover:shadow-brand-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    {loadingStep || 'Analysing...'}
                  </>
                ) : rolesLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                      <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Reading your CV...
                  </>
                ) : (
                  <>
                    Analyse my CV{targetRole ? ` for ${targetRole}` : ''}
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Everything you get</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="bg-white border border-gray-100 rounded-2xl p-5 card-hover shadow-card animate-fadeUp"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base mb-3"
                style={{ background: f.color + '15', color: f.color }}
              >
                {f.icon}
              </div>
              <h4 className="text-sm font-semibold text-gray-800 mb-1">{f.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Upload;
