import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
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

// Sign in with Google. Tries the popup flow first; on browsers that block
// it (Mac Safari, Chrome with strict popup settings, mobile in-app
// webviews) we fall back to a full-page redirect. After the redirect
// round trip, AuthContext's onAuthStateChanged picks up the new session
// and the /auth page's listener routes the user to /dashboard.
//
// We only fall back on `auth/popup-blocked` and the env-not-supported
// code — NOT on `auth/popup-closed-by-user` or `auth/cancelled-popup-
// request`, which mean the user themselves dismissed the popup. Those
// should bubble up so the page can show "sign-in cancelled" instead of
// silently triggering an unexpected full-page redirect.
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    const popupBlocked =
      err?.code === "auth/popup-blocked" ||
      err?.code === "auth/operation-not-supported-in-this-environment";
    if (popupBlocked) {
      console.info("[auth] popup blocked, falling back to redirect", err.code);
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Auth state listener helper
export { onAuthStateChanged, type User };
