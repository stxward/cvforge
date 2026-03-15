import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts';

const BADGES = [
  { id: 'cv_uploaded', icon: '📄', name: 'CV Uploaded', desc: 'Uploaded your first CV' },
  { id: 'first_quiz', icon: '🧠', name: 'Quiz Taker', desc: 'Completed your first quiz' },
  { id: 'first_mock', icon: '🎤', name: 'Interviewee', desc: 'Completed a mock interview' },
  { id: 'first_voice', icon: '🎙️', name: 'Voice Ready', desc: 'Completed a voice interview' },
  { id: 'perfect_score', icon: '🏆', name: 'Perfect Score', desc: 'Got 100% on a quiz' },
  { id: 'streak_7', icon: '🔥', name: '7-day Streak', desc: 'Practised 7 days in a row' },
];

const XP_LEVELS = [
  { label: 'Intern', min: 0, max: 100 },
  { label: 'Junior', min: 100, max: 300 },
  { label: 'Mid', min: 300, max: 600 },
  { label: 'Senior', min: 600, max: 1000 },
  { label: 'Principal', min: 1000, max: 1500 },
  { label: 'CTO', min: 1500, max: 9999 },
];

function getLevel(xp) {
  return XP_LEVELS.find(l => xp >= l.min && xp < l.max) || XP_LEVELS[0];
}

function getNextLevel(xp) {
  const idx = XP_LEVELS.findIndex(l => xp >= l.min && xp < l.max);
  return XP_LEVELS[idx + 1] || null;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs shadow-sm">
        <p className="font-medium text-gray-700 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const cvData = localStorage.getItem('cvData');
    const quizResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
    const mockResults = JSON.parse(localStorage.getItem('mockResults') || '[]');
    const voiceResults = JSON.parse(localStorage.getItem('voiceResults') || '[]');
    const xp = parseInt(localStorage.getItem('totalXp') || '0');
    const streak = parseInt(localStorage.getItem('streak') || '1');

    const parsed = cvData ? JSON.parse(cvData) : null;
    const analysis = parsed?.analysis;

    const sectionLabels = {
      experience: 'Experience',
      skills: 'Skills',
      education: 'Education',
      projects: 'Projects',
      formatting: 'Formatting',
      certifications: 'Certs'
    };

    const radarData = analysis ? Object.entries(analysis.sections || {}).map(([key, val]) => ({
      section: sectionLabels[key] || key,
      score: val,
      fullMark: 100
    })) : [];

    const barData = analysis ? Object.entries(analysis.sections || {}).map(([key, val]) => ({
      name: sectionLabels[key] || key,
      score: val,
      color: val >= 80 ? '#1D9E75' : val >= 60 ? '#EF9F27' : '#E24B4A'
    })) : [];

    const quizLineData = quizResults.map((r, i) => ({
      session: 'Q' + (i + 1),
      score: Math.round((r.score / r.total) * 100),
    }));

    const activityData = [
      { name: 'Quizzes', count: quizResults.length, color: '#7F77DD' },
      { name: 'Mock', count: mockResults.length, color: '#1D9E75' },
      { name: 'Voice', count: voiceResults.length, color: '#EF9F27' },
    ];

    const earnedBadges = [];
    if (cvData) earnedBadges.push('cv_uploaded');
    if (quizResults.length > 0) earnedBadges.push('first_quiz');
    if (mockResults.length > 0) earnedBadges.push('first_mock');
    if (voiceResults.length > 0) earnedBadges.push('first_voice');
    if (quizResults.some(r => r.score === r.total)) earnedBadges.push('perfect_score');
    if (streak >= 7) earnedBadges.push('streak_7');

    const weakZones = analysis ? Object.entries(analysis.sections || {})
      .map(([key, val]) => ({ key, label: sectionLabels[key] || key, score: val }))
      .sort((a, b) => a.score - b.score) : [];

    const comparisonData = [
      { name: 'CV Score', value: analysis?.overallScore || 0, color: '#7F77DD' },
      { name: 'ATS', value: analysis?.atsScore || 0, color: '#1D9E75' },
      { name: 'Seniority', value: analysis?.seniorityMatch || 0, color: '#EF9F27' },
      { name: 'Role match', value: analysis?.targetRoleScore || 0, color: '#D85A30' },
    ];

    setStats({
      cvScore: analysis?.overallScore || 0,
      atsScore: analysis?.atsScore || 0,
      targetRoleScore: analysis?.targetRoleScore || null,
      targetRole: parsed?.targetRole || '',
      detectedField: analysis?.detectedField || '',
      detectedSeniority: analysis?.detectedSeniority || '',
      seniorityMatch: analysis?.seniorityMatch || 0,
      quizCount: quizResults.length,
      mockCount: mockResults.length,
      voiceCount: voiceResults.length,
      xp,
      streak,
      weakZones,
      earnedBadges,
      analysis,
      radarData,
      barData,
      quizLineData,
      activityData,
      comparisonData,
    });
  }, []);

  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-20 text-gray-400">
          <p className="mb-4">No data yet — upload your CV to get started</p>
          <button onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium">
            Upload CV →
          </button>
        </div>
      </Layout>
    );
  }

  const level = getLevel(stats.xp);
  const nextLevel = getNextLevel(stats.xp);
  const xpProgress = nextLevel
    ? ((stats.xp - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'cv', label: 'CV Scores' },
    { id: 'progress', label: 'Progress' },
    { id: 'badges', label: 'Badges' },
  ];

  return (
    <Layout>
      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">CV Score</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.cvScore}</div>
          <div className="text-xs text-gray-400 mt-1">{stats.detectedField || 'General'}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">ATS Score</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.atsScore}%</div>
          <div className="text-xs text-gray-400 mt-1">{stats.detectedSeniority || 'Unknown'} level</div>
        </div>
        <div className="bg-brand-50 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">XP Level</div>
          <div className="text-2xl font-semibold text-brand-600">{level.label}</div>
          <div className="text-xs text-gray-400 mt-1">{stats.xp} XP total</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Streak</div>
          <div className="text-2xl font-semibold text-gray-900">{stats.streak}d</div>
          <div className="text-xs text-gray-400 mt-1">{stats.streak >= 7 ? '🔥 on fire!' : 'keep going'}</div>
        </div>
      </div>

      {/* XP bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{level.label} — {stats.xp} XP</span>
          {nextLevel && (
            <span className="text-xs text-gray-400">{nextLevel.label} at {nextLevel.min} XP</span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full mb-2">
          <div
            className="h-2 bg-brand-400 rounded-full transition-all duration-700"
            style={{ width: xpProgress + '%' }}
          />
        </div>
        <div className="flex justify-between">
          {XP_LEVELS.map(l => (
            <span
              key={l.label}
              className={'text-xs ' + (stats.xp >= l.min ? 'text-brand-600 font-medium' : 'text-gray-300')}
            >
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={'flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ' + (
              activeTab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-4">

          {/* Role match */}
          {stats.targetRole && stats.targetRoleScore !== null && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-800">Role match — {stats.targetRole}</h3>
                <span className={'px-3 py-1 text-xs rounded-full font-medium ' + (
                  stats.targetRoleScore >= 70 ? 'bg-green-50 text-green-700' :
                  stats.targetRoleScore >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                )}>
                  {stats.targetRoleScore}% match
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full">
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{
                    width: stats.targetRoleScore + '%',
                    background: stats.targetRoleScore >= 70 ? '#1D9E75' :
                      stats.targetRoleScore >= 50 ? '#EF9F27' : '#E24B4A'
                  }}
                />
              </div>
            </div>
          )}

          {/* Activity chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Activity summary</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats.activityData} barSize={48}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Count">
                  {stats.activityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-3 mt-3">
              {[
                { label: 'Quizzes', count: stats.quizCount, path: '/quiz', color: '#7F77DD' },
                { label: 'Mock interviews', count: stats.mockCount, path: '/mock', color: '#1D9E75' },
                { label: 'Voice sessions', count: stats.voiceCount, path: '/voice', color: '#EF9F27' },
              ].map(a => (
                <div
                  key={a.label}
                  onClick={() => navigate(a.path)}
                  className="text-center p-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="text-xl font-semibold" style={{ color: a.color }}>{a.count}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CV flags */}
          {stats.analysis?.flags?.filter(f => f.type !== 'success').length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-800 mb-3">CV improvement reminders</h3>
              <div className="space-y-2">
                {stats.analysis.flags.filter(f => f.type !== 'success').slice(0, 4).map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className={'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ' + (
                      f.type === 'error' ? 'bg-red-500' : 'bg-amber-400'
                    )} />
                    {f.message}
                  </div>
                ))}
              </div>
              <button onClick={() => navigate('/analysis')} className="mt-3 text-xs text-brand-600 underline">
                View full analysis →
              </button>
            </div>
          )}
        </div>
      )}

      {/* CV SCORES TAB */}
      {activeTab === 'cv' && (
        <div className="space-y-4">

          {/* Radar chart */}
          {stats.radarData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-800 mb-4">CV section radar</h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={stats.radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#f3f4f6" />
                  <PolarAngleAxis dataKey="section" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#7F77DD"
                    fill="#7F77DD"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Horizontal bar chart */}
          {stats.barData.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-medium text-gray-800 mb-4">Section scores</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.barData} barSize={24} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} name="Score">
                    {stats.barData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Heatmap */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Weak zone heatmap</h3>
            <div className="space-y-2">
              {stats.weakZones.map(z => {
                const color = z.score >= 80
                  ? { bar: '#1D9E75' }
                  : z.score >= 60
                  ? { bar: '#EF9F27' }
                  : { bar: '#E24B4A' };
                return (
                  <div key={z.key} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 flex-shrink-0">{z.label}</div>
                    <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                      <div
                        className="h-6 rounded-lg flex items-center px-3 transition-all duration-700"
                        style={{ width: z.score + '%', background: color.bar }}
                      >
                        <span className="text-xs font-medium text-white">{z.score}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS TAB */}
      {activeTab === 'progress' && (
        <div className="space-y-4">

          {/* Quiz line chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Quiz scores over time</h3>
            {stats.quizLineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={stats.quizLineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="session" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#7F77DD"
                    strokeWidth={2}
                    dot={{ fill: '#7F77DD', r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Score %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                <p className="mb-3">Complete a quiz to see your progress here</p>
                <button onClick={() => navigate('/quiz')}
                  className="px-5 py-2 bg-brand-600 text-white rounded-xl text-xs font-medium">
                  Take a quiz →
                </button>
              </div>
            )}
          </div>

          {/* Score comparison */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Score comparison</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.comparisonData} barSize={40}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Score">
                  {stats.comparisonData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Streak tracker */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-medium text-gray-800 mb-4">Practice streak — {stats.streak} days</h3>
            <div className="flex gap-2 flex-wrap">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{
                    background: i < stats.streak ? '#7F77DD' : '#f3f4f6',
                    color: i < stats.streak ? 'white' : '#9ca3af'
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {stats.streak >= 7
                ? '🔥 Amazing streak! Keep it up!'
                : (7 - stats.streak) + ' more days to earn the 7-day streak badge'}
            </p>
          </div>
        </div>
      )}

      {/* BADGES TAB */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map(b => {
              const earned = stats.earnedBadges.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={'p-5 rounded-2xl border text-center transition-all ' + (
                    earned ? 'border-brand-200 bg-brand-50' : 'border-gray-100 bg-gray-50 opacity-40'
                  )}
                >
                  <div className="text-3xl mb-2">{b.icon}</div>
                  <div className="text-xs font-medium text-gray-800 mb-1">{b.name}</div>
                  <div className="text-xs text-gray-400">{b.desc}</div>
                  {earned && <div className="text-xs text-brand-600 mt-2 font-medium">✓ Earned</div>}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center">
            <p className="text-sm text-gray-600 mb-2">
              {stats.earnedBadges.length} of {BADGES.length} badges earned
            </p>
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-brand-400 rounded-full"
                style={{ width: ((stats.earnedBadges.length / BADGES.length) * 100) + '%' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button onClick={() => navigate('/quiz')}
          className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors">
          Practice quiz →
        </button>
        <button onClick={() => navigate('/')}
          className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">
          Upload new CV
        </button>
      </div>
    </Layout>
  );
}

export default Dashboard;