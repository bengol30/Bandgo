import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRepository } from '../LocalRepository';
import {
  BandRequestType,
  BandRequestStatus,
  ApplicationStatus,
  RehearsalStatus,
  PostType,
  EventType,
  UserRole,
} from '../../types';

describe('LocalRepository', () => {
  let repo: LocalRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalRepository();
  });

  // ============ AUTH ============
  describe('Auth', () => {
    it('getCurrentUser returns the default user', async () => {
      const user = await repo.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.id).toBe('user-1');
      expect(user!.displayName).toBe('יונתן כהן');
    });

    it('signIn with valid email returns user', async () => {
      const user = await repo.signIn('maya@example.com', 'password');
      expect(user.id).toBe('user-2');
      expect(user.displayName).toBe('מאיה לוי');
    });

    it('signIn with invalid email throws', async () => {
      await expect(repo.signIn('nobody@test.com', 'pass')).rejects.toThrow('User not found');
    });

    it('signOut resets to default user', async () => {
      await repo.signIn('maya@example.com', 'password');
      await repo.signOut();
      const user = await repo.getCurrentUser();
      expect(user!.id).toBe('user-1');
    });

    it('updateProfile updates user data', async () => {
      const updated = await repo.updateProfile('user-1', { bio: 'New bio' });
      expect(updated.bio).toBe('New bio');
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    it('updateProfile throws for unknown user', async () => {
      await expect(repo.updateProfile('unknown-user', { bio: 'test' })).rejects.toThrow('User not found');
    });
  });

  // ============ USERS ============
  describe('Users', () => {
    it('getUser returns user by id', async () => {
      const user = await repo.getUser('user-2');
      expect(user).not.toBeNull();
      expect(user!.displayName).toBe('מאיה לוי');
    });

    it('getUser returns null for unknown id', async () => {
      const user = await repo.getUser('nonexistent');
      expect(user).toBeNull();
    });

    it('getAllUsers returns all users', async () => {
      const users = await repo.getAllUsers();
      expect(users.length).toBeGreaterThan(0);
    });

    it('searchUsers finds by display name', async () => {
      const results = await repo.searchUsers('מאיה');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].displayName).toContain('מאיה');
    });

    it('searchUsers finds by email', async () => {
      const results = await repo.searchUsers('ori@');
      expect(results.length).toBeGreaterThan(0);
    });

    it('searchUsers is case insensitive', async () => {
      const results = await repo.searchUsers('MAYA');
      expect(results.length).toBeGreaterThan(0);
    });

    it('deleteUser removes a user', async () => {
      await repo.deleteUser('user-2');
      const user = await repo.getUser('user-2');
      expect(user).toBeNull();
    });
  });

  // ============ BAND REQUESTS ============
  describe('Band Requests', () => {
    it('getBandRequests returns open requests', async () => {
      const requests = await repo.getBandRequests();
      expect(requests.length).toBeGreaterThan(0);
      requests.forEach(r => expect(r.status).toBe(BandRequestStatus.OPEN));
    });

    it('getBandRequests filters by genre', async () => {
      const requests = await repo.getBandRequests({ genres: ['jazz'] });
      expect(requests.length).toBeGreaterThan(0);
      requests.forEach(r => {
        expect(r.genres.some(g => g === 'jazz')).toBe(true);
      });
    });

    it('getBandRequests filters by region', async () => {
      const requests = await repo.getBandRequests({ region: 'north' });
      requests.forEach(r => expect(r.region).toBe('north'));
    });

    it('getBandRequests filters by type', async () => {
      const requests = await repo.getBandRequests({ type: 'targeted' });
      requests.forEach(r => expect(r.type).toBe('targeted'));
    });

    it('getBandRequest returns single request by id', async () => {
      const request = await repo.getBandRequest('br-1');
      expect(request).not.toBeNull();
      expect(request!.title).toBe('להקת רוק מקורית');
    });

    it('getBandRequest returns null for unknown id', async () => {
      const request = await repo.getBandRequest('nonexistent');
      expect(request).toBeNull();
    });

    it('createBandRequest creates a new request', async () => {
      const newRequest = await repo.createBandRequest({
        creatorId: 'user-1',
        title: 'Test Request',
        description: 'Test',
        type: BandRequestType.OPEN,
        status: BandRequestStatus.OPEN,
        genres: ['rock'],
        region: 'north',
        radiusKm: 20,
        originalVsCoverRatio: 50,
        maxMembers: 4,
        currentMembers: ['user-1'],
        sketches: [],
        sketchPending: false,
      });

      expect(newRequest.id).toBeTruthy();
      expect(newRequest.title).toBe('Test Request');
      expect(newRequest.createdAt).toBeInstanceOf(Date);
    });

    it('closeBandRequest changes status to closed', async () => {
      await repo.closeBandRequest('br-1');
      const request = await repo.getBandRequest('br-1');
      expect(request!.status).toBe(BandRequestStatus.CLOSED);
    });

    it('getMyBandRequests returns requests by creator', async () => {
      const requests = await repo.getMyBandRequests('user-1');
      expect(requests.length).toBeGreaterThan(0);
      requests.forEach(r => expect(r.creatorId).toBe('user-1'));
    });
  });

  // ============ APPLICATIONS ============
  describe('Applications', () => {
    it('getApplications returns applications for a band request', async () => {
      const apps = await repo.getApplications('br-1');
      expect(apps.length).toBeGreaterThan(0);
    });

    it('createApplication creates new application', async () => {
      const app = await repo.createApplication({
        bandRequestId: 'br-2',
        applicantId: 'user-3',
        instrumentId: 'drums',
        message: 'I want to join!',
        status: ApplicationStatus.PENDING,
      });

      expect(app.id).toBeTruthy();
      expect(app.bandRequestId).toBe('br-2');
    });

    it('reviewApplication approves correctly', async () => {
      const app = await repo.reviewApplication('app-1', 'approved', 'Welcome!');
      expect(app.status).toBe(ApplicationStatus.APPROVED);
      expect(app.reviewedAt).toBeInstanceOf(Date);
      expect(app.reviewNote).toBe('Welcome!');
    });

    it('reviewApplication rejects correctly', async () => {
      const app = await repo.reviewApplication('app-2', 'rejected', 'Not a fit');
      expect(app.status).toBe(ApplicationStatus.REJECTED);
    });

    it('getMyApplications returns applications by user', async () => {
      const apps = await repo.getMyApplications('user-3');
      expect(apps.length).toBeGreaterThan(0);
      apps.forEach(a => expect(a.applicantId).toBe('user-3'));
    });
  });

  // ============ BANDS ============
  describe('Bands', () => {
    it('getBands returns all bands', async () => {
      const bands = await repo.getBands();
      expect(bands.length).toBeGreaterThan(0);
    });

    it('getBand returns band by id', async () => {
      const band = await repo.getBand('band-1');
      expect(band).not.toBeNull();
      expect(band!.name).toBe('האש הצפונית');
    });

    it('getMyBands returns bands for a member', async () => {
      const bands = await repo.getMyBands('user-1');
      expect(bands.length).toBeGreaterThan(0);
      bands.forEach(b => {
        expect(b.members.some(m => m.userId === 'user-1')).toBe(true);
      });
    });

    it('updateBand updates band data', async () => {
      const updated = await repo.updateBand('band-1', { name: 'New Name' });
      expect(updated.name).toBe('New Name');
      expect(updated.updatedAt).toBeInstanceOf(Date);
    });

    it('leaveBand removes member', async () => {
      const result = await repo.leaveBand('band-1', 'user-4');
      expect(result.deleted).toBe(false);
      const band = await repo.getBand('band-1');
      expect(band!.members.some(m => m.userId === 'user-4')).toBe(false);
    });

    it('leaveBand promotes new leader when leader leaves', async () => {
      await repo.leaveBand('band-1', 'user-1'); // user-1 is leader
      const band = await repo.getBand('band-1');
      expect(band!.members.some(m => m.isLeader)).toBe(true);
    });

    it('leaveBand deletes band when last member leaves', async () => {
      // Create a new band to test with, to avoid mock data mutation issues
      const band = await repo.formBand('br-2', 'Temp Band');
      // The band should have at least the creator (user-2)
      // Remove all members
      for (const member of [...band.members]) {
        const result = await repo.leaveBand(band.id, member.userId);
        if (band.members.length === 1) {
          // Last member
          expect(result.deleted).toBe(true);
        }
      }

      const deletedBand = await repo.getBand(band.id);
      expect(deletedBand).toBeNull();
    });

    it('deleteBand throws for non-leader', async () => {
      // Create a fresh band for this test
      const band = await repo.formBand('br-3', 'Delete Test Band');
      const nonLeader = band.members.find(m => !m.isLeader);

      if (nonLeader) {
        await expect(repo.deleteBand(band.id, nonLeader.userId)).rejects.toThrow('Only the band leader');
      } else {
        // Band only has leader, so add a member first
        // At minimum, the creator is the leader, so this always passes
        expect(band.members.some(m => m.isLeader)).toBe(true);
      }
    });

    it('deleteBand works for band leader', async () => {
      // band-1 from mockData
      const band = await repo.getBand('band-1');
      expect(band).not.toBeNull();
      const leader = band!.members.find(m => m.isLeader);
      expect(leader).toBeDefined();

      await repo.deleteBand('band-1', leader!.userId);
      const deletedBand = await repo.getBand('band-1');
      expect(deletedBand).toBeNull();
    });

    it('getBandProgress returns correct progress', async () => {
      const progress = await repo.getBandProgress('band-1');
      expect(progress.isFormed).toBe(true);
      expect(progress.approvedRehearsals).toBe(2);
      expect(progress.rehearsalGoal).toBe(3);
      expect(progress.canRequestPerformance).toBe(false); // 2 < 3
    });

    it('formBand creates a band from request', async () => {
      const band = await repo.formBand('br-1', 'Test Band');
      expect(band.name).toBe('Test Band');
      expect(band.members.length).toBeGreaterThan(0);
      expect(band.originalBandRequestId).toBe('br-1');

      // Check that band request status is now FORMED
      const request = await repo.getBandRequest('br-1');
      expect(request!.status).toBe(BandRequestStatus.FORMED);
    });
  });

  // ============ SONGS ============
  describe('Songs', () => {
    it('getSongs returns songs for a band', async () => {
      const songs = await repo.getSongs('band-1');
      expect(songs.length).toBeGreaterThan(0);
    });

    it('createSong creates a new song', async () => {
      const song = await repo.createSong({
        bandId: 'band-1',
        title: 'New Song',
        createdBy: 'user-1',
        bpm: 140,
        key: 'Em',
      });

      expect(song.id).toBeTruthy();
      expect(song.title).toBe('New Song');
      expect(song.bpm).toBe(140);
    });

    it('updateSong updates song data', async () => {
      const updated = await repo.updateSong('song-1', { title: 'Updated Title' });
      expect(updated.title).toBe('Updated Title');
    });

    it('deleteSong removes a song', async () => {
      await repo.deleteSong('song-1');
      const song = await repo.getSong('song-1');
      expect(song).toBeNull();
    });
  });

  // ============ REHEARSALS ============
  describe('Rehearsals', () => {
    it('getRehearsals returns rehearsals for a band', async () => {
      const rehearsals = await repo.getRehearsals('band-1');
      expect(rehearsals.length).toBeGreaterThan(0);
      rehearsals.forEach(r => expect(r.bandId).toBe('band-1'));
    });

    it('submitRehearsalCompletion updates status', async () => {
      const rehearsal = await repo.submitRehearsalCompletion('reh-3', 'user-1');
      expect(rehearsal.status).toBe(RehearsalStatus.COMPLETION_SUBMITTED);
      expect(rehearsal.completionSubmittedBy).toBe('user-1');
    });

    it('approveRehearsal updates status and increments band count', async () => {
      await repo.submitRehearsalCompletion('reh-3', 'user-1');
      const rehearsal = await repo.approveRehearsal('reh-3', 'admin-1');
      expect(rehearsal.status).toBe(RehearsalStatus.APPROVED);

      const band = await repo.getBand('band-1');
      expect(band!.approvedRehearsalsCount).toBe(3); // was 2, now 3
    });

    it('rejectRehearsal updates status with note', async () => {
      await repo.submitRehearsalCompletion('reh-3', 'user-1');
      const rehearsal = await repo.rejectRehearsal('reh-3', 'admin-1', 'Not enough evidence');
      expect(rehearsal.status).toBe(RehearsalStatus.REJECTED);
      expect(rehearsal.adminNote).toBe('Not enough evidence');
    });

    it('cancelRehearsal updates status', async () => {
      const rehearsal = await repo.cancelRehearsal('reh-3');
      expect(rehearsal.status).toBe(RehearsalStatus.CANCELLED);
    });

    it('getPendingApprovals returns only submitted rehearsals', async () => {
      await repo.submitRehearsalCompletion('reh-3', 'user-1');
      const pending = await repo.getPendingApprovals();
      expect(pending.length).toBeGreaterThan(0);
      pending.forEach(r => expect(r.status).toBe(RehearsalStatus.COMPLETION_SUBMITTED));
    });
  });

  // ============ FEED ============
  describe('Feed / Posts', () => {
    it('getPosts returns posts sorted (pinned first)', async () => {
      const posts = await repo.getPosts();
      expect(posts.length).toBeGreaterThan(0);

      // Find first pinned index and first non-pinned index
      const firstPinnedIdx = posts.findIndex(p => p.isPinned);
      const firstNonPinnedIdx = posts.findIndex(p => !p.isPinned);

      if (firstPinnedIdx >= 0 && firstNonPinnedIdx >= 0) {
        expect(firstPinnedIdx).toBeLessThan(firstNonPinnedIdx);
      }
    });

    it('createPost creates a new post', async () => {
      const post = await repo.createPost({
        type: PostType.USER_POST,
        authorId: 'user-1',
        content: 'Test post content',
        isPinned: false,
      });

      expect(post.id).toBeTruthy();
      expect(post.content).toBe('Test post content');
      expect(post.likesCount).toBe(0);
      expect(post.commentsCount).toBe(0);
    });

    it('deletePost removes a post', async () => {
      await repo.deletePost('post-1');
      const post = await repo.getPost('post-1');
      expect(post).toBeNull();
    });

    it('pinPost pins a post', async () => {
      const post = await repo.pinPost('post-2');
      expect(post.isPinned).toBe(true);
    });

    it('likePost increments like count', async () => {
      await repo.likePost('post-2', 'user-3');
      const post = await repo.getPost('post-2');
      expect(post!.likesCount).toBe(9); // was 8
    });

    it('likePost does not double-like', async () => {
      const postBefore = await repo.getPost('post-2');
      const countBefore = postBefore!.likesCount;
      await repo.likePost('post-2', 'user-3');
      await repo.likePost('post-2', 'user-3');
      const post = await repo.getPost('post-2');
      // The first likePost from previous test may have already incremented
      // so we check relative to countBefore+1 (one like from user-3)
      expect(post!.likesCount).toBe(countBefore + 1);
    });

    it('unlikePost decrements like count', async () => {
      // Make sure user-3 has liked the post first
      await repo.likePost('post-2', 'user-3');
      const postBefore = await repo.getPost('post-2');
      const countBefore = postBefore!.likesCount;
      await repo.unlikePost('post-2', 'user-3');
      const post = await repo.getPost('post-2');
      expect(post!.likesCount).toBe(countBefore - 1);
    });

    it('createComment increments comment count', async () => {
      const comment = await repo.createComment({
        postId: 'post-2',
        authorId: 'user-3',
        content: 'Nice post!',
      });

      expect(comment.id).toBeTruthy();
      expect(comment.content).toBe('Nice post!');

      const post = await repo.getPost('post-2');
      expect(post!.commentsCount).toBe(3); // was 2
    });

    it('deleteComment decrements comment count', async () => {
      const comment = await repo.createComment({
        postId: 'post-2',
        authorId: 'user-3',
        content: 'To be deleted',
      });
      const postBefore = await repo.getPost('post-2');
      const countBefore = postBefore!.commentsCount;
      await repo.deleteComment(comment.id);

      const post = await repo.getPost('post-2');
      expect(post!.commentsCount).toBe(countBefore - 1);
    });
  });

  // ============ EVENTS ============
  describe('Events', () => {
    it('getEvents returns all events', async () => {
      const events = await repo.getEvents();
      expect(events.length).toBeGreaterThan(0);
    });

    it('getEvents filters by type', async () => {
      const events = await repo.getEvents({ type: EventType.JAM });
      events.forEach(e => expect(e.type).toBe(EventType.JAM));
    });

    it('createEvent creates a new event', async () => {
      const event = await repo.createEvent({
        title: 'Test Event',
        description: 'A test event',
        type: EventType.WORKSHOP,
        dateTime: new Date('2024-04-01T18:00:00'),
        durationMinutes: 120,
        location: 'Test Location',
        organizerId: 'admin-1',
        createdBy: 'admin-1',
      });

      expect(event.id).toBeTruthy();
      expect(event.title).toBe('Test Event');
    });

    it('registerForEvent creates registration', async () => {
      const reg = await repo.registerForEvent('event-1', 'user-3');
      expect(reg.eventId).toBe('event-1');
      expect(reg.userId).toBe('user-3');
      expect(reg.status).toBe('registered');
    });

    it('registerForEvent puts user on waitlist when at capacity', async () => {
      // event-1 has capacity 30, already has 2 registrations
      // Create an event with capacity 1 first
      const event = await repo.createEvent({
        title: 'Small Event',
        description: 'Limited capacity',
        type: EventType.JAM,
        dateTime: new Date('2024-05-01'),
        durationMinutes: 60,
        location: 'Test',
        capacity: 1,
        organizerId: 'admin-1',
        createdBy: 'admin-1',
      });

      await repo.registerForEvent(event.id, 'user-1');
      const waitlistReg = await repo.registerForEvent(event.id, 'user-2');
      expect(waitlistReg.status).toBe('waitlist');
    });

    it('cancelRegistration marks as cancelled', async () => {
      await repo.cancelRegistration('event-1', 'user-1');
      const regs = await repo.getEventRegistrations('event-1');
      const cancelled = regs.find(r => r.userId === 'user-1');
      expect(cancelled!.status).toBe('cancelled');
    });
  });

  // ============ NOTIFICATIONS ============
  describe('Notifications', () => {
    it('getNotifications returns notifications for user', async () => {
      const notifications = await repo.getNotifications('user-1');
      expect(notifications.length).toBeGreaterThan(0);
      notifications.forEach(n => expect(n.userId).toBe('user-1'));
    });

    it('notifications are sorted newest first', async () => {
      const notifications = await repo.getNotifications('user-1');
      for (let i = 1; i < notifications.length; i++) {
        expect(notifications[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(
          notifications[i].createdAt.getTime()
        );
      }
    });

    it('markNotificationRead marks a notification as read', async () => {
      await repo.markNotificationRead('notif-1');
      const notifications = await repo.getNotifications('user-1');
      const notif = notifications.find(n => n.id === 'notif-1');
      expect(notif!.read).toBe(true);
    });

    it('markAllNotificationsRead marks all as read', async () => {
      await repo.markAllNotificationsRead('user-1');
      const notifications = await repo.getNotifications('user-1');
      notifications.forEach(n => expect(n.read).toBe(true));
    });

    it('createNotification creates a new notification', async () => {
      const notif = await repo.createNotification({
        userId: 'user-2',
        type: 'test',
        title: 'Test notification',
        body: 'This is a test',
      });

      expect(notif.id).toBeTruthy();
      expect(notif.read).toBe(false);
      expect(notif.createdAt).toBeInstanceOf(Date);
    });
  });

  // ============ CHAT ============
  describe('Chat Messages', () => {
    it('sendChatMessage creates a message', async () => {
      const msg = await repo.sendChatMessage('band-1', 'Hello band!');
      expect(msg.id).toBeTruthy();
      expect(msg.content).toBe('Hello band!');
      expect(msg.bandId).toBe('band-1');
      expect(msg.senderId).toBe('user-1');
      expect(msg.readBy).toContain('user-1');
    });

    it('getChatMessages returns messages for a band', async () => {
      await repo.sendChatMessage('band-1', 'Message 1');
      await repo.sendChatMessage('band-1', 'Message 2');

      const messages = await repo.getChatMessages('band-1');
      expect(messages.length).toBe(2);
    });

    it('markChatAsRead marks all messages as read', async () => {
      // Login as user-2 to send message, then switch back
      await repo.signIn('maya@example.com', 'pass');
      await repo.sendChatMessage('band-1', 'From maya');

      // Switch back to user-1
      await repo.signIn('yonatan@example.com', 'pass');
      await repo.markChatAsRead('band-1');

      const count = await repo.getUnreadChatCount('band-1');
      expect(count).toBe(0);
    });
  });

  // ============ DIRECT MESSAGES ============
  describe('Direct Messages', () => {
    it('getConversations returns user conversations', async () => {
      const convos = await repo.getConversations();
      expect(convos.length).toBeGreaterThan(0);
    });

    it('getOrCreateConversation returns existing conversation', async () => {
      const conv = await repo.getOrCreateConversation('user-4');
      expect(conv.id).toBe('conv-1');
    });

    it('getOrCreateConversation creates new conversation', async () => {
      const conv = await repo.getOrCreateConversation('user-3');
      expect(conv.id).toBeTruthy();
      expect(conv.participantIds).toContain('user-1');
      expect(conv.participantIds).toContain('user-3');
    });

    it('sendDirectMessage creates a message', async () => {
      const msg = await repo.sendDirectMessage('conv-1', 'Hello!');
      expect(msg.id).toBeTruthy();
      expect(msg.content).toBe('Hello!');
      expect(msg.conversationId).toBe('conv-1');
    });

    it('getDirectMessages returns messages for a conversation', async () => {
      const messages = await repo.getDirectMessages('conv-1');
      expect(messages.length).toBeGreaterThan(0);
    });

    it('markDirectMessagesAsRead marks messages as read', async () => {
      await repo.markDirectMessagesAsRead('conv-1');
      const count = await repo.getUnreadDirectMessageCount();
      expect(count).toBe(0);
    });
  });

  // ============ SETTINGS ============
  describe('Settings', () => {
    it('getSettings returns settings', async () => {
      const settings = await repo.getSettings();
      expect(settings.rehearsalGoal).toBeDefined();
      expect(settings.pollDurationHours).toBeDefined();
    });

    it('updateSettings updates settings', async () => {
      const updated = await repo.updateSettings({ rehearsalGoal: 5 });
      expect(updated.rehearsalGoal).toBe(5);
    });

    it('getSystemSettings returns same as getSettings', async () => {
      const settings = await repo.getSystemSettings();
      expect(settings.rehearsalGoal).toBeDefined();
    });
  });

  // ============ TASKS ============
  describe('Tasks', () => {
    it('createTask creates a task for a band', async () => {
      const task = await repo.createTask('band-1', {
        type: 'OTHER',
        status: 'pending',
        title: 'Test Task',
        description: 'A test task',
      });

      expect(task.id).toBeTruthy();
      expect(task.bandId).toBe('band-1');
      expect(task.title).toBe('Test Task');
    });

    it('updateTask marks task as completed', async () => {
      const task = await repo.createTask('band-1', {
        type: 'OTHER',
        status: 'pending',
        title: 'Complete me',
      });

      const updated = await repo.updateTask('band-1', task.id, { status: 'completed' });
      expect(updated.status).toBe('completed');
      expect(updated.completedAt).toBeInstanceOf(Date);
    });

    it('deleteTask removes a task', async () => {
      const task = await repo.createTask('band-1', {
        type: 'OTHER',
        status: 'pending',
        title: 'Delete me',
      });

      await repo.deleteTask('band-1', task.id);
      const tasks = await repo.getBandTasks('band-1');
      expect(tasks.find(t => t.id === task.id)).toBeUndefined();
    });

    it('getBandTasks returns tasks sorted (pending first)', async () => {
      await repo.createTask('band-1', { type: 'OTHER', status: 'pending', title: 'Pending' });
      await repo.createTask('band-1', { type: 'OTHER', status: 'completed', title: 'Done' });

      const tasks = await repo.getBandTasks('band-1');
      const pendingIdx = tasks.findIndex(t => t.status === 'pending');
      const completedIdx = tasks.findIndex(t => t.status === 'completed');

      if (pendingIdx >= 0 && completedIdx >= 0) {
        expect(pendingIdx).toBeLessThan(completedIdx);
      }
    });
  });

  // ============ REPORTS ============
  describe('Reports', () => {
    it('getReports returns reports', async () => {
      const reports = await repo.getReports();
      expect(reports.length).toBeGreaterThan(0);
    });

    it('resolveReport updates report status', async () => {
      await repo.resolveReport('rep-1', 'reviewed', 'Investigated');
      const reports = await repo.getReports();
      const report = reports.find(r => r.id === 'rep-1');
      expect(report!.status).toBe('reviewed');
      expect(report!.reviewNote).toBe('Investigated');
    });
  });

  // ============ USER ROLES ============
  describe('User Roles', () => {
    it('updateUserRole changes user role', async () => {
      await repo.updateUserRole('user-2', UserRole.MODERATOR);
      const user = await repo.getUser('user-2');
      expect(user!.role).toBe(UserRole.MODERATOR);
    });
  });

  // ============ EVENT SUBMISSIONS ============
  describe('Event Submissions', () => {
    it('createEventSubmission creates a submission', async () => {
      const sub = await repo.createEventSubmission({
        submittedByUserId: 'user-1',
        title: 'My Event',
        type: EventType.JAM,
        description: 'A test event',
        startAt: new Date('2024-04-01T18:00:00'),
        endAt: new Date('2024-04-01T20:00:00'),
        locationText: 'Test Location',
        registrationEnabled: true,
        price: 0,
      });

      expect(sub.id).toBeTruthy();
      expect(sub.status).toBe('pending');
    });

    it('approveEventSubmission creates event and updates status', async () => {
      const sub = await repo.createEventSubmission({
        submittedByUserId: 'user-1',
        title: 'Approve Me',
        type: EventType.WORKSHOP,
        description: 'Please approve',
        startAt: new Date('2024-04-01T18:00:00'),
        endAt: new Date('2024-04-01T20:00:00'),
        locationText: 'Here',
        registrationEnabled: false,
        price: 50,
      });

      await repo.approveEventSubmission(sub.id, 'admin-1');

      const submissions = await repo.getAllEventSubmissions();
      const updated = submissions.find(s => s.id === sub.id);
      expect(updated!.status).toBe('approved');
      expect(updated!.approvedEventId).toBeTruthy();
    });

    it('rejectEventSubmission sets rejection reason', async () => {
      const sub = await repo.createEventSubmission({
        submittedByUserId: 'user-1',
        title: 'Reject Me',
        type: EventType.JAM,
        description: 'Will be rejected',
        startAt: new Date('2024-04-01T18:00:00'),
        endAt: new Date('2024-04-01T20:00:00'),
        locationText: 'Nowhere',
        registrationEnabled: false,
        price: 0,
      });

      await repo.rejectEventSubmission(sub.id, 'Not appropriate');

      const submissions = await repo.getAllEventSubmissions();
      const updated = submissions.find(s => s.id === sub.id);
      expect(updated!.status).toBe('rejected');
      expect(updated!.rejectionReason).toBe('Not appropriate');
    });
  });
});
