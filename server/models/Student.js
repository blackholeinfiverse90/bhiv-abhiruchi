import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    candidate_id: { type: String, unique: true, sparse: true },
    institute_code: {
      type: String,
      enum: ['MSSU', 'DYP-A', 'SIT-S', 'SIPS-S', 'VJTI', null],
      default: null
    },
    cohort_id: { type: String, default: 'COHORT-2026-OCT-A' },
    trace_id: { type: String },
    enrolment_status: { type: String, default: 'PENDING' },
    lifecycle_status: { type: String, default: 'ENROLLED_ACTIVE' },
    email: { type: String },
    full_name: { type: String },
    field_of_study: { type: String, default: 'stem' },
    selected_domains: { type: [String], default: [] },
    intake_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    assessment_history: [
      {
        assessment_id: { type: String },
        score: { type: Number },
        total_questions: { type: Number },
        domains: { type: [String] },
        completed_at: { type: Date, default: Date.now },
        results: { type: mongoose.Schema.Types.Mixed }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Student', studentSchema);
