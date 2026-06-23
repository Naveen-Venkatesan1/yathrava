import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBtg8pfnQgFvZTJxHyd1EwRNEQR-M_LPBs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "yathrava-854cb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "yathrava-854cb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "yathrava-854cb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "625436604699",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:625436604699:web:7bd6518f798542101cfbbe",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-C5HSTD6MM3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
export const db = getFirestore(app);
export default app;
