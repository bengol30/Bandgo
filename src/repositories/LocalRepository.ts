// ============================================
// bandgo - Local Repository Implementation
// In-memory data store for local development
// ============================================

import { v4 as uuidv4 } from 'uuid';
import {
    IRepository,
    BandRequestFilters,
    BandFilters,
    EventFilters,
    BandProgress,
} from './IRepository';
import {
    User,
    BandRequest,
    BandApplication,
    Band,
    RehearsalPoll,
    Rehearsal,
    Song,
    PerformanceRequest,
    LiveSessionRequest,
    Post,
    Comment,
    PostLike,
    Event,
    EventRegistration,
    Notification,
    ChatMessage,
    Conversation,
    DirectMessage,
    Report as AppReport,
    AvailabilitySlot,
    SchedulingSuggestion,
    MediaFile,
    SystemSettings,
    ApplicationStatus,
    BandRequestStatus,
    RehearsalStatus,
    PostType,
    PerformanceRequestStatus,
    LiveSessionRequestStatus,
    UserRole,
} from '../types';
import {
    mockUsers,
    mockBandRequests,
    mockApplications,
    mockBands,
    mockRehearsals,
    mockReports,
    mockPolls,
    mockSongs,
    mockPosts,
    mockEvents,
    mockEventRegistrations,
    mockNotifications,
    mockSettings,
    mockConversations,
    mockDirectMessages,
    CURRENT_USER_ID,
} from '../data/mockData';

class LocalRepository implements IRepository {
    // In-memory data stores
    private users: User[] = [];
    private bandRequests: BandRequest[] = [];
    private applications: BandApplication[] = [];
    private bands: Band[] = [];
    private rehearsals: Rehearsal[] = [];
    private polls: RehearsalPoll[] = [];
    private songs: Song[] = [];
    private performanceRequests: PerformanceRequest[] = [];
    private liveSessionRequests: LiveSessionRequest[] = [];
    private posts: Post[] = [];
    private comments: Comment[] = [];
    private likes: PostLike[] = [];
    private events: Event[] = [];
    private eventRegistrations: EventRegistration[] = [];
    private notifications: Notification[] = [];
    private chatMessages: ChatMessage[] = [];
    private conversations: Conversation[] = [];
    private directMessages: DirectMessage[] = [];
    private availabilitySlots: AvailabilitySlot[] = [];
    private settings: SystemSettings = { ...mockSettings };
    private reports: AppReport[] = [];

    private currentUserId: string = CURRENT_USER_ID;
    private readonly STORAGE_KEY = 'bandgo_local_db_v2';
    private readonly AUTH_KEY = 'bandgo_auth_user_id';

    constructor() {
        this.loadFromStorage();
    }

    private loadFromStorage() {
        try {
            // Load current user
            const savedUserId = localStorage.getItem(this.AUTH_KEY);
            if (savedUserId) {
                this.currentUserId = savedUserId;
            }

            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data, this.dateTimeReviver);
                this.users = parsed.users || [];

                // Merge mockUsers that don't exist in localStorage yet
                mockUsers.forEach(mockUser => {
                    if (!this.users.find(u => u.id === mockUser.id || u.email === mockUser.email)) {
                        this.users.push(mockUser);
                    }
                });

                this.bandRequests = parsed.bandRequests || [];

                // Merge mockBandRequests that don't exist
                mockBandRequests.forEach(mockReq => {
                    if (!this.bandRequests.find(r => r.id === mockReq.id)) {
                        this.bandRequests.push(mockReq);
                    }
                });

                this.applications = parsed.applications || [];
                this.bands = parsed.bands || [];
                this.rehearsals = parsed.rehearsals || [];
                this.polls = parsed.polls || [];
                this.songs = parsed.songs || [];
                this.performanceRequests = parsed.performanceRequests || [];
                this.liveSessionRequests = parsed.liveSessionRequests || [];
                this.posts = parsed.posts || [];
                this.comments = parsed.comments || [];
                this.likes = parsed.likes || [];
                this.events = parsed.events || [];
                this.eventRegistrations = parsed.eventRegistrations || [];
                this.availabilitySlots = parsed.availabilitySlots || [];
                this.notifications = parsed.notifications || [];
                this.settings = parsed.settings || mockSettings;
                this.chatMessages = parsed.chatMessages || [];
                this.reports = parsed.reports || [...mockReports];

                // Load or init conversations
                this.conversations = parsed.conversations || [...mockConversations];
                this.directMessages = parsed.directMessages || [...mockDirectMessages];

                console.log('📦 Data loaded and merged with mock data from localStorage');
                this.saveToStorage();
            } else {
                this.resetToDefaults();
            }
        } catch (error) {
            console.error('Failed to load from storage, resetting to defaults', error);
            this.resetToDefaults();
        }
    }

    private resetToDefaults() {
        this.users = [...mockUsers];
        this.bandRequests = [...mockBandRequests];
        this.applications = [...mockApplications];
        this.bands = [...mockBands];
        this.rehearsals = [...mockRehearsals];
        this.polls = [...mockPolls];
        this.songs = [...mockSongs];
        this.performanceRequests = [];
        this.liveSessionRequests = [];
        this.posts = [...mockPosts];
        this.comments = [];
        this.likes = [];
        this.events = [...mockEvents];
        this.eventRegistrations = [...mockEventRegistrations];
        this.availabilitySlots = [];
        this.notifications = [...mockNotifications];
        this.settings = { ...mockSettings };
        this.reports = [...mockReports];
        this.chatMessages = [];
        this.conversations = [...mockConversations];
        this.directMessages = [...mockDirectMessages];
        this.saveToStorage();
    }

    private saveToStorage() {
        try {
            const data = {
                users: this.users,
                bandRequests: this.bandRequests,
                applications: this.applications,
                bands: this.bands,
                rehearsals: this.rehearsals,
                polls: this.polls,
                songs: this.songs,
                performanceRequests: this.performanceRequests,
                liveSessionRequests: this.liveSessionRequests,
                posts: this.posts,
                comments: this.comments,
                likes: this.likes,
                events: this.events,
                eventRegistrations: this.eventRegistrations,
                notifications: this.notifications,
                settings: this.settings,
                chatMessages: this.chatMessages,
                conversations: this.conversations,
                directMessages: this.directMessages,
                availabilitySlots: this.availabilitySlots,
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to storage', error);
        }
    }

    private dateTimeReviver(key: string, value: any) {
        if (typeof value === 'string') {
            const isDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
            if (isDate) {
                return new Date(value);
            }
        }
        return value;
    }



    // Helper: simulate async delay
    private async delay(ms: number = 100): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============ AUTH ============
    async getCurrentUser(): Promise<User | null> {
        await this.delay();
        return this.users.find(u => u.id === this.currentUserId) || null;
    }

    async signIn(email: string, _password: string): Promise<User> {
        await this.delay();
        const user = this.users.find(u => u.email === email);
        if (!user) throw new Error('User not found');
        this.currentUserId = user.id;
        localStorage.setItem(this.AUTH_KEY, user.id);
        return user;
    }

    async signOut(): Promise<void> {
        await this.delay();
        this.currentUserId = CURRENT_USER_ID;
        localStorage.removeItem(this.AUTH_KEY);
    }

    async updateProfile(userId: string, data: Partial<User>): Promise<User> {
        await this.delay();
        const index = this.users.findIndex(u => u.id === userId);
        if (index === -1) throw new Error('User not found');

        this.users[index] = {
            ...this.users[index],
            ...data,
            updatedAt: new Date(),
        };
        return this.users[index];
    }

    // ============ USERS ============
    async getUser(userId: string): Promise<User | null> {
        await this.delay();
        return this.users.find(u => u.id === userId) || null;
    }

    async getAllUsers(): Promise<User[]> {
        await this.delay();
        return [...this.users];
    }

    async deleteUser(userId: string): Promise<void> {
        await this.delay();
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
            this.users.splice(index, 1);
            this.saveToStorage();
        }
    }

    async searchUsers(query: string): Promise<User[]> {
        await this.delay();
        const q = query.toLowerCase();
        return this.users.filter(u =>
            u.displayName.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    }

    async blockUser(_userId: string): Promise<void> {
        await this.delay();
        // In real app, update user status
    }

    async unblockUser(_userId: string): Promise<void> {
        await this.delay();
        // In real app, update user status
    }

    // ============ BAND REQUESTS ============
    async getBandRequests(filters?: BandRequestFilters): Promise<BandRequest[]> {
        await this.delay();
        let results = this.bandRequests.filter(br => br.status === BandRequestStatus.OPEN);

        if (filters) {
            if (filters.matchMyInstruments) {
                const currentUser = this.users.find(u => u.id === this.currentUserId);
                if (currentUser) {
                    const myInstrumentIds = currentUser.instruments.map(i => i.instrumentId);
                    results = results.filter(br => {
                        if (br.type === 'open') return true;
                        return br.instrumentSlots?.some(slot =>
                            myInstrumentIds.includes(slot.instrumentId) && slot.filledBy.length < slot.quantity
                        );
                    });
                }
            }

            if (filters.instruments?.length) {
                results = results.filter(br => {
                    if (br.type === 'open') return true;
                    return br.instrumentSlots?.some(slot =>
                        filters.instruments!.includes(slot.instrumentId)
                    );
                });
            }

            if (filters.genres?.length) {
                results = results.filter(br =>
                    br.genres.some(g => filters.genres!.includes(g))
                );
            }

            if (filters.region) {
                results = results.filter(br => br.region === filters.region);
            }

            if (filters.type) {
                results = results.filter(br => br.type === filters.type);
            }
        }

        return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async getBandRequest(id: string): Promise<BandRequest | null> {
        await this.delay();
        return this.bandRequests.find(br => br.id === id) || null;
    }

    async createBandRequest(data: Omit<BandRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<BandRequest> {
        await this.delay();
        const newRequest: BandRequest = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.bandRequests.push(newRequest);

        // Create auto post
        this.createAutoPost('band_request_created', newRequest.id,
            `🆕 נפתחה בקשה חדשה להרכב: "${newRequest.title || 'הרכב חדש'}" - ${newRequest.description.substring(0, 50)}...`
        );

        this.saveToStorage();
        return newRequest;
    }

    async updateBandRequest(id: string, data: Partial<BandRequest>): Promise<BandRequest> {
        await this.delay();
        const index = this.bandRequests.findIndex(br => br.id === id);
        if (index === -1) throw new Error('Band request not found');

        this.bandRequests[index] = {
            ...this.bandRequests[index],
            ...data,
            updatedAt: new Date(),
        };
        return this.bandRequests[index];
    }

    async closeBandRequest(id: string): Promise<void> {
        await this.delay();
        const index = this.bandRequests.findIndex(br => br.id === id);
        if (index !== -1) {
            this.bandRequests[index].status = BandRequestStatus.CLOSED;
            this.bandRequests[index].updatedAt = new Date();
        }
    }

    async getMyBandRequests(userId: string): Promise<BandRequest[]> {
        await this.delay();
        return this.bandRequests.filter(br => br.creatorId === userId);
    }

    // ============ APPLICATIONS ============
    async getApplications(bandRequestId: string): Promise<BandApplication[]> {
        await this.delay();
        return this.applications.filter(a => a.bandRequestId === bandRequestId);
    }

    async getMyApplications(userId: string): Promise<BandApplication[]> {
        await this.delay();
        return this.applications.filter(a => a.applicantId === userId);
    }

    async createApplication(data: Omit<BandApplication, 'id' | 'createdAt'>): Promise<BandApplication> {
        await this.delay();
        const newApplication: BandApplication = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
        };
        this.applications.push(newApplication);

        // Notify band request creator
        // Notify band request creator
        const bandRequest = this.bandRequests.find(br => br.id === data.bandRequestId);
        const applicant = this.users.find(u => u.id === data.applicantId);

        if (bandRequest && applicant) {
            this.createNotification({
                userId: bandRequest.creatorId,
                type: 'application_received',
                title: 'בקשת הצטרפות חדשה',
                body: `${applicant.displayName} הגיש/ה בקשה להצטרף להרכב שלך`,
                relatedEntityType: 'application',
                relatedEntityId: newApplication.id,
            });
        }

        this.saveToStorage();
        return newApplication;
    }

    async reviewApplication(id: string, status: 'approved' | 'rejected', note?: string): Promise<BandApplication> {
        await this.delay();
        const index = this.applications.findIndex(a => a.id === id);
        if (index === -1) throw new Error('Application not found');

        this.applications[index] = {
            ...this.applications[index],
            status: status === 'approved' ? ApplicationStatus.APPROVED : ApplicationStatus.REJECTED,
            reviewedAt: new Date(),
            reviewNote: note,
        };

        // If approved, add member to band request
        if (status === 'approved') {
            const app = this.applications[index];
            const brIndex = this.bandRequests.findIndex(br => br.id === app.bandRequestId);
            if (brIndex !== -1) {
                this.bandRequests[brIndex].currentMembers.push(app.applicantId);
                if (this.bandRequests[brIndex].instrumentSlots) {
                    const slotIndex = this.bandRequests[brIndex].instrumentSlots!.findIndex(
                        s => s.instrumentId === app.instrumentId
                    );
                    if (slotIndex !== -1) {
                        this.bandRequests[brIndex].instrumentSlots![slotIndex].filledBy.push(app.applicantId);
                    }
                }
            }

            // Also add to Band if it exists (Created from this request)
            const bandIndex = this.bands.findIndex(b => b.originalBandRequestId === app.bandRequestId);
            if (bandIndex !== -1) {
                const isAlreadyMember = this.bands[bandIndex].members.some(m => m.userId === app.applicantId);
                if (!isAlreadyMember) {
                    this.bands[bandIndex].members.push({
                        userId: app.applicantId,
                        instrumentId: app.instrumentId,
                        joinedAt: new Date(),
                        isLeader: false
                    });
                }
            }
        }

        this.saveToStorage();
        return this.applications[index];
    }



    // ============ BANDS ============
    async getBands(_filters?: BandFilters): Promise<Band[]> {
        await this.delay();
        return [...this.bands].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async getBand(id: string): Promise<Band | null> {
        await this.delay();
        return this.bands.find(b => b.id === id) || null;
    }

    async getMyBands(userId: string): Promise<Band[]> {
        await this.delay();
        return this.bands.filter(b => b.members.some(m => m.userId === userId));
    }

    async formBand(bandRequestId: string, name?: string): Promise<Band> {
        await this.delay();
        const bandRequest = this.bandRequests.find(br => br.id === bandRequestId);
        if (!bandRequest) throw new Error('Band request not found');

        const members = bandRequest.currentMembers.map(userId => {
            const app = this.applications.find(a =>
                a.bandRequestId === bandRequestId &&
                a.applicantId === userId &&
                a.status === ApplicationStatus.APPROVED
            );
            return {
                userId,
                instrumentId: app?.instrumentId || 'unknown',
                joinedAt: new Date(),
                isLeader: userId === bandRequest.creatorId,
            };
        });

        // Add creator as leader
        if (!members.find(m => m.userId === bandRequest.creatorId)) {
            members.unshift({
                userId: bandRequest.creatorId,
                instrumentId: 'unknown',
                joinedAt: new Date(),
                isLeader: true,
            });
        }

        const newBand: Band = {
            id: uuidv4(),
            name,
            genres: bandRequest.genres,
            city: bandRequest.city,
            region: bandRequest.region,
            members,
            originalBandRequestId: bandRequestId,
            approvedRehearsalsCount: 0,
            rehearsalGoal: this.settings.rehearsalGoal,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.bands.push(newBand);

        // Update band request status
        const brIndex = this.bandRequests.findIndex(br => br.id === bandRequestId);
        if (brIndex !== -1) {
            this.bandRequests[brIndex].status = BandRequestStatus.FORMED;
        }

        // Create auto post
        this.createAutoPost('band_formed', newBand.id,
            `🎸 להקה חדשה התגבשה: "${name || 'להקה חדשה'}"!`
        );

        return newBand;
    }

    async updateBand(id: string, data: Partial<Band>): Promise<Band> {
        await this.delay();
        const index = this.bands.findIndex(b => b.id === id);
        if (index === -1) throw new Error('Band not found');

        this.bands[index] = {
            ...this.bands[index],
            ...data,
            updatedAt: new Date(),
        };
        this.saveToStorage();
        return this.bands[index];
    }

    async getBandProgress(bandId: string): Promise<BandProgress> {
        await this.delay();
        const band = this.bands.find(b => b.id === bandId);
        if (!band) throw new Error('Band not found');

        const pendingRehearsals = this.rehearsals.filter(
            r => r.bandId === bandId && r.status === RehearsalStatus.COMPLETION_SUBMITTED
        ).length;

        const performanceRequest = this.performanceRequests.find(pr => pr.bandId === bandId);
        const liveSessionRequest = this.liveSessionRequests.find(ls => ls.bandId === bandId);

        return {
            isFormed: true,
            approvedRehearsals: band.approvedRehearsalsCount,
            pendingRehearsals,
            rehearsalGoal: band.rehearsalGoal,
            canRequestPerformance: band.approvedRehearsalsCount >= band.rehearsalGoal,
            performanceStatus: performanceRequest?.status,
            canRequestLiveSession: performanceRequest?.status === 'approved',
            liveSessionStatus: liveSessionRequest?.status,
        };
    }

    // ============ REHEARSALS ============
    async getRehearsals(bandId: string): Promise<Rehearsal[]> {
        await this.delay();
        return this.rehearsals
            .filter(r => r.bandId === bandId)
            .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    }

    async getRehearsal(id: string): Promise<Rehearsal | null> {
        await this.delay();
        return this.rehearsals.find(r => r.id === id) || null;
    }

    async getAllRehearsals(): Promise<Rehearsal[]> {
        await this.delay();
        return [...this.rehearsals].sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    }

    async getPendingApprovals(): Promise<Rehearsal[]> {
        await this.delay();
        return this.rehearsals.filter(r => r.status === RehearsalStatus.COMPLETION_SUBMITTED);
    }

    async createRehearsal(data: Omit<Rehearsal, 'id' | 'createdAt'>): Promise<Rehearsal> {
        await this.delay();
        const newRehearsal: Rehearsal = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
        };
        this.rehearsals.push(newRehearsal);
        this.saveToStorage();
        return newRehearsal;
    }

    async updateRehearsal(id: string, data: Partial<Rehearsal>): Promise<Rehearsal> {
        await this.delay();
        const index = this.rehearsals.findIndex(r => r.id === id);
        if (index === -1) throw new Error('Rehearsal not found');

        const updated = { ...this.rehearsals[index], ...data };
        this.rehearsals[index] = updated;
        this.saveToStorage();
        return updated;
    }

    async deleteRehearsal(id: string): Promise<void> {
        await this.delay();
        const index = this.rehearsals.findIndex(r => r.id === id);
        if (index !== -1) {
            this.rehearsals.splice(index, 1);
            this.saveToStorage();
        }
    }

    // Polls
    async createRehearsalPoll(data: Omit<RehearsalPoll, 'id' | 'createdAt'>): Promise<RehearsalPoll> {
        await this.delay();
        const newPoll: RehearsalPoll = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
        };
        this.polls.push(newPoll);

        // Notify band members
        const band = this.bands.find(b => b.id === data.bandId);
        if (band) {
            band.members.forEach(member => {
                if (member.userId !== data.creatorId) {
                    this.createNotification({
                        userId: member.userId,
                        type: 'poll_created',
                        title: 'הצבעה חדשה לחזרה',
                        body: 'נוספה הצבעה חדשה לקביעת חזרה',
                        relatedEntityType: 'poll',
                        relatedEntityId: newPoll.id,
                    });
                }
            });
        }

        return newPoll;
    }

    async getRehearsalPoll(id: string): Promise<RehearsalPoll | null> {
        await this.delay();
        return this.polls.find(p => p.id === id) || null;
    }

    async getRehearsalPolls(bandId: string): Promise<RehearsalPoll[]> {
        await this.delay();
        return this.polls.filter(p => p.bandId === bandId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async getActivePolls(bandId: string): Promise<RehearsalPoll[]> {
        await this.delay();
        const now = new Date();
        return this.polls.filter(p => p.bandId === bandId && p.deadline > now);
    }

    async voteOnPoll(pollId: string, optionId: string, userId: string, canAttend: boolean): Promise<RehearsalPoll> {
        await this.delay();
        const pollIndex = this.polls.findIndex(p => p.id === pollId);
        if (pollIndex === -1) throw new Error('Poll not found');

        const optionIndex = this.polls[pollIndex].options.findIndex(o => o.id === optionId);
        if (optionIndex === -1) throw new Error('Option not found');

        // Remove existing vote ONLY for this option
        this.polls[pollIndex].options[optionIndex].votes =
            this.polls[pollIndex].options[optionIndex].votes.filter(v => v.userId !== userId);

        // Add new vote
        this.polls[pollIndex].options[optionIndex].votes.push({ userId, canAttend });

        this.saveToStorage();
        return this.polls[pollIndex];
    }

    async finalizePoll(pollId: string, optionId: string): Promise<Rehearsal> {
        await this.delay();
        const poll = this.polls.find(p => p.id === pollId);
        if (!poll) throw new Error('Poll not found');

        const option = poll.options.find(o => o.id === optionId);
        if (!option) throw new Error('Option not found');

        const newRehearsal: Rehearsal = {
            id: uuidv4(),
            bandId: poll.bandId,
            pollId: pollId,
            dateTime: option.dateTime,
            durationMinutes: option.durationMinutes,
            location: poll.location,
            status: RehearsalStatus.SCHEDULED,
            createdAt: new Date(),
        };

        this.rehearsals.push(newRehearsal);

        // Remove poll from active polls
        const pollIndex = this.polls.findIndex(p => p.id === pollId);
        if (pollIndex !== -1) {
            this.polls.splice(pollIndex, 1);
        }

        // Notify band members
        const band = this.bands.find(b => b.id === poll.bandId);
        if (band) {
            band.members.forEach(member => {
                this.createNotification({
                    userId: member.userId,
                    type: 'rehearsal_scheduled',
                    title: 'חזרה נקבעה!',
                    body: `חזרה נקבעה ל-${option.dateTime.toLocaleDateString('he-IL')}`,
                    relatedEntityType: 'rehearsal',
                    relatedEntityId: newRehearsal.id,
                });
            });
        }

        this.saveToStorage();
        return newRehearsal;
    }

    async submitRehearsalCompletion(rehearsalId: string, submitterId: string): Promise<Rehearsal> {
        await this.delay();
        const index = this.rehearsals.findIndex(r => r.id === rehearsalId);
        if (index === -1) throw new Error('Rehearsal not found');

        this.rehearsals[index] = {
            ...this.rehearsals[index],
            status: RehearsalStatus.COMPLETION_SUBMITTED,
            completionSubmittedBy: submitterId,
            completionSubmittedAt: new Date(),
        };

        return this.rehearsals[index];
    }

    async approveRehearsal(rehearsalId: string, adminId: string): Promise<Rehearsal> {
        await this.delay();
        const index = this.rehearsals.findIndex(r => r.id === rehearsalId);
        if (index === -1) throw new Error('Rehearsal not found');

        this.rehearsals[index] = {
            ...this.rehearsals[index],
            status: RehearsalStatus.APPROVED,
            adminReviewedBy: adminId,
            adminReviewedAt: new Date(),
        };

        // Update band progress
        const band = this.bands.find(b => b.id === this.rehearsals[index].bandId);
        if (band) {
            const bandIndex = this.bands.findIndex(b => b.id === band.id);
            this.bands[bandIndex].approvedRehearsalsCount++;
        }

        return this.rehearsals[index];
    }

    async rejectRehearsal(rehearsalId: string, adminId: string, note: string): Promise<Rehearsal> {
        await this.delay();
        const index = this.rehearsals.findIndex(r => r.id === rehearsalId);
        if (index === -1) throw new Error('Rehearsal not found');

        this.rehearsals[index] = {
            ...this.rehearsals[index],
            status: RehearsalStatus.REJECTED,
            adminReviewedBy: adminId,
            adminReviewedAt: new Date(),
            adminNote: note,
        };

        return this.rehearsals[index];
    }

    async cancelRehearsal(rehearsalId: string): Promise<Rehearsal> {
        await this.delay();
        const index = this.rehearsals.findIndex(r => r.id === rehearsalId);
        if (index === -1) throw new Error('Rehearsal not found');

        this.rehearsals[index] = {
            ...this.rehearsals[index],
            status: RehearsalStatus.CANCELLED,
        };

        return this.rehearsals[index];
    }

    // ============ SONGS ============
    async getSongs(bandId: string): Promise<Song[]> {
        await this.delay();
        return this.songs.filter(s => s.bandId === bandId);
    }

    async getSong(id: string): Promise<Song | null> {
        await this.delay();
        return this.songs.find(s => s.id === id) || null;
    }

    async createSong(data: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<Song> {
        await this.delay();
        const newSong: Song = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.songs.push(newSong);
        return newSong;
    }

    async updateSong(id: string, data: Partial<Song>): Promise<Song> {
        await this.delay();
        const index = this.songs.findIndex(s => s.id === id);
        if (index === -1) throw new Error('Song not found');

        this.songs[index] = {
            ...this.songs[index],
            ...data,
            updatedAt: new Date(),
        };
        return this.songs[index];
    }

    async deleteSong(id: string): Promise<void> {
        await this.delay();
        const index = this.songs.findIndex(s => s.id === id);
        if (index !== -1) {
            this.songs.splice(index, 1);
        }
    }

    // ============ PERFORMANCE REQUESTS ============
    async getPerformanceRequest(bandId: string): Promise<PerformanceRequest | null> {
        await this.delay();
        return this.performanceRequests.find(pr => pr.bandId === bandId) || null;
    }

    async createPerformanceRequest(data: Omit<PerformanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceRequest> {
        await this.delay();
        const newRequest: PerformanceRequest = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.performanceRequests.push(newRequest);

        // Update band with request ID
        const bandIndex = this.bands.findIndex(b => b.id === data.bandId);
        if (bandIndex !== -1) {
            this.bands[bandIndex].performanceRequestId = newRequest.id;
        }

        this.saveToStorage();
        return newRequest;
    }

    async reviewPerformanceRequest(id: string, status: PerformanceRequestStatus, note?: string, scheduledDate?: Date): Promise<PerformanceRequest> {
        await this.delay();
        const index = this.performanceRequests.findIndex(pr => pr.id === id);
        if (index === -1) throw new Error('Request not found');

        this.performanceRequests[index] = {
            ...this.performanceRequests[index],
            status,
            adminNote: note,
            scheduledDate,
            updatedAt: new Date(),
        };

        this.saveToStorage();
        return this.performanceRequests[index];
    }

    async getAllPerformanceRequests(): Promise<PerformanceRequest[]> {
        await this.delay();
        return [...this.performanceRequests];
    }

    // ============ LIVE SESSION REQUESTS ============
    async getLiveSessionRequest(bandId: string): Promise<LiveSessionRequest | null> {
        await this.delay();
        return this.liveSessionRequests.find(ls => ls.bandId === bandId) || null;
    }

    async createLiveSessionRequest(data: Omit<LiveSessionRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveSessionRequest> {
        await this.delay();
        const newRequest: LiveSessionRequest = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.liveSessionRequests.push(newRequest);
        return newRequest;
    }

    async reviewLiveSessionRequest(id: string, status: LiveSessionRequestStatus, note?: string, scheduledDate?: Date): Promise<LiveSessionRequest> {
        await this.delay();
        const index = this.liveSessionRequests.findIndex(ls => ls.id === id);
        if (index === -1) throw new Error('Request not found');

        this.liveSessionRequests[index] = {
            ...this.liveSessionRequests[index],
            status,
            adminNote: note,
            scheduledDate,
            updatedAt: new Date(),
        };
        return this.liveSessionRequests[index];
    }

    async getAllLiveSessionRequests(): Promise<LiveSessionRequest[]> {
        await this.delay();
        return [...this.liveSessionRequests];
    }

    // ============ FEED ============
    async getPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
        await this.delay();
        const sorted = [...this.posts].sort((a, b) => {
            // Pinned posts first
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return b.createdAt.getTime() - a.createdAt.getTime();
        });
        return sorted.slice(offset, offset + limit);
    }

    async getPost(id: string): Promise<Post | null> {
        await this.delay();
        return this.posts.find(p => p.id === id) || null;
    }

    async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<Post> {
        await this.delay();
        const newPost: Post = {
            ...data,
            id: uuidv4(),
            likesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.posts.unshift(newPost);
        return newPost;
    }

    async deletePost(id: string): Promise<void> {
        await this.delay();
        const index = this.posts.findIndex(p => p.id === id);
        if (index !== -1) {
            this.posts.splice(index, 1);
        }
    }

    async pinPost(id: string): Promise<Post> {
        await this.delay();
        const index = this.posts.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Post not found');

        this.posts[index].isPinned = true;
        return this.posts[index];
    }

    async unpinPost(id: string): Promise<Post> {
        await this.delay();
        const index = this.posts.findIndex(p => p.id === id);
        if (index === -1) throw new Error('Post not found');

        this.posts[index].isPinned = false;
        return this.posts[index];
    }

    // Likes
    async likePost(postId: string, userId: string): Promise<void> {
        await this.delay();
        const existing = this.likes.find(l => l.postId === postId && l.userId === userId);
        if (!existing) {
            this.likes.push({
                id: uuidv4(),
                postId,
                userId,
                createdAt: new Date(),
            });
            const postIndex = this.posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                this.posts[postIndex].likesCount++;
            }
        }
    }

    async unlikePost(postId: string, userId: string): Promise<void> {
        await this.delay();
        const index = this.likes.findIndex(l => l.postId === postId && l.userId === userId);
        if (index !== -1) {
            this.likes.splice(index, 1);
            const postIndex = this.posts.findIndex(p => p.id === postId);
            if (postIndex !== -1) {
                this.posts[postIndex].likesCount = Math.max(0, this.posts[postIndex].likesCount - 1);
            }
        }
    }

    async getPostLikes(postId: string): Promise<PostLike[]> {
        await this.delay();
        return this.likes.filter(l => l.postId === postId);
    }

    // Comments
    async getComments(postId: string): Promise<Comment[]> {
        await this.delay();
        return this.comments
            .filter(c => c.postId === postId)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    async createComment(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
        await this.delay();
        const newComment: Comment = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.comments.push(newComment);

        const postIndex = this.posts.findIndex(p => p.id === data.postId);
        if (postIndex !== -1) {
            this.posts[postIndex].commentsCount++;
        }

        return newComment;
    }

    async deleteComment(id: string): Promise<void> {
        await this.delay();
        const comment = this.comments.find(c => c.id === id);
        if (comment) {
            const index = this.comments.findIndex(c => c.id === id);
            this.comments.splice(index, 1);

            const postIndex = this.posts.findIndex(p => p.id === comment.postId);
            if (postIndex !== -1) {
                this.posts[postIndex].commentsCount = Math.max(0, this.posts[postIndex].commentsCount - 1);
            }
        }
    }

    // Admin messages
    async createSystemMessage(content: string, targetAudience: string, targetEventId?: string): Promise<Post> {
        await this.delay();
        const newPost: Post = {
            id: uuidv4(),
            type: PostType.ADMIN_MESSAGE,
            content,
            targetAudience: targetAudience as 'all' | 'bands' | 'event_participants',
            targetEventId,
            isPinned: true,
            likesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.posts.unshift(newPost);

        // Create notifications for all users (simplified)
        this.users.forEach(user => {
            if (user.role !== UserRole.ADMIN) {
                this.createNotification({
                    userId: user.id,
                    type: 'admin_message',
                    title: 'הודעת מערכת',
                    body: content.substring(0, 100),
                    relatedEntityType: 'post',
                    relatedEntityId: newPost.id,
                });
            }
        });

        return newPost;
    }

    // Helper for auto posts
    private async createAutoPost(eventType: string, entityId: string, content: string): Promise<void> {
        const newPost: Post = {
            id: uuidv4(),
            type: PostType.SYSTEM_AUTO,
            content,
            systemEventType: eventType,
            relatedEntityId: entityId,
            isPinned: false,
            likesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.posts.unshift(newPost);
    }

    // ============ EVENTS ============
    async getEvents(filters?: EventFilters): Promise<Event[]> {
        await this.delay();
        let results = [...this.events];

        if (filters) {
            if (filters.type) {
                results = results.filter(e => e.type === filters.type);
            }
            if (filters.fromDate) {
                results = results.filter(e => e.dateTime >= filters.fromDate!);
            }
            if (filters.toDate) {
                results = results.filter(e => e.dateTime <= filters.toDate!);
            }
        }

        return results.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    }

    async getEvent(id: string): Promise<Event | null> {
        await this.delay();
        return this.events.find(e => e.id === id) || null;
    }

    async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
        await this.delay();
        const newEvent: Event = {
            ...data,
            id: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.events.push(newEvent);
        this.saveToStorage();
        return newEvent;
    }

    async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
        await this.delay();
        const index = this.events.findIndex(e => e.id === id);
        if (index === -1) throw new Error('Event not found');

        this.events[index] = {
            ...this.events[index],
            ...data,
            updatedAt: new Date(),
        };
        return this.events[index];
    }

    async deleteEvent(id: string): Promise<void> {
        await this.delay();
        const index = this.events.findIndex(e => e.id === id);
        if (index !== -1) {
            this.events.splice(index, 1);
        }
    }

    // Registrations
    async registerForEvent(eventId: string, userId: string, notes?: string): Promise<EventRegistration> {
        await this.delay();
        const event = this.events.find(e => e.id === eventId);
        if (!event) throw new Error('Event not found');

        const existingRegs = this.eventRegistrations.filter(r => r.eventId === eventId && r.status !== 'cancelled');
        const isWaitlist = event.capacity && existingRegs.length >= event.capacity;

        const newReg: EventRegistration = {
            id: uuidv4(),
            eventId,
            userId,
            notes,
            status: isWaitlist ? 'waitlist' : 'registered',
            createdAt: new Date(),
        };
        this.eventRegistrations.push(newReg);
        return newReg;
    }

    async cancelRegistration(eventId: string, userId: string): Promise<void> {
        await this.delay();
        const index = this.eventRegistrations.findIndex(
            r => r.eventId === eventId && r.userId === userId
        );
        if (index !== -1) {
            this.eventRegistrations[index].status = 'cancelled';
        }
    }

    async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
        await this.delay();
        return this.eventRegistrations.filter(r => r.eventId === eventId);
    }

    async getMyEventRegistrations(userId: string): Promise<EventRegistration[]> {
        await this.delay();
        return this.eventRegistrations.filter(r => r.userId === userId && r.status !== 'cancelled');
    }

    // ============ NOTIFICATIONS ============
    async getNotifications(userId: string): Promise<Notification[]> {
        await this.delay();
        return this.notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async markNotificationRead(id: string): Promise<void> {
        await this.delay();
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            this.notifications[index].read = true;
            this.saveToStorage();
        }
    }

    async markAllNotificationsRead(userId: string): Promise<void> {
        await this.delay();
        this.notifications.forEach(n => {
            if (n.userId === userId) {
                n.read = true;
            }
        });
        this.saveToStorage();
    }

    async createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
        const newNotification: Notification = {
            ...data,
            id: uuidv4(),
            read: false,
            createdAt: new Date(),
        };
        this.notifications.push(newNotification);
        this.saveToStorage();
        return newNotification;
    }

    // ============ SETTINGS ============
    async getSettings(): Promise<SystemSettings> {
        await this.delay();
        return { ...this.settings };
    }

    async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> {
        await this.delay();
        this.settings = { ...this.settings, ...data };
        this.saveToStorage();
        return this.settings;
    }

    // ============ FILE UPLOAD ============
    async uploadFile(file: File, _path: string): Promise<string> {
        await this.delay(500);
        // In local mode, create a blob URL
        return URL.createObjectURL(file);
    }

    async deleteFile(_url: string): Promise<void> {
        await this.delay();
        // In local mode, nothing to do
    }

    // ============ BAND CHAT ============
    async getChatMessages(bandId: string, limit: number = 50): Promise<ChatMessage[]> {
        await this.delay();
        return this.chatMessages
            .filter(m => m.bandId === bandId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit)
            .reverse();
    }

    async sendChatMessage(bandId: string, content: string, media?: MediaFile): Promise<ChatMessage> {
        await this.delay();
        const message: ChatMessage = {
            id: uuidv4(),
            bandId,
            senderId: this.currentUserId,
            content,
            media,
            readBy: [this.currentUserId],
            createdAt: new Date(),
        };
        this.chatMessages.push(message);
        this.saveToStorage();

        // Create notifications for other band members
        const band = this.bands.find(b => b.id === bandId);
        if (band) {
            band.members
                .filter(m => m.userId !== this.currentUserId)
                .forEach(member => {
                    this.createNotification({
                        userId: member.userId,
                        type: 'chat_message',
                        title: 'הודעה חדשה בצ\'אט הלהקה',
                        body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                        relatedEntityType: 'band',
                        relatedEntityId: bandId,
                    });
                });
        }

        return message;
    }

    async markChatAsRead(bandId: string): Promise<void> {
        await this.delay();
        this.chatMessages
            .filter(m => m.bandId === bandId)
            .forEach(m => {
                if (!m.readBy.includes(this.currentUserId)) {
                    m.readBy.push(this.currentUserId);
                }
            });
        this.saveToStorage();
    }

    async getUnreadChatCount(bandId: string): Promise<number> {
        await this.delay();
        return this.chatMessages
            .filter(m => m.bandId === bandId && !m.readBy.includes(this.currentUserId))
            .length;
    }

    // ============ DIRECT MESSAGES ============
    async getConversations(): Promise<Conversation[]> {
        await this.delay();
        return this.conversations
            .filter(c => c.participantIds.includes(this.currentUserId))
            .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
    }

    async getOrCreateConversation(otherUserId: string): Promise<Conversation> {
        await this.delay();
        let conversation = this.conversations.find(c =>
            c.participantIds.includes(this.currentUserId) &&
            c.participantIds.includes(otherUserId)
        );

        if (!conversation) {
            conversation = {
                id: uuidv4(),
                participantIds: [this.currentUserId, otherUserId],
                lastMessageAt: new Date(),
                lastMessagePreview: '',
                createdAt: new Date(),
            };
            this.conversations.push(conversation);
            this.saveToStorage();
        }

        return conversation;
    }

    async getDirectMessages(conversationId: string, limit: number = 50): Promise<DirectMessage[]> {
        await this.delay();
        return this.directMessages
            .filter(m => m.conversationId === conversationId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit)
            .reverse();
    }

    async sendDirectMessage(conversationId: string, content: string, media?: MediaFile): Promise<DirectMessage> {
        await this.delay();
        const message: DirectMessage = {
            id: uuidv4(),
            conversationId,
            senderId: this.currentUserId,
            content,
            media,
            read: false,
            createdAt: new Date(),
        };
        this.directMessages.push(message);

        // Update conversation preview
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (conversation) {
            conversation.lastMessageAt = new Date();
            conversation.lastMessagePreview = content.substring(0, 50);

            // Notify the other participant
            const otherUserId = conversation.participantIds.find(id => id !== this.currentUserId);
            if (otherUserId) {
                const sender = this.users.find(u => u.id === this.currentUserId);
                this.createNotification({
                    userId: otherUserId,
                    type: 'direct_message',
                    title: `הודעה חדשה מ${sender?.displayName || 'משתמש'}`,
                    body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                    relatedEntityType: 'conversation',
                    relatedEntityId: conversationId,
                });
            }
        }

        this.saveToStorage();
        return message;
    }

    async markDirectMessagesAsRead(conversationId: string): Promise<void> {
        await this.delay();
        this.directMessages
            .filter(m => m.conversationId === conversationId && m.senderId !== this.currentUserId)
            .forEach(m => { m.read = true; });
        this.saveToStorage();
    }

    async getUnreadDirectMessageCount(): Promise<number> {
        await this.delay();
        const myConversationIds = this.conversations
            .filter(c => c.participantIds.includes(this.currentUserId))
            .map(c => c.id);
        return this.directMessages
            .filter(m =>
                myConversationIds.includes(m.conversationId) &&
                m.senderId !== this.currentUserId &&
                !m.read
            )
            .length;
    }

    // ============ AVAILABILITY & SCHEDULING ============
    async getAvailability(bandId: string, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]> {
        await this.delay();
        return this.availabilitySlots.filter(slot =>
            slot.bandId === bandId &&
            slot.date >= startDate &&
            slot.date <= endDate
        );
    }

    async updateAvailability(bandId: string, date: Date, timeSlots: AvailabilitySlot['timeSlots']): Promise<AvailabilitySlot> {
        await this.delay();
        let slot = this.availabilitySlots.find(s =>
            s.bandId === bandId &&
            s.userId === this.currentUserId &&
            s.date.toDateString() === date.toDateString()
        );

        if (slot) {
            slot.timeSlots = timeSlots;
            slot.updatedAt = new Date();
        } else {
            slot = {
                id: uuidv4(),
                bandId,
                userId: this.currentUserId,
                date,
                timeSlots,
                updatedAt: new Date(),
            };
            this.availabilitySlots.push(slot);
        }

        this.saveToStorage();
        return slot;
    }

    async getSchedulingSuggestions(bandId: string, durationMinutes: number = 120): Promise<SchedulingSuggestion[]> {
        await this.delay();
        const band = this.bands.find(b => b.id === bandId);
        if (!band) return [];

        const suggestions: SchedulingSuggestion[] = [];
        const today = new Date();
        const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

        // Get all availability data for this band
        const availability = this.availabilitySlots.filter(s =>
            s.bandId === bandId &&
            s.date >= today &&
            s.date <= twoWeeksLater
        );

        // Group by date
        const dateMap = new Map<string, AvailabilitySlot[]>();
        availability.forEach(slot => {
            const dateKey = slot.date.toDateString();
            if (!dateMap.has(dateKey)) {
                dateMap.set(dateKey, []);
            }
            dateMap.get(dateKey)!.push(slot);
        });

        // Find overlapping time slots
        dateMap.forEach((slots, dateKey) => {
            // Simple algorithm: find time when most members are available
            const availableMembers = slots
                .filter(s => s.timeSlots.some(ts => ts.status === 'available'))
                .map(s => s.userId);

            const unavailableMembers = band.members
                .map(m => m.userId)
                .filter(id => !availableMembers.includes(id));

            if (availableMembers.length >= 2) { // At least 2 members available
                const matchScore = Math.round((availableMembers.length / band.members.length) * 100);

                suggestions.push({
                    id: uuidv4(),
                    bandId,
                    dateTime: new Date(dateKey + ' 18:00'),
                    durationMinutes,
                    matchScore,
                    availableMembers,
                    unavailableMembers,
                });
            }
        });

        return suggestions.sort((a, b) => b.matchScore - a.matchScore);
    }
    // ============ SYSTEM SETTINGS & ADMIN ============
    async getSystemSettings(): Promise<SystemSettings> {
        await this.delay();
        return { ...this.settings };
    }

    async updateSystemSettings(settings: SystemSettings): Promise<void> {
        await this.delay();
        this.settings = settings;
        this.saveToStorage();
    }

    async getReports(): Promise<AppReport[]> {
        await this.delay();
        return [...this.reports];
    }

    async resolveReport(reportId: string, status: 'reviewed' | 'dismissed', note?: string): Promise<void> {
        await this.delay();
        const report = this.reports.find(r => r.id === reportId);
        if (report) {
            report.status = status;
            if (note) report.reviewNote = note;
            report.reviewedBy = this.currentUserId;
            report.reviewedAt = new Date();
            this.saveToStorage();
        }
    }

    async updateUserRole(userId: string, role: UserRole): Promise<void> {
        await this.delay();
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.role = role;
            this.saveToStorage();
        }
    }
}

// Export singleton instance
export const localRepository = new LocalRepository();
