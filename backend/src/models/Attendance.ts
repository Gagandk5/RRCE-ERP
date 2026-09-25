import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceSession extends Document {
  department: mongoose.Types.ObjectId;
  semesterNumber: number;
  section: string;
  sessionDate: Date;
  periodNumber: number;
  markedById: string;
  isLocked: boolean;
  createdAt: Date;
}

const AttendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    semesterNumber: { type: Number, required: true },
    section: { type: String, required: true, default: 'A' },
    sessionDate: { type: Date, required: true },
    periodNumber: { type: Number, required: true, default: 1 },
    markedById: { type: String, required: true },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export interface IAttendanceRecord extends Document {
  session: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';
  remarks?: string;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    session: { type: Schema.Types.ObjectId, ref: 'AttendanceSession', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'], default: 'PRESENT' },
    remarks: { type: String },
  },
  { timestamps: true },
);

AttendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

export const AttendanceSession = mongoose.models.AttendanceSession || mongoose.model<IAttendanceSession>('AttendanceSession', AttendanceSessionSchema);
export const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
