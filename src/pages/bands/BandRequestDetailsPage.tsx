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
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { BandRequest, User, BandRequestType, BandApplication } from '../../types';
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

    useEffect(() => {
        if (id) {
            loadRequest(id);
        }
    }, [id]);

    const loadRequest = async (requestId: string) => {
        try {
            setLoading(true);
            const req = await localRepository.getBandRequest(requestId);
            if (!req) {
                showToast('ההרכב לא נמצא', 'error');
                navigate('/requests');
                return;
            }
            setRequest(req);

            // Load creator
            const creatorUser = await localRepository.getUser(req.creatorId);
            setCreator(creatorUser);

            // Check if already applied
            if (user) {
                const apps = await localRepository.getMyApplications(user.id);
                const existingApp = apps.find(a => a.bandRequestId === requestId);
                setHasApplied(!!existingApp);
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
            await localRepository.createApplication({
                bandRequestId: request.id,
                applicantId: user.id,
                instrumentId: selectedInstrument || 'unknown',
                message: applicationMessage,
                status: 'pending' as any // TS fix for quick prototype
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

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!request || !creator) return null;

    const isCreator = user?.id === request.creatorId;

    return (
        <div className="page page-request-details">
            {/* Header Image / Pattern */}
            <div className="details-hero">
                <div className="details-hero-content">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft />
                    </button>
                    <div className="hero-tags">
                        <span className="badge badge-accent">
                            {request.type === BandRequestType.TARGETED ? 'חיפוש ממוקד' : 'הרכב פתוח'}
                        </span>
                        <span className="badge badge-ghost">{request.city}</span>
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

                                        return (
                                            <div key={idx} className={`slot-card ${isFull ? 'filled' : 'open'}`}>
                                                <div className="slot-icon-wrapper">
                                                    <span className="slot-icon-lg">{getInstrumentIcon(slot.instrumentId)}</span>
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
                                                {!isFull && !isCreator && !hasApplied && (
                                                    <button
                                                        className={`btn-apply-slot ${selectedInstrument === slot.instrumentId ? 'active' : ''}`}
                                                        onClick={() => setSelectedInstrument(slot.instrumentId)}
                                                    >
                                                        אני מנגן!
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        )}

                        {/* Application Form */}
                        {!isCreator && !hasApplied && (
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
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
