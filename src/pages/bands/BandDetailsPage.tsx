// ============================================
// bandgo - Band Details Page
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    MapPin,
    Music,
    Users,
    Calendar,
    Check,
    Clock,
    MessageCircle,
    CalendarClock,
    Plus,
    Edit2,
    Trash2,
    Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SongList } from '../../components/songs/SongList';
import { ManageSongModal } from '../../components/songs/ManageSongModal';
import { BandSettingsModal } from '../../components/bands/BandSettingsModal';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import type { Band, User, Rehearsal, Song, PerformanceRequest, RehearsalPoll } from '../../types';
import { RehearsalStatus, PerformanceRequestStatus } from '../../types';
import { getGenreName, getInstrumentName, formatDate } from '../../utils';
import './Bands.css';
import './BandDetails.css';
import { CreatePollModal } from '../../components/rehearsals/CreatePollModal';
import { PollCard } from '../../components/rehearsals/PollCard';
import { BandProgress } from '../../components/bands/BandProgress';

export function BandDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [band, setBand] = useState<Band | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);
    const [performanceRequest, setPerformanceRequest] = useState<PerformanceRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'rehearsals' | 'songs'>('overview');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [polls, setPolls] = useState<RehearsalPoll[]>([]);
    const [showCreatePollModal, setShowCreatePollModal] = useState(false);

    // Song Management State
    const [showSongModal, setShowSongModal] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null);
    const [savingSong, setSavingSong] = useState(false);

    useEffect(() => {
        if (id) {
            loadData(id);
        }
    }, [id]);

    const loadData = async (bandId: string) => {
        try {
            setLoading(true);
            const [bandsData, usersData, rehearsalsData, songsData, perfReqData, pollsData] = await Promise.all([
                localRepository.getBands(),
                localRepository.getAllUsers(),
                localRepository.getRehearsals(bandId),
                localRepository.getSongs(bandId),
                localRepository.getPerformanceRequest(bandId),
                localRepository.getRehearsalPolls(bandId),
            ]);

            const foundBand = bandsData.find(b => b.id === bandId);

            if (foundBand) {
                setBand(foundBand);
                setRehearsals(rehearsalsData);
                setSongs(songsData);
                setPerformanceRequest(perfReqData);
                setPolls(pollsData);
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

    const getRequestStatusLabel = (status: PerformanceRequestStatus) => {
        switch (status) {
            case PerformanceRequestStatus.SUBMITTED: return 'נשלחה';
            case PerformanceRequestStatus.IN_REVIEW: return 'בבדיקה';
            case PerformanceRequestStatus.APPROVED: return 'אושרה!';
            case PerformanceRequestStatus.REJECTED: return 'נדחתה';
            case PerformanceRequestStatus.NEEDS_CHANGES: return 'נדרש תיקון';
            default: return status;
        }
    };

    const handleRequestPerformance = async () => {
        if (!band || !user) return;
        if (!confirm('האם אתה בטוח שברצונך להגיש בקשה להופעה? הלהקה עמדה ביעד החזרות!')) return;

        try {
            const notes = prompt('הערות לבקשה (אופציונלי):');

            await localRepository.createPerformanceRequest({
                bandId: band.id,
                preferredDateRange: {
                    start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // In 30 days
                    end: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),   // Bandwidth of 30 days
                },
                setDurationMinutes: 45, // Default set
                notes: notes || undefined,
                status: PerformanceRequestStatus.SUBMITTED,
                createdBy: user.id
            } as any);

            showToast('הבקשה הוגשה בהצלחה!', 'success');
            loadData(band.id); // Reload to see the status
        } catch (error) {
            console.error('Failed to request performance:', error);
            showToast('שגיאה בהגשת הבקשה', 'error');
        }
    };

    const handleSaveSong = async (songData: Partial<Song>) => {
        if (!band) return;
        try {
            setSavingSong(true);

            // Validate title
            if (!songData.title?.trim()) {
                showToast('שם השיר הוא שדה חובה', 'error');
                return;
            }

            if (editingSong) {
                const updated = await localRepository.updateSong(editingSong.id, songData);
                setSongs(songs.map(s => s.id === updated.id ? updated : s));
                showToast('השיר עודכן בהצלחה', 'success');
            } else {
                // Ensure required fields for creation
                const newSong = await localRepository.createSong({
                    bandId: band.id,
                    title: songData.title!, // Validated above
                    lyrics: songData.lyrics,
                    chords: songData.chords,
                    bpm: songData.bpm,
                    key: songData.key,
                    notes: songData.notes,
                    structure: songData.structure,
                    audioFiles: [],
                    createdBy: user?.id || 'system',
                });
                setSongs([...songs, newSong]);
                showToast('השיר נוסף בהצלחה', 'success');
            }
            setShowSongModal(false);
            setEditingSong(null);
        } catch (error) {
            console.error('Failed to save song:', error);
            showToast('שגיאה בשמירת השיר', 'error');
        } finally {
            setSavingSong(false);
        }
    };

    const handleDeleteSong = async (songId: string) => {
        try {
            await localRepository.deleteSong(songId);
            setSongs(songs.filter(s => s.id !== songId));
            showToast('השיר נמחק', 'success');
        } catch (error) {
            console.error('Failed to delete song:', error);
            showToast('שגיאה במחיקת השיר', 'error');
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



    return (
        <div className="page page-band-details">
            {/* Back Button */}
            <button className="back-button" onClick={() => navigate(-1)}>
                <ArrowRight size={20} />
                <span>חזרה</span>
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
                <button
                    className="action-btn action-btn-primary"
                    onClick={() => navigate(`/bands/${id}/chat`)}
                >
                    <MessageCircle size={18} />
                    צ'אט הלהקה
                </button>
                <button
                    className="action-btn action-btn-secondary"
                    onClick={() => navigate(`/bands/${id}/schedule`)}
                >
                    <CalendarClock size={18} />
                    תיאום חזרות
                </button>
                <button
                    className="action-btn action-btn-secondary"
                    onClick={() => setShowSettingsModal(true)}
                >
                    <Settings size={18} />
                    הגדרות
                </button>
            </div>

            {/* Progress Bar */}
            {/* Progress Bar */}
            <div className="container" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <BandProgress band={band} />
            </div>

            {/* Tabs */}
            <div className="band-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    סקירה כללית
                </button>
                <button
                    className={`tab-button ${activeTab === 'rehearsals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rehearsals')}
                >
                    חזרות
                </button>
                <button
                    className={`tab-button ${activeTab === 'songs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('songs')}
                >
                    שירים
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'overview' && (
                    <div className="overview-tab">
                        {/* Description */}
                        <div className="section">
                            <h3 className="section-title">אודות</h3>
                            <p className="band-description">{band.description}</p>
                        </div>

                        {/* Progress Section */}
                        <div className="section progress-section">
                            <h3 className="section-title">הדרך להופעה</h3>
                            <div className="progress-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-lg)' }}>
                                <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                    <span>חזרות שאושרו</span>
                                    <span>{band.approvedRehearsalsCount} / {band.rehearsalGoal}</span>
                                </div>
                                <div className="progress-bar-bg" style={{ background: 'var(--bg-card)', width: '100%', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            background: 'var(--primary-color)',
                                            height: '100%',
                                            width: `${Math.min(100, (band.approvedRehearsalsCount / band.rehearsalGoal) * 100)}%`,
                                            transition: 'width 0.5s ease'
                                        }}
                                    ></div>
                                </div>

                                <div className="progress-actions">
                                    {performanceRequest ? (
                                        <div className={`status-badge ${performanceRequest.status.toLowerCase()}`} style={{
                                            display: 'inline-flex', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 500,
                                            background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary-color)'
                                        }}>
                                            סטטוס בקשה: {getRequestStatusLabel(performanceRequest.status)}
                                        </div>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            style={{ width: '100%' }}
                                            disabled={band.approvedRehearsalsCount < band.rehearsalGoal}
                                            onClick={handleRequestPerformance}
                                        >
                                            הגש בקשה להופעה
                                            {band.approvedRehearsalsCount < band.rehearsalGoal && ` (חסרות ${band.rehearsalGoal - band.approvedRehearsalsCount} חזרות)`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Members */}
                        <div className="section">
                            <h3 className="section-title">חברי הלהקה</h3>
                            <div className="members-list">
                                {band.members.map(member => {
                                    const memberUser = users[member.userId];
                                    return (
                                        <div key={member.userId} className="member-item">
                                            <div className="member-avatar">
                                                {memberUser?.avatarUrl ? (
                                                    <img src={memberUser.avatarUrl} alt={memberUser.displayName} />
                                                ) : (
                                                    <div className="avatar-placeholder">{memberUser?.displayName?.charAt(0) || '?'}</div>
                                                )}
                                            </div>
                                            <div className="member-info">
                                                <span className="member-name">
                                                    {memberUser?.displayName || 'משתמש'}
                                                    {member.isLeader && <span className="leader-badge">מוביל</span>}
                                                </span>
                                                <span className="member-instrument">{getInstrumentName(member.instrumentId)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'rehearsals' && (
                    <div className="rehearsals-tab">
                        <div className="tab-actions mb-4" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button
                                className="action-btn action-btn-primary"
                                onClick={() => setShowCreatePollModal(true)}
                            >
                                <Plus size={16} />
                                תאם חזרה חדשה
                            </button>
                        </div>

                        {polls.length > 0 && (
                            <div className="polls-section mb-xl">
                                <h3 className="section-title text-accent mb-md" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>הצבעות פתוחות</h3>
                                {polls.map(poll => (
                                    <PollCard
                                        key={poll.id}
                                        poll={poll}
                                        usersMap={users}
                                        bandMembers={band.members}
                                        onVote={() => loadData(id!)}
                                        isLeader={band.members.find(m => m.userId === user?.id)?.isLeader || false}
                                    />
                                ))}
                                <div className="divider"></div>
                            </div>
                        )}

                        {rehearsals.length === 0 && polls.length === 0 ? (
                            <div className="empty-state">
                                <Calendar size={48} />
                                <p>אין חזרות מתוזמנות</p>
                            </div>
                        ) : (
                            <div className="rehearsals-list">
                                {rehearsals.length > 0 && <h3 className="section-title mb-md" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>חזרות שנקבעו</h3>}
                                {rehearsals.map(rehearsal => (
                                    <div key={rehearsal.id} className={`rehearsal-item ${rehearsal.status}`}>
                                        <div className="rehearsal-status-icon">
                                            {rehearsal.status === RehearsalStatus.APPROVED ? (
                                                <Check className="status-approved" />
                                            ) : (
                                                <Clock className="status-pending" />
                                            )}
                                        </div>
                                        <div className="rehearsal-info">
                                            <span className="rehearsal-date">{formatDate(rehearsal.dateTime)}</span>
                                            <span className="rehearsal-location">{rehearsal.location}</span>
                                        </div>
                                        <span className={`rehearsal-status-badge ${rehearsal.status}`}>
                                            {rehearsal.status === RehearsalStatus.APPROVED ? 'אושרה' :
                                                rehearsal.status === RehearsalStatus.SCHEDULED ? 'מתוכננת' : 'בוטלה'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'songs' && (
                    <div className="songs-tab">
                        <div className="tab-actions mb-4" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                            <button
                                className="action-btn action-btn-primary"
                                onClick={() => {
                                    setEditingSong(null);
                                    setShowSongModal(true);
                                }}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                            >
                                <Plus size={16} />
                                הוסף שיר חדש
                            </button>
                        </div>

                        <SongList
                            songs={songs}
                            onEdit={(song) => {
                                setEditingSong(song);
                                setShowSongModal(true);
                            }}
                            onDelete={handleDeleteSong}
                        />
                    </div>
                )}
            </div>


            {/* Settings Modal */}
            {band && (
                <BandSettingsModal
                    band={band}
                    usersMap={users}
                    isOpen={showSettingsModal}
                    onClose={() => setShowSettingsModal(false)}
                    onBandUpdated={(updatedBand) => {
                        setBand(updatedBand);
                    }}
                />
            )}

            <ManageSongModal
                isOpen={showSongModal}
                onClose={() => {
                    setShowSongModal(false);
                    setEditingSong(null);
                }}
                onSave={handleSaveSong}
                initialData={editingSong}
                saving={savingSong}
            />

            {band && (
                <CreatePollModal
                    isOpen={showCreatePollModal}
                    onClose={() => setShowCreatePollModal(false)}
                    bandId={band.id}
                    onPollCreated={() => loadData(band.id)}
                />
            )}
        </div >
    );
}
