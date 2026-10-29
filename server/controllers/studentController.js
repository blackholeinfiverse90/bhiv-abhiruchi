import crypto from 'crypto';
import Student from '../models/Student.js';
import User from '../models/User.js';

export const getAllStudents = async (req, res) => {
  try {
    const { all = 'false' } = req.query;

    // Filter to ONLY return students who have actually submitted the intake form
    const query = all === 'true'
      ? {}
      : {
          $or: [
            { 'intake_data.field_of_study': { $exists: true } },
            { 'intake_data.class_level': { $exists: true } },
            { 'intake_data.phone': { $exists: true } },
            { 'intake_data.availability_per_week_hours': { $exists: true } },
            { 'intake_data.candidate_id': { $exists: true } }
          ]
        };

    const students = await Student.find(query).sort({ updatedAt: -1, createdAt: -1 });

    const result = students.map(s => ({
      id: s._id,
      user_id: s.user_id || s._id.toString(),
      candidate_id: s.candidate_id || null,
      institute_code: s.institute_code || null,
      name: s.full_name || 'Student',
      email: s.email || '',
      student_id: s.candidate_id || null,
      grade: s.field_of_study || s.intake_data?.field_of_study || 'STEM',
      tier: 'Seed',
      responses: s.intake_data || {},
      created_at: s.createdAt || new Date()
    }));

    // Sort: Whoever has updated/selected their institute appears at the TOP
    result.sort((a, b) => {
      const aHas = Boolean(a.institute_code || a.candidate_id);
      const bHas = Boolean(b.institute_code || b.candidate_id);
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const APPROVED_INSTITUTES = ['MSSU', 'DYP-A', 'SIT-S', 'SIPS-S', 'VJTI'];

const normalizeInstituteCode = (code) => {
  if (!code) return null;
  const upper = String(code).trim().toUpperCase();
  if (upper === 'RTMSSU') return 'MSSU';
  return APPROVED_INSTITUTES.includes(upper) ? upper : null;
};

export const saveStudentIntake = async (req, res) => {
  try {
    const { user_id, email, full_name, field_of_study, selected_domains, intake_data, institute_code, cohort_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    // Look for existing student record
    let existingStudent = await Student.findOne({ user_id });

    // Canonical Enrolment Rule: First time ONLY edit, then permanently locked
    let normInstitute = null;
    let candidate_id = existingStudent?.candidate_id;

    if (existingStudent?.institute_code && existingStudent?.candidate_id) {
      // Locked: Already enrolled with canonical institute and candidate ID
      normInstitute = existingStudent.institute_code;
      candidate_id = existingStudent.candidate_id;
    } else {
      // First time enrollment
      const rawInst = institute_code || intake_data?.institute_code;
      normInstitute = normalizeInstituteCode(rawInst);
      if (!normInstitute) {
        return res.status(400).json({ 
          success: false, 
          error: 'Please select one of the 5 approved institutes (MSSU, DYP-A, SIT-S, SIPS-S, VJTI) to complete enrollment.' 
        });
      }

      // Mint canonical candidate_id for the first time
      const count = await Student.countDocuments({ 
        institute_code: normInstitute, 
        candidate_id: { $exists: true, $ne: null } 
      });
      candidate_id = `BHIV-2026-${normInstitute}-${String(count + 1).padStart(4, '0')}`;
    }

    // Standard RFC 4122 UUIDv4 trace_id
    const trace_id = crypto.randomUUID(); // Standard RFC 4122 UUIDv4

    const updatedStudent = await Student.findOneAndUpdate(
      { user_id },
      {
        candidate_id,
        institute_code: normInstitute,
        cohort_id: cohort_id || 'COHORT-2026-OCT-A',
        trace_id,
        enrolment_status: 'VERIFIED',
        lifecycle_status: 'ENROLLED_ACTIVE',
        email,
        full_name,
        field_of_study: field_of_study || 'stem',
        selected_domains: selected_domains || [],
        intake_data: {
          ...intake_data,
          institute_code: normInstitute,
          candidate_id,
          trace_id
        }
      },
      { new: true, upsert: true }
    );

    // Form Sampada canonical handoff payload (compliant with Sampada AbhiruchiIntakeRequest schema)
    const sampadaHandoffPayload = {
      source_system: 'abhiruchi',
      source_reference: updatedStudent._id.toString(),
      canonical_candidate_id: candidate_id,
      candidate_id,
      abhiruchi_record_id: updatedStudent._id.toString(),
      institute_code: normInstitute,
      cohort_id: updatedStudent.cohort_id || 'COHORT-2026-OCT-A',
      email,
      trace_id,
      lifecycle_status: updatedStudent.lifecycle_status || 'ENROLLED_ACTIVE',
      schema_version: '1.0',
      occurred_at: new Date().toISOString(),
      candidate: {
        name: full_name,
        email,
        email_verified: true,
        phone: intake_data?.phone || null,
        degree: intake_data?.degree || null,
        intake_responses: intake_data || {}
      }
    };

    // Auto-forward to Sampada webhook if configured
    if (process.env.SAMPADA_API_URL) {
      try {
        const sampadaUrl = process.env.SAMPADA_API_URL;
        const apiKey = process.env.SAMPADA_API_KEY || process.env.API_KEY_SECRET || '';
        fetch(sampadaUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'X-API-Key': apiKey, 'Authorization': `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify(sampadaHandoffPayload)
        }).then(r => r.json()).then(res => {
          console.log('✅ Sampada intake handoff accepted:', res.status || 'OK');
        }).catch(err => {
          console.warn('⚠️ Sampada intake webhook warning:', err.message);
        });
      } catch (e) {
        console.warn('⚠️ Sampada webhook dispatch error:', e.message);
      }
    }

    res.json({
      success: true,
      candidate_id,
      institute_code: normInstitute,
      trace_id,
      data: updatedStudent,
      sampada_handoff: sampadaHandoffPayload
    });
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


export const exportStudentsData = async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const students = await Student.find({
      $or: [
        { 'intake_data.field_of_study': { $exists: true } },
        { 'intake_data.class_level': { $exists: true } },
        { 'intake_data.phone': { $exists: true } },
        { 'intake_data.availability_per_week_hours': { $exists: true } },
        { 'intake_data.candidate_id': { $exists: true } }
      ]
    }).sort({ createdAt: -1 });

    if (format === 'csv') {
      const headers = ['Candidate ID', 'Full Name', 'Email', 'Institute Code', 'Field of Study', 'Enrolment Status', 'Created At'];
      const rows = students.map(s => [
        `"${s.candidate_id || ''}"`,
        `"${(s.full_name || '').replace(/"/g, '""')}"`,
        `"${(s.email || '').replace(/"/g, '""')}"`,
        `"${s.institute_code || 'MSSU'}"`,
        `"${s.field_of_study || 'STEM'}"`,
        `"${s.enrolment_status || 'VERIFIED'}"`,
        `"${s.createdAt ? s.createdAt.toISOString() : ''}"`
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="abhiruchi_candidates_export.csv"');
      return res.send(csvContent);
    }

    // Default canonical JSON format for Sampada handoff
    const payload = {
      source_system: 'abhiruchi',
      schema_version: '1.0.0',
      total_records: students.length,
      exported_at: new Date().toISOString(),
      candidates: students.map(s => ({
        candidate_id: s.candidate_id,
        abhiruchi_record_id: s._id,
        name: s.full_name,
        email: s.email,
        email_verified: true,
        institute_code: s.institute_code || 'MSSU',
        cohort_id: s.cohort_id || 'COHORT-2026-OCT-A',
        field_of_study: s.field_of_study,
        enrolment_status: s.enrolment_status,
        lifecycle_status: s.lifecycle_status,
        intake_responses: s.intake_data || {},
        submitted_at: s.createdAt
      }))
    };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const backfillCandidateIds = async (req, res) => {
  try {
    const studentsWithoutId = await Student.find({
      $or: [
        { candidate_id: { $exists: false } },
        { candidate_id: null },
        { candidate_id: '' }
      ]
    }).sort({ createdAt: 1 });

    let existingCount = await Student.countDocuments({ candidate_id: { $exists: true, $ne: null } });
    let updated = 0;

    for (const student of studentsWithoutId) {
      existingCount++;
      const inst = student.institute_code || 'MSSU';
      const candidate_id = `BHIV-2026-${inst}-${String(existingCount).padStart(4, '0')}`;
      const trace_id = crypto.randomUUID();

      student.candidate_id = candidate_id;
      student.institute_code = inst;
      student.cohort_id = student.cohort_id || 'COHORT-2026-OCT-A';
      student.trace_id = student.trace_id || trace_id;
      student.enrolment_status = student.enrolment_status || 'VERIFIED';
      student.lifecycle_status = student.lifecycle_status || 'ENROLLED_ACTIVE';
      await student.save();
      updated++;
    }

    res.json({
      success: true,
      message: `Successfully minted canonical candidate IDs for ${updated} students`,
      updated,
      total_with_id: existingCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
