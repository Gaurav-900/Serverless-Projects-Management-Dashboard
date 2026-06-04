// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAg3Lat33sUi6T214z3toM5qeJTR2Mi_4M",
  authDomain: "admin-project-page.firebaseapp.com",
  projectId: "admin-project-page",
  storageBucket: "admin-project-page.firebasestorage.app",
  messagingSenderId: "893755247841",
  appId: "1:893755247841:web:d051ecbf4e3aa5e8adbba0",
  measurementId: "G-YHFBGGZ10C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);