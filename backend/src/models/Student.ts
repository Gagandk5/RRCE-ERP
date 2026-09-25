import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudent extends Document {
  user: mongoose.Types.ObjectId;
  usn: string;
  usnCollegeCode: string;
  usnYear: number;
  usnBranch: string;
  usnSequence: number;
  dateOfBirth: Date;
  admissionDate: Date;
  currentSemester: number;
  quota: string;
  guardianName?: string;
  guardianPhone?: string;
  isActive: boolean;
  deletedAt?: Date;
  deletionReason?: string;
  deletedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    usn: { type: String, required: true, unique: true, uppercase: true, trim: true },
    usnCollegeCode: { type: String, default: '1RR' },
    usnYear: { type: Number, required: true },
    usnBranch: { type: String, required: true, uppercase: true },
    usnSequence: { type: Number, required: true },
    dateOfBirth: { type: Date, required: true },
    admissionDate: { type: Date, default: Date.now },
    currentSemester: { type: Number, default: 1 },
    quota: { type: String, required: true, default: 'CET' },
    guardianName: { type: String },
    guardianPhone: { type: String },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date },
    deletionReason: { type: String },
    deletedById: { type: String },
  },
  { timestamps: true },
);

StudentSchema.index({ usnYear: 1, usnBranch: 1, usnSequence: 1 });

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export default Student;
