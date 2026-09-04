import { Groq } from 'groq-sdk';
import AISetting from '../models/AISetting.js';

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

export const generateAIFeedback = async (req, res) => {
  try {
    const { studentName, score, totalQuestions, domains, strengths, weakAreas } = req.body;

    const groq = getGroqClient();
    if (!groq) {
      return res.json({
        success: true,
        feedback: `Great effort, ${studentName || 'Student'}! You scored ${score}/${totalQuestions}. Focus on strengthening your core fundamentals across your selected domains: ${domains?.join(', ') || 'General'}.`
      });
    }

    const prompt = `
Generate constructive, encouraging educational feedback for a student who completed an assessment.
Student Name: ${studentName || 'Student'}
Score: ${score}/${totalQuestions}
Domains Evaluated: ${domains?.join(', ') || 'General Technical Domains'}
Strengths: ${strengths?.join(', ') || 'Good effort on basic concepts'}
Areas for Improvement: ${weakAreas?.join(', ') || 'Deeper technical clarity'}

Keep response concise (3-4 paragraphs max). Include Vedic connection to modern engineering learning if relevant.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'groq/compound-mini',
      temperature: 0.7,
      max_tokens: 500
    });

    const feedback = chatCompletion.choices[0]?.message?.content || 'Feedback unavailable.';
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Groq AI API error:', error.message);
    res.json({
      success: true,
      feedback: 'Great job completing your assessment! Review your incorrect answers and practice core concepts in your chosen domains.'
    });
  }
};

export const getAISettings = async (req, res) => {
  try {
    let settings = await AISetting.findOne({ key: 'global_ai_toggle' });
    if (!settings) {
      settings = await AISetting.create({ key: 'global_ai_toggle', enabled: true });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAISettings = async (req, res) => {
  try {
    const { enabled } = req.body;
    const updated = await AISetting.findOneAndUpdate(
      { key: 'global_ai_toggle' },
      { enabled },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
