import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDL2_5IpJ7Rx0qS7RoQLV2987fw47jgNpw",
  authDomain: "alphanet-8b60f.firebaseapp.com",
  projectId: "alphanet-8b60f",
  storageBucket: "alphanet-8b60f.firebasestorage.app",
  messagingSenderId: "467138234934",
  appId: "1:467138234934:web:b98d946f96a4f1aae2e697",
  measurementId: "G-DN04YB0CXH"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, auth, db, analytics };
