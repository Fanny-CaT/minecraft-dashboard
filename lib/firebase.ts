import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  projectId: "meowtopia-panel-9812",
  appId: "1:924292768830:web:e0cef1bace2a2f74265d6f",
  storageBucket: "meowtopia-panel-9812.firebasestorage.app",
  apiKey: "AIzaSyBjdtr-yPqd8IiGGYnkaFXdTxcHcSuBo98",
  authDomain: "meowtopia-panel-9812.firebaseapp.com",
  messagingSenderId: "924292768830",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
