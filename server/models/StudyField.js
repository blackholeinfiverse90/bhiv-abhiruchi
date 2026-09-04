import mongoose from 'mongoose';

const studyFieldSchema = new mongoose.Schema(
  {
    field_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    short_name: { type: String, required: true },
    description: { type: String, default: '' },
    subcategories: { type: [String], default: [] },
    question_weights: { type: Map, of: Number, default: {} },
    difficulty_distribution: { type: Map, of: Number, default: {} },
    is_active: { type: Boolean, default: true },
    icon_name: { type: String, default: 'BookOpen' }
  },
  { timestamps: true }
);

export default mongoose.model('StudyField', studyFieldSchema);
