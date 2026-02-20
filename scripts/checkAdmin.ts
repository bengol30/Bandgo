// ============================================
// Script to check user admin status
// ============================================

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdmin() {
    const adminEmail = 'bengo0469@gmail.com';

    console.log(`🔍 Checking user: ${adminEmail}`);

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.error('❌ User not found');
        process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log('📋 User Details:');
    console.log('  ID:', userDoc.id);
    console.log('  Email:', userData.email);
    console.log('  Name:', userData.displayName);
    console.log('  Role:', userData.role);
    console.log('  Is Admin:', userData.role === 'admin' ? '✅ YES' : '❌ NO');

    process.exit(0);
}

checkAdmin().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
