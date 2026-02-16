// ============================================
// bandgo - Repository Interface
// Abstraction layer for data access
// ============================================

import {
    User,
    BandRequest,
    BandApplication,
    Band,
    RehearsalPoll,
    Rehearsal,
    Song,
    PerformanceRequest,
    PerformanceRequestStatus,
    LiveSessionRequest,
    LiveSessionRequestStatus,
    Post,
    Comment,
    PostLike,
    Event,
    EventRegistration,
    Notification,
    Task,
    Conversation,
    DirectMessage,
    AvailabilitySlot,
    SchedulingSuggestion,
    MediaFile,
    EventSubmission,
    BandChat,
    ChatMessage,
    Report as AppReport,
    SystemSettings,
    UserRole
} from '../types';



// ============ FILTER TYPES ============

export interface BandRequestFilters {
    matchMyInstruments?: boolean;
    instruments?: string[];
    genres?: string[];
    region?: string;
    type?: 'targeted' | 'open';
    status?: 'open' | 'closed' | 'formed';
}

export interface BandFilters {
    genres?: string[];
    region?: string;
    hasOpenSlots?: boolean;
}

export interface EventFilters {
    type?: string;
    fromDate?: Date;
    toDate?: Date;
}

export interface BandProgress {
    isFormed: boolean;
    approvedRehearsals: number;
    pendingRehearsals: number;
    rehearsalGoal: number;
    canRequestPerformance: boolean;
    performanceStatus?: string;
    liveSessionStatus?: string;
    canRequestLiveSession?: boolean;
}

export interface IRepository {
    // ============ AUTH ============
    getCurrentUser(): Promise<User | null>;
    signIn(email: string, password: string): Promise<User>;
    signOut(): Promise<void>;
    updateProfile(userId: string, data: Partial<User>): Promise<User>;

    // ============ USERS ============
    getUser(userId: string): Promise<User | null>;
    getAllUsers(): Promise<User[]>;
    searchUsers(query: string): Promise<User[]>;
    blockUser(userId: string): Promise<void>;
    unblockUser(userId: string): Promise<void>;

    // ============ BAND REQUESTS ============
    getBandRequests(filters?: BandRequestFilters): Promise<BandRequest[]>;
    getBandRequest(id: string): Promise<BandRequest | null>;
    createBandRequest(data: Omit<BandRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<BandRequest>;
    updateBandRequest(id: string, data: Partial<BandRequest>): Promise<BandRequest>;
    closeBandRequest(id: string): Promise<void>;
    getMyBandRequests(userId: string): Promise<BandRequest[]>;

    // ============ APPLICATIONS ============
    getApplications(bandRequestId: string): Promise<BandApplication[]>;
    getAllApplications(): Promise<BandApplication[]>;
    getMyApplications(userId: string): Promise<BandApplication[]>;
    createApplication(data: Omit<BandApplication, 'id' | 'createdAt'>): Promise<BandApplication>;
    reviewApplication(id: string, status: 'approved' | 'rejected', note?: string): Promise<BandApplication>;

    // ============ BANDS ============
    getBands(filters?: BandFilters): Promise<Band[]>;
    getBand(id: string): Promise<Band | null>;
    getMyBands(userId: string): Promise<Band[]>;
    formBand(bandRequestId: string, name?: string): Promise<Band>;
    updateBand(id: string, data: Partial<Band>): Promise<Band>;
    leaveBand(bandId: string, userId: string): Promise<{ deleted: boolean }>;
    deleteBand(bandId: string, requestingUserId: string): Promise<void>;
    getBandProgress(bandId: string): Promise<BandProgress>;

    // ============ REHEARSALS ============
    getBandTasks(bandId: string): Promise<Task[]>;
    createTask(bandId: string, data: Partial<Task>): Promise<Task>;
    updateTask(bandId: string, taskId: string, data: Partial<Task>): Promise<Task>;
    deleteTask(bandId: string, taskId: string): Promise<void>;
    getRehearsals(bandId: string): Promise<Rehearsal[]>;
    getRehearsal(id: string): Promise<Rehearsal | null>;
    getAllRehearsals(): Promise<Rehearsal[]>;  // For admin
    getPendingApprovals(): Promise<Rehearsal[]>;  // For admin

    // Polls
    createRehearsalPoll(data: Omit<RehearsalPoll, 'id' | 'createdAt'>): Promise<RehearsalPoll>;
    getRehearsalPoll(id: string): Promise<RehearsalPoll | null>;
    getActivePolls(bandId: string): Promise<RehearsalPoll[]>;
    voteOnPoll(pollId: string, optionId: string, userId: string, canAttend: boolean): Promise<RehearsalPoll>;
    removeVoteFromPoll(pollId: string, optionId: string, userId: string): Promise<RehearsalPoll>;
    finalizePoll(pollId: string, optionId: string): Promise<Rehearsal>;

    // Rehearsal lifecycle
    submitRehearsalCompletion(rehearsalId: string, submitterId: string): Promise<Rehearsal>;
    approveRehearsal(rehearsalId: string, adminId: string): Promise<Rehearsal>;
    rejectRehearsal(rehearsalId: string, adminId: string, note: string): Promise<Rehearsal>;
    cancelRehearsal(rehearsalId: string): Promise<Rehearsal>;

    // ============ SONGS ============
    getSongs(bandId: string): Promise<Song[]>;
    getSong(id: string): Promise<Song | null>;
    createSong(data: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<Song>;
    updateSong(id: string, data: Partial<Song>): Promise<Song>;
    deleteSong(id: string): Promise<void>;

    // ============ PERFORMANCE REQUESTS ============
    getPerformanceRequest(bandId: string): Promise<PerformanceRequest | null>;
    createPerformanceRequest(data: Omit<PerformanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceRequest>;
    reviewPerformanceRequest(id: string, status: PerformanceRequestStatus, note?: string, scheduledDate?: Date): Promise<PerformanceRequest>;
    getAllPerformanceRequests(): Promise<PerformanceRequest[]>;  // For admin

    // ============ LIVE SESSION REQUESTS ============
    getLiveSessionRequest(bandId: string): Promise<LiveSessionRequest | null>;
    createLiveSessionRequest(data: Omit<LiveSessionRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveSessionRequest>;
    reviewLiveSessionRequest(id: string, status: LiveSessionRequestStatus, note?: string, scheduledDate?: Date): Promise<LiveSessionRequest>;
    getAllLiveSessionRequests(): Promise<LiveSessionRequest[]>;  // For admin

    // ============ FEED ============
    getPosts(limit?: number, offset?: number): Promise<Post[]>;
    getPost(id: string): Promise<Post | null>;
    createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<Post>;
    deletePost(id: string): Promise<void>;
    pinPost(id: string): Promise<Post>;
    unpinPost(id: string): Promise<Post>;

    // Likes
    likePost(postId: string, userId: string): Promise<void>;
    unlikePost(postId: string, userId: string): Promise<void>;
    getPostLikes(postId: string): Promise<PostLike[]>;

    // Comments
    getComments(postId: string): Promise<Comment[]>;
    createComment(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment>;
    deleteComment(id: string): Promise<void>;

    // Admin messages
    createSystemMessage(content: string, targetAudience: string, targetEventId?: string): Promise<Post>;

    // ============ EVENTS ============
    getEvents(filters?: EventFilters): Promise<Event[]>;
    getEvent(id: string): Promise<Event | null>;
    createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event>;
    updateEvent(id: string, data: Partial<Event>): Promise<Event>;
    deleteEvent(id: string): Promise<void>;

    // Registrations
    registerForEvent(eventId: string, userId: string, notes?: string): Promise<EventRegistration>;
    cancelRegistration(eventId: string, userId: string): Promise<void>;
    getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
    getMyEventRegistrations(userId: string): Promise<EventRegistration[]>;

    // Submissions
    createEventSubmission(data: Omit<EventSubmission, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<EventSubmission>;
    updateEventSubmission(submissionId: string, data: Partial<EventSubmission>): Promise<void>;
    getMyEventSubmissions(userId: string): Promise<EventSubmission[]>;

    // ============ NOTIFICATIONS ============
    getNotifications(userId: string): Promise<Notification[]>;
    markNotificationRead(id: string): Promise<void>;
    markAllNotificationsRead(userId: string): Promise<void>;
    createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification>;

    // ============ BAND CHAT ============
    getChatMessages(bandId: string, limit?: number): Promise<ChatMessage[]>;
    sendChatMessage(bandId: string, content: string, media?: MediaFile): Promise<ChatMessage>;
    markChatAsRead(bandId: string): Promise<void>;
    getUnreadChatCount(bandId: string): Promise<number>;

    // ============ DIRECT MESSAGES ============
    getConversations(): Promise<Conversation[]>;
    getOrCreateConversation(otherUserId: string): Promise<Conversation>;
    getDirectMessages(conversationId: string, limit?: number): Promise<DirectMessage[]>;
    sendDirectMessage(conversationId: string, content: string, media?: MediaFile): Promise<DirectMessage>;
    markDirectMessagesAsRead(conversationId: string): Promise<void>;
    getUnreadDirectMessageCount(): Promise<number>;

    // ============ AVAILABILITY & SCHEDULING ============
    getAvailability(bandId: string, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]>;
    updateAvailability(bandId: string, date: Date, timeSlots: AvailabilitySlot['timeSlots']): Promise<AvailabilitySlot>;
    getSchedulingSuggestions(bandId: string, durationMinutes?: number): Promise<SchedulingSuggestion[]>;

    // ============ SETTINGS ============
    getSettings(): Promise<SystemSettings>;
    updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings>;

    // ============ FILE UPLOAD ============
    uploadFile(file: File, path: string): Promise<string>;  // Returns URL
    deleteFile(url: string): Promise<void>;

    // ============ ADMIN ============
    getSystemSettings(): Promise<SystemSettings>;
    updateSystemSettings(settings: SystemSettings): Promise<void>;
    getReports(): Promise<AppReport[]>;
    resolveReport(reportId: string, status: 'reviewed' | 'dismissed', note?: string): Promise<void>;

    // Admin - Events
    approveEventSubmission(submissionId: string, approverId: string): Promise<void>;
    rejectEventSubmission(submissionId: string, reason: string): Promise<void>;
    requestChangesOnSubmission(submissionId: string, notes: string): Promise<void>;
    getAllEventSubmissions(): Promise<EventSubmission[]>;
    getPendingEventSubmissions(): Promise<EventSubmission[]>;

    // Admin - Users
    updateUserRole(userId: string, role: UserRole): Promise<void>;
    forceDeleteBand(bandId: string): Promise<void>;
    deleteUser(userId: string): Promise<void>;
    deleteEvent(eventId: string): Promise<void>;
}
