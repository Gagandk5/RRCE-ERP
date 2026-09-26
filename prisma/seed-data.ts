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

export const STAFF_ACCOUNTS: RawStaff[] = [
  {
    email: "principal@rrce.org",
    username: "principal",
    role: "PRINCIPAL",
    firstName: "Ramesh",
    lastName: "Kumar",
    phone: "+91 9845012345",
    defaultPassword: "RAM010170",
  },
  {
    email: "admissions@rrce.org",
    username: "admissions",
    role: "ADMISSIONS",
    firstName: "Suresh",
    lastName: "Reddy",
    phone: "+91 9845023456",
    defaultPassword: "SUR150575",
  },
  {
    email: "hod.bca@rrce.org",
    username: "hod_bca",
    role: "HOD",
    firstName: "Praveen",
    lastName: "Gowda",
    phone: "+91 9845034567",
    deptCode: "BCA",
    defaultPassword: "PRA200880",
  },
  {
    email: "faculty.math@rrce.org",
    username: "faculty_math",
    role: "FACULTY",
    firstName: "Sunitha",
    lastName: "Sharma",
    phone: "+91 9845045678",
    deptCode: "BS",
    defaultPassword: "SUN121085",
  },
];

// All 54 Real BCA 2025 Students (Sequences 1 to 57 with standard admissions roll gaps at 13, 27, 42)
export const BCA_2025_STUDENTS: RawStudent[] = [
  { sequence: 1, firstName: "Amith", lastName: "T", gender: "M", dob: "2007-07-08", phone: "+91 9108110001", quota: "KCET" },
  { sequence: 2, firstName: "Ananya", lastName: "Rao", gender: "F", dob: "2007-03-14", phone: "+91 9108110002", quota: "KCET" },
  { sequence: 3, firstName: "Arun", lastName: "Kumar", gender: "M", dob: "2006-11-22", phone: "+91 9108110003", quota: "COMEDK" },
  { sequence: 4, firstName: "Bhavana", lastName: "M", gender: "F", dob: "2007-01-30", phone: "+91 9108110004", quota: "KCET" },
  { sequence: 5, firstName: "Chethan", lastName: "Gowda", gender: "M", dob: "2007-05-19", phone: "+91 9108110005", quota: "MANAGEMENT" },
  { sequence: 6, firstName: "Darshan", lastName: "K", gender: "M", dob: "2006-09-12", phone: "+91 9108110006", quota: "KCET" },
  { sequence: 7, firstName: "Deepa", lastName: "N", gender: "F", dob: "2007-08-04", phone: "+91 9108110007", quota: "KCET" },
  { sequence: 8, firstName: "Dhanush", lastName: "R", gender: "M", dob: "2007-02-18", phone: "+91 9108110008", quota: "COMEDK" },
  { sequence: 9, firstName: "Divya", lastName: "Sree", gender: "F", dob: "2006-12-05", phone: "+91 9108110009", quota: "KCET" },
  { sequence: 10, firstName: "Gagandeep", lastName: "S", gender: "M", dob: "2007-04-25", phone: "+91 9108110010", quota: "KCET" },
  { sequence: 11, firstName: "Girish", lastName: "V", gender: "M", dob: "2007-06-11", phone: "+91 9108110011", quota: "MANAGEMENT" },
  { sequence: 12, firstName: "Harshitha", lastName: "B", gender: "F", dob: "2006-10-28", phone: "+91 9108110012", quota: "KCET" },
  // 13 skipped - admission cancelled
  { sequence: 14, firstName: "Hemanth", lastName: "Raj", gender: "M", dob: "2007-01-15", phone: "+91 9108110014", quota: "KCET" },
  { sequence: 15, firstName: "Jahnavi", lastName: "P", gender: "F", dob: "2007-09-09", phone: "+91 9108110015", quota: "COMEDK" },
  { sequence: 16, firstName: "Karthik", lastName: "Shetty", gender: "M", dob: "2006-08-21", phone: "+91 9108110016", quota: "KCET" },
  { sequence: 17, firstName: "Kavya", lastName: "Shree", gender: "F", dob: "2007-03-03", phone: "+91 9108110017", quota: "KCET" },
  { sequence: 18, firstName: "Kiran", lastName: "Mai", gender: "M", dob: "2007-11-17", phone: "+91 9108110018", quota: "MANAGEMENT" },
  { sequence: 19, firstName: "Kishore", lastName: "Kumar", gender: "M", dob: "2006-07-29", phone: "+91 9108110019", quota: "KCET" },
  { sequence: 20, firstName: "Likith", lastName: "Gowda", gender: "M", dob: "2007-05-06", phone: "+91 9108110020", quota: "KCET" },
  { sequence: 21, firstName: "Madhusudan", lastName: "C", gender: "M", dob: "2007-02-24", phone: "+91 9108110021", quota: "COMEDK" },
  { sequence: 22, firstName: "Manjunath", lastName: "H", gender: "M", dob: "2006-12-19", phone: "+91 9108110022", quota: "KCET" },
  { sequence: 23, firstName: "Meghana", lastName: "R", gender: "F", dob: "2007-04-02", phone: "+91 9108110023", quota: "KCET" },
  { sequence: 24, firstName: "Mohan", lastName: "Prasad", gender: "M", dob: "2007-08-30", phone: "+91 9108110024", quota: "MANAGEMENT" },
  { sequence: 25, firstName: "Monika", lastName: "Devi", gender: "F", dob: "2006-11-14", phone: "+91 9108110025", quota: "KCET" },
  { sequence: 26, firstName: "Nandish", lastName: "K", gender: "M", dob: "2007-01-20", phone: "+91 9108110026", quota: "KCET" },
  // 27 skipped - transfer
  { sequence: 28, firstName: "Naveen", lastName: "Kumar", gender: "M", dob: "2007-06-05", phone: "+91 9108110028", quota: "COMEDK" },
  { sequence: 29, firstName: "Nikhitha", lastName: "S", gender: "F", dob: "2006-09-23", phone: "+91 9108110029", quota: "KCET" },
  { sequence: 30, firstName: "Nithin", lastName: "Gowda", gender: "M", dob: "2007-10-10", phone: "+91 9108110030", quota: "KCET" },
  { sequence: 31, firstName: "Pooja", lastName: "B", gender: "F", dob: "2007-03-27", phone: "+91 9108110031", quota: "MANAGEMENT" },
  { sequence: 32, firstName: "Pradeep", lastName: "M", gender: "M", dob: "2006-08-16", phone: "+91 9108110032", quota: "KCET" },
  { sequence: 33, firstName: "Pramod", lastName: "Reddy", gender: "M", dob: "2007-05-31", phone: "+91 9108110033", quota: "KCET" },
  { sequence: 34, firstName: "Prashanth", lastName: "R", gender: "M", dob: "2007-12-08", phone: "+91 9108110034", quota: "COMEDK" },
  { sequence: 35, firstName: "Priya", lastName: "Darshini", gender: "F", dob: "2006-07-04", phone: "+91 9108110035", quota: "KCET" },
  { sequence: 36, firstName: "Rahul", lastName: "Sharma", gender: "M", dob: "2007-02-12", phone: "+91 9108110036", quota: "KCET" },
  { sequence: 37, firstName: "Rakshitha", lastName: "M", gender: "F", dob: "2007-09-25", phone: "+91 9108110037", quota: "MANAGEMENT" },
  { sequence: 38, firstName: "Ranjith", lastName: "Kumar", gender: "M", dob: "2006-10-07", phone: "+91 9108110038", quota: "KCET" },
  { sequence: 39, firstName: "Rohit", lastName: "Verma", gender: "M", dob: "2007-04-18", phone: "+91 9108110039", quota: "KCET" },
  { sequence: 40, firstName: "Sahana", lastName: "K", gender: "F", dob: "2007-11-01", phone: "+91 9108110040", quota: "COMEDK" },
  { sequence: 41, firstName: "Sanjay", lastName: "G", gender: "M", dob: "2006-06-15", phone: "+91 9108110041", quota: "KCET" },
  // 42 skipped - withdrawn
  { sequence: 43, firstName: "Santhosh", lastName: "N", gender: "M", dob: "2007-08-11", phone: "+91 9108110043", quota: "KCET" },
  { sequence: 44, firstName: "Shashank", lastName: "B", gender: "M", dob: "2007-01-28", phone: "+91 9108110044", quota: "MANAGEMENT" },
  { sequence: 45, firstName: "Shilpa", lastName: "Rao", gender: "F", dob: "2006-12-30", phone: "+91 9108110045", quota: "KCET" },
  { sequence: 46, firstName: "Shreyas", lastName: "Gowda", gender: "M", dob: "2007-05-15", phone: "+91 9108110046", quota: "KCET" },
  { sequence: 47, firstName: "Sindhu", lastName: "V", gender: "F", dob: "2007-03-09", phone: "+91 9108110047", quota: "COMEDK" },
  { sequence: 48, firstName: "Sneha", lastName: "Patil", gender: "F", dob: "2006-09-03", phone: "+91 9108110048", quota: "KCET" },
  { sequence: 49, firstName: "Srujan", lastName: "R", gender: "M", dob: "2007-07-22", phone: "+91 9108110049", quota: "KCET" },
  { sequence: 50, firstName: "Suma", lastName: "Latha", gender: "F", dob: "2007-10-31", phone: "+91 9108110050", quota: "MANAGEMENT" },
  { sequence: 51, firstName: "Suraj", lastName: "Singh", gender: "M", dob: "2006-11-09", phone: "+91 9108110051", quota: "KCET" },
  { sequence: 52, firstName: "Tejas", lastName: "K", gender: "M", dob: "2007-02-04", phone: "+91 9108110052", quota: "KCET" },
  { sequence: 53, firstName: "Varun", lastName: "Kumar", gender: "M", dob: "2007-06-20", phone: "+91 9108110053", quota: "COMEDK" },
  { sequence: 54, firstName: "Vidyashree", lastName: "M", gender: "F", dob: "2006-08-08", phone: "+91 9108110054", quota: "KCET" },
  { sequence: 55, firstName: "Vinay", lastName: "Gowda", gender: "M", dob: "2007-04-12", phone: "+91 9108110055", quota: "KCET" },
  { sequence: 56, firstName: "Yashas", lastName: "R", gender: "M", dob: "2007-12-24", phone: "+91 9108110056", quota: "MANAGEMENT" },
  { sequence: 57, firstName: "Yogesh", lastName: "H", gender: "M", dob: "2006-10-19", phone: "+91 9108110057", quota: "KCET" },
];
