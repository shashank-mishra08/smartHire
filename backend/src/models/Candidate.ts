import { getFirestore, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export interface ICandidate {
  _id?: string;
  leadId?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  resumeUrl?: string;
  resumeSummary?: string;
  skills?: string[];
  matchScore?: number;
  missingSkills?: string[];
  suggestedQuestions?: string[];
  scores?: {
    communication: number;
    resumeQuality: number;
    skillMatch: number;
    experience: number;
    overall: number;
  };
  status: 'new' | 'interviewed' | 'scheduled' | 'completed' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Candidate implements ICandidate {
  _id?: string;
  leadId?: string;
  name!: string;
  email!: string;
  phone!: string;
  role!: string;
  resumeUrl?: string;
  resumeSummary?: string;
  skills?: string[];
  matchScore?: number;
  missingSkills?: string[];
  suggestedQuestions?: string[];
  scores?: {
    communication: number;
    resumeQuality: number;
    skillMatch: number;
    experience: number;
    overall: number;
  };
  status!: 'new' | 'interviewed' | 'scheduled' | 'completed' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<ICandidate>) {
    Object.assign(this, data);
    if (!this.name) this.name = '';
    if (!this.email) this.email = '';
    if (!this.phone) this.phone = '';
    if (!this.role) this.role = '';
    if (!this.status) this.status = 'new';
    if (!this.scores) {
      this.scores = {
        communication: 0,
        resumeQuality: 0,
        skillMatch: 0,
        experience: 0,
        overall: 0,
      };
    }
  }

  async save(): Promise<this> {
    const db = getFirestore();
    const collection = db.collection('candidates');
    this.updatedAt = new Date();
    
    // Remove undefined fields
    const dataToSave = Object.fromEntries(Object.entries({ ...this }).filter(([_, v]) => v !== undefined));

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
    let query: Query = db.collection('candidates');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    
    const snapshot = await query.count().get();
    return snapshot.data().count;
  }

  static async findOne(filter: any): Promise<Candidate | null> {
    const db = getFirestore();
    let query: Query = db.collection('candidates');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }
    
    const snapshot = await query.limit(1).get();
    if (snapshot.empty) return null;
    
    const data = snapshot.docs[0].data();
    return new Candidate({ _id: snapshot.docs[0].id, ...data });
  }

  static find(filter: any = {}): any {
    const db = getFirestore();
    let query: Query = db.collection('candidates');
    
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
          const docs = snapshot.docs.map(doc => new Candidate({ _id: doc.id, ...doc.data() }));
          resolve(docs);
        } catch (error) {
          reject(error);
        }
      }
    };
  }
}
