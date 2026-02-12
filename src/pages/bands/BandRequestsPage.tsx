// ============================================
// bandgo - Band Requests Page (Marketplace)
// ============================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Plus,
    MapPin,
    Users,
    Check,
    Music,
    Target,
    Shuffle,
    Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { BandRequest, BandRequestType, User } from '../../types';
import {
    getInstrumentName,
    getInstrumentIcon,
    getGenreName,
    formatDate
} from '../../utils';
import './BandRequests.css';

export function BandRequestsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [requests, setRequests] = useState<BandRequest[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [matchMyInstruments, setMatchMyInstruments] = useState(true);
    const [selectedType, setSelectedType] = useState<'all' | 'targeted' | 'open'>('all');

    useEffect(() => {
        loadData();
    }, [matchMyInstruments, selectedType]);

    const loadData = async () => {
        try {
            setLoading(true);

            const filters: any = {
                matchMyInstruments: matchMyInstruments && (user?.instruments?.length ?? 0) > 0,
            };

            if (selectedType !== 'all') {
                filters.type = selectedType;
            }

            const [requestsData, usersData] = await Promise.all([
                localRepository.getBandRequests(filters),
                localRepository.getAllUsers(),
            ]);

            setRequests(requestsData);

            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);
        } catch (error) {
            console.error('Failed to load requests:', error);
            showToast('שגיאה בטעינת הרכבים', 'error');
        } finally {
            setLoading(false);
        }
    };



    const getOpenSlots = (request: BandRequest) => {
        if (request.type === BandRequestType.OPEN) {
            const current = request.currentMembers?.length || 1;
            const max = request.maxMembers || 4;
            return max - current;
        }

        if (!request.instrumentSlots) return 0;
        return request.instrumentSlots.reduce((sum, slot) => {
            return sum + (slot.quantity - slot.filledBy.length);
        }, 0);
    };

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
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">הרכבים</h1>
                    <p className="page-subtitle">מצא הרכב שמתאים לך או צור אחד משלך</p>
                </div>

                {/* Filters */}
                <div className="requests-filters">
                    {user && user.instruments && user.instruments.length > 0 && (
                        <button
                            className={`filter-toggle ${matchMyInstruments ? 'active' : ''}`}
                            onClick={() => setMatchMyInstruments(!matchMyInstruments)}
                        >
                            <div className="filter-toggle-checkbox">
                                {matchMyInstruments && <Check size={12} color="var(--color-bg-primary)" />}
                            </div>
                            <span className="filter-toggle-label">
                                הצג רק הרכבים שמתאימים לכלים שלי
                            </span>
                        </button>
                    )}

                    <div className="request-type-tabs">
                        <button
                            className={`type-tab ${selectedType === 'all' ? 'active' : ''}`}
                            onClick={() => setSelectedType('all')}
                        >
                            <span className="type-tab-icon">🎸</span>
                            <span className="type-tab-label">הכל</span>
                        </button>
                        <button
                            className={`type-tab ${selectedType === 'targeted' ? 'active' : ''}`}
                            onClick={() => setSelectedType('targeted')}
                        >
                            <span className="type-tab-icon">🎯</span>
                            <span className="type-tab-label">ממוקד</span>
                            <span className="type-tab-desc">כלים מוגדרים</span>
                        </button>
                        <button
                            className={`type-tab ${selectedType === 'open' ? 'active' : ''}`}
                            onClick={() => setSelectedType('open')}
                        >
                            <span className="type-tab-icon">🎲</span>
                            <span className="type-tab-label">פתוח</span>
                            <span className="type-tab-desc">כל הכלים</span>
                        </button>
                    </div>
                </div>

                {/* Requests List */}
                {requests.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🎵</div>
                        <h3 className="empty-state-title">אין הרכבים פתוחים</h3>
                        <p className="empty-state-text">
                            {matchMyInstruments
                                ? 'אין כרגע הרכבים שמחפשים את הכלים שלך. נסה לבטל את הסינון או ליצור הרכב משלך.'
                                : 'היה הראשון ליצור הרכב חדש!'
                            }
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/requests/new')}
                        >
                            <Plus size={18} />
                            צור הרכב חדש
                        </button>
                    </div>
                ) : (
                    requests.map(request => {
                        const creator = users[request.creatorId];
                        const openSlots = getOpenSlots(request);

                        return (
                            <article
                                key={request.id}
                                className="request-card"
                                onClick={() => navigate(`/requests/${request.id}`)}
                            >
                                <div className="request-card-header">
                                    {creator?.avatarUrl ? (
                                        <img
                                            src={creator.avatarUrl}
                                            alt={creator.displayName}
                                            className="request-creator-avatar"
                                        />
                                    ) : (
                                        <div className="request-creator-avatar avatar-placeholder">
                                            {creator?.displayName?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div className="request-meta">
                                        <h3 className="request-title">
                                            {request.title || 'הרכב חדש'}
                                            {request.type === BandRequestType.TARGETED ? (
                                                <span className="badge badge-info">ממוקד</span>
                                            ) : (
                                                <span className="badge badge-accent">פתוח</span>
                                            )}
                                        </h3>
                                        <p className="request-creator">
                                            {creator?.displayName || 'יוצר לא ידוע'}
                                        </p>
                                        {request.city && (
                                            <p className="request-location">
                                                <MapPin size={12} style={{ display: 'inline', marginLeft: 4 }} />
                                                {request.city}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <p className="request-description">{request.description}</p>

                                {/* Genres */}
                                <div className="request-genres">
                                    {request.genres.slice(0, 4).map(genreId => (
                                        <span key={genreId} className="chip">
                                            {getGenreName(genreId)}
                                        </span>
                                    ))}
                                </div>

                                {/* Instrument Slots */}
                                {request.type === BandRequestType.TARGETED && request.instrumentSlots && (
                                    <div className="request-slots">
                                        {request.instrumentSlots.map((slot, idx) => {
                                            const filled = slot.filledBy.length;
                                            const isFull = filled >= slot.quantity;
                                            return (
                                                <span
                                                    key={idx}
                                                    className={`slot-badge ${isFull ? 'filled' : 'open'}`}
                                                >
                                                    <span className="slot-icon">{getInstrumentIcon(slot.instrumentId)}</span>
                                                    {getInstrumentName(slot.instrumentId)}
                                                    <span>{filled}/{slot.quantity}</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Original/Cover Ratio Compact */}
                                <div className="request-ratio">
                                    <div className="music-balance-container compact">
                                        <div className="music-balance-track compact">
                                            <div className="gradient-bg"></div>
                                            <div
                                                className="indicator"
                                                style={{ left: `${request.originalVsCoverRatio}%` }}
                                            />
                                        </div>
                                        <div className="music-balance-labels-compact">
                                            <span>קאברים</span>
                                            <span>מקורי</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="request-footer">
                                    <div className="request-members">
                                        <Users size={16} />
                                        <span className="members-count">
                                            {openSlots > 0
                                                ? `נותרו ${openSlots} מקומות`
                                                : 'מלא'
                                            }
                                        </span>
                                    </div>
                                    <span className="request-date">
                                        {formatDate(request.createdAt)}
                                    </span>
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {/* FAB - Create Request */}
            <button
                className="create-request-fab"
                onClick={() => navigate('/requests/new')}
                title="צור הרכב חדש"
            >
                <Plus size={24} />
            </button>
        </div>
    );
}
