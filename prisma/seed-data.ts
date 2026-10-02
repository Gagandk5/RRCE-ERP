export interface RawDepartment {
  code: string;
  name: string;
  usnCode: string;
}

export interface RawStaff {
  email: string;
  username: string;
  role: "PRINCIPAL" | "ADMISSIONS" | "HOD" | "FACULTY";
  firstName: string;
  lastName: string;
  phone: string;
  deptCode?: string;
  designation?: string;
  primarySubject?: string;
  defaultPassword: string;
}

export interface RawStudent {
  sequence: number;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  dob: string; // YYYY-MM-DD
  phone: string;
  quota: "KCET" | "COMEDK" | "MANAGEMENT";
}

export const DEPARTMENTS: RawDepartment[] = [
  { code: "BCA", name: "Bachelor of Computer Applications", usnCode: "BC" },
  { code: "CSE", name: "Computer Science & Engineering", usnCode: "CS" },
  { code: "AIML", name: "Artificial Intelligence & Machine Learning", usnCode: "AI" },
  { code: "ECE", name: "Electronics & Communication Engineering", usnCode: "EC" },
  { code: "ME", name: "Mechanical Engineering", usnCode: "ME" },
  { code: "ISE", name: "Information Science & Engineering", usnCode: "IS" },
  { code: "BS", name: "Department of Basic Sciences & Humanities", usnCode: "BS" },
];

export const OFFICIAL_BCA_FACULTY: RawStaff[] = [
  {
    username: "jaishankar.m@rrce.org",
    email: "jaishankar.m@rrce.org",
    firstName: "Jaishankar",
    lastName: "M",
    phone: "+91 9845123401",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Assistant Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Digital Principles and Computer Organization (B25BCA301)",
  },
  {
    username: "shreya.s@rrce.org",
    email: "shreya.s@rrce.org",
    firstName: "Shreya",
    lastName: "S",
    phone: "+91 9845123402",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Assistant Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Object Oriented Programming in C++ (B25BCA302)",
  },
  {
    username: "thilagavallii.s@rrce.org",
    email: "thilagavallii.s@rrce.org",
    firstName: "Thilagavallii",
    lastName: "S",
    phone: "+91 9845123403",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Assistant Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Operating System Concepts (B25BCA303)",
  },
  {
    username: "pushpalatha.g@rrce.org",
    email: "pushpalatha.g@rrce.org",
    firstName: "Pushpalatha",
    lastName: "G",
    phone: "+91 9845123404",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Associate Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Relational Data Base Management System (B25BCA304)",
  },
  {
    username: "deeraj.c@rrce.org",
    email: "deeraj.c@rrce.org",
    firstName: "Deeraj",
    lastName: "C",
    phone: "+91 9845123405",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Assistant Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Software Engineering (B25BCA305)",
  },
  {
    username: "darshan.p@rrce.org",
    email: "darshan.p@rrce.org",
    firstName: "Darshan",
    lastName: "P",
    phone: "+91 9845123406",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Assistant Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Reasoning and Aptitude (B25BCA306)",
  },
  {
    username: "muruganandham.sk@rrce.org",
    email: "muruganandham.sk@rrce.org",
    firstName: "Muruganandham",
    lastName: "S K",
    phone: "+91 9845123407",
    role: "FACULTY",
    deptCode: "BCA",
    designation: "Associate Professor",
    defaultPassword: "rrce2025",
    primarySubject: "Object Oriented Programming in C++ Lab (B25BCAL307)",
  },
  {
    username: "hod.bca@rrce.org",
    email: "hod.bca@rrce.org",
    firstName: "Praveen",
    lastName: "Gowda",
    phone: "+91 9845123400",
    role: "HOD",
    deptCode: "BCA",
    designation: "Professor & Head",
    defaultPassword: "rrce2025",
    primarySubject: "Department Administration",
  },
];

export const STAFF_ACCOUNTS: RawStaff[] = [
  {
    email: "principal@rrce.org",
    username: "principal@rrce.org",
    role: "PRINCIPAL",
    firstName: "Ramesh",
    lastName: "Kumar",
    phone: "+91 9845012345",
    defaultPassword: "rrce2025",
  },
  {
    email: "admissions@rrce.org",
    username: "admissions@rrce.org",
    role: "ADMISSIONS",
    firstName: "Suresh",
    lastName: "Reddy",
    phone: "+91 9845023456",
    defaultPassword: "rrce2025",
  },
  ...OFFICIAL_BCA_FACULTY,
];

// REAL 3rd SEMESTER 2nd YEAR BCA CLASS ROSTER (54 Students)
export const BCA_2025_STUDENTS: RawStudent[] = [
  { sequence: 1, firstName: "Amith", lastName: "T", gender: "M", dob: "2007-07-08", phone: "+91 7349448591", quota: "KCET" },
  { sequence: 2, firstName: "Anusha", lastName: "B", gender: "F", dob: "2007-04-20", phone: "+91 9380180029", quota: "KCET" },
  { sequence: 3, firstName: "Bhavya", lastName: "M B", gender: "F", dob: "2007-03-14", phone: "+91 7259145965", quota: "KCET" },
  { sequence: 4, firstName: "Bhavya", lastName: "S", gender: "F", dob: "2007-08-24", phone: "+91 6366254844", quota: "KCET" },
  { sequence: 5, firstName: "Deepika", lastName: "C S", gender: "F", dob: "2008-01-15", phone: "+91 6360243411", quota: "KCET" },
  { sequence: 7, firstName: "Gagan", lastName: "D K", gender: "M", dob: "2007-12-14", phone: "+91 8971115212", quota: "KCET" },
  { sequence: 8, firstName: "Hemalatha", lastName: "K M", gender: "F", dob: "2007-01-03", phone: "+91 9986207567", quota: "KCET" },
  { sequence: 9, firstName: "Ishu", lastName: "Gupta", gender: "M", dob: "2008-08-07", phone: "+91 7633053768", quota: "KCET" },
  { sequence: 10, firstName: "Jasmine", lastName: "M", gender: "F", dob: "2007-02-13", phone: "+91 9108389634", quota: "KCET" },
  { sequence: 11, firstName: "Karan", lastName: "", gender: "M", dob: "2007-01-06", phone: "+91 8971232893", quota: "KCET" },
  { sequence: 12, firstName: "Kruthika", lastName: "P", gender: "F", dob: "2008-01-22", phone: "+91 7760525703", quota: "KCET" },
  { sequence: 13, firstName: "Kushal", lastName: "P", gender: "M", dob: "2005-10-23", phone: "+91 9353141925", quota: "KCET" },
  { sequence: 14, firstName: "Grishma", lastName: "L", gender: "F", dob: "2006-11-27", phone: "+91 7676753310", quota: "KCET" },
  { sequence: 15, firstName: "Lakshmish Gowda", lastName: "C K", gender: "M", dob: "2007-11-22", phone: "+91 9535513824", quota: "KCET" },
  { sequence: 16, firstName: "Likitha", lastName: "V", gender: "F", dob: "2007-09-07", phone: "+91 8792051320", quota: "KCET" },
  { sequence: 17, firstName: "M A Deepak", lastName: "", gender: "M", dob: "2007-09-03", phone: "+91 7483925230", quota: "KCET" },
  { sequence: 18, firstName: "Mahantesh", lastName: "", gender: "M", dob: "2007-01-11", phone: "+91 7892484920", quota: "KCET" },
  { sequence: 19, firstName: "Manoj Kumar", lastName: "G P", gender: "M", dob: "2007-03-11", phone: "+91 9482559982", quota: "KCET" },
  { sequence: 20, firstName: "Monish", lastName: "S", gender: "M", dob: "2007-04-02", phone: "+91 8431803165", quota: "KCET" },
  { sequence: 21, firstName: "Monisha", lastName: "", gender: "F", dob: "2007-04-28", phone: "+91 8867005857", quota: "KCET" },
  { sequence: 22, firstName: "Murthy", lastName: "N M", gender: "M", dob: "2006-10-16", phone: "+91 7760753537", quota: "KCET" },
  { sequence: 23, firstName: "Nandan", lastName: "D R", gender: "M", dob: "2007-07-25", phone: "+91 8660029532", quota: "KCET" },
  { sequence: 24, firstName: "Naved", lastName: "Khan", gender: "M", dob: "2007-03-13", phone: "+91 9588976387", quota: "KCET" },
  { sequence: 25, firstName: "Neha", lastName: "R", gender: "F", dob: "2006-10-25", phone: "+91 7619404019", quota: "KCET" },
  { sequence: 26, firstName: "Nithyashree", lastName: "S", gender: "F", dob: "2007-08-23", phone: "+91 7483403007", quota: "KCET" },
  { sequence: 27, firstName: "Pallavi", lastName: "N M", gender: "F", dob: "2007-05-17", phone: "+91 7483085242", quota: "KCET" },
  { sequence: 28, firstName: "Piyush", lastName: "Ahmadabade", gender: "M", dob: "2006-03-10", phone: "+91 7892292980", quota: "KCET" },
  { sequence: 29, firstName: "Pooja", lastName: "Baburao", gender: "F", dob: "2007-03-19", phone: "+91 7259481534", quota: "KCET" },
  { sequence: 30, firstName: "Prajwal", lastName: "", gender: "M", dob: "2007-02-12", phone: "+91 9164561212", quota: "KCET" },
  { sequence: 31, firstName: "Prakruthi", lastName: "T S", gender: "F", dob: "2007-12-10", phone: "+91 9901325967", quota: "KCET" },
  { sequence: 32, firstName: "Prarthana", lastName: "H S", gender: "F", dob: "2007-04-06", phone: "+91 9980125961", quota: "KCET" },
  { sequence: 33, firstName: "Prashanth", lastName: "B M", gender: "M", dob: "2007-06-07", phone: "+91 7892193049", quota: "KCET" },
  { sequence: 34, firstName: "Rakshita", lastName: "Umesh Naik", gender: "F", dob: "2006-12-18", phone: "+91 6361797840", quota: "KCET" },
  { sequence: 35, firstName: "Rimisha", lastName: "G", gender: "F", dob: "2007-08-18", phone: "+91 9916355065", quota: "KCET" },
  { sequence: 36, firstName: "Sahana", lastName: "D V", gender: "F", dob: "2006-02-28", phone: "+91 6361967741", quota: "KCET" },
  { sequence: 37, firstName: "Sanjana", lastName: "", gender: "F", dob: "2008-11-01", phone: "+91 8971810424", quota: "KCET" },
  { sequence: 38, firstName: "Sanjana", lastName: "Yadav", gender: "F", dob: "2006-02-24", phone: "+91 7204817879", quota: "KCET" },
  { sequence: 39, firstName: "Shamanth", lastName: "T D", gender: "M", dob: "2007-09-23", phone: "+91 7892335229", quota: "KCET" },
  { sequence: 41, firstName: "Sinchana", lastName: "T S", gender: "F", dob: "2007-01-07", phone: "+91 9886133614", quota: "KCET" },
  { sequence: 42, firstName: "Sonali", lastName: "Padhi", gender: "F", dob: "2007-01-25", phone: "+91 8310647322", quota: "KCET" },
  { sequence: 43, firstName: "Sowmya", lastName: "K C", gender: "F", dob: "2007-03-19", phone: "+91 9019391313", quota: "KCET" },
  { sequence: 44, firstName: "Spandana", lastName: "N", gender: "F", dob: "2007-05-21", phone: "+91 9606059592", quota: "KCET" },
  { sequence: 45, firstName: "Srinivas", lastName: "", gender: "M", dob: "2007-06-28", phone: "+91 9538332204", quota: "KCET" },
  { sequence: 46, firstName: "Srujan", lastName: "S", gender: "M", dob: "2007-12-27", phone: "+91 8310684159", quota: "KCET" },
  { sequence: 47, firstName: "Sudharshan", lastName: "", gender: "M", dob: "2006-12-25", phone: "+91 7760444119", quota: "KCET" },
  { sequence: 49, firstName: "Thanmye", lastName: "R", gender: "F", dob: "2008-03-26", phone: "+91 9731864091", quota: "KCET" },
  { sequence: 50, firstName: "Thanushree", lastName: "R", gender: "F", dob: "2008-03-26", phone: "+91 9731864091", quota: "KCET" },
  { sequence: 51, firstName: "Thanushree", lastName: "S", gender: "F", dob: "2006-12-05", phone: "+91 8197933545", quota: "KCET" },
  { sequence: 52, firstName: "Thereem", lastName: "Bano", gender: "F", dob: "2008-03-20", phone: "+91 9731088771", quota: "KCET" },
  { sequence: 53, firstName: "Varsha", lastName: "N", gender: "F", dob: "2005-04-20", phone: "+91 8792916212", quota: "KCET" },
  { sequence: 54, firstName: "Vignesh", lastName: "B", gender: "M", dob: "2007-04-09", phone: "+91 9535752764", quota: "KCET" },
  { sequence: 55, firstName: "Vikas", lastName: "N P", gender: "M", dob: "2007-01-29", phone: "+91 9036062676", quota: "KCET" },
  { sequence: 56, firstName: "Bhavya Sree", lastName: "Y", gender: "F", dob: "2005-03-04", phone: "+91 6360901719", quota: "KCET" },
  { sequence: 57, firstName: "Yasin", lastName: "Pasha", gender: "M", dob: "2005-02-26", phone: "+91 9986797921", quota: "KCET" },
];
