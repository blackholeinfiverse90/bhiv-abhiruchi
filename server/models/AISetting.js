import mongoose from 'mongoose';

const aiSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: true },
    provider: { type: String, default: 'groq' },
    model: { type: String, default: 'llama-3.3-70b-versatile' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('AISetting', aiSettingSchema);
