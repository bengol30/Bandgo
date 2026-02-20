// ============================================
// Script to set user as admin
// Run once to make bengo0469@gmail.com an admin
// ============================================

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../src/config/firebase';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setAdmin() {
    const adminEmail = 'bengo0469@gmail.com';

    console.log(`🔍 Looking for user: ${adminEmail}`);

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        console.error('❌ User not found. Please sign up first with Google.');
        process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    console.log(`✅ Found user: ${userDoc.id}`);

    // Update role to admin
    await updateDoc(doc(db, 'users', userDoc.id), {
        role: 'admin',
        updatedAt: new Date()
    });

    console.log('🎉 User is now an admin!');
    process.exit(0);
}

setAdmin().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
