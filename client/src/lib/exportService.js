/**
 * Data Transport & Export Service for Gurukul Assessment System
 * Supports CSV, JSON, and PDF formats for all student intake and assessment data.
 */

// Helper to download a file in browser
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

// Clean text for CSV fields
const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
};

export const ExportService = {
  /**
   * Export student intake data to CSV
   */
  exportStudentsToCSV(students = []) {
    if (!students || students.length === 0) {
      throw new Error('No student data available to export');
    }

    const headers = [
      'Name',
      'Email',
      'Student ID',
      'Field of Study',
      'Phone',
      'Age',
      'Education Level',
      'Current Skills',
      'Interests',
      'Goals',
      'Preferred Learning Style',
      'Hours Available Per Week',
      'Experience (Years)',
      'Created At'
    ];

    const rows = students.map(s => {
      const resp = s.responses || {};
      return [
        escapeCSV(s.name || resp.name || ''),
        escapeCSV(s.email || resp.email || ''),
        escapeCSV(s.student_id || ''),
        escapeCSV(s.grade || resp.field_of_study || s.field_of_study || ''),
        escapeCSV(resp.phone || s.phone || ''),
        escapeCSV(resp.age || s.age || ''),
        escapeCSV(resp.education_level || s.education_level || ''),
        escapeCSV(Array.isArray(resp.current_skills) ? resp.current_skills.join('; ') : resp.current_skills || s.current_skills || ''),
        escapeCSV(Array.isArray(resp.interests) ? resp.interests.join('; ') : resp.interests || s.interests || ''),
        escapeCSV(resp.goals || s.goals || ''),
        escapeCSV(resp.preferred_learning_style || s.preferred_learning_style || ''),
        escapeCSV(resp.availability_per_week_hours || s.availability_per_week_hours || ''),
        escapeCSV(resp.experience_years || s.experience_years || ''),
        escapeCSV(s.created_at ? new Date(s.created_at).toLocaleDateString() : '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(csvContent, `gurukul_student_intake_${timestamp}.csv`, 'text/csv;charset=utf-8;');
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

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(csvContent, `gurukul_assessment_results_${timestamp}.csv`, 'text/csv;charset=utf-8;');
  },

  /**
   * Export complete raw data dump as JSON
   */
  exportAllToJSON(data = {}, filename = 'gurukul_assessment_data_backup') {
    const jsonString = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadBlob(jsonString, `${filename}_${timestamp}.json`, 'application/json');
  },

  /**
   * Generate and print/save a PDF for an Individual Student Scorecard & Profile
   */
  exportStudentScorecardPDF(student, attempt = null) {
    if (!student) throw new Error('Student data required for PDF report');

    const printWin = window.open('', '_blank');
    if (!printWin) {
      throw new Error('Popup was blocked by your browser. Please allow popups for PDF generation.');
    }

    const resp = student.responses || {};
    const domains = attempt?.domains || student.selected_domains || [student.grade || 'STEM'];
    const score = attempt?.total_score ?? attempt?.score ?? 'N/A';
    const percentage = attempt?.percentage ?? (attempt?.total_score ? Math.round((attempt.total_score / (attempt.max_score || 100)) * 100) : 'N/A');
    const grade = attempt?.grade || 'Seed Tier';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Assessment Report - ${student.name || 'Student'}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #f97316;
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #ea580c;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      background: #fed7aa;
      color: #9a3412;
      font-weight: 600;
      font-size: 12px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #f97316;
      padding-left: 8px;
      margin-top: 20px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
    }
    .label {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }
    .val {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-top: 2px;
    }
    .score-banner {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border: 1px solid #fdba74;
      border-radius: 12px;
      padding: 16px;
      display: flex;
      justify-content: space-around;
      text-align: center;
      margin-bottom: 20px;
    }
    .score-item .num {
      font-size: 26px;
      font-weight: 800;
      color: #ea580c;
    }
    .feedback-box {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 14px;
      font-size: 13px;
      color: #334155;
      margin-top: 10px;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">BHIV GURUKUL ABHIRUCHI</div>
      <div class="subtitle">Technical Proficiency & Student Intake Dossier</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">Date: ${new Date().toLocaleDateString()}</span>
      <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ID: ${student.student_id || student.id || 'N/A'}</div>
    </div>
  </div>

  ${attempt ? `
  <div class="score-banner">
    <div class="score-item">
      <div class="label">Total Score</div>
      <div class="num">${score}</div>
    </div>
    <div class="score-item">
      <div class="label">Percentage</div>
      <div class="num">${percentage}%</div>
    </div>
    <div class="score-item">
      <div class="label">Proficiency Grade</div>
      <div class="num">${grade}</div>
    </div>
  </div>
  ` : ''}

  <div class="section-title">Student Profile & Academic Intake</div>
  <div class="grid">
    <div class="card">
      <div class="label">Full Name</div>
      <div class="val">${student.name || resp.name || 'Student'}</div>
    </div>
    <div class="card">
      <div class="label">Email Address</div>
      <div class="val">${student.email || resp.email || 'N/A'}</div>
    </div>
    <div class="card">
      <div class="label">Field of Study</div>
      <div class="val">${student.grade || resp.field_of_study || student.field_of_study || 'STEM'}</div>
    </div>
    <div class="card">
      <div class="label">Education Level</div>
      <div class="val">${resp.education_level || student.education_level || 'Undergraduate'}</div>
    </div>
    <div class="card">
      <div class="label">Contact Phone</div>
      <div class="val">${resp.phone || student.phone || 'N/A'}</div>
    </div>
    <div class="card">
      <div class="label">Availability</div>
      <div class="val">${resp.availability_per_week_hours ? `${resp.availability_per_week_hours} hrs/week` : 'Flexible'}</div>
    </div>
  </div>

  <div class="section-title">Skills & Learning Objectives</div>
  <div class="card" style="margin-bottom: 12px;">
    <div class="label">Selected Technical Domains</div>
    <div class="val" style="color: #ea580c;">${Array.isArray(domains) ? domains.join(', ') : domains}</div>
  </div>

  <div class="card" style="margin-bottom: 12px;">
    <div class="label">Current Skills & Technical Background</div>
    <div class="val">${Array.isArray(resp.current_skills) ? resp.current_skills.join(', ') : resp.current_skills || student.current_skills || 'Foundational STEM concepts'}</div>
  </div>

  <div class="card" style="margin-bottom: 12px;">
    <div class="label">Interests & Aspirations</div>
    <div class="val">${Array.isArray(resp.interests) ? resp.interests.join(', ') : resp.interests || student.interests || 'Technology Innovation, Research'}</div>
  </div>

  ${attempt?.overall_feedback ? `
  <div class="section-title">AI Evaluation & Mentor Feedback</div>
  <div class="feedback-box">
    ${attempt.overall_feedback}
  </div>
  ` : ''}

  <div class="footer">
    Generated automatically by Gurukul Assessment Engine • Confidential Educational Assessment
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  },

  /**
   * Export all assessment attempts as a printable summary PDF report
   */
  exportCohortSummaryPDF(attempts = []) {
    if (!attempts || attempts.length === 0) {
      throw new Error('No assessment attempts available to export');
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      throw new Error('Popup blocked by browser. Please allow popups to view PDF.');
    }

    const rows = attempts.map((a, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${a.students?.name || a.name || 'Student'}</strong><br><small style="color: #64748b;">${a.students?.email || a.user_email || ''}</small></td>
        <td>${a.student_field || 'STEM'}</td>
        <td style="text-align: center;"><strong>${a.total_score ?? 0}</strong>/${a.max_score ?? 100}</td>
        <td style="text-align: center;"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-weight: 600;">${a.percentage ?? 0}%</span></td>
        <td style="text-align: center;">${a.grade || 'N/A'}</td>
        <td>${a.completed_at ? new Date(a.completed_at).toLocaleDateString() : 'N/A'}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gurukul Assessment Cohort Summary</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 15px; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ea580c; padding-bottom: 10px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 800; color: #ea580c; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; text-align: left; text-transform: uppercase; font-size: 11px; color: #475569; }
    td { border: 1px solid #e2e8f0; padding: 8px; }
    tr:nth-child(even) { background: #f8fafc; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">BHIV GURUKUL ABHIRUCHI - COHORT SUMMARY</div>
      <div style="font-size: 12px; color: #64748b;">Total Evaluated Students: ${attempts.length}</div>
    </div>
    <div style="font-size: 11px; color: #64748b;">
      Generated: ${new Date().toLocaleString()}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px;">#</th>
        <th>Student Name & Email</th>
        <th>Domain</th>
        <th style="text-align: center;">Score</th>
        <th style="text-align: center;">Percentage</th>
        <th style="text-align: center;">Grade</th>
        <th>Date</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
  }
};

export default ExportService;
