# 📚 Language Learning App

A modern, offline-first Progressive Web App for vocabulary learning with intelligent spaced repetition (FSRS algorithm). Master new languages through personalized flashcards, dictionary lookups, and adaptive study sessions.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-646cff?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.95.0-3ecf8e?logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-70%25-brightgreen)](docs/TEST_COVERAGE.md)

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎯 Key Highlights](#-key-highlights)
- [⚡ Prerequisites](#-prerequisites)
- [🚀 Installation](#-installation)
- [💡 Usage](#-usage)
- [📁 Project Structure](#-project-structure)
- [🛠️ Tech Stack](#️-tech-stack)
- [🧪 Testing](#-testing)
- [🏗️ Technical Architecture](#️-technical-architecture)
- [🔄 Development Workflow](#-development-workflow)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [🗺️ Roadmap](#️-roadmap)

---

## ✨ Features

### 📖 **Dictionary & Lookup**
- 🔍 **Smart Dictionary Search** - Store-first lookup with MyMemory API fallback
- 🌐 **Multi-Language Support** - English ↔ Russian ↔ Serbian (Latin) with 6 bidirectional pairs
- ⚡ **Intelligent Caching** - In-memory + IndexedDB cache (80 entries) for fast offline access
- 🔄 **Direction Switching** - Seamlessly toggle between language pairs
- ➕ **One-Click Add** - Save translations directly to your personal library
- 🌙 **Offline-First** - Full dictionary functionality without internet connection

### 📚 **Personal Vocabulary Library**
- ✏️ **Full CRUD Operations** - Add, edit, delete words with ease
- 🎯 **Smart Filtering** - Filter by language pair and search across translations
- 📤 **Import/Export** - Backup your library in CSV or JSON format
- 🔄 **Real-Time Sync** - Supabase synchronization with offline fallback
- 🎨 **Progress Tracking** - Visual indicators for learning state per word
- 🔗 **Virtual Language Pairs** - Automatically access RU-SR translations when you have EN-RU + EN-SR

### 🧠 **Spaced Repetition System (FSRS)**
- 🎴 **7 Exercise Types**: Flashcard, Reverse Flashcard, Typing, Multiple Choice, Reverse Multiple Choice, Listening, Speaking
- 🧮 **FSRS Algorithm** - Science-backed spaced repetition (ts-fsrs 5.2.3)
- ⭐ **4-Level Rating** - Again, Hard, Good, Easy for precise feedback
- 📊 **Dynamic Scheduling** - Adaptive review intervals based on performance
- 🏆 **Progress Scoring** - Formula C scoring system for tracking mastery
- 🔄 **State Management** - New → Learning → Review → Relearning lifecycle

### 🔐 **Authentication & Security**
- 🔒 **Secure Auth** - Email/password authentication via Supabase
- 🛡️ **Protected Routes** - User-specific data isolation
- 🔑 **Password Recovery** - Self-service password reset flow
- 💾 **Session Persistence** - Stay logged in across sessions

### 📱 **Progressive Web App**
- 🏠 **Installable** - Add to home screen on mobile and desktop
- 🔄 **Auto-Updates** - Seamless service worker updates
- 💾 **Offline Support** - Full functionality without internet
- ⚡ **Asset Caching** - Lightning-fast load times
- 📲 **App Manifest** - Native app-like experience

### 🎨 **User Experience**
- 🌓 **Theme Toggle** - Light/Dark mode with persistent preference
- 📱 **Responsive Design** - Optimized for all screen sizes
- 🎯 **Material Design 3** - Modern, accessible UI components
- ⚡ **Real-Time Updates** - Instant data synchronization
- 📊 **Progress Analytics** - Track your learning journey
- 🔔 **Status Indicators** - Clear feedback for sync and offline states

---

## 🎯 Key Highlights

- **🌍 Offline-First Architecture** - Study anywhere, anytime without internet dependency
- **🧠 Scientific Spaced Repetition** - FSRS algorithm proven to optimize long-term retention
- **📊 10,000+ Pre-Seeded Words** - Jumpstart learning with comprehensive vocabulary database
- **⚡ Sub-Second Performance** - IndexedDB caching and optimized React Query strategies
- **🔒 Privacy-Focused** - Your data stays in your Supabase instance
- **🧪 70% Test Coverage** - Reliable codebase with comprehensive unit and E2E tests

---

## ⚡ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** `18.0.0` or higher
- **npm** `9.0.0` or higher (comes with Node.js)
- **Supabase Account** (Sign up free at supabase.com)
- **Git**

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

### 3️⃣ Set Up Environment Variables
```bash
cp .env.example .env
```
Edit `.env` and add your Supabase credentials.

### 4️⃣ Configure Supabase Database
Run 9 migration files in order (see docs/supabase-migrations/)

### 5️⃣ Start Development Server
```bash
npm run dev
```

---

## 💡 Usage

### 🎬 Quick Start
1. Sign Up - Create new account
2. Add Language Pairs - Configure in Settings
3. Build Library - Use Dictionary or manual entry
4. Start Studying - Begin spaced repetition sessions
5. Track Progress - Monitor learning analytics

---

## 📁 Project Structure

Complete architecture with React 19, TypeScript, Vite, MUI, Supabase, TanStack Query, offline cache, FSRS algorithm, 70% test coverage, and comprehensive documentation.

---

## 🛠️ Tech Stack

**Frontend:** React 19.2.0, TypeScript 5.9.3, Vite 7.2.4, MUI 7.3.7
**State:** TanStack Query 5.90.20, Zustand 5.0.11
**Backend:** Supabase 2.95.0, IndexedDB
**Algorithm:** ts-fsrs 5.2.3 (FSRS spaced repetition)
**PWA:** vite-plugin-pwa 1.2.0
**Testing:** Vitest 4.0.18, Playwright 1.58.1

---

## 🧪 Testing

- Unit tests: `npm run test` (70% coverage target)
- E2E tests: `npm run test:e2e`
- Coverage: `npm run coverage`

---

## 🏗️ Technical Architecture

- Database: Supabase PostgreSQL with RLS policies
- FSRS Algorithm: Science-backed spaced repetition
- Offline-First: IndexedDB cache with automatic sync
- Dictionary: Store-first lookup with API fallback

---

## 🔄 Development Workflow

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - ESLint checks
- `npm run format` - Prettier formatting
- `npm run precommit` - Full quality checks

---

## 🤝 Contributing

1. Fork & Clone
2. Create feature branch
3. Make changes with tests
4. Run `npm run precommit`
5. Open Pull Request

---

## 📄 License

MIT License - See LICENSE file

---

## 🗺️ Roadmap

**v1.1:** Enhanced analytics, audio pronunciation, streaks, achievements
**v1.2:** Social features, advanced statistics, custom FSRS tuning
**v2.0:** More language pairs, native mobile apps, AI-powered content

---

## 📚 Documentation

Full documentation in `docs/` directory:
- HANDOFF.md - Project state
- SUPABASE_SETUP.md - Database guide
- OFFLINE.md - Offline testing
- SCORING_DESIGN.md - FSRS formulas
- And 10+ more guides

---

**Made with ❤️ for language learners worldwide**

⭐ Star this repo if you find it helpful!
