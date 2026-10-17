import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, UserCredential } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD_ace_dummy_auth_key_2026",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "team-ace-platform.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "team-ace-platform",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "team-ace-platform.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "102938475601",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:102938475601:web:98a7b6c5d4e3",
};

// Initialize Firebase safely on client
let app;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== "undefined") {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.warn("Firebase initialization notice:", err);
  }
}

export { auth, googleProvider };

export async function signInWithFirebaseGoogle(): Promise<{
  success: boolean;
  email?: string;
  displayName?: string;
  photoURL?: string;
  error?: string;
}> {
  if (!auth || !googleProvider) {
    return { success: false, error: "Firebase is initializing..." };
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
