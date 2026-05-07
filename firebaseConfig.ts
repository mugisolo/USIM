import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from './firebase-applet-config.json';

let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  // @ts-expect-error - firebase-applet-config.json is generated at runtime
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log("U-ISMS Surveillance: Firebase Connection Established");

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