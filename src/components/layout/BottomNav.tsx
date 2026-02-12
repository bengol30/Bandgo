// ============================================
// bandgo - Bottom Navigation Component
// ============================================

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Newspaper,
    Music2,
    Users,
    Calendar,
    User
} from 'lucide-react';
import './Navigation.css';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { path: '/', label: 'פיד', icon: <Newspaper size={24} /> },
    { path: '/bands', label: 'להקות', icon: <Users size={24} /> },
    { path: '/events', label: 'אירועים', icon: <Calendar size={24} /> },
    { path: '/profile', label: 'פרופיל', icon: <User size={24} /> },
];

export function BottomNav() {
    const location = useLocation();

    // Don't show nav on admin pages or onboarding
    if (location.pathname.startsWith('/admin') || location.pathname === '/onboarding') {
        return null;
    }

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
}
