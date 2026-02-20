
// ============================================
// bandgo - Band Details Page (Public Profile)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    MapPin,
    Music,
    Users,
    Settings,
    Target,
    Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import type { Band, User } from '../../types';
import { getGenreName, getInstrumentName, getRoleName } from '../../utils';
import './Bands.css';
import './BandDetails.css';
import { BandProgress } from '../../components/bands/BandProgress';

export function BandDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [band, setBand] = useState<Band | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview'>('overview');

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (bandId: string) => {
        try {
            setLoading(true);
            const [bandsData, usersData] = await Promise.all([
                repository.getBands(),
                repository.getAllUsers(),
            ]);

            const foundBand = bandsData.find(b => b.id === bandId);

            if (foundBand) {
                setBand(foundBand);
                const usersMap: Record<string, User> = {};
                usersData.forEach(u => { usersMap[u.id] = u; });
                setUsers(usersMap);
            } else {
                showToast('הלהקה לא נמצאה', 'error');
                navigate('/bands');
            }
        } catch (error) {
            console.error('Failed to load band details:', error);
            showToast('שגיאה בטעינת פרטי הלהקה', 'error');
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

    if (!band) return null;

    // Check if current user is a member
    const isMember = band.members.some(m => m.userId === user?.id) || user?.role === 'admin';

    return (
        <div className="page page-band-details">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate('/bands')}>
                <ArrowRight size={20} />
                <span>חזרה לאינדקס</span>
            </button>

            {/* Header with Cover Image */}
            <div className="band-detail-header">
                {band.coverImageUrl ? (
                    <img src={band.coverImageUrl} alt={band.name} className="band-cover-image" />
                ) : (
                    <div className="band-cover-placeholder">
                        <Music size={48} />
                    </div>
                )}
                <div className="band-header-overlay">
                    <h1 className="band-name">{band.name}</h1>
                    <div className="band-meta">
                        <span className="band-meta-item">
                            <MapPin size={14} />
                            {band.city}
                        </span>
                        <span className="band-meta-item">
                            <Users size={14} />
                            {band.members.length} חברים
                        </span>
                    </div>
                </div>
            </div>

            {/* Genres */}
            <div className="band-genres">
                {band.genres.map(genre => (
                    <span key={genre} className="genre-tag">{getGenreName(genre)}</span>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="band-actions">
                {isMember ? (
                    <button
                        className="btn btn-primary w-full md:w-auto flex items-center gap-2 justify-center"
                        onClick={() => navigate(`/bands/${id}/workspace`)}
                    >
                        <Shield size={18} />
                        כניסה לאזור ניהול (Workspace)
                    </button>
                ) : (
                    user && (
                        <button className="btn btn-outline secondary w-full md:w-auto" onClick={() => showToast('עוקב (בקרוב...)', 'success')}>
                            עקוב אחרי הלהקה
                        </button>
                    )
                )}
            </div>

            {/* Progress Bar (Public View) */}
            <div className="container" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="progress-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                    <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                        <span>התקדמות הלהקה</span>
                        <span>{Math.round(Math.min(100, (band.approvedRehearsalsCount / band.rehearsalGoal) * 100))}%</span>
                    </div>
                    <div className="progress-bar-bg" style={{ background: 'var(--bg-card)', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                            className="progress-bar-fill"
                            style={{
                                background: 'var(--primary-color)',
                                height: '100%',
                                width: `${Math.min(100, (band.approvedRehearsalsCount / band.rehearsalGoal) * 100)}%`,
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="overview-tab container">
                {/* Description */}
                <div className="section">
                    <h3 className="section-title">אודות</h3>
                    <p className="band-description">{band.description || 'אין תיאור זמין.'}</p>
                </div>

                {/* Targeting Info */}
                {(band.commitmentLevel || band.rehearsalFrequency || band.targetAgeRange) && (
                    <div className="section targeting-section">
                        <h3 className="section-title">
                            <Target size={18} />
                            פרופיל
                        </h3>
                        <div className="targeting-grid">
                            {band.commitmentLevel && (
                                <div className="targeting-item">
                                    <span className="label">מחויבות:</span>
                                    <span className="value">
                                        {band.commitmentLevel === 'hobby' && 'תחביב 🍻'}
                                        {band.commitmentLevel === 'intermediate' && 'רציני 🎸'}
                                        {band.commitmentLevel === 'professional' && 'מקצועי 🏆'}
                                    </span>
                                </div>
                            )}
                            {band.rehearsalFrequency && (
                                <div className="targeting-item">
                                    <span className="label">תדירות:</span>
                                    <span className="value">{band.rehearsalFrequency}</span>
                                </div>
                            )}
                            {band.targetAgeRange && (
                                <div className="targeting-item">
                                    <span className="label">גילאים:</span>
                                    <span className="value">{band.targetAgeRange.min} - {band.targetAgeRange.max}</span>
                                </div>
                            )}
                            {band.influences && band.influences.length > 0 && (
                                <div className="targeting-item full-width">
                                    <span className="label">השפעות:</span>
                                    <div className="flex flex-wrap gap-xs mt-xs">
                                        {band.influences.map((inf, i) => (
                                            <span key={i} className="chip chip-outline text-xs">{inf}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Members */}
                <div className="section">
                    <h3 className="section-title">חברי הלהקה</h3>
                    <div className="members-horizontal-list">
                        {band.members.map(member => {
                            const memberUser = users[member.userId];
                            return (
                                <div
                                    key={member.userId}
                                    className="member-profile-card"
                                    onClick={() => navigate(`/profile/${member.userId}`)}
                                >
                                    <div className="member-avatar-wrapper">
                                        {memberUser?.avatarUrl ? (
                                            <img src={memberUser.avatarUrl} alt={memberUser.displayName} />
                                        ) : (
                                            <div className="avatar-placeholder">{memberUser?.displayName?.charAt(0) || '?'}</div>
                                        )}
                                        {member.isLeader && (
                                            <div className="leader-badge" title="מוביל">
                                                <Shield size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="member-name">{memberUser?.displayName || 'משתמש'}</div>
                                    <div className="member-role">
                                        {member.instruments && member.instruments.length > 0
                                            ? member.instruments.map(i => getInstrumentName(i)).join(', ')
                                            : member.roles && member.roles.length > 0
                                                ? member.roles.map(r => getRoleName(r)).join(', ')
                                                : getInstrumentName(member.instrumentId)
                                        }
                                        {/* Show roles if instruments are also present (or merged display) */}
                                        {member.instruments && member.instruments.length > 0 && member.roles && member.roles.length > 0 && (
                                            <span className="text-xs text-muted block">
                                                {member.roles.map(r => getRoleName(r)).join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div >
    );
}
