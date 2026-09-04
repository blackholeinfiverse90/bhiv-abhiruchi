import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StudyField from '../models/StudyField.js';
import Question from '../models/Question.js';
import Category from '../models/Category.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const defaultDomains = [
  { field_id: 'iot', name: 'Internet of Things (IoT)', short_name: 'IoT', description: 'MQTT, LoRaWAN, Edge Computing, Sensor Telemetry', icon_name: 'Cpu' },
  { field_id: 'blockchain', name: 'Blockchain Technology', short_name: 'Blockchain', description: 'Hash chaining, Smart contracts, Layer-2, Consensus', icon_name: 'Link' },
  { field_id: 'humanoid_robotics', name: 'Humanoid Robotics', short_name: 'Humanoid Robotics', description: 'ZMP, Tactile sensors, Whole-body control, Kinematics', icon_name: 'Bot' },
  { field_id: 'ai_ml_ds', name: 'AI/ML/Data Science', short_name: 'AI/ML/DS', description: 'Supervised learning, Embeddings, Continual learning, LLMs', icon_name: 'Brain' },
  { field_id: 'drone_tech', name: 'Drone Technology', short_name: 'Drone Tech', description: 'ESC, VIO navigation, RTK GPS, Flight Dynamics', icon_name: 'Plane' },
  { field_id: 'biotechnology', name: 'Biotechnology', short_name: 'Biotechnology', description: 'PCR, CRISPR, Bioreactors, Chromatography, Gene Editing', icon_name: 'Dna' },
  { field_id: 'pharma_tech', name: 'Pharmaceutical Technology', short_name: 'Pharma Tech', description: 'API, GMP, Clinical trials, Bioequivalence', icon_name: 'Pill' },
  { field_id: 'gaming', name: 'Gaming & Game Development', short_name: 'Gaming', description: 'Unity, OpenGL, Physics engines, Shader programming', icon_name: 'Gamepad2' },
  { field_id: 'vr_ar_immersive', name: 'VR/AR/Immersive Tech', short_name: 'VR/AR', description: 'Low latency, Foveated rendering, Spatial audio', icon_name: 'Glasses' },
  { field_id: 'cybersecurity', name: 'Cybersecurity', short_name: 'CyberSecurity', description: 'Zero Trust, Incident response, MFA, Least privilege, Encryption', icon_name: 'Shield' },
  { field_id: 'web_dev', name: 'Web Development (Full-stack + AI)', short_name: 'Web Dev', description: 'React, Node, REST, GraphQL, Jamstack, RAG systems', icon_name: 'Code' },
  { field_id: '3d_printing', name: '3D Printing / Additive Manufacturing', short_name: '3D Printing', description: 'FDM, SLM, Polymer Materials, Structural Accuracy', icon_name: 'Box' },
  { field_id: 'quantum_computing', name: 'Quantum Computing', short_name: 'Quantum', description: 'Qubits, Superposition, Shor algorithm, Error correction', icon_name: 'Atom' }
];

const sampleQuestions = [
  {
    question_id: 'IOT-01',
    category: 'IoT',
    difficulty: 'easy',
    question_text: 'Which lightweight messaging protocol is most suitable for constrained IoT devices?',
    options: ['A) HTTP', 'B) MQTT', 'C) FTP', 'D) SMTP'],
    correct_answer: 'B) MQTT',
    explanation: 'MQTT is a publish/subscribe network protocol that transports messages between devices with low bandwidth consumption.',
    vedic_connection: 'Minimal messaging mirrors concise sutra style transmission.',
    modern_application: 'Sensor telemetry transmission to cloud platforms.',
    target_domains: ['iot'],
    tags: ['IoT', 'Protocols', 'MQTT']
  },
  {
    question_id: 'BC-01',
    category: 'Blockchain',
    difficulty: 'medium',
    question_text: 'What cryptographic data structure connects blocks sequentially in a blockchain?',
    options: ['A) B-Tree', 'B) Hash Pointer List', 'C) Binary Heap', 'D) Circular Array'],
    correct_answer: 'B) Hash Pointer List',
    explanation: 'Each block contains a cryptographic hash pointer of the previous block, creating an immutable linked chain.',
    vedic_connection: 'Chain of lineage mirrors unbroken parampara continuity.',
    modern_application: 'Decentralized ledgers and tamper-evident audit trails.',
    target_domains: ['blockchain'],
    tags: ['Blockchain', 'Cryptography', 'Data Structures']
  },
  {
    question_id: 'AI-01',
    category: 'AI/ML/DS',
    difficulty: 'medium',
    question_text: 'Which mechanism enables Transformers to focus dynamically on different parts of an input sequence?',
    options: ['A) Backpropagation', 'B) Self-Attention', 'C) Max Pooling', 'D) Batch Normalization'],
    correct_answer: 'B) Self-Attention',
    explanation: 'Self-attention calculates attention weights between tokens allowing models to process context globally.',
    vedic_connection: 'Single-pointed focus mirrors Ekagrata in Dhyana.',
    modern_application: 'Large Language Models (LLMs) and context understanding.',
    target_domains: ['ai_ml_ds'],
    tags: ['AI', 'Transformers', 'Deep Learning']
  },
  {
    question_id: 'CY-01',
    category: 'CyberSecurity',
    difficulty: 'hard',
    question_text: 'Which security architecture enforces strict identity verification for every user and device trying to access network resources?',
    options: ['A) Perimeter Security', 'B) Zero Trust Architecture', 'C) Air Gapping', 'D) VPN Tunneling'],
    correct_answer: 'B) Zero Trust Architecture',
    explanation: 'Zero Trust assumes no implicit trust and requires continuous authentication and authorization.',
    vedic_connection: 'Discernment mirrors Viveka in evaluating authentic truth.',
    modern_application: 'Enterprise cybersecurity defense.',
    target_domains: ['cybersecurity'],
    tags: ['Cybersecurity', 'Zero Trust', 'Network']
  },
  {
    question_id: 'WEB-01',
    category: 'Web Development',
    difficulty: 'easy',
    question_text: 'Which virtual DOM-based library uses JSX syntax for component rendering?',
    options: ['A) Angular', 'B) React', 'C) Django', 'D) Laravel'],
    correct_answer: 'B) React',
    explanation: 'React utilizes a Virtual DOM and JSX to efficiently render declarative UI components.',
    vedic_connection: 'Modular components mirror macro-micro cosm (Yatha Pinde Tatha Brahmande).',
    modern_application: 'Frontend application architecture.',
    target_domains: ['web_dev'],
    tags: ['Web Dev', 'React', 'Frontend']
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gurukul_assessment';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Seed Study Fields
    for (const d of defaultDomains) {
      await StudyField.findOneAndUpdate(
        { field_id: d.field_id },
        d,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${defaultDomains.length} Study Fields`);

    // Seed Questions
    for (const q of sampleQuestions) {
      await Question.findOneAndUpdate(
        { question_id: q.question_id },
        q,
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Seeded ${sampleQuestions.length} Questions`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
