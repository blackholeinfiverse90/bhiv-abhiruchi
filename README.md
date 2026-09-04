# 🎓 Gurukul Assessment System (BHIV Abhiruchi)

A full-stack, AI-powered adaptive assessment platform designed for evaluating technical domain proficiency, student intake, and dynamic learning progression. Featuring a 13-Domain multi-select assessment model, Groq AI feedback engine, adaptive question difficulty, dynamic intake forms, and an admin management portal.

---

## 🌟 Key Features

### 🎯 13-Domain Adaptive Assessment Engine
- **13 Specialized Domains**:
  - IoT (Internet of Things)
  - Blockchain Technology
  - Humanoid Robotics
  - AI / Machine Learning / Data Science
  - Drone Technology
  - Biotechnology
  - Pharma Tech
  - Gaming Development
  - VR / AR / Immersive Tech
  - Cyber Security
  - Web Development
  - 3D Printing & Additive Manufacturing
  - Quantum Computing
- **Multi-Domain Selection**: Students can select 1 to 13 domains for multi-disciplinary evaluation.
- **Adaptive Difficulty**: Dynamically balances breadth vs. depth—adjusting question complexity based on domain count.
- **70 Curated Domain Questions**: Real-world application scenarios connected with foundational and Vedic knowledge principles.

### 🤖 Groq AI Evaluation & Assistance Detection
- **Personalized Feedback Engine**: Evaluates subjective and open-ended student answers using the Groq AI Llama 3 / Mixtral models.
- **AI Assistance Detector**: Effort and context-based detection mechanism that measures student response patterns without punitive false positives.
- **Dynamic Question Generation**: Generates adaptive questions on-the-fly aligned with student proficiency and selected study fields.

### ⚙️ AI Controls & Question Toggle System
- **Admin AI Toggle**: Toggle between AI-generated and admin-curated questions at the global or domain field level.
- **AI Settings Dashboard**: Manage AI model parameters, scoring weights, and response generation rules.

### 📋 Dynamic Form & Intake Builder
- Customizable intake forms with conditional fields and progression rules.
- Study field and category management for organizing curriculum assessments.
- Form progression tracking stored seamlessly in database and local states.

### 📊 Admin Portal & Analytics Dashboard
- Comprehensive dashboard for managing students, form configurations, question banks, and category hierarchies.
- Visual domain performance breakdowns and evaluation reports.

---

## 🏗️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, Vite, Tailwind CSS v4, Lucide Icons, React Router v6 |
| **Backend Framework** | Node.js, Express.js (RESTful API Server) |
| **Database** | MongoDB (Mongoose ORM) & Supabase PostgreSQL (Dual Support) |
| **AI Integration** | Groq SDK (`groq-sdk`) featuring Llama-3 & Mixtral models |
| **Authentication** | JWT + bcryptjs (Express Auth), Supabase OAuth (Google), optional Clerk integration |
| **Testing & Tooling** | Playwright, ESLint 9, Nodemon |

---

## 📁 Repository Structure

```
gurukul-assesment/
├── client/                          # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/              # UI components (DomainSelector, MultiDomainResults, FormBuilder, etc.)
│   │   ├── context/                 # AuthContext, AssessmentGuardContext
│   │   ├── lib/                     # API client, AI detection, multi-domain assessment services
│   │   ├── pages/                   # Intake, Dashboard, Admin, Auth, MultiDomainTest
│   │   └── data/                    # Static question banks and study field defaults
│   ├── package.json
│   └── vite.config.js
├── server/                          # Express.js + MongoDB API Backend
│   ├── config/                      # MongoDB connection (db.js)
│   ├── controllers/                 # AI, Auth, Category, Field, Form, Question, Student controllers
│   ├── middleware/                  # Auth Middleware (JWT & Clerk support)
│   ├── models/                      # Mongoose Schemas (User, Student, Question, FormConfig, etc.)
│   ├── routes/                      # REST API Endpoint definitions
│   ├── scripts/                     # Seed scripts (`seed.js`, `seedUsers.js`)
│   ├── server.js                    # Express app entry point
│   └── package.json
├── supabase/                        # PostgreSQL SQL Migration & RLS Policy Scripts
│   ├── migrate_to_13_domains.sql
│   ├── insert_70_domain_questions.sql
│   └── verify_installation.sql
├── scripts/                         # Question/field generator helper scripts
├── package.json                     # Root workspace configuration & scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** (v9.x or higher)
- **MongoDB** (running locally or a MongoDB Atlas URI)
- **Groq API Key** (obtainable from [Groq Console](https://console.groq.com/))

---

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/blackholeinfiverse90/bhiv-abhiruchi.git
cd bhiv-abhiruchi
```

Install client and server dependencies:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install

cd ..
```

---

### 2. Environment Configuration

#### Server Environment Setup (`server/.env`)
Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gurukul_assessment
CORS_ORIGIN=http://localhost:5173

# Groq AI Key
GROQ_API_KEY=your_groq_api_key_here

# Optional Authentication Keys
CLERK_SECRET_KEY=your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

#### Client Environment Setup (`client/.env`)
Create a `.env` file in the `client/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GROK_API_KEY=your_groq_api_key_here

# Optional Supabase Integration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### 3. Database Initialization & Seeding

Seed default categories, question banks, and admin credentials into MongoDB:

```bash
# Run seed script from server directory
npm run seed --prefix server

# Seed default admin users
npm run seed:users --prefix server
```

---

### 4. Running the Application

Start the client and server using workspace root scripts:

```bash
# Run Client Frontend (Vite on http://localhost:5173)
npm run dev

# Run Server Backend (Express on http://localhost:5000)
npm run server
```

Or run them independently in separate terminals:

```bash
# Terminal 1: Frontend
cd client
npm run dev

# Terminal 2: Backend API
cd server
npm run dev
```

---

## 📡 REST API Reference

The backend Express server provides the following REST API endpoints under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and status verification |
| `POST` | `/api/auth/login` | Authenticate user / admin and receive JWT token |
| `POST` | `/api/auth/register` | Register new user account |
| `GET` | `/api/fields` | Retrieve list of study fields / domains |
| `GET` | `/api/questions` | Fetch questions filtered by domain/category |
| `POST` | `/api/questions` | Create a new curated question (Admin) |
| `GET` | `/api/students` | Get list of registered student intake records |
| `POST` | `/api/students` | Submit new student intake assessment data |
| `POST` | `/api/ai/evaluate` | Evaluate student responses via Groq AI Engine |
| `GET` | `/api/categories` | Manage question categories |
| `GET` | `/api/forms` | Get dynamic form configurations |

---

## 📊 Supabase / PostgreSQL Setup (Optional)

If using Supabase PostgreSQL alongside or in place of MongoDB:

1. Open your **Supabase SQL Editor**.
2. Run `supabase/migrate_to_13_domains.sql` to initialize domain schemas.
3. Run `supabase/insert_70_domain_questions.sql` to load the curated domain questions.
4. Run `supabase/verify_installation.sql` to verify database health.

---

## 📄 Documentation & References

Detailed architectural guides located in the project:
- [13 Domain System Documentation](13_DOMAIN_SYSTEM_README.md)
- [System Flow Diagram](SYSTEM_FLOW_DIAGRAM.md)
- [AI Settings System Specification](AI_SETTINGS_SYSTEM.md)
- [Dynamic Categories Implementation](DYNAMIC_CATEGORIES_IMPLEMENTATION.md)
- [Field-Based Assessment System](FIELD_BASED_ASSESSMENT_SYSTEM.md)

---

## 📜 License

This project is maintained under the BHIV Engineering ecosystem.