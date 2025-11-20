import { getStreakInfo, saveDailyResult, hasPlayedToday, testMigrateOldFormat } from '../tags/localSave';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('tags/localSave - getStreakInfo', () => {
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
    it('should return currentStreak of 1 after saving today with success', () => {
      saveDailyResult('2025-11-19', true, 3);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });

    it('should return currentStreak of 0 after saving today with failure', () => {
      saveDailyResult('2025-11-19', false, 5);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(0);
    });

    it('should return currentStreak of 0 if only past days are saved (skipped today and yesterday)', () => {
      saveDailyResult('2025-11-17', true, 3);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(1);
    });

    it('should return currentStreak of 1 if yesterday is saved (today not played)', () => {
      saveDailyResult('2025-11-18', true, 3);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });
  });

  describe('when consecutive days are saved', () => {
    it('should return correct currentStreak for consecutive successful days up to today', () => {
      saveDailyResult('2025-11-17', true, 2);
      saveDailyResult('2025-11-18', true, 3);
      saveDailyResult('2025-11-19', true, 5);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(3);
      expect(result.highestStreak).toBe(3);
    });

    it('should break streak when unsuccessful attempt is encountered', () => {
      saveDailyResult('2025-11-17', true, 1);
      saveDailyResult('2025-11-18', false, 5);
      saveDailyResult('2025-11-19', true, 2);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });
  });

  describe('when streak is broken', () => {
    it('should reset currentStreak when skipping today (no entry today or yesterday)', () => {
      saveDailyResult('2025-11-17', true, 2);
      saveDailyResult('2025-11-18', true, 3);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(2);
      expect(result.highestStreak).toBe(2);
    });

    it('should reset currentStreak when unsuccessful day breaks the chain', () => {
      saveDailyResult('2025-11-17', true, 2);
      saveDailyResult('2025-11-18', true, 3);
      saveDailyResult('2025-11-19', false, 5);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
    });
  });

  describe('when replaying the same day', () => {
    it('should not increase currentStreak when replaying same day', () => {
      saveDailyResult('2025-11-18', true, 2);
      saveDailyResult('2025-11-19', true, 3);
      saveDailyResult('2025-11-19', false, 5);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
    });

    it('should update the streak when replaying with failure', () => {
      saveDailyResult('2025-11-18', true, 1);
      saveDailyResult('2025-11-19', true, 2);
      
      let result = getStreakInfo();
      expect(result.currentStreak).toBe(2);

      saveDailyResult('2025-11-19', false, 5);
      result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
    });
  });

  describe('when streak grows', () => {
    it('should update highestStreak when currentStreak surpasses it', () => {
      saveDailyResult('2025-11-19', true, 1);
      let result = getStreakInfo();
      expect(result.highestStreak).toBe(1);

      vi.setSystemTime(new Date('2025-11-20').getTime());
      saveDailyResult('2025-11-20', true, 2);
      result = getStreakInfo();
      expect(result.highestStreak).toBe(2);

      vi.setSystemTime(new Date('2025-11-21').getTime());
      saveDailyResult('2025-11-21', true, 2);
      result = getStreakInfo();
      expect(result.highestStreak).toBe(3);

      vi.setSystemTime(new Date('2025-11-22').getTime());
      saveDailyResult('2025-11-22', true, 3);
      result = getStreakInfo();
      expect(result.highestStreak).toBe(4);
    });
  });

  describe('when streak is broken but previously had higher streak', () => {
    it('should maintain highestStreak but reset currentStreak', () => {
      saveDailyResult('2025-11-17', true, 1);
      saveDailyResult('2025-11-18', true, 2);
      saveDailyResult('2025-11-19', true, 2);

      let result = getStreakInfo();
      expect(result.highestStreak).toBe(3);
      expect(result.currentStreak).toBe(3);

      vi.setSystemTime(new Date('2025-11-21').getTime());
      saveDailyResult('2025-11-21', false, 1);

      result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle minimum guessesUsed value with success', () => {
      saveDailyResult('2025-11-19', true, 1);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(1);
      expect(result.highestStreak).toBe(1);
    });

    it('should handle maximum guessesUsed value with failure', () => {
      saveDailyResult('2025-11-19', false, 999);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(0);
    });

    it('should handle many consecutive successful days up to today', () => {
      for (let i = 0; i < 15; i++) {
        const date = new Date('2025-11-19');
        date.setDate(date.getDate() - (14 - i));
        const dateString = date.toISOString().split('T')[0];
        saveDailyResult(dateString, true, 2 + (i % 4));
      }

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(15);
      expect(result.highestStreak).toBe(15);
    });

    it('should break streak if there is a gap before today', () => {
      saveDailyResult('2025-11-16', true, 2);
      saveDailyResult('2025-11-17', true, 3);
      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
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
      saveDailyResult('2025-11-18', true, 1);
      saveDailyResult('2025-11-19', true, 2);
      let result = getStreakInfo();
      expect(result.currentStreak).toBeLessThanOrEqual(result.highestStreak);

      vi.setSystemTime(new Date('2025-11-21').getTime());
      result = getStreakInfo();
      expect(result.currentStreak).toBeLessThanOrEqual(result.highestStreak);
    });
  });

  describe('streak behavior with today check', () => {
    it('should return 0 if skipped both today and yesterday', () => {
      saveDailyResult('2025-11-16', true, 1);
      saveDailyResult('2025-11-17', true, 2);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(0);
      expect(result.highestStreak).toBe(2);
    });

    it('should count streak if played yesterday (today not played yet)', () => {
      saveDailyResult('2025-11-18', true, 1);
      saveDailyResult('2025-11-17', true, 2);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(2);
      expect(result.highestStreak).toBe(2);
    });

    it('should continue counting if today is played', () => {
      saveDailyResult('2025-11-19', true, 1);
      saveDailyResult('2025-11-18', true, 2);
      saveDailyResult('2025-11-17', true, 3);

      const result = getStreakInfo();
      expect(result.currentStreak).toBe(3);
      expect(result.highestStreak).toBe(3);
    });
  });

  describe('migrateOldFormat', () => {
    it('should convert old format with currentStreak array to new format', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-17', success: true, guessesUsed: 2 },
          { day: '2025-11-18', success: true, guessesUsed: 3 },
          { day: '2025-11-19', success: true, guessesUsed: 5 }
        ],
        highestStreak: 5,
        allDays: {}
      };

      localStorage.setItem('dailySaveTags', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySaveTags');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(parsed.currentStreak).toBeUndefined();
      expect(parsed.highestStreak).toBe(5);
      expect(parsed.allDays['2025-11-17']).toEqual({ day: '2025-11-17', success: true, guessesUsed: 2 });
      expect(parsed.allDays['2025-11-18']).toEqual({ day: '2025-11-18', success: true, guessesUsed: 3 });
      expect(parsed.allDays['2025-11-19']).toEqual({ day: '2025-11-19', success: true, guessesUsed: 5 });
    });

    it('should preserve existing allDays when migrating', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-18', success: true, guessesUsed: 3 },
          { day: '2025-11-19', success: true, guessesUsed: 5 }
        ],
        highestStreak: 3,
        allDays: {
          '2025-11-17': { day: '2025-11-17', success: true, guessesUsed: 2 }
        }
      };

      localStorage.setItem('dailySaveTags', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySaveTags');
      const parsed = JSON.parse(saved!);

      expect(parsed.allDays['2025-11-17']).toEqual({ day: '2025-11-17', success: true, guessesUsed: 2 });
      expect(parsed.allDays['2025-11-18']).toEqual({ day: '2025-11-18', success: true, guessesUsed: 3 });
      expect(parsed.allDays['2025-11-19']).toEqual({ day: '2025-11-19', success: true, guessesUsed: 5 });
    });

    it('should handle empty currentStreak array during migration', () => {
      const oldFormat = {
        currentStreak: [],
        highestStreak: 2,
        allDays: {
          '2025-11-18': { day: '2025-11-18', success: true, guessesUsed: 2 },
          '2025-11-19': { day: '2025-11-19', success: true, guessesUsed: 3 }
        }
      };

      localStorage.setItem('dailySaveTags', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySaveTags');
      const parsed = JSON.parse(saved!);

      expect(parsed.currentStreak).toBeUndefined();
      expect(parsed.highestStreak).toBe(2);
      expect(Object.keys(parsed.allDays).length).toBe(2);
    });

    it('should maintain highestStreak value after migration', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-17', success: true, guessesUsed: 1 },
          { day: '2025-11-18', success: true, guessesUsed: 2 }
        ],
        highestStreak: 10,
        allDays: {}
      };

      localStorage.setItem('dailySaveTags', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySaveTags');
      const parsed = JSON.parse(saved!);

      expect(parsed.highestStreak).toBe(10);
    });

    it('should not duplicate entries when allDays already contains the day', () => {
      const oldFormat = {
        currentStreak: [
          { day: '2025-11-18', success: false, guessesUsed: 5 }
        ],
        highestStreak: 1,
        allDays: {
          '2025-11-18': { day: '2025-11-18', success: true, guessesUsed: 2 }
        }
      };

      localStorage.setItem('dailySaveTags', JSON.stringify(oldFormat));
      testMigrateOldFormat();

      const saved = localStorage.getItem('dailySaveTags');
      const parsed = JSON.parse(saved!);

      expect(parsed.allDays['2025-11-18']).toEqual({ day: '2025-11-18', success: true, guessesUsed: 2 });
    });
  });
});
