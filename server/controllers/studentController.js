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

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    // Find student by _id or user_id or email
    const student = await Student.findOne({
      $or: [
        ...(isObjectId ? [{ _id: id }] : []),
        { user_id: id },
        { email: id.toLowerCase() }
      ]
    });

    const studentUserId = student?.user_id;
    const studentEmail = student?.email;

    // Delete Student record
    if (student) {
      await Student.deleteOne({ _id: student._id });
    } else if (isObjectId) {
      await Student.deleteOne({ _id: id });
    }

    // Delete matching User record
    if (studentUserId && /^[0-9a-fA-F]{24}$/.test(studentUserId)) {
      await User.deleteOne({ _id: studentUserId });
    } else if (isObjectId) {
      await User.deleteOne({ _id: id });
    }
    
    if (studentEmail) {
      await User.deleteOne({ email: studentEmail.toLowerCase() });
    }

    res.json({ success: true, message: 'Student and associated user account deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cleanupDummyStudents = async (req, res) => {
  try {
    const { userIds, emails, deleteTestKeywords = false } = req.body;
    let deletedCount = 0;

    // Specific user IDs or emails
    if (Array.isArray(userIds) && userIds.length > 0) {
      const sRes = await Student.deleteMany({ user_id: { $in: userIds } });
      const uRes = await User.deleteMany({ _id: { $in: userIds } });
      deletedCount += (sRes.deletedCount + uRes.deletedCount);
    }

    if (Array.isArray(emails) && emails.length > 0) {
      const lowerEmails = emails.map(e => e.toLowerCase());
      const sRes = await Student.deleteMany({ email: { $in: lowerEmails } });
      const uRes = await User.deleteMany({ email: { $in: lowerEmails } });
      deletedCount += (sRes.deletedCount + uRes.deletedCount);
    }

    // Keyword purge: test, dummy, etc.
    if (deleteTestKeywords) {
      const testRegex = /(test|dummy|example|sample|student@gurukul\.com)/i;
      const testUsers = await User.find({
        role: { $ne: 'admin' }, // protect admin
        $or: [
          { email: testRegex },
          { full_name: testRegex }
        ]
      });

      const idsToDelete = testUsers.map(u => u._id);
      const emailsToDelete = testUsers.map(u => u.email.toLowerCase());

      const sRes = await Student.deleteMany({
        $or: [
          { user_id: { $in: idsToDelete.map(id => id.toString()) } },
          { email: { $in: emailsToDelete } }
        ]
      });
      const uRes = await User.deleteMany({ _id: { $in: idsToDelete } });
      deletedCount += (sRes.deletedCount + uRes.deletedCount);
    }

    res.json({ success: true, message: `Successfully purged ${deletedCount} records` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
