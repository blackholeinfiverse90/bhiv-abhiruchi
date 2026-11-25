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

const extraCategories = [
  {
    category_id: 'ai_data_science',
    name: 'AI & Data Science',
    description: 'Machine learning, neural networks, embeddings, LLMs, and statistical modeling',
    icon: 'Brain',
    color: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    display_order: 8,
    type: 'question',
    is_system: false,
    is_active: true
  },
  {
    category_id: 'system_design',
    name: 'System Design & Engineering',
    description: 'Distributed systems, robotics, embedded IoT, scalability, and hardware architecture',
    icon: 'Database',
    color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    display_order: 9,
    type: 'question',
    is_system: false,
    is_active: true
  },
  {
    category_id: 'cybersecurity',
    name: 'Cybersecurity & Networks',
    description: 'Zero Trust, cryptography, network protocols, threat modeling, and app security',
    icon: 'Shield',
    color: 'text-red-400 bg-red-400/10 border-red-400/20',
    display_order: 10,
    type: 'question',
    is_system: false,
    is_active: true
  },
  {
    category_id: 'biotech_life_sciences',
    name: 'Biotech & Life Sciences',
    description: 'Molecular biology, CRISPR, bioprocessing, pharmacology, and clinical standards',
    icon: 'Heart',
    color: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    display_order: 11,
    type: 'question',
    is_system: false,
    is_active: true
  },
  {
    category_id: 'management_entrepreneurship',
    name: 'Management & Entrepreneurship',
    description: 'Product strategy, economics, team leadership, finance, and ethical decision-making',
    icon: 'Target',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    display_order: 12,
    type: 'question',
    is_system: false,
    is_active: true
  }
];

const sampleQuestions = [
  {
    question_id: 'IOT-01',
    category: 'System Design & Engineering',
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
    question_id: 'IOT-02',
    category: 'System Design & Engineering',
    difficulty: 'medium',
    question_text: 'Why is LoRaWAN preferred over Wi-Fi for agricultural soil-moisture sensor networks?',
    options: ['A) Higher video streaming bandwidth', 'B) Long-range low-power communication over kilometers', 'C) Built-in blockchain consensus', 'D) Requires constant AC mains power'],
    correct_answer: 'B) Long-range low-power communication over kilometers',
    explanation: 'LoRaWAN operates in sub-GHz bands enabling multi-kilometer coverage with multi-year battery life for small telemetry payloads.',
    vedic_connection: 'Subtle prana flowing effortlessly across wide terrain.',
    modern_application: 'Smart agriculture, utility metering, and environmental monitoring.',
    target_domains: ['iot'],
    tags: ['IoT', 'LoRaWAN', 'LPWAN']
  },
  {
    question_id: 'IOT-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'In edge-to-cloud IoT pipelines, what is the primary advantage of running anomaly inference on the edge gateway?',
    options: ['A) Increases cloud egress bandwidth cost', 'B) Reduces latency and keeps local control working offline', 'C) Eliminates the need for device firmware', 'D) Forces all raw sensor frames to S3'],
    correct_answer: 'B) Reduces latency and keeps local control working offline',
    explanation: 'Edge inference filters noise locally, reacts in milliseconds, and preserves resilience during WAN outages.',
    vedic_connection: 'Local reflex (Pratyaksha) acting immediately without central delay.',
    modern_application: 'Industrial predictive maintenance and autonomous factory safety.',
    target_domains: ['iot', 'ai_ml_ds'],
    tags: ['IoT', 'Edge Computing']
  },
  {
    question_id: 'BC-01',
    category: 'Cybersecurity & Networks',
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
    question_id: 'BC-02',
    category: 'Coding',
    difficulty: 'easy',
    question_text: 'Which mechanism ensures smart contract execution in Ethereum terminates and avoids infinite loops?',
    options: ['A) Gas limit and fee metering', 'B) DNS TTL', 'C) Browser cookies', 'D) Round-robin scheduling'],
    correct_answer: 'A) Gas limit and fee metering',
    explanation: 'Every EVM opcode consumes gas; execution halts cleanly when gas is exhausted.',
    vedic_connection: 'Measured energy discipline (Tapas) preventing runaway action.',
    modern_application: 'EVM smart contracts and Layer-2 rollups.',
    target_domains: ['blockchain'],
    tags: ['Blockchain', 'Ethereum', 'Gas']
  },
  {
    question_id: 'BC-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'How do Optimistic Rollups achieve higher Layer-2 throughput while inheriting Layer-1 security?',
    options: ['A) By disabling all cryptographic signatures', 'B) By batching transactions off-chain and allowing fraud-proof challenge windows on L1', 'C) By doubling L1 block size every hour', 'D) By storing private keys publicly'],
    correct_answer: 'B) By batching transactions off-chain and allowing fraud-proof challenge windows on L1',
    explanation: 'Optimistic rollups post compressed batches to L1 and rely on fraud proofs during a dispute window to revert invalid state roots.',
    vedic_connection: 'Trust verified by open Nyaya disputation.',
    modern_application: 'Scalable DeFi and supply-chain verification networks.',
    target_domains: ['blockchain'],
    tags: ['Blockchain', 'Layer-2', 'Rollups']
  },
  {
    question_id: 'HR-01',
    category: 'System Design & Engineering',
    difficulty: 'easy',
    question_text: 'In humanoid robotics, what does ZMP stand for in bipedal balance control?',
    options: ['A) Zero Moment Point', 'B) Zonal Motor Power', 'C) Zero Mass Pivot', 'D) Zenith Motion Path'],
    correct_answer: 'A) Zero Moment Point',
    explanation: 'ZMP is the point on the ground where horizontal inertial and gravitational moments sum to zero, crucial for stable walking.',
    vedic_connection: 'Balanced posture (Sthira Sukham Asanam) anchored to center of gravity.',
    modern_application: 'Bipedal locomotion in humanoid robots.',
    target_domains: ['humanoid_robotics'],
    tags: ['Robotics', 'ZMP', 'Kinematics']
  },
  {
    question_id: 'HR-02',
    category: 'Mathematics',
    difficulty: 'medium',
    question_text: 'What problem does Inverse Kinematics (IK) solve for a robotic manipulator arm?',
    options: ['A) Computing joint angles required to place the end-effector at a target pose', 'B) Compressing camera video streams', 'C) Encrypting telemetry packets', 'D) Estimating battery shelf-life'],
    correct_answer: 'A) Computing joint angles required to place the end-effector at a target pose',
    explanation: 'Inverse Kinematics maps desired Cartesian end-effector position/orientation back to feasible joint configurations.',
    vedic_connection: 'Working backward from purpose (Sankalpa) to coordinated action.',
    modern_application: 'Grasping, pick-and-place, and humanoid arm trajectory planning.',
    target_domains: ['humanoid_robotics'],
    tags: ['Robotics', 'Kinematics']
  },
  {
    question_id: 'HR-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'Why are tactile force-torque sensors paired with whole-body Model Predictive Control (MPC) in humanoids?',
    options: ['A) To disable joint compliance', 'B) To regulate contact forces dynamically during compliant manipulation and uneven terrain walking', 'C) To increase static power draw', 'D) To bypass actuator limits'],
    correct_answer: 'B) To regulate contact forces dynamically during compliant manipulation and uneven terrain walking',
    explanation: 'Tactile feedback lets MPC adjust ground reaction and grip forces in real time without crushing objects or tipping.',
    vedic_connection: 'Sensory feedback (Indriya) guiding poised action (Karmendriya).',
    modern_application: 'Warehouse and assistive humanoid robots.',
    target_domains: ['humanoid_robotics'],
    tags: ['Robotics', 'MPC', 'Sensors']
  },
  {
    question_id: 'AI-01',
    category: 'AI & Data Science',
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
    question_id: 'AI-02',
    category: 'AI & Data Science',
    difficulty: 'easy',
    question_text: 'In Retrieval-Augmented Generation (RAG), why are document chunks converted into vector embeddings?',
    options: ['A) To enable semantic similarity search beyond exact keyword matching', 'B) To delete the original text', 'C) To disable GPU acceleration', 'D) To encrypt user passwords'],
    correct_answer: 'A) To enable semantic similarity search beyond exact keyword matching',
    explanation: 'Dense vector embeddings place semantically similar passages close in vector space for accurate retrieval.',
    vedic_connection: 'Connecting inner meaning (Artha) across varied words (Shabda).',
    modern_application: 'Enterprise knowledge assistants and Uniguru curriculum search.',
    target_domains: ['ai_ml_ds', 'web_dev'],
    tags: ['AI', 'RAG', 'Embeddings']
  },
  {
    question_id: 'AI-03',
    category: 'AI & Data Science',
    difficulty: 'hard',
    question_text: 'Which metric best evaluates a binary classifier on a highly imbalanced fraud dataset (0.5% positives)?',
    options: ['A) Raw accuracy alone', 'B) Precision-Recall AUC (PR-AUC) and F1 score', 'C) Training loss only', 'D) Dataset row count'],
    correct_answer: 'B) Precision-Recall AUC (PR-AUC) and F1 score',
    explanation: 'Accuracy can be 99.5% by predicting all negatives; PR-AUC focuses directly on minority positive detection quality.',
    vedic_connection: 'Discerning the rare essential signal (Viveka) from vast noise.',
    modern_application: 'Fraud detection, medical screening, and anomaly alerting.',
    target_domains: ['ai_ml_ds'],
    tags: ['ML', 'Evaluation', 'Metrics']
  },
  {
    question_id: 'DR-01',
    category: 'System Design & Engineering',
    difficulty: 'easy',
    question_text: 'What component regulates power to each brushless motor on a quadcopter based on flight controller signals?',
    options: ['A) Electronic Speed Controller (ESC)', 'B) Barometer', 'C) Pitot tube', 'D) Gimbal lock'],
    correct_answer: 'A) Electronic Speed Controller (ESC)',
    explanation: 'ESCs convert DC battery power into precisely timed 3-phase AC signals to control motor RPM.',
    vedic_connection: 'Controlled modulation of Vayu (airflow) through measured prana.',
    modern_application: 'Autonomous delivery and aerial mapping drones.',
    target_domains: ['drone_tech'],
    tags: ['Drones', 'ESC', 'Hardware']
  },
  {
    question_id: 'DR-02',
    category: 'System Design & Engineering',
    difficulty: 'medium',
    question_text: 'Why is Visual-Inertial Odometry (VIO) used on autonomous drones indoors?',
    options: ['A) GPS signals are weak or unavailable indoors', 'B) VIO replaces propellers', 'C) It increases payload weight', 'D) It disables IMU sensors'],
    correct_answer: 'A) GPS signals are weak or unavailable indoors',
    explanation: 'VIO fuses camera optical flow/features with high-rate IMU measurements to estimate pose in GPS-denied environments.',
    vedic_connection: 'Coordinating sight (Drishti) and inner balance for steady flight.',
    modern_application: 'Warehouse inspection and underground tunnel drones.',
    target_domains: ['drone_tech'],
    tags: ['Drones', 'VIO', 'Navigation']
  },
  {
    question_id: 'DR-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'How does RTK-GPS achieve centimeter-level positioning accuracy compared to standard GNSS?',
    options: ['A) By using carrier-phase corrections from a stationary base station', 'B) By disabling satellite signals', 'C) By increasing rotor pitch', 'D) By flying only at night'],
    correct_answer: 'A) By using carrier-phase corrections from a stationary base station',
    explanation: 'Real-Time Kinematic (RTK) positioning uses a fixed base station to cancel atmospheric and clock errors via carrier-phase math.',
    vedic_connection: 'Fixed reference anchor (Dhruva) enabling exact spatial orientation.',
    modern_application: 'Precision surveying, agriculture spraying, and automated docking.',
    target_domains: ['drone_tech'],
    tags: ['Drones', 'RTK-GPS']
  },
  {
    question_id: 'BIO-01',
    category: 'Biotech & Life Sciences',
    difficulty: 'easy',
    question_text: 'What is the primary purpose of Polymerase Chain Reaction (PCR) in molecular biology?',
    options: ['A) Amplify a specific DNA segment into millions of copies', 'B) Measure blood glucose directly', 'C) Sterilize glass flasks', 'D) Separate proteins by boiling'],
    correct_answer: 'A) Amplify a specific DNA segment into millions of copies',
    explanation: 'PCR uses thermal cycling, primers, and heat-stable DNA polymerase to exponentially copy target DNA sequences.',
    vedic_connection: 'Bija (seed) multiplying abundantly under cyclic rhythmic heat (Agni).',
    modern_application: 'Diagnostics, forensics, and genetic cloning.',
    target_domains: ['biotechnology'],
    tags: ['Biotech', 'PCR', 'Genetics']
  },
  {
    question_id: 'BIO-02',
    category: 'Biotech & Life Sciences',
    difficulty: 'medium',
    question_text: 'In CRISPR-Cas9 gene editing, what role does the guide RNA (gRNA) perform?',
    options: ['A) Directs Cas9 to cut at a specific complementary DNA sequence', 'B) Powers the incubator fan', 'C) Replaces all cell membranes', 'D) Stains microscope slides'],
    correct_answer: 'A) Directs Cas9 to cut at a specific complementary DNA sequence',
    explanation: 'The gRNA binds to the target genomic locus via base-pairing, positioning Cas9 adjacent to a PAM sequence to make a double-strand break.',
    vedic_connection: 'Precise pointer (Sutra) guiding transformation at the exact root.',
    modern_application: 'Therapeutic gene editing and drought-resilient crop engineering.',
    target_domains: ['biotechnology'],
    tags: ['Biotech', 'CRISPR']
  },
  {
    question_id: 'BIO-03',
    category: 'Biotech & Life Sciences',
    difficulty: 'hard',
    question_text: 'Why is dissolved oxygen (DO) tightly controlled in fed-batch mammalian cell bioreactors?',
    options: ['A) Low DO limits oxidative phosphorylation while excessive sparging causes shear stress and foaming', 'B) Oxygen prevents nutrient mixing', 'C) DO stops protein folding', 'D) Cells only use nitrogen'],
    correct_answer: 'A) Low DO limits oxidative phosphorylation while excessive sparging causes shear stress and foaming',
    explanation: 'Balancing aeration and agitation keeps cells healthy for high monoclonal antibody titer without mechanical damage.',
    vedic_connection: 'Equilibrium of Prana (vital breath) sustaining cellular vitality.',
    modern_application: 'Biologics and vaccine manufacturing.',
    target_domains: ['biotechnology', 'pharma_tech'],
    tags: ['Biotech', 'Bioreactor']
  },
  {
    question_id: 'PH-01',
    category: 'Biotech & Life Sciences',
    difficulty: 'easy',
    question_text: 'In pharmaceutical manufacturing, what does GMP stand for?',
    options: ['A) Good Manufacturing Practice', 'B) General Medicine Protocol', 'C) Global Molecule Patent', 'D) Grade Mixing Process'],
    correct_answer: 'A) Good Manufacturing Practice',
    explanation: 'GMP guidelines ensure medicines are consistently produced and controlled to strict quality and safety standards.',
    vedic_connection: 'Ayurvedic Shodhana and disciplined preparation ensuring purity.',
    modern_application: 'FDA/WHO compliant drug production.',
    target_domains: ['pharma_tech'],
    tags: ['Pharma', 'GMP', 'Quality']
  },
  {
    question_id: 'PH-02',
    category: 'Biotech & Life Sciences',
    difficulty: 'medium',
    question_text: 'What do Phase III clinical trials primarily evaluate before regulatory approval?',
    options: ['A) Efficacy and safety across a large patient population compared to standard treatment/placebo', 'B) Initial glassware cleanliness', 'C) Only chemical molecular weight', 'D) Marketing logo colors'],
    correct_answer: 'A) Efficacy and safety across a large patient population compared to standard treatment/placebo',
    explanation: 'Phase III studies confirm therapeutic benefit and monitor adverse reactions across hundreds to thousands of participants.',
    vedic_connection: 'Rigorous Pramana (empirical proof) before public benefit.',
    modern_application: 'New drug applications (NDA) and vaccine licensure.',
    target_domains: ['pharma_tech'],
    tags: ['Pharma', 'Clinical Trials']
  },
  {
    question_id: 'PH-03',
    category: 'Biotech & Life Sciences',
    difficulty: 'hard',
    question_text: 'Which pharmacokinetic parameters are compared to establish bioequivalence of a generic oral tablet?',
    options: ['A) AUC (Area Under Curve) and Cmax within accepted regulatory confidence intervals', 'B) Tablet color and box size', 'C) Shelf price only', 'D) Melting point of packaging'],
    correct_answer: 'A) AUC (Area Under Curve) and Cmax within accepted regulatory confidence intervals',
    explanation: 'Bioequivalence requires rate (Cmax) and extent (AUC) of absorption to fall within 80-125% (90% CI) of the reference drug.',
    vedic_connection: 'Ensuring equal Rasa-Virya potency across formulations.',
    modern_application: 'Generic medicine approval and therapeutic substitution.',
    target_domains: ['pharma_tech'],
    tags: ['Pharma', 'Bioequivalence']
  },
  {
    question_id: 'GM-01',
    category: 'Coding',
    difficulty: 'easy',
    question_text: 'Why do game engines multiply movement speed by deltaTime inside the update loop?',
    options: ['A) To keep gameplay speed consistent regardless of frame rate (FPS)', 'B) To increase GPU temperature', 'C) To disable collision detection', 'D) To compress audio files'],
    correct_answer: 'A) To keep gameplay speed consistent regardless of frame rate (FPS)',
    explanation: 'Multiplying velocity by frame deltaTime ensures objects move the same distance per second on 30Hz, 60Hz, or 144Hz displays.',
    vedic_connection: 'Aligning motion with true Kala (time) rather than perception ticks.',
    modern_application: 'Unity, Unreal, and Godot real-time simulation loops.',
    target_domains: ['gaming'],
    tags: ['Gaming', 'Physics', 'Game Loop']
  },
  {
    question_id: 'GM-02',
    category: 'Coding',
    difficulty: 'medium',
    question_text: 'Which shader stage runs per pixel/fragment to compute final surface color and lighting?',
    options: ['A) Fragment (Pixel) Shader', 'B) Audio Mixer', 'C) Asset Bundler', 'D) Physics Broadphase'],
    correct_answer: 'A) Fragment (Pixel) Shader',
    explanation: 'After vertex transformation and rasterization, the fragment shader evaluates lighting, textures, and PBR materials per pixel.',
    vedic_connection: 'Maya manifesting rich surface light and form at every point.',
    modern_application: 'Real-time 3D rendering in OpenGL, Vulkan, and DirectX.',
    target_domains: ['gaming', 'vr_ar_immersive'],
    tags: ['Gaming', 'Shaders', 'Graphics']
  },
  {
    question_id: 'GM-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'Why do multiplayer action games use client-side prediction with server reconciliation?',
    options: ['A) To give instant local responsiveness while preventing cheating and state desync', 'B) To remove all network packets', 'C) To force 500ms input lag', 'D) To store game saves in DNS'],
    correct_answer: 'A) To give instant local responsiveness while preventing cheating and state desync',
    explanation: 'Clients predict local movement immediately and reconcile with authoritative server snapshots using input sequence numbers.',
    vedic_connection: 'Immediate initiative harmonized with higher cosmic order (Rta).',
    modern_application: 'Competitive FPS and real-time multiplayer engines.',
    target_domains: ['gaming'],
    tags: ['Gaming', 'Netcode']
  },
  {
    question_id: 'VR-01',
    category: 'System Design & Engineering',
    difficulty: 'easy',
    question_text: 'What is the primary cause of motion sickness in VR headsets when head rotation lags behind visual updates?',
    options: ['A) High motion-to-photon latency', 'B) Too much RAM', 'C) High speaker volume', 'D) Matte plastic straps'],
    correct_answer: 'A) High motion-to-photon latency',
    explanation: 'Conflict between vestibular inner-ear motion and delayed visual updates triggers nausea; VR targets <20ms motion-to-photon latency.',
    vedic_connection: 'Harmony between inner sense and outer perception prevents disorientation.',
    modern_application: 'XR headsets and surgical/flight simulators.',
    target_domains: ['vr_ar_immersive'],
    tags: ['VR/AR', 'Latency']
  },
  {
    question_id: 'VR-02',
    category: 'System Design & Engineering',
    difficulty: 'medium',
    question_text: 'How does Foveated Rendering improve performance in VR headsets?',
    options: ['A) Renders full resolution only where the user is looking and lowers peripheral resolution', 'B) Turns off both displays', 'C) Doubles polygon count everywhere', 'D) Removes depth testing'],
    correct_answer: 'A) Renders full resolution only where the user is looking and lowers peripheral resolution',
    explanation: 'Using eye-tracking, GPU shading power concentrates on the human eye fovea region while saving bandwidth in peripheral vision.',
    vedic_connection: 'Focused Drishti allocating energy where awareness rests.',
    modern_application: 'High-resolution standalone XR rendering.',
    target_domains: ['vr_ar_immersive'],
    tags: ['VR/AR', 'Rendering']
  },
  {
    question_id: 'VR-03',
    category: 'Coding',
    difficulty: 'hard',
    question_text: 'Why are quaternions preferred over Euler angles for 3D head and camera orientation in XR engines?',
    options: ['A) Quaternions avoid Gimbal Lock and allow smooth SLERP interpolation', 'B) Quaternions only represent 2D points', 'C) Euler angles require 16 matrices', 'D) Quaternions disable rotation'],
    correct_answer: 'A) Quaternions avoid Gimbal Lock and allow smooth SLERP interpolation',
    explanation: '4-component unit quaternions represent 3D SO(3) rotations continuously without losing degrees of freedom at 90-degree pitch.',
    vedic_connection: 'Unobstructed spherical motion free of rigid axis traps.',
    modern_application: 'XR tracking, robotics, and aerospace attitude control.',
    target_domains: ['vr_ar_immersive', 'humanoid_robotics'],
    tags: ['VR/AR', 'Quaternions']
  },
  {
    question_id: 'CY-01',
    category: 'Cybersecurity & Networks',
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
    question_id: 'CY-02',
    category: 'Cybersecurity & Networks',
    difficulty: 'easy',
    question_text: 'How do parameterized SQL queries (prepared statements) prevent SQL Injection attacks?',
    options: ['A) They separate SQL code structure from user-supplied data values', 'B) They disable database indexes', 'C) They store passwords in plain text', 'D) They hide HTML comments'],
    correct_answer: 'A) They separate SQL code structure from user-supplied data values',
    explanation: 'Prepared statements bind inputs strictly as literal parameters so injected SQL keywords cannot alter query syntax.',
    vedic_connection: 'Clear boundary (Maryada) keeping form distinct from content.',
    modern_application: 'Secure backend APIs and enterprise databases.',
    target_domains: ['cybersecurity', 'web_dev'],
    tags: ['Cybersecurity', 'AppSec', 'SQLi']
  },
  {
    question_id: 'CY-03',
    category: 'Cybersecurity & Networks',
    difficulty: 'medium',
    question_text: 'What is the Principle of Least Privilege in Identity and Access Management (IAM)?',
    options: ['A) Granting users and services only the minimum permissions needed for their task', 'B) Giving every developer root admin access', 'C) Sharing one service account across all microservices', 'D) Disabling audit logs'],
    correct_answer: 'A) Granting users and services only the minimum permissions needed for their task',
    explanation: 'Minimizing permissions limits blast radius if credentials or services are compromised.',
    vedic_connection: 'Apagraha and Dharma — holding only what is needed for one’s duty.',
    modern_application: 'Cloud IAM policies and Kubernetes RBAC.',
    target_domains: ['cybersecurity'],
    tags: ['Cybersecurity', 'IAM']
  },
  {
    question_id: 'WEB-01',
    category: 'Coding',
    difficulty: 'easy',
    question_text: 'Which virtual DOM-based library uses JSX syntax for component rendering?',
    options: ['A) Angular', 'B) React', 'C) Django', 'D) Laravel'],
    correct_answer: 'B) React',
    explanation: 'React utilizes a Virtual DOM and JSX to efficiently render declarative UI components.',
    vedic_connection: 'Modular components mirror macro-micro cosm (Yatha Pinde Tatha Brahmande).',
    modern_application: 'Frontend application architecture.',
    target_domains: ['web_dev'],
    tags: ['Web Dev', 'React', 'Frontend']
  },
  {
    question_id: 'WEB-02',
    category: 'Coding',
    difficulty: 'medium',
    question_text: 'In RESTful APIs, which HTTP status code indicates a request succeeded and created a new resource?',
    options: ['A) 200 OK', 'B) 201 Created', 'C) 304 Not Modified', 'D) 401 Unauthorized'],
    correct_answer: 'B) 201 Created',
    explanation: '201 Created signals that the request was fulfilled and resulted in one or more new resources being created.',
    vedic_connection: 'Explicit acknowledgment of new creation (Srishti).',
    modern_application: 'Express/FastAPI microservices and client state synchronization.',
    target_domains: ['web_dev'],
    tags: ['Web Dev', 'HTTP', 'REST']
  },
  {
    question_id: 'WEB-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'Why is a Redis cache-aside pattern effective for read-heavy web dashboards?',
    options: ['A) Frequently read data is served from RAM in sub-milliseconds, offloading database queries', 'B) It deletes MongoDB collections automatically', 'C) It forces every read to recompile JSX', 'D) It disables HTTPS'],
    correct_answer: 'A) Frequently read data is served from RAM in sub-milliseconds, offloading database queries',
    explanation: 'Cache-aside checks Redis first and populates on cache miss with a TTL, drastically cutting p99 latency and DB load.',
    vedic_connection: 'Smriti (quick accessible memory) supporting immediate wisdom.',
    modern_application: 'High-traffic web platforms and analytics portals.',
    target_domains: ['web_dev'],
    tags: ['Web Dev', 'Caching', 'Architecture']
  },
  {
    question_id: '3DP-01',
    category: 'System Design & Engineering',
    difficulty: 'easy',
    question_text: 'Which 3D printing process extrudes melted thermoplastic filament layer by layer through a heated nozzle?',
    options: ['A) Fused Deposition Modeling (FDM)', 'B) Selective Laser Melting (SLM)', 'C) Sand Casting', 'D) Electroplating'],
    correct_answer: 'A) Fused Deposition Modeling (FDM)',
    explanation: 'FDM heats polymer filaments such as PLA, ABS, or PETG and deposits them along sliced G-code paths.',
    vedic_connection: 'Layer-by-layer construction like stacked brick Vedic altars (Agni Chayana).',
    modern_application: 'Rapid prototyping, custom enclosures, and jigs.',
    target_domains: ['3d_printing'],
    tags: ['3D Printing', 'FDM']
  },
  {
    question_id: '3DP-02',
    category: 'System Design & Engineering',
    difficulty: 'medium',
    question_text: 'Why do FDM parts exhibit anisotropic mechanical strength?',
    options: ['A) Inter-layer adhesion along the Z-axis is typically weaker than continuous filament paths in XY', 'B) Printers only work in vacuum', 'C) PLA turns into copper', 'D) Nozzles spin at 10,000 RPM'],
    correct_answer: 'A) Inter-layer adhesion along the Z-axis is typically weaker than continuous filament paths in XY',
    explanation: 'Layer boundaries create stress planes; orienting load-bearing features in the XY plane improves tensile strength.',
    vedic_connection: 'Respecting natural grain (Dharma of material) for structural harmony.',
    modern_application: 'Functional drone brackets and robotics fixtures.',
    target_domains: ['3d_printing'],
    tags: ['3D Printing', 'Materials']
  },
  {
    question_id: '3DP-03',
    category: 'System Design & Engineering',
    difficulty: 'hard',
    question_text: 'Which additive manufacturing process uses a high-power laser to fully fuse metal powders like Titanium Ti-6Al-4V?',
    options: ['A) Selective Laser Melting (SLM / LPBF)', 'B) Stereolithography with PLA', 'C) Inkjet paper printing', 'D) Vacuum thermoforming'],
    correct_answer: 'A) Selective Laser Melting (SLM / LPBF)',
    explanation: 'SLM melts fine metallic powder beds under inert argon/nitrogen atmosphere to create near-100% dense aerospace parts.',
    vedic_connection: 'Refining raw elements through intense focused Agni.',
    modern_application: 'Aerospace turbine brackets and patient-specific medical implants.',
    target_domains: ['3d_printing'],
    tags: ['3D Printing', 'SLM', 'Metal']
  },
  {
    question_id: 'QC-01',
    category: 'Mathematics',
    difficulty: 'easy',
    question_text: 'What distinguishes a quantum bit (qubit) from a classical binary bit?',
    options: ['A) A qubit can exist in a coherent linear superposition of |0> and |1>', 'B) A qubit only stores decimal numbers', 'C) A qubit cannot be measured', 'D) A qubit runs at 50 Volts'],
    correct_answer: 'A) A qubit can exist in a coherent linear superposition of |0> and |1>',
    explanation: 'Until measured, a qubit state is alpha|0> + beta|1>, enabling interference across computational paths.',
    vedic_connection: 'Syadvada / subtle unmanifest potential before observation.',
    modern_application: 'Quantum simulation and optimization algorithms.',
    target_domains: ['quantum_computing'],
    tags: ['Quantum', 'Qubit']
  },
  {
    question_id: 'QC-02',
    category: 'Mathematics',
    difficulty: 'medium',
    question_text: 'Which single-qubit quantum gate maps |0> to an equal superposition (|0> + |1>)/sqrt(2)?',
    options: ['A) Hadamard (H) gate', 'B) Pauli-X gate', 'C) Identity gate', 'D) Classical AND gate'],
    correct_answer: 'A) Hadamard (H) gate',
    explanation: 'The Hadamard gate rotates the computational basis into the X-basis superposition states |+> and |->.',
    vedic_connection: 'Opening a single seed into balanced duality.',
    modern_application: 'Quantum circuit initialization in Grover and Shor algorithms.',
    target_domains: ['quantum_computing'],
    tags: ['Quantum', 'Gates', 'Hadamard']
  },
  {
    question_id: 'QC-03',
    category: 'Cybersecurity & Networks',
    difficulty: 'hard',
    question_text: 'Why does Shor’s quantum algorithm motivate the transition to Post-Quantum Cryptography (PQC)?',
    options: ['A) It factors large integers and solves discrete logarithms in polynomial time, threatening RSA and ECC', 'B) It speeds up AES-256 brute force exponentially', 'C) It replaces TCP/IP cables', 'D) It disables TLS certificates'],
    correct_answer: 'A) It factors large integers and solves discrete logarithms in polynomial time, threatening RSA and ECC',
    explanation: 'Large fault-tolerant quantum computers running Shor’s algorithm break RSA/ECDSA, prompting lattice-based PQC standards like ML-KEM.',
    vedic_connection: 'Foresight (Drishti) preparing defenses before future shifts arrive.',
    modern_application: 'NIST Post-Quantum Cryptography migration.',
    target_domains: ['quantum_computing', 'cybersecurity'],
    tags: ['Quantum', 'Cryptography', 'PQC']
  },
  {
    question_id: 'MGT-01',
    category: 'Management & Entrepreneurship',
    difficulty: 'easy',
    question_text: 'In product discovery, what is the primary purpose of a Minimum Viable Product (MVP)?',
    options: ['A) Validate core customer value and learning with minimal engineering effort', 'B) Skip all user testing and spend the entire budget upfront', 'C) Build every possible enterprise feature before launch', 'D) Avoid collecting metrics'],
    correct_answer: 'A) Validate core customer value and learning with minimal engineering effort',
    explanation: 'An MVP tests the riskiest value hypothesis quickly with real users to guide iteration.',
    vedic_connection: 'Sankshipta (concise essence) tested in real-world Karma.',
    modern_application: 'Lean startup launches and SaaS product validation.',
    target_domains: ['web_dev', 'ai_ml_ds'],
    tags: ['Management', 'Product', 'MVP']
  },
  {
    question_id: 'MGT-02',
    category: 'Management & Entrepreneurship',
    difficulty: 'medium',
    question_text: 'For a SaaS business, what does a healthy LTV:CAC ratio (Lifetime Value to Customer Acquisition Cost) typically indicate?',
    options: ['A) Sustainable unit economics where customer value significantly exceeds acquisition spend', 'B) Every customer loses money on renewal', 'C) Zero marketing spend is possible', 'D) Churn is 100%'],
    correct_answer: 'A) Sustainable unit economics where customer value significantly exceeds acquisition spend',
    explanation: 'An LTV:CAC ratio around 3:1 or higher signals scalable growth without burning capital.',
    vedic_connection: 'Artha-shastra principle of balanced sustainable treasury.',
    modern_application: 'Venture strategy, pricing, and SaaS financial modeling.',
    target_domains: [],
    tags: ['Management', 'Finance', 'SaaS']
  }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gurukul_assessment';
    await mongoose.connect(mongoUri);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Seed Study Fields (non-destructive: insert if missing)
    for (const d of defaultDomains) {
      await StudyField.findOneAndUpdate(
        { field_id: d.field_id },
        { $setOnInsert: d },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Verified ${defaultDomains.length} Study Fields`);

    // Seed Extra Question Categories (non-destructive)
    for (const cat of extraCategories) {
      await Category.findOneAndUpdate(
        { category_id: cat.category_id },
        { $setOnInsert: cat },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Verified ${extraCategories.length} New Question Categories`);

    // Seed Curated Domain & Category Questions (non-destructive)
    for (const q of sampleQuestions) {
      await Question.findOneAndUpdate(
        { question_id: q.question_id },
        { $setOnInsert: q },
        { upsert: true, new: true }
      );
    }
    console.log(`✅ Verified ${sampleQuestions.length} Curated Questions across all 13 domains & new categories`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
