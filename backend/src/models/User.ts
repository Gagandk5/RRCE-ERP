import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash: string;
  role: 'PRINCIPAL' | 'ADMISSION_OFFICE' | 'HOD' | 'FACULTY' | 'STUDENT' | 'PARENT';
  firstName: string;
  lastName: string;
  phone?: string;
  departmentId?: mongoose.Types.ObjectId;
  isActive: boolean;
  isPasswordResetRequired: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, uppercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['PRINCIPAL', 'ADMISSION_OFFICE', 'HOD', 'FACULTY', 'STUDENT', 'PARENT'],
      required: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    isActive: { type: Boolean, default: true },
    isPasswordResetRequired: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
