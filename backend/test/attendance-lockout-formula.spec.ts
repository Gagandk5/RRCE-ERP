describe('RRCE Attendance Engine: Formula, Guard & 24h Lockout', () => {
  function calculateAttendance(
    records: { status: 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' }[],
  ) {
    const totalConducted = records.length;
    // Guard: If Total Conducted = 0, return 100.00%
    if (totalConducted === 0) {
      return { percentage: 100.0, isEligible: true, totalConducted: 0 };
    }

    let attended = 0;
    let excused = 0;

    for (const r of records) {
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        attended++;
      } else if (r.status === 'EXCUSED') {
        excused++;
      }
    }

    // Formula: (Attended + Excused) / Total Conducted * 100
    const raw = ((attended + excused) / totalConducted) * 100;
    const percentage = Math.round(raw * 100) / 100;
    const isEligible = percentage >= 75.0;

    return { percentage, isEligible, totalConducted, attended, excused };
  }

  function checkEditLockout(createdAt: Date): { isLocked: boolean; hoursElapsed: number } {
    const now = Date.now();
    const hoursElapsed = (now - createdAt.getTime()) / (1000 * 60 * 60);
    return {
      isLocked: hoursElapsed > 24,
      hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    };
  }

  it('should enforce zero conducted guard returning 100.00%', () => {
    const result = calculateAttendance([]);
    expect(result.percentage).toBe(100.0);
    expect(result.isEligible).toBe(true);
    expect(result.totalConducted).toBe(0);
  });

  it('should calculate attendance with medical excused sessions counted towards attendance %', () => {
    // 10 sessions total: 6 Present, 2 Excused (Medical), 2 Absent
    // Total attended/excused = 8 / 10 = 80.00% -> Eligible
    const records = [
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'EXCUSED' as const },
      { status: 'EXCUSED' as const },
      { status: 'ABSENT' as const },
      { status: 'ABSENT' as const },
    ];

    const result = calculateAttendance(records);
    expect(result.percentage).toBe(80.0);
    expect(result.isEligible).toBe(true);
  });

  it('should flag student as ineligible when below 75% threshold', () => {
    // 10 sessions: 6 Present, 4 Absent -> 60.00% -> Ineligible (<75%)
    const records = [
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'PRESENT' as const },
      { status: 'ABSENT' as const },
      { status: 'ABSENT' as const },
      { status: 'ABSENT' as const },
      { status: 'ABSENT' as const },
    ];

    const result = calculateAttendance(records);
    expect(result.percentage).toBe(60.0);
    expect(result.isEligible).toBe(false);
  });

  it('should lock edits when session was created more than 24 hours ago', () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const lockCheck = checkEditLockout(twentyFiveHoursAgo);
    expect(lockCheck.isLocked).toBe(true);
    expect(lockCheck.hoursElapsed).toBeGreaterThanOrEqual(24.9);

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const recentCheck = checkEditLockout(twoHoursAgo);
    expect(recentCheck.isLocked).toBe(false);
    expect(recentCheck.hoursElapsed).toBeLessThan(3);
  });
});

