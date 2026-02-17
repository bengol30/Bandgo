// ============================================
// bandgo - Core Type Definitions
// ============================================

// ============ ENUMS ============

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
    STAFF = 'staff',
    MODERATOR = 'moderator',
    BANNED = 'banned'
}

export enum InstrumentLevel {
    BEGINNER = 'beginner',
    INTERMEDIATE = 'intermediate',
    ADVANCED = 'advanced',
    PROFESSIONAL = 'professional'
}

export enum BandRequestType {
    TARGETED = 'targeted',
    OPEN = 'open'
}

export enum BandRequestStatus {
    OPEN = 'open',
    CLOSED = 'closed',
    FORMED = 'formed'
}

export enum ApplicationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}

export enum RehearsalStatus {
    POLLING = 'polling',
    SCHEDULED = 'scheduled',
    COMPLETION_SUBMITTED = 'completion_submitted',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    CANCELLED = 'cancelled'
}

export enum PerformanceRequestStatus {
    SUBMITTED = 'submitted',
    IN_REVIEW = 'in_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    NEEDS_CHANGES = 'needs_changes'
}

export enum LiveSessionRequestStatus {
    SUBMITTED = 'submitted',
    IN_REVIEW = 'in_review',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    SCHEDULED = 'scheduled'
}

export enum BandCommitmentLevel {
    HOBBY = 'hobby',
    INTERMEDIATE = 'intermediate',
    PROFESSIONAL = 'professional'
}

export enum SearchStatus {
    LOOKING = 'looking',
    AVAILABLE_FOR_JAMS = 'available_for_jams',
    NOT_LOOKING = 'not_looking'
}

export enum PostType {
    USER_POST = 'user_post',
    SYSTEM_AUTO = 'system_auto',
    ADMIN_MESSAGE = 'admin_message'
}

export enum EventType {
    JAM = 'jam',
    BAND_PERFORMANCE = 'band_performance',
    SHARED_PERFORMANCE = 'shared_performance',
    OPEN_SESSION = 'open_session',
    WORKSHOP = 'workshop',
    OTHER = 'other'
}

export enum EventSubmissionStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    NEEDS_CHANGES = 'needs_changes'
}

// ============ INTERFACES ============

export interface Instrument {
    id: string;
    name: string;
    nameHe: string;
    icon?: string;
}

export interface UserInstrument {
    instrumentId: string;
    level?: InstrumentLevel;
}

export interface Genre {
    id: string;
    name: string;
    nameHe: string;
}

export interface User {
    id: string;
    displayName: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
    city?: string;
    region?: string;
    radiusKm: number;
    genres: string[];  // Genre IDs
    instruments: UserInstrument[];
    isVocalist: boolean;
    isSongwriter: boolean;
    samples: MediaFile[];
    availability?: string;
    bio?: string;
    role: UserRole;

    // Contact & Extended Info
    contactInfo?: {
        phone?: string;
        whatsapp?: string;
        instagram?: string;
        tiktok?: string;
        website?: string;
    };
    searchStatus?: SearchStatus;
    gear?: string; // Equipment list
    availabilityDays?: string; // "Sunday, Tuesday" or similar structure
    influences?: string[];

    createdAt: Date;
    updatedAt: Date;
}

export interface MediaFile {
    id: string;
    url: string;
    type: 'audio' | 'video' | 'image';
    name: string;
    size?: number;
    createdAt: Date;
}

export interface InstrumentSlot {
    instrumentId: string;
    quantity: number;
    filledBy: string[];  // User IDs
}

export interface BandRequest {
    id: string;
    creatorId: string;
    title?: string;
    description: string;
    coverImageUrl?: string;
    type: BandRequestType;
    status: BandRequestStatus;
    genres: string[];
    city?: string;
    region?: string;
    radiusKm: number;
    originalVsCoverRatio: number;  // 0-100, 0 = all covers, 100 = all originals

    // For TARGETED requests
    instrumentSlots?: InstrumentSlot[];

    // For OPEN requests
    maxMembers?: number;
    currentMembers: string[];  // User IDs

    sketches: MediaFile[];
    sketchPending: boolean;  // True if skipped and needs to add later

    // Extended Band Info
    commitmentLevel?: BandCommitmentLevel;
    rehearsalFrequency?: string; // e.g., "Once a week"
    targetAgeRange?: {
        min: number;
        max: number;
    };
    influences?: string[];
    existingRehearsalSpace?: boolean;

    // Enhanced Details
    socialLinks?: { display: string; url: string }[];
    repertoire?: { song: string; artist: string; note?: string }[];

    createdAt: Date;
    updatedAt: Date;
}

export interface BandApplication {
    id: string;
    bandRequestId: string;
    applicantId: string;
    instrumentId: string;
    message: string;
    sample?: MediaFile;
    status: ApplicationStatus;
    createdAt: Date;
    reviewedAt?: Date;
    reviewNote?: string;
}

export interface BandMember {
    userId: string;
    instrumentId: string;
    joinedAt: Date;
    isLeader: boolean;
}

export interface Band {
    id: string;
    name?: string;
    coverImageUrl?: string;
    description?: string;
    genres: string[];
    city?: string;
    region?: string;
    members: BandMember[];
    originalBandRequestId: string;

    // Band Profile Extensions (Matched with Request)
    commitmentLevel?: BandCommitmentLevel;
    rehearsalFrequency?: string;
    targetAgeRange?: {
        min: number;
        max: number;
    };
    influences?: string[];

    // Progress tracking
    approvedRehearsalsCount: number;
    rehearsalGoal: number;
    performanceRequestId?: string;
    liveSessionRequestId?: string;

    // Workspace Tasks
    tasks?: Task[];

    createdAt: Date;
    updatedAt: Date;
}

export interface Task {
    id: string;
    bandId: string;
    type: 'UPLOAD_DEMOS' | 'COMPLETE_PROFILE' | 'OTHER';
    status: 'pending' | 'completed';
    title: string;
    description?: string;
    assignedTo?: string;
    createdAt: Date;
    completedAt?: Date;
}

export interface PollOption {
    id: string;
    dateTime: Date;
    durationMinutes: number;
    votes: {
        userId: string;
        canAttend: boolean;
    }[];
}

export interface RehearsalPoll {
    id: string;
    bandId: string;
    creatorId: string;
    options: PollOption[];
    deadline: Date;
    location: string;
    notes?: string;
    createdAt: Date;
}

export interface Rehearsal {
    id: string;
    bandId: string;
    pollId?: string;
    dateTime: Date;
    durationMinutes: number;
    location: string;
    status: RehearsalStatus;
    googleEventId?: string;

    // Completion flow
    completionSubmittedBy?: string;
    completionSubmittedAt?: Date;
    adminReviewedBy?: string;
    adminReviewedAt?: Date;
    adminNote?: string;

    createdAt: Date;
}

export interface SongLink {
    url: string;
    type: 'youtube' | 'spotify' | 'apple_music' | 'other';
    title?: string;
}

export interface Song {
    id: string;
    bandId: string;
    title: string;
    lyrics?: string;
    chords?: string;
    bpm?: number;
    key?: string;
    notes?: string;
    audioFiles?: MediaFile[]; // Keeping for backward compatibility
    files?: MediaFile[];
    links?: SongLink[];
    structure?: string;  // Verse/Chorus/etc.
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface PerformanceRequest {
    id: string;
    bandId: string;
    preferredDateRange: {
        start: Date;
        end: Date;
    };
    setDurationMinutes: number;
    notes?: string;
    status: PerformanceRequestStatus;
    adminReviewedBy?: string;
    adminNote?: string;
    scheduledDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface LiveSessionRequest {
    id: string;
    bandId: string;
    preferredDateRange: {
        start: Date;
        end: Date;
    };
    notes?: string;
    status: LiveSessionRequestStatus;
    adminReviewedBy?: string;
    adminNote?: string;
    scheduledDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ============ FEED ============

export interface Post {
    id: string;
    type: PostType;
    authorId?: string;  // For user posts
    content: string;
    media?: MediaFile[];
    isPinned: boolean;

    // For system/auto posts
    systemEventType?: string;
    relatedEntityId?: string;

    // Target audience for admin messages
    targetAudience?: 'all' | 'bands' | 'event_participants';
    targetEventId?: string;

    likesCount: number;
    commentsCount: number;

    createdAt: Date;
    updatedAt: Date;
}

export interface PostLike {
    id: string;
    postId: string;
    userId: string;
    createdAt: Date;
}

export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============ EVENTS ============

export interface Event {
    id: string;
    title: string;
    description: string;
    type: EventType;
    dateTime: Date;
    durationMinutes: number;
    location: string;
    coverImageUrl?: string;
    capacity?: number;
    price?: number;
    organizerId: string;
    registrationDeadline?: Date;
    relatedBandIds?: string[];
    requirements?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;

    // Extended Event Info
    backlineProvided?: string; // Detailed backline info for jams
    whatsappGroupId?: string; // Link to WhatsApp group
    ageRestriction?: string; // "18+", "All ages", etc.
    isAccessible?: boolean;
    ticketLink?: string;
    ticketPrice?: number;
    submissionId?: string; // Link back to original submission if created from one
}

export interface EventSubmission {
    id: string;
    submittedByUserId: string;
    title: string;
    type: EventType;
    description: string;
    startAt: Date;
    endAt: Date;
    locationText: string;
    coverUrl?: string;
    registrationEnabled: boolean;
    capacity?: number;
    price: number; // Default 0
    relatedBandId?: string;
    status: EventSubmissionStatus;
    adminNote?: string;
    rejectionReason?: string;
    approvedEventId?: string;
    hostUserId?: string; // For V2, defaults to submittedByUserId
    paymentDetails?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventRegistration {
    id: string;
    eventId: string;
    userId: string;
    notes?: string;
    status: 'registered' | 'waitlist' | 'cancelled';
    createdAt: Date;
}

// ============ NOTIFICATIONS ============

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    body: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    read: boolean;
    createdAt: Date;
}

// ============ CHAT & MESSAGING ============

// Band group chat message
export interface ChatMessage {
    id: string;
    bandId: string;
    senderId: string;
    content: string;
    media?: MediaFile;
    readBy: string[]; // User IDs who have read this message
    createdAt: Date;
}

// Direct/Private conversation between two users
export interface Conversation {
    id: string;
    participantIds: [string, string]; // Exactly 2 participants
    lastMessageAt: Date;
    lastMessagePreview: string;
    createdAt: Date;
}

// Direct message in a private conversation
export interface DirectMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    media?: MediaFile;
    read: boolean;
    createdAt: Date;
}

// ============ AVAILABILITY & SCHEDULING ============

export enum AvailabilityStatus {
    AVAILABLE = 'available',
    MAYBE = 'maybe',
    UNAVAILABLE = 'unavailable'
}

export interface AvailabilitySlot {
    id: string;
    bandId: string;
    userId: string;
    date: Date; // The specific date
    timeSlots: {
        start: string; // "09:00"
        end: string;   // "12:00"
        status: AvailabilityStatus;
    }[];
    notes?: string;
    updatedAt: Date;
}

export interface SchedulingSuggestion {
    id: string;
    bandId: string;
    dateTime: Date;
    durationMinutes: number;
    matchScore: number; // 0-100 based on availability overlap
    availableMembers: string[]; // User IDs
    unavailableMembers: string[]; // User IDs
}

// ============ ENHANCED APPLICATIONS ============

export enum AuditionStatus {
    NOT_SCHEDULED = 'not_scheduled',
    SCHEDULED = 'scheduled',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface Audition {
    id: string;
    applicationId: string;
    scheduledAt?: Date;
    location?: string;
    meetingLink?: string; // For video auditions
    notes?: string;
    status: AuditionStatus;
    feedback?: string;
    rating?: number; // 1-5
    createdAt: Date;
    updatedAt: Date;
}

// ============ SETTINGS ============

export interface SystemSettings {
    rehearsalGoal: number;
    pollDurationHours: number;
    autoFinalizePoll: boolean;
    googleCalendarConnected: boolean;
    googleCalendarId?: string;
}

// ============ CHAT ============

export interface BandChat {
    bandId: string;
    messages: ChatMessage[];
}

// ============ ADMIN ============
export interface Report {
    id: string;
    targetType: 'band' | 'user' | 'event' | 'post';
    targetId: string;
    reportedByUserId: string;
    reason: string;
    description?: string;
    status: 'pending' | 'reviewed' | 'dismissed';
    reviewNote?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    createdAt: Date;
    resolvedAt?: Date;
}


