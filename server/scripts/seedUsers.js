import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

const seedUsers = async () => {
  try {
    console.log('⏳ Connecting to MongoDB Atlas to seed test users...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // 1. Create or Update Test Student
    const studentEmail = 'student@gurukul.com';
    let student = await User.findOne({ email: studentEmail });
    if (student) {
      student.full_name = 'Test Student';
      student.password = 'Password123'; // Will trigger pre-save bcrypt hash hook
      student.role = 'student';
      await student.save();
      console.log('👤 Test Student updated: student@gurukul.com / Password123');
    } else {
      student = await User.create({
        full_name: 'Test Student',
        email: studentEmail,
        password: 'Password123',
        role: 'student',
        field_of_study: 'stem',
        selected_domains: ['iot', 'blockchain', 'ai_ml_ds']
      });
      console.log('👤 Test Student created: student@gurukul.com / Password123');
    }

    // 2. Create or Update Test Admin
    const adminEmail = 'admin@gurukul.com';
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.full_name = 'System Administrator';
      admin.password = 'AdminPassword123';
      admin.role = 'admin';
      await admin.save();
      console.log('🛡️ Test Admin updated: admin@gurukul.com / AdminPassword123');
    } else {
      admin = await User.create({
        full_name: 'System Administrator',
        email: adminEmail,
        password: 'AdminPassword123',
        role: 'admin'
      });
      console.log('🛡️ Test Admin created: admin@gurukul.com / AdminPassword123');
    }

    console.log('\n🎉 Test Users Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    process.exit(1);
  }
};

seedUsers();
