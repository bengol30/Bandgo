// ============================================
// bandgo - User Profile Page (Public View)
// Shows any user's public profile by userId
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Music, Users, Calendar, Mic } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { User, Band } from '../../types';
import { INSTRUMENTS, GENRES } from '../../data/constants';
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
            const user = await localRepository.getUser(id);
            if (!user) {
                showToast('המשתמש לא נמצא', 'error');
                navigate(-1);
                return;
            }
            setProfileUser(user);

            const bands = await localRepository.getMyBands(id);
            setUserBands(bands);
        } catch (error) {
            console.error('Failed to load user:', error);
            showToast('שגיאה בטעינת הפרופיל', 'error');
        } finally {
            setLoading(false);
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

    const getInstrumentLabel = (id: string) => {
        const inst = INSTRUMENTS.find(i => i.id === id);
        return inst ? `${inst.icon} ${inst.name}` : id;
    };

    const getGenreLabel = (id: string) => {
        const genre = GENRES.find(g => g.id === id);
        return genre ? genre.name : id;
    };

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

                    {profileUser.city && (
                        <div className="profile-location">
                            <MapPin size={16} />
                            <span>{profileUser.city}</span>
                        </div>
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
                        <div className="tags-list">
                            {profileUser.instruments.map(inst => (
                                <span key={inst.instrumentId} className="tag tag-primary">
                                    {getInstrumentLabel(inst.instrumentId)}
                                    {inst.level && <span className="tag-level"> • {inst.level}</span>}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* Genres */}
                {profileUser.genres && profileUser.genres.length > 0 && (
                    <section className="profile-section">
                        <h2>
                            <Mic size={20} />
                            ז'אנרים
                        </h2>
                        <div className="tags-list">
                            {profileUser.genres.map(g => (
                                <span key={g} className="tag tag-ghost">
                                    # {getGenreLabel(g)}
                                </span>
                            ))}
                        </div>
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
