// ============================================
// bandgo - Constants & Default Data
// ============================================

import type { Genre, Instrument, SystemSettings } from '../types';

export const INSTRUMENTS: Instrument[] = [
    { id: 'guitar', name: 'Guitar', nameHe: 'גיטרה', icon: '🎸' },
    { id: 'bass', name: 'Bass', nameHe: 'בס', icon: '🎸' },
    { id: 'drums', name: 'Drums', nameHe: 'תופים', icon: '🥁' },
    { id: 'keyboard', name: 'Keyboard', nameHe: 'קלידים', icon: '🎹' },
    { id: 'piano', name: 'Piano', nameHe: 'פסנתר', icon: '🎹' },
    { id: 'vocals', name: 'Vocals', nameHe: 'שירה', icon: '🎤' },
    { id: 'saxophone', name: 'Saxophone', nameHe: 'סקסופון', icon: '🎷' },
    { id: 'trumpet', name: 'Trumpet', nameHe: 'חצוצרה', icon: '🎺' },
    { id: 'violin', name: 'Violin', nameHe: 'כינור', icon: '🎻' },
    { id: 'cello', name: 'Cello', nameHe: "צ'לו", icon: '🎻' },
    { id: 'flute', name: 'Flute', nameHe: 'חליל', icon: '🪈' },
    { id: 'harmonica', name: 'Harmonica', nameHe: 'מפוחית', icon: '🎵' },
    { id: 'ukulele', name: 'Ukulele', nameHe: 'יוקללי', icon: '🪕' },
    { id: 'banjo', name: 'Banjo', nameHe: "בנג'ו", icon: '🪕' },
    { id: 'accordion', name: 'Accordion', nameHe: 'אקורדיון', icon: '🪗' },
    { id: 'darbuka', name: 'Darbuka', nameHe: 'דרבוקה', icon: '🪘' },
    { id: 'percussion', name: 'Percussion', nameHe: 'כלי הקשה', icon: '🪘' },
    { id: 'dj', name: 'DJ', nameHe: 'דיג\'יי', icon: '💿' },
    { id: 'producer', name: 'Producer', nameHe: 'מפיק', icon: '🎚️' },
    { id: 'other', name: 'Other', nameHe: 'אחר', icon: '🎵' },
];

export const GENRES: Genre[] = [
    { id: 'rock', name: 'Rock', nameHe: 'רוק' },
    { id: 'pop', name: 'Pop', nameHe: 'פופ' },
    { id: 'jazz', name: 'Jazz', nameHe: "ג'אז" },
    { id: 'blues', name: 'Blues', nameHe: 'בלוז' },
    { id: 'metal', name: 'Metal', nameHe: 'מטאל' },
    { id: 'punk', name: 'Punk', nameHe: 'פאנק' },
    { id: 'folk', name: 'Folk', nameHe: 'פולק' },
    { id: 'indie', name: 'Indie', nameHe: 'אינדי' },
    { id: 'alternative', name: 'Alternative', nameHe: 'אלטרנטיבי' },
    { id: 'electronic', name: 'Electronic', nameHe: 'אלקטרוני' },
    { id: 'hip-hop', name: 'Hip Hop', nameHe: 'היפ הופ' },
    { id: 'reggae', name: 'Reggae', nameHe: 'רגאיי' },
    { id: 'funk', name: 'Funk', nameHe: 'פאנק' },
    { id: 'soul', name: 'Soul', nameHe: 'סול' },
    { id: 'rnb', name: 'R&B', nameHe: 'אר אנד בי' },
    { id: 'classical', name: 'Classical', nameHe: 'קלאסי' },
    { id: 'world', name: 'World Music', nameHe: 'מוזיקת עולם' },
    { id: 'israeli', name: 'Israeli', nameHe: 'ישראלי' },
    { id: 'mizrahi', name: 'Mizrahi', nameHe: 'מזרחי' },
    { id: 'country', name: 'Country', nameHe: "קאנטרי" },
    { id: 'acoustic', name: 'Acoustic', nameHe: 'אקוסטי' },
];

export const REGIONS = [
    { id: 'north', name: 'North', nameHe: 'צפון' },
    { id: 'haifa', name: 'Haifa', nameHe: 'חיפה והסביבה' },
    { id: 'center', name: 'Center', nameHe: 'מרכז' },
    { id: 'tel-aviv', name: 'Tel Aviv', nameHe: 'תל אביב' },
    { id: 'jerusalem', name: 'Jerusalem', nameHe: 'ירושלים' },
    { id: 'south', name: 'South', nameHe: 'דרום' },
];

export const DEFAULT_SETTINGS: SystemSettings = {
    rehearsalGoal: 3,
    pollDurationHours: 24,
    autoFinalizePoll: true,
    googleCalendarConnected: false,
};

export const DEFAULT_LOCATION = 'סלון המוזיקה של פטיפון, קריית שמונה';

export const APP_NAME = 'Band.go';
export const APP_TAGLINE = 'כאן בונים להקות';

export const AVATAR_OPTIONS = [
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
];

export const BAND_COVER_OPTIONS = [
    'https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=800&q=80', // 1. Guitar close up
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80', // 2. Microphone/Stage
    'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=800&q=80', // 3. Crowd/Concert
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&w=800&q=80', // 4. Club neon
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80', // 5. DJ/Electronic
    'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&w=800&q=80', // 6. Drum kit detailed (Replaced old #6)
    'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80', // 7. Vinyl Record (New)
    'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?auto=format&fit=crop&w=800&q=80', // 8. Piano recital (Moved/Replaced)
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=800&q=80', // 9. Keyboard (Moved/Replaced)
    'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80', // 10. Guitarist Silhouette (New/Replacement)
    'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&w=800&q=80', // 11. Concert crowd arms
    'https://images.unsplash.com/photo-1593697821028-7cc59cfd7b99?auto=format&fit=crop&w=800&q=80', // 12. Studio Microphone (New)
    'https://images.unsplash.com/photo-1519508234439-4f23643125c1?auto=format&fit=crop&w=800&q=80', // 13. Saxophone/Jazz (New)
    'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80', // 14. Songwriting/Notebook (New)
    'https://images.unsplash.com/photo-1445985543470-4102eb9c51e7?auto=format&fit=crop&w=800&q=80', // 15. Band Setup (New)
];
