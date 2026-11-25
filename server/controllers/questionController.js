import Question from '../models/Question.js';
import AISetting from '../models/AISetting.js';
import StudyField from '../models/StudyField.js';
import { generateFieldQuestionsInternal } from './aiController.js';

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildQuestionFilter = (id) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(id));
  return isObjectId ? { $or: [{ question_id: id }, { _id: id }] } : { question_id: id };
};

const normalizeQuestionPayload = (q, index = 0) => {
  const difficulty = String(q.difficulty || 'medium').toLowerCase();
  const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium';
  const options = Array.isArray(q.options) ? q.options.map((o) => String(o).trim()).filter(Boolean) : [];
  return {
    ...q,
    question_id: q.question_id || q.id || `q_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    category: String(q.category || 'General').trim(),
    difficulty: validDifficulty,
    question_text: String(q.question_text || q.question || '').trim(),
    options,
    correct_answer: String(q.correct_answer || q.answer || options[0] || '').trim(),
    explanation: String(q.explanation || '').trim(),
    vedic_connection: String(q.vedic_connection || '').trim(),
    modern_application: String(q.modern_application || '').trim(),
    target_domains: Array.isArray(q.target_domains) ? q.target_domains.filter(Boolean) : [],
    tags: Array.isArray(q.tags) ? q.tags.filter(Boolean) : [],
    is_active: q.is_active !== false
  };
};

export const getQuestions = async (req, res) => {
  try {
    const { category, difficulty, domain, search, limit, include_inactive } = req.query;
    const filter = include_inactive === 'true' ? {} : { is_active: true };

    if (category) {
      const categoryRegexStr = escapeRegex(String(category)).replace(/[_\s]+/g, '[_\\s]+');
      filter.$or = [
        { category: new RegExp(`^${categoryRegexStr}$`, 'i') },
        { category_id: category }
      ];
    }
    if (difficulty) {
      filter.difficulty = new RegExp(`^${escapeRegex(difficulty)}$`, 'i');
    }
    if (domain) {
      filter.target_domains = { $in: [domain] };
    }
    if (search) {
      const searchRegex = new RegExp(escapeRegex(String(search).trim()), 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { question_text: searchRegex },
          { category: searchRegex },
          { explanation: searchRegex }
        ]
      });
    }

    let query = Question.find(filter).sort({ createdAt: -1 });
    if (limit && limit !== 'all') {
      const numLimit = Number(limit);
      if (!Number.isNaN(numLimit) && numLimit > 0) {
        query = query.limit(numLimit);
      }
    }

    const questions = await query;
    res.json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMultiDomainQuestions = async (req, res) => {
  try {
    const { domains, totalQuestions = 10 } = req.body;
    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ success: false, error: 'Valid domains array required' });
    }

    const targetTotal = Math.max(1, Number(totalQuestions) || 10);
    const domainCount = domains.length;
    const questionsPerDomain = Math.max(1, Math.ceil(targetTotal / domainCount));
    
    let allQuestions = [];
    const seenIds = new Set();
    const seenTexts = [];
    const domainCounts = {};

    for (const domainId of domains) {
      const qSet = await Question.find({
        is_active: true,
        target_domains: { $in: [domainId] }
      }).limit(questionsPerDomain * 2);
      
      domainCounts[domainId] = 0;
      for (const q of qSet) {
        const key = q.question_id || q._id.toString();
        if (!seenIds.has(key)) {
          seenIds.add(key);
          seenTexts.push(q.question_text);
          allQuestions.push(q);
          domainCounts[domainId]++;
        }
      }
    }

    // If DB has fewer questions than requested and AI is enabled, top up with Uniguru/Mitra LLM
    let aiGeneratedCount = 0;
    if (allQuestions.length < targetTotal) {
      const aiSettings = await AISetting.findOne({ key: 'global_ai_toggle' });
      const aiEnabled = aiSettings ? aiSettings.enabled !== false : true;

      if (aiEnabled) {
        const fieldDocs = await StudyField.find({ field_id: { $in: domains } });
        const fieldNameMap = new Map(fieldDocs.map(f => [f.field_id, f.name]));
        const neededTotal = targetTotal - allQuestions.length;
        const perNeedDomain = Math.max(1, Math.ceil(neededTotal / domainCount));

        for (const domainId of domains) {
          if (allQuestions.length >= targetTotal) break;
          const remaining = targetTotal - allQuestions.length;
          const toGen = Math.min(remaining, perNeedDomain);
          const fieldName = fieldNameMap.get(domainId) || domainId.replace(/_/g, ' ');
          try {
            const { questions: generated } = await generateFieldQuestionsInternal({
              field_of_study: fieldName,
              category: fieldName,
              difficulty: 'medium',
              count: toGen,
              target_domains: [domainId],
              exclude_questions: seenTexts,
              saveToBank: true
            });
            for (const gq of generated) {
              if (!seenIds.has(gq.question_id)) {
                seenIds.add(gq.question_id);
                seenTexts.push(gq.question_text);
                allQuestions.push(gq);
                aiGeneratedCount++;
              }
            }
          } catch (aiErr) {
            console.warn(`AI top-up failed for domain ${domainId}:`, aiErr.message);
          }
        }
      }
    }

    // Shuffle and slice to requested count
    const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, targetTotal);

    res.json({
      success: true,
      data: shuffled,
      metadata: {
        totalRequested: targetTotal,
        domainsSelected: domains,
        aiGeneratedCount,
        countReturned: shuffled.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const docs = req.body
        .map((q, idx) => normalizeQuestionPayload(q, idx))
        .filter((q) => q.question_text && q.options.length > 0);
      if (docs.length === 0) {
        return res.status(400).json({ success: false, error: 'No valid questions provided' });
      }
      const inserted = await Question.insertMany(docs, { ordered: false });
      return res.status(201).json({ success: true, count: inserted.length, data: inserted });
    }
    const body = normalizeQuestionPayload(req.body);
    if (!body.question_text) {
      return res.status(400).json({ success: false, error: 'question_text is required' });
    }
    const newQuestion = new Question(body);
    await newQuestion.save();
    res.status(201).json({ success: true, data: newQuestion });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = buildQuestionFilter(id);
    const { _id, ...updates } = req.body;

    if (updates.difficulty) {
      const d = String(updates.difficulty).toLowerCase();
      if (['easy', 'medium', 'hard'].includes(d)) updates.difficulty = d;
    }

    const updated = await Question.findOneAndUpdate(
      filter,
      updates,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = buildQuestionFilter(id);

    if (req.query.permanent === 'true') {
      const result = await Question.deleteOne(filter);
      if (result.deletedCount === 0) {
        return res.status(404).json({ success: false, error: 'Question not found' });
      }
      return res.json({ success: true, message: 'Question permanently deleted' });
    }

    const updated = await Question.findOneAndUpdate(filter, { is_active: false }, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, message: 'Question deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
