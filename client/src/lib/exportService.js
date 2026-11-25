/**
 * Data Transport & Export Service for BHIV Gurukul Abhiruchi System
 * Supports direct-download PDF (jsPDF), Excel (.xlsx), Dynamic CSV, and JSON
 * for all received student intake inputs and assessment responses.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const downloadBlob = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

const formatValue = (val) => {
  if (val === null || val === undefined || val === '') return '';
  if (Array.isArray(val)) return val.map(v => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join('; ');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const formatLabel = (key) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const safeSlug = (str) =>
  String(str || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'export';

export const ExportService = {
  /**
   * Export ALL student records & every dynamic intake input received to CSV
   */
  exportStudentsToCSV(students = [], attempts = []) {
    if (!students || students.length === 0) {
      throw new Error('No student data available to export');
    }

    const attemptsByUser = new Map();
    (attempts || []).forEach(a => {
      const k = a.user_id || a.user_email;
      if (!k) return;
      if (!attemptsByUser.has(k)) attemptsByUser.set(k, []);
      attemptsByUser.get(k).push(a);
    });

    // Discover every unique key across all intake responses
    const dynamicKeySet = new Set();
    const priorityKeys = [
      'phone',
      'age',
      'education_level',
      'class_level',
      'field_of_study',
      'current_skills',
      'interests',
      'goals',
      'preferred_learning_style',
      'availability_per_week_hours',
      'experience_years'
    ];
    priorityKeys.forEach(k => dynamicKeySet.add(k));
    students.forEach(s => {
      const resp = s.responses || s.intake_data || {};
      if (resp && typeof resp === 'object') {
        Object.keys(resp).forEach(k => {
          if (!['candidate_id', 'institute_code', 'trace_id'].includes(k)) {
            dynamicKeySet.add(k);
          }
        });
      }
    });
    const dynamicKeys = Array.from(dynamicKeySet);

    const headers = [
      'Candidate ID',
      'Name',
      'Email',
      'Institute Code',
      'Cohort ID',
      'Enrolment Status',
      'Field of Study',
      'Selected Domains',
      'Assessments Taken',
      'Latest Score',
      'Latest Percentage (%)',
      'Latest Grade',
      ...dynamicKeys.map(formatLabel),
      'Created At'
    ];

    const rows = students.map(s => {
      const resp = s.responses || s.intake_data || {};
      const studentAttempts =
        (Array.isArray(s.assessment_history) && s.assessment_history.length > 0
          ? s.assessment_history
          : attemptsByUser.get(s.user_id) || attemptsByUser.get(s.email) || []);
      const latest = studentAttempts[studentAttempts.length - 1] || null;
      const latestScore = latest ? (latest.total_score ?? latest.score ?? '') : '';
      const latestPct = latest
        ? (latest.percentage ?? latest.results?.percentage ?? (latest.score !== undefined ? Math.round((latest.score / ((latest.total_questions || 10) * 10)) * 100) : ''))
        : '';
      const latestGrade = latest ? (latest.grade ?? latest.results?.grade ?? '') : '';

      return [
        escapeCSV(s.candidate_id || s.student_id || ''),
        escapeCSV(s.name || s.full_name || resp.name || ''),
        escapeCSV(s.email || resp.email || ''),
        escapeCSV(s.institute_code || ''),
        escapeCSV(s.cohort_id || ''),
        escapeCSV(s.enrolment_status || ''),
        escapeCSV(s.field_of_study || s.grade || resp.field_of_study || ''),
        escapeCSV(formatValue(s.selected_domains || resp.selected_domains || [])),
        escapeCSV(studentAttempts.length),
        escapeCSV(latestScore),
        escapeCSV(latestPct),
        escapeCSV(latestGrade),
        ...dynamicKeys.map(k => escapeCSV(formatValue(resp[k] ?? s[k]))),
        escapeCSV(s.created_at ? new Date(s.created_at).toISOString() : '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(csvContent, `abhiruchi_all_inputs_${timestamp}.csv`, 'text/csv;charset=utf-8;');
  },

  /**
   * Export assessment attempts and scores to CSV
   */
  exportAttemptsToCSV(attempts = []) {
    if (!attempts || attempts.length === 0) {
      throw new Error('No assessment attempts available to export');
    }

    const headers = [
      'Student Name',
      'Email',
      'Student ID',
      'Domain / Field',
      'Score',
      'Max Score',
      'Percentage (%)',
      'Grade',
      'Time Taken (Sec)',
      'Strengths',
      'Improvement Areas',
      'Overall Feedback',
      'Completed At'
    ];

    const rows = attempts.map(a => [
      escapeCSV(a.students?.name || a.name || 'Student'),
      escapeCSV(a.students?.email || a.user_email || ''),
      escapeCSV(a.students?.student_id || ''),
      escapeCSV(a.student_field || 'STEM'),
      escapeCSV(a.total_score ?? 0),
      escapeCSV(a.max_score ?? 100),
      escapeCSV(a.percentage ?? 0),
      escapeCSV(a.grade || 'N/A'),
      escapeCSV(a.time_taken_seconds || 0),
      escapeCSV(Array.isArray(a.strengths) ? a.strengths.join('; ') : a.strengths || ''),
      escapeCSV(Array.isArray(a.improvement_areas) ? a.improvement_areas.join('; ') : a.improvement_areas || ''),
      escapeCSV(a.overall_feedback || ''),
      escapeCSV(a.completed_at ? new Date(a.completed_at).toLocaleString() : '')
    ].join(','));

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(csvContent, `abhiruchi_assessment_results_${timestamp}.csv`, 'text/csv;charset=utf-8;');
  },

  /**
   * Export multi-sheet Excel workbook (.xlsx) with ALL received intake inputs, attempts & question responses
   */
  exportAllToExcel(students = [], attempts = [], filename = 'abhiruchi_complete_transport') {
    if ((!students || students.length === 0) && (!attempts || attempts.length === 0)) {
      throw new Error('No data available to export to Excel');
    }

    const wb = XLSX.utils.book_new();

    // Sheet 1: Students & All Dynamic Intake Inputs
    if (students.length > 0) {
      const intakeRows = students.map(s => {
        const resp = s.responses || s.intake_data || {};
        const flat = {
          'Candidate ID': s.candidate_id || s.student_id || '',
          'Full Name': s.name || s.full_name || resp.name || '',
          'Email': s.email || resp.email || '',
          'Institute Code': s.institute_code || '',
          'Cohort ID': s.cohort_id || '',
          'Field of Study': s.field_of_study || s.grade || resp.field_of_study || '',
          'Selected Domains': formatValue(s.selected_domains || []),
          'Enrolment Status': s.enrolment_status || '',
          'Assessments Taken': Array.isArray(s.assessment_history) ? s.assessment_history.length : 0,
          'Submitted At': s.created_at ? new Date(s.created_at).toLocaleString() : ''
        };
        Object.entries(resp).forEach(([k, v]) => {
          const colName = formatLabel(k);
          if (!(colName in flat)) {
            flat[colName] = formatValue(v);
          }
        });
        return flat;
      });
      const wsIntake = XLSX.utils.json_to_sheet(intakeRows);
      XLSX.utils.book_append_sheet(wb, wsIntake, 'Students_Intake');
    }

    // Sheet 2: Assessment Attempts
    const normalizedAttempts = [...(attempts || [])];
    if (normalizedAttempts.length === 0 && students.length > 0) {
      students.forEach(s => {
        (s.assessment_history || []).forEach(ah => {
          normalizedAttempts.push({
            students: { name: s.name || s.full_name, email: s.email, student_id: s.candidate_id || s.user_id },
            student_field: (ah.domains || [])[0] || s.field_of_study || 'STEM',
            total_score: ah.score,
            max_score: (ah.total_questions || 10) * 10,
            percentage: ah.results?.percentage ?? Math.round((ah.score / ((ah.total_questions || 10) * 10)) * 100),
            grade: ah.results?.grade || 'N/A',
            time_taken_seconds: ah.results?.time_taken_seconds || 0,
            strengths: ah.results?.strengths || [],
            improvement_areas: ah.results?.improvement_areas || [],
            overall_feedback: ah.results?.overall_feedback || '',
            evaluated_responses: ah.results?.evaluated_responses || [],
            completed_at: ah.completed_at
          });
        });
      });
    }

    if (normalizedAttempts.length > 0) {
      const attemptRows = normalizedAttempts.map(a => ({
        'Student Name': a.students?.name || a.name || 'Student',
        'Email': a.students?.email || a.user_email || '',
        'Student ID': a.students?.student_id || '',
        'Domain / Field': a.student_field || 'STEM',
        'Score': a.total_score ?? 0,
        'Max Score': a.max_score ?? 100,
        'Percentage (%)': a.percentage ?? 0,
        'Grade': a.grade || 'N/A',
        'Time Taken (sec)': a.time_taken_seconds || 0,
        'Strengths': formatValue(a.strengths),
        'Improvement Areas': formatValue(a.improvement_areas),
        'AI Feedback': a.overall_feedback || '',
        'Completed At': a.completed_at ? new Date(a.completed_at).toLocaleString() : ''
      }));
      const wsAttempts = XLSX.utils.json_to_sheet(attemptRows);
      XLSX.utils.book_append_sheet(wb, wsAttempts, 'Assessment_Attempts');

      // Sheet 3: Per-Question Responses
      const responseRows = [];
      normalizedAttempts.forEach(a => {
        (a.evaluated_responses || []).forEach((r, idx) => {
          responseRows.push({
            'Student Name': a.students?.name || a.name || 'Student',
            'Email': a.students?.email || a.user_email || '',
            'Question #': idx + 1,
            'Category': r.question_category || '',
            'Question': r.question_text || '',
            'Student Answer': r.user_answer || '',
            'Student Explanation': r.user_explanation || '',
            'Correct Answer': r.correct_answer || '',
            'Is Correct': r.is_correct ? 'Yes' : 'No',
            'Score': r.total_score ?? 0,
            'Max Score': r.max_score ?? 10,
            'AI Feedback': r.ai_feedback || ''
          });
        });
      });
      if (responseRows.length > 0) {
        const wsResp = XLSX.utils.json_to_sheet(responseRows);
        XLSX.utils.book_append_sheet(wb, wsResp, 'Question_Responses');
      }
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${filename}_${timestamp}.xlsx`);
  },

  /**
   * Export complete raw data dump as JSON
   */
  exportAllToJSON(data = {}, filename = 'abhiruchi_complete_data_backup') {
    const payload = {
      source_system: 'abhiruchi',
      exported_at: new Date().toISOString(),
      ...data
    };
    const jsonString = JSON.stringify(payload, null, 2);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(jsonString, `${filename}_${timestamp}.json`, 'application/json');
  },

  /**
   * Direct-download PDF Dossier for an Individual Student (Profile + ALL Intake Inputs + Assessment Results)
   */
  exportStudentScorecardPDF(student, attempt = null) {
    if (!student) throw new Error('Student data required for PDF report');

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const resp = student.responses || student.intake_data || {};
    const studentName = student.name || student.full_name || resp.name || 'Student';
    const studentEmail = student.email || resp.email || 'N/A';
    const candidateId = student.candidate_id || student.student_id || student.id || 'N/A';

    // Header Banner
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 210, 26, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('BHIV GURUKUL ABHIRUCHI', 14, 12);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Complete Student Intake & Assessment Dossier', 14, 19);
    doc.text(`ID: ${candidateId}`, 196, 12, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 19, { align: 'right' });

    let y = 34;

    // Score Summary Box if attempt exists
    const activeAttempt = attempt || (Array.isArray(student.assessment_history) && student.assessment_history.length > 0
      ? student.assessment_history[student.assessment_history.length - 1]
      : null);

    if (activeAttempt) {
      const score = activeAttempt.total_score ?? activeAttempt.score ?? 'N/A';
      const maxScore = activeAttempt.max_score ?? ((activeAttempt.total_questions || 10) * 10);
      const pct = activeAttempt.percentage ?? activeAttempt.results?.percentage ?? (typeof score === 'number' ? Math.round((score / maxScore) * 100) : 'N/A');
      const grade = activeAttempt.grade ?? activeAttempt.results?.grade ?? 'N/A';

      doc.setFillColor(255, 247, 237);
      doc.setDrawColor(253, 186, 116);
      doc.roundedRect(14, y, 182, 20, 3, 3, 'FD');
      doc.setTextColor(234, 88, 12);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Score: ${score} / ${maxScore}`, 24, y + 12);
      doc.text(`Percentage: ${pct}%`, 90, y + 12);
      doc.text(`Grade: ${grade}`, 152, y + 12);
      y += 27;
    }

    // Section 1: Core Profile & ALL Received Intake Inputs
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Student Profile & All Intake Inputs Received', 14, y);
    y += 3;

    const intakeEntries = [
      ['Full Name', studentName],
      ['Email', studentEmail],
      ['Candidate ID', candidateId],
      ['Institute Code', student.institute_code || 'N/A'],
      ['Cohort ID', student.cohort_id || 'N/A'],
      ['Field of Study', student.field_of_study || student.grade || resp.field_of_study || 'STEM'],
      ['Selected Domains', formatValue(student.selected_domains || activeAttempt?.domains || []) || 'N/A']
    ];

    const seenKeys = new Set(['name', 'email', 'candidate_id', 'institute_code', 'field_of_study', 'selected_domains']);
    Object.entries(resp).forEach(([key, value]) => {
      if (!seenKeys.has(key) && value !== undefined && value !== null && value !== '') {
        intakeEntries.push([formatLabel(key), formatValue(value)]);
      }
    });

    autoTable(doc, {
      startY: y,
      head: [['Input Field', 'Submitted Value']],
      body: intakeEntries,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontSize: 9 },
      styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 58 } },
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 8;

    // Section 2: AI Feedback & Question Responses (if available)
    const feedback = activeAttempt?.overall_feedback || activeAttempt?.results?.overall_feedback;
    if (feedback) {
      if (y > 250) { doc.addPage(); y = 18; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('2. AI Evaluation & Mentor Feedback', 14, y);
      y += 5;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(feedback), 182);
      doc.text(lines, 14, y);
      y += lines.length * 4.5 + 6;
    }

    const evalResponses = activeAttempt?.evaluated_responses || activeAttempt?.results?.evaluated_responses || [];
    if (Array.isArray(evalResponses) && evalResponses.length > 0) {
      if (y > 240) { doc.addPage(); y = 18; }
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('3. Question-by-Question Assessment Inputs', 14, y);
      y += 3;

      autoTable(doc, {
        startY: y,
        head: [['#', 'Category', 'Student Answer', 'Explanation', 'Correct', 'Score']],
        body: evalResponses.map((r, i) => [
          i + 1,
          r.question_category || '-',
          r.user_answer || '-',
          r.user_explanation || '-',
          r.is_correct ? 'Yes' : 'No',
          `${(r.total_score ?? 0).toFixed ? r.total_score.toFixed(1) : r.total_score}/${r.max_score ?? 10}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        margin: { left: 14, right: 14 }
      });
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`abhiruchi_dossier_${safeSlug(studentName)}_${timestamp}.pdf`);
  },

  /**
   * Direct-download Complete Cohort PDF containing ALL students + ALL received intake inputs
   */
  exportAllStudentsPDF(students = [], attempts = []) {
    if (!students || students.length === 0) {
      throw new Error('No student records available to export');
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const attemptsByUser = new Map();
    (attempts || []).forEach(a => {
      const k = a.user_id || a.user_email;
      if (k) attemptsByUser.set(k, a);
    });

    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('BHIV GURUKUL ABHIRUCHI - COMPLETE CANDIDATE & INPUTS REPORT', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Students: ${students.length}   |   Generated: ${new Date().toLocaleString()}`, 14, 18);

    // Table 1: Master Summary
    const summaryRows = students.map((s, idx) => {
      const resp = s.responses || s.intake_data || {};
      const att = attemptsByUser.get(s.user_id) || attemptsByUser.get(s.email) || (s.assessment_history?.[s.assessment_history.length - 1]);
      const pct = att ? (att.percentage ?? att.results?.percentage ?? '-') : '-';
      const grade = att ? (att.grade ?? att.results?.grade ?? '-') : '-';
      return [
        idx + 1,
        s.candidate_id || s.student_id || '-',
        s.name || s.full_name || 'Student',
        s.email || '-',
        s.institute_code || '-',
        s.field_of_study || s.grade || resp.field_of_study || '-',
        resp.phone || '-',
        resp.education_level || '-',
        pct !== '-' ? `${pct}% (${grade})` : 'Not Taken',
        s.created_at ? new Date(s.created_at).toLocaleDateString() : '-'
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Candidate ID', 'Name', 'Email', 'Inst', 'Field', 'Phone', 'Edu Level', 'Latest Assessment', 'Joined']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      margin: { left: 10, right: 10 }
    });

    // Detailed Appendix: Full Received Inputs per Student
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Received Inputs Per Student', 10, 14);

    const detailRows = students.map((s, idx) => {
      const resp = s.responses || s.intake_data || {};
      const formattedInputs = Object.entries(resp)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${formatLabel(k)}: ${formatValue(v)}`)
        .join('  |  ');
      return [
        idx + 1,
        s.candidate_id || '-',
        `${s.name || 'Student'}\n(${s.email || ''})`,
        formatValue(s.selected_domains || []) || '-',
        formattedInputs || 'No intake inputs recorded'
      ];
    });

    autoTable(doc, {
      startY: 19,
      head: [['#', 'Candidate ID', 'Student', 'Selected Domains', 'All Received Intake Inputs']],
      body: detailRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.2, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 34 }, 2: { cellWidth: 46 }, 3: { cellWidth: 38 } },
      margin: { left: 10, right: 10 }
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`abhiruchi_all_students_report_${timestamp}.pdf`);
  },

  /**
   * Direct-download Cohort Summary PDF for assessment attempts
   */
  exportCohortSummaryPDF(attempts = []) {
    if (!attempts || attempts.length === 0) {
      throw new Error('No assessment attempts available to export');
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFillColor(234, 88, 12);
    doc.rect(0, 0, 297, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('BHIV GURUKUL ABHIRUCHI - ASSESSMENT COHORT SUMMARY', 14, 11);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Evaluated Attempts: ${attempts.length}   |   Generated: ${new Date().toLocaleString()}`, 14, 18);

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Student Name', 'Email', 'Domain / Field', 'Score', 'Percentage', 'Grade', 'Feedback Summary', 'Date']],
      body: attempts.map((a, i) => [
        i + 1,
        a.students?.name || a.name || 'Student',
        a.students?.email || a.user_email || '-',
        a.student_field || 'STEM',
        `${a.total_score ?? 0}/${a.max_score ?? 100}`,
        `${a.percentage ?? 0}%`,
        a.grade || 'N/A',
        (a.overall_feedback || '-').slice(0, 140),
        a.completed_at ? new Date(a.completed_at).toLocaleDateString() : 'N/A'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: 255, fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      margin: { left: 10, right: 10 }
    });

    const timestamp = new Date().toISOString().slice(0, 10);
    doc.save(`abhiruchi_cohort_summary_${timestamp}.pdf`);
  }
};

export default ExportService;
