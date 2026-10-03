export type AcademicCalendarCategory =
  | "academic"
  | "holiday"
  | "assessment"
  | "examination"
  | "calendar-marker"
  | "working-day"
  | "non-working-day";

export type AcademicCalendarEvent = {
  startDate: string;
  endDate?: string;
  title: string;
  category: AcademicCalendarCategory;
};

export const ACADEMIC_CALENDAR_TITLE = "III / V Semester BCA · 2026–2027 ODD Semester";

export const ACADEMIC_CALENDAR_EVENTS: AcademicCalendarEvent[] = [
  { startDate: "2026-09-07", title: "Reopen Day", category: "academic" },
  { startDate: "2026-09-12", title: "Internship Review", category: "academic" },
  { startDate: "2026-09-14", title: "Ganesh Chaturthi", category: "holiday" },
  { startDate: "2026-09-19", title: "3rd Saturday", category: "calendar-marker" },
  { startDate: "2026-09-25", title: "Seminar", category: "academic" },
  { startDate: "2026-09-26", title: "Internship Review & Alumni Event", category: "academic" },

  { startDate: "2026-10-02", title: "Mahatma Gandhi Jayanti", category: "holiday" },
  { startDate: "2026-10-03", title: "1st Saturday", category: "calendar-marker" },
  { startDate: "2026-10-10", title: "Mahalaya Amavasye", category: "holiday" },
  { startDate: "2026-10-10", title: "IA-1 syllabus coverage deadline · Modules 1 & 2", category: "assessment" },
  { startDate: "2026-10-16", title: "Industrial Visit", category: "academic" },
  { startDate: "2026-10-17", title: "3rd Saturday", category: "calendar-marker" },
  { startDate: "2026-10-20", title: "Ayudhapooja", category: "holiday" },
  { startDate: "2026-10-21", title: "Vijayadashami", category: "holiday" },
  { startDate: "2026-10-24", title: "PTA Meeting", category: "academic" },
  { startDate: "2026-10-24", title: "Academic Review-1", category: "academic" },
  { startDate: "2026-10-31", title: "Alumni Event", category: "academic" },

  { startDate: "2026-11-05", endDate: "2026-11-06", title: "Technical and Non-Technical Events", category: "academic" },
  { startDate: "2026-11-07", title: "1st Saturday", category: "calendar-marker" },
  { startDate: "2026-11-10", endDate: "2026-11-12", title: "Deepavali", category: "holiday" },
  { startDate: "2026-11-14", title: "Workshop", category: "academic" },
  { startDate: "2026-11-14", title: "IA-2 syllabus coverage deadline · Modules 3 & 4", category: "assessment" },
  { startDate: "2026-11-21", title: "3rd Saturday", category: "calendar-marker" },
  { startDate: "2026-11-27", title: "Kanakadasa Jayanthi", category: "holiday" },
  { startDate: "2026-11-28", title: "PTA Meeting", category: "academic" },

  { startDate: "2026-12-05", title: "1st Saturday", category: "calendar-marker" },
  { startDate: "2026-12-05", title: "Academic Review-II", category: "academic" },
  { startDate: "2026-12-05", title: "Internal Practical Exams", category: "examination" },
  { startDate: "2026-12-19", title: "3rd Saturday", category: "calendar-marker" },
  { startDate: "2026-12-19", title: "Attendance Finalization", category: "academic" },
  { startDate: "2026-12-19", title: "IA-3 syllabus coverage deadline · Modules 4 & 5", category: "assessment" },
  { startDate: "2026-12-25", title: "Christmas", category: "holiday" },

  { startDate: "2027-01-02", title: "Last Working Day", category: "working-day" },
  { startDate: "2027-01-06", title: "Finalization of CIE Marks and Submission to COE", category: "academic" },
  { startDate: "2027-01-08", title: "Issue of Hall Ticket", category: "academic" },
  { startDate: "2027-01-11", endDate: "2027-01-18", title: "III & V Semester End Examination · Practical", category: "examination" },
  { startDate: "2027-01-20", endDate: "2027-02-02", title: "III & V Semester End Examination · Theory", category: "examination" },

  { startDate: "2027-02-08", title: "Declaration of Provisional Results", category: "academic" },
  { startDate: "2027-02-08", title: "Commencement of Even Semester", category: "academic" },
  { startDate: "2027-02-15", endDate: "2027-02-17", title: "Make-Up Examination Registration", category: "academic" },
  { startDate: "2027-02-18", endDate: "2027-02-25", title: "Make-Up Examinations", category: "examination" },
  { startDate: "2027-02-22", endDate: "2027-02-26", title: "PVP / Revaluation Registration", category: "academic" },
  { startDate: "2027-03-03", title: "Declaration of PVP Results & Final Results", category: "academic" },
];

export const ACADEMIC_CALENDAR_SYLLABUS = [
  { name: "IA-1", modules: "1.5 · Modules 1 & 2", deadline: "2026-10-10" },
  { name: "IA-2", modules: "2 · Modules 3 & 4", deadline: "2026-11-14" },
  { name: "IA-3", modules: "1.5 · Modules 4 & 5", deadline: "2026-12-19" },
];

export function getAcademicCalendarEvents(date: string) {
  return ACADEMIC_CALENDAR_EVENTS.filter(
    (event) => event.startDate <= date && (event.endDate || event.startDate) >= date
  );
}

export function getAcademicNonWorkingEvents(date: string) {
  return getAcademicCalendarEvents(date).filter(
    (event) => event.category === "holiday" || event.category === "non-working-day"
  );
}
