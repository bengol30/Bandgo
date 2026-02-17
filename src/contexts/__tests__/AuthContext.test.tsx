import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import { UserRole } from '../../types';

// Mock the repository module
vi.mock('../../repositories', () => {
  const mockUsers = [
    {
      id: 'user-1',
      displayName: 'Test User',
      email: 'test@test.com',
      role: 'user' as const,
      radiusKm: 30,
      genres: [],
      instruments: [],
      isVocalist: false,
      isSongwriter: false,
      samples: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'admin-1',
      displayName: 'Admin User',
      email: 'admin@test.com',
      role: 'admin' as const,
      radiusKm: 30,
      genres: [],
      instruments: [],
      isVocalist: false,
      isSongwriter: false,
      samples: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'staff-1',
      displayName: 'Staff User',
      email: 'staff@test.com',
      role: 'staff' as const,
      radiusKm: 30,
      genres: [],
      instruments: [],
      isVocalist: false,
      isSongwriter: false,
      samples: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'mod-1',
      displayName: 'Moderator',
      email: 'mod@test.com',
      role: 'moderator' as const,
      radiusKm: 30,
      genres: [],
      instruments: [],
      isVocalist: false,
      isSongwriter: false,
      samples: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  let currentUser: typeof mockUsers[0] | null = mockUsers[0];

  // Reset function to be called between tests
  (globalThis as any).__resetAuthMock = () => { currentUser = mockUsers[0]; };

  return {
    repository: {
      getCurrentUser: vi.fn(async () => currentUser),
      signIn: vi.fn(async (email: string) => {
        const user = mockUsers.find(u => u.email === email);
        if (!user) throw new Error('User not found');
        currentUser = user;
        return user;
      }),
      signOut: vi.fn(async () => {
        currentUser = mockUsers[0];
      }),
      updateProfile: vi.fn(async (userId: string, data: Record<string, unknown>) => {
        return { ...currentUser, ...data, updatedAt: new Date() };
      }),
      getAllUsers: vi.fn(async () => mockUsers),
    },
  };
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state between tests
    (globalThis as any).__resetAuthMock?.();
  });

  it('loads user on mount', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.user!.displayName).toBe('Test User');
  });

  it('signIn updates user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('admin@test.com', 'password');
    });

    expect(result.current.user!.email).toBe('admin@test.com');
  });

  it('signOut clears user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.user).toBeNull();
  });

  it('updateProfile updates user data', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateProfile({ bio: 'Updated bio' });
    });

    expect(result.current.user!.bio).toBe('Updated bio');
  });

  it('isAdmin is true for admin user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('admin@test.com', 'password');
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isStaff).toBe(true);
    expect(result.current.isModerator).toBe(true);
  });

  it('isStaff is true for staff user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('staff@test.com', 'password');
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isStaff).toBe(true);
    expect(result.current.isModerator).toBe(true);
  });

  it('isModerator is true for moderator user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('mod@test.com', 'password');
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isStaff).toBe(false);
    expect(result.current.isModerator).toBe(true);
  });

  it('regular user has no elevated permissions', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isStaff).toBe(false);
    expect(result.current.isModerator).toBe(false);
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    spy.mockRestore();
  });

  it('updateProfile throws when not logged in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Sign out first
    await act(async () => {
      await result.current.signOut();
    });

    await expect(
      act(async () => {
        await result.current.updateProfile({ bio: 'test' });
      })
    ).rejects.toThrow('Not logged in');
  });
});
