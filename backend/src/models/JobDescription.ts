import { getFirestore, Query } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

export interface IJobDescription {
  _id?: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string;
  location: string;
  recruiterEmail: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class JobDescription implements IJobDescription {
  _id?: string;
  title!: string;
  department!: string;
  description!: string;
  requiredSkills!: string[];
  preferredSkills!: string[];
  experience!: string;
  location!: string;
  recruiterEmail!: string;
  isActive!: boolean;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(data: Partial<IJobDescription>) {
    Object.assign(this, data);
    if (!this.requiredSkills) this.requiredSkills = [];
    if (!this.preferredSkills) this.preferredSkills = [];
    if (this.isActive === undefined) this.isActive = true;
  }

  async save(): Promise<this> {
    const db = getFirestore();
    const collection = db.collection('jobDescriptions');
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

  static async find(filter: any = {}): Promise<JobDescription[]> {
    const db = getFirestore();
    let query: Query = db.collection('jobDescriptions');
    
    for (const [key, value] of Object.entries(filter)) {
      query = query.where(key, '==', value);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => new JobDescription({ _id: doc.id, ...doc.data() }));
  }
}
