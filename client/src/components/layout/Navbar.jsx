import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
  { label: 'Upload', path: '/' },
  { label: 'CV Analysis', path: '/analysis' },
  { label: 'Quiz', path: '/quiz' },
  { label: 'Mock Interview', path: '/mock' },
  { label: '🎙️ Voice Interview', path: '/voice' },
  { label: 'Dashboard', path: '/dashboard' },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      
      {/* Logo */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 13L8 3L13 13M5.5 9H10.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-800">CVForge</span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-150 ${
              location.pathname === tab.path
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;