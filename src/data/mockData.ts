// ============================================
// bandgo - Mock Data for Local Development
// ============================================

import type {
    User,
    BandRequest,
    BandApplication,
    Band,
    Rehearsal,
    RehearsalPoll,
    Song,
    Post,
    Event,
    EventRegistration,
    Notification,
    SystemSettings,
    Conversation,
    DirectMessage,
    Report as AppReport,
} from '../types';
import {
    UserRole,
    InstrumentLevel,
    BandRequestType,
    BandRequestStatus,
    BandCommitmentLevel,
    ApplicationStatus,
    RehearsalStatus,
    PostType,
    EventType,
} from '../types';
import { DEFAULT_SETTINGS } from './constants';

// ============ MOCK USERS ============
export const mockUsers: User[] = [
    {
        id: 'user-1',
        displayName: 'יונתן כהן',
        email: 'yonatan@example.com',
        phone: '0501234567',
        avatarUrl: 'https://i.pravatar.cc/150?u=user1',
        city: 'קריית שמונה',
        region: 'north',
        radiusKm: 30,
        genres: ['rock', 'blues', 'indie'],
        instruments: [
            { instrumentId: 'guitar', level: InstrumentLevel.ADVANCED },
            { instrumentId: 'vocals', level: InstrumentLevel.INTERMEDIATE },
        ],
        isVocalist: true,
        isSongwriter: true,
        samples: [],
        bio: 'גיטריסט ויוצר שירים. מחפש להקה רצינית לפרויקט מקורי.',
        role: UserRole.USER,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01'),
    },
    {
        id: 'user-2',
        displayName: 'מאיה לוי',
        email: 'maya@example.com',
        phone: '0521234567',
        avatarUrl: 'https://i.pravatar.cc/150?u=user2',
        city: 'צפת',
        region: 'north',
        radiusKm: 40,
        genres: ['jazz', 'soul', 'pop'],
        instruments: [
            { instrumentId: 'vocals', level: InstrumentLevel.PROFESSIONAL },
            { instrumentId: 'keyboard', level: InstrumentLevel.INTERMEDIATE },
        ],
        isVocalist: true,
        isSongwriter: false,
        samples: [],
        bio: 'זמרת עם ניסיון של 5 שנים בהופעות חיות.',
        role: UserRole.USER,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25'),
    },
    {
        id: 'user-3',
        displayName: 'אורי גולד',
        email: 'ori@example.com',
        phone: '0531234567',
        avatarUrl: 'https://i.pravatar.cc/150?u=user3',
        city: 'קריית שמונה',
        region: 'north',
        radiusKm: 25,
        genres: ['rock', 'metal', 'punk'],
        instruments: [
            { instrumentId: 'drums', level: InstrumentLevel.ADVANCED },
        ],
        isVocalist: false,
        isSongwriter: false,
        samples: [],
        bio: 'תופף שאוהב רק רוק כבד!',
        role: UserRole.USER,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
    {
        id: 'user-4',
        displayName: 'נועה שמיר',
        email: 'noa@example.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=user4',
        city: 'ראש פינה',
        region: 'north',
        radiusKm: 35,
        genres: ['folk', 'indie', 'acoustic'],
        instruments: [
            { instrumentId: 'bass', level: InstrumentLevel.INTERMEDIATE },
            { instrumentId: 'ukulele', level: InstrumentLevel.ADVANCED },
        ],
        isVocalist: false,
        isSongwriter: true,
        samples: [],
        bio: 'בסיסטית שאוהבת אינדי ופולק.',
        role: UserRole.USER,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
    },
    {
        id: 'admin-1',
        displayName: 'מנהל המערכת',
        email: 'admin@bandgo.co.il',
        avatarUrl: 'https://i.pravatar.cc/150?u=admin',
        city: 'קריית שמונה',
        region: 'north',
        radiusKm: 100,
        genres: [],
        instruments: [],
        isVocalist: false,
        isSongwriter: false,
        samples: [],
        bio: 'מנהל פרויקט bandgo',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    // ========== NEW TEST USERS ==========
    {
        id: 'user-test-1',
        displayName: 'יוסי הגיטריסט',
        email: 'yossi@test.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=yossi',
        city: 'נהריה',
        region: 'north',
        radiusKm: 40,
        genres: ['rock', 'blues', 'pop'],
        instruments: [
            { instrumentId: 'electric_guitar', level: InstrumentLevel.ADVANCED },
            { instrumentId: 'acoustic_guitar', level: InstrumentLevel.INTERMEDIATE },
        ],
        isVocalist: true,
        isSongwriter: true,
        samples: [],
        bio: 'גיטריסט עם 10 שנות ניסיון, אוהב רוק ובלוז. מחפש להקה רצינית.',
        role: UserRole.USER,
        createdAt: new Date('2024-02-06'),
        updatedAt: new Date('2024-02-06'),
    },
    {
        id: 'user-test-2',
        displayName: 'מירי התופים',
        email: 'miri@test.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=miri',
        city: 'עכו',
        region: 'north',
        radiusKm: 35,
        genres: ['rock', 'metal', 'funk'],
        instruments: [
            { instrumentId: 'drums', level: InstrumentLevel.ADVANCED },
            { instrumentId: 'percussion', level: InstrumentLevel.INTERMEDIATE },
        ],
        isVocalist: false,
        isSongwriter: false,
        samples: [],
        bio: 'מתופפת אגרסיבית, יש לי חדר חזרות פרטי!',
        role: UserRole.USER,
        createdAt: new Date('2024-02-07'),
        updatedAt: new Date('2024-02-07'),
    },
    {
        id: 'user-test-3',
        displayName: 'דני הקלידן',
        email: 'dani@test.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=dani',
        city: 'כרמיאל',
        region: 'north',
        radiusKm: 50,
        genres: ['jazz', 'pop', 'electronic'],
        instruments: [
            { instrumentId: 'keyboard', level: InstrumentLevel.PROFESSIONAL },
            { instrumentId: 'synthesizer', level: InstrumentLevel.ADVANCED },
        ],
        isVocalist: true,
        isSongwriter: true,
        samples: [],
        bio: 'קלידן מקצועי עם סטודיו ביתי. מחפש פרויקטים מעניינים.',
        role: UserRole.USER,
        createdAt: new Date('2024-02-07'),
        updatedAt: new Date('2024-02-07'),
    },
    {
        id: 'user-test-4',
        displayName: 'שרונה הזמרת',
        email: 'sharona@test.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=sharona',
        city: 'צפת',
        region: 'north',
        radiusKm: 45,
        genres: ['soul', 'rnb', 'pop'],
        instruments: [],
        isVocalist: true,
        isSongwriter: true,
        samples: [],
        bio: 'זמרת סול עם קול ייחודי. כתבתי כבר 30 שירים ומחפשת להקה לביצוע.',
        role: UserRole.USER,
        createdAt: new Date('2024-02-08'),
        updatedAt: new Date('2024-02-08'),
    },
    {
        id: 'user-test-5',
        displayName: 'אופיר הבס',
        email: 'ofir@test.com',
        avatarUrl: 'https://i.pravatar.cc/150?u=ofir',
        city: 'קריית שמונה',
        region: 'north',
        radiusKm: 30,
        genres: ['funk', 'rock', 'reggae'],
        instruments: [
            { instrumentId: 'bass', level: InstrumentLevel.ADVANCED },
            { instrumentId: 'double_bass', level: InstrumentLevel.INTERMEDIATE },
        ],
        isVocalist: false,
        isSongwriter: false,
        samples: [],
        bio: 'בסיסט פאנקי, אוהב להשתגע על הבמה!',
        role: UserRole.USER,
        createdAt: new Date('2024-02-08'),
        updatedAt: new Date('2024-02-08'),
    },
];

// ============ MOCK BAND REQUESTS ============
export const mockBandRequests: BandRequest[] = [
    {
        id: 'br-1',
        creatorId: 'user-1',
        title: 'להקת רוק מקורית',
        description: 'מחפש נגנים להקה שתנגן חומר מקורי בסגנון רוק אלטרנטיבי. יש לי כבר 10 שירים מוכנים. מחפש מישהו רציני שרוצה להגיע להופעות.',
        type: BandRequestType.TARGETED,
        status: BandRequestStatus.OPEN,
        genres: ['rock', 'alternative', 'indie'],
        city: 'קריית שמונה',
        region: 'north',
        radiusKm: 40,
        originalVsCoverRatio: 80,
        instrumentSlots: [
            { instrumentId: 'drums', quantity: 1, filledBy: [] },
            { instrumentId: 'bass', quantity: 1, filledBy: [] },
            { instrumentId: 'keyboard', quantity: 1, filledBy: [] },
        ],
        currentMembers: ['user-1'],
        sketches: [
            {
                id: 'sketch-1',
                name: 'סקיצה - שיר 1',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                type: 'audio',
                createdAt: new Date()
            },
            {
                id: 'sketch-2',
                name: 'רעיון לריף - גיטרה',
                url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                type: 'audio',
                createdAt: new Date()
            }
        ],
        sketchPending: true,
        commitmentLevel: BandCommitmentLevel.PROFESSIONAL,
        rehearsalFrequency: 'פעמיים בשבוע',
        targetAgeRange: { min: 20, max: 35 },
        influences: ['Radiohead', 'Arctic Monkeys', 'Nirvana', 'Foo Fighters'],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
    {
        id: 'br-2',
        creatorId: 'user-2',
        title: 'להקת ג׳אז קלאסי',
        description: 'מחפשת נגנים לפרויקט ג\'אז עם סטנדרטים וקצת חומר מקורי. אווירה כיפית ורגועה, עם שאיפה להופיע בברים ואירועים.',
        type: BandRequestType.OPEN,
        status: BandRequestStatus.OPEN,
        genres: ['jazz', 'soul'],
        city: 'צפת',
        region: 'north',
        radiusKm: 50,
        originalVsCoverRatio: 30,
        maxMembers: 5,
        currentMembers: ['user-2'],
        sketches: [],
        sketchPending: false,
        commitmentLevel: BandCommitmentLevel.HOBBY,
        rehearsalFrequency: 'פעם בשבוע',
        influences: ['Miles Davis', 'John Coltrane', 'Ella Fitzgerald'],
        createdAt: new Date('2024-02-03'),
        updatedAt: new Date('2024-02-03'),
    },
    {
        id: 'br-3',
        creatorId: 'user-3',
        title: 'להקת קאברים למסיבות',
        description: 'מחפש נגנים לפרויקט קאברים - רוק, פופ, ישראלי. מטרה: להופיע במסיבות ואירועים פרטיים.',
        type: BandRequestType.TARGETED,
        status: BandRequestStatus.OPEN,
        genres: ['rock', 'pop', 'israeli'],
        city: 'קריית שמונה',
        region: 'north',
        radiusKm: 30,
        originalVsCoverRatio: 0,
        instrumentSlots: [
            { instrumentId: 'guitar', quantity: 1, filledBy: [] },
            { instrumentId: 'bass', quantity: 1, filledBy: [] },
            { instrumentId: 'keyboard', quantity: 1, filledBy: [] },
            { instrumentId: 'vocals', quantity: 1, filledBy: [] },
        ],
        currentMembers: ['user-3'],
        sketches: [],
        sketchPending: true,
        commitmentLevel: BandCommitmentLevel.INTERMEDIATE,
        rehearsalFrequency: 'פעם בשבועיים',
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
    },
];

// ============ MOCK APPLICATIONS ============
export const mockApplications: BandApplication[] = [
    {
        id: 'app-1',
        bandRequestId: 'br-1',
        applicantId: 'user-3',
        instrumentId: 'drums',
        message: 'היי! תופף עם 8 שנות ניסיון, אשמח להצטרף לפרויקט רוק מקורי.',
        status: ApplicationStatus.PENDING,
        createdAt: new Date('2024-02-02'),
    },
    {
        id: 'app-2',
        bandRequestId: 'br-1',
        applicantId: 'user-4',
        instrumentId: 'bass',
        message: 'מאוד מעוניינת! יש לי ציוד משלי ואני זמינה לחזרות קבועות.',
        status: ApplicationStatus.PENDING,
        createdAt: new Date('2024-02-02'),
    },
];

// ============ MOCK BANDS (Formed) ============
export const mockBands: Band[] = [
    {
        id: 'band-1',
        name: 'האש הצפונית',
        description: 'להקת רוק אלטרנטיבי מקריית שמונה. מנגנים חומר מקורי ומכינים אלבום ראשון.',
        coverImageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        genres: ['rock', 'alternative'],
        city: 'קריית שמונה',
        region: 'north',
        members: [
            { userId: 'user-1', instrumentId: 'guitar', joinedAt: new Date('2024-01-15'), isLeader: true },
            { userId: 'user-3', instrumentId: 'drums', joinedAt: new Date('2024-01-20'), isLeader: false },
            { userId: 'user-4', instrumentId: 'bass', joinedAt: new Date('2024-01-22'), isLeader: false },
        ],
        originalBandRequestId: 'br-old-1',
        approvedRehearsalsCount: 2,
        rehearsalGoal: 3,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-02-01'),
    },
];

// ============ MOCK REHEARSALS ============
export const mockRehearsals: Rehearsal[] = [
    {
        id: 'reh-1',
        bandId: 'band-1',
        dateTime: new Date('2024-02-10T18:00:00'),
        durationMinutes: 120,
        location: 'סלון המוזיקה של פטיפון, קריית שמונה',
        status: RehearsalStatus.APPROVED,
        createdAt: new Date('2024-02-05'),
    },
    {
        id: 'reh-2',
        bandId: 'band-1',
        dateTime: new Date('2024-02-17T18:00:00'),
        durationMinutes: 120,
        location: 'סלון המוזיקה של פטיפון, קריית שמונה',
        status: RehearsalStatus.APPROVED,
        createdAt: new Date('2024-02-12'),
    },
    {
        id: 'reh-3',
        bandId: 'band-1',
        dateTime: new Date('2024-02-24T19:00:00'),
        durationMinutes: 120,
        location: 'סלון המוזיקה של פטיפון, קריית שמונה',
        status: RehearsalStatus.SCHEDULED,
        createdAt: new Date('2024-02-18'),
    },
];

// ============ MOCK POLLS ============
export const mockPolls: RehearsalPoll[] = [];

// ============ MOCK SONGS ============
export const mockSongs: Song[] = [
    {
        id: 'song-1',
        bandId: 'band-1',
        title: 'אש בצפון',
        lyrics: 'פזמון:\nאש בצפון, לב בוער\nהמוזיקה מדברת...',
        chords: 'Am - G - F - E\nAm - G - C - G',
        bpm: 120,
        key: 'Am',
        notes: 'להתחיל בגיטרה סולו, תופים נכנסים בבית שני',
        audioFiles: [],
        structure: 'Intro - Verse - Chorus - Verse - Chorus - Bridge - Chorus - Outro',
        createdBy: 'user-1',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-02-01'),
    },
];

// ============ MOCK POSTS ============
export const mockPosts: Post[] = [
    {
        id: 'post-1',
        type: PostType.SYSTEM_AUTO,
        content: '🎸 להקה חדשה התגבשה: "האש הצפונית" - להקת רוק אלטרנטיבי מקריית שמונה!',
        systemEventType: 'band_formed',
        relatedEntityId: 'band-1',
        isPinned: false,
        likesCount: 12,
        commentsCount: 3,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
    {
        id: 'post-2',
        type: PostType.USER_POST,
        authorId: 'user-1',
        content: 'אחרי חזרה מטורפת! סיימנו לסדר את השיר החדש 🔥 בקרוב נעלה הקלטה',
        isPinned: false,
        likesCount: 8,
        commentsCount: 2,
        createdAt: new Date('2024-02-08'),
        updatedAt: new Date('2024-02-08'),
    },
    {
        id: 'post-3',
        type: PostType.ADMIN_MESSAGE,
        content: '📢 הודעה לכל המשתמשים: בשבוע הבא נפתח הרשמה לג\'אם הגדול של פברואר! עקבו אחרי העדכונים.',
        targetAudience: 'all',
        isPinned: true,
        likesCount: 15,
        commentsCount: 5,
        createdAt: new Date('2024-02-06'),
        updatedAt: new Date('2024-02-06'),
    },
    {
        id: 'post-4',
        type: PostType.SYSTEM_AUTO,
        content: '🆕 נפתחה בקשה חדשה להרכב: "להקת רוק מקורית" - מחפשים תופים, בס וקלידים!',
        systemEventType: 'band_request_created',
        relatedEntityId: 'br-1',
        isPinned: false,
        likesCount: 5,
        commentsCount: 1,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
];

// ============ MOCK EVENTS ============
export const mockEvents: Event[] = [
    {
        id: 'event-1',
        title: 'ג\'אם פתוח - פברואר',
        description: 'ג\'אם פתוח לכל המוזיקאים! בואו לנגן, להכיר אנשים חדשים ולהנות. כלים במקום, אפשר גם להביא משלכם.',
        type: EventType.JAM,
        dateTime: new Date('2024-02-28T20:00:00'),
        durationMinutes: 180,
        location: 'סלון המוזיקה של פטיפון, קריית שמונה',
        coverImageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
        capacity: 30,
        organizerId: 'admin-1',
        price: 0,
        createdBy: 'admin-1',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
    },
    {
        id: 'event-2',
        title: 'הופעת להקות - ערב מוזיקה צפונית',
        description: 'ערב הופעות של להקות הפרויקט! 3 להקות יעלו לבמה להופעה של 30 דקות כל אחת.',
        type: EventType.SHARED_PERFORMANCE,
        dateTime: new Date('2024-03-15T21:00:00'),
        durationMinutes: 180,
        location: 'מאהל פטיפון, קריית שמונה',
        coverImageUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800',
        capacity: 100,
        organizerId: 'admin-1',
        price: 30,
        createdBy: 'admin-1',
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
    },
];

// ============ MOCK EVENT REGISTRATIONS ============
export const mockEventRegistrations: EventRegistration[] = [
    {
        id: 'reg-1',
        eventId: 'event-1',
        userId: 'user-1',
        status: 'registered',
        createdAt: new Date('2024-02-02'),
    },
    {
        id: 'reg-2',
        eventId: 'event-1',
        userId: 'user-2',
        status: 'registered',
        createdAt: new Date('2024-02-03'),
    },
];

// ============ MOCK NOTIFICATIONS ============
export const mockNotifications: Notification[] = [
    {
        id: 'notif-1',
        userId: 'user-1',
        type: 'application_received',
        title: 'בקשת הצטרפות חדשה',
        body: 'אורי גולד הגיש בקשה להצטרף להרכב שלך ככלי תופים',
        relatedEntityType: 'application',
        relatedEntityId: 'app-1',
        read: false,
        createdAt: new Date('2024-02-02'),
    },
    {
        id: 'notif-2',
        userId: 'user-1',
        type: 'application_received',
        title: 'בקשת הצטרפות חדשה',
        body: 'נועה שמיר הגישה בקשה להצטרף להרכב שלך ככלי בס',
        relatedEntityType: 'application',
        relatedEntityId: 'app-2',
        read: false,
        createdAt: new Date('2024-02-02'),
    },
];

// ============ MOCK SETTINGS ============
export const mockSettings: SystemSettings = {
    ...DEFAULT_SETTINGS,
};

// Current user (for local dev - simulating logged in user)
export const CURRENT_USER_ID = 'user-1';

// ============ MOCK CONVERSATIONS (Direct Messages) ============
export const mockConversations: Conversation[] = [
    {
        id: 'conv-1',
        participantIds: ['user-1', 'user-4'], // With Noa Shamir (Bass)
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        lastMessagePreview: 'מגניב, נסגור על בס ביום ראשון?',
        createdAt: new Date('2024-02-01'),
    },
    {
        id: 'conv-2',
        participantIds: ['user-1', 'user-5'], // With Ronen drums
        lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        lastMessagePreview: 'שלחתי לך את הסקיצה למייל',
        createdAt: new Date('2024-01-28'),
    }
];

export const mockDirectMessages: DirectMessage[] = [
    {
        id: 'dm-1',
        conversationId: 'conv-1',
        senderId: 'user-4',
        content: 'היי יונתן, ראיתי שאתם מחפשים בסיסט',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: 'dm-2',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'היי נועה! כן, אנחנו בדיוק לפני סבב הופעות. מה הסגנון שלך?',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    },
    {
        id: 'dm-3',
        conversationId: 'conv-1',
        senderId: 'user-4',
        content: 'בעיקר אינדי ורוק, אבל זורמת על הכל. יש לי ניסיון של 5 שנים.',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
    },
    {
        id: 'dm-4',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'נשמע מעולה! רוצה לבוא לג\'מג\'ם בחזרה הבאה?',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
        id: 'dm-5',
        conversationId: 'conv-1',
        senderId: 'user-4',
        content: 'מגניב, נסגור על בס ביום ראשון?',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
    }
];

// ============ MOCK REPORTS ============
export const mockReports: Report[] = [
    {
        id: 'rep-1',
        reportedByUserId: 'user-2',
        targetType: 'post',
        targetId: 'post-1',
        reason: 'תוכן לא הולם',
        status: 'pending',
        createdAt: new Date('2024-02-05T10:00:00'),
    },
    {
        id: 'rep-2',
        reportedByUserId: 'user-4',
        targetType: 'user',
        targetId: 'user-3',
        reason: 'הטרדה חוזרת',
        status: 'reviewed',
        reviewNote: 'נחסם לשבוע',
        createdAt: new Date('2024-02-02T14:30:00'),
        resolvedAt: new Date('2024-02-02T15:00:00'),
    }
];
