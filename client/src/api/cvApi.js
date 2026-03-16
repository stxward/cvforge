import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

export const uploadCV = async (file) => {
  const formData = new FormData();
  formData.append('cv', file);
  const response = await axios.post(`${BASE_URL}/cv/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const analyseCV = async (cvText, targetRole = '', jobDescription = '') => {
  const response = await axios.post(`${BASE_URL}/cv/analyse`, {
    cvText, targetRole, jobDescription
  });
  return response.data;
};

export const generateQuiz = async (cvText, difficulty, category, count) => {
  const response = await axios.post(`${BASE_URL}/cv/quiz`, { cvText, difficulty, category, count });
  return response.data;
};

export const startMockInterview = async (cvText, role, company) => {
  const response = await axios.post(`${BASE_URL}/cv/mock/start`, { cvText, role, company });
  return response.data;
};

export const scoreAnswer = async (question, answer, cvText) => {
  const response = await axios.post(`${BASE_URL}/cv/mock/score`, { question, answer, cvText });
  return response.data;
};

export const scoreVoiceAnswer = async (question, transcript, cvText) => {
  const response = await axios.post(`${BASE_URL}/cv/voice/score`, { question, transcript, cvText });
  return response.data;
};
export const getRoleSuggestions = async (cvText) => {
  const response = await axios.post(`${BASE_URL}/cv/roles`, { cvText });
  return response.data;
};
export const textToSpeech = async (text, personaId) => {
  const response = await axios.post(
    `${BASE_URL}/cv/tts`,
    { text, personaId },
    { responseType: 'arraybuffer' }
  );
  return response.data;
};