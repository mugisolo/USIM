import { db } from '../firebaseConfig';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, getDocs, where } from "firebase/firestore";
import { Incident, PEPProfile, StrategicAsset } from '../types';
import { getAuth } from "firebase/auth";

const auth = getAuth();

// Collection References
const INCIDENTS_COL = 'incidents';
const PEP_PROFILES_COL = 'pep_profiles';
const ASSETS_COL = 'strategic_assets';
const CHATS_COL = 'chats';
const USERS_COL = 'users';

interface FirestoreErrorInfo {
  error: string;
  operationType: string;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Chat Persistence
 */
export const saveChatMessage = async (userId: string, role: 'user' | 'model', text: string) => {
    if (!db) return;
    try {
        await addDoc(collection(db, CHATS_COL), {
            userId,
            role,
            text,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleFirestoreError(error, 'create', CHATS_COL);
    }
};

export const subscribeToChatHistory = (
    userId: string,
    onData: (messages: any[]) => void,
    onError?: (error: any) => void
) => {
    if (!db) return () => {};
    
    const q = query(
        collection(db, CHATS_COL), 
        where("userId", "==", userId),
        orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data());
        onData(messages);
    }, (error) => {
        handleFirestoreError(error, 'list', CHATS_COL);
        if (onError) onError(error);
    });
};

/**
 * User Metadata & Super User Status
 */
export const updateUserMetadata = async (userId: string, data: any) => {
    if (!db) return;
    try {
        const userDocRef = doc(db, USERS_COL, userId);
        const userDoc = await getDocs(query(collection(db, USERS_COL), where("userId", "==", userId)));
        
        if (userDoc.empty) {
            await addDoc(collection(db, USERS_COL), {
                ...data,
                userId,
                updatedAt: new Date().toISOString()
            });
        } else {
            await updateDoc(doc(db, USERS_COL, userDoc.docs[0].id), {
                ...data,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {
        handleFirestoreError(error, 'write', USERS_COL);
    }
};

export const subscribeToUserMetadata = (
    userId: string,
    onData: (data: any) => void
) => {
    if (!db) return () => {};
    const q = query(collection(db, USERS_COL), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
            onData(snapshot.docs[0].data());
        }
    });
};

/**
 * ONE-TIME SEED FUNCTION
 */

function handleFirestoreError(error: unknown, operationType: string, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Subscribe to Incidents
 */
export const subscribeToIncidents = (
    onData: (_data: Incident[]) => void, 
    onError?: (_error: any) => void
) => {
    if (!db) return () => {}; 

    const q = query(collection(db, INCIDENTS_COL), orderBy('date', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
        const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Incident[];
        onData(incidents);
    }, (error) => {
        handleFirestoreError(error, 'list', INCIDENTS_COL);
        if (onError) onError(error);
    });
};

export const addIncidentToDb = async (incident: Incident) => {
    if (!db) return;
    try {
        const cleanedData = { ...incident } as any;
        delete cleanedData.id;
        await addDoc(collection(db, INCIDENTS_COL), cleanedData);
    } catch (error) {
        handleFirestoreError(error, 'create', INCIDENTS_COL);
    }
};

export const deleteIncidentFromDb = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, INCIDENTS_COL, id));
    } catch (error) {
        handleFirestoreError(error, 'delete', `${INCIDENTS_COL}/${id}`);
    }
};

/**
 * Subscribe to PEP Profiles
 */
export const subscribeToParliamentary = (
    onData: (_data: PEPProfile[]) => void,
    onError?: (_error: any) => void
) => {
    if (!db) return () => {};
    
    return onSnapshot(collection(db, PEP_PROFILES_COL), (snapshot) => {
        const peps = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PEPProfile[];
        onData(peps);
    }, (error) => {
        handleFirestoreError(error, 'list', PEP_PROFILES_COL);
        if (onError) onError(error);
    });
};

/**
 * Upsert PEP Profile (Merge if exists, otherwise create)
 * Identity based on exact Name and exact Constituency.
 */
export const addParliamentaryToDb = async (pep: PEPProfile) => {
    if (!db) return;
    try {
        const pepCol = collection(db, PEP_PROFILES_COL);
        
        // Search for existing record with same name and constituency
        const q = query(
            pepCol, 
            where("name", "==", pep.name),
            where("country", "==", pep.country || 'Uganda')
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0];
            const existingData = existingDoc.data() as PEPProfile;
            
            // Merge logic: new values override old ones, 
            // but we append intelligence dossiers if they are unique.
            const mergedData = {
                ...existingData,
                ...pep,
                country: pep.country || existingData.country || 'Uganda',
                intelligenceDossier: (pep.intelligenceDossier && existingData.intelligenceDossier !== pep.intelligenceDossier)
                    ? `${existingData.intelligenceDossier}\n\n[MERGED UPDATE]: ${pep.intelligenceDossier}`
                    : existingData.intelligenceDossier || pep.intelligenceDossier,
                updatedAt: new Date().toISOString()
            };
            
            // Cleanup: remove id if it slipped in
            const cleanedData = { ...mergedData } as any;
            delete cleanedData.id;
            await updateDoc(doc(db, PEP_PROFILES_COL, existingDoc.id), cleanedData);
            console.log(`Successfully merged intelligence for ${pep.name} in ${pep.constituency}`);
        } else {
            // New record
            const cleanedData = { ...pep } as any;
            delete cleanedData.id;
            await addDoc(pepCol, {
                ...cleanedData,
                country: pep.country || 'Uganda',
                createdAt: new Date().toISOString()
            });
            console.log(`Created new PEP record for ${pep.name}`);
        }
    } catch (error) {
        handleFirestoreError(error, 'write', PEP_PROFILES_COL);
    }
};

export const deleteParliamentaryFromDb = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, PEP_PROFILES_COL, id));
    } catch (error) {
        handleFirestoreError(error, 'delete', `${PEP_PROFILES_COL}/${id}`);
    }
};

/**
 * Subscribe to Strategic Assets
 */
export const subscribeToAssets = (
    onData: (_data: StrategicAsset[]) => void,
    onError?: (_error: any) => void
) => {
    if (!db) return () => {};
    
    return onSnapshot(collection(db, ASSETS_COL), (snapshot) => {
        const assets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as StrategicAsset[];
        onData(assets);
    }, (error) => {
        handleFirestoreError(error, 'list', ASSETS_COL);
        if (onError) onError(error);
    });
};

export const addAssetToDb = async (asset: StrategicAsset) => {
    if (!db) return;
    try {
        const cleanedData = { ...asset } as any;
        delete cleanedData.id;
        await addDoc(collection(db, ASSETS_COL), cleanedData);
    } catch (error) {
        handleFirestoreError(error, 'create', ASSETS_COL);
    }
};

/**
 * Deduplicate PEP Data
 * Scans the database for peps with the same name and constituency, retaining only one.
 */
export const deduplicatePEPs = async (peps: PEPProfile[]) => {
    if (!db) return;
    
    const seen = new Map<string, string>(); // name|country -> id
    const duplicates: string[] = [];

    for (const pep of peps) {
        const country = pep.country || 'Uganda';
        const key = `${pep.name.toLowerCase().trim()}|${country.toLowerCase().trim()}`;
        if (seen.has(key)) {
            duplicates.push(pep.id);
        } else {
            seen.set(key, pep.id);
        }
    }

    if (duplicates.length === 0) {
        alert("No duplicates detected in the active ledger.");
        return;
    }

    if (!window.confirm(`Detected ${duplicates.length} duplicate entities. Proceed with neutralization?`)) return;

    try {
        for (const id of duplicates) {
            await deleteDoc(doc(db, PEP_PROFILES_COL, id));
        }
        alert(`Successfully neutralized ${duplicates.length} duplicate nodes.`);
    } catch (err) {
        console.error("Deduplication Error:", err);
        alert("Sanitization protocol failed.");
    }
};

/**
 * ONE-TIME SEED FUNCTION
 */
export const seedDatabase = async (
    incidents: Incident[], 
    pepProfiles: PEPProfile[],
    assets: StrategicAsset[]
) => {
    if (!db) {
        alert("Firebase not configured. Please check firebaseConfig.ts");
        return;
    }

    if (!window.confirm("This will upload current data to Firestore. Continue?")) return;

    try {
        console.log("Seeding Incidents...");
        for (const i of incidents) {
            const cleanedData = { ...i } as any;
            delete cleanedData.id;
            await addDoc(collection(db, INCIDENTS_COL), cleanedData);
        }

        console.log("Seeding PEPs...");
        for (const c of pepProfiles) {
            const cleanedData = { ...c } as any;
            delete cleanedData.id;
            await addDoc(collection(db, PEP_PROFILES_COL), cleanedData);
        }

        console.log("Seeding Assets...");
        for (const a of assets) {
            const cleanedData = { ...a } as any;
            delete cleanedData.id;
            await addDoc(collection(db, ASSETS_COL), cleanedData);
        }
        
        alert("Database Seeding Complete!");
    } catch (e: any) {
        console.error("Seeding Error:", e);
        handleFirestoreError(e, 'write', "bulk_seed");
    }
};