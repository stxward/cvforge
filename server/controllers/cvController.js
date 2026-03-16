const { generateSpeech } = require('../services/voiceService');
const { parseCV } = require('../services/parseService');
const { analyseWithClaude, generateQuiz, generateMockQuestions, scoreMockAnswer, scoreVoiceAnswer, suggestRoles } = require('../services/claudeService');

const uploadCV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const filePath = req.file.path;
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    const cvText = await parseCV(filePath, fileExt);
    if (!cvText || cvText.trim().length === 0)
      return res.status(400).json({ error: 'Could not extract text from file' });
    res.json({ success: true, cvText, fileName: req.file.originalname, wordCount: cvText.split(' ').length });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

const analyseCV = async (req, res) => {
  try {
    const { cvText, targetRole, jobDescription } = req.body;
    if (!cvText) return res.status(400).json({ error: 'No CV text provided' });
    const analysis = await analyseWithClaude(cvText, targetRole || '', jobDescription || '');
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

const generateQuizQuestions = async (req, res) => {
  try {
    const { cvText, difficulty, category, count } = req.body;
    if (!cvText) return res.status(400).json({ error: 'No CV text provided' });
    const questions = await generateQuiz(cvText, difficulty || 'medium', category || 'Mixed', count || 10);
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({ error: error.message });
  }
};

const startMockInterview = async (req, res) => {
  try {
    const { cvText, role, company } = req.body;
    if (!cvText) return res.status(400).json({ error: 'No CV text provided' });
    const questions = await generateMockQuestions(cvText, role || 'Software Engineer', company || 'startup');
    res.json({ success: true, questions });
  } catch (error) {
    console.error('Mock error:', error);
    res.status(500).json({ error: error.message });
  }
};

const scoreAnswer = async (req, res) => {
  try {
    const { question, answer, cvText } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Missing question or answer' });
    const scores = await scoreMockAnswer(question, answer, cvText);
    res.json({ success: true, scores });
  } catch (error) {
    console.error('Score error:', error);
    res.status(500).json({ error: error.message });
  }
};

const scoreVoice = async (req, res) => {
  try {
    const { question, transcript, cvText } = req.body;
    if (!question || !transcript) return res.status(400).json({ error: 'Missing question or transcript' });
    const scores = await scoreVoiceAnswer(question, transcript, cvText);
    res.json({ success: true, scores });
  } catch (error) {
    console.error('Voice score error:', error);
    res.status(500).json({ error: error.message });
  }
};
const getRoleSuggestions = async (req, res) => {
  try {
    const { cvText } = req.body;
    if (!cvText) return res.status(400).json({ error: 'No CV text provided' });
    const roles = await suggestRoles(cvText);
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Roles error:', error);
    res.status(500).json({ error: error.message });
  }
};
const textToSpeech = async (req, res) => {
  try {
    const { text, personaId } = req.body;
    if (!text) return res.status(400).json({ error: 'No text provided' });
    const audioBuffer = await generateSpeech(text, personaId || 'alex');
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message });
  }
};
module.exports = { uploadCV, analyseCV, generateQuizQuestions, startMockInterview, scoreAnswer, scoreVoice, getRoleSuggestions, textToSpeech };