import { describe, expect, it } from "vitest";
import { findTimetableClashes } from "@/lib/clash-engine";
import {
  BCA_2026_2027_TIMETABLE,
  BCA_COURSES,
  BCA_FACULTY_ASSIGNMENTS,
} from "@/prisma/seed-data";

describe("BCA 2026–27 timetable source data", () => {
  it("contains the supplied courses and all specified teaching slots", () => {
    expect(BCA_COURSES.map(({ code }) => code)).toEqual([
      "B25BCA301",
      "B25BCA302",
      "B25BCA303",
      "B25BCA304",
      "B25BCA305",
      "B25BCA306",
      "B25BCAL307",
      "B25BCAL308",
    ]);
    expect(BCA_2026_2027_TIMETABLE).toHaveLength(34);
    expect(
      BCA_2026_2027_TIMETABLE.some(
        ({ dayOfWeek, startTime }) => dayOfWeek === "TUE" && String(startTime) === "15:05"
      )
    ).toBe(false);
  });

  it("preserves both faculty assignments for the co-taught lab courses", () => {
    expect(
      BCA_FACULTY_ASSIGNMENTS.filter(({ courseCode }) => courseCode === "B25BCAL307").map(
        ({ email }) => email
      )
    ).toEqual(["shreya.s@rrce.org", "muruganandham.sk@rrce.org"]);
    expect(
      BCA_FACULTY_ASSIGNMENTS.filter(({ courseCode }) => courseCode === "B25BCAL308").map(
        ({ email }) => email
      )
    ).toEqual(["pushpalatha.g@rrce.org", "deeraj.c@rrce.org"]);
  });
});

describe("published timetable clash summary", () => {
  it("reports each detected faculty, room, or batch conflict", () => {
    const baseSlot = {
      dayOfWeek: "TUE",
      startTime: "13:15",
      endTime: "15:05",
      departmentId: "bca",
      semester: 3,
    };
    const clashes = findTimetableClashes([
      {
        ...baseSlot,
        id: "slot-1",
        subject: "OOP Lab",
        facultyId: "faculty-1",
        roomNumber: "604",
        section: "B1",
      },
      {
        ...baseSlot,
        id: "slot-2",
        subject: "RDBMS Lab",
        facultyId: "faculty-2",
        roomNumber: "604",
        section: "B2",
      },
    ]);
    expect(clashes.map(({ type }) => type)).toEqual(["ROOM_CLASH"]);
  });
});
