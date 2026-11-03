import { signInWithPopup, GoogleAuthProvider, signOut, User } from "firebase/auth";
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

const provider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Persist and synchronize user record with Firestore
    if (user && db) {
      const isDirector = user.email === 'mugisolo@gmail.com';
      await setDoc(doc(db, 'users', user.uid), {
        userId: user.uid,
        email: user.email,
        displayName: isDirector ? 'Comrade Mugisolo (Director of Strategic Oversight)' : (user.displayName || 'Intelligence Liaison'),
        photoURL: user.photoURL || null,
        role: isDirector ? 'Director of Strategic Oversight' : 'Intelligence Liaison',
        isSuperUser: isDirector,
        clearance: isDirector ? 'LEVEL 5 — PRESIDENTIAL HIGH COMMAND' : 'LEVEL 3 — OPERATIONAL',
        lastLogin: new Date().toISOString(),
      }, { merge: true });
    }

    return user;
  } catch (error) {
    console.error("Google Auth Login Error:", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

export { auth };
