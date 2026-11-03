import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import appletConfig from '../firebase-applet-config.json';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || appletConfig.measurementId || '',
};

export const firestoreDatabaseId =
  env.VITE_FIREBASE_DATABASE_ID ||
  (appletConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId ||
  'ai-studio-92ba9721-4a0b-4c35-8a9c-3966c0c6f514';

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app, firestoreDatabaseId);
const auth: Auth = getAuth(app);

let connectionTested = false;
async function testConnection() {
  if (connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('U-ISMS Surveillance: Firestore Connected Successfully.');
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();

export { app, db, auth };
