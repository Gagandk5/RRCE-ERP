export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const REMEMBERED_IDENTIFIER_KEY = 'rrce_erp_remembered_identifier';

export interface UserSession {
  id: string;
  username: string;
  email: string;
  role: 'PRINCIPAL' | 'ADMISSION_OFFICE' | 'HOD' | 'FACULTY' | 'STUDENT';
  firstName: string;
  lastName: string;
  isPasswordResetRequired: boolean;
  departmentId?: string;
  departmentName?: string;
  studentProfile?: any;
  facultyProfile?: any;
}

export const DEMO_CREDENTIALS = [
  {
    role: 'PRINCIPAL' as const,
    label: 'Principal (Campus Admin)',
    identifier: 'principal@rrce.org',
    password: 'Password@123',
    name: 'Dr. Ramesh Kumar',
    dept: 'Campus Administration',
    route: '/principal',
  },
  {
    role: 'ADMISSION_OFFICE' as const,
    label: 'Admission Officer',
    identifier: 'admissions@rrce.org',
    password: 'Password@123',
    name: 'Shuresh Gowda',
    dept: 'Registrar & Intake Office',
    route: '/admissions',
  },
  {
    role: 'HOD' as const,
    label: 'HOD - BCA',
    identifier: 'hod.bca@rrce.org',
    password: 'Password@123',
    name: 'Dr. Sunitha Murthy',
    dept: 'Department of Computer Applications',
    route: '/hod',
  },
  {
    role: 'FACULTY' as const,
    label: 'Faculty (Math - Cross-Dept)',
    identifier: 'faculty.math@rrce.org',
    password: 'Password@123',
    name: 'Prof. Ananya Sharma',
    dept: 'Basic Science & Humanities',
    route: '/faculty',
  },
  {
    role: 'STUDENT' as const,
    label: 'Student (Gagan D K)',
    identifier: '1RR25BC007',
    password: 'GAG141207',
    name: 'Gagan D K',
    dept: 'BCA Semester 1 (1RR25BC007)',
    route: '/student',
  },
];

export const RAW_STUDENT_ROSTER: Record<string, { name: string; dob: string; pass: string }> = {
  "1RR25BC001": { name: "Amith T", dob: "08/07/2007", pass: "AMI080707" },
  "1RR25BC002": { name: "Anusha B", dob: "20/04/2007", pass: "ANU200407" },
  "1RR25BC003": { name: "Bhavya M.B", dob: "14/03/2007", pass: "BHA140307" },
  "1RR25BC004": { name: "Bhavya s", dob: "24/08/2007", pass: "BHA240807" },
  "1RR25BC005": { name: "Deepika cs", dob: "15/01/2008", pass: "DEE150108" },
  "1RR25BC007": { name: "Gagan D K", dob: "14/12/2007", pass: "GAG141207" },
  "1RR25BC008": { name: "HEMALATHA.K.M", dob: "03/01/2007", pass: "HEM030107" },
  "1RR25BC009": { name: "Ishu Gupta", dob: "07/08/2008", pass: "ISH070808" },
  "1RR25BC010": { name: "Jasmine. M", dob: "13/02/2007", pass: "JAS130207" },
  "1RR25BC011": { name: "Karan", dob: "06/01/2007", pass: "KAR060107" },
  "1RR25BC012": { name: "Kruthika P", dob: "22/01/2008", pass: "KRU220108" },
  "1RR25BC013": { name: "Kushal P", dob: "23/10/2005", pass: "KUS231005" },
  "1RR25BC014": { name: "L.grishma", dob: "27/11/2006", pass: "LGR271106" },
  "1RR25BC015": { name: "Lakshmish gowda ck", dob: "22/11/2007", pass: "LAK221107" },
  "1RR25BC016": { name: "Likitha V", dob: "07/09/2007", pass: "LIK070907" },
  "1RR25BC017": { name: "M A Deepak", dob: "03/09/2007", pass: "DEE030907" },
  "1RR25BC018": { name: "Mahantesh", dob: "11/01/2007", pass: "MAH110107" },
  "1RR25BC019": { name: "Manoj Kumar G P", dob: "11/03/2007", pass: "MAN110307" },
  "1RR25BC020": { name: "Monish S", dob: "02/04/2007", pass: "MON020407" },
  "1RR25BC021": { name: "Monisha", dob: "28/04/2007", pass: "MON280407" },
  "1RR25BC022": { name: "Murthy NM", dob: "16/10/2006", pass: "MUR161006" },
  "1RR25BC023": { name: "Nandan D R", dob: "25/07/2007", pass: "NAN250707" },
  "1RR25BC024": { name: "Naved Khan", dob: "13/03/2007", pass: "NAV130307" },
  "1RR25BC025": { name: "Neha R", dob: "25/10/2006", pass: "NEH251006" },
  "1RR25BC026": { name: "Nithyashree S", dob: "23/08/2007", pass: "NIT230807" },
  "1RR25BC027": { name: "Pallavi NM", dob: "17/05/2007", pass: "PAL170507" },
  "1RR25BC028": { name: "Piyush AhmdABade", dob: "10/03/2006", pass: "PIY100306" },
  "1RR25BC029": { name: "POOJA BABURAO", dob: "19/03/2007", pass: "POO190307" },
  "1RR25BC030": { name: "Prajwal", dob: "12/02/2007", pass: "PRA120207" },
  "1RR25BC031": { name: "Prakruthi T S", dob: "10/12/2007", pass: "PRA101207" },
  "1RR25BC032": { name: "Prarthana H S", dob: "06/04/2007", pass: "PRA060407" },
  "1RR25BC033": { name: "Prashanth B M", dob: "07/06/2007", pass: "PRA070607" },
  "1RR25BC034": { name: "Rakshita Umesh Naik", dob: "18/12/2006", pass: "RAK181206" },
  "1RR25BC035": { name: "Rimisha.G", dob: "18/08/2007", pass: "RIM180807" },
  "1RR25BC036": { name: "Sahana D V", dob: "28/02/2006", pass: "SAH280206" },
  "1RR25BC037": { name: "Sanjana", dob: "01/11/2008", pass: "SAN011108" },
  "1RR25BC038": { name: "Sanjana yadav", dob: "24/02/2006", pass: "SAN240206" },
  "1RR25BC039": { name: "Shamanth TD", dob: "23/09/2007", pass: "SHA230907" },
  "1RR25BC041": { name: "Sinchana T S", dob: "07/01/2007", pass: "SIN070107" },
  "1RR25BC042": { name: "Sonali Padhi", dob: "25/01/2007", pass: "SON250107" },
  "1RR25BC043": { name: "Sowmya KC", dob: "19/03/2007", pass: "SOW190307" },
  "1RR25BC044": { name: "Spandana N", dob: "21/05/2007", pass: "SPA210507" },
  "1RR25BC045": { name: "Srinivas", dob: "28/06/2007", pass: "SRI280607" },
  "1RR25BC046": { name: "Srujan. S", dob: "27/12/2007", pass: "SRU271207" },
  "1RR25BC047": { name: "sudharshan", dob: "25/12/2006", pass: "SUD251206" },
  "1RR25BC049": { name: "Thanmye.R", dob: "26/03/2008", pass: "THA260308" },
  "1RR25BC050": { name: "Thanushree R", dob: "26/03/2008", pass: "THA260308" },
  "1RR25BC051": { name: "Thanushree. S", dob: "05/12/2006", pass: "THA051206" },
  "1RR25BC052": { name: "Thereem Bano", dob: "20/03/2008", pass: "THE200308" },
  "1RR25BC053": { name: "Varsha N", dob: "20/04/2005", pass: "VAR200405" },
  "1RR25BC054": { name: "Vignesh B", dob: "09/04/2007", pass: "VIG090407" },
  "1RR25BC055": { name: "Vikas np", dob: "29/01/2007", pass: "VIK290107" },
  "1RR25BC056": { name: "Y. BHAVYA SREE", dob: "04/03/2005", pass: "BHA040305" },
  "1RR25BC057": { name: "Yasin pasha", dob: "26/02/2005", pass: "YAS260205" },
};

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rrce_erp_token');
}

export function getRememberedIdentifier(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(REMEMBERED_IDENTIFIER_KEY) || '';
}

export function setRememberedIdentifier(identifier: string, remember: boolean) {
  if (typeof window === 'undefined') return;
  if (remember) {
    localStorage.setItem(REMEMBERED_IDENTIFIER_KEY, identifier.trim());
  } else {
    localStorage.removeItem(REMEMBERED_IDENTIFIER_KEY);
  }
}

export function setStoredToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rrce_erp_token', token);
  }
}

export function getStoredUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('rrce_erp_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user: UserSession) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('rrce_erp_user', JSON.stringify(user));
  }
}

export function clearSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('rrce_erp_token');
    localStorage.removeItem('rrce_erp_user');
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{
  data?: T;
  error?: string;
  status: number;
  passwordResetRequired?: boolean;
  clashDetail?: any;
}> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const body = await res.json().catch(() => ({}));

    if (res.status === 403 && (body.message === 'PASSWORD_CHANGE_REQUIRED' || body.error === 'PASSWORD_CHANGE_REQUIRED')) {
      return {
        error: 'PASSWORD_CHANGE_REQUIRED',
        status: 403,
        passwordResetRequired: true,
      };
    }

    if (res.status === 409) {
      return {
        error: body.message?.message || body.message || 'Timetable Clash Conflict Detected',
        status: 409,
        clashDetail: body.message || body,
      };
    }

    if (!res.ok) {
      return {
        error: body.message || `Request failed with status ${res.status}`,
        status: res.status,
      };
    }

    return { data: body, status: res.status };
  } catch (err: any) {
    return {
      error: err.message || 'Network error connecting to RRCE Backend API',
      status: 0,
    };
  }
}
