import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    category_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    is_active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
