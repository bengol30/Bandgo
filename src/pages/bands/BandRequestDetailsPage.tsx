// ============================================
// bandgo - Band Request Details Page
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Share2,
    MapPin,
    Calendar,
    Users,
    Music,
    Mic2,
    Check,
    X,
    AlertCircle,
    UserPlus,
    UserMinus,
    Clock,
    Zap,
    ExternalLink,
    Play
} from 'lucide-react';
import { ApplicationStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { BandRequest, User, BandRequestType, BandApplication, BandRequestStatus } from '../../types';
import { getInstrumentName, getInstrumentIcon, getGenreName, formatTimeAgo } from '../../utils';
import './BandRequestDetails.css';

export function BandRequestDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [request, setRequest] = useState<BandRequest | null>(null);
    const [creator, setCreator] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [applicationMessage, setApplicationMessage] = useState('');
    const [selectedInstrument, setSelectedInstrument] = useState('');
    const [hasApplied, setHasApplied] = useState(false);

    // Application management state (for creator)
    const [applications, setApplications] = useState<BandApplication[]>([]);
    const [applicantUsers, setApplicantUsers] = useState<Record<string, User>>({});
    const [currentMembers, setCurrentMembers] = useState<User[]>([]);
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    // Band naming modal state
    const [showBandNameModal, setShowBandNameModal] = useState(false);
    const [bandName, setBandName] = useState('');
    const [isCreatingBand, setIsCreatingBand] = useState(false);

    useEffect(() => {
        if (id) {
            loadRequest(id);
        }
    }, [id]);

    const loadRequest = async (requestId: string) => {
        try {
            setLoading(true);
            const req = await repository.getBandRequest(requestId);
            if (!req) {
                showToast('ההרכב לא נמצא', 'error');
                navigate('/bands');
                return;
            }
            setRequest(req);

            // Load creator
            const creatorUser = await repository.getUser(req.creatorId);
            setCreator(creatorUser);

            // Check if already applied
            if (user) {
                const apps = await repository.getMyApplications(user.id);
                const existingApp = apps.find(a => a.bandRequestId === requestId);
                setHasApplied(!!existingApp);
            }

            // Load current members
            if (req.currentMembers && req.currentMembers.length > 0) {
                const members = await repository.getUsersByIds(req.currentMembers);
                setCurrentMembers(members);
            }

            // Load applications if creator
            if (user && user.id === req.creatorId) {
                const apps = await repository.getApplications(requestId);
                setApplications(apps);

                // Load applicant user info
                const allUsers = await repository.getAllUsers();
                const usersMap: Record<string, User> = {};
                allUsers.forEach((u: User) => { usersMap[u.id] = u; });
                setApplicantUsers(usersMap);
            }

        } catch (error) {
            console.error('Failed to load request:', error);
            showToast('שגיאה בטעינת פרטי ההרכב', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!user || !request) return;

        if (request.type === BandRequestType.TARGETED && !selectedInstrument) {
            showToast('נא לבחור כלי נגינה', 'error');
            return;
        }

        if (!applicationMessage.trim()) {
            showToast('נא לכתוב הודעה קצרה', 'error');
            return;
        }

        try {
            setApplying(true);
            await repository.createApplication({
                bandRequestId: request.id,
                applicantId: user.id,
                instrumentId: selectedInstrument || 'unknown',
                message: applicationMessage,
                status: ApplicationStatus.PENDING
            });

            showToast('הבקשה נשלחה בהצלחה!', 'success');
            setHasApplied(true);
            setApplicationMessage('');
        } catch (error) {
            showToast('שגיאה בשליחת הבקשה', 'error');
        } finally {
            setApplying(false);
        }
    };

    const handleReviewApplication = async (appId: string, status: 'approved' | 'rejected') => {
        try {
            setReviewingId(appId);
            await repository.reviewApplication(appId, status);
            showToast(
                status === 'approved' ? 'המועמד אושר בהצלחה! 🎉' : 'המועמדות נדחתה',
                status === 'approved' ? 'success' : 'info'
            );

            // Reload data after review
            if (id) {
                const req = await repository.getBandRequest(id);
                setRequest(req);
                const apps = await repository.getApplications(id);
                setApplications(apps);
            }
        } catch (error) {
            showToast('שגיאה בעדכון המועמדות', 'error');
        } finally {
            setReviewingId(null);
        }
    };

    const handleConvertToBand = async () => {
        if (!request || isCreatingBand) return;
        const finalName = bandName.trim() || request.title;
        try {
            setIsCreatingBand(true);
            const newBand = await repository.formBand(request.id, finalName);
            showToast('מזל טוב! הלהקה נוצרה בהצלחה 🎉', 'success');
            setShowBandNameModal(false);
            navigate(`/bands/${newBand.id}/workspace`);
        } catch (e) {
            console.error('Failed to form band:', e);
            showToast('שגיאה ביצירת הלהקה', 'error');
        } finally {
            setIsCreatingBand(false);
        }
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!request || !creator) return null;

    const isCreator = user?.id === request.creatorId;
    const isClosed = request.status === BandRequestStatus.CLOSED || request.status === BandRequestStatus.FORMED;
    const pendingApps = applications.filter(a => a.status === ApplicationStatus.PENDING);
    const reviewedApps = applications.filter(a => a.status !== ApplicationStatus.PENDING);
    const canConvert = (request.currentMembers?.length || 0) >= 1;

    return (
        <div className="page page-request-details">
            {/* Header Image / Pattern */}
            <div className="details-hero">
                <div className="details-hero-content">
                    <div className="hero-actions">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft />
                        </button>
                        <button className="share-btn" onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('הקישור הועתק ללוח! 📋', 'success');
                        }} title="שתף הרכב">
                            <Share2 />
                        </button>
                    </div>
                    <div className="hero-tags">
                        <span className="badge badge-accent">
                            {request.type === BandRequestType.TARGETED ? 'חיפוש ממוקד' : 'הרכב פתוח'}
                        </span>
                        <span className="badge badge-ghost">{request.city}</span>
                        {isClosed && (
                            <span className="badge" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-success)' }}>
                                הפך ללהקה ✅
                            </span>
                        )}
                    </div>
                    <h1 className="hero-title">{request.title}</h1>
                    <div className="hero-meta">
                        <span>פורסם {formatTimeAgo(request.createdAt)}</span>
                        <span>•</span>
                        <span>ע"י {creator.displayName}</span>
                    </div>
                </div>
            </div>

            <div className="container details-content">
                <div className="details-grid">
                    {/* Main Info */}
                    <div className="details-main">

                        {/* Closed Banner */}
                        {isClosed && !isCreator && (
                            <div className="applied-banner" style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <Check size={24} />
                                <div>
                                    <h3>הרכב זה הפך ללהקה!</h3>
                                    <p>ההרכב כבר התגבש ולא ניתן להגיש מועמדות.</p>
                                </div>
                            </div>
                        )}

                        {/* Creator Management Section */}
                        {isCreator && request.status === 'open' && (
                            <section className="details-section management-section">
                                <div className="management-header">
                                    <h2>ניהול הרכב</h2>
                                    <span className="badge badge-primary">אזור אישי</span>
                                </div>
                                <div className="management-actions">
                                    <div className="management-stats grid grid-cols-2 gap-4 mb-6">
                                        <div className="stat-box">
                                            <span className="text-2xl font-bold">{request.currentMembers.length}</span>
                                            <span className="text-sm text-secondary">חברים קיימים</span>
                                        </div>
                                        <div className="stat-box">
                                            <span className="text-2xl font-bold">
                                                {pendingApps.length}
                                            </span>
                                            <span className="text-sm text-secondary">ממתינים לאישור</span>
                                        </div>
                                    </div>

                                    {/* Applications Management */}
                                    {pendingApps.length > 0 && (
                                        <div className="applications-section">
                                            <h3 className="apps-section-title">
                                                <UserPlus size={18} />
                                                מועמדויות ממתינות ({pendingApps.length})
                                            </h3>
                                            <div className="applications-list">
                                                {pendingApps.map(app => {
                                                    const applicant = applicantUsers[app.applicantId];
                                                    return (
                                                        <div key={app.id} className="application-card">
                                                            <div className="app-user-info">
                                                                <div className="app-avatar">
                                                                    {applicant?.avatarUrl ? (
                                                                        <img src={applicant.avatarUrl} alt={applicant.displayName} />
                                                                    ) : (
                                                                        <div className="avatar-placeholder">{applicant?.displayName?.[0] || '?'}</div>
                                                                    )}
                                                                </div>
                                                                <div className="app-details">
                                                                    <h4>{applicant?.displayName || 'משתמש'}</h4>
                                                                    <span className="app-instrument">
                                                                        {getInstrumentIcon(app.instrumentId)} {getInstrumentName(app.instrumentId)}
                                                                    </span>
                                                                    <span className="app-city">{applicant?.city}</span>
                                                                </div>
                                                            </div>
                                                            {app.message && (
                                                                <p className="app-message">"{app.message}"</p>
                                                            )}
                                                            <div className="app-actions">
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={() => handleReviewApplication(app.id, 'approved')}
                                                                    disabled={reviewingId === app.id}
                                                                >
                                                                    <Check size={16} />
                                                                    {reviewingId === app.id ? 'מעדכן...' : 'אשר'}
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleReviewApplication(app.id, 'rejected')}
                                                                    disabled={reviewingId === app.id}
                                                                >
                                                                    <X size={16} />
                                                                    דחה
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Previously Reviewed */}
                                    {reviewedApps.length > 0 && (
                                        <div className="applications-section reviewed">
                                            <h3 className="apps-section-title">
                                                מועמדויות שטופלו ({reviewedApps.length})
                                            </h3>
                                            <div className="applications-list">
                                                {reviewedApps.map(app => {
                                                    const applicant = applicantUsers[app.applicantId];
                                                    const isApproved = app.status === ApplicationStatus.APPROVED;
                                                    return (
                                                        <div key={app.id} className={`application-card reviewed ${isApproved ? 'approved' : 'rejected'}`}>
                                                            <div className="app-user-info">
                                                                <div className="app-avatar">
                                                                    {applicant?.avatarUrl ? (
                                                                        <img src={applicant.avatarUrl} alt={applicant.displayName} />
                                                                    ) : (
                                                                        <div className="avatar-placeholder">{applicant?.displayName?.[0] || '?'}</div>
                                                                    )}
                                                                </div>
                                                                <div className="app-details">
                                                                    <h4>{applicant?.displayName || 'משתמש'}</h4>
                                                                    <span className="app-instrument">
                                                                        {getInstrumentIcon(app.instrumentId)} {getInstrumentName(app.instrumentId)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className={`app-status-badge ${isApproved ? 'approved' : 'rejected'}`}>
                                                                {isApproved ? '✅ אושר' : '❌ נדחה'}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {pendingApps.length === 0 && reviewedApps.length === 0 && (
                                        <div className="alert alert-info text-sm" style={{ marginTop: 'var(--spacing-md)' }}>
                                            עדיין לא הוגשו מועמדויות. שתף את ההרכב כדי למשוך נגנים!
                                        </div>
                                    )}

                                    {/* Convert to Band Button */}
                                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                        {canConvert ? (
                                            <button
                                                className="btn btn-primary w-full"
                                                onClick={() => {
                                                    setBandName(request.title || '');
                                                    setShowBandNameModal(true);
                                                }}
                                            >
                                                הפוך ללהקה והתחל חזרות 🎸
                                            </button>
                                        ) : (
                                            <div className="alert alert-info text-sm">
                                                כדי להפוך ללהקה, עליך לאשר לפחות חבר אחד נוסף.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}
                        {/* Members List (Public) */}
                        <section className="details-section members-section">
                            <div className="section-header">
                                <h2>
                                    <Users size={20} />
                                    חברי ההרכב {currentMembers.length > 0 && `(${currentMembers.length})`}
                                </h2>
                            </div>
                            {currentMembers.length > 0 ? (
                                <div className="members-horizontal-list">
                                    {currentMembers.map(member => (
                                        <div
                                            key={member.id}
                                            className="member-profile-card"
                                            onClick={() => navigate(`/profile/${member.id}`)}
                                        >
                                            <div className="member-avatar-wrapper">
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt={member.displayName} />
                                                ) : (
                                                    <div className="avatar-placeholder">{member.displayName[0]}</div>
                                                )}
                                                {member.id === request.creatorId && (
                                                    <div className="leader-badge" title="מנהל ההרכב">
                                                        <Zap size={10} fill="currentColor" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="member-name">{member.displayName}</div>
                                            <div className="member-role">
                                                {member.id === request.creatorId ? 'מנהל' : 'חבר'}
                                            </div>
                                        </div>
                                    ))}
                                    {!isClosed && (
                                        <div className="member-profile-card placeholder">
                                            <div className="member-avatar-wrapper empty">
                                                <UserPlus size={20} />
                                            </div>
                                            <div className="member-name">מקום פנוי</div>
                                            <div className="member-role">מחכים לך</div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="empty-members-state">
                                    <Users size={24} />
                                    <p>עדיין אין חברים מאושרים. היה הראשון להצטרף!</p>
                                </div>
                            )}
                        </section>

                        <section className="details-section">
                            <h2>על הפרויקט</h2>
                            <p className="description-text">{request.description}</p>

                            <div className="genres-list">
                                {request.genres.map(g => (
                                    <span key={g} className="genre-tag">
                                        # {getGenreName(g)}
                                    </span>
                                ))}
                            </div>

                            {/* Influences */}
                            {request.influences && request.influences.length > 0 && (
                                <div className="influences-section">
                                    <h3>השראות מוזיקליות</h3>
                                    <div className="influences-list">
                                        {request.influences.map((inf, i) => (
                                            <span key={i} className="influence-tag">
                                                <Music size={12} />
                                                {inf}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Media / Sketches */}
                            {(request.sketches?.length > 0 || request.sketchPending) && (
                                <div className="media-section">
                                    <h3>סקיצות והקלטות</h3>
                                    {request.sketches?.length > 0 ? (
                                        <div className="media-grid">
                                            {request.sketches.map(media => (
                                                <div key={media.id} className="media-item">
                                                    <div className="media-icon-wrapper">
                                                        {media.type === 'audio' ? <Mic2 size={24} /> : <Play size={24} />}
                                                    </div>
                                                    <div className="media-info">
                                                        <h4>{media.name}</h4>
                                                        <a href={media.url} target="_blank" rel="noopener noreferrer" className="media-link">
                                                            <ExternalLink size={14} />
                                                            <span>נגן סקיצה</span>
                                                        </a>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-media-state">
                                            <AlertCircle size={20} />
                                            <span>טרם הועלו סקיצות, אך ניתן לפנות ליוצר לקבלת חומרים.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* Slots */}
                        {request.type === BandRequestType.TARGETED && (
                            <section className="details-section">
                                <h2>מי דרוש לנו?</h2>
                                <div className="slots-grid">
                                    {request.instrumentSlots?.map((slot, idx) => {
                                        const filled = slot.filledBy.length;
                                        const total = slot.quantity;
                                        const isFull = filled >= total;

                                        const isSelected = selectedInstrument === slot.instrumentId;

                                        return (
                                            <div
                                                key={idx}
                                                className={`slot-card ${isFull ? 'filled' : 'open'} ${isSelected ? 'selected' : ''}`}
                                                onClick={() => !isFull && !isCreator && !hasApplied && !isClosed && setSelectedInstrument(slot.instrumentId)}
                                                style={{ cursor: !isFull && !isCreator && !hasApplied && !isClosed ? 'pointer' : 'default' }}
                                            >
                                                <div className="slot-icon-wrapper">
                                                    <span className="slot-icon-lg">{getInstrumentIcon(slot.instrumentId)}</span>
                                                    {isSelected && (
                                                        <div className="slot-selected-badge">
                                                            <Check size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="slot-info">
                                                    <h3>{getInstrumentName(slot.instrumentId)}</h3>
                                                    <div className="slot-status">
                                                        {isFull ? (
                                                            <span className="status-filled"><Check size={14} /> מאויש</span>
                                                        ) : (
                                                            <span className="status-open">{filled}/{total} תפוסים</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isFull && !isCreator && !hasApplied && !isClosed && (
                                                    <button
                                                        className={`btn-apply-slot ${isSelected ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedInstrument(slot.instrumentId);
                                                        }}
                                                    >
                                                        {isSelected ? (
                                                            <><Check size={16} /> נבחר</>
                                                        ) : (
                                                            'אני מנגן!'
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Application Form - Only if not closed */}
                        {!isCreator && !hasApplied && !isClosed && (
                            <section className="details-section apply-section">
                                <h2>מעוניין להצטרף?</h2>
                                <div className="apply-form">
                                    <textarea
                                        className="form-textarea"
                                        placeholder="כתוב כמה מילים על עצמך ולמה בא לך להצטרף..."
                                        rows={3}
                                        value={applicationMessage}
                                        onChange={e => setApplicationMessage(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-primary btn-block"
                                        onClick={handleApply}
                                        disabled={applying}
                                    >
                                        {applying ? 'שולח...' : 'שלח בקשת הצטרפות'}
                                    </button>
                                </div>
                            </section>
                        )}

                        {hasApplied && (
                            <div className="applied-banner">
                                <Check size={24} />
                                <div>
                                    <h3>הבקשה נשלחה!</h3>
                                    <p>הודעה תישלח ל-{creator.displayName}. בהצלחה!</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="details-sidebar">
                        <div className="sidebar-card creator-card">
                            <h3>יוצר ההרכב</h3>
                            <div className="creator-profile" onClick={() => navigate(`/profile/${creator.id}`)}>
                                <div className="creator-avatar">
                                    {creator.avatarUrl ? (
                                        <img src={creator.avatarUrl} alt={creator.displayName} />
                                    ) : (
                                        <div className="avatar-placeholder">{creator.displayName[0]}</div>
                                    )}
                                </div>
                                <div className="creator-info">
                                    <h4>{creator.displayName}</h4>
                                    <p>{creator.city}</p>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-card info-card">
                            <div className="info-item">
                                <MapPin size={20} />
                                <div>
                                    <label>מיקום</label>
                                    <p>{request.city || 'לא צוין'}, {request.region}</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <Music size={20} />
                                <div>
                                    <label>חומר מקורי / קאברים</label>
                                    <div className="music-balance-container">
                                        <div className="music-balance-track">
                                            <div className="music-balance-labels">
                                                <span>קאברים</span>
                                                <span>מקורי</span>
                                            </div>
                                            <div
                                                className="music-balance-indicator"
                                                style={{ left: `${request.originalVsCoverRatio}%` }}
                                            >
                                                <div className="music-balance-arrow"></div>
                                            </div>
                                        </div>
                                        <p className="music-balance-value">{request.originalVsCoverRatio}% חומר מקורי</p>
                                    </div>
                                </div>
                            </div>

                            {request.commitmentLevel && (
                                <div className="info-item">
                                    <Zap size={20} />
                                    <div>
                                        <label>רמת מחויבות</label>
                                        <p>{request.commitmentLevel === 'hobby' ? 'תחביב (כיף)' :
                                            request.commitmentLevel === 'intermediate' ? 'רציני (חצי מקצועי)' :
                                                'מקצועי (קריירה)'}</p>
                                    </div>
                                </div>
                            )}

                            {request.rehearsalFrequency && (
                                <div className="info-item">
                                    <Clock size={20} />
                                    <div>
                                        <label>תדירות חזרות</label>
                                        <p>{request.rehearsalFrequency}</p>
                                    </div>
                                </div>
                            )}

                            {request.targetAgeRange && (
                                <div className="info-item">
                                    <Users size={20} />
                                    <div>
                                        <label>טווח גילאים</label>
                                        <p>{request.targetAgeRange.min} - {request.targetAgeRange.max}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>

            {/* Band Name Modal */}
            {showBandNameModal && (
                <div className="modal-overlay" onClick={() => !isCreatingBand && setShowBandNameModal(false)}>
                    <div className="modal-content band-name-modal" onClick={e => e.stopPropagation()}>
                        <h2>🎸 בחר שם ללהקה</h2>
                        <p className="text-secondary text-sm">בחר שם ויצא לדרך!</p>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="שם הלהקה..."
                            value={bandName}
                            onChange={e => setBandName(e.target.value)}
                            autoFocus
                            disabled={isCreatingBand}
                        />
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowBandNameModal(false)} disabled={isCreatingBand}>
                                ביטול
                            </button>
                            <button className="btn btn-primary" onClick={handleConvertToBand} disabled={isCreatingBand}>
                                {isCreatingBand ? 'יוצר...' : 'צור להקה! 🚀'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
