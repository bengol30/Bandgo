// ============================================
// bandgo - Firebase Repository Implementation
// Persists data to Firestore
// ============================================

import {
    IRepository,
    BandRequestFilters,
    BandFilters,
    BandProgress,
    EventFilters
} from './IRepository';
import {
    User,
    BandRequest,
    BandApplication,
    Band,
    Rehearsal,
    RehearsalStatus,
    RehearsalPoll,
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
    ChatMessage,
    Conversation,
    DirectMessage,
    Report as AppReport,
    AvailabilitySlot,
    SystemSettings,
    EventSubmission,
    EventSubmissionStatus,
    SchedulingSuggestion,
    MediaFile,
    Task,
    PostType
} from '../types';
import { db, storage } from '../config/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    getDocsFromServer,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    limit,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

// Helper to convert Firestore dates
const convertDates = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (data instanceof Timestamp) {
        return data.toDate();
    }

    if (Array.isArray(data)) {
        return data.map(item => convertDates(item));
    }

    if (typeof data === 'object') {
        const newData: any = {};
        Object.keys(data).forEach(key => {
            newData[key] = convertDates(data[key]);
        });
        return newData;
    }

    return data;
};

// Helper to remove undefined values from objects (Firestore doesn't like them)
const sanitizeData = (data: any): any => {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }

    if (typeof data === 'object' && !(data instanceof Date) && !(data instanceof Timestamp)) {
        const newData: any = {};
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                newData[key] = sanitizeData(data[key]);
            }
        });
        return newData;
    }

    return data;
};

export class FirebaseRepository implements IRepository {
    private currentUserId: string = '';

    constructor() {
        const savedId = localStorage.getItem('bandgo_auth_user_id');
        if (savedId) this.currentUserId = savedId;
    }

    async initialize(): Promise<void> {
        try {
            await this.seedDatabaseIfNeeded();
        } catch (error) {
            console.error('Failed to initialize/seed database:', error);
        }
    }

    private async seedDatabaseIfNeeded(): Promise<void> {
        // Check if users collection is empty (using getDocsFromServer to bypass cache)
        const usersRef = collection(db, 'users');
        let snapshot;
        try {
            snapshot = await getDocsFromServer(query(usersRef, limit(1)));
        } catch (e) {
            console.warn('Network error or offline: Skipping seed check. Returning early.');
            return;
        }

        if (!snapshot.empty) return; // Already seeded

        console.log('Database empty. Seeding mock data...');

        const {
            mockUsers,
            mockBandRequests,
            mockApplications,
            mockBands,
            mockRehearsals,
            mockPosts,
            mockEvents
        } = await import('../data/mockData');

        const batch = writeBatch(db);

        // Seed Users
        for (const user of mockUsers) {
            batch.set(doc(db, 'users', user.id), user);
        }

        // Seed Band Requests
        for (const req of mockBandRequests) {
            batch.set(doc(db, 'bandRequests', req.id), req);
        }

        // Seed Applications
        for (const app of mockApplications) {
            batch.set(doc(db, 'applications', app.id), app);
        }

        // Seed Bands
        for (const band of mockBands) {
            batch.set(doc(db, 'bands', band.id), band);
        }

        // Seed Rehearsals
        for (const reh of mockRehearsals) {
            batch.set(doc(db, 'rehearsals', reh.id), reh);
        }

        // Seed Posts
        for (const post of mockPosts) {
            batch.set(doc(db, 'posts', post.id), post);
        }

        // Seed Events
        for (const event of mockEvents) {
            batch.set(doc(db, 'events', event.id), event);
        }

        await batch.commit();
        console.log('Database seeded successfully!');
    }

    // ============ HELPER ============
    private async safeGetDocs(q: any, contextStr: string = 'Query'): Promise<any> {
        try {
            return await getDocs(q);
        } catch (error: any) {
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                console.error(`🚨 MISSING INDEX for ${contextStr} 🚨`);
                console.error('Click the link in the error below to create it in Firebase Console:');
                console.error(error.message);
                // Return empty snapshot to prevent crash
                return { docs: [], empty: true };
            }
            throw error;
        }
    }

    // ============ AUTH ============
    async getCurrentUser(): Promise<User | null> {
        if (!this.currentUserId) return null;
        return this.getUser(this.currentUserId);
    }

    async signIn(email: string, _password: string): Promise<User> {
        const q = query(collection(db, 'users'), where('email', '==', email));
        const sn = await getDocs(q);
        if (sn.empty) throw new Error('User not found');
        const user = convertDates(sn.docs[0].data()) as User;
        this.currentUserId = user.id;
        localStorage.setItem('bandgo_auth_user_id', user.id);
        return user;
    }

    async signOut(): Promise<void> {
        this.currentUserId = '';
        localStorage.removeItem('bandgo_auth_user_id');
    }

    async updateProfile(userId: string, data: Partial<User>): Promise<User> {
        const ref = doc(db, 'users', userId);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        const updated = await getDoc(ref);
        return convertDates(updated.data()) as User;
    }

    // ============ USERS ============
    async getUser(userId: string): Promise<User | null> {
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? (convertDates(docSnap.data()) as User) : null;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    async getAllUsers(): Promise<User[]> {
        const q = query(collection(db, 'users'));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as User);
    }

    async getUsersByIds(userIds: string[]): Promise<User[]> {
        if (userIds.length === 0) return [];
        // Ideally utilize 'in' query in batches of 10
        const all = await this.getAllUsers();
        return all.filter(u => userIds.includes(u.id));
    }

    async deleteUser(userId: string): Promise<void> {
        await deleteDoc(doc(db, 'users', userId));
    }

    async searchUsers(queryStr: string): Promise<User[]> {
        const all = await this.getAllUsers();
        const q = queryStr.toLowerCase();
        return all.filter(u =>
            u.displayName.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q)
        );
    }

    async blockUser(userId: string): Promise<void> { }
    async unblockUser(userId: string): Promise<void> { }

    // ============ BAND REQUESTS ============
    async getBandRequests(filters?: BandRequestFilters): Promise<BandRequest[]> {
        const q = query(collection(db, 'bandRequests'), orderBy('createdAt', 'desc'));
        const sn = await getDocs(q);
        let results = sn.docs.map(d => convertDates(d.data()) as BandRequest);
        if (filters) {
            if (filters.type) results = results.filter(r => r.type === filters.type);
            if (filters.region) results = results.filter(r => r.region === filters.region);
            if (filters.status) results = results.filter(r => r.status === filters.status);
        }
        return results;
    }

    async getBandRequest(id: string): Promise<BandRequest | null> {
        const d = await getDoc(doc(db, 'bandRequests', id));
        return d.exists() ? (convertDates(d.data()) as BandRequest) : null;
    }

    async createBandRequest(data: Omit<BandRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<BandRequest> {
        const id = uuidv4();
        const newReq: BandRequest = sanitizeData({
            ...data,
            id,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await setDoc(doc(db, 'bandRequests', id), newReq);
        return newReq;
    }

    async updateBandRequest(id: string, data: Partial<BandRequest>): Promise<BandRequest> {
        const ref = doc(db, 'bandRequests', id);
        await updateDoc(ref, sanitizeData({ ...data, updatedAt: serverTimestamp() }));
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as BandRequest;
    }

    async closeBandRequest(id: string): Promise<void> {
        await this.updateBandRequest(id, { status: 'closed' as any });
    }

    async getMyBandRequests(userId: string): Promise<BandRequest[]> {
        const q = query(collection(db, 'bandRequests'), where('creatorId', '==', userId));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as BandRequest);
    }

    // ============ APPLICATIONS ============
    async getApplications(bandRequestId: string): Promise<BandApplication[]> {
        const q = query(collection(db, 'applications'), where('bandRequestId', '==', bandRequestId));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as BandApplication);
    }

    async getAllApplications(): Promise<BandApplication[]> {
        const querySnapshot = await this.safeGetDocs(collection(db, 'applications'), 'getAllApplications');
        return convertDates(querySnapshot.docs.map((doc: any) => doc.data()));
    }

    async getMyApplications(userId: string): Promise<BandApplication[]> {
        const q = query(collection(db, 'applications'), where('applicantId', '==', userId));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as BandApplication);
    }

    async createApplication(data: Omit<BandApplication, 'id' | 'createdAt'>): Promise<BandApplication> {
        const id = uuidv4();
        const app: BandApplication = { ...data, id, createdAt: new Date() };
        await setDoc(doc(db, 'applications', id), app);
        return app;
    }

    async reviewApplication(id: string, status: 'approved' | 'rejected', note?: string): Promise<BandApplication> {
        const ref = doc(db, 'applications', id);

        // First read the application to get its data
        const snap = await getDoc(ref);
        if (!snap.exists()) throw new Error('Application not found');
        const app = convertDates(snap.data()) as BandApplication;

        const batch = writeBatch(db);

        // Update application status atomically
        batch.update(ref, { status, reviewedAt: serverTimestamp(), ...(note ? { reviewNote: note } : {}) });

        if (status === 'approved') {
            // Update BandRequest members and slots in the same batch
            const reqRef = doc(db, 'bandRequests', app.bandRequestId);
            const reqSnap = await getDoc(reqRef);
            if (reqSnap.exists()) {
                const req = reqSnap.data() as BandRequest;
                const members = req.currentMembers || [];
                if (!members.includes(app.applicantId)) {
                    members.push(app.applicantId);
                }

                // Update instrument slot if applicable
                const slots = req.instrumentSlots || [];
                const slot = slots.find(s => s.instrumentId === app.instrumentId);
                if (slot) {
                    if (!slot.filledBy.includes(app.applicantId)) {
                        slot.filledBy.push(app.applicantId);
                    }
                }

                batch.update(reqRef, {
                    currentMembers: members,
                    instrumentSlots: slots
                });
            }
        }

        await batch.commit();

        // Return updated application
        const updatedSnap = await getDoc(ref);
        return convertDates(updatedSnap.data()) as BandApplication;
    }

    // ============ BANDS ============
    async getBands(filters?: BandFilters): Promise<Band[]> {
        const sn = await getDocs(collection(db, 'bands'));
        return sn.docs.map(d => convertDates(d.data()) as Band);
    }

    async getBand(id: string): Promise<Band | null> {
        const d = await getDoc(doc(db, 'bands', id));
        return d.exists() ? (convertDates(d.data()) as Band) : null;
    }

    async getMyBands(userId: string): Promise<Band[]> {
        const all = await this.getBands();
        return all.filter(b => b.members.some(m => m.userId === userId));
    }

    async formBand(bandRequestId: string, name?: string): Promise<Band> {
        const bandRequest = await this.getBandRequest(bandRequestId);
        if (!bandRequest) throw new Error('Band request not found');

        // Get creator
        const creator = await this.getUser(bandRequest.creatorId);
        if (!creator) throw new Error('Creator user not found');

        // Create initial member (leader)
        // In a real scenario, we would also fetch approved applications and add those users
        const members: any[] = [{
            userId: creator.id,
            instrumentId: creator.instruments?.[0]?.instrumentId || 'vocalist', // Fallback
            joinedAt: new Date(),
            isLeader: true
        }];

        // Add all approved members from the request
        const approvedApps = (await this.getApplications(bandRequestId)).filter(a => a.status === 'approved');
        approvedApps.forEach(app => {
            if (app.applicantId !== creator.id) {
                members.push({
                    userId: app.applicantId,
                    instrumentId: app.instrumentId,
                    joinedAt: app.reviewedAt || new Date(),
                    isLeader: false
                });
            }
        });

        const newBand: Band = {
            id: uuidv4(),
            name: name || bandRequest.title || 'להקת ללא שם',
            coverImageUrl: bandRequest.coverImageUrl,
            description: bandRequest.description,
            genres: bandRequest.genres,
            city: bandRequest.city,
            region: bandRequest.region,
            commitmentLevel: bandRequest.commitmentLevel,
            rehearsalFrequency: bandRequest.rehearsalFrequency,
            targetAgeRange: bandRequest.targetAgeRange,
            influences: bandRequest.influences,
            members,
            originalBandRequestId: bandRequestId,
            approvedRehearsalsCount: 0,
            rehearsalGoal: 10,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const batch = writeBatch(db);

        // 1. Create Band
        const bandRef = doc(db, 'bands', newBand.id);
        batch.set(bandRef, sanitizeData(newBand));

        // 2. Update Band Request Status
        const reqRef = doc(db, 'bandRequests', bandRequestId);
        batch.update(reqRef, { status: 'formed', updatedAt: serverTimestamp() });

        await batch.commit();

        return newBand;
    }

    async updateBand(id: string, data: Partial<Band>): Promise<Band> {
        const ref = doc(db, 'bands', id);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as Band;
    }

    async leaveBand(bandId: string, userId: string): Promise<{ deleted: boolean }> {
        const bandRef = doc(db, 'bands', bandId);
        const bandSnap = await getDoc(bandRef);

        if (!bandSnap.exists()) throw new Error('Band not found');

        const band = convertDates(bandSnap.data()) as Band;
        const memberIndex = band.members.findIndex(m => m.userId === userId);

        if (memberIndex === -1) throw new Error('User is not a member of this band');

        // Remove the member
        const updatedMembers = [...band.members];
        updatedMembers.splice(memberIndex, 1);

        // If the leaving member was the leader, promote the next member
        if (updatedMembers.length > 0) {
            const hasLeader = updatedMembers.some(m => m.isLeader);
            if (!hasLeader) {
                updatedMembers[0].isLeader = true;
            }

            await updateDoc(bandRef, {
                members: updatedMembers,
                updatedAt: serverTimestamp()
            });

            // Sync BandRequest.currentMembers to remove the leaving user
            if (band.originalBandRequestId) {
                const reqRef = doc(db, 'bandRequests', band.originalBandRequestId);
                const reqSnap = await getDoc(reqRef);
                if (reqSnap.exists()) {
                    const req = reqSnap.data();
                    const updatedReqMembers = (req.currentMembers || []).filter((id: string) => id !== userId);
                    await updateDoc(reqRef, { currentMembers: updatedReqMembers });
                }
            }

            // Create system message
            const user = await this.getUser(userId);
            if (user) {
                await this.sendChatMessage(bandId, `${user.displayName} עזב/ה את הלהקה`);
            }

            return { deleted: false };
        } else {
            // If no members left, delete the band entirely
            await this.forceDeleteBand(bandId);
            return { deleted: true };
        }
    }

    async deleteBand(bandId: string, requestingUserId: string): Promise<void> {
        const bandRef = doc(db, 'bands', bandId);
        const bandSnap = await getDoc(bandRef);

        if (!bandSnap.exists()) throw new Error('Band not found');

        const band = convertDates(bandSnap.data()) as Band;
        const leader = band.members.find(m => m.isLeader);

        if (!leader || leader.userId !== requestingUserId) {
            throw new Error('Only the band leader can delete the band');
        }

        await this.forceDeleteBand(bandId);
    }

    async getBandProgress(bandId: string): Promise<BandProgress> {
        // Fetch real progress
        const band = await this.getBand(bandId);
        if (!band) throw new Error('Band not found');

        // Count approved rehearsals
        const rehearsals = await this.getRehearsals(bandId);
        const approved = rehearsals.filter(r => r.status === RehearsalStatus.APPROVED).length;
        const pending = rehearsals.filter(r => r.status === RehearsalStatus.POLLING || r.status === RehearsalStatus.SCHEDULED).length;

        // Check requests
        // const perfReq = await this.getPerformanceRequest(bandId); // Not needed if using band.performanceRequestId
        // const sessionReq = await this.getLiveSessionRequest(bandId); // Not needed if using band.liveSessionRequestId

        return {
            isFormed: true,
            approvedRehearsals: approved,
            pendingRehearsals: pending,
            rehearsalGoal: band.rehearsalGoal || 10,
            canRequestPerformance: approved >= (band.rehearsalGoal || 10),
            performanceStatus: band.performanceRequestId ? PerformanceRequestStatus.SUBMITTED : undefined,
            liveSessionStatus: band.liveSessionRequestId ? LiveSessionRequestStatus.SUBMITTED : undefined,
            canRequestLiveSession: approved >= 20 // Hardcoded threshold for now as per requirements
        };
    }

    // ============ REHEARSALS ============
    async getBandTasks(bandId: string): Promise<Task[]> {
        const q = query(collection(db, 'tasks'), where('bandId', '==', bandId));
        const sn = await this.safeGetDocs(q, 'getBandTasks');
        const tasks = sn.docs.map((d: any) => convertDates(d.data()) as Task);
        return tasks.sort((a: Task, b: Task) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    async createTask(bandId: string, data: Partial<Task>): Promise<Task> {
        const id = uuidv4();
        const task: Task = {
            id,
            bandId,
            type: data.type || 'OTHER',
            status: 'pending',
            title: data.title || 'New Task',
            description: data.description || '',
            assignedTo: data.assignedTo,
            createdAt: new Date(),
            ...data
        } as Task;

        // Sanitize undefined
        const sanitizedTask = sanitizeData(task);

        await setDoc(doc(db, 'tasks', id), sanitizedTask);
        return task;
    }

    async updateTask(bandId: string, taskId: string, data: Partial<Task>): Promise<Task> {
        const ref = doc(db, 'tasks', taskId);
        const updates: any = { ...data };

        if (data.status === 'completed' && !data.completedAt) {
            updates.completedAt = new Date();
        } else if (data.status === 'pending') {
            updates.completedAt = null;
        }

        await updateDoc(ref, updates);
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as Task;
    }

    async deleteTask(bandId: string, taskId: string): Promise<void> {
        await deleteDoc(doc(db, 'tasks', taskId));
    }

    async getRehearsals(bandId: string): Promise<Rehearsal[]> {
        const q = query(collection(db, 'rehearsals'), where('bandId', '==', bandId));
        const sn = await getDocs(q);
        const rehearsals = sn.docs.map(d => convertDates(d.data()) as Rehearsal);
        return rehearsals.sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
    }

    async getRehearsal(id: string): Promise<Rehearsal | null> {
        const d = await getDoc(doc(db, 'rehearsals', id));
        return d.exists() ? (convertDates(d.data()) as Rehearsal) : null;
    }

    async getAllRehearsals(): Promise<Rehearsal[]> {
        const q = query(collection(db, 'rehearsals'), orderBy('dateTime', 'desc'));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as Rehearsal);
    }

    async getPendingApprovals(): Promise<Rehearsal[]> {
        const q = query(collection(db, 'rehearsals'), where('status', '==', 'completion_submitted'));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as Rehearsal);
    }

    async createRehearsal(data: Omit<Rehearsal, 'id' | 'createdAt'>): Promise<Rehearsal> {
        const id = uuidv4();
        const rehearsal: Rehearsal = {
            ...data,
            id,
            createdAt: new Date()
        };
        await setDoc(doc(db, 'rehearsals', id), rehearsal);
        return rehearsal;
    }

    async updateRehearsal(id: string, data: Partial<Rehearsal>): Promise<Rehearsal> {
        const ref = doc(db, 'rehearsals', id);
        // If status is changing to scheduled, ensure we don't overwrite existing googleEventId if not provided
        await updateDoc(ref, data);
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as Rehearsal;
    }

    // Lifecycle
    async submitRehearsalCompletion(rehearsalId: string, submitterId: string): Promise<Rehearsal> {
        return this.updateRehearsal(rehearsalId, {
            status: 'completion_submitted' as any,
            completionSubmittedBy: submitterId,
            completionSubmittedAt: new Date()
        });
    }

    async approveRehearsal(rehearsalId: string, adminId: string): Promise<Rehearsal> {
        return this.updateRehearsal(rehearsalId, {
            status: 'approved' as any,
            adminReviewedBy: adminId,
            adminReviewedAt: new Date()
        });
    }

    async rejectRehearsal(rehearsalId: string, adminId: string, note: string): Promise<Rehearsal> {
        return this.updateRehearsal(rehearsalId, {
            status: 'rejected' as any,
            adminReviewedBy: adminId,
            adminReviewedAt: new Date(),
            adminNote: note
        });
    }

    async cancelRehearsal(rehearsalId: string): Promise<Rehearsal> {
        return this.updateRehearsal(rehearsalId, { status: 'cancelled' as any });
    }

    // ============ POLLS ============
    async createRehearsalPoll(data: Omit<RehearsalPoll, 'id' | 'createdAt'>): Promise<RehearsalPoll> {
        const id = uuidv4();
        const poll: RehearsalPoll = {
            ...data,
            id,
            createdAt: new Date()
        };
        await setDoc(doc(db, 'rehearsalPolls', id), poll);
        return poll;
    }

    async getRehearsalPoll(id: string): Promise<RehearsalPoll | null> {
        const d = await getDoc(doc(db, 'rehearsalPolls', id));
        return d.exists() ? (convertDates(d.data()) as RehearsalPoll) : null;
    }

    async getActivePolls(bandId: string): Promise<RehearsalPoll[]> {
        const q = query(collection(db, 'rehearsalPolls'), where('bandId', '==', bandId));
        const sn = await getDocs(q);
        // Filter in memory for deadline if needed, but query is better.
        // For now return all and filter in UI or simple query
        const polls = sn.docs.map(d => convertDates(d.data()) as RehearsalPoll);
        return polls.filter(p => new Date(p.deadline) > new Date());
    }

    async voteOnPoll(pollId: string, optionId: string, userId: string, canAttend: boolean): Promise<RehearsalPoll> {
        const pollRef = doc(db, 'rehearsalPolls', pollId);
        const pollSnap = await getDoc(pollRef);
        if (!pollSnap.exists()) throw new Error('Poll not found');

        const poll = convertDates(pollSnap.data()) as RehearsalPoll;
        const updatedOptions = poll.options.map(opt => {
            if (opt.id === optionId) {
                const newVotes = opt.votes.filter(v => v.userId !== userId);
                newVotes.push({ userId, canAttend });
                return { ...opt, votes: newVotes };
            }
            return opt;
        });

        await updateDoc(pollRef, { options: updatedOptions });
        return { ...poll, options: updatedOptions };
    }

    async removeVoteFromPoll(pollId: string, optionId: string, userId: string): Promise<RehearsalPoll> {
        const pollRef = doc(db, 'rehearsalPolls', pollId);
        const pollSnap = await getDoc(pollRef);

        if (!pollSnap.exists()) throw new Error('Poll not found');

        const poll = convertDates(pollSnap.data()) as RehearsalPoll;
        const optionIndex = poll.options.findIndex(o => o.id === optionId);

        if (optionIndex === -1) throw new Error('Option not found');

        // Remove vote
        const updatedOptions = [...poll.options];
        if (updatedOptions[optionIndex].votes) {
            updatedOptions[optionIndex].votes = updatedOptions[optionIndex].votes.filter(v => v.userId !== userId);
        }

        await updateDoc(pollRef, {
            options: updatedOptions
        });

        return {
            ...poll,
            options: updatedOptions
        };
    }

    async finalizePoll(pollId: string, optionId: string): Promise<Rehearsal> {
        const poll = await this.getRehearsalPoll(pollId);
        if (!poll) throw new Error('Poll not found');

        const option = poll.options.find(o => o.id === optionId);
        if (!option) throw new Error('Option not found');

        // Close poll? Delete? Or just create rehearsal.
        // Create rehearsal
        const rehearsal: Rehearsal = await this.createRehearsal({
            bandId: poll.bandId,
            pollId: poll.id,
            dateTime: option.dateTime,
            durationMinutes: option.durationMinutes,
            location: poll.location,
            status: 'scheduled' as any // RehearsalStatus.SCHEDULED
        });

        // Delete poll or mark as finalized? 
        // For now, let's delete it to clean up or maybe move to 'archivedPolls'
        await deleteDoc(doc(db, 'rehearsalPolls', pollId));

        return rehearsal;
    }

    // ============ SONGS ============
    async getSongs(bandId: string): Promise<Song[]> {
        const q = query(collection(db, 'songs'), where('bandId', '==', bandId));
        const sn = await getDocs(q);
        const songs = sn.docs.map(d => convertDates(d.data()) as Song);
        return songs.sort((a, b) => a.title.localeCompare(b.title));
    }

    async getSong(id: string): Promise<Song | null> {
        const d = await getDoc(doc(db, 'songs', id));
        return d.exists() ? (convertDates(d.data()) as Song) : null;
    }

    async createSong(data: Omit<Song, 'id' | 'createdAt' | 'updatedAt'>): Promise<Song> {
        const id = uuidv4();
        const song: Song = {
            ...data,
            id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'songs', id), song);
        return song;
    }

    async updateSong(id: string, data: Partial<Song>): Promise<Song> {
        const ref = doc(db, 'songs', id);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as Song;
    }

    async deleteSong(id: string): Promise<void> {
        await deleteDoc(doc(db, 'songs', id));
    }

    // ============ PERFORMANCE REQUESTS ============
    async getPerformanceRequest(bandId: string): Promise<PerformanceRequest | null> {
        // Assuming one active request per band, or getting the latest.
        const q = query(collection(db, 'performanceRequests'), where('bandId', '==', bandId), orderBy('createdAt', 'desc'), limit(1));
        const sn = await getDocs(q);
        return sn.empty ? null : (convertDates(sn.docs[0].data()) as PerformanceRequest);
    }

    async createPerformanceRequest(data: Omit<PerformanceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceRequest> {
        const id = uuidv4();
        const req: PerformanceRequest = {
            ...data,
            id,
            status: PerformanceRequestStatus.SUBMITTED,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'performanceRequests', id), req);
        return req;
    }

    async reviewPerformanceRequest(id: string, status: PerformanceRequestStatus, note?: string, scheduledDate?: Date): Promise<PerformanceRequest> {
        const ref = doc(db, 'performanceRequests', id);
        const updates: any = {
            status,
            updatedAt: serverTimestamp(),
            ...(note ? { adminNote: note } : {}),
            ...(scheduledDate ? { scheduledDate } : {})
        };
        await updateDoc(ref, updates);
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as PerformanceRequest;
    }

    async getAllPerformanceRequests(): Promise<PerformanceRequest[]> {
        const q = query(collection(db, 'performanceRequests'), orderBy('createdAt', 'desc'));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as PerformanceRequest);
    }

    // ============ LIVE SESSION REQUESTS ============
    async getLiveSessionRequest(bandId: string): Promise<LiveSessionRequest | null> {
        const q = query(collection(db, 'liveSessionRequests'), where('bandId', '==', bandId), orderBy('createdAt', 'desc'), limit(1));
        const sn = await getDocs(q);
        return sn.empty ? null : (convertDates(sn.docs[0].data()) as LiveSessionRequest);
    }

    async createLiveSessionRequest(data: Omit<LiveSessionRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveSessionRequest> {
        const id = uuidv4();
        const req: LiveSessionRequest = {
            ...data,
            id,
            status: LiveSessionRequestStatus.SUBMITTED,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'liveSessionRequests', id), req);
        return req;
    }

    async reviewLiveSessionRequest(id: string, status: LiveSessionRequestStatus, note?: string, scheduledDate?: Date): Promise<LiveSessionRequest> {
        const ref = doc(db, 'liveSessionRequests', id);
        const updates: any = {
            status,
            updatedAt: serverTimestamp(),
            ...(note ? { adminNote: note } : {}),
            ...(scheduledDate ? { scheduledDate } : {})
        };
        await updateDoc(ref, updates);
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as LiveSessionRequest;
    }

    async getAllLiveSessionRequests(): Promise<LiveSessionRequest[]> {
        const q = query(collection(db, 'liveSessionRequests'), orderBy('createdAt', 'desc'));
        const sn = await getDocs(q);
        return sn.docs.map((d: any) => convertDates(d.data()) as LiveSessionRequest);
    }

    // ============ FEED ============
    async getPosts(limitVal?: number, offset?: number): Promise<Post[]> {
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
        const sn = await this.safeGetDocs(q, 'getPosts');
        return sn.docs.map((d: any) => convertDates(d.data()) as Post);
    }

    async getPost(id: string): Promise<Post | null> {
        const d = await getDoc(doc(db, 'posts', id));
        return d.exists() ? (convertDates(d.data()) as Post) : null;
    }

    async createPost(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>): Promise<Post> {
        const id = uuidv4();
        const post: Post = {
            ...data,
            id,
            likesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Remove undefined fields to prevent Firestore errors
        const sanitizedPost = sanitizeData(post);

        await setDoc(doc(db, 'posts', id), sanitizedPost);
        return post;
    }

    async deletePost(id: string): Promise<void> {
        await deleteDoc(doc(db, 'posts', id));
    }

    async pinPost(id: string): Promise<Post> {
        await updateDoc(doc(db, 'posts', id), { isPinned: true });
        return (await this.getPost(id)) as Post;
    }

    async unpinPost(id: string): Promise<Post> {
        await updateDoc(doc(db, 'posts', id), { isPinned: false });
        return (await this.getPost(id)) as Post;
    }



    // ============ ADMIN ============
    async getSystemSettings(): Promise<SystemSettings> {
        const d = await getDoc(doc(db, 'settings', 'global'));
        if (!d.exists()) {
            return {
                rehearsalGoal: 10,
                pollDurationHours: 24,
                autoFinalizePoll: true,
                googleCalendarConnected: false
            };
        }
        return d.data() as SystemSettings;
    }

    async updateSystemSettings(settings: SystemSettings): Promise<void> {
        await setDoc(doc(db, 'settings', 'global'), settings);
    }

    async getReports(): Promise<AppReport[]> {
        const q = query(collection(db, 'reports'));
        const sn = await getDocs(q);
        return sn.docs.map((d: any) => convertDates(d.data()) as AppReport);
    }

    async resolveReport(reportId: string, status: 'reviewed' | 'dismissed', note?: string): Promise<void> {
        const updates: any = { status };
        if (note) updates.reviewNote = note;
        await updateDoc(doc(db, 'reports', reportId), updates);
    }



    // Admin - Events
    async approveEventSubmission(submissionId: string, approverId: string): Promise<void> {
        // 1. Get submission
        const subDoc = await getDoc(doc(db, 'eventSubmissions', submissionId));
        if (!subDoc.exists()) throw new Error('Submission not found');
        const sub = subDoc.data() as EventSubmission;

        // 2. Create Event
        const newEventId = uuidv4();
        const newEvent: Event = {
            id: newEventId,
            title: sub.title,
            description: sub.description,
            type: sub.type,
            dateTime: sub.startAt,
            location: sub.locationText || 'TBD',
            durationMinutes: 120,
            organizerId: sub.submittedByUserId,
            capacity: sub.capacity || 100,
            price: sub.price || 0,
            coverImageUrl: sub.coverUrl,
            createdBy: approverId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'events', newEventId), sanitizeData(newEvent));

        // 3. Update Submission Status
        await updateDoc(doc(db, 'eventSubmissions', submissionId), {
            status: 'approved'
        });
    }

    async rejectEventSubmission(submissionId: string, reason: string): Promise<void> {
        await updateDoc(doc(db, 'eventSubmissions', submissionId), {
            status: 'rejected',
            rejectionReason: reason
        });
    }

    async requestChangesOnSubmission(submissionId: string, notes: string): Promise<void> {
        await updateDoc(doc(db, 'eventSubmissions', submissionId), {
            status: 'needs_changes',
            changesRequestedNotes: notes
        });
    }

    async getAllEventSubmissions(): Promise<EventSubmission[]> {
        const q = query(collection(db, 'eventSubmissions'));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as EventSubmission);
    }

    async getPendingEventSubmissions(): Promise<EventSubmission[]> {
        const q = query(collection(db, 'eventSubmissions'), where('status', '==', 'pending'));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as EventSubmission);
    }

    // Admin - Users
    async updateUserRole(userId: string, role: string): Promise<void> {
        await updateDoc(doc(db, 'users', userId), { role });
    }

    async forceDeleteBand(bandId: string): Promise<void> {
        const batch = writeBatch(db);

        // Delete all related sub-documents first
        const relatedCollections = ['songs', 'tasks', 'rehearsals', 'rehearsalPolls', 'chatMessages'];
        for (const collName of relatedCollections) {
            const q = query(collection(db, collName), where('bandId', '==', bandId));
            const sn = await getDocs(q);
            sn.docs.forEach(d => batch.delete(d.ref));
        }

        // Delete the band itself
        batch.delete(doc(db, 'bands', bandId));

        await batch.commit();
    }


    // Likes & Comments
    async likePost(postId: string, userId: string): Promise<void> {
        const id = `${postId}_${userId}`;
        const like: PostLike = {
            id,
            postId,
            userId,
            createdAt: new Date()
        };
        await setDoc(doc(db, 'postLikes', id), like);

        // Update count
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const current = postSnap.data().likesCount || 0;
            await updateDoc(postRef, { likesCount: current + 1 });
        }
    }

    async unlikePost(postId: string, userId: string): Promise<void> {
        const id = `${postId}_${userId}`;
        await deleteDoc(doc(db, 'postLikes', id));

        // Update count
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const current = postSnap.data().likesCount || 0;
            await updateDoc(postRef, { likesCount: Math.max(0, current - 1) });
        }
    }

    async getPostLikes(postId: string): Promise<PostLike[]> {
        const q = query(collection(db, 'postLikes'), where('postId', '==', postId));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as PostLike);
    }

    async getComments(postId: string): Promise<Comment[]> {
        const q = query(collection(db, 'comments'), where('postId', '==', postId));
        const sn = await getDocs(q);
        const comments = sn.docs.map(d => convertDates(d.data()) as Comment);
        return comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    async createComment(data: Omit<Comment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
        const id = uuidv4();
        const comment: Comment = {
            ...data,
            id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'comments', id), comment);

        // Update post comment count
        const postRef = doc(db, 'posts', data.postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const current = postSnap.data().commentsCount || 0;
            await updateDoc(postRef, { commentsCount: current + 1 });
        }

        return comment;
    }

    async deleteComment(id: string): Promise<void> {
        // We'd need to decrement the count here too, strictly speaking, but skipping for brevity unless needed
        await deleteDoc(doc(db, 'comments', id));
    }

    async createSystemMessage(content: string, targetAudience: string, targetEventId?: string): Promise<Post> {
        const id = uuidv4();
        const post: Post = {
            id,
            type: PostType.ADMIN_MESSAGE, // Simplification
            content,
            targetAudience: targetAudience as any,
            targetEventId,
            isPinned: false,
            likesCount: 0,
            commentsCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'posts', id), post);
        return post;
    }

    // ============ EVENTS ============
    async getEvents(filters?: EventFilters): Promise<Event[]> {
        let q = query(collection(db, 'events'));

        if (filters?.type) {
            q = query(q, where('type', '==', filters.type));
        }

        const sn = await this.safeGetDocs(q, 'getEvents');
        const events = sn.docs.map((d: any) => convertDates(d.data()) as Event);
        return events.sort((a: Event, b: Event) => a.dateTime.getTime() - b.dateTime.getTime());
    }

    async getEvent(id: string): Promise<Event | null> {
        const d = await getDoc(doc(db, 'events', id));
        return d.exists() ? (convertDates(d.data()) as Event) : null;
    }

    async createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
        const id = uuidv4();
        const event: Event = {
            ...data,
            id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await setDoc(doc(db, 'events', id), sanitizeData(event));
        return event;
    }

    async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
        const ref = doc(db, 'events', id);
        await updateDoc(ref, sanitizeData({ ...data, updatedAt: serverTimestamp() }));
        const snap = await getDoc(ref);
        return convertDates(snap.data()) as Event;
    }

    async deleteEvent(id: string): Promise<void> {
        await deleteDoc(doc(db, 'events', id));
    }

    // Registrations
    async registerForEvent(eventId: string, userId: string, notes?: string): Promise<EventRegistration> {
        const id = `${eventId}_${userId}`;
        const reg: EventRegistration = {
            id,
            eventId,
            userId,
            notes,
            status: 'registered',
            createdAt: new Date()
        };
        await setDoc(doc(db, 'eventRegistrations', id), reg);
        return reg;
    }

    async cancelRegistration(eventId: string, userId: string): Promise<void> {
        const id = `${eventId}_${userId}`;
        await deleteDoc(doc(db, 'eventRegistrations', id));
    }

    async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
        const q = query(collection(db, 'eventRegistrations'), where('eventId', '==', eventId));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as EventRegistration);
    }
    async getMyEventRegistrations(userId: string): Promise<EventRegistration[]> {
        const q = query(collection(db, 'eventRegistrations'), where('userId', '==', userId));
        const sn = await getDocs(q);
        return sn.docs.map(d => convertDates(d.data()) as EventRegistration);
    }

    async createEventSubmission(submission: Omit<EventSubmission, 'id' | 'createdAt' | 'status'>): Promise<EventSubmission> {
        const id = uuidv4();
        const newSubmission: EventSubmission = {
            id,
            ...submission,
            status: EventSubmissionStatus.PENDING,
            createdAt: new Date()
        };

        // Sanitize - remove undefined values
        const sanitized = sanitizeData(newSubmission);

        await setDoc(doc(db, 'eventSubmissions', id), sanitized);
        return newSubmission;
    }

    async updateEventSubmission(submissionId: string, data: Partial<EventSubmission>): Promise<void> {
        const sanitized = sanitizeData(data);

        // Always update timestamp
        sanitized.updatedAt = new Date(); // Firestore SDK handles Date conversion or we use serverTimestamp if preferred, 
        // but here we use Date to match interface.
        // If convertDates handles it on read, we are good.

        await updateDoc(doc(db, 'eventSubmissions', submissionId), sanitized);
    }

    async deleteEventSubmission(submissionId: string): Promise<void> {
        await deleteDoc(doc(db, 'eventSubmissions', submissionId));
    }

    async getMyEventSubmissions(userId: string): Promise<EventSubmission[]> {
        const q = query(collection(db, 'eventSubmissions'), where('submittedByUserId', '==', userId));
        const sn = await getDocs(q);
        const submissions = sn.docs.map((d: any) => convertDates(d.data()) as EventSubmission);
        return submissions.sort((a: EventSubmission, b: EventSubmission) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    // ============ NOTIFICATIONS ============
    async getNotifications(userId: string): Promise<Notification[]> { return []; }
    async markNotificationRead(id: string): Promise<void> { }
    async markAllNotificationsRead(userId: string): Promise<void> { }
    async createNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> { return {} as any; }

    // ============ BAND CHAT ============
    // ============ BAND CHAT ============
    async getChatMessages(bandId: string, limitVal: number = 50): Promise<ChatMessage[]> {
        // Query without sorting to avoid index requirements
        const q = query(
            collection(db, 'chatMessages'),
            where('bandId', '==', bandId)
            // Removed orderBy('createdAt', 'asc') and limit(limitVal) to fix "Missing Index" error
        );

        const sn = await this.safeGetDocs(q, 'getChatMessages');
        const messages = sn.docs.map((d: any) => convertDates(d.data()) as ChatMessage);

        // Sort and limit client-side
        return messages
            .sort((a: ChatMessage, b: ChatMessage) => a.createdAt.getTime() - b.createdAt.getTime())
            .slice(-limitVal); // Get the last N messages
    }

    async sendChatMessage(bandId: string, content: string, media?: MediaFile): Promise<ChatMessage> {
        const user = await this.getCurrentUser();
        if (!user) throw new Error('User not authenticated');

        const id = uuidv4();
        const message: ChatMessage = {
            id,
            bandId,
            senderId: user.id,
            content,
            media,
            readBy: [user.id],
            createdAt: new Date()
        };

        // Sanitize
        const sanitized = Object.fromEntries(
            Object.entries(message).filter(([_, v]) => v !== undefined)
        );

        await setDoc(doc(db, 'chatMessages', id), sanitized);
        return message;

    }

    async markChatAsRead(bandId: string): Promise<void> {
        // In a real app, we would update the 'readBy' array for unread messages
        // For now, this is a placeholder or could be implemented if we want robust read receipts
    }

    async getUnreadChatCount(bandId: string): Promise<number> {
        return 0; // Placeholder
    }

    // ============ DIRECT MESSAGES ============
    async getConversations(): Promise<Conversation[]> { return []; }
    async getOrCreateConversation(otherUserId: string): Promise<Conversation> { return {} as any; }
    async getDirectMessages(conversationId: string, limit?: number): Promise<DirectMessage[]> { return []; }
    async sendDirectMessage(conversationId: string, content: string, media?: MediaFile): Promise<DirectMessage> { return {} as any; }
    async markDirectMessagesAsRead(conversationId: string): Promise<void> { }
    async getUnreadDirectMessageCount(): Promise<number> { return 0; }

    // ============ AVAILABILITY ============
    async getAvailability(bandId: string, startDate: Date, endDate: Date): Promise<AvailabilitySlot[]> { return []; }
    async updateAvailability(bandId: string, date: Date, timeSlots: AvailabilitySlot['timeSlots']): Promise<AvailabilitySlot> { return {} as any; }
    async getSchedulingSuggestions(bandId: string, durationMinutes?: number): Promise<SchedulingSuggestion[]> { return []; }

    // ============ SETTINGS ============
    async getSettings(): Promise<SystemSettings> { return {} as any; }
    async updateSettings(data: Partial<SystemSettings>): Promise<SystemSettings> { return {} as any; }

    // ============ FILES ============
    async uploadFile(file: File, path: string): Promise<string> {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        return await getDownloadURL(snapshot.ref);
    }
    async deleteFile(url: string): Promise<void> { }
}
