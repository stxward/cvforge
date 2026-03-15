import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Upload from './pages/Upload';
import Analysis from './pages/Analysis';
import Quiz from './pages/Quiz';
import MockInterview from './pages/MockInterview';
import VoiceInterview from './pages/VoiceInterview';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Upload />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/mock" element={<MockInterview />} />
        <Route path="/voice" element={<VoiceInterview />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;