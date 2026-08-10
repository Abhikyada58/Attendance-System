import { calculatePercentage, determineStatus, ATTENDANCE_RULES } from './attendance.rules';

describe('Attendance Rules Core Logic', () => {
  describe('calculatePercentage', () => {
    it('should correctly calculate standard percentages', () => {
      expect(calculatePercentage(8, 10)).toBe(80);
      expect(calculatePercentage(3, 4)).toBe(75);
    });

    it('should handle zero sessions safely', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(5, 0)).toBe(0);
    });

    it('should round correctly to 2 decimal places', () => {
      expect(calculatePercentage(2, 3)).toBe(66.67);
      expect(calculatePercentage(1, 7)).toBe(14.29);
    });
  });

  describe('determineStatus', () => {
    it('should return NO_DATA when sessions are 0', () => {
      expect(determineStatus(100, 0)).toBe('NO_DATA');
    });

    it('should return SAFE when above warning threshold', () => {
      expect(determineStatus(80, 10)).toBe('SAFE');
      expect(determineStatus(ATTENDANCE_RULES.WARNING_THRESHOLD + 1, 10)).toBe('SAFE');
    });

    it('should return WARNING when exactly on warning threshold', () => {
      expect(determineStatus(ATTENDANCE_RULES.WARNING_THRESHOLD, 10)).toBe('WARNING');
    });

    it('should return WARNING when below warning but above critical', () => {
      expect(determineStatus(70, 10)).toBe('WARNING'); // assuming 75 and 60
    });

    it('should return CRITICAL when exactly on critical threshold', () => {
      expect(determineStatus(ATTENDANCE_RULES.CRITICAL_THRESHOLD, 10)).toBe('CRITICAL');
    });

    it('should return CRITICAL when below critical threshold', () => {
      expect(determineStatus(50, 10)).toBe('CRITICAL');
    });
  });
});
