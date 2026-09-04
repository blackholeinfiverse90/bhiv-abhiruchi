import Student from '../models/Student.js';
import User from '../models/User.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find({});
    const users = await User.find({ role: 'student' });

    const combinedMap = new Map();

    users.forEach(u => {
      const emailKey = (u.email || '').toLowerCase();
      combinedMap.set(emailKey, {
        id: u._id,
        user_id: u._id.toString(),
        name: u.full_name,
        email: u.email,
        student_id: u._id.toString().substring(0, 8),
        grade: u.field_of_study || 'STEM',
        tier: 'Seed',
        created_at: u.createdAt || new Date()
      });
    });

    students.forEach(s => {
      const emailKey = (s.email || '').toLowerCase();
      const existing = combinedMap.get(emailKey) || {};
      combinedMap.set(emailKey || s.user_id, {
        ...existing,
        id: s._id || existing.id,
        user_id: s.user_id || existing.user_id,
        name: s.full_name || existing.name,
        email: s.email || existing.email,
        student_id: s._id?.toString().substring(0, 8) || existing.student_id,
        grade: s.field_of_study || existing.grade || 'STEM',
        tier: existing.tier || 'Seed',
        responses: s.intake_data || {},
        created_at: s.createdAt || existing.created_at || new Date()
      });
    });

    const result = Array.from(combinedMap.values());
    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveStudentIntake = async (req, res) => {
  try {
    const { user_id, email, full_name, field_of_study, selected_domains, intake_data } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const updatedStudent = await Student.findOneAndUpdate(
      { user_id },
      {
        email,
        full_name,
        field_of_study,
        selected_domains: selected_domains || [],
        intake_data: intake_data || {}
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.params.userId });
    if (!student) {
      // Return default profile structure for new users who haven't completed intake yet
      return res.json({
        success: true,
        data: {
          user_id: req.params.userId,
          field_of_study: 'stem',
          selected_domains: [],
          intake_data: {}
        }
      });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const saveAssessmentResult = async (req, res) => {
  try {
    const { user_id, assessment_id, score, total_questions, domains, results } = req.body;

    let student = await Student.findOne({ user_id });
    if (!student) {
      student = await Student.create({
        user_id,
        email: req.user?.email || '',
        full_name: req.user?.full_name || 'Student',
        assessment_history: []
      });
    }

    student.assessment_history.push({
      assessment_id,
      score,
      total_questions,
      domains: domains || [],
      results: results || {},
      completed_at: new Date()
    });

    await student.save();
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllAttempts = async (req, res) => {
  try {
    const students = await Student.find({ 'assessment_history.0': { $exists: true } });
    const attempts = [];

    students.forEach(s => {
      (s.assessment_history || []).forEach(ah => {
        attempts.push({
          id: ah._id || `att_${Date.now()}_${Math.random()}`,
          user_id: s.user_id,
          user_email: s.email,
          students: {
            name: s.full_name || 'Student',
            email: s.email,
            student_id: s.user_id ? s.user_id.substring(0, 8) : 'STU1001'
          },
          total_score: ah.score,
          max_score: (ah.total_questions || 10) * 10,
          percentage: ah.results?.percentage || Math.round((ah.score / ((ah.total_questions || 10) * 10)) * 100),
          grade: ah.results?.grade || 'N/A',
          completed_at: ah.completed_at || new Date(),
          student_field: (ah.domains || [])[0] || s.field_of_study || 'STEM',
          time_taken_seconds: ah.results?.time_taken_seconds || 120,
          overall_feedback: ah.results?.overall_feedback || '',
          strengths: ah.results?.strengths || [],
          improvement_areas: ah.results?.improvement_areas || [],
          evaluated_responses: ah.results?.evaluated_responses || []
        });
      });
    });

    attempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    res.json({ success: true, count: attempts.length, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
