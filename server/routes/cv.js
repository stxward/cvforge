const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cvController = require('../controllers/cvController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    allowed.includes(ext) ? cb(null, true) : cb(new Error('Only PDF, DOCX and TXT allowed'));
  }
});

router.post('/upload', upload.single('cv'), cvController.uploadCV);
router.post('/analyse', cvController.analyseCV);
router.post('/quiz', cvController.generateQuizQuestions);
router.post('/mock/start', cvController.startMockInterview);
router.post('/mock/score', cvController.scoreAnswer);
router.post('/voice/score', cvController.scoreVoice);
router.post('/roles', cvController.getRoleSuggestions);
module.exports = router;