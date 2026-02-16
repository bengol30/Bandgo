import { describe, it, expect } from 'vitest';
import {
  UserRole,
  InstrumentLevel,
  BandRequestType,
  BandRequestStatus,
  ApplicationStatus,
  RehearsalStatus,
  PerformanceRequestStatus,
  LiveSessionRequestStatus,
  BandCommitmentLevel,
  SearchStatus,
  PostType,
  EventType,
  EventSubmissionStatus,
  AvailabilityStatus,
  AuditionStatus,
} from '../../types';

describe('Type Enums', () => {
  describe('UserRole', () => {
    it('has all expected values', () => {
      expect(UserRole.USER).toBe('user');
      expect(UserRole.ADMIN).toBe('admin');
      expect(UserRole.STAFF).toBe('staff');
      expect(UserRole.MODERATOR).toBe('moderator');
      expect(UserRole.BANNED).toBe('banned');
    });

    it('has exactly 5 roles', () => {
      expect(Object.keys(UserRole)).toHaveLength(5);
    });
  });

  describe('InstrumentLevel', () => {
    it('has all expected values', () => {
      expect(InstrumentLevel.BEGINNER).toBe('beginner');
      expect(InstrumentLevel.INTERMEDIATE).toBe('intermediate');
      expect(InstrumentLevel.ADVANCED).toBe('advanced');
      expect(InstrumentLevel.PROFESSIONAL).toBe('professional');
    });
  });

  describe('BandRequestType', () => {
    it('has targeted and open types', () => {
      expect(BandRequestType.TARGETED).toBe('targeted');
      expect(BandRequestType.OPEN).toBe('open');
    });
  });

  describe('BandRequestStatus', () => {
    it('has all expected statuses', () => {
      expect(BandRequestStatus.OPEN).toBe('open');
      expect(BandRequestStatus.CLOSED).toBe('closed');
      expect(BandRequestStatus.FORMED).toBe('formed');
    });
  });

  describe('ApplicationStatus', () => {
    it('has all expected statuses', () => {
      expect(ApplicationStatus.PENDING).toBe('pending');
      expect(ApplicationStatus.APPROVED).toBe('approved');
      expect(ApplicationStatus.REJECTED).toBe('rejected');
    });
  });

  describe('RehearsalStatus', () => {
    it('has all expected statuses', () => {
      expect(RehearsalStatus.POLLING).toBe('polling');
      expect(RehearsalStatus.SCHEDULED).toBe('scheduled');
      expect(RehearsalStatus.COMPLETION_SUBMITTED).toBe('completion_submitted');
      expect(RehearsalStatus.APPROVED).toBe('approved');
      expect(RehearsalStatus.REJECTED).toBe('rejected');
      expect(RehearsalStatus.CANCELLED).toBe('cancelled');
    });

    it('has exactly 6 statuses', () => {
      expect(Object.keys(RehearsalStatus)).toHaveLength(6);
    });
  });

  describe('PerformanceRequestStatus', () => {
    it('has all expected statuses', () => {
      expect(PerformanceRequestStatus.SUBMITTED).toBe('submitted');
      expect(PerformanceRequestStatus.IN_REVIEW).toBe('in_review');
      expect(PerformanceRequestStatus.APPROVED).toBe('approved');
      expect(PerformanceRequestStatus.REJECTED).toBe('rejected');
      expect(PerformanceRequestStatus.NEEDS_CHANGES).toBe('needs_changes');
    });
  });

  describe('LiveSessionRequestStatus', () => {
    it('has all expected statuses', () => {
      expect(LiveSessionRequestStatus.SUBMITTED).toBe('submitted');
      expect(LiveSessionRequestStatus.IN_REVIEW).toBe('in_review');
      expect(LiveSessionRequestStatus.APPROVED).toBe('approved');
      expect(LiveSessionRequestStatus.REJECTED).toBe('rejected');
      expect(LiveSessionRequestStatus.SCHEDULED).toBe('scheduled');
    });
  });

  describe('BandCommitmentLevel', () => {
    it('has all expected levels', () => {
      expect(BandCommitmentLevel.HOBBY).toBe('hobby');
      expect(BandCommitmentLevel.INTERMEDIATE).toBe('intermediate');
      expect(BandCommitmentLevel.PROFESSIONAL).toBe('professional');
    });
  });

  describe('SearchStatus', () => {
    it('has all expected statuses', () => {
      expect(SearchStatus.LOOKING).toBe('looking');
      expect(SearchStatus.AVAILABLE_FOR_JAMS).toBe('available_for_jams');
      expect(SearchStatus.NOT_LOOKING).toBe('not_looking');
    });
  });

  describe('PostType', () => {
    it('has all expected types', () => {
      expect(PostType.USER_POST).toBe('user_post');
      expect(PostType.SYSTEM_AUTO).toBe('system_auto');
      expect(PostType.ADMIN_MESSAGE).toBe('admin_message');
    });
  });

  describe('EventType', () => {
    it('has all expected types', () => {
      expect(EventType.JAM).toBe('jam');
      expect(EventType.BAND_PERFORMANCE).toBe('band_performance');
      expect(EventType.SHARED_PERFORMANCE).toBe('shared_performance');
      expect(EventType.OPEN_SESSION).toBe('open_session');
      expect(EventType.WORKSHOP).toBe('workshop');
      expect(EventType.OTHER).toBe('other');
    });

    it('has exactly 6 types', () => {
      expect(Object.keys(EventType)).toHaveLength(6);
    });
  });

  describe('EventSubmissionStatus', () => {
    it('has all expected statuses', () => {
      expect(EventSubmissionStatus.PENDING).toBe('pending');
      expect(EventSubmissionStatus.APPROVED).toBe('approved');
      expect(EventSubmissionStatus.REJECTED).toBe('rejected');
      expect(EventSubmissionStatus.NEEDS_CHANGES).toBe('needs_changes');
    });
  });

  describe('AvailabilityStatus', () => {
    it('has all expected statuses', () => {
      expect(AvailabilityStatus.AVAILABLE).toBe('available');
      expect(AvailabilityStatus.MAYBE).toBe('maybe');
      expect(AvailabilityStatus.UNAVAILABLE).toBe('unavailable');
    });
  });

  describe('AuditionStatus', () => {
    it('has all expected statuses', () => {
      expect(AuditionStatus.NOT_SCHEDULED).toBe('not_scheduled');
      expect(AuditionStatus.SCHEDULED).toBe('scheduled');
      expect(AuditionStatus.COMPLETED).toBe('completed');
      expect(AuditionStatus.CANCELLED).toBe('cancelled');
    });
  });
});
