import { ObjectId } from 'mongodb';

export interface Faculty {
  _id: ObjectId;
  fullName: string;
  email: string;
  username: string;
  facultyCode: string;
  password: string;
  department: string;
  designation: string;
  phone?: string;
  specialization?: string;
  experience?: string;
  qualification?: string;
  dateOfJoining?: string;
  profilePhoto?: string;
  bio?: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certification {
  _id: ObjectId;
  facultyId: ObjectId;
  title: string;
  type: "conference" | "fdp" | "journal" | "research" | "seminar" | "project";
  organization: string;
  date: string;
  duration?: string;
  description?: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Circular {
  _id: ObjectId;
  heading: string;
  body: string;
  details?: string;
  adminNote?: string;
  dateCreated: Date;
  isPinned: boolean;
  viewedBy: ObjectId[];
}