import mongoose, { Schema, Document } from 'mongoose';

export interface IAcademicSemester extends Document {
  department: mongoose.Types.ObjectId;
  semesterNumber: number;
  academicYear: string;
  isActive: boolean;
}

const AcademicSemesterSchema = new Schema<IAcademicSemester>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    semesterNumber: { type: Number, required: true },
    academicYear: { type: String, required: true, default: '2026-2027' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export interface ITimetableSlot extends Document {
  department: mongoose.Types.ObjectId;
  semesterNumber: number;
  section: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  dayOfWeek: number;
  startTimeMinutes: number;
  endTimeMinutes: number;
  roomNumber: string;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    semesterNumber: { type: Number, required: true },
    section: { type: String, required: true, default: 'A' },
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    facultyName: { type: String, required: true },
    dayOfWeek: { type: Number, required: true },
    startTimeMinutes: { type: Number, required: true },
    endTimeMinutes: { type: Number, required: true },
    roomNumber: { type: String, required: true },
  },
  { timestamps: true },
);

export const AcademicSemester = mongoose.models.AcademicSemester || mongoose.model<IAcademicSemester>('AcademicSemester', AcademicSemesterSchema);
export const TimetableSlot = mongoose.models.TimetableSlot || mongoose.model<ITimetableSlot>('TimetableSlot', TimetableSlotSchema);
