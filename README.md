# ChainGuard AI

**Supply Chain Attack Simulator & Defender powered by Gemini AI**

ChainGuard AI is a React + Vite application for exploring supply chain security through attack simulation, SBOM analysis, AI-powered recommendations, and team collaboration.

## 🚀 Project Overview

This repository contains a full-stack application built with:
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Backend: Express.js
- Database: SQLite via `better-sqlite3`
- Auth and realtime: Supabase
- AI: Groq / Gemini prompt-driven analysis

The app includes:
- Interactive attack simulation scenarios
- AI defender analysis for SBOM and dependency risk
- Simulation history and reporting
- Team chat with realtime notifications
- User authentication and profile management

## ⭐ Key Features

- **Attack Simulator**
  - Predefined supply chain scenarios like Log4Shell, SolarWinds, and Dependency Confusion
  - Interactive attack graphs and compromise visualization
- **AI Defender**
  - SBOM / dependency analysis using Groq-style AI prompts
  - Recommendations, vulnerability summaries, and mitigation guidance
- **Simulation History**
  - Persisted simulation records in SQLite
  - Search, filter, and review past runs
- **Risk Dashboard**
  - Trend charts and security posture summaries
- **Team Collaboration**
  - Supabase-powered team chat and direct messaging
  - Real-time message subscriptions and desktop notifications
- **Floating Chat Assistant**
  - AI chat interface for supply chain security questions
  - Streaming responses for a conversational experience

## 📁 Important Files

- `package.json` - scripts, dependencies, and project metadata
- `server/index.js` - Express backend for AI proxy and SQLite persistence
- `src/App.tsx` - app routing, protected routes, and global listeners
- `src/lib/supabase.ts` - Supabase client initialization
- `src/lib/ai.ts` - AI prompt utilities and streaming chat support
- `src/data/scenarios.ts` - predefined attack scenarios
- `src/components/OnboardingModal.tsx` - user onboarding flow
- `src/components/FloatingChat.tsx` - AI chat widget
- `src/store/*` - Zustand stores for auth, chat, simulation, and team state

## 🧩 Environment Setup

Create a `.env.local` file in the project root with the following values:

```env
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
GROQ_API_KEY=your-groq-api-key
# Optional override for AI API base if not using default /api/groq
VITE_AI_API_URL=
# Optional Gemini API key if direct Gemini integration is used
VITE_GEMINI_API_KEY=your-gemini-api-key
```

The backend server also loads `.env` if present.

## ⚙️ Installation

```bash
npm install
```

## 🧪 Run Locally

```bash
npm run dev
```

This launches the Express backend and Vite dev server together.

## 📦 Build & Preview

```bash
npm run build
npm run preview
```

If you want to run only the backend server:

```bash
npm run server
```

## 🔧 Notes

- `server/index.js` initializes a local SQLite database at `server/chainguard.db` and creates the required tables automatically.
- Supabase is used for authentication, team messaging, profiles, storage, and realtime channels.
- `src/lib/ai.ts` handles AI prompt construction for simulation analysis, SBOM review, mitigation generation, and chat streaming.
- The onboarding experience is managed in `src/components/OnboardingModal.tsx` and persists a seen state in `localStorage`.

## 🛠️ Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express
- Supabase
- better-sqlite3
- Framer Motion
- Recharts
- Lucide React
- Zustand

## 📌 Summary

ChainGuard AI is built to help security teams simulate supply chain attacks and defend software dependencies using AI-driven guidance. It combines interactive visual simulations, SBOM analysis, team collaboration, and a secure auth flow into a single tool.

---

If you want, I can also add a shorter `README` version or a CONTRIBUTING section for this repo.