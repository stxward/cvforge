import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Upload', path: '/', icon: '↑' },
  { label: 'Analysis', path: '/analysis', icon: '◎' },
  { label: 'Quiz', path: '/quiz', icon: '◇' },
  { label: 'Mock Interview', path: '/mock', icon: '◈' },
  { label: 'Voice', path: '/voice', icon: '◉' },
  { label: 'Dashboard', path: '/dashboard', icon: '▦' },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`w-full sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : 'bg-white'
    } border-b border-gray-100`}>
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate('/')}
        >
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center shadow-brand group-hover:shadow-brand-lg transition-all duration-200">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 13L8 3L13 13M5.5 9H10.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-base font-semibold text-gray-900 tracking-tight">
            CV<span className="gradient-text">Forge</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-white/60'
                }`}
              >
                {tab.label === 'Voice' ? '🎙️ ' : ''}{tab.label}
              </button>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 gradient-bg rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-brand">
            S
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;