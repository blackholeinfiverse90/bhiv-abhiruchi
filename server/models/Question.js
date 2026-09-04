import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question_id: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    question_text: { type: String, required: true },
    options: { type: [String], required: true },
    correct_answer: { type: String, required: true },
    explanation: { type: String, default: '' },
    vedic_connection: { type: String, default: '' },
    modern_application: { type: String, default: '' },
    tags: { type: [String], default: [] },
    target_domains: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    is_ai_generated: { type: Boolean, default: false },
    created_by: { type: String, default: 'system' }
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ target_domains: 1 });
questionSchema.index({ is_active: 1 });

export default mongoose.model('Question', questionSchema);
