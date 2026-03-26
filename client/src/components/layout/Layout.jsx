import React from 'react';
import Navbar from './Navbar';

function Layout({ children, fullWidth = false }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <main className={`${fullWidth ? '' : 'max-w-5xl mx-auto px-6 py-8'}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;