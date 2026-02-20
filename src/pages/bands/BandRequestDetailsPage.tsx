// ============================================
// bandgo - Band Request Details Page
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Share2, Users, Music, Mic2, Check, X,
    AlertCircle, MapPin, Calendar, Clock, Heart, MessageCircle,
    Edit2, Play, Pause, Plus, Trash2, Video, ExternalLink,
    Globe, Instagram, Facebook, Youtube, Save, Zap, Star,
    Sliders, Image as ImageIcon, UserPlus, UserMinus
} from 'lucide-react';
import { ApplicationStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { Modal } from '../../components/Modal';
import {
    BandRequest, User, BandRequestType, BandApplication,
    BandRequestStatus, BandCommitmentLevel, InstrumentSlot,
    SocialLink, RepertoireItem
} from '../../types';
import {
    getInstrumentName, getInstrumentIcon, getGenreName, formatTimeAgo, getRoleName
} from '../../utils';
import { INSTRUMENTS, GENRES, BAND_COVER_OPTIONS } from '../../data/constants';
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

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{
        title: string;
        description: string;
        city: string;
        genres: string[];
        socialLinks: SocialLink[];
        repertoire: RepertoireItem[];
        commitmentLevel: string;
        rehearsalFrequency: string;
        targetAgeMin: number;
        targetAgeMax: number;
        originalVsCoverRatio: number;
        influences: string[];
        instrumentSlots: InstrumentSlot[];
        coverImageUrl: string;
    }>({
        title: '',
        description: '',
        city: '',
        genres: [],
        socialLinks: [],
        repertoire: [],
        commitmentLevel: '',
        rehearsalFrequency: '',
        targetAgeMin: 18,
        targetAgeMax: 99,
        originalVsCoverRatio: 50,
        influences: [],
        instrumentSlots: [],
        coverImageUrl: ''
    });

    // Cover Image Edit State
    const [showCoverModal, setShowCoverModal] = useState(false);
    const [customCoverUrl, setCustomCoverUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);

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

    // Separate effect for loading user-specific data
    useEffect(() => {
        if (!user || !request) return;

        const loadUserData = async () => {
            // Check if applied
            if (!hasApplied) {
                const apps = await repository.getMyApplications(user.id);
                const existingApp = apps.find(a => a.bandRequestId === request.id);
                if (existingApp) setHasApplied(true);
            }

            // Load applications if creator (and haven't loaded yet or want to refresh)
            if (user.id === request.creatorId) {
                try {
                    const apps = await repository.getApplications(request.id);
                    setApplications(apps);

                    // Load applicant user info if needed
                    if (apps.length > 0) {
                        const applicantIds = apps.map(a => a.applicantId);
                        // Optimize: only fetch missing users
                        const missingIds = applicantIds.filter(id => !applicantUsers[id]);
                        if (missingIds.length > 0) {
                            const newUsers = await repository.getUsersByIds(missingIds);
                            setApplicantUsers(prev => {
                                const next = { ...prev };
                                newUsers.forEach(u => next[u.id] = u);
                                return next;
                            });
                        }
                    }
                } catch (err) {
                    console.error('Failed to load applications:', err);
                }
            }
        };

        loadUserData();
    }, [user, request?.id]); // Depend on user and request.id

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

            // Initialize edit form
            setEditForm({
                title: req.title || '',
                description: req.description || '',
                city: req.city || '',
                genres: req.genres || [],
                socialLinks: req.socialLinks || [],
                repertoire: req.repertoire || [],
                commitmentLevel: req.commitmentLevel || '',
                rehearsalFrequency: req.rehearsalFrequency || '',
                targetAgeMin: req.targetAgeRange?.min || 18,
                targetAgeMax: req.targetAgeRange?.max || 99,
                originalVsCoverRatio: req.originalVsCoverRatio ?? 50,
                influences: req.influences || [],
                instrumentSlots: req.instrumentSlots ? req.instrumentSlots.map(s => ({ ...s })) : [],
                coverImageUrl: req.coverImageUrl || ''
            });

            // Load creator
            const creatorUser = await repository.getUser(req.creatorId);
            setCreator(creatorUser);

            // Load current members
            if (req.currentMembers && req.currentMembers.length > 0) {
                const members = await repository.getUsersByIds(req.currentMembers);
                setCurrentMembers(members);
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
            console.error('Failed to send application:', error);
            showToast('שגיאה בשליחת הבקשה', 'error');
        } finally {
            setApplying(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!request) return;

        try {
            setLoading(true);

            let finalCoverUrl = editForm.coverImageUrl;

            // Upload image if file selected
            if (imageFile) {
                try {
                    const path = `bands/covers/${user?.id}_${Date.now()}_${imageFile.name}`;
                    // We assume repository.uploadFile exists as per CreateBandRequestPage
                    finalCoverUrl = await repository.uploadFile(imageFile, path);
                } catch (uploadError) {
                    console.error('Failed to upload cover image:', uploadError);
                    showToast('שגיאה בהעלאת התמונה', 'error');
                    setLoading(false);
                    return;
                }
            } else if (customCoverUrl) {
                finalCoverUrl = customCoverUrl;
            }

            await repository.updateBandRequest(request.id, {
                title: editForm.title,
                description: editForm.description,
                genres: editForm.genres,
                repertoire: editForm.repertoire,
                socialLinks: editForm.socialLinks,
                influences: editForm.influences,
                commitmentLevel: editForm.commitmentLevel as any,
                rehearsalFrequency: editForm.rehearsalFrequency,
                targetAgeRange: { min: editForm.targetAgeMin, max: editForm.targetAgeMax },
                originalVsCoverRatio: editForm.originalVsCoverRatio,
                instrumentSlots: editForm.instrumentSlots,
                coverImageUrl: finalCoverUrl
            });

            // Reload request to get updated data
            const updatedReq = await repository.getBandRequest(request.id);

            if (updatedReq) {
                setRequest(updatedReq);
                // Re-load members in case they changed
                if (updatedReq.currentMembers && updatedReq.currentMembers.length > 0) {
                    const members = await repository.getUsersByIds(updatedReq.currentMembers);
                    setCurrentMembers(members);
                } else {
                    setCurrentMembers([]);
                }
            }

            // Reset image file state
            setImageFile(null);
            setCustomCoverUrl('');

            setIsEditing(false);
            showToast('השינויים נשמרו בהצלחה!', 'success');
        } catch (error) {
            console.error('Failed to save changes:', error);
            showToast('שגיאה בשמירת השינויים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!request || memberId === request.creatorId) return;
        try {
            const updatedMembers = request.currentMembers.filter(id => id !== memberId);
            // Also update instrument slots - remove the user from filledBy
            const updatedSlots = request.instrumentSlots?.map(slot => ({
                ...slot,
                filledBy: slot.filledBy.filter(id => id !== memberId)
            }));
            await repository.updateBandRequest(request.id, {
                currentMembers: updatedMembers,
                instrumentSlots: updatedSlots
            });
            const updatedReq = await repository.getBandRequest(request.id);
            if (updatedReq) {
                setRequest(updatedReq);
                if (updatedReq.currentMembers.length > 0) {
                    const members = await repository.getUsersByIds(updatedReq.currentMembers);
                    setCurrentMembers(members);
                } else {
                    setCurrentMembers([]);
                }
            }
            showToast('החבר הוסר מההרכב', 'info');
        } catch (error) {
            showToast('שגיאה בהסרת החבר', 'error');
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

    // --- Helper for adding/removing items in edit mode ---
    const addSocialLink = () => {
        setEditForm(prev => ({
            ...prev,
            socialLinks: [...prev.socialLinks, { display: '', url: '' }]
        }));
    };

    const updateSocialLink = (index: number, field: 'display' | 'url', value: string) => {
        const newLinks = [...editForm.socialLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setEditForm(prev => ({ ...prev, socialLinks: newLinks }));
    };

    const removeSocialLink = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            socialLinks: prev.socialLinks.filter((_, i) => i !== index)
        }));
    };

    const addRepertoireSong = () => {
        setEditForm(prev => ({
            ...prev,
            repertoire: [...prev.repertoire, { song: '', artist: '' }]
        }));
    };

    const updateRepertoire = (index: number, field: 'song' | 'artist' | 'note', value: string) => {
        const newRep = [...editForm.repertoire];
        newRep[index] = { ...newRep[index], [field]: value };
        setEditForm(prev => ({ ...prev, repertoire: newRep }));
    };

    const removeRepertoireSong = (index: number) => {
        setEditForm(prev => ({
            ...prev,
            repertoire: prev.repertoire.filter((_, i) => i !== index)
        }));
    };

    // --- Influences helpers ---
    const [newInfluence, setNewInfluence] = useState('');
    const addInfluence = () => {
        if (!newInfluence.trim()) return;
        setEditForm(prev => ({ ...prev, influences: [...prev.influences, newInfluence.trim()] }));
        setNewInfluence('');
    };
    const removeInfluence = (index: number) => {
        setEditForm(prev => ({ ...prev, influences: prev.influences.filter((_, i) => i !== index) }));
    };

    // --- Instrument slot helpers ---
    const addInstrumentSlot = (instrumentId: string) => {
        const existing = editForm.instrumentSlots.find(s => s.instrumentId === instrumentId);
        if (existing) {
            setEditForm(prev => ({
                ...prev,
                instrumentSlots: prev.instrumentSlots.map(s =>
                    s.instrumentId === instrumentId ? { ...s, quantity: s.quantity + 1 } : s
                )
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                instrumentSlots: [...prev.instrumentSlots, { instrumentId, quantity: 1, filledBy: [] }]
            }));
        }
    };
    const removeInstrumentSlot = (index: number) => {
        setEditForm(prev => ({ ...prev, instrumentSlots: prev.instrumentSlots.filter((_, i) => i !== index) }));
    };
    const updateSlotQuantity = (index: number, qty: number) => {
        if (qty < 1) return;
        setEditForm(prev => ({
            ...prev,
            instrumentSlots: prev.instrumentSlots.map((s, i) => i === index ? { ...s, quantity: qty } : s)
        }));
    };

    if (loading && !request) {
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

    // Calculate if there are open slots
    const hasOpenSlots = request.type === BandRequestType.TARGETED
        ? request.instrumentSlots?.some(slot => slot.filledBy.length < slot.quantity)
        : true; // OPEN type always allows

    return (
        <div className="page page-request-details">
            {/* Header */}
            <div className="details-hero">
                <div className="details-hero-content">
                    {isEditing && (
                        <div className="hero-cover-edit-overlay" style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            zIndex: 10,
                            backdropFilter: 'blur(2px)'
                        }}>
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                width: '100%',
                                padding: '0 20px'
                            }}>
                                <label
                                    htmlFor="cover-edit-upload"
                                    className="btn btn-primary"
                                    style={{
                                        cursor: 'pointer',
                                        padding: '12px 20px',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <Plus size={20} />
                                    העלה תמונה
                                </label>
                                <button
                                    className="btn btn-outline btn-light"
                                    onClick={() => setShowCoverModal(true)}
                                    style={{
                                        padding: '12px 20px',
                                        fontSize: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.5)',
                                        backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    <ImageIcon size={20} />
                                    בחר מגלריה
                                </button>
                            </div>

                            <input
                                type="file"
                                id="cover-edit-upload"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                        const previewUrl = URL.createObjectURL(file);
                                        setEditForm(prev => ({ ...prev, coverImageUrl: previewUrl }));
                                        setCustomCoverUrl('');
                                    }
                                }}
                            />
                        </div>
                    )}

                    <button className="hero-back-btn" onClick={() => navigate(-1)} style={{ zIndex: 20 }}>
                        <ArrowLeft size={20} />
                    </button>

                    {/* Actions stacked vertically on the left side */}
                    <div className="hero-side-actions" style={{ zIndex: 20 }}>
                        {isCreator && (
                            <button
                                className={`hero-action-btn ${isEditing ? 'active' : ''}`}
                                onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                                title={isEditing ? 'שמור' : 'עריכה'}
                            >
                                {isEditing ? <Save size={18} /> : <Edit2 size={18} />}
                            </button>
                        )}
                        {isEditing && isCreator && (
                            <button
                                className="hero-action-btn cancel"
                                onClick={() => setIsEditing(false)}
                                title="ביטול"
                            >
                                <X size={18} />
                            </button>
                        )}
                        <button className="hero-action-btn" title="שיתוף" onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            showToast('הקישור הועתק ללוח!', 'success');
                        }}>
                            <Share2 size={18} />
                        </button>
                    </div>

                    {isClosed && (
                        <div className="hero-formed-badge">הפך ללהקה</div>
                    )}

                    {isEditing ? (
                        <input
                            type="text"
                            className="form-input-lg hero-title-input"
                            value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                            placeholder="שם ההרכב"
                        />
                    ) : (
                        <h1 className="hero-title">{request.title}</h1>
                    )}

                    <div className="hero-meta">
                        <span>פורסם {formatTimeAgo(request.createdAt)}</span>
                        <span>•</span>
                        <span>ע"י {creator.displayName}</span>
                    </div>
                </div>
            </div>

            <div className="container details-content">
                {/* Quick Info Strip - 2 columns on mobile */}
                {isEditing ? (
                    <div className="edit-info-section">
                        <h3 className="edit-section-title"><Sliders size={16} /> פרטים כלליים</h3>
                        <div className="edit-info-grid">
                            <div className="edit-info-field">
                                <label>רמת מחויבות</label>
                                <select
                                    className="form-select"
                                    value={editForm.commitmentLevel}
                                    onChange={e => setEditForm({ ...editForm, commitmentLevel: e.target.value })}
                                >
                                    <option value="">לא נבחר</option>
                                    <option value="hobby">תחביב (כיף)</option>
                                    <option value="intermediate">חצי מקצועי</option>
                                    <option value="professional">מקצועי</option>
                                </select>
                            </div>
                            <div className="edit-info-field">
                                <label>תדירות חזרות</label>
                                <input
                                    className="form-input"
                                    value={editForm.rehearsalFrequency}
                                    onChange={e => setEditForm({ ...editForm, rehearsalFrequency: e.target.value })}
                                    placeholder="למשל: פעם בשבוע"
                                />
                            </div>
                            <div className="edit-info-field">
                                <label>גיל מינימלי</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editForm.targetAgeMin}
                                    onChange={e => setEditForm({ ...editForm, targetAgeMin: Number(e.target.value) })}
                                    min={10}
                                    max={99}
                                />
                            </div>
                            <div className="edit-info-field">
                                <label>גיל מקסימלי</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={editForm.targetAgeMax}
                                    onChange={e => setEditForm({ ...editForm, targetAgeMax: Number(e.target.value) })}
                                    min={10}
                                    max={99}
                                />
                            </div>
                        </div>
                        <div className="edit-info-field" style={{ marginTop: 'var(--spacing-sm)' }}>
                            <label>חומר מקורי ({editForm.originalVsCoverRatio}%)</label>
                            <input
                                type="range"
                                className="form-range"
                                min={0}
                                max={100}
                                value={editForm.originalVsCoverRatio}
                                onChange={e => setEditForm({ ...editForm, originalVsCoverRatio: Number(e.target.value) })}
                            />
                            <div className="range-labels">
                                <span>קאברים</span>
                                <span>מקורי</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="quick-info-strip">
                        <div className="quick-info-item">
                            <Music size={16} />
                            <span>{request.originalVsCoverRatio}% מקורי</span>
                        </div>

                        {/* Creator Role Display */}
                        {(request.creatorRoles && request.creatorRoles.length > 0) ? (
                            <div className="quick-info-item highlight-creator-role" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {request.creatorRoles.map((role, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {role.kind === 'INSTRUMENT' ? (
                                            <>
                                                <span>{getInstrumentIcon(role.value)}</span>
                                                <span>{getInstrumentName(role.value)}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic2 size={16} />
                                                <span>{getRoleName(role.value)}</span>
                                            </>
                                        )}
                                        {idx < (request.creatorRoles?.length || 0) - 1 && <span style={{ opacity: 0.5 }}>|</span>}
                                    </div>
                                ))}
                                <span style={{ fontSize: '0.9em', opacity: 0.8, marginRight: '4px' }}>(מחפש/ת להקים)</span>
                            </div>
                        ) : request.creatorSlot ? (
                            <div className="quick-info-item highlight-creator-role">
                                {request.creatorSlot.kind === 'INSTRUMENT' ? (
                                    <>
                                        <span>{getInstrumentIcon(request.creatorSlot.value)}</span>
                                        <span>מחפש/ת להקים הרכב כ{getInstrumentName(request.creatorSlot.value)}</span>
                                    </>
                                ) : (
                                    <>
                                        <Mic2 size={16} />
                                        <span>מחפש/ת להקים הרכב כ{getRoleName(request.creatorSlot.value)}</span>
                                    </>
                                )}
                            </div>
                        ) : null}

                        {request.commitmentLevel && (
                            <div className="quick-info-item">
                                <Zap size={16} />
                                <span>{request.commitmentLevel === 'hobby' ? 'תחביב' :
                                    request.commitmentLevel === 'intermediate' ? 'חצי מקצועי' : 'מקצועי'}</span>
                            </div>
                        )}
                        {request.rehearsalFrequency && (
                            <div className="quick-info-item">
                                <Clock size={16} />
                                <span>{request.rehearsalFrequency}</span>
                            </div>
                        )}
                        {request.targetAgeRange && (
                            <div className="quick-info-item">
                                <Users size={16} />
                                <span>גילאי {request.targetAgeRange.min}-{request.targetAgeRange.max}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* About the project */}
                <section className="details-section about-section">
                    <h2>
                        <Music size={18} />
                        על הפרויקט
                    </h2>
                    {isEditing ? (
                        <textarea
                            className="form-textarea"
                            value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            rows={6}
                        />
                    ) : (
                        <p className="description-text">{request.description}</p>
                    )}

                    {!isEditing && (
                        <div className="genres-list">
                            {request.genres.map(g => (
                                <span key={g} className="genre-tag">
                                    # {getGenreName(g)}
                                </span>
                            ))}
                        </div>
                    )}

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

                {isCreator && request.status === 'open' && !isEditing && (
                    <div style={{ marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        {canConvert ? (
                            <button
                                className="btn btn-primary w-full"
                                onClick={() => {
                                    setBandName(request.title || '');
                                    setShowBandNameModal(true);
                                }}
                            >
                                <Zap size={18} />
                                הפוך ללהקה והתחל חזרות
                            </button>
                        ) : (
                            <div className="alert alert-info text-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={16} />
                                <span>כדי להפוך ללהקה, עליך לאשר לפחות חבר אחד נוסף.</span>
                            </div>
                        )}
                    </div>
                )}



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
                {isCreator && request.status === 'open' && !isEditing && (
                    <section className="details-section management-section">
                        <div className="management-header">
                            <h2>ניהול הרכב</h2>
                            <span className="badge badge-primary">אזור אישי</span>
                        </div>
                        <div className="management-actions">
                            <div className="management-stats-grid">
                                <div className="stat-box">
                                    <span className="stat-value">{request.currentMembers.length}</span>
                                    <span className="stat-label">חברים קיימים</span>
                                </div>
                                <div className="stat-box">
                                    <span className="stat-value">{pendingApps.length}</span>
                                    <span className="stat-label">ממתינים לאישור</span>
                                </div>
                            </div>

                            {pendingApps.length > 0 && (
                                <div className="applications-section">
                                    <h3 className="apps-section-title">
                                        <UserPlus size={18} />
                                        מועמדויות ממתינות ({pendingApps.length})
                                    </h3>
                                    <div className="applications-grid pending">
                                        {pendingApps.map(app => {
                                            const applicant = applicantUsers[app.applicantId];
                                            return (
                                                <div key={app.id} className="application-card pending">
                                                    <div className="app-card-header">
                                                        <div className="app-avatar">
                                                            {applicant?.avatarUrl ? (
                                                                <img src={applicant.avatarUrl} alt={applicant.displayName} />
                                                            ) : (
                                                                <div className="avatar-placeholder">{applicant?.displayName?.[0] || '?'}</div>
                                                            )}
                                                        </div>
                                                        <div className="app-info">
                                                            <h4>{applicant?.displayName || 'משתמש'}</h4>
                                                            <div className="app-meta">
                                                                <span className="app-instrument">
                                                                    {getInstrumentIcon(app.instrumentId)} {getInstrumentName(app.instrumentId)}
                                                                </span>
                                                                {applicant?.city && (
                                                                    <span className="app-location">• {applicant.city}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {app.message && (
                                                        <div className="app-card-content">
                                                            <div className="quote-icon">❝</div>
                                                            <p className="app-message">{app.message}</p>
                                                        </div>
                                                    )}

                                                    <div className="app-card-footer">
                                                        <button
                                                            className="btn-action approve"
                                                            onClick={() => handleReviewApplication(app.id, 'approved')}
                                                            disabled={reviewingId === app.id}
                                                            title="אשר מועמדות"
                                                        >
                                                            <Check size={18} />
                                                            <span>אשר</span>
                                                        </button>
                                                        <button
                                                            className="btn-action reject"
                                                            onClick={() => handleReviewApplication(app.id, 'rejected')}
                                                            disabled={reviewingId === app.id}
                                                            title="דחה מועמדות"
                                                        >
                                                            <X size={18} />
                                                            <span>דחה</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {reviewedApps.length > 0 && (
                                <div className="applications-section reviewed">
                                    <h3 className="apps-section-title">
                                        מועמדויות שטופלו ({reviewedApps.length})
                                    </h3>
                                    <div className="applications-grid reviewed">
                                        {reviewedApps.map(app => {
                                            const applicant = applicantUsers[app.applicantId];
                                            const isApproved = app.status === ApplicationStatus.APPROVED;
                                            return (
                                                <div key={app.id} className={`application-card history ${isApproved ? 'approved' : 'rejected'}`}>
                                                    <div className="app-card-header small">
                                                        <div className="app-avatar sm">
                                                            {applicant?.avatarUrl ? (
                                                                <img src={applicant.avatarUrl} alt={applicant.displayName} />
                                                            ) : (
                                                                <div className="avatar-placeholder">{applicant?.displayName?.[0] || '?'}</div>
                                                            )}
                                                        </div>
                                                        <div className="app-info">
                                                            <h4>{applicant?.displayName || 'משתמש'}</h4>
                                                            <span className="app-instrument text-sm">
                                                                {getInstrumentName(app.instrumentId)}
                                                            </span>
                                                        </div>
                                                        <div className={`status-badge-icon ${isApproved ? 'approved' : 'rejected'}`}>
                                                            {isApproved ? <Check size={14} /> : <X size={14} />}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {pendingApps.length === 0 && reviewedApps.length === 0 && (
                                <div className="empty-apps-state">
                                    <div className="empty-icon"><UserPlus size={32} /></div>
                                    <p>עדיין לא הוגשו מועמדויות.</p>
                                    <span className="text-sm text-secondary">שתף את ההרכב כדי למשוך נגנים!</span>
                                </div>
                            )}


                        </div>
                    </section>
                )}

                {/* Members List */}
                <section className="details-section members-section">
                    <div className="section-header">
                        <h2>
                            <Users size={18} />
                            חברי ההרכב {currentMembers.length > 0 && `(${currentMembers.length})`}
                        </h2>
                    </div>
                    {currentMembers.length > 0 ? (
                        <div className="members-horizontal-list">
                            {currentMembers.map(member => (
                                <div
                                    key={member.id}
                                    className="member-profile-card"
                                    onClick={() => !isEditing && navigate(`/profile/${member.id}`)}
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
                                    {isEditing && isCreator && member.id !== request.creatorId && (
                                        <button
                                            className="member-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveMember(member.id);
                                            }}
                                            title="הסר חבר"
                                        >
                                            <UserMinus size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {!isClosed && hasOpenSlots && !isEditing && (
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

                {/* Slots (Who we need) */}
                {request.type === BandRequestType.TARGETED && (
                    <section className="details-section">
                        <h2>מי דרוש לנו?</h2>
                        <div className="slots-grid">
                            {isEditing ? (
                                editForm.instrumentSlots.map((slot, idx) => (
                                    <div key={idx} className="slot-card edit-mode">
                                        <div className="slot-icon-wrapper">
                                            <span className="slot-icon-lg">{getInstrumentIcon(slot.instrumentId)}</span>
                                        </div>
                                        <div className="slot-info">
                                            <h3>{getInstrumentName(slot.instrumentId)}</h3>
                                            <div className="slot-quantity-control">
                                                <button
                                                    className="btn-icon-tiny"
                                                    onClick={() => updateSlotQuantity(idx, slot.quantity - 1)}
                                                >-</button>
                                                <span>{slot.quantity}</span>
                                                <button
                                                    className="btn-icon-tiny"
                                                    onClick={() => updateSlotQuantity(idx, slot.quantity + 1)}
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                request.instrumentSlots?.map((slot, idx) => {
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
                                })
                            )}
                        </div>
                    </section>
                )}





                {/* Repertoire Section */}
                {(isEditing || (request.repertoire && request.repertoire.length > 0)) && (
                    <section className="details-section">
                        <div className="section-header">
                            <h2>
                                <Music size={20} />
                                רפרטואר (Setlist)
                            </h2>
                        </div>

                        {isEditing ? (
                            <div className="edit-repertoire">
                                {editForm.repertoire.map((song, idx) => (
                                    <div key={idx} className="edit-song-row">
                                        <input
                                            className="form-input"
                                            placeholder="שם השיר"
                                            value={song.song}
                                            onChange={e => updateRepertoire(idx, 'song', e.target.value)}
                                        />
                                        <input
                                            className="form-input"
                                            placeholder="אמן מבצע"
                                            value={song.artist}
                                            onChange={e => updateRepertoire(idx, 'artist', e.target.value)}
                                        />
                                        <input
                                            className="form-input"
                                            placeholder="הערה"
                                            value={song.note || ''}
                                            onChange={e => updateRepertoire(idx, 'note', e.target.value)}
                                        />
                                        <button className="btn-icon danger" onClick={() => removeRepertoireSong(idx)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button className="btn btn-outline btn-sm mt-3" onClick={addRepertoireSong}>
                                    <Plus size={16} /> הוסף שיר
                                </button>
                            </div>
                        ) : (
                            <div className="repertoire-list">
                                <table className="repertoire-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>שיר</th>
                                            <th>אמן</th>
                                            <th>הערות</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {request.repertoire?.map((song, idx) => (
                                            <tr key={idx}>
                                                <td>{idx + 1}</td>
                                                <td className="font-medium">{song.song}</td>
                                                <td>{song.artist}</td>
                                                <td className="text-muted">{song.note || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* Social Links Section */}
                {(isEditing || (request.socialLinks && request.socialLinks.length > 0)) && (
                    <section className="details-section">
                        <div className="section-header">
                            <h2>
                                <Globe size={20} />
                                קישורים חיצוניים
                            </h2>
                        </div>

                        {isEditing ? (
                            <div className="edit-links">
                                {editForm.socialLinks.map((link, idx) => (
                                    <div key={idx} className="edit-link-row">
                                        <input
                                            className="form-input"
                                            placeholder="כותרת (למשל: אינסטגרם)"
                                            value={link.display}
                                            onChange={e => updateSocialLink(idx, 'display', e.target.value)}
                                        />
                                        <input
                                            className="form-input ltr"
                                            placeholder="URL https://..."
                                            value={link.url}
                                            onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                                        />
                                        <button className="btn-icon danger" onClick={() => removeSocialLink(idx)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button className="btn btn-outline btn-sm mt-3" onClick={addSocialLink}>
                                    <Plus size={16} /> הוסף קישור
                                </button>
                            </div>
                        ) : (
                            <div className="social-links-grid">
                                {request.socialLinks?.map((link, idx) => {
                                    let hostname = '';
                                    try {
                                        hostname = new URL(link.url).hostname;
                                    } catch (e) {
                                        hostname = link.url;
                                    }

                                    return (
                                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link-card">
                                            <div className="link-icon">
                                                {link.url.includes('instagram') ? <Instagram size={24} /> :
                                                    link.url.includes('facebook') ? <Facebook size={24} /> :
                                                        link.url.includes('youtube') ? <Youtube size={24} /> :
                                                            <ExternalLink size={24} />}
                                            </div>
                                            <div className="link-info">
                                                <span className="link-title">{link.display}</span>
                                                <span className="link-url">{hostname}</span>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}


                {/* Application Form - Only if not closed */}
                {!isCreator && !hasApplied && !isClosed && (
                    <section className="details-section apply-section">
                        <h2 className="section-title">מעוניין להצטרף?</h2>

                        {!user ? (
                            <div className="login-prompt" style={{ textAlign: 'center', padding: '20px' }}>
                                <p style={{ marginBottom: '15px' }}>יש להתחבר למערכת כדי להגיש בקשה.</p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="btn btn-primary"
                                    style={{ margin: '0 auto' }}
                                >
                                    התחברות / הרשמה
                                </button>
                            </div>
                        ) : (
                            <div className="apply-form">
                                <div className="form-group mb-3">
                                    <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                        באיזה כלי את/ה מנגן/ת?
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedInstrument}
                                        onChange={e => setSelectedInstrument(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            backgroundColor: 'var(--color-bg-secondary)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                    >
                                        <option value="">בחר כלי נגינה...</option>
                                        {request.type === BandRequestType.TARGETED ? (
                                            request.instrumentSlots
                                                ?.filter(slot => slot.filledBy.length < slot.quantity) // Only show open slots
                                                .map(slot => {
                                                    const inst = INSTRUMENTS.find(i => i.id === slot.instrumentId);
                                                    return inst ? (
                                                        <option key={inst.id} value={inst.id}>
                                                            {inst.icon} {inst.nameHe} ({slot.quantity - slot.filledBy.length} פנויים)
                                                        </option>
                                                    ) : null;
                                                })
                                        ) : (
                                            INSTRUMENTS.map(inst => (
                                                <option key={inst.id} value={inst.id}>
                                                    {inst.icon} {inst.nameHe}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

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
                                    disabled={applying || !selectedInstrument}
                                >
                                    {applying ? 'שולח...' : 'שלח בקשת הצטרפות'}
                                </button>
                            </div>
                        )}
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

            {/* Band Name Modal */}
            {
                showBandNameModal && (
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
                )
            }

            {/* Cover Image Selection Modal */}
            <Modal
                isOpen={showCoverModal}
                onClose={() => setShowCoverModal(false)}
                title="בחר תמונת קאבר"
            >
                <div className="cover-selection-grid-modal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
                    {BAND_COVER_OPTIONS.map((url, index) => (
                        <div
                            key={index}
                            className={`cover-option ${editForm.coverImageUrl === url ? 'selected' : ''}`}
                            onClick={() => {
                                setEditForm(prev => ({ ...prev, coverImageUrl: url }));
                                setCustomCoverUrl('');
                                setImageFile(null);
                                setShowCoverModal(false);
                            }}
                            style={{
                                position: 'relative',
                                cursor: 'pointer',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                aspectRatio: '16/9',
                                border: editForm.coverImageUrl === url ? '2px solid var(--color-primary)' : '2px solid transparent'
                            }}
                        >
                            <img src={url} alt={`Cover option ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            {editForm.coverImageUrl === url && (
                                <div className="selected-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(var(--color-primary-rgb), 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Check size={24} color="white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>
        </div >
    );
}
