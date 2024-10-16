import { expect, describe, it, xit } from '@jest/globals';
import { addWorkdays, isTodayWorkdaysInThePast } from './dateCalculations.js';

describe('addWorkdays', () => {
  it('should add workdays correctly starting from a Monday', () => {
    expect(addWorkdays('2024-03-04', 5)).toBe('2024-03-11');
  });

  it('should subtract workdays correctly', () => {
    expect(addWorkdays('2024-03-11', -5)).toBe('2024-03-04');
  });

  it('should skip weekends when adding workdays', () => {
    expect(addWorkdays('2024-03-08', 2)).toBe('2024-03-12');
  });

  it('should skip weekends when subtracting workdays', () => {
    expect(addWorkdays('2024-03-12', -2)).toBe('2024-03-08');
  });

  it('should handle adding zero workdays', () => {
    expect(addWorkdays('2024-03-15', 0)).toBe('2024-03-15');
  });

  it('should work correctly when starting from a weekend', () => {
    expect(addWorkdays('2024-03-09', 3)).toBe('2024-03-13'); // Starting from a Saturday
    expect(addWorkdays('2024-03-10', 3)).toBe('2024-03-13'); // Starting from a Sunday
  });

  it('should work correctly when subtracting and ending on a weekend', () => {
    expect(addWorkdays('2024-03-13', -3)).toBe('2024-03-08'); // Ending on a Friday
    expect(addWorkdays('2024-03-13', -4)).toBe('2024-03-07'); // Skipping weekend
  });

  it('should handle month transitions', () => {
    expect(addWorkdays('2024-03-29', 5)).toBe('2024-04-05');
    expect(addWorkdays('2024-04-05', -5)).toBe('2024-03-29');
  });

  it('should handle month transition from February to March', () => {
    expect(addWorkdays('2024-02-28', 2)).toBe('2024-03-01');
    expect(addWorkdays('2024-03-01', -2)).toBe('2024-02-28');
  });

  it('should handle transition from CEST to CET', () => {
    // CEST to CET transition typically occurs on the last Sunday of October
    expect(addWorkdays('2024-10-25', 3)).toBe('2024-10-30');
    expect(addWorkdays('2024-10-30', -3)).toBe('2024-10-25');
  });
});

describe('isWorkdaysInThePast', () => {
  it('should handle another weekend transitions', () => {
    expect(isTodayWorkdaysInThePast('2024-10-16', new Date('2024-10-11'), 3)).toBe(true);
    expect(isTodayWorkdaysInThePast('2024-10-16', new Date('2024-10-12'), 3)).toBe(true);
    expect(isTodayWorkdaysInThePast('2024-10-16', new Date('2024-10-13'), 3)).toBe(true);
    expect(isTodayWorkdaysInThePast('2024-10-16', new Date('2024-10-14'), 3)).toBe(false);
    expect(isTodayWorkdaysInThePast('2024-10-16', new Date('2024-10-15'), 3)).toBe(false);
  });
});
