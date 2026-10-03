import { z } from "zod";

// ==================== AUTH SCHEMAS ====================
export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Identifier cannot be empty")
    .max(100, "Identifier is too long")
    .trim(),
  password: z
    .string()
    .min(1, "Password cannot be empty")
    .max(128, "Password is too long"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters")
    .max(128, "Password is too long"),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Identifier is required").trim(),
});

export const profilePhotoSchema = z.object({
  photoUrl: z.string().nullable().optional(),
});

// ==================== STUDENT SCHEMAS ====================
export const studentEnrollSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60).trim(),
  lastName: z.string().min(1, "Last name is required").max(60).trim(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  dob: z.string().min(1, "Date of birth is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  quota: z.enum(["KCET", "COMEDK", "MANAGEMENT"]).default("KCET"),
  semester: z.number().int().min(1).max(8).default(3),
});

export const studentUpdateSchema = z.object({
  studentId: z.string().optional(),
  usn: z.string().optional(),
  newUsn: z.string().optional(),
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().max(60).optional(),
  phone: z.string().max(20).optional(),
  dob: z.string().optional(),
  quota: z.enum(["KCET", "COMEDK", "MANAGEMENT"]).optional(),
  photoUrl: z.string().nullable().optional(),
  departmentId: z.string().optional(),
  section: z.string().optional(),
  semester: z.number().int().min(1).max(8).optional(),
});

export const studentDeleteSchema = z.object({
  studentId: z.string().optional(),
  id: z.string().optional(),
  usn: z.string().optional(),
});

// ==================== ATTENDANCE SCHEMAS ====================
export const attendanceSessionCreateSchema = z.object({
  subject: z.string().min(1, "Subject name is required"),
  subjectId: z.string().optional(),
  departmentId: z.string().min(1, "Department ID is required"),
  semester: z.number().int().min(1).max(8),
  section: z.string().default("A"),
  date: z.string().optional(),
});

export const attendanceRecordBatchSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  records: z.array(
    z.object({
      studentId: z.string().min(1),
      status: z.enum(["PRESENT", "ABSENT", "LATE"]),
      remarks: z.string().optional(),
    })
  ),
});

export const attendanceUnlockSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  reason: z.string().min(3, "A valid reason (min 3 chars) is required for unlock"),
});

// ==================== TIMETABLE SCHEMAS ====================
export const timetableSlotSchema = z.object({
  dayOfWeek: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT"]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be HH:MM"),
  subject: z.string().min(1, "Subject is required"),
  departmentId: z.string().min(1, "Department ID is required"),
  semester: z.number().int().min(1).max(8),
  section: z.string().default("A"),
  facultyId: z.string().min(1, "Faculty ID is required"),
  roomNumber: z.string().min(1, "Room number is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type StudentEnrollInput = z.infer<typeof studentEnrollSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type AttendanceSessionInput = z.infer<typeof attendanceSessionCreateSchema>;
export type TimetableSlotInput = z.infer<typeof timetableSlotSchema>;
