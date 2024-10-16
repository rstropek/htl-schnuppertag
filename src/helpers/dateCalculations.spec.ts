import { expect, describe, it, xit } from '@jest/globals';
import { addWorkdays, isWorkdaysInThePast } from './dateCalculations.js';

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
  it('should return true when the date is more than specified workdays in the past', () => {
    const referenceDate = new Date('2024-03-15'); // Friday
    expect(isWorkdaysInThePast('2024-03-07', referenceDate, -5)).toBe(true);
  });

  it('should return false when the date is less than specified workdays in the past', () => {
    const referenceDate = new Date('2024-03-15'); // Friday
    expect(isWorkdaysInThePast('2024-03-12', referenceDate, -5)).toBe(false);
  });

  it('should return false when the date is in the future', () => {
    const referenceDate = new Date('2024-03-15'); // Friday
    expect(isWorkdaysInThePast('2024-03-20', referenceDate, -5)).toBe(false);
  });

  it('should handle weekends correctly', () => {
    const referenceDate = new Date('2024-03-18'); // Monday
    expect(isWorkdaysInThePast('2024-03-14', referenceDate, -1)).toBe(true);
    expect(isWorkdaysInThePast('2024-03-14', referenceDate, -2)).toBe(false);
  });

  it('should return false when the date is exactly the specified number of workdays in the past', () => {
    const referenceDate = new Date('2024-03-15'); // Friday
    expect(isWorkdaysInThePast('2024-03-08', referenceDate, -5)).toBe(false);
  });

  it('should handle month transitions', () => {
    const referenceDate = new Date('2024-04-03'); // Wednesday
    expect(isWorkdaysInThePast('2024-03-26', referenceDate, -5)).toBe(true);
    expect(isWorkdaysInThePast('2024-03-27', referenceDate, -5)).toBe(false);
  });

  it('should handle year transitions', () => {
    const referenceDate = new Date('2024-01-04'); // Thursday
    expect(isWorkdaysInThePast('2023-12-27', referenceDate, -5)).toBe(true);
    expect(isWorkdaysInThePast('2023-12-28', referenceDate, -5)).toBe(false);
  });

  it('should handle another weekend transitions', () => {
    const referenceDate = new Date('2024-10-16');
    expect(isWorkdaysInThePast('2024-10-11', referenceDate, -2)).toBe(true);
    expect(isWorkdaysInThePast('2024-10-14', referenceDate, -2)).toBe(false);
  });
});
