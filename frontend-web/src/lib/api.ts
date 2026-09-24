export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

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
    label: 'Student (Gagan R)',
    identifier: '1RR25BC007',
    password: 'GAG141207',
    name: 'Gagan R',
    dept: 'BCA Semester 1 (1RR25BC007)',
    route: '/student',
  },
];

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('rrce_erp_token');
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

    // Intercept 403 Mandatory Password Reset
    if (res.status === 403 && (body.message === 'PASSWORD_CHANGE_REQUIRED' || body.error === 'PASSWORD_CHANGE_REQUIRED')) {
      return {
        error: 'PASSWORD_CHANGE_REQUIRED',
        status: 403,
        passwordResetRequired: true,
      };
    }

    // Intercept 409 Timetable Clash
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
