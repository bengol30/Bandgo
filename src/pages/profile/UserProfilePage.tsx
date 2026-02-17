// ============================================
// bandgo - User Profile Page (Public View)
// Shows any user's public profile by userId
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    MapPin,
    Music,
    Users,
    Mic,
    Phone,
    Instagram,
    Globe,
    Search,
    PenTool,
    Clock,
    MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { User, Band } from '../../types';
import { INSTRUMENTS, GENRES, REGIONS } from '../../data/constants';
import './Profile.css';

export function UserProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [userBands, setUserBands] = useState<Band[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            // If viewing own profile, redirect to /profile
            if (currentUser?.id === userId) {
                navigate('/profile', { replace: true });
                return;
            }
            loadUser(userId);
        }
    }, [userId, currentUser]);

    const loadUser = async (id: string) => {
        try {
            setLoading(true);
            const user = await repository.getUser(id);
            if (!user) {
                showToast('המשתמש לא נמצא', 'error');
                navigate(-1);
                return;
            }
            setProfileUser(user);

            const bands = await repository.getMyBands(id);
            setUserBands(bands);
        } catch (error) {
            console.error('Failed to load user:', error);
            showToast('שגיאה בטעינת הפרופיל', 'error');
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

    const getRegionName = (id: string): string => {
        const region = REGIONS.find(r => r.id === id);
        return region?.nameHe || id;
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

    const handleSendMessage = async () => {
        if (!currentUser || !profileUser) return;
        try {
            const conversation = await repository.getOrCreateConversation(profileUser.id);
            navigate(`/messages/${conversation.id}`);
        } catch (error) {
            showToast('שגיאה בפתיחת שיחה', 'error');
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!profileUser) return null;

    return (
        <div className="page page-profile">
            <div className="profile-hero">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowRight />
                </button>

                <div className="profile-avatar-section">
                    <div className="profile-avatar profile-avatar-lg">
                        {profileUser.avatarUrl ? (
                            <img src={profileUser.avatarUrl} alt={profileUser.displayName} />
                        ) : (
                            <div className="avatar-placeholder-lg">{profileUser.displayName[0]}</div>
                        )}
                    </div>

                    <h1 className="profile-name">{profileUser.displayName}</h1>

                    {(profileUser.city || profileUser.region) && (
                        <div className="profile-location">
                            <MapPin size={16} />
                            <span>
                                {profileUser.city}{profileUser.city && profileUser.region ? ', ' : ''}{profileUser.region ? getRegionName(profileUser.region) : ''}
                            </span>
                        </div>
                    )}

                    {profileUser.bio && <p className="profile-bio">{profileUser.bio}</p>}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-sm mt-md justify-center">
                        {profileUser.searchStatus && (
                            <div className="badge badge-primary flex items-center gap-xs">
                                <Search size={14} />
                                <span>
                                    {profileUser.searchStatus === 'looking' && 'מחפש הרכב'}
                                    {profileUser.searchStatus === 'available_for_jams' && 'זמין לג\'אמים'}
                                    {profileUser.searchStatus === 'not_looking' && 'לא מחפש כרגע'}
                                </span>
                            </div>
                        )}

                        {profileUser.isVocalist && (
                            <div className="badge badge-primary flex items-center gap-xs">
                                <Mic size={14} />
                                <span>זמר/ת</span>
                            </div>
                        )}

                        {profileUser.isSongwriter && (
                            <div className="badge badge-primary flex items-center gap-xs">
                                <PenTool size={14} />
                                <span>כותב/ת שירים</span>
                            </div>
                        )}
                    </div>

                    {/* Contact links */}
                    {profileUser.contactInfo && (
                        <div className="flex gap-sm mt-sm justify-center">
                            {profileUser.contactInfo.whatsapp && (
                                <a href={`https://wa.me/${profileUser.contactInfo.whatsapp}`} target="_blank" rel="noreferrer" className="btn-icon btn-ghost text-success">
                                    <Phone size={20} />
                                </a>
                            )}
                            {profileUser.contactInfo.instagram && (
                                <a href={`https://instagram.com/${profileUser.contactInfo.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="btn-icon btn-ghost text-accent">
                                    <Instagram size={20} />
                                </a>
                            )}
                            {profileUser.contactInfo.tiktok && (
                                <a href={`https://tiktok.com/@${profileUser.contactInfo.tiktok.replace('@', '')}`} target="_blank" rel="noreferrer" className="btn-icon btn-ghost">
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>♪</span>
                                </a>
                            )}
                            {profileUser.contactInfo.website && (
                                <a href={profileUser.contactInfo.website} target="_blank" rel="noreferrer" className="btn-icon btn-ghost">
                                    <Globe size={20} />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Availability */}
                    {profileUser.availabilityDays && (
                        <div className="flex items-center gap-xs mt-sm justify-center text-muted" style={{ fontSize: '0.85rem' }}>
                            <Clock size={14} />
                            <span>{profileUser.availabilityDays}</span>
                        </div>
                    )}

                    {/* Send message button */}
                    {currentUser && currentUser.id !== profileUser.id && (
                        <button className="btn btn-primary btn-sm mt-md" onClick={handleSendMessage}>
                            <MessageCircle size={16} />
                            <span>שלח הודעה</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="container profile-content" style={{ paddingBottom: '120px' }}>
                {/* Instruments */}
                {profileUser.instruments && profileUser.instruments.length > 0 && (
                    <section className="profile-section">
                        <h2>
                            <Music size={20} />
                            כלים
                        </h2>
                        <div className="profile-instruments">
                            {profileUser.instruments.map((inst, idx) => (
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
                        </div>
                    </section>
                )}

                {/* Genres */}
                {profileUser.genres && profileUser.genres.length > 0 && (
                    <section className="profile-section">
                        <h2>
                            <Mic size={20} />
                            סגנונות
                        </h2>
                        <div className="profile-genres">
                            {profileUser.genres.map(genreId => (
                                <span key={genreId} className="chip">
                                    {getGenreName(genreId)}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Gear & Influences */}
                {(profileUser.gear || (profileUser.influences && profileUser.influences.length > 0)) && (
                    <section className="profile-section">
                        <div className="profile-section-header">
                            <h2 className="profile-section-title">מידע נוסף</h2>
                        </div>

                        {profileUser.gear && (
                            <div className="mb-md">
                                <h3 className="text-sm font-bold text-muted mb-xs">ציוד</h3>
                                <p className="text-sm">{profileUser.gear}</p>
                            </div>
                        )}

                        {profileUser.influences && profileUser.influences.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-muted mb-xs">השפעות</h3>
                                <div className="flex flex-wrap gap-xs">
                                    {profileUser.influences.map((inf, idx) => (
                                        <span key={idx} className="chip chip-outline">{inf}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Bands */}
                {userBands.length > 0 && (
                    <section className="profile-section">
                        <h2>
                            <Users size={20} />
                            להקות ({userBands.length})
                        </h2>
                        <div className="profile-bands-list">
                            {userBands.map(band => (
                                <div
                                    key={band.id}
                                    className="profile-band-card"
                                    onClick={() => navigate(`/bands/${band.id}`)}
                                >
                                    <div className="band-card-cover">
                                        {band.coverImageUrl ? (
                                            <img src={band.coverImageUrl} alt={band.name} />
                                        ) : (
                                            <div className="cover-placeholder">
                                                <Music size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="band-card-info">
                                        <h3>{band.name}</h3>
                                        <span className="text-secondary text-sm">
                                            {band.members.length} חברים
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
