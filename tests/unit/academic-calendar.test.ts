import { describe, expect, it } from "vitest";
import {
  ACADEMIC_CALENDAR_EVENTS,
  ACADEMIC_CALENDAR_SYLLABUS,
  ACADEMIC_CALENDAR_TITLE,
  getAcademicCalendarEvents,
  getAcademicNonWorkingEvents,
} from "@/lib/academic-calendar";

describe("official BCA academic calendar", () => {
  it("identifies the published semester", () => {
    expect(ACADEMIC_CALENDAR_TITLE).toBe("III / V Semester BCA · 2026–2027 ODD Semester");
  });

  it("keeps the supplied October holidays, Saturday marker, and PTA/review date", () => {
    expect(ACADEMIC_CALENDAR_EVENTS).toContainEqual({
      startDate: "2026-10-03",
      title: "1st Saturday",
      category: "calendar-marker",
    });
    expect(ACADEMIC_CALENDAR_EVENTS).toContainEqual({
      startDate: "2026-10-02",
      title: "Mahatma Gandhi Jayanti",
      category: "holiday",
    });
    expect(ACADEMIC_CALENDAR_EVENTS).toContainEqual({
      startDate: "2026-10-24",
      title: "Academic Review-1",
      category: "academic",
    });
  });

  it("retains date ranges and the corrected hall-ticket date", () => {
    expect(ACADEMIC_CALENDAR_EVENTS).toContainEqual({
      startDate: "2027-01-08",
      title: "Issue of Hall Ticket",
      category: "academic",
    });
    expect(ACADEMIC_CALENDAR_EVENTS).toContainEqual({
      startDate: "2027-01-11",
      endDate: "2027-01-18",
      title: "III & V Semester End Examination · Practical",
      category: "examination",
    });
    expect(ACADEMIC_CALENDAR_EVENTS).toContainEqual({
      startDate: "2027-01-20",
      endDate: "2027-02-02",
      title: "III & V Semester End Examination · Theory",
      category: "examination",
    });
  });

  it("records all three IA syllabus coverage deadlines", () => {
    expect(ACADEMIC_CALENDAR_SYLLABUS.map(({ name, deadline }) => [name, deadline])).toEqual([
      ["IA-1", "2026-10-10"],
      ["IA-2", "2026-11-14"],
      ["IA-3", "2026-12-19"],
    ]);
  });

  it("marks explicit holidays as non-working without inferring from Saturday markers", () => {
    expect(getAcademicNonWorkingEvents("2026-10-02").map(({ title }) => title)).toContain(
      "Mahatma Gandhi Jayanti"
    );
    expect(getAcademicNonWorkingEvents("2026-10-03")).toEqual([]);
    expect(getAcademicCalendarEvents("2026-10-03").map(({ title }) => title)).toContain("1st Saturday");
  });
});
