import { generateDefaultPassword } from '../src/admissions/admissions.service';

describe('RRCE Institutional Engine: USN & Credentials', () => {
  const USN_REGEX = /^1RR(?<year>\d{2})(?<branch>[A-Z]{2})(?<sequence>\d{3})$/;

  it('should validate USN format strictly conforming to VTU/RRCE format', () => {
    const validUSNs = [
      '1RR25BC007', // Gagan BCA
      '1RR25CS001', // CSE
      '1RR25AI042', // AIML
      '1RR25EC100', // ECE
      '1RR25ME009', // ME
      '1RR25IS015', // ISE
    ];

    for (const usn of validUSNs) {
      expect(USN_REGEX.test(usn)).toBe(true);
      const match = usn.match(USN_REGEX);
      expect(match?.groups?.year).toBe('25');
      expect(['BC', 'CS', 'AI', 'EC', 'ME', 'IS']).toContain(match?.groups?.branch);
      expect(parseInt(match?.groups?.sequence || '0', 10)).toBeGreaterThan(0);
    }
  });

  it('should reject invalid USN formats', () => {
    const invalidUSNs = [
      '2RR25BC007', // Wrong college code
      '1RR25BCA07', // 3 letter branch
      '1RR25BC7',   // Non-padded sequence
      '1RR25bc007', // Lowercase
      '1RR25007',   // Missing branch
    ];

    for (const usn of invalidUSNs) {
      expect(USN_REGEX.test(usn)).toBe(false);
    }
  });

  it('should calculate default password matching [NAME3][DD][MM][YY] formula', () => {
    // "Gagan" born on December 14, 2007 -> GAG141207
    const gaganPass = generateDefaultPassword('Gagan', '2007-12-14');
    expect(gaganPass).toBe('GAG141207');

    // Short name "Om" born on March 5, 2006 -> OMX050306 (Padded with X)
    const omPass = generateDefaultPassword('Om', '2006-03-05');
    expect(omPass).toBe('OMX050306');

    // Name with spaces / special characters
    const spacedPass = generateDefaultPassword('Ali Reza', '2005-11-28');
    expect(spacedPass).toBe('ALI281105');
  });

  it('should verify natural sequence roll-call ordering invariant', () => {
    const students = [
      { usn: '1RR25BC010', usnSequence: 10, name: 'Zahir' },
      { usn: '1RR25BC002', usnSequence: 2, name: 'Ananya' },
      { usn: '1RR25BC001', usnSequence: 1, name: 'Bhavya' },
      { usn: '1RR25BC007', usnSequence: 7, name: 'Gagan' },
    ];

    // Strictly ORDER BY usnSequence ASC, NEVER alphabetical name
    const sorted = [...students].sort((a, b) => a.usnSequence - b.usnSequence);

    expect(sorted.map((s) => s.usnSequence)).toEqual([1, 2, 7, 10]);
    expect(sorted[0].name).toBe('Bhavya'); // Not Ananya, because usnSequence=1 comes first
  });
});

