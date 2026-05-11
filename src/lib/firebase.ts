import { initializeApp } from 'firebase/app';
import { 
  initializeAuth, 
  browserLocalPersistence, 
  browserPopupRedirectResolver, 
  getAuth 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  doc, 
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence and popup resolver
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

// Initialize Firestore with standard settings.
const databaseId = (firebaseConfig as any).firestoreDatabaseId;

// In some environments, passing '(default)' or empty string can cause issues.
// We only pass the ID if it's explicitly set to an ai-studio instance.
export const db = databaseId && databaseId !== '(default)' 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);

// Simple connectivity check
export async function checkConnectivity() {
  try {
    const connectionDoc = doc(db, 'test', 'connection');
    await getDoc(connectionDoc);
    return true;
  } catch (error: any) {
    if (error?.message?.includes('offline')) {
      console.error("Firestore reports offline. This may be a transient network issue in the preview.");
    } else if (error.code === 'permission-denied') {
      return true; // Connection OK, rules just blocked it
    } else {
      console.warn("Firestore connection check:", error.code || error.message);
    }
    return false;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
