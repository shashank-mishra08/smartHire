import { getFirestore, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IConversation {
  _id?: string;
  sessionId: string;
  candidateId?: string;
  messages: IMessage[];
  context: {
    stage: 'greeting' | 'collecting_name' | 'collecting_role' | 'collecting_email' | 'collecting_phone' | 'checking_availability' | 'selecting_slot' | 'confirming' | 'scheduled' | 'resume_upload' | 'completed' | 'rescheduling' | 'cancelling';
    candidateInfo: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
    };
    selectedDate?: string;
    selectedTime?: string;
    availableSlots?: string[];
    interviewId?: string;
  };
  status: 'active' | 'completed' | 'abandoned';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Conversation implements IConversation {
  _id?: string;
  sessionId!: string;
  candidateId?: string;
  messages!: IMessage[];
  context!: {
    stage: 'greeting' | 'collecting_name' | 'collecting_role' | 'collecting_email' | 'collecting_phone' | 'checking_availability' | 'selecting_slot' | 'confirming' | 'scheduled' | 'resume_upload' | 'completed' | 'rescheduling' | 'cancelling';
    candidateInfo: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
    };
    selectedDate?: string;
    selectedTime?: string;
    availableSlots?: string[];
    interviewId?: string;
  };
  status!: 'active' | 'completed' | 'abandoned';
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IConversation>) {
    Object.assign(this, data);
    if (!this.messages) this.messages = [];
    if (!this.context) {
      this.context = {
        stage: 'greeting',
        candidateInfo: {},
      };
    }
    if (!this.status) this.status = 'active';
  }

  async save(): Promise<this> {
    const db = getFirestore();
    const collection = db.collection('conversations');
    this.updatedAt = new Date();
    
    const dataToSave = JSON.parse(JSON.stringify(this));
    // Re-attach dates
    dataToSave.updatedAt = this.updatedAt;
    if (this.createdAt) dataToSave.createdAt = this.createdAt;
    
    if (!this._id) {
      this.createdAt = new Date();
      dataToSave.createdAt = this.createdAt;
      
      const docRef = collection.doc();
      this._id = docRef.id;
      dataToSave._id = this._id;
      
      await docRef.set(dataToSave);
    } else {
      const docRef = collection.doc(this._id);
      await docRef.set(dataToSave, { merge: true });
    }
    return this;
  }

  static async findOne(filter: any): Promise<Conversation | null> {
    const db = getFirestore();
    let query: Query = db.collection('conversations');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data();
    return new Conversation({ _id: snapshot.docs[0].id, ...data });
  }
}
