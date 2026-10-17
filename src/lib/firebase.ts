import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth, UserCredential } from "firebase/auth";

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY = "ace_firebase_config";

export function getFirebaseConfig(): FirebaseConfig | null {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FirebaseConfig;
        if (parsed.apiKey && !parsed.apiKey.includes("dummy")) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // Fallback to build-time environment variables
  const envKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (envKey && !envKey.includes("dummy")) {
    return {
      apiKey: envKey,
      authDomain:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
        `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    };
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg && cfg.apiKey && cfg.apiKey.length > 10 && !cfg.apiKey.includes("dummy"));
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function setupFirebase(config: FirebaseConfig): { app: FirebaseApp; auth: Auth } {
  try {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(config);
    }
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }

    return { app, auth };
  } catch (err) {
    console.error("Firebase setup error:", err);
    throw err;
  }
}

// Auto-initialize if configuration exists
if (typeof window !== "undefined") {
  const cfg = getFirebaseConfig();
  if (cfg) {
    try {
      setupFirebase(cfg);
    } catch (e) {
      console.warn("Failed to auto-init Firebase with stored config:", e);
    }
  }
}

export async function signInWithFirebaseGoogle(): Promise<{
  success: boolean;
  needsConfig?: boolean;
  email?: string;
  displayName?: string;
  photoURL?: string;
  error?: string;
}> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      needsConfig: true,
      error: "Firebase project credentials not yet connected.",
    };
  }

  const cfg = getFirebaseConfig();
  if (!auth && cfg) {
    setupFirebase(cfg);
  }

  if (!auth || !googleProvider) {
    return {
      success: false,
      error: "Unable to initialize Google Auth provider.",
    };
  }

  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      success: true,
      email: user.email || undefined,
      displayName: user.displayName || undefined,
      photoURL: user.photoURL || undefined,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Google sign-in was not completed.";
    return { success: false, error: errorMsg };
  }
}
