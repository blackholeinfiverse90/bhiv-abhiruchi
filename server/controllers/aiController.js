import { Groq } from 'groq-sdk';
import AISetting from '../models/AISetting.js';

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

/**
 * Universal LLM dispatcher supporting Uniguru / Mitra and Groq
 */
export const callLLM = async (messages, maxTokens = 2000) => {
  const settings = await AISetting.findOne({ key: 'global_ai_toggle' }) || {};
  const provider = settings.provider || process.env.AI_PROVIDER || 'groq';

  // 1. Uniguru / Mitra Language Model Provider
  if (provider === 'uniguru_mitra' || provider === 'uniguru' || provider === 'mitra') {
    const endpoint = settings.metadata?.uniguru_endpoint || process.env.UNIGURU_API_URL || 'https://api.uniguru.ai/v1/chat/completions';
    const apiKey = settings.metadata?.uniguru_api_key || process.env.UNIGURU_API_KEY || '';
    const model = settings.model || settings.metadata?.uniguru_model || process.env.UNIGURU_MODEL || 'uniguru-mitra-v1';

    try {
      console.log(`🤖 Dispatching prompt to Uniguru/Mitra LLM [${model}] at ${endpoint}...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: maxTokens
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return content;
      }
      console.warn(`Uniguru/Mitra endpoint returned status ${response.status}, falling back to Groq...`);
    } catch (uniguruErr) {
      console.warn(`Uniguru/Mitra call error (${uniguruErr.message}), falling back to Groq...`);
    }
  }

  // 2. Groq AI Fallback
  const groq = getGroqClient();
  if (groq) {
    const candidateModels = [
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b'
    ];

    for (const model of candidateModels) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages,
          model,
          temperature: 0.7,
          max_tokens: maxTokens
        });
        const content = chatCompletion.choices?.[0]?.message?.content;
        if (content) return content;
      } catch (e) {
        console.warn(`Groq model ${model} failed:`, e.message);
      }
    }
  }

  throw new Error('All AI providers (Uniguru/Mitra & Groq) are currently unavailable');
};

/**
 * Generate questions strictly aligned with student's field of study
 */
export const generateQuestionsAI = async (req, res) => {
  try {
    const { field_of_study = 'STEM', difficulty = 'medium', count = 5, topics = [] } = req.body;

    const prompt = `
You are the Uniguru / Mitra Curriculum Engine for the BHIV Gurukul Assessment platform.
Generate exactly ${count} multiple choice questions strictly tailored to the following Field of Study:
Field of Study: ${field_of_study}
Difficulty Level: ${difficulty}
Target Specific Topics: ${topics.length > 0 ? topics.join(', ') : 'Core technical concepts, real-world systems, and practical scenarios in ' + field_of_study}

IMPORTANT: You must respond ONLY with a raw valid JSON array of objects. Do NOT use markdown code blocks, do NOT write \`\`\`json or backticks.
Format for each question object:
{
  "question_text": "Detailed, practical question text",
  "options": [
    "A) Option description",
    "B) Option description",
    "C) Option description",
    "D) Option description"
  ],
  "correct_answer": "A) Exact string matching one of the options",
  "explanation": "Clear explanation of why this answer is correct",
  "vedic_connection": "Foundational principle or analogy connecting classical wisdom with modern systems",
  "modern_application": "How this concept is actively used in modern industry today"
}
`;

    const rawResponse = await callLLM([
      {
        role: 'system',
        content: 'You are Uniguru / Mitra, an advanced AI technical curriculum educator. You MUST output ONLY raw valid JSON array of question objects without markdown tags.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], 3500);

    // Clean JSON response
    let cleaned = rawResponse.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    const questions = JSON.parse(cleaned);

    const formattedQuestions = questions.map((q, idx) => ({
      question_id: `ai_${field_of_study.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}_${idx}`,
      category: field_of_study,
      difficulty: difficulty.toLowerCase(),
      question_text: q.question_text || q.question || '',
      options: Array.isArray(q.options) ? q.options : [],
      correct_answer: q.correct_answer || (Array.isArray(q.options) ? q.options[0] : ''),
      explanation: q.explanation || '',
      vedic_connection: q.vedic_connection || '',
      modern_application: q.modern_application || '',
      target_domains: [field_of_study.toLowerCase().replace(/[^a-z0-9]/g, '_')],
      is_ai_generated: true,
      created_by: 'ai'
    }));

    res.json({
      success: true,
      field_of_study,
      count: formattedQuestions.length,
      data: formattedQuestions
    });
  } catch (error) {
    console.error('generateQuestionsAI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate student assessment feedback
 */
export const generateAIFeedback = async (req, res) => {
  try {
    const { studentName, score, totalQuestions, domains, strengths, weakAreas } = req.body;

    const prompt = `
Generate constructive, encouraging educational feedback for a student who completed an assessment.
Student Name: ${studentName || 'Student'}
Score: ${score}/${totalQuestions}
Domains Evaluated: ${domains?.join(', ') || 'General Technical Domains'}
Strengths: ${strengths?.join(', ') || 'Good effort on basic concepts'}
Areas for Improvement: ${weakAreas?.join(', ') || 'Deeper technical clarity'}

Keep response concise (3-4 paragraphs max). Include Vedic connection to modern engineering learning if relevant.
`;

    try {
      const feedback = await callLLM([
        { role: 'user', content: prompt }
      ], 600);

      res.json({ success: true, feedback });
    } catch {
      res.json({
        success: true,
        feedback: `Great effort, ${studentName || 'Student'}! You scored ${score}/${totalQuestions}. Focus on strengthening your core fundamentals across your selected domains: ${domains?.join(', ') || 'General'}.`
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Test AI model connectivity (Uniguru / Mitra or Groq)
 */
export const testAIConnection = async (req, res) => {
  try {
    const response = await callLLM([
      { role: 'user', content: 'Say "Uniguru/Mitra AI connection verified successfully." in 1 short sentence.' }
    ], 100);

    res.json({ success: true, message: response.trim() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAISettings = async (req, res) => {
  try {
    let settings = await AISetting.findOne({ key: 'global_ai_toggle' });
    if (!settings) {
      settings = await AISetting.create({
        key: 'global_ai_toggle',
        enabled: true,
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        metadata: {
          uniguru_endpoint: 'https://api.uniguru.ai/v1/chat/completions',
          uniguru_model: 'uniguru-mitra-v1'
        }
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAISettings = async (req, res) => {
  try {
    const { enabled, provider, model, metadata } = req.body;
    const updateObj = {};
    if (enabled !== undefined) updateObj.enabled = enabled;
    if (provider !== undefined) updateObj.provider = provider;
    if (model !== undefined) updateObj.model = model;
    if (metadata !== undefined) updateObj.metadata = metadata;

    const updated = await AISetting.findOneAndUpdate(
      { key: 'global_ai_toggle' },
      updateObj,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
