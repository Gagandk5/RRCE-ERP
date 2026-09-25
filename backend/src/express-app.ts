import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { connectDB } from './db/connect';
import User from './models/User';
import Student from './models/Student';
import Department from './models/Department';
import { AttendanceSession, AttendanceRecord } from './models/Attendance';
import { Invoice, AuditLog } from './models/FinanceAndAudit';
import { TimetableSlot, AcademicSemester } from './models/AcademicAndTimetable';

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'rrce-erp-institutional-jwt-secret-2026';

// Middleware: Verify database connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// -------------------------------------------------------------
// 1. AUTHENTICATION CONTROLLER
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password, requestedRole } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifier and password are required' });
    }

    const cleanId = String(identifier).trim().toUpperCase();
    const user = await User.findOne({
      $or: [{ username: cleanId }, { email: String(identifier).trim().toLowerCase() }],
    }).populate('departmentId');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your login details.' });
    }

    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({ message: 'This account belongs to a different portal.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your login details.' });
    }

    let studentProfile = null;
    if (user.role === 'STUDENT') {
      studentProfile = await Student.findOne({ user: user._id });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.json({
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isPasswordResetRequired: user.isPasswordResetRequired,
        departmentName: (user.departmentId as any)?.name || 'General',
        studentProfile,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Authentication error' });
  }
});

// -------------------------------------------------------------
// 2. ADMISSIONS CONTROLLER
// -------------------------------------------------------------
app.get('/api/admissions/departments', async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return res.json(departments);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

app.get('/api/admissions/students', async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .populate('user')
      .sort({ usnSequence: 1 });
    return res.json(students);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

app.post('/api/admissions/enroll', async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, quota, departmentId, phone } = req.body;
    const dept = await Department.findById(departmentId);
    if (!dept) return res.status(404).json({ message: 'Department not found' });

    // Calculate next USN sequence
    const latestStudent = await Student.findOne({ usnYear: 25, usnBranch: dept.usnCode })
      .sort({ usnSequence: -1 });
    const nextSeq = latestStudent ? latestStudent.usnSequence + 1 : 1;
    const usnSeqPadded = String(nextSeq).padStart(3, '0');
    const usn = `1RR25${dept.usnCode}${usnSeqPadded}`;

    // Default password formula [NAME3][DD][MM][YY]
    const dobDate = new Date(dateOfBirth);
    const day = String(dobDate.getDate()).padStart(2, '0');
    const month = String(dobDate.getMonth() + 1).padStart(2, '0');
    const yy = String(dobDate.getFullYear()).slice(-2);
    const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3).padEnd(3, 'X');
    const defaultPassword = `${cleanFirst}${day}${month}${yy}`;

    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    const email = `${usn}@rrce.org`;

    const user = await User.create({
      email,
      username: usn,
      passwordHash,
      role: 'STUDENT',
      firstName,
      lastName,
      phone,
      departmentId: dept._id,
      isPasswordResetRequired: true,
    });

    const student = await Student.create({
      user: user._id,
      usn,
      usnCollegeCode: '1RR',
      usnYear: 25,
      usnBranch: dept.usnCode,
      usnSequence: nextSeq,
      dateOfBirth: dobDate,
      currentSemester: 1,
      quota: quota || 'CET',
    });

    await Invoice.create({
      invoiceNumber: `INV-25-${dept.usnCode}-${usnSeqPadded}`,
      student: student._id,
      totalAmount: quota === 'MANAGEMENT' ? 125000 : 85000,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await AuditLog.create({
      userId: user._id.toString(),
      action: 'STUDENT_ENROLLED',
      targetId: student._id.toString(),
      metaJson: { usn, defaultPassword },
    });

    return res.status(201).json({
      message: 'Student enrolled successfully',
      usn,
      defaultPassword,
      student,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// -------------------------------------------------------------
// 3. ATTENDANCE CONTROLLER
// -------------------------------------------------------------
app.get('/api/attendance/roster', async (req, res) => {
  try {
    const students = await Student.find({ isActive: true })
      .populate('user')
      .sort({ usnSequence: 1 });
    return res.json(students);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Health Endpoint
app.get('/api/health', (req, res) => {
  return res.json({ status: 'OK', framework: 'MERN Stack (MongoDB, Express, React, Node.js)' });
});

export default app;
