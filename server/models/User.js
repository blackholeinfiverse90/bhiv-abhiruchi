import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
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

// Pre-save hook to hash password if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
