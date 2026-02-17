import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatTimeAgo,
  formatDate,
  formatShortDate,
  getInstrumentName,
  getInstrumentIcon,
  getGenreName,
  generateId,
  sleep,
} from '../index';

describe('formatTimeAgo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-03-01T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "עכשיו" for less than a minute ago', () => {
    const thirtySecsAgo = new Date('2024-03-01T11:59:40');
    expect(formatTimeAgo(thirtySecsAgo)).toBe('עכשיו');
  });

  it('returns minutes for less than an hour ago', () => {
    const tenMinsAgo = new Date('2024-03-01T11:50:00');
    expect(formatTimeAgo(tenMinsAgo)).toBe('לפני 10 דקות');
  });

  it('returns hours for less than a day ago', () => {
    const threeHoursAgo = new Date('2024-03-01T09:00:00');
    expect(formatTimeAgo(threeHoursAgo)).toBe('לפני 3 שעות');
  });

  it('returns days for less than a week ago', () => {
    const twoDaysAgo = new Date('2024-02-28T12:00:00');
    expect(formatTimeAgo(twoDaysAgo)).toBe('לפני 2 ימים');
  });

  it('returns formatted date for more than a week ago', () => {
    const twoWeeksAgo = new Date('2024-02-15T12:00:00');
    const result = formatTimeAgo(twoWeeksAgo);
    // Should be a locale date string (he-IL format)
    expect(result).toBeTruthy();
    expect(result).not.toContain('לפני');
  });

  it('accepts string dates', () => {
    const result = formatTimeAgo('2024-03-01T11:55:00');
    expect(result).toBe('לפני 5 דקות');
  });
});

describe('formatDate', () => {
  it('formats a date in Hebrew locale', () => {
    const date = new Date('2024-03-15');
    const result = formatDate(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('accepts string dates', () => {
    const result = formatDate('2024-06-01');
    expect(result).toBeTruthy();
  });
});

describe('formatShortDate', () => {
  it('formats a short date without year', () => {
    const date = new Date('2024-03-15');
    const result = formatShortDate(date);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

describe('getInstrumentName', () => {
  it('returns Hebrew name for known instrument', () => {
    expect(getInstrumentName('guitar')).toBe('גיטרה');
    expect(getInstrumentName('drums')).toBe('תופים');
    expect(getInstrumentName('vocals')).toBe('שירה');
    expect(getInstrumentName('bass')).toBe('בס');
  });

  it('returns the id for unknown instrument', () => {
    expect(getInstrumentName('unknown_instrument')).toBe('unknown_instrument');
  });
});

describe('getInstrumentIcon', () => {
  it('returns icon for known instrument', () => {
    expect(getInstrumentIcon('guitar')).toBe('🎸');
    expect(getInstrumentIcon('drums')).toBe('🥁');
    expect(getInstrumentIcon('keyboard')).toBe('🎹');
  });

  it('returns default icon for unknown instrument', () => {
    expect(getInstrumentIcon('unknown')).toBe('🎵');
  });
});

describe('getGenreName', () => {
  it('returns Hebrew name for known genre', () => {
    expect(getGenreName('rock')).toBe('רוק');
    expect(getGenreName('jazz')).toBe("ג'אז");
    expect(getGenreName('pop')).toBe('פופ');
    expect(getGenreName('metal')).toBe('מטאל');
  });

  it('returns the id for unknown genre', () => {
    expect(getGenreName('unknown_genre')).toBe('unknown_genre');
  });
});

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('sleep', () => {
  it('resolves after the given ms', async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
    vi.useRealTimers();
  });
});
