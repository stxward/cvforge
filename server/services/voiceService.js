const https = require('https');

const VOICES = {
  alex: 'pNInz6obpgDQGcFmaJgB',    // Adam — calm American male
  sara: 'EXAVITQu4vr4xnSDxMaL',    // Bella — natural American female
  marcus: 'onwK4e9ZLuTAKqWW03F9',  // Daniel — formal British male
};

const generateSpeech = async (text, personaId) => {
  return new Promise((resolve, reject) => {
    const voiceId = VOICES[personaId] || VOICES.alex;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const body = JSON.stringify({
      text: text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}`,
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errorData = '';
        res.on('data', chunk => errorData += chunk);
        res.on('end', () => {
          console.error('ElevenLabs HTTP error:', res.statusCode, errorData);
          reject(new Error(`ElevenLabs error: ${res.statusCode}`));
        });
        return;
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

module.exports = { generateSpeech };

