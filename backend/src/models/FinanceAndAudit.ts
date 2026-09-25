import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNumber: string;
  student: mongoose.Types.ObjectId;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  dueDate: Date;
  createdAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    status: { type: String, enum: ['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'], default: 'PENDING' },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  targetId: string;
  metaJson?: any;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true },
    action: { type: String, required: true },
    targetId: { type: String, required: true },
    metaJson: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Invoice: Model<IInvoice> = mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
export const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
