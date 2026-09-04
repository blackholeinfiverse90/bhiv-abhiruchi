import mongoose from 'mongoose';

const formConfigSchema = new mongoose.Schema(
  {
    config_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String },
    fields: { type: mongoose.Schema.Types.Mixed, default: [] },
    is_active: { type: Boolean, default: true },
    version: { type: String, default: '1.0' }
  },
  { timestamps: true }
);

export default mongoose.model('FormConfig', formConfigSchema);
