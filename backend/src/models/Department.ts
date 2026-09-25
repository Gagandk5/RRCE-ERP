import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  code: string;
  name: string;
  usnCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true }, // BCA, CSE, AIML...
    name: { type: String, required: true },
    usnCode: { type: String, required: true, unique: true, uppercase: true }, // BC, CS, AI...
  },
  { timestamps: true },
);

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
