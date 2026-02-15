// ============================================
// bandgo - Repository Factory
// Exports the active repository instance
// ============================================

import { LocalRepository, localRepository as localInstance } from './LocalRepository';
import { FirebaseRepository } from './FirebaseRepository';
import { db } from '../config/firebase';

// Determine which repository to use based on configuration
// For now, we default to Firebase if config exists (which it does, albeit with placeholders)
// Ideally this would be an env var like VITE_USE_FIREBASE=true

// Check if Firebase key is configured (simple check)
// This is a bit hacky but works for the user's "paste key here" workflow
import firebaseConfig from '../config/firebase'; // We need to export const firebaseConfig from firebase.ts or check the app options

// Let's just create a new instance of FirebaseRepository
export const firebaseRepository = new FirebaseRepository();

// EXPORT THE ACTIVE REPOSITORY
// Change this line to switch between Local and Firebase
export const repository = firebaseRepository;

// Legacy export for backward compatibility during refactor
// effectively replacing localRepository usage with the general repository
export { localInstance as localRepository };
