import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    email: { type: String },
    role: { type: String, default: 'admin' },
    permissions: { type: [String], default: ['all'] }
  },
  { timestamps: true }
);

export default mongoose.model('Admin', adminSchema);
