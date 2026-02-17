import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
    Search,
    Music,
    Plus,
    ChevronDown,
    X,
    Guitar,
    Percent,
    SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { Band, BandRequest, User, BandRequestType, BandRequestStatus } from '../../types';
import { GENRES, INSTRUMENTS } from '../../data/constants';
import { getInstrumentName, getInstrumentIcon, getGenreName } from '../../utils';
import './BandsUnified.css';

type ViewType = 'hiring' | 'active';

export function BandsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const currentView = (searchParams.get('view') as ViewType) || 'hiring';

    const [loading, setLoading] = useState(true);
    const [bands, setBands] = useState<Band[]>([]);
    const [requests, setRequests] = useState<BandRequest[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [myItems, setMyItems] = useState<(Band | BandRequest)[]>([]); // User's bands & requests

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
    const [materialFilter, setMaterialFilter] = useState<'all' | 'original' | 'covers' | 'mix'>('all');

    // UI States
    const [matchMyInstruments, setMatchMyInstruments] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isMyProjectsOpen, setIsMyProjectsOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bandsData, requestsData, usersData] = await Promise.all([
                repository.getBands(),
                repository.getBandRequests(),
                repository.getAllUsers(),
            ]);

            setBands(bandsData);
            setRequests(requestsData);

            // Find user's bands and requests
            if (user) {
                const myBands = bandsData.filter(band =>
                    band.members?.some(m => m.userId === user.id)
                );

                // Only include OPEN requests where user is member/creator and NOT yet formed/closed
                // Note: Formed requests should be bands now, so we filter by status 'open' or 'targeted' usually
                const myRequests = requestsData.filter(req =>
                    (req.creatorId === user.id || req.currentMembers.includes(user.id)) &&
                    req.status !== 'formed' && req.status !== 'closed'
                );

                setMyItems([...myBands, ...myRequests]);
            }

            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);
        } catch (error) {
            console.error('Failed to load data:', error);
            showToast('שגיאה בטעינת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewChange = (view: ViewType) => {
        setSearchParams({ view });
    };

    const handleCreate = () => {
        navigate('/requests/new');
    };

    const activeFiltersCount = [
        selectedGenre,
        selectedInstrument,
        materialFilter !== 'all' ? materialFilter : null,
        matchMyInstruments ? 'match' : null,
    ].filter(Boolean).length;

    const getFilteredContent = () => {
        let content: (Band | BandRequest)[] = [];

        // First pass: Match My Instruments (for hiring view)
        if (currentView === 'hiring') {
            content = requests.filter(req => {
                // Only show open requests
                if (req.status !== BandRequestStatus.OPEN) return false;

                if (matchMyInstruments && user?.instruments) {
                    const userInstrumentIds = user.instruments.map(i => i.instrumentId);
                    const hasMatch = req.instrumentSlots?.some(slot =>
                        userInstrumentIds.includes(slot.instrumentId) &&
                        slot.filledBy.length < slot.quantity
                    );
                    if (!hasMatch && req.type !== BandRequestType.OPEN) return false;
                }
                return true;
            });
        } else {
            content = bands;
        }

        // Apply common filters
        return content.filter(item => {
            // Genre Filter
            if (selectedGenre && !item.genres.includes(selectedGenre)) return false;

            // Instrument Filter
            if (selectedInstrument) {
                if (currentView === 'hiring') {
                    const req = item as BandRequest;
                    const needsInstrument = req.instrumentSlots?.some(slot =>
                        slot.instrumentId === selectedInstrument && slot.filledBy.length < slot.quantity
                    );
                    if (!needsInstrument) return false;
                } else {
                    const band = item as Band;
                    if (!band.members?.some(m => m.instrumentId === selectedInstrument)) return false;
                }
            }

            // Material Filter
            if (materialFilter !== 'all' && 'originalVsCoverRatio' in item) {
                const ratio = (item as BandRequest).originalVsCoverRatio;
                // Original: >60%, Covers: <40%, Mix: 40-60%
                if (materialFilter === 'original' && ratio <= 60) return false;
                if (materialFilter === 'covers' && ratio >= 40) return false;
                if (materialFilter === 'mix' && (ratio < 40 || ratio > 60)) return false;
            }

            // Search Filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const name = 'name' in item ? (item as Band).name : (item as BandRequest).title;
                const desc = (item as any).description || '';
                return (name || '').toLowerCase().includes(q) || desc.toLowerCase().includes(q);
            }

            return true;
        });
    };

    const filteredItems = getFilteredContent();

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="page page-bands">
            <header className="bands-header">
                <div className="bands-header-content">
                    <div>
                        <h1 className="page-title">להקות והרכבים</h1>
                        <p className="page-subtitle">מצא את השותפים המוזיקליים הבאים שלך</p>
                    </div>
                    <button className="new-band-btn" onClick={handleCreate}>
                        <Plus size={20} />
                        <span>צור הרכב חדש</span>
                    </button>
                </div>
            </header>

            {/* My Bands & Requests Section */}
            {myItems.length > 0 && (
                <div id="my-bands-section" className="my-bands-section my-bands-featured">
                    <button
                        className={`my-projects-toggle-btn ${isMyProjectsOpen ? 'open' : ''}`}
                        onClick={() => setIsMyProjectsOpen(!isMyProjectsOpen)}
                    >
                        <div className="toggle-label">
                            <span className="toggle-icon">📂</span>
                            <span className="toggle-text">הפרויקטים שלי ({myItems.length})</span>
                        </div>
                        <ChevronDown size={20} className={`toggle-chevron ${isMyProjectsOpen ? 'rotate' : ''}`} />
                    </button>

                    {isMyProjectsOpen && (
                        <div className="my-bands-scroll-container">
                            <div className="my-bands-scroll">
                                {myItems.map(item => {
                                    const isRealBand = 'approvedRehearsalsCount' in item;
                                    const linkTo = isRealBand ? `/bands/${item.id}/workspace` : `/requests/${item.id}`;
                                    const name = isRealBand ? (item as Band).name : (item as BandRequest).title;
                                    const image = isRealBand ? (item as Band).coverImageUrl : null;

                                    return (
                                        <Link
                                            key={item.id}
                                            to={linkTo}
                                            className={`my-band-card-mini ${isRealBand ? 'type-band' : 'type-request'}`}
                                        >
                                            <div className="mini-cover">
                                                {image ? (
                                                    <img src={image} alt={name} />
                                                ) : (
                                                    <Music size={24} />
                                                )}
                                                {!isRealBand && <div className="mini-badge">גיוס</div>}
                                            </div>
                                            <div className="mini-info">
                                                <h3>{name}</h3>
                                                {isRealBand ? (
                                                    <span className="status-text band">פעיל</span>
                                                ) : (
                                                    <span className="status-text request">מגייס</span>
                                                )}
                                            </div>
                                            <ChevronDown size={16} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Controls Bar */}
            <div className="bands-controls">
                <div className="controls-container">
                    {/* View Cards */}
                    <div className="view-cards">
                        <button
                            className={`view-card ${currentView === 'hiring' ? 'active' : ''}`}
                            onClick={() => handleViewChange('hiring')}
                        >
                            <span className="view-card-icon">📢</span>
                            <div className="view-card-text">
                                <span className="view-card-title">לוח דרושים</span>
                                <span className="view-card-subtitle">הרכבים שמחפשים נגנים</span>
                            </div>
                        </button>
                        <button
                            className={`view-card ${currentView === 'active' ? 'active' : ''}`}
                            onClick={() => handleViewChange('active')}
                        >
                            <span className="view-card-icon">🎸</span>
                            <div className="view-card-text">
                                <span className="view-card-title">אינדקס להקות</span>
                                <span className="view-card-subtitle">הרכבים פעילים</span>
                            </div>
                        </button>
                    </div>

                    {/* Search + Filter Row */}
                    <div className="search-filter-row">
                        <div className="search-container">
                            <Search className="search-icon-absolute" size={18} />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="חפש לפי שם, סגנון או תיאור..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="filter-btn-wrapper">
                            <button
                                className={`filter-main-btn ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                            >
                                <SlidersHorizontal size={16} />
                                <span>סינון</span>
                                {activeFiltersCount > 0 && (
                                    <span className="filter-count-badge">{activeFiltersCount}</span>
                                )}
                            </button>
                            {isFilterOpen && (
                                <div className="filter-panel">
                                    <div className="filter-panel-header">
                                        <span className="filter-panel-title">סינון תוצאות</span>
                                        {activeFiltersCount > 0 && (
                                            <button className="filter-clear-all" onClick={() => {
                                                setSelectedGenre(null);
                                                setSelectedInstrument(null);
                                                setMaterialFilter('all');
                                                setMatchMyInstruments(false);
                                            }}>
                                                <X size={14} /> נקה הכל
                                            </button>
                                        )}
                                    </div>

                                    {/* Match My Instruments */}
                                    {currentView === 'hiring' && user?.instruments && user.instruments.length > 0 && (
                                        <div className="filter-section">
                                            <button
                                                className={`filter-toggle-btn ${matchMyInstruments ? 'active' : ''}`}
                                                onClick={() => setMatchMyInstruments(!matchMyInstruments)}
                                            >
                                                ✨ מותאם לכלים שלי
                                                {matchMyInstruments && <X size={12} />}
                                            </button>
                                        </div>
                                    )}

                                    {/* Genre */}
                                    <div className="filter-section">
                                        <div className="filter-section-label">
                                            <Music size={14} /> סגנון מוזיקלי
                                        </div>
                                        <div className="filter-grid">
                                            <button className={`filter-option ${!selectedGenre ? 'selected' : ''}`} onClick={() => setSelectedGenre(null)}>הכל</button>
                                            {GENRES.map(genre => (
                                                <button key={genre.id} className={`filter-option ${selectedGenre === genre.id ? 'selected' : ''}`} onClick={() => setSelectedGenre(genre.id)}>
                                                    {genre.nameHe}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Instrument */}
                                    <div className="filter-section">
                                        <div className="filter-section-label">
                                            <Guitar size={14} /> כלי נגינה
                                        </div>
                                        <div className="filter-grid">
                                            <button className={`filter-option ${!selectedInstrument ? 'selected' : ''}`} onClick={() => setSelectedInstrument(null)}>הכל</button>
                                            {INSTRUMENTS.map(inst => (
                                                <button key={inst.id} className={`filter-option ${selectedInstrument === inst.id ? 'selected' : ''}`} onClick={() => setSelectedInstrument(inst.id)}>
                                                    {inst.icon} {inst.nameHe}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Material */}
                                    {currentView === 'hiring' && (
                                        <div className="filter-section">
                                            <div className="filter-section-label">
                                                <Percent size={14} /> סוג חומר
                                            </div>
                                            <div className="filter-grid filter-grid-1col">
                                                <button className={`filter-option ${materialFilter === 'all' ? 'selected' : ''}`} onClick={() => setMaterialFilter('all')}>הכל</button>
                                                <button className={`filter-option ${materialFilter === 'original' ? 'selected' : ''}`} onClick={() => setMaterialFilter('original')}>🎵 בעיקר מקורי</button>
                                                <button className={`filter-option ${materialFilter === 'covers' ? 'selected' : ''}`} onClick={() => setMaterialFilter('covers')}>🎤 בעיקר קאברים</button>
                                                <button className={`filter-option ${materialFilter === 'mix' ? 'selected' : ''}`} onClick={() => setMaterialFilter('mix')}>🔀 משולב</button>
                                            </div>
                                        </div>
                                    )}

                                    <button className="filter-apply-btn" onClick={() => setIsFilterOpen(false)}>
                                        הצג תוצאות
                                        {filteredItems.length > 0 && <span className="filter-results-count">{filteredItems.length}</span>}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="container">
                {filteredItems.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">😢</div>
                        <h3 className="empty-state-title">לא נמצאו תוצאות</h3>
                        <p className="empty-state-text">נסה לשנות את הסינון או החיפוש</p>
                    </div>
                ) : (
                    <div className="cards-grid">
                        {filteredItems.map((item: Band | BandRequest) => (
                            <UnifiedBandCard
                                key={item.id}
                                item={item}
                                type={currentView}
                                users={users}
                                to={currentView === 'hiring' ? `/requests/${item.id}` : `/bands/${item.id}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <button className="create-fab" onClick={handleCreate} title="צור להקה חדשה">
                <Plus size={24} />
            </button>
        </div>
    );
}

// Sub-component for individual card declaration
interface UnifiedBandCardProps {
    item: Band | BandRequest;
    type: ViewType;
    users: Record<string, User>;
    to: string;
}

function UnifiedBandCard({ item, type, users, to }: UnifiedBandCardProps) {
    // Helper to safety access properties
    const anyItem = item as any;
    const name = anyItem.name || anyItem.title;
    const creatorId = anyItem.creatorId || anyItem.members?.[0]?.userId;
    const creator = users[creatorId];

    return (
        <Link className="band-card" to={to}>
            {/* Status Badge */}
            <div className={`card-badge ${type}`}>
                {type === 'hiring' ? (anyItem.type === 'targeted' ? 'ממוקד' : 'פתוח') : 'פעיל'}
            </div>

            {/* Cover Image */}
            <div className="card-cover">
                {'coverImageUrl' in item && item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt={name} />
                ) : (
                    <div className="card-cover-placeholder">
                        <Music />
                    </div>
                )}
            </div>

            <div className="card-content">
                {/* Creator Avatar - Positioned absolutely via CSS to overlap cover */}
                <div className="card-header">
                    {creator?.avatarUrl && (
                        <img src={creator.avatarUrl} className="creator-avatar" alt="Creator" />
                    )}
                    <div className="card-title-area">
                        <h3 className="card-title">{name}</h3>
                        <div className="card-subtitle">
                            {type === 'hiring' ? (
                                <span>נוצר ע"י {creator?.displayName || '?'}</span>
                            ) : (
                                <span>{anyItem.members?.length || 0} חברים</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Genres */}
                <div className="card-genres">
                    {item.genres.slice(0, 3).map((id: string) => (
                        <span key={id} className="genre-tag">{getGenreName(id)}</span>
                    ))}
                </div>

                {/* Bottom section: differs by type */}
                {type === 'hiring' ? (
                    <>
                        {/* Member stack for requests */}
                        <div className="card-members-section">
                            <div className="card-members">
                                <div className="member-stack">
                                    {(anyItem.currentMembers || []).slice(0, 4).map((memberId: string) => {
                                        const u = users[memberId];
                                        return u?.avatarUrl ? (
                                            <img key={memberId} src={u.avatarUrl} alt="" className="stack-avatar" />
                                        ) : (
                                            <div key={memberId} className="stack-avatar placeholder">
                                                {u?.displayName?.charAt(0) || '?'}
                                            </div>
                                        );
                                    })}
                                    {(anyItem.currentMembers || []).length > 4 && (
                                        <div className="stack-avatar more">
                                            +{anyItem.currentMembers.length - 4}
                                        </div>
                                    )}
                                </div>
                                <span className="members-count-label">
                                    {anyItem.currentMembers?.length || 0} חברים
                                </span>
                            </div>
                        </div>
                        {/* Instrument slots */}
                        <div className="card-slots">
                            {anyItem.instrumentSlots?.slice(0, 3).map((slot: any, idx: number) => {
                                const filled = slot.filledBy.length;
                                const total = slot.quantity;
                                const isFull = filled >= total;
                                return (
                                    <div key={idx} className="slot-item">
                                        <div className="slot-name">
                                            {getInstrumentIcon(slot.instrumentId)}
                                            <span>{getInstrumentName(slot.instrumentId)}</span>
                                        </div>
                                        <span className={`slot-status ${isFull ? 'full' : 'open'}`}>
                                            {filled}/{total}
                                        </span>
                                    </div>
                                );
                            })}
                            {anyItem.type === BandRequestType.OPEN && (
                                <div className="slot-item">
                                    <span className="slot-name">🎸 כל הכלים</span>
                                    <span className="slot-status open">פתוח לכולם</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Active band: show member circles */
                    <div className="card-band-members">
                        <div className="card-band-members-label">
                            <span>{(anyItem.members || []).length} חברים</span>
                        </div>
                        <div className="card-band-members-row">
                            {(anyItem.members || []).slice(0, 5).map((m: any) => {
                                const u = users[m.userId];
                                return (
                                    <div key={m.userId} className="card-band-member">
                                        {u?.avatarUrl ? (
                                            <img src={u.avatarUrl} alt={u.displayName} className="card-band-member-avatar" />
                                        ) : (
                                            <div className="card-band-member-avatar placeholder">
                                                {u?.displayName?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        <span className="card-band-member-name">
                                            {u?.displayName?.split(' ')[0] || '?'}
                                        </span>
                                    </div>
                                );
                            })}
                            {(anyItem.members || []).length > 5 && (
                                <div className="card-band-member">
                                    <div className="card-band-member-avatar more">
                                        +{anyItem.members.length - 5}
                                    </div>
                                    <span className="card-band-member-name">עוד</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Link>
    );
}
