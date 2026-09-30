import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APIKEY_FB,
  authDomain: import.meta.env.VITE_AUTHDOMAIN_FB,
  projectId: import.meta.env.VITE_PROJECTID_FB,
  storageBucket: import.meta.env.VITE_STORAGEBUCKET_FB,
  messagingSenderId: import.meta.env.VITE_MESSAGINGSENDERID_FB,
  appId: import.meta.env.VITE_APPID_FB,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
