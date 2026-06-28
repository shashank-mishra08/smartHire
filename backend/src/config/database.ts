import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

export async function connectDatabase(): Promise<void> {
  try {
    const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');
    initializeApp({
      credential: cert(serviceAccountPath),
    });
    console.log('✅ Firebase Admin connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to Firebase:', error);
  }
}

export const db = getFirestore;
