import Question from '../models/Question.js';

export const getQuestions = async (req, res) => {
  try {
    const { category, difficulty, domain, limit = 50 } = req.query;
    const filter = { is_active: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (domain) filter.target_domains = { $in: [domain] };

    const questions = await Question.find(filter).limit(Number(limit));
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

    const domainCount = domains.length;
    const questionsPerDomain = Math.max(1, Math.floor(Number(totalQuestions) / domainCount));
    
    let allQuestions = [];
    for (const domainId of domains) {
      const qSet = await Question.find({
        is_active: true,
        target_domains: { $in: [domainId] }
      }).limit(questionsPerDomain * 2);
      
      allQuestions.push(...qSet);
    }

    // Shuffle and slice to requested count
    const shuffled = allQuestions.sort(() => 0.5 - Math.random()).slice(0, Number(totalQuestions));

    res.json({
      success: true,
      data: shuffled,
      metadata: {
        totalRequested: totalQuestions,
        domainsSelected: domains,
        countReturned: shuffled.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createQuestion = async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json({ success: true, data: newQuestion });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const updated = await Question.findOneAndUpdate(
      { question_id: req.params.id },
      req.body,
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    await Question.findOneAndUpdate({ question_id: req.params.id }, { is_active: false });
    res.json({ success: true, message: 'Question deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
