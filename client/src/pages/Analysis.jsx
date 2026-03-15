import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';

const sectionLabels = {
  experience: 'Work Experience',
  skills: 'Skills',
  education: 'Education',
  projects: 'Projects',
  formatting: 'Formatting',
  certifications: 'Certifications'
};

const sectionColors = {
  experience: '#7F77DD',
  skills: '#1D9E75',
  education: '#1D9E75',
  projects: '#EF9F27',
  formatting: '#7F77DD',
  certifications: '#EF9F27'
};

function ScoreRing({ score, size = 88, color = '#7F77DD' }) {
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x={size/2} y={size/2 + 6} textAnchor="middle" fontSize="18" fontWeight="500" fill="#1f2937">{score}</text>
    </svg>
  );
}

function Analysis() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const stored = localStorage.getItem('cvData');
    if (!stored) { navigate('/'); return; }
    setData(JSON.parse(stored));
  }, [navigate]);

  if (!data) return null;

  const { fileName, wordCount, analysis, targetRole, jobDescription } = data;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'role', label: `Role Match${targetRole ? ` — ${targetRole}` : ''}` },
    { id: 'sections', label: 'Section scores' },
    { id: 'flags', label: 'Issues & suggestions' },
    ...(jobDescription ? [{ id: 'jd', label: 'JD Match' }] : []),
  ];

  return (
    <Layout>
      {/* Score Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-6 mb-5">
        <ScoreRing score={analysis.overallScore} />
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{analysis.verdict}</h2>
          <p className="text-sm text-gray-400 mb-1">
            {fileName} · {wordCount} words · {analysis.detectedField} · {analysis.detectedSeniority}
          </p>
          <p className="text-xs text-gray-400 mb-3">{analysis.industryInsights}</p>
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
              ATS: {analysis.atsScore}%
            </span>
            {analysis.detectedField && (
              <span className="px-3 py-1 bg-brand-50 text-brand-600 text-xs rounded-full border border-brand-100">
                {analysis.detectedField}
              </span>
            )}
            {analysis.detectedSeniority && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {analysis.detectedSeniority} level
              </span>
            )}
            {analysis.seniorityMatch && (
              <span className={`px-3 py-1 text-xs rounded-full border ${
                analysis.seniorityMatch >= 70 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                Seniority match: {analysis.seniorityMatch}%
              </span>
            )}
            {analysis.buzzwords?.length > 0 && (
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">
                {analysis.buzzwords.length} buzzwords
              </span>
            )}
            {analysis.unquantifiedAchievements?.length > 0 && (
              <span className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">
                {analysis.unquantifiedAchievements.length} unquantified wins
              </span>
            )}
          </div>
        </div>
        {targetRole && analysis.targetRoleScore !== null && (
          <div className="text-center flex-shrink-0">
            <ScoreRing score={analysis.targetRoleScore} color={analysis.targetRoleScore >= 70 ? '#1D9E75' : analysis.targetRoleScore >= 50 ? '#EF9F27' : '#E24B4A'} />
            <p className="text-xs text-gray-400 mt-1">for {targetRole}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Industry insights */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Industry & seniority insights</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong>Field detected:</strong> {analysis.detectedField}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                <strong>Seniority level:</strong> {analysis.detectedSeniority}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">{analysis.seniorityInsights}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{analysis.industryInsights}</p>
            </div>
          </div>

          {/* Top strengths */}
          {analysis.topStrengths?.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-green-800 mb-3">Top strengths</h3>
              <div className="space-y-1">
                {analysis.topStrengths.map((s, i) => (
                  <p key={i} className="text-sm text-green-700">✅ {s}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Role Match Tab */}
      {activeTab === 'role' && (
        <div className="space-y-4">
          {targetRole && analysis.targetRoleScore !== null ? (
            <>
              <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-5">
                <ScoreRing
                  score={analysis.targetRoleScore}
                  color={analysis.targetRoleScore >= 70 ? '#1D9E75' : analysis.targetRoleScore >= 50 ? '#EF9F27' : '#E24B4A'}
                />
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {analysis.targetRoleScore >= 70 ? 'Strong match' : analysis.targetRoleScore >= 50 ? 'Moderate match' : 'Weak match'} for {targetRole}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {analysis.targetRoleScore >= 70
                      ? 'Your CV is well positioned for this role'
                      : analysis.targetRoleScore >= 50
                      ? 'Your CV partially matches — some gaps to address'
                      : 'Significant gaps between your CV and this role'}
                  </p>
                </div>
              </div>

              {analysis.targetRoleStrengths?.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-green-800 mb-3">Why your CV works for this role</h3>
                  {analysis.targetRoleStrengths.map((s, i) => (
                    <p key={i} className="text-sm text-green-700 mb-1">✅ {s}</p>
                  ))}
                </div>
              )}

              {analysis.targetRoleGaps?.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-red-700 mb-3">Gaps to address for this role</h3>
                  {analysis.targetRoleGaps.map((g, i) => (
                    <p key={i} className="text-sm text-red-600 mb-1">❌ {g}</p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm mb-4">No target role specified</p>
              <button
                onClick={() => navigate('/')}
                className="px-5 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium"
              >
                Re-upload with a target role →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === 'sections' && (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(analysis.sections || {}).map(([key, val]) => (
            <div key={key} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">{sectionLabels[key] || key}</p>
              <p className="text-2xl font-semibold text-gray-900 mb-2">
                {val}<span className="text-sm font-normal text-gray-400">/100</span>
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full">
                <div className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${val}%`, backgroundColor: sectionColors[key] || '#7F77DD' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Flags Tab */}
      {activeTab === 'flags' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="space-y-3">
            {analysis.flags?.map((flag, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  flag.type === 'error' ? 'bg-red-500' :
                  flag.type === 'warning' ? 'bg-amber-400' : 'bg-green-500'
                }`} />
                <p className="text-sm text-gray-600 leading-relaxed">{flag.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* JD Match Tab */}
      {activeTab === 'jd' && jobDescription && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-5">
            <ScoreRing
              score={analysis.jobDescriptionMatch || 0}
              color={analysis.jobDescriptionMatch >= 70 ? '#1D9E75' : analysis.jobDescriptionMatch >= 50 ? '#EF9F27' : '#E24B4A'}
            />
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                {analysis.jobDescriptionMatch}% match with job description
              </h3>
              <p className="text-sm text-gray-500">
                {analysis.matchedKeywords?.length || 0} keywords matched · {analysis.missingKeywords?.length || 0} keywords missing
              </p>
            </div>
          </div>

          {analysis.matchedKeywords?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-800 mb-3">✅ Keywords found in your CV</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedKeywords.map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">{k}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.missingKeywords?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-800 mb-3">❌ Missing keywords from JD</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.missingKeywords.map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-600 text-xs rounded-full border border-red-200">{k}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {/* Actions */}
<div className="flex gap-3 mt-6 flex-wrap">
  <button
    onClick={() => navigate('/')}
    className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors flex items-center gap-1"
  >
    ← Back
  </button>
  <button onClick={() => navigate('/quiz')}
    className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors">
    Start Quiz →
  </button>
  <button onClick={() => navigate('/mock')}
    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
    Mock Interview
  </button>
  <button onClick={() => navigate('/voice')}
    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
    🎙️ Voice Interview
  </button>
  <button onClick={() => navigate('/')}
    className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
    Re-analyse →
  </button>
</div>
    </Layout>
  );
}

export default Analysis;