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
    Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Band, BandRequest, User, BandRequestType } from '../../types';
import { GENRES, INSTRUMENTS } from '../../data/constants';
import { getInstrumentName, getInstrumentIcon, getGenreName } from '../../utils';
import { BandProgress } from '../../components/bands/BandProgress';
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
    const [userBands, setUserBands] = useState<Band[]>([]); // User's bands

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
    const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null);
    const [materialFilter, setMaterialFilter] = useState<'all' | 'original' | 'covers' | 'mix'>('all');

    // UI States
    const [matchMyInstruments, setMatchMyInstruments] = useState(false);
    const [isGenreOpen, setIsGenreOpen] = useState(false);
    const [isInstrumentOpen, setIsInstrumentOpen] = useState(false);
    const [isMaterialOpen, setIsMaterialOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bandsData, requestsData, usersData] = await Promise.all([
                localRepository.getBands(),
                localRepository.getBandRequests(),
                localRepository.getAllUsers(),
            ]);

            setBands(bandsData);
            setRequests(requestsData);

            // Find user's bands
            if (user) {
                const myBands = bandsData.filter(band =>
                    band.members?.some(m => m.userId === user.id)
                );
                setUserBands(myBands);
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

    const scrollToMyBands = () => {
        const element = document.getElementById('my-bands-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const getFilteredContent = () => {
        let content: (Band | BandRequest)[] = [];

        // First pass: Match My Instruments (for hiring view)
        if (currentView === 'hiring') {
            content = requests.filter(req => {
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
                    {userBands.length > 0 ? (
                        <div className="header-actions">
                            {userBands.length === 1 ? (
                                <button className="new-band-btn" onClick={() => navigate(`/bands/${userBands[0].id}/workspace`)}>
                                    <Users size={20} />
                                    <span>הלהקה שלי</span>
                                </button>
                            ) : (
                                <button className="new-band-btn" onClick={scrollToMyBands}>
                                    <Users size={20} />
                                    <span>הלהקות שלי ({userBands.length})</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button className="new-band-btn" onClick={handleCreate}>
                            <Plus size={20} />
                            <span>צור להקה חדשה</span>
                        </button>
                    )}
                </div>
            </header>

            {/* My Bands Section (Visible if user has bands) */}
            {userBands.length > 0 && (
                <div id="my-bands-section" className="my-bands-section">
                    <div className="section-header">
                        <h2 className="section-title-small">הלהקות שלי</h2>
                        <button className="btn-text" onClick={handleCreate}>
                            <Plus size={16} />
                            <span>להקה חדשה</span>
                        </button>
                    </div>
                    <div className="my-bands-scroll">
                        {userBands.map(band => (
                            <Link key={band.id} to={`/bands/${band.id}/workspace`} className="my-band-card-mini">
                                <div className="mini-cover">
                                    {band.coverImageUrl ? (
                                        <img src={band.coverImageUrl} alt={band.name} />
                                    ) : (
                                        <Music size={24} />
                                    )}
                                </div>
                                <div className="mini-info">
                                    <h3>{band.name}</h3>
                                    <span>{band.members.length} חברים</span>
                                </div>
                                <ChevronDown size={16} style={{ transform: 'rotate(90deg)', opacity: 0.5 }} />
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls Bar (Sticky) */}
            <div className="bands-controls">
                <div className="controls-container">
                    {/* View Tabs */}
                    <div className="view-tabs">
                        <button
                            className={`view-tab ${currentView === 'hiring' ? 'active' : ''}`}
                            onClick={() => handleViewChange('hiring')}
                        >
                            <span className="view-tab-icon">📢</span>
                            לוח דרושים
                        </button>
                        <button
                            className={`view-tab ${currentView === 'active' ? 'active' : ''}`}
                            onClick={() => handleViewChange('active')}
                        >
                            <span className="view-tab-icon">🎸</span>
                            אינדקס להקות
                        </button>
                    </div>

                    {/* Search Bar */}
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

                    {/* Filters */}
                    <div className="filters-bar compact-filters">
                        {/* Match My Instruments */}
                        {currentView === 'hiring' && user?.instruments && user.instruments.length > 0 && (
                            <button
                                className={`filter-chip ${matchMyInstruments ? 'active' : ''}`}
                                onClick={() => setMatchMyInstruments(!matchMyInstruments)}
                            >
                                ✨ מותאם לי
                            </button>
                        )}

                        {/* Genre Dropdown */}
                        <div className="genre-filter-wrapper">
                            <button
                                className={`filter-chip dropdown-trigger ${selectedGenre ? 'active' : ''}`}
                                onClick={() => setIsGenreOpen(!isGenreOpen)}
                            >
                                <Music size={14} />
                                <span>{selectedGenre ? GENRES.find(g => g.id === selectedGenre)?.nameHe : 'סגנון מוזיקלי'}</span>
                                {selectedGenre ? (
                                    <X size={14} className="clear-icon" onClick={(e) => { e.stopPropagation(); setSelectedGenre(null); }} />
                                ) : (
                                    <ChevronDown size={14} />
                                )}
                            </button>
                            {isGenreOpen && (
                                <div className="genre-dropdown-menu">
                                    <div className="genre-grid">
                                        <button className={`genre-option ${!selectedGenre ? 'selected' : ''}`} onClick={() => { setSelectedGenre(null); setIsGenreOpen(false); }}>הכל</button>
                                        {GENRES.map(genre => (
                                            <button key={genre.id} className={`genre-option ${selectedGenre === genre.id ? 'selected' : ''}`} onClick={() => { setSelectedGenre(genre.id); setIsGenreOpen(false); }}>
                                                {genre.nameHe}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Instrument Filter */}
                        <div className="genre-filter-wrapper">
                            <button
                                className={`filter-chip dropdown-trigger ${selectedInstrument ? 'active' : ''}`}
                                onClick={() => setIsInstrumentOpen(!isInstrumentOpen)}
                            >
                                <Guitar size={14} />
                                <span>{selectedInstrument ? INSTRUMENTS.find(i => i.id === selectedInstrument)?.nameHe : 'כלי נגינה'}</span>
                                {selectedInstrument ? (
                                    <X size={14} className="clear-icon" onClick={(e) => { e.stopPropagation(); setSelectedInstrument(null); }} />
                                ) : (
                                    <ChevronDown size={14} />
                                )}
                            </button>
                            {isInstrumentOpen && (
                                <div className="genre-dropdown-menu">
                                    <div className="genre-grid">
                                        <button className={`genre-option ${!selectedInstrument ? 'selected' : ''}`} onClick={() => { setSelectedInstrument(null); setIsInstrumentOpen(false); }}>הכל</button>
                                        {INSTRUMENTS.map(inst => (
                                            <button key={inst.id} className={`genre-option ${selectedInstrument === inst.id ? 'selected' : ''}`} onClick={() => { setSelectedInstrument(inst.id); setIsInstrumentOpen(false); }}>
                                                {inst.icon}{' '}{inst.nameHe}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Material Filter */}
                        {currentView === 'hiring' && (
                            <div className="genre-filter-wrapper">
                                <button
                                    className={`filter-chip dropdown-trigger ${materialFilter !== 'all' ? 'active' : ''}`}
                                    onClick={() => setIsMaterialOpen(!isMaterialOpen)}
                                >
                                    <Percent size={14} />
                                    <span>
                                        {materialFilter === 'all' ? 'סוג חומר' :
                                            materialFilter === 'original' ? 'בעיקר מקורי' :
                                                materialFilter === 'covers' ? 'בעיקר קאברים' : 'משולב'}
                                    </span>
                                    {materialFilter !== 'all' ? (
                                        <X size={14} className="clear-icon" onClick={(e) => { e.stopPropagation(); setMaterialFilter('all'); }} />
                                    ) : (
                                        <ChevronDown size={14} />
                                    )}
                                </button>
                                {isMaterialOpen && (
                                    <div className="genre-dropdown-menu" style={{ minWidth: '200px' }}>
                                        <div className="genre-grid" style={{ gridTemplateColumns: '1fr' }}>
                                            <button className={`genre-option ${materialFilter === 'all' ? 'selected' : ''}`} onClick={() => { setMaterialFilter('all'); setIsMaterialOpen(false); }}>הכל</button>
                                            <button className={`genre-option ${materialFilter === 'original' ? 'selected' : ''}`} onClick={() => { setMaterialFilter('original'); setIsMaterialOpen(false); }}>🎵 בעיקר מקורי</button>
                                            <button className={`genre-option ${materialFilter === 'covers' ? 'selected' : ''}`} onClick={() => { setMaterialFilter('covers'); setIsMaterialOpen(false); }}>🎤 בעיקר קאברים</button>
                                            <button className={`genre-option ${materialFilter === 'mix' ? 'selected' : ''}`} onClick={() => { setMaterialFilter('mix'); setIsMaterialOpen(false); }}>🔀 משולב</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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

                {/* Specific Content per Type */}
                {type === 'hiring' ? (
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
                ) : (
                    <div className="card-members-section">
                        <div className="card-members mb-sm">
                            <div className="member-stack">
                                {anyItem.members?.slice(0, 3).map((m: any) => {
                                    const u = users[m.userId];
                                    return u?.avatarUrl ? (
                                        <img key={m.userId} src={u.avatarUrl} alt="" />
                                    ) : null;
                                })}
                            </div>
                            <span className="members-count-label text-xs text-secondary">
                                {anyItem.members?.length} חברים
                            </span>
                        </div>
                        <BandProgress band={item as Band} compact={true} />
                    </div>
                )}
            </div>
        </Link>
    );
}
