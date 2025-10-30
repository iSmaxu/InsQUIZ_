import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCGFQPk4idrDgFpl1f0ixKF7D63vLYjZGA",
  authDomain: "insquiz-admin.firebaseapp.com",
  databaseURL: "https://insquiz-admin-default-rtdb.firebaseio.com",
  projectId: "insquiz-admin",
  storageBucket: "insquiz-admin.firebasestorage.app",
  messagingSenderId: "236979447253",
  appId: "1:236979447253:web:08c9075dbfa1183fa9095c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
export default app;
