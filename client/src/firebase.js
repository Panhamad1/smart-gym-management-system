
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaf2F8D0UVu4xCnon3OHlnlPvybTZ1JeQ",
  authDomain: "smart-gym-team2.firebaseapp.com",
  projectId: "smart-gym-team2",
  storageBucket: "smart-gym-team2.firebasestorage.app",
  messagingSenderId: "294671992073",
  appId: "1:294671992073:web:b1ba33982ee208cf07ffd8"
};

// The emulator mode is available only in Vite's development server.
const useEmulators = import.meta.env.DEV && import.meta.env.MODE === "emulator";
const app = initializeApp(useEmulators
  ? { projectId: "demo-smart-gym", apiKey: "emulator-only" }
  : firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
