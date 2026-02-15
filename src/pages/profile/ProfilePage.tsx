// ============================================
// bandgo - Profile Page
// User profile with instruments, bands, events
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Edit3,
    Music,
    Users,
    Calendar,
    Settings,
    LogOut,
    ChevronLeft,
    Mic,
    Phone,
    Instagram,
    Globe,
    Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { Band, Event, EventRegistration } from '../../types';
import { INSTRUMENTS, GENRES } from '../../data/constants';
import { ExtendedProfileWizard } from '../../components/profile/ExtendedProfileWizard';
import './Profile.css';

export function ProfilePage() {
    const { user, signOut, isAdmin } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [myBands, setMyBands] = useState<Band[]>([]);
    const [myEvents, setMyEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [showWizard, setShowWizard] = useState(false);

    const isProfileComplete = user && user.contactInfo && user.searchStatus;

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);

            const [bandsData, registrationsData, eventsData] = await Promise.all([
                repository.getMyBands(user!.id),
                repository.getMyEventRegistrations(user!.id),
                repository.getEvents(),
            ]);

            setMyBands(bandsData);

            // Filter events I'm registered to
            const registeredEventIds = new Set(registrationsData.map(r => r.eventId));
            const upcomingEvents = eventsData.filter(e =>
                registeredEventIds.has(e.id) && new Date(e.dateTime) > new Date()
            );
            setMyEvents(upcomingEvents);
        } catch (error) {
            console.error('Failed to load profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInstrumentName = (id: string): string => {
        const inst = INSTRUMENTS.find(i => i.id === id);
        return inst?.nameHe || id;
    };

    const getInstrumentIcon = (id: string): string => {
        const inst = INSTRUMENTS.find(i => i.id === id);
        return inst?.icon || '🎵';
    };

    const getGenreName = (id: string): string => {
        const genre = GENRES.find(g => g.id === id);
        return genre?.nameHe || id;
    };

    const getLevelLabel = (level?: string): string => {
        const labels: Record<string, string> = {
            beginner: 'מתחיל',
            intermediate: 'בינוני',
            advanced: 'מתקדם',
            professional: 'מקצועי',
        };
        return level ? labels[level] || level : '';
    };

    const formatEventDate = (date: Date) => {
        const d = new Date(date);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString('he-IL', { month: 'short' }),
        };
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            showToast('להתראות! 👋', 'info');
            navigate('/');
        } catch (error) {
            showToast('שגיאה בהתנתקות', 'error');
        }
    };

    if (!user) {
        return (
            <div className="page">
                <div className="container">
                    <div className="empty-state">
                        <div className="empty-state-icon">👤</div>
                        <h3 className="empty-state-title">לא מחובר</h3>
                        <p className="empty-state-text">יש להתחבר כדי לראות את הפרופיל</p>
                        <button className="btn btn-primary" onClick={() => navigate('/login')}>
                            התחברות
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="flex-center" style={{ padding: '4rem 0' }}>
                        <div className="spinner spinner-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            {/* Header */}
            <div className="profile-header">
                <div className="profile-avatar-wrapper">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.displayName} className="profile-avatar" />
                    ) : (
                        <div className="profile-avatar-placeholder">
                            {user.displayName.charAt(0)}
                        </div>
                    )}
                    <button className="profile-edit-btn" onClick={() => navigate('/profile/edit')}>
                        <Edit3 size={14} color="var(--color-bg-primary)" />
                    </button>
                </div>

                <h1 className="profile-name">{user.displayName}</h1>

                {user.city && (
                    <div className="profile-location">
                        <MapPin size={14} />
                        <span>{user.city}</span>
                    </div>
                )}

                {user.bio && <p className="profile-bio">{user.bio}</p>}

                {/* Extended Info Header */}
                <div className="flex flex-wrap gap-md mt-md justify-center">
                    {user.searchStatus && (
                        <div className="badge badge-primary flex items-center gap-xs">
                            <Search size={14} />
                            <span>
                                {user.searchStatus === 'looking' && 'מחפש הרכב'}
                                {user.searchStatus === 'available_for_jams' && 'זמין לג\'אמים'}
                                {user.searchStatus === 'not_looking' && 'לא מחפש כרגע'}
                            </span>
                        </div>
                    )}

                    {user.contactInfo && (
                        <div className="flex gap-sm">
                            {user.contactInfo.whatsapp && (
                                <a href={`https://wa.me/${user.contactInfo.whatsapp}`} target="_blank" rel="noreferrer" className="btn-icon btn-ghost text-success">
                                    <Phone size={20} />
                                </a>
                            )}
                            {user.contactInfo.instagram && (
                                <a href={`https://instagram.com/${user.contactInfo.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="btn-icon btn-ghost text-accent">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {user.contactInfo.tiktok && (
                                <a href={`https://tiktok.com/@${user.contactInfo.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="btn-icon btn-ghost">
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>♪</span>
                                </a>
                            )}
                        </div>
                    )}
                </div>

                <div className="profile-stats">
                    <div className="profile-stat">
                        <span className="profile-stat-value">{user.instruments?.length || 0}</span>
                        <span className="profile-stat-label">כלים</span>
                    </div>
                    <div className="profile-stat">
                        <span className="profile-stat-value">{myBands.length}</span>
                        <span className="profile-stat-label">להקות</span>
                    </div>
                    <div className="profile-stat">
                        <span className="profile-stat-value">{myEvents.length}</span>
                        <span className="profile-stat-label">אירועים</span>
                    </div>
                </div>
            </div>

            {/* Incomplete Profile CTA */}
            {!isProfileComplete && (
                <div className="container mb-lg">
                    <div className="card bg-bg-secondary border-primary" style={{ padding: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h3 className="text-lg font-bold mb-xs">הפרופיל שלך לא מלא! 🥺</h3>
                            <p className="text-muted">הוסף פרטי קשר וציוד כדי שמוזיקאים יוכלו למצוא אותך.</p>
                        </div>
                        <button className="btn btn-primary shadow-lg" onClick={() => setShowWizard(true)}>
                            השלם פרופיל
                        </button>
                    </div>
                </div>
            )}

            {/* Instruments */}
            {user.instruments && user.instruments.length > 0 && (
                <section className="profile-section">
                    <div className="profile-section-header">
                        <h2 className="profile-section-title">
                            <Music size={18} />
                            הכלים שלי
                        </h2>
                    </div>
                    <div className="profile-instruments">
                        {user.instruments.map((inst, idx) => (
                            <div key={idx} className="profile-instrument">
                                <span className="profile-instrument-icon">
                                    {getInstrumentIcon(inst.instrumentId)}
                                </span>
                                <span className="profile-instrument-name">
                                    {getInstrumentName(inst.instrumentId)}
                                </span>
                                {inst.level && (
                                    <span className="profile-instrument-level">
                                        {getLevelLabel(inst.level)}
                                    </span>
                                )}
                            </div>
                        ))}
                        {user.isVocalist && (
                            <div className="profile-instrument">
                                <span className="profile-instrument-icon">🎤</span>
                                <span className="profile-instrument-name">זמר/ת</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Genres */}
            {user.genres && user.genres.length > 0 && (
                <section className="profile-section">
                    <div className="profile-section-header">
                        <h2 className="profile-section-title">סגנונות</h2>
                    </div>
                    <div className="profile-genres">
                        {user.genres.map(genreId => (
                            <span key={genreId} className="chip">
                                {getGenreName(genreId)}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Gear & Influences */}
            {(user.gear || (user.influences && user.influences.length > 0)) && (
                <section className="profile-section">
                    <div className="profile-section-header">
                        <h2 className="profile-section-title">מידע נוסף</h2>
                    </div>

                    {user.gear && (
                        <div className="mb-md">
                            <h3 className="text-sm font-bold text-muted mb-xs">ציוד</h3>
                            <p className="text-sm">{user.gear}</p>
                        </div>
                    )}

                    {user.influences && user.influences.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-muted mb-xs">השפעות</h3>
                            <div className="flex flex-wrap gap-xs">
                                {user.influences.map((inf, idx) => (
                                    <span key={idx} className="chip chip-outline">{inf}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* My Bands */}
            <section className="profile-section">
                <div className="profile-section-header">
                    <h2 className="profile-section-title">
                        <Users size={18} />
                        הלהקות שלי
                    </h2>
                </div>
                {myBands.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <p className="text-secondary mb-md">עוד לא חלק מלהקה</p>
                        <button className="btn btn-primary btn-sm" onClick={() => navigate('/requests')}>
                            חפש הרכב
                        </button>
                    </div>
                ) : (
                    <div className="profile-bands">
                        {myBands.map(band => {
                            const myMembership = band.members.find(m => m.userId === user.id);
                            return (
                                <div
                                    key={band.id}
                                    className="profile-band-item"
                                    onClick={() => navigate(`/bands/${band.id}`)}
                                >
                                    {band.coverImageUrl ? (
                                        <img src={band.coverImageUrl} alt={band.name} className="profile-band-avatar" />
                                    ) : (
                                        <div className="profile-band-avatar flex-center" style={{ fontSize: '1.5rem' }}>
                                            🎸
                                        </div>
                                    )}
                                    <div className="profile-band-info">
                                        <div className="profile-band-name">{band.name || 'להקה'}</div>
                                        <div className="profile-band-role">
                                            {getInstrumentIcon(myMembership?.instrumentId || '')} {getInstrumentName(myMembership?.instrumentId || '')}
                                            {myMembership?.isLeader && ' • מנהל'}
                                        </div>
                                    </div>
                                    <ChevronLeft size={20} color="var(--color-text-muted)" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* My Events */}
            {myEvents.length > 0 && (
                <section className="profile-section">
                    <div className="profile-section-header">
                        <h2 className="profile-section-title">
                            <Calendar size={18} />
                            האירועים שלי
                        </h2>
                    </div>
                    <div className="profile-events">
                        {myEvents.map(event => {
                            const dateInfo = formatEventDate(event.dateTime);
                            return (
                                <div
                                    key={event.id}
                                    className="profile-event-item"
                                    onClick={() => navigate(`/events/${event.id}`)}
                                >
                                    <div className="profile-event-date">
                                        <div className="profile-event-day">{dateInfo.day}</div>
                                        <div className="profile-event-month">{dateInfo.month}</div>
                                    </div>
                                    <div className="profile-event-info">
                                        <div className="profile-event-title">{event.title}</div>
                                        <div className="profile-event-location">{event.location}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Actions */}
            <div className="profile-actions">
                <button className="profile-action-btn" onClick={() => navigate('/profile/edit')}>
                    <Edit3 size={18} />
                    <span>ערוך פרופיל</span>
                </button>

                {isAdmin && (
                    <button className="profile-action-btn" onClick={() => navigate('/admin')}>
                        <Settings size={18} />
                        <span>ניהול מערכת</span>
                    </button>
                )}

                <button className="profile-action-btn danger" onClick={handleSignOut}>
                    <LogOut size={18} />
                    <span>התנתקות</span>
                </button>
            </div>

            <ExtendedProfileWizard
                isOpen={showWizard}
                onClose={() => setShowWizard(false)}
                onComplete={() => {
                    setShowWizard(false);
                    // Force reload or just let context update handle it
                }}
            />
        </div>
    );
}
