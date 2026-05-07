# Migration Prompt for U-ISMS (Uganda Integrated Strategic Monitoring System)

To migrate this application to another Gemini AI Studio account, copy and paste the following prompt into a new project in that account.

---

## CONTEXT: U-ISMS (Uganda Integrated Strategic Monitoring System) Dashboard

You are an expert full-stack developer. Your task is to replicate the "Uganda Integrated Strategic Monitoring System (U-ISMS)" — a sophisticated intelligence tool for analyzing the geopolitical and national security landscape.

### CORE IDENTITY & AI PERSONA: "MUGI-SOLO"
The heart of this app is **Mugi-Solo**, an advanced AI strategic intelligence engine. Mugi-Solo has:
1.  **Hyper-Local Intelligence**: Deep knowledge of Uganda's NRM system, LC structures, ISO/DISO/GISO hierarchies, Mayumba-Kumi (10-house cells), and clan dynamics.
2.  **Council of Strategists**: The ability to synthesize ideologies from Sun Tzu, Chanakya, Napoleon, Genghis Khan, Che Guevara, Gandhi, and others.
3.  **High-Command Briefs**: Generates detailed, narrative-driven intelligence briefings for the Presidential High-Command.

### TECH STACK
- **Frontend**: React 18 (Vite), Tailwind CSS (for styling), Lucide-React (icons).
- **Backend / Database**: Firebase (Firestore for data/chat persistence, Firebase Auth for security).
- **AI**: Gemini 1.5 Pro/Flash via `@google/genai` SDK.
- **Visuals**: Recharts for data viz, custom SVG maps for mission tracking.
- **Animations**: Framer Motion for UI transitions.

### FILE STRUCTURE & KEY MODULES
1.  **`types.ts`**: Defines the rigorous interfaces for Incidents, PEP (Politically Exposed Persons) Profiles, Strategies, and Results.
2.  **`services/geminiService.ts`**: The AI engine. Contains `chatWithAnalyst`, `generateDeepMindAnalysis`, and the U-ISMS core directive.
3.  **`services/firestoreService.ts`**: Handles DB logic. Implements chat persistence, real-time sync for incidents/PEPs, and user metadata management.
4.  **`services/authService.ts`**: Manages Google Auth.
5.  **`components/Chatbot.tsx`**: The persistent Mugi-Solo chat interface with history.
6.  **`components/PEPAnalytics.tsx`**: A massive dashboard for tracking Strategic Actors (PEPs), featuring AI strategy generators and bulk ingestion tools.
7.  **`components/ReportAnalyzer.tsx`**: A dedicated "Intelligence Center" terminal for complex strategic queries.

### SECURITY & ELEVATED ACCESS
1.  **Password Protection**: Admin mode is toggled via a password `@Kaw3123`.
2.  **Super User Trigger**: Typing the phrase `"mugisolo 917846"` in the Chatbot elevates the user to **Super User** (Mugisa Solomon Byakutaaga), granting bypass access in Firestore rules for all intelligence nodes.

### DATA SCHEMA (Firebase Blueprint)
- **`/incidents`**: Location-based security events (date, type, fatalities, osintReport).
- **`/pep_profiles`**: Strategic actor dossiers (name, constituency, party, intelligenceDossier).
- **`/chats`**: History of conversations (userId, role, text, timestamp).
- **`/users`**: Metadata (isSuperUser, accessCodeUsed, email).

### MIGRATION INSTRUCTIONS
1.  **Replicate the Code**: Start by creating the core services and types.
2.  **Setup Firebase**: Run the Firebase setup tool. Use the provided `firebase-blueprint.json` and `firestore.rules`.
3.  **Seed Data**: Use the provided `seedData.ts` to populate the initial nodes.
4.  **Configure API Key**: Ensure `GEMINI_API_KEY` is set.
5.  **Environment Sync**: Use `.env.example` to ensure all needed variables are tracked.

---

### ACTION: REPLICATE THE FULL CODEBASE
Please analyze the existing file tree and recreate the functional logic of the U-ISMS suite, ensuring the **Mugi-Solo** persona and **Hyper-Local Intelligence** directives are perfectly preserved in the system prompts.
