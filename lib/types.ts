export type Role = "PRINCIPAL" | "ADMISSIONS" | "HOD" | "FACULTY" | "STUDENT";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

export type InvoiceStatus = "PENDING" | "PAID" | "OVERDUE";

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: Role;
  firstName: string;
  lastName: string;
  departmentId?: string | null;
  departmentCode?: string | null;
  isPasswordResetRequired: boolean;
  studentId?: string;
  usn?: string;
}

export interface StudentWithUser {
  id: string;
  userId: string;
  usn: string;
  usnCollegeCode: string;
  usnYear: string;
  usnBranch: string;
  usnSequence: number;
  dateOfBirth: string | Date;
  currentSemester: number;
  quota: string;
  departmentId: string | null;
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
    isPasswordResetRequired: boolean;
  };
  department?: {
    id: string;
    code: string;
    name: string;
    usnCode: string;
  } | null;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: InvoiceStatus;
    dueDate?: string | Date | null;
    title: string;
  }>;
  attendanceRecords?: Array<{
    id: string;
    status: AttendanceStatus;
    remarks?: string | null;
    session: {
      id: string;
      subject: string;
      date: string | Date;
      section: string;
      semester: number;
    };
  }>;
}

export interface TimetableSlotData {
  id: string;
  dayOfWeek: string; // MON, TUE, WED, THU, FRI, SAT
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subject: string;
  departmentId: string;
  department?: {
    id: string;
    code: string;
    name: string;
  };
  semester: number;
  section: string;
  facultyId: string;
  faculty?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  roomNumber: string;
  academicYear: string;
}

export interface ClashResult {
  hasClash: boolean;
  clashes: Array<{
    type: "FACULTY_CLASH" | "ROOM_CLASH" | "BATCH_CLASH";
    message: string;
    conflictingSlot: {
      id?: string;
      subject: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      facultyName?: string;
      roomNumber?: string;
      batch?: string;
    };
  }>;
}
