const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// CV Analysis
const analyseWithClaude = async (cvText, targetRole = '', jobDescription = '') => {
  try {
    const prompt = `You are an expert CV analyst, career coach and hiring manager with 20 years of experience across all industries.

Analyse this CV thoroughly against industry standards, seniority expectations, and the target role if provided.

CV TEXT:
${cvText}

${targetRole ? `TARGET ROLE: ${targetRole}` : ''}
${jobDescription ? `JOB DESCRIPTION:\n${jobDescription}` : ''}

Return ONLY a valid JSON object with this exact structure — no extra text, no markdown, no backticks:
{
  "overallScore": <number 0-100>,
  "atsScore": <number 0-100>,
  "wordCount": <number>,
  "detectedField": "<e.g. Software Engineering, Data Science, Marketing, Finance, Healthcare, Design, etc.>",
  "detectedSeniority": "<Junior|Mid|Senior|Lead|Executive>",
  "seniorityMatch": <number 0-100 — do achievements and language match the claimed seniority level>,
  "targetRoleScore": <number 0-100 or null if no target role provided — how strong is this CV for the target role>,
  "targetRoleGaps": ["<specific skill or experience missing for the target role>"],
  "targetRoleStrengths": ["<specific thing that makes this CV strong for the target role>"],
  "jobDescriptionMatch": <number 0-100 or null if no JD provided>,
  "matchedKeywords": ["<keyword from JD found in CV>"],
  "missingKeywords": ["<important keyword from JD missing from CV>"],
  "sections": {
    "experience": <number 0-100>,
    "skills": <number 0-100>,
    "education": <number 0-100>,
    "projects": <number 0-100>,
    "formatting": <number 0-100>,
    "certifications": <number 0-100>
  },
  "verdict": "<one sentence summary of the CV quality for this specific field and role>",
  "industryInsights": "<2 sentences on how this CV compares to industry standards for this field>",
  "seniorityInsights": "<1 sentence on whether achievements match the seniority level>",
  "buzzwords": ["<vague buzzword found in CV>"],
  "unquantifiedAchievements": ["<achievement stated without numbers>"],
  "flags": [
    { "type": "error|warning|success", "message": "<specific actionable feedback>" }
  ],
  "skills": ["<skill1>", "<skill2>"],
  "experience": ["<job title at company>"],
  "topStrengths": ["<strength1>", "<strength2>", "<strength3>"]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
      temperature: 0.3
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Groq error:', error.message);
    throw new Error('Failed to analyse CV with AI');
  }
};

// Quiz Generation
const generateQuiz = async (cvText, difficulty, category, count) => {
  try {
    const prompt = `You are a real interviewer conducting a job interview. Based on this CV, generate ${count} multiple choice questions.

CV TEXT:
${cvText}

Requirements:
- Difficulty: ${difficulty}
- Category focus: ${category}
- Questions must sound like a real interviewer asking them naturally in a job interview
- Do NOT ask trivia about the CV — ask questions that test understanding and real ability
- Easy: ask the candidate to explain concepts or choices they made
- Medium: ask them to reason through decisions or compare approaches
- Hard: challenge them to defend specific claims in their CV or handle difficult scenarios
- Wrong answer options must be realistic and plausible

Return ONLY a valid JSON array — no extra text, no markdown, no backticks:
[
  {
    "id": 1,
    "question": "<natural interviewer-style question>",
    "category": "${category}",
    "difficulty": "${difficulty}",
    "options": [
      { "id": "a", "text": "<option a>" },
      { "id": "b", "text": "<option b>" },
      { "id": "c", "text": "<option c>" },
      { "id": "d", "text": "<option d>" }
    ],
    "correctAnswer": "<a|b|c|d>",
    "explanation": "<why this is the correct answer>"
  }
]`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.5
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Groq quiz error:', error.message);
    throw new Error('Failed to generate quiz questions');
  }
};

// Generate mock interview questions
const generateMockQuestions = async (cvText, role, company) => {
  try {
    const prompt = `You are an expert interview coach. Based on this CV, generate 5 open-ended interview questions.

CV TEXT:
${cvText}

Interview style: ${company} (startup=fast paced and direct, corporate=formal and structured, faang=technical and deep)
Target role: ${role}

IMPORTANT RULES:
- Questions must sound like a real human interviewer asking them naturally
- Do NOT start questions with "Can you describe your experience with..." or "Walk me through..."
- Use varied natural openers like "Tell me about...", "What was your approach when...", "How did you handle...", "What would you do if...", "Why did you choose...", "What's the most challenging..."
- Questions must be based on specific things in the CV but asked conversationally
- Mix behavioral, situational and technical questions naturally

Return ONLY a valid JSON array — no extra text, no markdown, no backticks:
[
  {
    "id": 1,
    "question": "<natural conversational interview question>",
    "type": "<behavioral|technical|situational>",
    "hint": "<STAR elements a great answer would cover>"
  }
]`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.6
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Groq mock error:', error.message);
    throw new Error('Failed to generate interview questions');
  }
};

// Score a mock interview answer
const scoreMockAnswer = async (question, answer, cvText) => {
  try {
    const prompt = `You are an expert interview coach scoring a candidate's answer.

CV TEXT:
${cvText}

QUESTION: ${question}

CANDIDATE'S ANSWER: ${answer}

Score this answer and return ONLY a valid JSON object — no extra text, no markdown, no backticks:
{
  "relevance": <number 0-10>,
  "clarity": <number 0-10>,
  "depth": <number 0-10>,
  "starFormat": <number 0-10>,
  "overallScore": <number 0-10>,
  "feedback": "<2-3 sentences of specific constructive feedback>",
  "strongPoints": ["<what they did well>"],
  "improvements": ["<specific thing to improve>"],
  "followUpQuestion": "<a natural follow-up question based on their answer>"
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Groq score error:', error.message);
    throw new Error('Failed to score answer');
  }
};

// Score a voice interview answer
const scoreVoiceAnswer = async (question, transcript, cvText) => {
  try {
    const prompt = `You are an expert interview coach scoring a spoken interview answer.

CV TEXT:
${cvText}

QUESTION: ${question}

SPOKEN TRANSCRIPT: ${transcript}

Analyse this spoken answer and return ONLY a valid JSON object — no extra text, no markdown, no backticks:
{
  "relevance": <number 0-10>,
  "clarity": <number 0-10>,
  "depth": <number 0-10>,
  "starFormat": <number 0-10>,
  "overallScore": <number 0-10>,
  "fillerWords": {
    "um": <count>,
    "uh": <count>,
    "like": <count>,
    "basically": <count>,
    "youKnow": <count>
  },
  "totalFillers": <total filler word count>,
  "pace": "too slow|good|too fast",
  "feedback": "<2-3 sentences of specific constructive feedback>",
  "strongPoints": ["<what they did well>"],
  "improvements": ["<specific improvement>"],
  "followUpQuestion": "<natural follow-up question based on their answer>",
  "annotatedTranscript": [
    { "text": "<sentence or phrase>", "type": "strong|filler|missing|normal" }
  ]
}`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Groq voice score error:', error.message);
    throw new Error('Failed to score voice answer');
  }
};
// Suggest relevant job roles from CV
const suggestRoles = async (cvText) => {
  try {
    const prompt = `You are a career coach. Based on this CV, suggest the most relevant job roles this person could apply for.

CV TEXT:
${cvText}

Return ONLY a valid JSON array of 8 job role strings — no extra text, no markdown, no backticks:
["<role1>", "<role2>", "<role3>", "<role4>", "<role5>", "<role6>", "<role7>", "<role8>"]

Rules:
- Roles must be directly relevant to the skills and experience in this CV
- Mix of exact current roles and aspirational next-step roles
- Be specific — not just "Engineer" but "Machine Learning Engineer" or "Backend Engineer"
- Vary seniority slightly — include some lateral and some stretch roles`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.4
    });

    const rawText = completion.choices[0].message.content;
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);

  } catch (error) {
    console.error('Groq roles error:', error.message);
    return [];
  }
};
module.exports = { analyseWithClaude, generateQuiz, generateMockQuestions, scoreMockAnswer, scoreVoiceAnswer, suggestRoles };