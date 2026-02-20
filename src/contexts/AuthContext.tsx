// ============================================
// bandgo - Auth Context
// ============================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { repository } from '../repositories';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    register: (data: Omit<User, 'id'>) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    isAdmin: boolean;
    isStaff: boolean;
    isModerator: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    console.log('[DEBUG] AuthProvider rendering');

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const currentUser = await repository.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to load user:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        const loggedInUser = await repository.signIn(email, password);
        setUser(loggedInUser);
    };

    const register = async (data: Omit<User, 'id'>) => {
        const newUser = await repository.signUp(data);
        setUser(newUser);
    };

    const signInWithGoogle = async () => {
        const users = await repository.getAllUsers();
        // Try to find yonatan@example.com (current user mock), otherwise grab the first user
        const googleUser = users.find(u => u.email === 'yonatan@example.com') || users[0];

        if (!googleUser) {
            throw new Error('No mock users found in the database. Please check your data seed.');
        }

        // Use the signIn method to simulate standard login and persist in localStorage
        await signIn({ email: googleUser.email, password: 'mock-password-for-google' } as any, 'mock-password-for-google');
    };

    const signOut = async () => {
        await repository.signOut();
        setUser(null);
    };

    const updateProfile = async (data: Partial<User>) => {
        if (!user) throw new Error('Not logged in');
        const updatedUser = await repository.updateProfile(user.id, data);
        setUser(updatedUser);
    };

    const isAdmin = user?.role === UserRole.ADMIN;
    const isStaff = user?.role === UserRole.STAFF || isAdmin;
    const isModerator = user?.role === UserRole.MODERATOR || isStaff;

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            signIn,
            register,
            signInWithGoogle,
            signOut,
            updateProfile,
            isAdmin,
            isStaff,
            isModerator,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
