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

    const signInWithGoogle = async () => {
        const users = await repository.getAllUsers();
        const googleUser = users.find(u => u.email === 'user@gmail.com');

        if (!googleUser) {
            throw new Error('Google login is not configured. Please use email/password login.');
        }

        setUser(googleUser);
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
