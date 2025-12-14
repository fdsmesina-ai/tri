import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/storage";
import "firebase/auth";

// Configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Config using your provided credentials
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyDCim2OWS9y8_Odd2v4C-YS8xkZNh89YgY",
  authDomain: "trial-3815b.firebaseapp.com",
  projectId: "trial-3815b",
  storageBucket: "trial-3815b.firebasestorage.app",
  messagingSenderId: "181346026998",
  appId: "1:181346026998:web:f28ebb1d6a95dbecf3b3d7",
  measurementId: "G-JFMRSXEWHJ"
};

// Initialize Firebase (singleton pattern for v8/compat)
const app = !firebase.apps.length 
  ? firebase.initializeApp(firebaseConfig) 
  : firebase.app();

// Export services using v8/compat API
export const db = firebase.firestore();
export const storage = firebase.storage();
export const auth = firebase.auth();

export default app;