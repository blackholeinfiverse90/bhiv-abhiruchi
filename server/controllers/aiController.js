import { Groq } from 'groq-sdk';
import AISetting from '../models/AISetting.js';
import Question from '../models/Question.js';

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const DEFAULT_MITRA_ENDPOINT = 'https://mitra.blackholeinfiverse.com/api/companion/chat';
const DEFAULT_MITRA_MODEL = 'mitra-companion';

let cachedMitraAuth = {
  token: null,
  userId: 'usr_abhiruchi_backend',
  baseUrl: null,
  fetchedAt: 0
};

const MITRA_TOKEN_TTL_MS = 20 * 60 * 1000;

const getMitraBaseUrl = (endpoint) => {
  try {
    const parsed = new URL(endpoint);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'https://mitra.blackholeinfiverse.com';
  }
};

const normalizeMitraEndpoint = (endpoint) => {
  const trimmed = String(endpoint || DEFAULT_MITRA_ENDPOINT).trim().replace(/\/+$/, '');
  if (!trimmed || trimmed.includes('api.uniguru.ai')) {
    return DEFAULT_MITRA_ENDPOINT;
  }
  if (/^https?:\/\/[^/]+$/i.test(trimmed)) {
    return `${trimmed}/api/companion/chat`;
  }
  return trimmed;
};

const fetchMitraGuestToken = async (baseUrl, forceRefresh = false) => {
  const now = Date.now();
  if (
    !forceRefresh &&
    cachedMitraAuth.token &&
    cachedMitraAuth.baseUrl === baseUrl &&
    now - cachedMitraAuth.fetchedAt < MITRA_TOKEN_TTL_MS
  ) {
    return cachedMitraAuth;
  }

  const authRes = await fetch(`${baseUrl}/api/auth/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
    signal: AbortSignal.timeout(15000)
  });

  if (!authRes.ok) {
    throw new Error(`Mitra guest auth failed with HTTP ${authRes.status}`);
  }

  const authData = await authRes.json();
  if (!authData?.access_token) {
    throw new Error('Mitra guest auth did not return access_token');
  }

  cachedMitraAuth = {
    token: authData.access_token,
    userId: authData.user?.id || authData.user?.user_id || 'usr_abhiruchi_backend',
    baseUrl,
    fetchedAt: now
  };
  return cachedMitraAuth;
};

const formatMessagesAsMitraPrompt = (messages) => {
  if (!Array.isArray(messages)) return String(messages || '');
  const userMsgs = messages.filter((m) => m.role === 'user').map((m) => m.content);
  if (userMsgs.length > 0) return userMsgs.join('\n\n');
  return messages.map((m) => m.content).join('\n\n');
};

const extractLLMContent = (data) => {
  if (!data) return null;
  if (typeof data === 'string') return data;
  if (typeof data.message === 'string' && data.message.trim()) return data.message;
  return (
    data.choices?.[0]?.message?.content ||
    data.choices?.[0]?.text ||
    data.message?.content ||
    data.response ||
    data.answer ||
    data.output ||
    data.text ||
    data.data?.response ||
    data.data?.content ||
    null
  );
};

/**
 * Universal LLM dispatcher supporting MITRA (with auto guest JWT auth) and Groq fallback
 */
export const callLLMWithMeta = async (messages, maxTokens = 2000, { mitraTimeoutMs = 25000 } = {}) => {
  const settings = (await AISetting.findOne({ key: 'global_ai_toggle' })) || {};
  const errors = [];

  // 1. Always try MITRA first automatically; fall back to Groq if unavailable
  const rawEndpoint = settings.metadata?.uniguru_endpoint || process.env.MITRA_API_URL || process.env.UNIGURU_API_URL || DEFAULT_MITRA_ENDPOINT;
  const endpoint = normalizeMitraEndpoint(rawEndpoint);
  const manualApiKey = (settings.metadata?.uniguru_api_key || process.env.MITRA_API_KEY || process.env.UNIGURU_API_KEY || '').trim();
  const rawModel = settings.model || settings.metadata?.uniguru_model || process.env.MITRA_MODEL || process.env.UNIGURU_MODEL || DEFAULT_MITRA_MODEL;
  const model = rawModel && rawModel.trim().length >= 2 && rawModel !== 'uniguru-mitra-v1'
    ? rawModel.trim()
    : DEFAULT_MITRA_MODEL;

  const isMitraCompanion = endpoint.includes('/api/companion/chat') || endpoint.includes('mitra.blackholeinfiverse.com');

  if (settings.provider !== 'groq_only') {
    try {
      if (isMitraCompanion) {
        const baseUrl = getMitraBaseUrl(endpoint);
        let authInfo = manualApiKey
          ? { token: manualApiKey, userId: 'usr_abhiruchi_backend' }
          : await fetchMitraGuestToken(baseUrl);

        const sendMitraRequest = async (token, userId) => {
          return fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              message: formatMessagesAsMitraPrompt(messages),
              user_id: userId,
              platform: 'api',
              model
            }),
            signal: AbortSignal.timeout(mitraTimeoutMs)
          });
        };

        console.log(`🤖 Dispatching prompt to MITRA [${model}] at ${endpoint}...`);
        let response = await sendMitraRequest(authInfo.token, authInfo.userId);

        // If manual/cached token expired or was rejected, mint a fresh guest JWT token and retry once
        if (response.status === 401 || response.status === 403) {
          console.warn(`MITRA returned ${response.status}, refreshing guest JWT token...`);
          authInfo = await fetchMitraGuestToken(baseUrl, true);
          response = await sendMitraRequest(authInfo.token, authInfo.userId);
        }

        if (response.ok) {
          const data = await response.json();
          const content = extractLLMContent(data);
          const isEmsHijack =
            data.intent === 'ems' ||
            (typeof content === 'string' && /^Done\s*[—-]\s*Task created:/i.test(content.trim()));
          const isNewsHijack =
            ['news', 'samachar'].includes(String(data.intent || '').toLowerCase()) ||
            (typeof content === 'string' && /SAMACHAR\s*[—-]\s*Verified News Intelligence|MITRA Multi-Source Fact Check Engine/i.test(content));

          if (isEmsHijack) {
            errors.push('MITRA routed prompt to task creation (ems)');
            console.warn('MITRA routed prompt to ems task creation, falling back to Groq...');
          } else if (isNewsHijack) {
            errors.push('MITRA routed prompt to news summary (samachar)');
            console.warn('MITRA routed prompt to SAMACHAR news summary, falling back to Groq...');
          } else if (content) {
            return { content, providerUsed: 'mitra', modelUsed: model };
          } else {
            errors.push('MITRA returned empty message');
          }
        } else {
          errors.push(`MITRA HTTP ${response.status}`);
          console.warn(`MITRA endpoint returned status ${response.status}, falling back to Groq...`);
        }
      } else {
        // Generic OpenAI-compatible custom endpoint
        console.log(`🤖 Dispatching prompt to Custom LLM [${model}] at ${endpoint}...`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(manualApiKey ? { Authorization: `Bearer ${manualApiKey}`, 'X-API-Key': manualApiKey } : {})
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.7,
            max_tokens: maxTokens
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (response.ok) {
          const data = await response.json();
          const content = extractLLMContent(data);
          if (content) {
            return { content, providerUsed: 'mitra', modelUsed: model };
          }
          errors.push('Custom LLM returned empty content');
        } else {
          errors.push(`Custom LLM HTTP ${response.status}`);
          console.warn(`Custom LLM endpoint returned status ${response.status}, falling back to Groq...`);
        }
      }
    } catch (mitraErr) {
      errors.push(`MITRA: ${mitraErr.message}`);
      console.warn(`MITRA call error (${mitraErr.message}), falling back to Groq...`);
    }
  }

  // 2. Automatic Groq Fallback
  const groq = getGroqClient();
  if (groq) {
    const candidateModels = [
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
      'qwen/qwen3.8-27b'
    ];
    const groqMaxTokens = Math.max(Number(maxTokens) || 0, 300);

    for (const groqModel of candidateModels) {
      try {
        const extraOpts = groqModel.startsWith('openai/gpt-oss-') ? { reasoning_effort: 'low' } : {};
        const chatCompletion = await groq.chat.completions.create({
          messages,
          model: groqModel,
          temperature: 0.7,
          max_tokens: groqMaxTokens,
          ...extraOpts
        });
        const content = chatCompletion.choices?.[0]?.message?.content;
        if (content) {
          return { content, providerUsed: 'groq', modelUsed: groqModel };
        }
        errors.push(`Groq[${groqModel}]: empty content`);
      } catch (e) {
        errors.push(`Groq[${groqModel}]: ${e.message}`);
        console.warn(`Groq model ${groqModel} failed:`, e.message);
      }
    }
  } else {
    errors.push('GROQ_API_KEY not configured on server');
  }

  throw new Error(`All AI providers unavailable (${errors.join('; ')})`);
};

export const callLLM = async (messages, maxTokens = 2000) => {
  const { content } = await callLLMWithMeta(messages, maxTokens);
  return content;
};

const stripOuterCodeFence = (text) => {
  let s = String(text || '').trim();
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```(?!.*```)/i);
  if (fenceMatch && fenceMatch[1].trim().startsWith('[')) {
    return fenceMatch[1].trim();
  }
  return s.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
};

const extractCompleteJsonObjects = (text) => {
  const results = [];
  let inString = false;
  let escape = false;
  let depth = 0;
  let objStart = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      if (depth === 0) objStart = i;
      depth++;
    } else if (ch === '}') {
      if (depth > 0) {
        depth--;
        if (depth === 0 && objStart !== -1) {
          const slice = text.slice(objStart, i + 1)
            .replace(/,\s*([\]}])/g, '$1')
            .replace(/[\u201C\u201D]/g, '"');
          try {
            const parsed = JSON.parse(slice);
            if (parsed && (parsed.question_text || parsed.question || parsed.text)) {
              results.push(parsed);
            }
          } catch {
            // Skip malformed object
          }
          objStart = -1;
        }
      }
    }
  }
  return results;
};

const parseQuestionsJson = (rawResponse) => {
  const cleaned = stripOuterCodeFence(rawResponse);
  const startIdx = cleaned.indexOf('[');
  const endIdx = cleaned.lastIndexOf(']');
  if (startIdx !== -1 && endIdx > startIdx) {
    const candidate = cleaned
      .substring(startIdx, endIdx + 1)
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/[\u201C\u201D]/g, '"');
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) return parsed.questions;
    } catch {
      // Fall through to balanced-brace extraction if truncated
    }
  }

  return extractCompleteJsonObjects(cleaned);
};

const resolveCorrectAnswer = (rawAnswer, options) => {
  const ans = String(rawAnswer || '').trim();
  if (!Array.isArray(options) || options.length === 0) return ans;
  if (options.includes(ans)) return ans;

  // Case-insensitive exact match
  const exactInsensitive = options.find((o) => String(o).trim().toLowerCase() === ans.toLowerCase());
  if (exactInsensitive) return exactInsensitive;

  // Match single letter like "B", "B)", "B."
  const letterMatch = ans.match(/^([A-Da-d])[\.\)]?$/);
  if (letterMatch) {
    const letter = letterMatch[1].toUpperCase();
    const matched = options.find((o) => new RegExp(`^${letter}[\\).:\\s]`, 'i').test(o.trim()));
    if (matched) return matched;
    const idx = letter.charCodeAt(0) - 65;
    if (options[idx]) return options[idx];
  }

  // Strip "A) " / "A. " prefix on both sides and compare body text
  const stripPrefix = (s) => s.replace(/^[A-Da-d][\)\.\:\-\s]+/, '').trim().toLowerCase();
  const ansBody = stripPrefix(ans);
  if (ansBody) {
    const bodyMatch = options.find((o) => stripPrefix(String(o)) === ansBody);
    if (bodyMatch) return bodyMatch;
  }

  return ans || options[0];
};

/**
 * Reusable internal helper to generate field-of-study aligned questions via MITRA / Groq
 * Uses sequential top-up batches when a provider truncates longer responses (e.g. MITRA companion).
 */
export const generateFieldQuestionsInternal = async ({
  field_of_study = 'STEM',
  category = '',
  difficulty = 'medium',
  count = 5,
  topics = [],
  education_level = '',
  exclude_questions = [],
  target_domains = [],
  saveToBank = false
} = {}) => {
  const targetCount = Math.min(20, Math.max(1, Number(count) || 5));
  const resolvedCategory = category && category.trim() ? category.trim() : field_of_study;
  const domainSlug = String(field_of_study).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const domainsList = Array.isArray(target_domains) && target_domains.length > 0
    ? target_domains
    : (domainSlug ? [domainSlug] : []);

  const topicText = Array.isArray(topics) && topics.length > 0
    ? topics.join(', ')
    : `core concepts and real-world applications in ${field_of_study} (${resolvedCategory})`;

  const normalizedDiff = ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())
    ? String(difficulty).toLowerCase()
    : 'medium';

  const collected = [];
  const seenTexts = new Set(
    (Array.isArray(exclude_questions) ? exclude_questions : []).map(t => String(t).toLowerCase().trim())
  );
  let lastProviderUsed = 'mitra';
  let lastModelUsed = DEFAULT_MITRA_MODEL;
  const maxAttempts = Math.min(Math.ceil(targetCount / 2) + 2, 6);

  for (let attempt = 0; attempt < maxAttempts && collected.length < targetCount; attempt++) {
    const remaining = targetCount - collected.length;
    const batchSize = Math.min(remaining, 5); // Batch up to 5 concise questions to minimize round trips
    const excludeList = Array.from(seenTexts).slice(-8);
    const excludeSnippet = excludeList.length > 0
      ? ` Do not repeat these questions: ${excludeList.join(' | ')}.`
      : '';

    // Phrased as a knowledge question so MITRA routes to its knowledge/LLM engine rather than task creation
    const prompt = `What are ${batchSize} concise ${difficulty}-difficulty multiple choice assessment question${batchSize > 1 ? 's' : ''} for ${field_of_study}${education_level ? ` (${education_level} level)` : ''} covering ${topicText} in category "${resolvedCategory}"?${excludeSnippet} Keep question_text to 1-2 sentences (no multi-line code blocks), each option under 12 words, and explanation to 1 short sentence. Format your answer strictly as a JSON array where each object has keys: "question_text", "options" (4 strings starting with "A) ", "B) ", "C) ", "D) "), "correct_answer" (exact matching option string), "explanation", "vedic_connection" (1 short sentence), and "modern_application" (1 short sentence).`;

    const { content: rawResponse, providerUsed, modelUsed } = await callLLMWithMeta([
      {
        role: 'system',
        content: 'You are an expert curriculum educator. Output ONLY a raw valid JSON array of MCQ objects without markdown tags.'
      },
      {
        role: 'user',
        content: prompt
      }
    ], 3500);

    lastProviderUsed = providerUsed;
    lastModelUsed = modelUsed;

    const questions = parseQuestionsJson(rawResponse);
    for (const q of questions) {
      if (collected.length >= targetCount) break;
      const qText = String(q?.question_text || q?.question || q?.text || '').trim();
      if (!qText) continue;
      const normKey = qText.toLowerCase();
      if (seenTexts.has(normKey)) continue;

      const opts = Array.isArray(q.options) ? q.options.map(o => String(o).trim()).filter(Boolean) : [];
      if (opts.length < 2) continue;

      seenTexts.add(normKey);
      collected.push({
        question_id: `ai_${domainSlug || 'gen'}_${Date.now()}_${collected.length}_${Math.random().toString(36).slice(2, 6)}`,
        category: resolvedCategory,
        difficulty: normalizedDiff,
        question_text: qText,
        options: opts,
        correct_answer: resolveCorrectAnswer(q.correct_answer || q.answer, opts),
        explanation: String(q.explanation || '').trim(),
        vedic_connection: String(q.vedic_connection || '').trim(),
        modern_application: String(q.modern_application || '').trim(),
        target_domains: domainsList,
        tags: [field_of_study, resolvedCategory, ...(education_level ? [`level_${education_level}`] : [])].filter(Boolean),
        is_active: true,
        is_ai_generated: true,
        created_by: providerUsed === 'mitra' ? 'mitra' : (providerUsed === 'uniguru_mitra' ? 'uniguru_mitra' : 'ai')
      });
    }
  }

  if (saveToBank && collected.length > 0) {
    await Question.insertMany(collected, { ordered: false }).catch((err) => {
      console.warn('Partial insert warning while saving AI questions:', err.message);
    });
  }

  return {
    questions: collected,
    providerUsed: lastProviderUsed,
    modelUsed: lastModelUsed
  };
};

/**
 * Generate questions strictly aligned with student's field of study
 */
export const generateQuestionsAI = async (req, res) => {
  try {
    const {
      field_of_study = 'STEM',
      category = '',
      difficulty = 'medium',
      count = 5,
      topics = [],
      education_level = '',
      exclude_questions = [],
      target_domains = [],
      saveToBank = false
    } = req.body;

    const { questions, providerUsed, modelUsed } = await generateFieldQuestionsInternal({
      field_of_study,
      category,
      difficulty,
      count: Math.min(20, Math.max(1, Number(count) || 5)),
      topics: Array.isArray(topics) ? topics : String(topics || '').split(',').map(t => t.trim()).filter(Boolean),
      education_level,
      exclude_questions,
      target_domains,
      saveToBank: Boolean(saveToBank)
    });

    res.json({
      success: true,
      field_of_study,
      category: category || field_of_study,
      provider_used: providerUsed,
      model_used: modelUsed,
      saved_to_bank: Boolean(saveToBank),
      count: questions.length,
      data: questions
    });
  } catch (error) {
    console.error('generateQuestionsAI error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const cleanCategoryLabel = (rawCat, fallbackCategory, fieldOfStudy) => {
  let cat = String(rawCat || fallbackCategory || fieldOfStudy || 'General')
    .replace(/\s*:\s*\d+\s*$/g, '')
    .trim();
  if (!cat || /^\d+$/.test(cat)) {
    cat = String(fallbackCategory || fieldOfStudy || 'General').trim();
  }
  return cat;
};

/**
 * Normalize a raw parsed MCQ object into the canonical question schema
 */
const normalizeStreamedQuestion = (q, index, fallbackCategory, defaultDifficulty, fieldOfStudy, educationLevel, domainsList, providerUsed) => {
  const qText = String(q?.question_text || q?.question || q?.text || '').trim();
  if (!qText) return null;
  const opts = Array.isArray(q?.options) ? q.options.map(o => String(o).trim()).filter(Boolean) : [];
  if (opts.length < 2) return null;

  const rawDiff = String(q?.difficulty || defaultDifficulty || 'medium').toLowerCase();
  const normalizedDiff = ['easy', 'medium', 'hard'].includes(rawDiff) ? rawDiff : 'medium';
  const resolvedCat = cleanCategoryLabel(q?.category, fallbackCategory, fieldOfStudy);
  const domainSlug = String(fieldOfStudy || 'gen').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

  return {
    question_id: `ai_${domainSlug || 'gen'}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
    category: resolvedCat,
    difficulty: normalizedDiff,
    type: 'multiple_choice',
    question_text: qText,
    options: opts,
    correct_answer: resolveCorrectAnswer(q?.correct_answer || q?.correctAnswer || q?.answer, opts),
    explanation: String(q?.explanation || '').trim(),
    vedic_connection: String(q?.vedic_connection || '').trim(),
    modern_application: String(q?.modern_application || '').trim(),
    target_domains: domainsList,
    tags: [fieldOfStudy, resolvedCat, ...(educationLevel ? [`level_${educationLevel}`] : [])].filter(Boolean),
    points: 10,
    time_limit_seconds: 180,
    is_active: true,
    is_ai_generated: true,
    created_by: providerUsed === 'mitra' ? 'mitra' : (providerUsed === 'groq' ? 'groq_ai' : 'ai')
  };
};

/**
 * In-memory MITRA pre-warm queue keyed by user + field/distribution (TTL 30m).
 * Lets MITRA generate full assessments in the background on Intake/Dashboard so
 * /assignment serves 100% MITRA-generated questions in < 1s.
 */
const prewarmedAssessments = new Map();
const PREWARM_TTL_MS = 30 * 60 * 1000;

const buildPrewarmKey = ({ user_id = 'anon', field_of_study = 'STEM', category_targets = {}, total_questions = 10 }) => {
  const uid = String(user_id || 'anon').trim() || 'anon';
  const field = String(field_of_study || 'STEM').toLowerCase().trim();
  const dist = Object.entries(category_targets || {})
    .filter(([, c]) => Number(c) > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join(',');
  return `${uid}::${field}::${total_questions}::${dist}`;
};

const cleanupExpiredPrewarms = () => {
  const now = Date.now();
  for (const [k, entry] of prewarmedAssessments.entries()) {
    if (now - entry.createdAt > PREWARM_TTL_MS) {
      prewarmedAssessments.delete(k);
    }
  }
};

const findPrewarmMatch = (params) => {
  cleanupExpiredPrewarms();
  const exactKey = buildPrewarmKey(params);
  if (prewarmedAssessments.has(exactKey)) {
    return { key: exactKey, entry: prewarmedAssessments.get(exactKey) };
  }
  return null;
};

const startBackgroundMitraPrewarm = async (params = {}) => {
  cleanupExpiredPrewarms();
  const settings = (await AISetting.findOne({ key: 'global_ai_toggle' })) || {};
  if (settings.enabled === false) return null;

  const key = buildPrewarmKey(params);
  const uid = String(params.user_id || '').trim();
  if (uid && uid !== 'anon') {
    for (const oldKey of prewarmedAssessments.keys()) {
      if (oldKey.startsWith(`${uid}::`) && oldKey !== key) {
        prewarmedAssessments.delete(oldKey);
      }
    }
  }
  const existing = prewarmedAssessments.get(key);
  if (existing && (existing.status === 'generating' || (existing.status === 'ready' && existing.questions.length > 0))) {
    return existing;
  }

  const targetCount = Math.min(20, Math.max(1, Number(params.total_questions) || 10));
  const field_of_study = params.field_of_study || 'STEM';
  const education_level = params.education_level || '';
  const targetEntries = Object.entries(params.category_targets || {}).filter(([, c]) => Number(c) > 0);
  const defaultCategory = targetEntries[0]?.[0] || field_of_study || 'General';
  const domainSlug = String(field_of_study).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const domainsList = Array.isArray(params.target_domains) && params.target_domains.length > 0
    ? params.target_domains
    : (domainSlug ? [domainSlug] : []);

  // Expand targetEntries into flat category slots and chunk by 2 (keeps MITRA under output token cap)
  const slotCategories = [];
  for (const [cat, rawC] of targetEntries) {
    const countNum = Math.max(0, Number(rawC) || 0);
    for (let i = 0; i < countNum; i++) slotCategories.push(cat);
  }
  while (slotCategories.length < targetCount) {
    slotCategories.push(defaultCategory);
  }

  const buildChunks = (catsList) => {
    const chunks = [];
    for (let i = 0; i < catsList.length; i += 2) {
      const slice = catsList.slice(i, i + 2);
      const countsMap = {};
      slice.forEach((c) => { countsMap[c] = (countsMap[c] || 0) + 1; });
      chunks.push({
        count: slice.length,
        distText: Object.entries(countsMap).map(([c, n]) => `${c}: ${n}`).join(', ')
      });
    }
    return chunks;
  };

  const entry = {
    status: 'generating',
    questions: [],
    providerUsed: 'mitra',
    modelUsed: (settings.model && settings.model !== 'uniguru-mitra-v1') ? settings.model : DEFAULT_MITRA_MODEL,
    createdAt: Date.now(),
    params,
    promise: null
  };

  const seenSet = new Set();

  const CATEGORY_TOPIC_ANGLES = {
    mathematics: [
      'algebra, linear and quadratic equations (easy)',
      'probability, permutations, and combinatorics (medium)',
      'calculus, derivatives, and integrals (medium)',
      'geometry, trigonometry, and coordinate geometry (easy)',
      'number theory, ratios, percentages, and sequences (easy)',
      'matrices, determinants, and vectors (hard)'
    ],
    logic: [
      'deductive syllogisms and categorical reasoning (easy)',
      'number, letter, and pattern sequences (easy)',
      'propositional logic and truth tables (medium)',
      'analytical seating and ordering puzzles (medium)',
      'conditional inference and logical fallacies (hard)'
    ],
    language: [
      'grammar, syntax, and sentence correction (easy)',
      'vocabulary, synonyms, antonyms, and usage (easy)',
      'comprehension inference and main idea (medium)',
      'rhetoric, tone, and clarity in writing (medium)'
    ],
    culture: [
      'Indian cultural heritage, festivals, and classical arts (easy)',
      'architecture, literature, and historical traditions (medium)',
      'world civilizations and cultural contributions (medium)'
    ],
    'vedic knowledge': [
      'Vedas, Upanishads, and foundational Sanskrit concepts (easy)',
      'Vedic mathematics sutras and ancient Indian astronomy (medium)',
      'Yoga philosophy, Ayurveda, and ethical frameworks (medium)'
    ],
    'current affairs': [
      'recent science, space, and global technology milestones (easy)',
      'economic trends and international organizations (medium)',
      'climate, renewable energy, and governance updates (medium)'
    ],
    coding: [
      'fundamental programming syntax and data types (easy)',
      'practical problem solving and code behavior (medium)',
      'debugging, edge cases, and error handling (medium)',
      'system design, optimization, and performance (hard)',
      'APIs, async workflows, and state management (medium)',
      'security, reliability, and engineering best practices (hard)'
    ]
  };

  const getCategoryTopicAngle = (catLabel, batchIndex) => {
    const key = String(catLabel || '').toLowerCase().trim();
    const matchedKey = Object.keys(CATEGORY_TOPIC_ANGLES).find((k) => key.includes(k));
    const list = CATEGORY_TOPIC_ANGLES[matchedKey || 'coding'];
    return list[batchIndex % list.length];
  };

  const isPureAcademicCategory = (catLabel) => {
    const key = String(catLabel || '').toLowerCase().trim();
    return ['math', 'logic', 'language', 'culture', 'vedic', 'current'].some((w) => key.includes(w));
  };

  const runBatch = async (batchCount, distText, batchIndex) => {
    if (batchCount <= 0) return [];
    const cleanCatsText = String(distText || defaultCategory).replace(/\s*:\s*\d+/g, '').trim() || defaultCategory;
    const angle = getCategoryTopicAngle(cleanCatsText, batchIndex);
    const excludeList = Array.from(seenSet).slice(-6);
    const excludeHint = excludeList.length > 0 ? ` Do not repeat: ${excludeList.join(' | ')}.` : '';
    const audienceText = isPureAcademicCategory(cleanCatsText)
      ? `${education_level ? `${education_level} ` : ''}student. Ask purely about ${cleanCatsText} (do NOT ask HTML, CSS, web frameworks, or programming trivia)`
      : `${field_of_study}${education_level ? ` (${education_level})` : ''} student${params.skills ? ` skilled in ${params.skills}` : ''}`;

    const prompt = `What are ${batchCount} concise multiple choice ${cleanCatsText} assessment questions for a ${audienceText}, focusing specifically on ${angle}?${excludeHint} Keep question_text under 20 words, each of the 4 options under 8 words, and explanation under 15 words. Set "category" strictly to "${cleanCatsText}". Format strictly as a raw JSON array with keys: "category", "difficulty" ("easy"|"medium"|"hard"), "question_text", "options" (4 strings), "correct_answer", "explanation", "vedic_connection".`;
    const { content, providerUsed, modelUsed } = await callLLMWithMeta([
      { role: 'system', content: 'You are an expert curriculum educator. Output ONLY a raw valid JSON array of MCQ objects.' },
      { role: 'user', content: prompt }
    ], 2200, { mitraTimeoutMs: 35000 });
    entry.providerUsed = providerUsed;
    entry.modelUsed = modelUsed;
    const parsed = parseQuestionsJson(content);
    const out = [];
    parsed.forEach((rawQ, idx) => {
      const q = normalizeStreamedQuestion(rawQ, batchIndex * 10 + idx, cleanCatsText, 'medium', field_of_study, education_level, domainsList, providerUsed);
      if (q) {
        const norm = q.question_text.toLowerCase();
        if (!seenSet.has(norm) && entry.questions.length < targetCount) {
          seenSet.add(norm);
          out.push(q);
          entry.questions.push(q);
        }
      }
    });
    if (out.length > 0) {
      Question.insertMany(out, { ordered: false }).catch(() => {});
    }
    return out;
  };

  entry.promise = (async () => {
    try {
      // Request 2 extra 2-question buffer chunks with distinct focus angles
      // so 2 parallel waves reliably cache all 10/10 unique MITRA questions.
      const paddedSlots = [
        ...slotCategories.slice(0, targetCount),
        slotCategories[0] || defaultCategory,
        slotCategories[1] || defaultCategory,
        slotCategories[2] || defaultCategory,
        slotCategories[3] || defaultCategory
      ];
      const initialChunks = buildChunks(paddedSlots);
      for (let w = 0; w < initialChunks.length && entry.questions.length < targetCount; w += 2) {
        const wave = initialChunks.slice(w, w + 2);
        await Promise.allSettled(
          wave.map((ch, idx) => runBatch(ch.count, ch.distText, w + idx))
        );
      }

      // Extra safety waves if any batch returned fewer items
      for (let retry = 0; retry < 2 && entry.questions.length < targetCount; retry++) {
        const deficit = targetCount - entry.questions.length;
        const missingCats = slotCategories.slice(0, deficit);
        const retryChunks = buildChunks(missingCats);
        await Promise.allSettled(
          retryChunks.slice(0, 2).map((ch, idx) => runBatch(ch.count, ch.distText, 20 + retry * 5 + idx))
        );
      }

      entry.questions = entry.questions.slice(0, targetCount);
      entry.status = entry.questions.length > 0 ? 'ready' : 'failed';
      if (entry.questions.length > 0) {
        console.log(`🔥 Background MITRA pre-warm ready [${entry.providerUsed}/${entry.modelUsed}]: ${entry.questions.length}/${targetCount} questions cached for ${key}`);
      }
    } catch (err) {
      entry.status = entry.questions.length > 0 ? 'ready' : 'failed';
      console.warn('Background MITRA pre-warm error:', err.message);
    }
    return entry;
  })();

  prewarmedAssessments.set(key, entry);
  return entry;
};

/**
 * Trigger background MITRA question generation while student is on Dashboard/Intake
 */
export const prewarmAssessmentAI = async (req, res) => {
  try {
    const body = req.body || {};
    const entry = await startBackgroundMitraPrewarm(body);
    res.status(202).json({
      success: true,
      status: entry?.status || 'skipped',
      cached_count: entry?.questions?.length || 0
    });
  } catch (error) {
    res.status(200).json({ success: false, status: 'error', error: error.message });
  }
};

/**
 * Fast SSE streaming assessment generator (< 5s SLA):
 * Serves pre-warmed MITRA questions instantaneously (< 0.2s) if ready, awaits an in-flight
 * pre-warm briefly, or falls back seamlessly to MITRA fast race + Groq streaming.
 */
export const generateAssessmentStreamAI = async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  let clientClosed = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientClosed = true;
    }
  });

  const sendEvent = (event, payload) => {
    if (clientClosed || res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const {
      user_id = '',
      field_of_study = 'STEM',
      education_level = '',
      skills = '',
      category_targets = {},
      total_questions = 10,
      target_domains = [],
      mitra_budget_ms = 1100
    } = req.body || {};

    const targetCount = Math.min(20, Math.max(1, Number(total_questions) || 10));
    const domainSlug = String(field_of_study).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const domainsList = Array.isArray(target_domains) && target_domains.length > 0
      ? target_domains
      : (domainSlug ? [domainSlug] : []);

    const targetEntries = Object.entries(category_targets || {}).filter(([, c]) => Number(c) > 0);
    const defaultCategory = targetEntries[0]?.[0] || field_of_study || 'General';
    const distributionText = targetEntries.length > 0
      ? targetEntries.map(([cat, c]) => `${cat} (${c} questions)`).join(', ')
      : `${defaultCategory} (${targetCount} questions)`;

    const hasOnlyAcademicCats = targetEntries.length > 0 && targetEntries.every(([cat]) =>
      ['math', 'logic', 'language', 'culture', 'vedic', 'current'].some((w) => cat.toLowerCase().includes(w))
    );
    const studentProfileLine = hasOnlyAcademicCats
      ? `${education_level ? `${education_level} ` : ''}student. Every question MUST strictly test its labeled academic category (e.g., Mathematics = pure math/quantitative problems, NOT HTML/programming)`
      : `${field_of_study}${education_level ? ` (${education_level})` : ''} student${skills ? ` with skills in ${skills}` : ''}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert curriculum educator. Output ONLY a raw valid JSON array of MCQ objects. No markdown fences, no commentary.'
      },
      {
        role: 'user',
        content: `Generate exactly ${targetCount} concise multiple-choice assessment questions for a ${studentProfileLine}, distributed strictly as: ${distributionText}. Set each question's "category" to its exact category name without counts. Keep question_text to 1 short sentence, each of the 4 options under 10 words, and explanation to 1 short sentence. Each JSON object must have keys: "category", "difficulty" ("easy"|"medium"|"hard"), "question_text", "options" (4 strings), "correct_answer" (exact string from options), "explanation", "vedic_connection" (short phrase).`
      }
    ];

    const collected = [];
    const seenKeys = new Set();
    let providerUsed = 'mitra';
    let modelUsed = DEFAULT_MITRA_MODEL;

    const emitNewParsed = (parsedList, currentProvider) => {
      const strictSingleCategory = targetEntries.length === 1 ? defaultCategory : null;
      for (const rawQ of parsedList) {
        if (collected.length >= targetCount) break;
        const normalized = normalizeStreamedQuestion(
          strictSingleCategory ? { ...rawQ, category: strictSingleCategory } : rawQ,
          collected.length,
          defaultCategory,
          'medium',
          field_of_study,
          education_level,
          domainsList,
          currentProvider
        );
        if (!normalized) continue;
        const key = normalized.question_text.toLowerCase();
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        collected.push(normalized);

        const progress = Math.min(95, 45 + Math.round((collected.length / targetCount) * 50));
        sendEvent('question', {
          index: collected.length - 1,
          count: collected.length,
          total: targetCount,
          progress,
          message: `Generated question ${collected.length} of ${targetCount}...`,
          question: normalized
        });
      }
    };

    // 0) Consume pre-warmed MITRA assessment if available (instant < 0.2s)
    const prewarmMatch = findPrewarmMatch({ user_id, field_of_study, category_targets, total_questions: targetCount });
    if (prewarmMatch) {
      const { key: matchKey, entry: prewarmEntry } = prewarmMatch;
      if (prewarmEntry.status === 'generating' && prewarmEntry.promise) {
        sendEvent('status', { progress: 38, message: 'Finalizing pre-generated MITRA questions...' });
        await Promise.race([prewarmEntry.promise, new Promise((r) => setTimeout(r, 2000))]);
      }
      if (prewarmEntry.questions && prewarmEntry.questions.length > 0) {
        if (prewarmEntry.status === 'ready') {
          prewarmedAssessments.delete(matchKey); // One-time consumption
        }
        providerUsed = prewarmEntry.providerUsed || 'mitra';
        modelUsed = prewarmEntry.modelUsed || DEFAULT_MITRA_MODEL;
        sendEvent('status', {
          progress: 42,
          message: `Loaded pre-generated ${providerUsed.toUpperCase()} questions...`
        });
        emitNewParsed(prewarmEntry.questions, providerUsed);
      }
    }

    const settings = (await AISetting.findOne({ key: 'global_ai_toggle' })) || {};

    // 0.5) Pure MITRA MongoDB Pool Top-Up (instant < 0.05s) — strict category match
    if (collected.length < targetCount && settings.provider !== 'groq_only') {
      try {
        const targetCatNames = targetEntries.map(([c]) => c);
        const mitraPool = await Question.find({
          is_active: true,
          created_by: { $in: ['mitra', 'uniguru_mitra'] },
          ...(targetCatNames.length > 0
            ? { category: { $in: targetCatNames.map((c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) } }
            : {})
        })
          .sort({ createdAt: -1 })
          .limit(120)
          .lean();

        if (mitraPool.length > 0) {
          const isValidForCategory = (q) => {
            const cat = String(q.category || '').toLowerCase();
            if (cat.includes('math') && /\b(html|css|react|dom|javascript|python|http|array|binary tree|mern)\b/i.test(String(q.question_text || ''))) {
              return false;
            }
            return true;
          };

          const validPool = mitraPool.filter(isValidForCategory);
          const domainMatches = validPool.filter(
            (q) => Array.isArray(q.target_domains) && q.target_domains.some((d) => domainsList.includes(d))
          );
          const ranked = [...domainMatches, ...validPool];
          const neededNow = targetCount - collected.length;
          const picked = [];
          const pickedIds = new Set();
          for (const candidate of ranked) {
            if (picked.length >= neededNow) break;
            const cid = String(candidate._id || candidate.question_id || '');
            const cText = String(candidate.question_text || '').toLowerCase().trim();
            if (!cText || seenKeys.has(cText) || (cid && pickedIds.has(cid))) continue;
            if (cid) pickedIds.add(cid);
            picked.push(candidate);
          }
          if (picked.length > 0) {
            providerUsed = 'mitra';
            modelUsed = DEFAULT_MITRA_MODEL;
            emitNewParsed(picked, 'mitra');
          }
        }
      } catch (dbErr) {
        console.warn('MITRA DB top-up lookup failed:', dbErr.message);
      }
    }

    const rawEndpoint = settings.metadata?.uniguru_endpoint || process.env.MITRA_API_URL || process.env.UNIGURU_API_URL || DEFAULT_MITRA_ENDPOINT;
    const endpoint = normalizeMitraEndpoint(rawEndpoint);
    const manualApiKey = (settings.metadata?.uniguru_api_key || process.env.MITRA_API_KEY || process.env.UNIGURU_API_KEY || '').trim();
    const mitraModel = (settings.model && settings.model !== 'uniguru-mitra-v1') ? settings.model : DEFAULT_MITRA_MODEL;

    // 1) Try MITRA first within strict SLA budget if pre-warm didn't already satisfy all questions
    if (collected.length < targetCount && settings.provider !== 'groq_only') {
      sendEvent('status', { progress: 35, message: 'Contacting MITRA AI...' });
      const mitraController = new AbortController();
      const mitraTimer = setTimeout(() => mitraController.abort(), Math.min(2000, Math.max(800, Number(mitra_budget_ms) || 1300)));

      try {
        const baseUrl = getMitraBaseUrl(endpoint);
        let token = manualApiKey;
        let userId = 'usr_abhiruchi_backend';

        if (!token) {
          if (cachedMitraAuth.token && cachedMitraAuth.baseUrl === baseUrl && Date.now() - cachedMitraAuth.fetchedAt < MITRA_TOKEN_TTL_MS) {
            token = cachedMitraAuth.token;
            userId = cachedMitraAuth.userId;
          } else {
            const authRes = await fetch(`${baseUrl}/api/auth/guest`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
              signal: mitraController.signal
            });
            if (authRes.ok) {
              const authData = await authRes.json();
              if (authData?.access_token) {
                cachedMitraAuth = {
                  token: authData.access_token,
                  userId: authData.user?.id || authData.user?.user_id || 'usr_abhiruchi_backend',
                  baseUrl,
                  fetchedAt: Date.now()
                };
                token = cachedMitraAuth.token;
                userId = cachedMitraAuth.userId;
              }
            }
          }
        }

        if (token && !mitraController.signal.aborted) {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              message: formatMessagesAsMitraPrompt(messages),
              user_id: userId,
              platform: 'api',
              model: mitraModel
            }),
            signal: mitraController.signal
          });

          if (response.ok) {
            const data = await response.json();
            const content = extractLLMContent(data);
            if (content && data.intent !== 'ems') {
              const parsed = parseQuestionsJson(content);
              if (parsed.length > 0) {
                providerUsed = 'mitra';
                modelUsed = mitraModel;
                emitNewParsed(parsed, 'mitra');
              }
            }
          }
        }
      } catch (err) {
        console.log(`⚡ MITRA fast-SLA skipped (${err.name === 'AbortError' ? 'exceeded fast budget' : err.message}); streaming Groq fallback...`);
      } finally {
        clearTimeout(mitraTimer);
      }
    }

    // 2) Fast Groq Streaming Fallback if MITRA did not complete within budget
    if (collected.length < targetCount && process.env.GROQ_API_KEY) {
      const remainingNeeded = targetCount - collected.length;
      const groqModels = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];
      sendEvent('status', {
        progress: Math.max(42, 45 + Math.round((collected.length / targetCount) * 50)),
        message: 'Streaming personalized AI questions...'
      });

      const seenPreview = Array.from(seenKeys).slice(-6);
      const excludeStreamHint = seenPreview.length > 0 ? ` Do not repeat: ${seenPreview.join(' | ')}.` : '';
      const streamMessages = collected.length > 0
        ? [
            messages[0],
            {
              role: 'user',
              content: `Generate ${remainingNeeded} more concise MCQ questions for a ${studentProfileLine}, in category: ${distributionText}.${excludeStreamHint} Set "category" strictly to the category name without counts. Output ONLY raw JSON array with keys: "category", "difficulty", "question_text", "options" (4 strings), "correct_answer", "explanation", "vedic_connection".`
            }
          ]
        : messages;

      for (const groqModel of groqModels) {
        if (collected.length >= targetCount || clientClosed) break;
        const groqController = new AbortController();
        const groqTimer = setTimeout(() => groqController.abort(), 3500);

        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`
            },
            body: JSON.stringify({
              model: groqModel,
              reasoning_effort: 'low',
              stream: true,
              max_tokens: 2600,
              temperature: 0.7,
              messages: streamMessages
            }),
            signal: groqController.signal
          });

          if (!groqRes.ok || !groqRes.body) {
            clearTimeout(groqTimer);
            continue;
          }

          providerUsed = 'groq';
          modelUsed = groqModel;

          const reader = groqRes.body.getReader();
          const decoder = new TextDecoder();
          let sseBuffer = '';
          let contentBuffer = '';
          let lastParsedCount = 0;

          while (!clientClosed && collected.length < targetCount) {
            const { value, done } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });

            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (!payload || payload === '[DONE]') continue;

              try {
                const chunk = JSON.parse(payload);
                const delta = chunk?.choices?.[0]?.delta?.content;
                if (delta) {
                  contentBuffer += delta;
                }
              } catch {
                // Ignore partial SSE chunk JSON
              }
            }

            if (contentBuffer.includes('}')) {
              const objs = extractCompleteJsonObjects(stripOuterCodeFence(contentBuffer));
              if (objs.length > lastParsedCount) {
                const fresh = objs.slice(lastParsedCount);
                lastParsedCount = objs.length;
                emitNewParsed(fresh, 'groq');
              }
            }
          }

          // Final flush parse in case last object completed on stream end
          if (contentBuffer && collected.length < targetCount) {
            const finalObjs = parseQuestionsJson(contentBuffer);
            if (finalObjs.length > lastParsedCount) {
              emitNewParsed(finalObjs.slice(lastParsedCount), 'groq');
            }
          }

          clearTimeout(groqTimer);
          if (collected.length > 0) break;
        } catch (streamErr) {
          clearTimeout(groqTimer);
          console.warn(`Groq stream [${groqModel}] fallback error:`, streamErr.message);
        }
      }
    }

    sendEvent('done', {
      progress: 100,
      count: collected.length,
      provider_used: providerUsed,
      model_used: modelUsed,
      prewarmed: Boolean(prewarmMatch && prewarmMatch.entry?.questions?.length > 0),
      questions: collected
    });
    if (!res.writableEnded) res.end();

    // Replenish next MITRA assessment silently in the background for future attempts/retakes
    startBackgroundMitraPrewarm({
      user_id,
      field_of_study,
      education_level,
      category_targets,
      total_questions: targetCount,
      target_domains: domainsList
    }).catch(() => {});
  } catch (error) {
    console.error('generateAssessmentStreamAI error:', error);
    sendEvent('error', { error: error.message });
    if (!res.writableEnded) res.end();
  }
};

/**
 * Evaluate a student's individual answer + explanation using Uniguru / Mitra
 */
export const evaluateResponseAI = async (req, res) => {
  try {
    const { question_text, user_answer, user_explanation, correct_answer } = req.body;
    const isCorrect = String(user_answer || '').trim() === String(correct_answer || '').trim();

    const prompt = `
Evaluate this student response and return ONLY valid JSON:
QUESTION: ${question_text}
CORRECT ANSWER: ${correct_answer}
STUDENT ANSWER: ${user_answer}
STUDENT EXPLANATION: ${user_explanation || 'No explanation provided'}

Scoring (0-10 each):
- accuracy_score: correctness of the selected answer
- explanation_score: depth and quality of student's explanation
- reasoning_score: clarity of logical thinking

Return ONLY raw JSON:
{
  "accuracy_score": number,
  "explanation_score": number,
  "reasoning_score": number,
  "feedback": "Constructive 1-2 sentence feedback",
  "suggestions": "Specific next-step learning suggestion"
}`;

    try {
      const { content, providerUsed, modelUsed } = await callLLMWithMeta([
        { role: 'system', content: 'You are Uniguru / Mitra, an expert educational evaluator. Return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ], 600);

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({
          success: true,
          provider_used: providerUsed,
          model_used: modelUsed,
          data: {
            accuracy_score: Number(parsed.accuracy_score ?? (isCorrect ? 10 : 0)),
            explanation_score: Number(parsed.explanation_score ?? (user_explanation?.length > 15 ? 6 : 2)),
            reasoning_score: Number(parsed.reasoning_score ?? (isCorrect ? 7 : 3)),
            feedback: parsed.feedback || (isCorrect ? 'Correct answer!' : 'Review the core concept.'),
            suggestions: parsed.suggestions || ''
          }
        });
      }
    } catch (err) {
      console.warn('evaluateResponseAI LLM fallback:', err.message);
    }

    res.json({
      success: true,
      provider_used: 'rule_fallback',
      data: {
        accuracy_score: isCorrect ? 10 : 0,
        explanation_score: user_explanation && user_explanation.trim().length > 20 ? 7 : 3,
        reasoning_score: isCorrect ? 8 : 3,
        feedback: isCorrect ? 'Accurate selection.' : `Expected answer: ${correct_answer}.`,
        suggestions: 'Practice explaining the underlying principle in your own words.'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Generate student assessment feedback (fast, educational plain text without SAMACHAR/news hijack)
 */
export const generateAIFeedback = async (req, res) => {
  try {
    const { studentName, score, totalQuestions, domains, strengths, weakAreas, field_of_study } = req.body;
    const cleanDomains = (Array.isArray(domains) ? domains : [])
      .map((d) => String(d || '').replace(/\s*:\s*\d+\s*$/g, '').trim())
      .filter(Boolean);

    const prompt = `Give concise, encouraging student mentor feedback in 3 short plain-text sentences (no markdown headers, no bullet lists, no hashtags) for ${studentName || 'Student'}, a ${field_of_study || 'STEM'} student who scored ${score} out of ${totalQuestions} across ${cleanDomains.join(', ') || 'Technical Skills'}. Mention one strength (${strengths?.join(', ') || 'effort'}) and one practical next study step (${weakAreas?.join(', ') || 'core fundamentals'}).`;

    const stripMarkdown = (text) =>
      String(text || '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/^>\s*/gm, '')
        .replace(/\s+/g, ' ')
        .trim();

    try {
      const { content, providerUsed, modelUsed } = await callLLMWithMeta([
        { role: 'system', content: 'You are an encouraging academic mentor. Respond in 3 plain-text sentences without markdown symbols.' },
        { role: 'user', content: prompt }
      ], 350, { mitraTimeoutMs: 3500 });

      const cleaned = stripMarkdown(content);
      if (cleaned && !/SAMACHAR|Verified News Intelligence|Fact Check Engine/i.test(cleaned)) {
        return res.json({ success: true, provider_used: providerUsed, model_used: modelUsed, feedback: cleaned });
      }
    } catch {
      // Fall through to clean personalized summary
    }

    res.json({
      success: true,
      provider_used: 'template_fallback',
      feedback: `Great effort, ${studentName || 'Student'}! You scored ${score}/${totalQuestions} across ${cleanDomains.join(', ') || 'your selected subjects'}. Focus next on reviewing core concepts and writing concise step-by-step explanations for each answer.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Test AI model connectivity (Uniguru / Mitra or Groq)
 */
export const testAIConnection = async (req, res) => {
  try {
    const { content, providerUsed, modelUsed } = await callLLMWithMeta([
      { role: 'user', content: 'Reply with: "Uniguru/Mitra AI connection verified successfully." in 1 short sentence.' }
    ], 100);

    res.json({
      success: true,
      provider_used: providerUsed,
      model_used: modelUsed,
      message: `[${providerUsed} / ${modelUsed}] ${content.trim()}`
    });
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
        provider: 'uniguru_mitra',
        model: DEFAULT_MITRA_MODEL,
        metadata: {
          uniguru_endpoint: DEFAULT_MITRA_ENDPOINT,
          uniguru_model: DEFAULT_MITRA_MODEL
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
    if (model !== undefined && String(model).trim().length >= 2) {
      updateObj.model = String(model).trim();
    }
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
