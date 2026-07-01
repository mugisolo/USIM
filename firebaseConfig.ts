import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDocFromServer, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import firebaseConfig from './firebase-applet-config.json';

let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  // @ts-expect-error - firebase-applet-config.json is generated at runtime
  const dbId = firebaseConfig.firestoreDatabaseId || "ai-studio-92ba9721-4a0b-4c35-8a9c-3966c0c6f514";
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
  }, dbId);
  console.log("U-ISMS Surveillance: Firebase Connection Established (Long Polling)");

  // Enable multi-tab offline persistence
  enableMultiTabIndexedDbPersistence(db)
    .then(() => {
      console.log("U-ISMS Surveillance: Offline Persistence Enabled Successfully");
    })
    .catch((err) => {
      console.warn("U-ISMS Surveillance: Offline Persistence initialization deferred or failed", err);
    });

  // Validate connection
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error: any) {
      if (error.message?.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  };
  testConnection();
} catch (e) {
  console.warn("U-ISMS Surveillance: Firestore is unavailable. Operating in local-only mode.", e);
}

export { db };