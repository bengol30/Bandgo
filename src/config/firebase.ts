// ============================================
// bandgo - Firebase Configuration
// ============================================

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// 🚨 PASTE YOUR FIREBASE CONFIGURATION HERE 🚨
// החלף את הערכים למטה בערכים האמיתיים ממסוף Firebase
// (Project Settings -> General -> Your apps -> SDK setup and configuration)

const firebaseConfig = {
    apiKey: "AIzaSyDT_0nf9FAmapNP880x6YWo6KWaUxw5FsA",
    authDomain: "bandgo-75a7b.firebaseapp.com",
    projectId: "bandgo-75a7b",
    storageBucket: "bandgo-75a7b.firebasestorage.app",
    messagingSenderId: "1049601335341",
    appId: "1:1049601335341:web:34ce81382efa3a47a5d8a4",
    measurementId: "G-JXBL01HG29"
};

export { firebaseConfig };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
// Initialize Analytics (optional, invalid in server-side environments but safe in browser)
if (typeof window !== 'undefined') {
    getAnalytics(app);
}

export default app;
