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
      cohort_id: s.cohort_id || 'COHORT-2026-OCT-A',
      trace_id: s.trace_id || null,
      enrolment_status: s.enrolment_status || 'PENDING',
      lifecycle_status: s.lifecycle_status || 'ENROLLED_ACTIVE',
      name: s.full_name || 'Student',
      email: s.email || '',
      student_id: s.candidate_id || null,
      grade: s.field_of_study || s.intake_data?.field_of_study || 'STEM',
      field_of_study: s.field_of_study || s.intake_data?.field_of_study || 'STEM',
      selected_domains: s.selected_domains || [],
      tier: 'Seed',
      responses: s.intake_data || {},
      assessment_history: s.assessment_history || [],
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

const DUMMY_ACCOUNT_REGEX = /(test|dummy|example\.com|sample|fake|temp|demo\.com|@probe\.local|@pentest\.local|student@gurukul\.com)/i;
const PROTECTED_ADMIN_EMAIL = 'admin@gurukul.com';

const findDummyRecords = async () => {
  const [users, students] = await Promise.all([
    User.find({ email: { $ne: PROTECTED_ADMIN_EMAIL } }).select('-password'),
    Student.find({ email: { $ne: PROTECTED_ADMIN_EMAIL } })
  ]);

  const candidatesMap = new Map();

  for (const u of users) {
    const email = (u.email || '').toLowerCase();
    const name = u.full_name || '';
    if (DUMMY_ACCOUNT_REGEX.test(email) || DUMMY_ACCOUNT_REGEX.test(name)) {
      const key = email || `user_${u._id}`;
      candidatesMap.set(key, {
        key,
        userId: u._id.toString(),
        studentId: null,
        name: name || 'User',
        email: u.email || '',
        role: u.role || 'student',
        candidate_id: null,
        hasAssessment: Array.isArray(u.assessment_history) && u.assessment_history.length > 0,
        reason: DUMMY_ACCOUNT_REGEX.test(email) ? 'Test/probe email pattern' : 'Test/dummy name pattern',
        created_at: u.createdAt
      });
    }
  }

  for (const s of students) {
    const email = (s.email || '').toLowerCase();
    const name = s.full_name || '';
    const isPatternMatch = DUMMY_ACCOUNT_REGEX.test(email) || DUMMY_ACCOUNT_REGEX.test(name);
    const isOrphanEmpty = !email && (!name || name === 'Student') && !s.candidate_id && (!s.assessment_history || s.assessment_history.length === 0);

    if (isPatternMatch || isOrphanEmpty) {
      const key = email || `student_${s._id}`;
      const existing = candidatesMap.get(key);
      if (existing) {
        existing.studentId = s._id.toString();
        existing.candidate_id = s.candidate_id || existing.candidate_id;
        existing.hasAssessment = existing.hasAssessment || (Array.isArray(s.assessment_history) && s.assessment_history.length > 0);
      } else {
        candidatesMap.set(key, {
          key,
          userId: s.user_id || null,
          studentId: s._id.toString(),
          name: name || 'Student',
          email: s.email || '',
          role: 'student',
          candidate_id: s.candidate_id || null,
          hasAssessment: Array.isArray(s.assessment_history) && s.assessment_history.length > 0,
          reason: isOrphanEmpty ? 'Empty placeholder record (no email/intake)' : 'Test/probe pattern in student record',
          created_at: s.createdAt
        });
      }
    }
  }

  return Array.from(candidatesMap.values());
};

export const getDummyCandidates = async (req, res) => {
  try {
    const candidates = await findDummyRecords();
    res.json({ success: true, count: candidates.length, data: candidates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const cleanupDummyStudents = async (req, res) => {
  try {
    const { studentIds = [], userIds = [], emails = [], deleteTestKeywords = false, dryRun = false } = req.body;

    if (dryRun) {
      const candidates = await findDummyRecords();
      return res.json({ success: true, dryRun: true, count: candidates.length, data: candidates });
    }

    let deletedStudents = 0;
    let deletedUsers = 0;

    // 1. Delete by explicit Student._id list
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const validStudentObjIds = studentIds.filter(id => /^[0-9a-fA-F]{24}$/.test(String(id)));
      if (validStudentObjIds.length > 0) {
        const matchedStudents = await Student.find({
          _id: { $in: validStudentObjIds },
          email: { $ne: PROTECTED_ADMIN_EMAIL }
        });
        const linkedUserIds = matchedStudents
          .map(s => s.user_id)
          .filter(id => id && /^[0-9a-fA-F]{24}$/.test(String(id)));
        const linkedEmails = matchedStudents
          .map(s => (s.email || '').toLowerCase())
          .filter(e => e && e !== PROTECTED_ADMIN_EMAIL);

        const sRes = await Student.deleteMany({ _id: { $in: validStudentObjIds }, email: { $ne: PROTECTED_ADMIN_EMAIL } });
        deletedStudents += sRes.deletedCount;

        if (linkedUserIds.length > 0 || linkedEmails.length > 0) {
          const uRes = await User.deleteMany({
            email: { $ne: PROTECTED_ADMIN_EMAIL },
            $or: [
              ...(linkedUserIds.length > 0 ? [{ _id: { $in: linkedUserIds } }] : []),
              ...(linkedEmails.length > 0 ? [{ email: { $in: linkedEmails } }] : [])
            ]
          });
          deletedUsers += uRes.deletedCount;
        }
      }
    }

    // 2. Delete by userIds (supports both ObjectId and string user_id)
    if (Array.isArray(userIds) && userIds.length > 0) {
      const strIds = userIds.map(String).filter(Boolean);
      const objIds = strIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id));
      const sRes = await Student.deleteMany({
        email: { $ne: PROTECTED_ADMIN_EMAIL },
        $or: [
          { user_id: { $in: strIds } },
          ...(objIds.length > 0 ? [{ _id: { $in: objIds } }] : [])
        ]
      });
      deletedStudents += sRes.deletedCount;

      if (objIds.length > 0) {
        const uRes = await User.deleteMany({ _id: { $in: objIds }, email: { $ne: PROTECTED_ADMIN_EMAIL } });
        deletedUsers += uRes.deletedCount;
      }
    }

    // 3. Delete by emails
    if (Array.isArray(emails) && emails.length > 0) {
      const lowerEmails = emails
        .map(e => String(e).toLowerCase().trim())
        .filter(e => e && e !== PROTECTED_ADMIN_EMAIL);
      if (lowerEmails.length > 0) {
        const sRes = await Student.deleteMany({ email: { $in: lowerEmails } });
        const uRes = await User.deleteMany({ email: { $in: lowerEmails } });
        deletedStudents += sRes.deletedCount;
        deletedUsers += uRes.deletedCount;
      }
    }

    // 4. Keyword purge across both User and Student collections
    if (deleteTestKeywords) {
      const candidates = await findDummyRecords();
      const sIds = candidates.map(c => c.studentId).filter(id => id && /^[0-9a-fA-F]{24}$/.test(id));
      const uIds = candidates.map(c => c.userId).filter(id => id && /^[0-9a-fA-F]{24}$/.test(id));
      const cEmails = candidates.map(c => (c.email || '').toLowerCase()).filter(e => e && e !== PROTECTED_ADMIN_EMAIL);

      if (sIds.length > 0 || cEmails.length > 0) {
        const sRes = await Student.deleteMany({
          email: { $ne: PROTECTED_ADMIN_EMAIL },
          $or: [
            ...(sIds.length > 0 ? [{ _id: { $in: sIds } }] : []),
            ...(cEmails.length > 0 ? [{ email: { $in: cEmails } }] : [])
          ]
        });
        deletedStudents += sRes.deletedCount;
      }
      if (uIds.length > 0 || cEmails.length > 0) {
        const uRes = await User.deleteMany({
          email: { $ne: PROTECTED_ADMIN_EMAIL },
          $or: [
            ...(uIds.length > 0 ? [{ _id: { $in: uIds } }] : []),
            ...(cEmails.length > 0 ? [{ email: { $in: cEmails } }] : [])
          ]
        });
        deletedUsers += uRes.deletedCount;
      }
    }

    const totalDeleted = deletedStudents + deletedUsers;
    res.json({
      success: true,
      deletedStudents,
      deletedUsers,
      message: `Successfully purged ${deletedStudents} student records and ${deletedUsers} user accounts (${totalDeleted} total)`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const exportStudentsData = async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const includeAll = req.query.all === 'true';
    const query = includeAll
      ? {}
      : {
          $or: [
            { 'intake_data.field_of_study': { $exists: true } },
            { 'intake_data.class_level': { $exists: true } },
            { 'intake_data.phone': { $exists: true } },
            { 'intake_data.availability_per_week_hours': { $exists: true } },
            { 'intake_data.candidate_id': { $exists: true } },
            { 'assessment_history.0': { $exists: true } }
          ]
        };

    const students = await Student.find(query).sort({ createdAt: -1 });

    if (format === 'csv') {
      const dynamicKeys = new Set();
      students.forEach(s => {
        if (s.intake_data && typeof s.intake_data === 'object') {
          Object.keys(s.intake_data).forEach(k => dynamicKeys.add(k));
        }
      });
      const sortedIntakeKeys = Array.from(dynamicKeys).sort();

      const baseHeaders = [
        'Candidate ID',
        'Full Name',
        'Email',
        'Institute Code',
        'Cohort ID',
        'Field of Study',
        'Selected Domains',
        'Enrolment Status',
        'Lifecycle Status',
        'Attempts Count',
        'Latest Score',
        'Latest Percentage',
        'Latest Grade',
        'Created At'
      ];
      const headers = [...baseHeaders, ...sortedIntakeKeys.map(k => `intake_${k}`)];
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const fmtVal = (v) => (Array.isArray(v) ? v.join('; ') : (v && typeof v === 'object' ? JSON.stringify(v) : (v ?? '')));

      const rows = students.map(s => {
        const history = Array.isArray(s.assessment_history) ? s.assessment_history : [];
        const latest = history[history.length - 1] || null;
        const latestPct = latest
          ? (latest.results?.percentage ?? Math.round((latest.score / ((latest.total_questions || 10) * 10)) * 100))
          : '';
        const baseCols = [
          esc(s.candidate_id || ''),
          esc(s.full_name || ''),
          esc(s.email || ''),
          esc(s.institute_code || ''),
          esc(s.cohort_id || 'COHORT-2026-OCT-A'),
          esc(s.field_of_study || ''),
          esc((s.selected_domains || []).join('; ')),
          esc(s.enrolment_status || ''),
          esc(s.lifecycle_status || ''),
          esc(history.length),
          esc(latest?.score ?? ''),
          esc(latestPct),
          esc(latest?.results?.grade || ''),
          esc(s.createdAt ? s.createdAt.toISOString() : '')
        ];
        const intakeCols = sortedIntakeKeys.map(k => esc(fmtVal(s.intake_data?.[k])));
        return [...baseCols, ...intakeCols].join(',');
      });

      const csvContent = '\uFEFF' + [headers.map(esc).join(','), ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="abhiruchi_complete_export.csv"');
      return res.send(csvContent);
    }

    // Default canonical JSON format including all intake & assessment inputs
    const payload = {
      source_system: 'abhiruchi',
      schema_version: '1.1.0',
      total_records: students.length,
      exported_at: new Date().toISOString(),
      candidates: students.map(s => ({
        candidate_id: s.candidate_id,
        abhiruchi_record_id: s._id,
        user_id: s.user_id,
        name: s.full_name,
        email: s.email,
        email_verified: true,
        institute_code: s.institute_code || null,
        cohort_id: s.cohort_id || 'COHORT-2026-OCT-A',
        trace_id: s.trace_id || null,
        field_of_study: s.field_of_study,
        selected_domains: s.selected_domains || [],
        enrolment_status: s.enrolment_status,
        lifecycle_status: s.lifecycle_status,
        intake_responses: s.intake_data || {},
        assessment_history: s.assessment_history || [],
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
