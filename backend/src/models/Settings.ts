import { getFirestore, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export interface ISettings {
  _id?: string;
  recruiterEmail: string;
  googleCalendarConnected: boolean;
  googleTokens: {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export class Settings implements ISettings {
  _id?: string;
  recruiterEmail!: string;
  googleCalendarConnected!: boolean;
  googleTokens!: {
    access_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    expiry_date?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<ISettings>) {
    Object.assign(this, data);
    if (this.googleCalendarConnected === undefined) this.googleCalendarConnected = false;
    if (!this.googleTokens) this.googleTokens = {};
  }

  static async findOne(filter: any): Promise<Settings | null> {
    const db = getFirestore();
    let query: Query = db.collection('settings');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data();
    return new Settings({ _id: snapshot.docs[0].id, ...data });
  }

  static async findOneAndUpdate(filter: any, update: any, options: any = {}): Promise<Settings> {
    const db = getFirestore();
    let query: Query = db.collection('settings');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    
    const snapshot = await query.limit(1).get();
    let docRef;
    
    if (snapshot.empty) {
      if (options.upsert) {
        docRef = db.collection('settings').doc();
      } else {
        throw new Error("Settings not found and upsert is false");
      }
    } else {
      docRef = snapshot.docs[0].ref;
    }

    const data = update.$set ? update.$set : update;
    await docRef.set(data, { merge: true });
    
    const newSnap = await docRef.get();
    return new Settings({ _id: newSnap.id, ...newSnap.data() });
  }
}
