import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent re-initialization on hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Errors that mean the popup never produced a result (blocked, dismissed, or
// duplicated). These should transparently fall back to a full-page redirect,
// which Safari/Mac browsers handle far more reliably than popups.
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

// Sign in with Google. Tries popup first; if the browser blocks or cancels
// it (common on Safari/Mac with strict tracking protection), falls back to
// signInWithRedirect. The redirect path navigates the page away — control
// returns to the auth page on reload, where getRedirectResult finalizes it.
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (e: any) {
    if (POPUP_FALLBACK_CODES.has(e?.code)) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw e;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Auth state listener helper + redirect result reader (used by /auth on mount)
export { onAuthStateChanged, getRedirectResult, type User };
