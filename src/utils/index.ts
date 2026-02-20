// ============================================
// bandgo - Utility Functions
// ============================================

import { GENRES, INSTRUMENTS, BAND_ROLES } from '../data/constants';

// ============ FORMATTERS ============

export const formatTimeAgo = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'עכשיו';
    if (diffMins < 60) return `לפני ${diffMins} דקות`;
    if (diffHours < 24) return `לפני ${diffHours} שעות`;
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return d.toLocaleDateString('he-IL');
};

export const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

export const formatShortDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('he-IL', {
        day: 'numeric',
        month: 'short',
    });
};

// ============ LOOKUPS ============

export const getInstrumentName = (id: string): string => {
    const inst = INSTRUMENTS.find(i => i.id === id);
    return inst?.nameHe || id;
};

export const getInstrumentIcon = (id: string): string => {
    const inst = INSTRUMENTS.find(i => i.id === id);
    return inst?.icon || '🎵';
};

export const getGenreName = (id: string): string => {
    const genre = GENRES.find(g => g.id === id);
    return genre?.nameHe || id;
};

export const getRoleName = (id: string): string => {
    const role = BAND_ROLES.find(r => r.id === id);
    return role?.nameHe || id;
};

// ============ HELPERS ============

export const generateId = () => {
    return Math.random().toString(36).substr(2, 9);
};

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
