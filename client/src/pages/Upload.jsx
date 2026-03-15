import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { uploadCV, analyseCV, getRoleSuggestions } from '../api/cvApi';

const features = [
  { color: '#7F77DD', title: 'CV Health Score', desc: 'ATS score, buzzword flags, quantification check' },
  { color: '#1D9E75', title: 'Industry-aware scoring', desc: 'Scored against standards for your specific field' },
  { color: '#EF9F27', title: 'Role match score', desc: 'How strong is your CV for your target job role' },
  { color: '#D85A30', title: 'JD matcher', desc: 'Paste a job description and get a real match %' },
  { color: '#378ADD', title: 'Seniority check', desc: 'Do your achievements match your experience level' },
  { color: '#7F77DD', title: '🎙️ Voice Interview', desc: 'Speak your answers to an AI interviewer' },
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
    if (f) {
      setFile(f);
      setFileName(f.name);
      setError(null);
      await fetchRoles(f);
    }
  };

  const handleFileInput = async (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
      setError(null);
      await fetchRoles(f);
    }
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
        fileName,
        wordCount,
        cvText,
        analysis: analysisResult.analysis,
        targetRole,
        jobDescription
      }));

      navigate('/analysis');
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Make sure your backend is running on port 5000.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-4xl font-semibold text-gray-900 mb-3">
          Turn your CV into interview readiness
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Upload your resume — we'll analyse it against your target role and industry standards
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-12 text-center mb-4 transition-all duration-200 cursor-pointer ${
          isDragging ? 'border-brand-600 bg-brand-50' : 'border-gray-300 bg-white hover:border-brand-400 hover:bg-brand-50'
        }`}
        onClick={() => !loading && document.getElementById('fileInput').click()}
      >
        <input id="fileInput" type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileInput} />
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 15V4M8 8L12 4L16 8" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 18H21" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        {fileName ? (
          <div>
            <p className="text-brand-600 font-medium text-lg mb-1">✅ {fileName}</p>
            <p className="text-gray-400 text-sm">
              {rolesLoading ? 'Detecting relevant roles...' : 'File ready — select your target role below'}
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-gray-700 font-medium text-lg mb-1">Drop your CV here or click to browse</h3>
            <p className="text-gray-400 text-sm mb-4">PDF, DOCX or plain text</p>
            <div className="flex gap-2 justify-center">
              {['PDF', 'DOCX', 'Plain text'].map(f => (
                <span key={f} className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full border border-gray-200">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Target role input — only shows after file uploaded */}
      {fileName && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Target job role</p>
          <p className="text-xs text-gray-400 mb-3">
            {rolesLoading ? 'Analysing your CV to suggest relevant roles...' : 'Suggested based on your CV — or type your own'}
          </p>
          <input
            type="text"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. Data Scientist, Product Manager, UX Designer..."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-brand-400 bg-white mb-3"
          />
          <div className="flex flex-wrap gap-2 min-h-8">
            {rolesLoading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="4"/>
                  <path className="opacity-75" fill="#9ca3af" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Detecting relevant roles from your CV...
              </div>
            ) : (
              suggestedRoles.map(r => (
                <button
                  key={r}
                  onClick={() => setTargetRole(r)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all ${
                    targetRole === r
                      ? 'bg-brand-50 text-brand-600 border-brand-400'
                      : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {r}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Job Description — optional */}
      {fileName && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <button
            onClick={() => setShowJD(s => !s)}
            className="flex items-center justify-between w-full"
          >
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Job description matcher</p>
              <p className="text-xs text-gray-400 mt-0.5">Optional — paste a JD to get a real match % and keyword gap analysis</p>
            </div>
            <span className="text-gray-400 text-lg">{showJD ? '−' : '+'}</span>
          </button>
          {showJD && (
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              className="w-full min-h-32 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-brand-400 bg-white mt-3 resize-y"
            />
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {/* Analyse Button */}
      {fileName && (
        <div className="flex justify-center mb-8">
          <button
            onClick={handleAnalyse}
            disabled={loading || rolesLoading}
            className="px-8 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {loadingStep}
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
              `Analyse my CV${targetRole ? ` for ${targetRole}` : ''} →`
            )}
          </button>
        </div>
      )}

      {/* Features Grid */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">What you get</p>
        <div className="grid grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="w-2 h-2 rounded-full mb-3" style={{ backgroundColor: f.color }} />
              <h4 className="text-sm font-medium text-gray-800 mb-1">{f.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Upload;