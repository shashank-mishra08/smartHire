import { getFirestore, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export interface IInterview {
  _id?: string;
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  role: string;
  date: string;
  time: string;
  dateTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  meetLink?: string;
  calendarEventId?: string;
  recruiterEmail: string;
  resumeUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Interview implements IInterview {
  _id?: string;
  candidateId?: string;
  candidateName!: string;
  candidateEmail!: string;
  candidatePhone?: string;
  role!: string;
  date!: string;
  time!: string;
  dateTime!: Date;
  duration!: number;
  status!: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  meetLink?: string;
  calendarEventId?: string;
  recruiterEmail!: string;
  resumeUrl?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IInterview>) {
    Object.assign(this, data);
    if (!this.duration) this.duration = 30;
    if (!this.status) this.status = 'scheduled';
  }

  async save(): Promise<this> {
    const db = getFirestore();
    const collection = db.collection('interviews');
    this.updatedAt = new Date();
    
    const dataToSave = { ...this };
    
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

  static async countDocuments(filter: any = {}): Promise<number> {
    const db = getFirestore();
    let query: Query = db.collection('interviews');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  static find(filter: any = {}): any {
    const db = getFirestore();
    let query: Query = db.collection('interviews');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }

    let _sortField: string | null = null;
    let _sortDir: 'asc' | 'desc' = 'asc';
    let _limit: number | null = null;
    let _skip: number | null = null;

    return {
      sort(sortObj: any) {
        const entries = Object.entries(sortObj);
        if (entries.length > 0) {
          _sortField = entries[0][0];
          _sortDir = entries[0][1] === -1 ? 'desc' : 'asc';
        }
        return this;
      },
      skip(count: number) {
        _skip = count;
        return this;
      },
      limit(count: number) {
        _limit = count;
        return this;
      },
      async then(resolve: any, reject: any) {
        try {
          if (_sortField) query = query.orderBy(_sortField, _sortDir);
          if (_skip) query = query.offset(_skip);
          if (_limit) query = query.limit(_limit);

          const snapshot = await query.get();
          const docs = snapshot.docs.map(doc => {
            const data = doc.data();
            if (data.dateTime && data.dateTime.toDate) data.dateTime = data.dateTime.toDate();
            if (data.createdAt && data.createdAt.toDate) data.createdAt = data.createdAt.toDate();
            if (data.updatedAt && data.updatedAt.toDate) data.updatedAt = data.updatedAt.toDate();
            return new Interview({ _id: doc.id, ...data });
          });
          resolve(docs);
        } catch (error) {
          reject(error);
        }
      }
    };
  }

  static async findByIdAndUpdate(id: string, update: any, options: any = {}): Promise<Interview | null> {
    const db = getFirestore();
    const docRef = db.collection('interviews').doc(id);
    
    const snapshot = await docRef.get();
    if (!snapshot.exists) return null;
    
    const data = update.$set ? update.$set : update;
    await docRef.set(data, { merge: true });
    
    if (options.new) {
      const updatedSnap = await docRef.get();
      return new Interview({ _id: updatedSnap.id, ...updatedSnap.data() });
    }
    
    return new Interview({ _id: snapshot.id, ...snapshot.data() });
  }
}
