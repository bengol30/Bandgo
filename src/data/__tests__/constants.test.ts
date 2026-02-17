import { describe, it, expect } from 'vitest';
import {
  INSTRUMENTS,
  GENRES,
  REGIONS,
  DEFAULT_SETTINGS,
  APP_NAME,
  APP_TAGLINE,
} from '../constants';

describe('INSTRUMENTS', () => {
  it('contains expected instruments', () => {
    expect(INSTRUMENTS.length).toBeGreaterThan(0);

    const guitarInst = INSTRUMENTS.find(i => i.id === 'guitar');
    expect(guitarInst).toBeDefined();
    expect(guitarInst!.name).toBe('Guitar');
    expect(guitarInst!.nameHe).toBe('גיטרה');
    expect(guitarInst!.icon).toBe('🎸');
  });

  it('has unique ids', () => {
    const ids = INSTRUMENTS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has both English and Hebrew names for all', () => {
    INSTRUMENTS.forEach(inst => {
      expect(inst.name).toBeTruthy();
      expect(inst.nameHe).toBeTruthy();
      expect(inst.id).toBeTruthy();
    });
  });

  it('contains 20 instruments', () => {
    expect(INSTRUMENTS).toHaveLength(20);
  });
});

describe('GENRES', () => {
  it('contains expected genres', () => {
    expect(GENRES.length).toBeGreaterThan(0);

    const rock = GENRES.find(g => g.id === 'rock');
    expect(rock).toBeDefined();
    expect(rock!.name).toBe('Rock');
    expect(rock!.nameHe).toBe('רוק');
  });

  it('has unique ids', () => {
    const ids = GENRES.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has both English and Hebrew names for all', () => {
    GENRES.forEach(genre => {
      expect(genre.name).toBeTruthy();
      expect(genre.nameHe).toBeTruthy();
      expect(genre.id).toBeTruthy();
    });
  });

  it('contains 21 genres', () => {
    expect(GENRES).toHaveLength(21);
  });
});

describe('REGIONS', () => {
  it('contains all 6 regions', () => {
    expect(REGIONS).toHaveLength(6);
  });

  it('has expected regions', () => {
    const regionIds = REGIONS.map(r => r.id);
    expect(regionIds).toContain('north');
    expect(regionIds).toContain('tel-aviv');
    expect(regionIds).toContain('center');
    expect(regionIds).toContain('south');
    expect(regionIds).toContain('jerusalem');
    expect(regionIds).toContain('haifa');
  });

  it('has Hebrew names', () => {
    REGIONS.forEach(region => {
      expect(region.nameHe).toBeTruthy();
    });
  });
});

describe('DEFAULT_SETTINGS', () => {
  it('has correct default values', () => {
    expect(DEFAULT_SETTINGS.rehearsalGoal).toBe(3);
    expect(DEFAULT_SETTINGS.pollDurationHours).toBe(24);
    expect(DEFAULT_SETTINGS.autoFinalizePoll).toBe(true);
    expect(DEFAULT_SETTINGS.googleCalendarConnected).toBe(false);
  });
});

describe('APP constants', () => {
  it('has app name', () => {
    expect(APP_NAME).toBe('Band.go');
  });

  it('has app tagline', () => {
    expect(APP_TAGLINE).toBe('כאן בונים להקות');
  });
});
