# Uganda Integrated Strategic Monitoring System (U-ISMS)

**App Context:** A national security and geopolitical intelligence monitoring platform for tracking real-time kinetic incidents, strategic infrastructure assets, politically exposed persons (PEP) forensics, and AI-synthesized high-command briefings across Uganda and the East African theater.

---

## Architecture Overview

- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Vite (`index.html`, `index.tsx`, `App.tsx`, `components/Dashboard.tsx`)
- **Backend / API Proxy:** Express 5 + WebSocket (`server.ts`) serving `/api/gemini/*` endpoints, `/ws/live-audio` real-time voice briefings, and compiled static assets (`dist/`) in production
- **Database & Auth:** Firebase Authentication (Google Sign-In) & Cloud Firestore (`services/firebase.ts`, `firebaseConfig.ts`, `services/firestoreService.ts`)
- **AI Engine:** `@google/genai` SDK initialized server-side with `new GoogleGenAI({ apiKey: process.env.API_KEY })`

---

## 1. Required Environment Variables

Copy `.env.example` to `.env` for local development or configure the following variables in Google Cloud Run:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `API_KEY` | Server Runtime | Gemini API Key used by `new GoogleGenAI({ apiKey: process.env.API_KEY })` in `server.ts` |
| `GEMINI_API_KEY` | Server Runtime | Fallback alias for `API_KEY` |
| `VITE_FIREBASE_API_KEY` | Client Build | Firebase Web App API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Client Build | Firebase Auth domain (`<project-id>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Client Build | GCP / Firebase Project ID (`gen-lang-client-0760457427`) |
| `VITE_FIREBASE_STORAGE_BUCKET` | Client Build | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Client Build | Firebase Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Client Build | Firebase Web App ID |
| `VITE_FIREBASE_DATABASE_ID` | Client Build | Firestore Database ID (`ai-studio-92ba9721-4a0b-4c35-8a9c-3966c0c6f514` or `(default)`) |
| `PORT` | Server Runtime | HTTP listening port (defaults to `3000`; automatically injected by Cloud Run) |

---

## 2. Firebase Console Setup

1. **Enable Cloud Firestore:**
   - Open the [Firebase Console](https://console.firebase.google.com/) and select your project (`gen-lang-client-0760457427`).
   - Navigate to **Build → Firestore Database** and ensure the database instance is created in Native mode.
2. **Enable Google Authentication:**
   - Navigate to **Build → Authentication → Sign-in method**.
   - Enable the **Google** provider and configure the support email.
   - Under **Authentication → Settings → Authorized domains**, add your Cloud Run service domain (`*.run.app`) so Google Sign-In popups succeed in production.
3. **Deploy Firestore Security Rules & Composite Indexes:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## 3. Local Development & Verification

```bash
# Install dependencies
npm install

# Start full-stack dev server on http://localhost:3000
npm run dev

# Build production frontend bundle
npm run build
```

---

## 4. Deploying to Google Cloud Run

Build and deploy directly from source using the included multi-stage `Dockerfile`:

```bash
gcloud run deploy u-isms-dashboard \
  --source . \
  --region europe-west2 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,API_KEY=YOUR_GEMINI_API_KEY"
```

> **Tip:** For production deployments, store `API_KEY` in **Google Cloud Secret Manager** and mount it via `--set-secrets="API_KEY=gemini-api-key:latest"`.
