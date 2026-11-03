import { db, auth } from '../firebaseConfig';
import { collection, addDoc, setDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy, getDocs, where } from "firebase/firestore";
import { Incident, PEPProfile, StrategicAsset, PEPRegistryRecord } from '../types';

// Collection References
const INCIDENTS_COL = 'incidents';
const PEP_PROFILES_COL = 'pep_profiles';
const ASSETS_COL = 'strategic_assets';
const PEP_REGISTRY_COL = 'pep-registry';
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
export const saveChatMessage = async (
    userId: string, 
    role: 'user' | 'model', 
    text: string, 
    modelTier: string = 'gemini-3.8-flash'
) => {
    if (!db) return;
    try {
        await addDoc(collection(db, CHATS_COL), {
            userId,
            role,
            text,
            modelTier,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleFirestoreError(error, 'create', CHATS_COL);
    }
};

export const clearChatHistory = async (userId: string) => {
    if (!db) return;
    try {
        const q = query(collection(db, CHATS_COL), where("userId", "==", userId));
        const snapshot = await getDocs(q);
        const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, CHATS_COL, d.id)));
        await Promise.all(deletePromises);
    } catch (error) {
        handleFirestoreError(error, 'delete', CHATS_COL);
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
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
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
        const userRef = doc(db, USERS_COL, userId);
        const isDirector = auth.currentUser?.email === 'mugisolo@gmail.com' || data.email === 'mugisolo@gmail.com';
        await setDoc(userRef, {
            ...data,
            userId,
            email: auth.currentUser?.email || data.email || null,
            isSuperUser: isDirector || data.isSuperUser || false,
            role: isDirector ? 'Director of Strategic Oversight' : (data.role || 'Intelligence Liaison'),
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (error) {
        handleFirestoreError(error, 'write', `${USERS_COL}/${userId}`);
    }
};

export const subscribeToUserMetadata = (
    userId: string,
    onData: (data: any) => void
) => {
    if (!db) return () => {};
    const userRef = doc(db, USERS_COL, userId);
    return onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
            onData(snapshot.data());
        }
    }, (error) => {
        handleFirestoreError(error, 'get', `${USERS_COL}/${userId}`);
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
  };
  let serializedErr: string;
  try {
    serializedErr = JSON.stringify(errInfo);
  } catch (err) {
    serializedErr = `Firestore Error: [Non-serializable error details. Original message: ${errInfo.error}]`;
  }
  console.error('Firestore Error: ', serializedErr);
  throw new Error(serializedErr);
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

export const updateAssetStatusInDb = async (id: string, status: StrategicAsset['status']) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, ASSETS_COL, id), { status });
    } catch (error) {
        handleFirestoreError(error, 'write', `${ASSETS_COL}/${id}`);
    }
};

export const deleteAssetFromDb = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, ASSETS_COL, id));
    } catch (error) {
        handleFirestoreError(error, 'delete', `${ASSETS_COL}/${id}`);
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

/**
 * Subscribe to PEP Registry Records (Forensics)
 */
export const subscribeToPEPRegistry = (
    onData: (records: PEPRegistryRecord[]) => void,
    onError?: (error: any) => void
) => {
    if (!db) return () => {};
    
    return onSnapshot(collection(db, PEP_REGISTRY_COL), (snapshot) => {
        const records = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as PEPRegistryRecord[];
        onData(records);
    }, (error) => {
        handleFirestoreError(error, 'list', PEP_REGISTRY_COL);
        if (onError) onError(error);
    });
};

/**
 * Add a new PEP Registry Record
 */
export const addPEPRegistryRecord = async (record: Omit<PEPRegistryRecord, 'id'>) => {
    if (!db) return null;
    try {
        const docRef = await addDoc(collection(db, PEP_REGISTRY_COL), record);
        return docRef.id;
    } catch (error) {
        handleFirestoreError(error, 'write', PEP_REGISTRY_COL);
        return null;
    }
};

/**
 * Update an existing PEP Registry Record
 */
export const updatePEPRegistryRecord = async (id: string, updates: Partial<PEPRegistryRecord>) => {
    if (!db) return;
    try {
        await updateDoc(doc(db, PEP_REGISTRY_COL, id), updates);
    } catch (error) {
        handleFirestoreError(error, 'write', `${PEP_REGISTRY_COL}/${id}`);
    }
};

/**
 * Delete a PEP Registry Record
 */
export const deletePEPRegistryRecord = async (id: string) => {
    if (!db) return;
    try {
        await deleteDoc(doc(db, PEP_REGISTRY_COL, id));
    } catch (error) {
        handleFirestoreError(error, 'delete', `${PEP_REGISTRY_COL}/${id}`);
    }
};

/**
 * Seed PEP Registry with highly realistic data for East African Political Forensics
 */
export const seedPEPRegistry = async () => {
    if (!db) {
        alert("Firestore is not available.");
        return;
    }

    const defaultRecords: Omit<PEPRegistryRecord, 'id'>[] = [
        {
            name: "Comrade Mugisolo",
            role: "Director of Strategic Oversight",
            organization: "State Intelligence Command",
            connections: ["President Museveni", "General Muhoozi", "Amama Mbabazi"],
            influenceWeighting: 95,
            status: "Active",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "General Muhoozi Kainerugaba",
            role: "Chief of Defence Forces (CDF)",
            organization: "Uganda Peoples' Defence Forces (UPDF)",
            connections: ["President Museveni", "Comrade Mugisolo", "Lt. Gen. Kayanja Lutaaya"],
            influenceWeighting: 90,
            status: "Active",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "President Yoweri Museveni",
            role: "Commander-in-Chief & President",
            organization: "Executive Branch of Uganda",
            connections: ["General Muhoozi", "Comrade Mugisolo", "Amama Mbabazi", "Anita Among"],
            influenceWeighting: 98,
            status: "Active",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "Robert Kyagulanyi Ssentamu (Bobi Wine)",
            role: "Opposition Leader",
            organization: "National Unity Platform (NUP)",
            connections: ["Joel Ssenyonyi", "Mathias Mpuuga", "Dr. Kizza Besigye"],
            influenceWeighting: 85,
            status: "Under Investigation",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "Dr. Kizza Besigye",
            role: "Veteran Opposition Leader",
            organization: "Forum for Democratic Change (FDC) - Katonga faction",
            connections: ["Robert Kyagulanyi Ssentamu", "Erias Lukwago"],
            influenceWeighting: 78,
            status: "Under Investigation",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "Anita Among",
            role: "Speaker of Parliament",
            organization: "Parliament of Uganda",
            connections: ["President Museveni", "Thomas Tayebwa"],
            influenceWeighting: 82,
            status: "Active",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "Erias Lukwago",
            role: "Lord Mayor of Kampala",
            organization: "Kampala Capital City Authority (KCCA)",
            connections: ["Dr. Kizza Besigye", "Robert Kyagulanyi Ssentamu"],
            influenceWeighting: 68,
            status: "Active",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
            name: "Amama Mbabazi",
            role: "Special Envoy & Former PM",
            organization: "Executive",
            connections: ["President Museveni", "Comrade Mugisolo"],
            influenceWeighting: 74,
            status: "Active",
            lastUpdated: new Date().toISOString().split('T')[0]
        }
    ];

    try {
        for (const record of defaultRecords) {
            await addDoc(collection(db, PEP_REGISTRY_COL), record);
        }
    } catch (error) {
        console.error("Error seeding PEP registry:", error);
        handleFirestoreError(error, 'write', "seed_pep_registry");
    }
};