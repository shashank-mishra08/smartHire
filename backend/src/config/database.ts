import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

export async function connectDatabase(): Promise<void> {
  try {
    if (getApps().length === 0) {
      const serviceAccountPath = path.resolve(__dirname, '../../service-account.json');
      initializeApp({
        credential: cert(serviceAccountPath),
        storageBucket: process.env.STORAGE_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET || '',
      });
      console.log('✅ Firebase Admin connected successfully');
    }
  } catch (error) {
    console.error('❌ Failed to connect to Firebase:', error);
  }
}

export const db = getFirestore;
export const storage = getStorage;
