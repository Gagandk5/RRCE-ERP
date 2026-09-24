describe('RRCE 3-Layer Timetable Clash Detection Engine', () => {
  function checkOverlap(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ): boolean {
    return startA < endB && endA > startB;
  }

  function detectClashes(
    newSlot: {
      facultyId: string;
      roomNumber: string;
      semesterId: string;
      section: string;
      dayOfWeek: number;
      startTimeMinutes: number;
      endTimeMinutes: number;
    },
    existingSlots: {
      facultyId: string;
      roomNumber: string;
      semesterId: string;
      section: string;
      dayOfWeek: number;
      startTimeMinutes: number;
      endTimeMinutes: number;
    }[],
  ) {
    for (const slot of existingSlots) {
      if (slot.dayOfWeek !== newSlot.dayOfWeek) continue;

      const overlaps = checkOverlap(
        newSlot.startTimeMinutes,
        newSlot.endTimeMinutes,
        slot.startTimeMinutes,
        slot.endTimeMinutes,
      );

      if (!overlaps) continue;

      // Layer 1: Faculty Clash
      if (slot.facultyId === newSlot.facultyId) {
        return { clash: true, layer: 1, type: 'FACULTY_CLASH' };
      }

      // Layer 2: Room Clash
      if (slot.roomNumber.toUpperCase() === newSlot.roomNumber.toUpperCase()) {
        return { clash: true, layer: 2, type: 'ROOM_CLASH' };
      }

      // Layer 3: Section Clash
      if (
        slot.semesterId === newSlot.semesterId &&
        slot.section.toUpperCase() === newSlot.section.toUpperCase()
      ) {
        return { clash: true, layer: 3, type: 'SECTION_CLASH' };
      }
    }

    return { clash: false };
  }

  const existing = [
    {
      facultyId: 'FAC_MATH_01',
      roomNumber: 'LH-204',
      semesterId: 'SEM_BCA_1',
      section: 'A',
      dayOfWeek: 1, // Monday
      startTimeMinutes: 540, // 09:00
      endTimeMinutes: 600,   // 10:00
    },
  ];

  it('should detect Layer 1 Faculty Clash when teacher is booked elsewhere at the same time', () => {
    const result = detectClashes(
      {
        facultyId: 'FAC_MATH_01', // Same faculty
        roomNumber: 'LH-301',     // Different room
        semesterId: 'SEM_CSE_1',  // Different section/dept
        section: 'A',
        dayOfWeek: 1,
        startTimeMinutes: 570, // 09:30 - 10:30 (overlaps 540-600)
        endTimeMinutes: 630,
      },
      existing,
    );

    expect(result.clash).toBe(true);
    expect(result.layer).toBe(1);
    expect(result.type).toBe('FACULTY_CLASH');
  });

  it('should detect Layer 2 Room Clash when room is already occupied', () => {
    const result = detectClashes(
      {
        facultyId: 'FAC_CS_02',   // Different faculty
        roomNumber: 'LH-204',     // Same room
        semesterId: 'SEM_AIML_1', // Different dept
        section: 'B',
        dayOfWeek: 1,
        startTimeMinutes: 540, // 09:00 - 10:00
        endTimeMinutes: 600,
      },
      existing,
    );

    expect(result.clash).toBe(true);
    expect(result.layer).toBe(2);
    expect(result.type).toBe('ROOM_CLASH');
  });

  it('should detect Layer 3 Section Clash when student section has simultaneous classes', () => {
    const result = detectClashes(
      {
        facultyId: 'FAC_ENG_03', // Different faculty
        roomNumber: 'LH-105',    // Different room
        semesterId: 'SEM_BCA_1', // Same semester & section
        section: 'A',
        dayOfWeek: 1,
        startTimeMinutes: 550, // 09:10 - 10:10
        endTimeMinutes: 610,
      },
      existing,
    );

    expect(result.clash).toBe(true);
    expect(result.layer).toBe(3);
    expect(result.type).toBe('SECTION_CLASH');
  });

  it('should permit non-overlapping classes for same faculty or room', () => {
    const result = detectClashes(
      {
        facultyId: 'FAC_MATH_01',
        roomNumber: 'LH-204',
        semesterId: 'SEM_BCA_1',
        section: 'A',
        dayOfWeek: 1,
        startTimeMinutes: 600, // 10:00 - 11:00 (Back-to-back, no overlap)
        endTimeMinutes: 660,
      },
      existing,
    );

    expect(result.clash).toBe(false);
  });
});

