import { getStreakInfo, saveDailyResult, hasPlayedToday, testMigrateOldFormat } from '../reviews/localSave';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('reviews/localSave - getStreakInfo', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.setSystemTime(new Date('2025-11-19').getTime());
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe('when no data exists in localStorage', () => {
    it('should return zero streak values', () => {
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(0);
    });

    it('should return an object with currentStreak and highestStreak properties', () => {
      const result = getStreakInfo();
      expect(result).toHaveProperty('currentStreak');
      expect(result).toHaveProperty('highestStreak');
    });
  });

  describe('when single day is saved', () => {
    it('should return currentStreak of 1 after saving today', () => {
      saveDailyResult('2025-11-19', 5, [true, true, true, true, true]);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });

    it('should return currentStreak of 0 if only past days are saved (skipped today and yesterday)', () => {
      saveDailyResult('2025-11-17', 5, [true, true, true, true, true]);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(1);
    });

    it('should return currentStreak of 1 if yesterday is saved (today not played)', () => {
      saveDailyResult('2025-11-18', 5, [true, true, true, true, true]);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });
  });

  describe('when consecutive days are saved', () => {
    it('should return correct currentStreak for consecutive days', () => {
      saveDailyResult('2025-11-17', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-18', 4, [true, true, true, true, false]);
      saveDailyResult('2025-11-19', 3, [true, true, true, false, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(3);
      expect(result.highestStreak).toBe(3);
    });

    it('should break streak when there is a gap before today', () => {
      saveDailyResult('2025-11-16', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-17', 4, [true, true, true, true, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
    });
  });

  describe('when streak is broken', () => {
    it('should reset currentStreak when skipping today but yesterday exists', () => {
      saveDailyResult('2025-11-17', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-18', 4, [true, true, true, true, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(2);
      expect(result.highestStreak).toBe(2);
    });

    it('should reset currentStreak when non-consecutive day is added', () => {
      saveDailyResult('2025-11-17', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-18', 4, [true, true, true, true, false]);
      vi.setSystemTime(new Date('2025-11-21').getTime());
      saveDailyResult('2025-11-21', 3, [true, true, true, false, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(2);
    });
  });

  describe('when replaying the same day', () => {
    it('should not increase currentStreak when replaying same day', () => {
      saveDailyResult('2025-11-18', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-19', 4, [true, true, true, true, false]);
      saveDailyResult('2025-11-19', 5, [true, true, true, true, true]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(2);
      expect(result.highestStreak).toBe(2);
    });
  });

  describe('when streak grows', () => {
    it('should update highestStreak when currentStreak surpasses it', () => {
      saveDailyResult('2025-11-19', 5, [true, true, true, true, true]);
      let result = getStreakInfo();
      expect(result.highestStreak).toBe(1);

      vi.setSystemTime(new Date('2025-11-20').getTime());
      saveDailyResult('2025-11-20', 5, [true, true, true, true, true]);
      result = getStreakInfo();
      expect(result.highestStreak).toBe(2);

      vi.setSystemTime(new Date('2025-11-21').getTime());
      saveDailyResult('2025-11-21', 5, [true, true, true, true, true]);
      result = getStreakInfo();
      expect(result.highestStreak).toBe(3);
    });
  });

  describe('when streak is broken but previously had higher streak', () => {
    it('should maintain highestStreak but reset currentStreak', () => {
      saveDailyResult('2025-11-17', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-18', 4, [true, true, true, true, false]);
      saveDailyResult('2025-11-19', 3, [true, true, true, false, false]);

      let result = getStreakInfo();
      expect(result.highestStreak).toBe(3);
      expect(result.currentStreak).toBe(3);

      vi.setSystemTime(new Date('2025-11-21').getTime());
      result = getStreakInfo();

      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty roundResults array', () => {
      saveDailyResult('2025-11-19', 0, []);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });

    it('should handle many consecutive days', () => {
      for (let i = 0; i < 10; i++) {
        const date = new Date('2025-11-19');
        date.setDate(date.getDate() - (9 - i));
        const dateString = date.toISOString().split('T')[0];
        saveDailyResult(dateString, 5, [true, true, true, true, true]);
      }

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(10);
      expect(result.highestStreak).toBe(10);
    });
  });

  describe('return type validation', () => {
    it('should always return numbers for currentStreak and highestStreak', () => {
      const result = getStreakInfo();
      expect(typeof result.currentStreak).toBe('number');
      expect(typeof result.highestStreak).toBe('number');
    });

    it('should never return negative values', () => {
      const result = getStreakInfo();
      expect(result.currentStreak).toBeGreaterThanOrEqual(0);
      expect(result.highestStreak).toBeGreaterThanOrEqual(0);
    });

    it('should always have currentStreak <= highestStreak', () => {
      saveDailyResult('2025-11-18', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-19', 5, [true, true, true, true, true]);
      let result = getStreakInfo();
      expect(result.currentStreak).toBeLessThanOrEqual(result.highestStreak);

      vi.setSystemTime(new Date('2025-11-21').getTime());
      result = getStreakInfo();
      expect(result.currentStreak).toBeLessThanOrEqual(result.highestStreak);
    });
  });

  describe('streak behavior with today check', () => {
    it('should return 0 if skipped both today and yesterday', () => {
      saveDailyResult('2025-11-16', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-17', 4, [true, true, true, true, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
    });

    it('should count streak if played yesterday (today not played yet)', () => {
      saveDailyResult('2025-11-18', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-17', 4, [true, true, true, true, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(2);
      expect(result.highestStreak).toBe(2);
    });

    it('should continue counting if today is played', () => {
      saveDailyResult('2025-11-19', 5, [true, true, true, true, true]);
      saveDailyResult('2025-11-18', 4, [true, true, true, true, false]);
      saveDailyResult('2025-11-17', 3, [true, true, true, false, false]);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(3);
      expect(result.highestStreak).toBe(3);
    });
  });

  describe('migrateOldFormat', () => {
    it('should convert old format with currentStreak array to new format', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-17', numberCorrect: 5, roundResults: [true, true, true, true, true] },
          { day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] },
          { day: '2025-11-19', numberCorrect: 3, roundResults: [true, true, true, false, false] }
        ],
        highestStreak: 5,
        allDays: {}
      };

      localStorage.setItem('dailySave', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySave');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.currentStreak).toBeUndefined();
      expect(parsed.highestStreak).toBe(5);
      expect(parsed.allDays['2025-11-17']).toEqual({ day: '2025-11-17', numberCorrect: 5, roundResults: [true, true, true, true, true] });
      expect(parsed.allDays['2025-11-18']).toEqual({ day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] });
      expect(parsed.allDays['2025-11-19']).toEqual({ day: '2025-11-19', numberCorrect: 3, roundResults: [true, true, true, false, false] });
    });

    it('should preserve existing allDays when migrating', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] },
          { day: '2025-11-19', numberCorrect: 3, roundResults: [true, true, true, false, false] }
        ],
        highestStreak: 3,
        allDays: {
          '2025-11-17': { day: '2025-11-17', numberCorrect: 5, roundResults: [true, true, true, true, true] }
        }
      };

      localStorage.setItem('dailySave', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySave');
      const parsed = JSON.parse(saved!);

      expect(parsed.allDays['2025-11-17']).toEqual({ day: '2025-11-17', numberCorrect: 5, roundResults: [true, true, true, true, true] });
      expect(parsed.allDays['2025-11-18']).toEqual({ day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] });
      expect(parsed.allDays['2025-11-19']).toEqual({ day: '2025-11-19', numberCorrect: 3, roundResults: [true, true, true, false, false] });
    });

    it('should handle empty currentStreak array during migration', () => {
      const oldFormat = {
        currentStreak: [],
        highestStreak: 2,
        allDays: {
          '2025-11-18': { day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] },
          '2025-11-19': { day: '2025-11-19', numberCorrect: 3, roundResults: [true, true, true, false, false] }
        }
      };

      localStorage.setItem('dailySave', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySave');
      const parsed = JSON.parse(saved!);

      expect(parsed.currentStreak).toBeUndefined();
      expect(parsed.highestStreak).toBe(2);
      expect(Object.keys(parsed.allDays).length).toBe(2);
    });

    it('should maintain highestStreak value after migration', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-17', numberCorrect: 5, roundResults: [true, true, true, true, true] },
          { day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] }
        ],
        highestStreak: 10,
        allDays: {}
      };

      localStorage.setItem('dailySave', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySave');
      const parsed = JSON.parse(saved!);

      expect(parsed.highestStreak).toBe(10);
    });

    it('should not duplicate entries when allDays already contains the day', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-18', numberCorrect: 2, roundResults: [true, true, false, false, false] }
        ],
        highestStreak: 1,
        allDays: {
          '2025-11-18': { day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] }
        }
      };

      localStorage.setItem('dailySave', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySave');
      const parsed = JSON.parse(saved!);

      expect(parsed.allDays['2025-11-18']).toEqual({ day: '2025-11-18', numberCorrect: 4, roundResults: [true, true, true, true, false] });
    });
  });
});
