
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaf2F8D0UVu4xCnon3OHlnlPvybTZ1JeQ",
  authDomain: "smart-gym-team2.firebaseapp.com",
  projectId: "smart-gym-team2",
  storageBucket: "smart-gym-team2.firebasestorage.app",
  messagingSenderId: "294671992073",
  appId: "1:294671992073:web:b1ba33982ee208cf07ffd8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
