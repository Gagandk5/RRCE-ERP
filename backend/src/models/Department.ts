import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDepartment extends Document {
  code: string;
  name: string;
  usnCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    usnCode: { type: String, required: true, unique: true, uppercase: true },
  },
  { timestamps: true },
);

const Department: Model<IDepartment> = mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
export default Department;
