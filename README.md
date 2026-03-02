# Language Learning App

> A modern, Progressive Web Application for vocabulary learning with spaced repetition, offline support, and multiple exercise types.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff.svg)](https://vitejs.dev/)
[![Material-UI](https://img.shields.io/badge/MUI-7.3.7-007fff.svg)](https://mui.com/)
[![Test Coverage](https://img.shields.io/badge/Coverage-70%25-green.svg)](./docs/TEST_COVERAGE.md)

A feature-rich vocabulary learning platform that leverages scientifically-proven spaced repetition algorithms (FSRS) to optimize language acquisition. Built with modern web technologies for a seamless learning experience across all devices.

🔗 **Repository**: https://github.com/leokotman/language-app

---

## ✨ Features

### 🎯 Core Learning Features
- **🧠 Spaced Repetition System** - Implements ts-fsrs algorithm for optimal review scheduling
- **📖 Multi-Exercise Types** - 8 different exercise modes:
  - ✍️ Flashcards (forward & reverse)
  - ⌨️ Typing exercises
  - 🎯 Multiple choice (forward & reverse)
  - 🎧 Listening comprehension
  - 🎤 Speaking practice with audio recording
- **📊 Intelligent Scoring** - Performance tracking and adaptive difficulty
- **🌍 Multi-Language Support** - Learn multiple language pairs simultaneously

### 💾 Data Management
- **📚 Personal Library** - CRUD operations for vocabulary management
- **🔍 Dictionary Lookup** - Integrated dictionary with offline caching
- **📥 Import/Export** - Backup and restore your vocabulary data
- **☁️ Cloud Sync** - Real-time synchronization with Supabase backend
- **📴 Offline Mode** - Full PWA support with offline caching and sync

### 🎨 User Experience
- **🌓 Dark/Light Theme** - Customizable theme with persistent preferences
- **📱 Responsive Design** - Optimized for mobile, tablet, and desktop
- **🔒 Secure Authentication** - Email/password auth with password recovery
- **⚡ Performance Optimized** - Lazy loading, code splitting, and caching strategies

### 🛠️ Developer Experience
- **✅ High Test Coverage** - 70%+ unit test coverage with Vitest
- **🧪 E2E Testing** - Playwright tests for critical user flows
- **📝 Type Safety** - Full TypeScript implementation
- **🔍 Code Quality** - ESLint, Prettier, and strict commit conventions
- **📖 Comprehensive Documentation** - Extensive docs for setup and architecture

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | ≥18.0.0 | JavaScript runtime |
| **npm** | ≥9.0.0 | Package manager |
| **Supabase Account** | - | Backend & database |
| **Git** | Latest | Version control |

### Optional Tools
- **Docker** (for local Supabase setup)
- **VS Code** with recommended extensions (ESLint, Prettier, TypeScript)

---

## 🚀 Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/leokotman/language-app.git
cd language-app
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4️⃣ Database Setup

Run migrations in your Supabase project (in order):

```bash
# Navigate to Supabase SQL Editor and run:
docs/supabase-migrations/001_profiles.sql
...
docs/supabase-migrations/009_vocabulary_score.sql
```

📖 **Detailed Setup Guide**: See [docs/SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)

### 5️⃣ Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 💻 Usage

This section describes core workflows and how to use the app:

### Learning Workflows
- Create or import vocabulary lists (CSV, JSON)
- Start a study session — the FSRS algorithm will schedule reviews
- Choose exercise types: flashcards, typing, multiple choice, listening, or speaking
- Track progress via the dashboard and review history

### Import / Export
- Export your library to JSON/CSV from the Library page
- Import files via the Library import dialog; map fields to languages and tags

### Offline & Sync
- Use the app offline; changes queue and sync when connectivity returns
- Supabase handles conflict resolution using last-write-wins with timestamps

---

## 🧭 Project Structure

A high level overview:

```
/src
  /components   # Reusable UI components
  /features     # Domain features (study, library, auth, profile)
  /lib          # Utilities, API clients (Supabase), hooks
  /routes       # Route definitions and lazy-loaded pages
  /styles       # Theme and global styles
  main.tsx
  app.tsx
```

Other folders:
- /docs — project documentation, migrations, architecture notes
- /scripts — helper scripts for local dev and migrations
- /playwright — E2E tests

---

## 🧪 Testing

- Unit tests: `npm run test` (Vitest)
- E2E tests: `npm run test:e2e` (Playwright)
- Run coverage: `npm run test:coverage`

---

## 🛠 Development Notes

- Linting: `npm run lint`
- Formatting: `npm run format`
- Commit conventions: Conventional Commits enforced via commitlint and husky
- Local Supabase: Use Docker or `supabase` CLI for a local dev DB

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make changes and run tests
4. Open a PR describing the change and link any relevant issues

Please run linters and tests before opening a PR. For major changes, open an issue first to discuss the design.

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## ✉️ Contact

Maintainer: Leon Kotman — https://github.com/leokotman

*This README was added by an automated assistant. Please review and adjust any project-specific details before merging.*
