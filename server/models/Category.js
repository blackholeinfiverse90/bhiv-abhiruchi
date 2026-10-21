import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    icon: { type: String, default: 'Brain' },
    color: { type: String, default: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
    display_order: { type: Number, default: 0 },
    type: { type: String, default: 'question', enum: ['question', 'form'] },
    is_system: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
