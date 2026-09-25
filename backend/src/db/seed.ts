import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDB } from './connect';
import User from '../models/User';
import Student from '../models/Student';
import Department from '../models/Department';
import { AcademicSemester, TimetableSlot } from '../models/AcademicAndTimetable';
import { Invoice } from '../models/FinanceAndAudit';

const rawStudentRoster = [
  { usn: '1RR25BC001', name: 'Amith T', dob: '08/07/2007', phone: '7349448591' },
  { usn: '1RR25BC002', name: 'Anusha B', dob: '20/04/2007', phone: '9380180029' },
  { usn: '1RR25BC003', name: 'Bhavya M.B', dob: '14/03/2007', phone: '7259145965' },
  { usn: '1RR25BC004', name: 'Bhavya s', dob: '24/08/2007', phone: '6366254844' },
  { usn: '1RR25BC005', name: 'Deepika cs', dob: '15/01/2008', phone: '6360243411' },
  { usn: '1RR25BC007', name: 'Gagan D K', dob: '14/12/2007', phone: '8971115212' },
  { usn: '1RR25BC008', name: 'HEMALATHA.K.M', dob: '03/01/2007', phone: '9986207567' },
  { usn: '1RR25BC009', name: 'Ishu Gupta', dob: '07/08/2008', phone: '7633053768' },
  { usn: '1RR25BC010', name: 'Jasmine. M', dob: '13/02/2007', phone: '9108389634' },
  { usn: '1RR25BC011', name: 'Karan', dob: '06/01/2007', phone: '8971232893' },
  { usn: '1RR25BC012', name: 'Kruthika P', dob: '22/01/2008', phone: '7760525703' },
  { usn: '1RR25BC013', name: 'Kushal P', dob: '23/10/2005', phone: '9353141925' },
  { usn: '1RR25BC014', name: 'L.grishma', dob: '27/11/2006', phone: '7676753310' },
  { usn: '1RR25BC015', name: 'Lakshmish gowda ck', dob: '22/11/2007', phone: '9535513824' },
  { usn: '1RR25BC016', name: 'Likitha V', dob: '07/09/2007', phone: '879205132' },
  { usn: '1RR25BC017', name: 'M A Deepak', dob: '03/09/2007', phone: '7483925230' },
  { usn: '1RR25BC018', name: 'Mahantesh', dob: '11/01/2007', phone: '7892484920' },
  { usn: '1RR25BC019', name: 'Manoj Kumar G P', dob: '11/03/2007', phone: '9482559982' },
  { usn: '1RR25BC020', name: 'Monish S', dob: '02/04/2007', phone: '8431803165' },
  { usn: '1RR25BC021', name: 'Monisha', dob: '28/04/2007', phone: '8867005857' },
  { usn: '1RR25BC022', name: 'Murthy NM', dob: '16/10/2006', phone: '7760753537' },
  { usn: '1RR25BC023', name: 'Nandan D R', dob: '25/07/2007', phone: '8660029532' },
  { usn: '1RR25BC024', name: 'Naved Khan', dob: '13/03/2007', phone: '9588976387' },
  { usn: '1RR25BC025', name: 'Neha R', dob: '25/10/2006', phone: '7619404019' },
  { usn: '1RR25BC026', name: 'Nithyashree S', dob: '23/08/2007', phone: '7483403007' },
  { usn: '1RR25BC027', name: 'Pallavi NM', dob: '17/05/2007', phone: '7483085242' },
  { usn: '1RR25BC028', name: 'Piyush AhmdABade', dob: '10/03/2006', phone: '7892292980' },
  { usn: '1RR25BC029', name: 'POOJA BABURAO', dob: '19/03/2007', phone: '7259481534' },
  { usn: '1RR25BC030', name: 'Prajwal', dob: '12/02/2007', phone: '9164561212' },
  { usn: '1RR25BC031', name: 'Prakruthi T S', dob: '10/12/2007', phone: '9901325967' },
  { usn: '1RR25BC032', name: 'Prarthana H S', dob: '06/04/2007', phone: '9980125961' },
  { usn: '1RR25BC033', name: 'Prashanth B M', dob: '07/06/2007', phone: '7892193049' },
  { usn: '1RR25BC034', name: 'Rakshita Umesh Naik', dob: '18/12/2006', phone: '6361797840' },
  { usn: '1RR25BC035', name: 'Rimisha.G', dob: '18/08/2007', phone: '9916355065' },
  { usn: '1RR25BC036', name: 'Sahana D V', dob: '28/02/2006', phone: '6361967741' },
  { usn: '1RR25BC037', name: 'Sanjana', dob: '01/11/2008', phone: '8971810424' },
  { usn: '1RR25BC038', name: 'Sanjana yadav', dob: '24/02/2006', phone: '7204817879' },
  { usn: '1RR25BC039', name: 'Shamanth TD', dob: '23/09/2007', phone: '7892335229' },
  { usn: '1RR25BC041', name: 'Sinchana T S', dob: '07/01/2007', phone: '9886133614' },
  { usn: '1RR25BC042', name: 'Sonali Padhi', dob: '25/01/2007', phone: '8310647322' },
  { usn: '1RR25BC043', name: 'Sowmya KC', dob: '19/03/2007', phone: '9019391313' },
  { usn: '1RR25BC044', name: 'Spandana N', dob: '21/05/2007', phone: '9606059592' },
  { usn: '1RR25BC045', name: 'Srinivas', dob: '28/06/2007', phone: '9538332204' },
  { usn: '1RR25BC046', name: 'Srujan. S', dob: '27/12/2007', phone: '8310684159' },
  { usn: '1RR25BC047', name: 'sudharshan', dob: '25/12/2006', phone: '7760444119' },
  { usn: '1RR25BC049', name: 'Thanmye.R', dob: '26/03/2008', phone: '9731864091' },
  { usn: '1RR25BC050', name: 'Thanushree R', dob: '26/03/2008', phone: '9731864091' },
  { usn: '1RR25BC051', name: 'Thanushree. S', dob: '05/12/2006', phone: '8197933545' },
  { usn: '1RR25BC052', name: 'Thereem Bano', dob: '20/03/2008', phone: '9731088771' },
  { usn: '1RR25BC053', name: 'Varsha N', dob: '20/04/2005', phone: '8792916212' },
  { usn: '1RR25BC054', name: 'Vignesh B', dob: '09/04/2007', phone: '9535752764' },
  { usn: '1RR25BC055', name: 'Vikas np', dob: '29/01/2007', phone: '9036062676' },
  { usn: '1RR25BC056', name: 'Y. BHAVYA SREE', dob: '04/03/2005', phone: '6360901719' },
  { usn: '1RR25BC057', name: 'Yasin pasha', dob: '26/02/2005', phone: '9986797921' },
];

function generateDefaultPassword(fullName: string, dobString: string): string {
  const nameWords = fullName.replace(/[^a-zA-Z\s]/g, '').trim().split(/\s+/).filter(w => w.length >= 3);
  let mainWord = nameWords.length > 0 ? nameWords[0] : fullName.replace(/[^a-zA-Z]/g, '');
  let cleanFirst = mainWord.toUpperCase().slice(0, 3).padEnd(3, 'X');
  const [day, month, year] = dobString.split('/');
  const yy = year.slice(-2);
  return `${cleanFirst}${day}${month}${yy}`;
}

export async function seedMernDatabase() {
  await connectDB();
  console.log('🌱 SEEDING MERN MONGODB DATABASE FOR RRCE ERP...');

  // 1. Departments
  const depts = [
    { code: 'BCA', name: 'Bachelor of Computer Applications', usnCode: 'BC' },
    { code: 'CSE', name: 'Computer Science & Engineering', usnCode: 'CS' },
    { code: 'AIML', name: 'Artificial Intelligence & Machine Learning', usnCode: 'AI' },
    { code: 'ECE', name: 'Electronics & Communication Engineering', usnCode: 'EC' },
    { code: 'ME', name: 'Mechanical Engineering', usnCode: 'ME' },
    { code: 'ISE', name: 'Information Science & Engineering', usnCode: 'IS' },
    { code: 'BS', name: 'Basic Science & Humanities', usnCode: 'BS' },
  ];

  const deptMap: Record<string, any> = {};
  for (const d of depts) {
    const created = await Department.findOneAndUpdate(
      { code: d.code },
      d,
      { upsert: true, new: true },
    );
    deptMap[d.code] = created;
  }

  // 2. Staff Accounts
  const defaultStaffPass = await bcrypt.hash('Password@123', 10);
  const staff = [
    { email: 'principal@rrce.org', username: 'PRINCIPAL', role: 'PRINCIPAL', firstName: 'Dr. Ramesh', lastName: 'Kumar', dept: deptMap['BS']._id },
    { email: 'admissions@rrce.org', username: 'ADMISSIONS', role: 'ADMISSION_OFFICE', firstName: 'Shuresh', lastName: 'Gowda', dept: deptMap['BCA']._id },
    { email: 'hod.bca@rrce.org', username: 'HOD_BCA', role: 'HOD', firstName: 'Dr. Sunitha', lastName: 'Murthy', dept: deptMap['BCA']._id },
    { email: 'faculty.math@rrce.org', username: 'FACULTY_MATH', role: 'FACULTY', firstName: 'Prof. Ananya', lastName: 'Sharma', dept: deptMap['BS']._id },
  ];

  for (const s of staff) {
    await User.findOneAndUpdate(
      { email: s.email },
      {
        email: s.email,
        username: s.username,
        passwordHash: defaultStaffPass,
        role: s.role,
        firstName: s.firstName,
        lastName: s.lastName,
        departmentId: s.dept,
        isPasswordResetRequired: false,
      },
      { upsert: true, new: true },
    );
  }

  // 3. 54 Real BCA Students
  console.log(`Seeding ${rawStudentRoster.length} real BCA students...`);
  const bcaDept = deptMap['BCA'];

  for (const item of rawStudentRoster) {
    const parts = item.name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || 'Student';
    const [day, month, year] = item.dob.split('/');
    const dob = new Date(`${year}-${month}-${day}`);
    
    const pass = generateDefaultPassword(item.name, item.dob);
    const passHash = await bcrypt.hash(pass, 10);
    const email = `${item.usn}@rrce.org`;
    const seq = parseInt(item.usn.slice(-3), 10);

    const user = await User.findOneAndUpdate(
      { email },
      {
        email,
        username: item.usn,
        passwordHash: passHash,
        role: 'STUDENT',
        firstName,
        lastName,
        phone: item.phone,
        departmentId: bcaDept._id,
        isPasswordResetRequired: true,
      },
      { upsert: true, new: true },
    );

    const student = await Student.findOneAndUpdate(
      { usn: item.usn },
      {
        user: user._id,
        usn: item.usn,
        usnCollegeCode: '1RR',
        usnYear: 25,
        usnBranch: 'BC',
        usnSequence: seq,
        dateOfBirth: dob,
        currentSemester: 1,
        quota: 'CET',
      },
      { upsert: true, new: true },
    );

    await Invoice.findOneAndUpdate(
      { invoiceNumber: `INV-25-BC-${String(seq).padStart(3, '0')}` },
      {
        invoiceNumber: `INV-25-BC-${String(seq).padStart(3, '0')}`,
        student: student._id,
        totalAmount: 85000,
        paidAmount: 0,
        status: 'PENDING',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      { upsert: true, new: true },
    );
  }

  console.log('✅ MERN MONGODB DATABASE SEEDED WITH 54 REAL BCA STUDENTS!');
}

if (require.main === module) {
  seedMernDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
