// ============================================
// bandgo - Create Band Request Page
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Check, Music, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Modal } from '../../components/Modal';
import { repository } from '../../repositories';
import { BandRequestType, BandRequestStatus, InstrumentSlot } from '../../types';
import { BAND_ROLES, GENRES, INSTRUMENTS, REGIONS, BAND_COVER_OPTIONS } from '../../data/constants';
import { getInstrumentName, getInstrumentIcon, getRoleName } from '../../utils';
import './CreateBandRequest.css';

export function CreateBandRequestPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<BandRequestType>(BandRequestType.TARGETED);
    const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
    const [city, setCity] = useState(user?.city || '');
    const [region, setRegion] = useState(user?.region || 'north');
    const [originalVsCoverRatio, setOriginalVsCoverRatio] = useState(50);

    // Creator Role State
    const [creatorRoles, setCreatorRoles] = useState<{ kind: 'INSTRUMENT' | 'ROLE', value: string }[]>([]);
    const [showRoleSelector, setShowRoleSelector] = useState(false);

    const handleAddCreatorRole = (role: { kind: 'INSTRUMENT' | 'ROLE', value: string }) => {
        // Prevent duplicates
        if (creatorRoles.some(r => r.kind === role.kind && r.value === role.value)) {
            showToast('התפקיד כבר נבחר', 'warning');
            return;
        }
        setCreatorRoles([...creatorRoles, role]);
    };

    const handleRemoveCreatorRole = (index: number) => {
        const newRoles = [...creatorRoles];
        newRoles.splice(index, 1);
        setCreatorRoles(newRoles);
    };

    // Targeted specific
    const [instrumentSlots, setInstrumentSlots] = useState<InstrumentSlot[]>([]);

    // Open specific
    const [maxMembers, setMaxMembers] = useState(4);

    // Cover Image
    const [selectedCoverUrl, setSelectedCoverUrl] = useState('');
    const [customCoverUrl, setCustomCoverUrl] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [showCoverModal, setShowCoverModal] = useState(false);

    // Instrument Selector Modal (Shared for Slots and Creator)
    const [showInstrumentModal, setShowInstrumentModal] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null); // null means creator slot if modal is open for creator
    const [isSelectingForCreator, setIsSelectingForCreator] = useState(false);

    const handleAddSlot = () => {
        setInstrumentSlots([...instrumentSlots, { instrumentId: 'guitar', quantity: 1, filledBy: [] }]);
    };

    const handleRemoveSlot = (index: number) => {
        const newSlots = [...instrumentSlots];
        newSlots.splice(index, 1);
        setInstrumentSlots(newSlots);
    };

    const handleSlotChange = (index: number, field: keyof InstrumentSlot, value: any) => {
        const newSlots = [...instrumentSlots];
        (newSlots[index] as any)[field] = value;
        setInstrumentSlots(newSlots);
    };

    const toggleGenre = (genreId: string) => {
        if (selectedGenres.includes(genreId)) {
            setSelectedGenres(selectedGenres.filter(g => g !== genreId));
        } else {
            if (selectedGenres.length >= 5) {
                showToast('ניתן לבחור עד 5 סגנונות', 'warning');
                return;
            }
            setSelectedGenres([...selectedGenres, genreId]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        if (!title.trim()) {
            showToast('נא להזין כותרת', 'error');
            return;
        }
        if (creatorRoles.length === 0) {
            showToast('נא לבחור לפחות תפקיד אחד בהרכב', 'error');
            return;
        }
        if (selectedGenres.length === 0) {
            showToast('נא לבחור לפחות סגנון אחד', 'error');
            return;
        }
        if (!selectedCoverUrl && !imageFile && !customCoverUrl) {
            showToast('נא לבחור תמונת קאבר', 'error');
            return;
        }

        try {
            setLoading(true);

            let finalCoverUrl = selectedCoverUrl;

            // Upload image if file selected
            if (imageFile) {
                try {
                    const path = `bands/covers/${user.id}_${Date.now()}_${imageFile.name}`;
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

            await repository.createBandRequest({
                creatorId: user.id,
                title,
                description,
                type,
                status: BandRequestStatus.OPEN,
                genres: selectedGenres,
                city,
                region,
                radiusKm: 30, // Default
                originalVsCoverRatio,
                creatorRoles,
                creatorSlot: creatorRoles[0], // Backward compatibility: user first role as primary slot
                instrumentSlots: type === BandRequestType.TARGETED ? instrumentSlots : undefined,
                maxMembers: type === BandRequestType.OPEN ? maxMembers : undefined,
                currentMembers: [user.id],
                sketches: [],
                sketchPending: false,
                coverImageUrl: finalCoverUrl,
            });

            showToast('ההרכב נוצר בהצלחה!', 'success');
            navigate('/requests');
        } catch (error) {
            console.error('Failed to create request:', error);
            showToast('שגיאה ביצירת ההרכב', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page page-create-request">
            <div className="container">
                <div className="create-header">
                    <button className="btn btn-icon btn-ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1>יצירת הרכב חדש</h1>
                </div>

                <form onSubmit={handleSubmit} className="create-form">

                    {/* Basic Info */}
                    <section className="form-section">
                        <h2>פרטים בסיסיים</h2>

                        <div className="form-group">
                            <label>שם ההרכב / הפרויקט</label>
                            <input
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="למשל: להקת רוק מקורית"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>תיאור</label>
                            <textarea
                                className="form-textarea"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="ספר קצת על הפרויקט, המטרות והאווירה..."
                                rows={4}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>עיר</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>אזור</label>
                                <select
                                    className="form-select"
                                    value={region}
                                    onChange={e => setRegion(e.target.value)}
                                >
                                    {REGIONS.map(r => (
                                        <option key={r.id} value={r.id}>{r.nameHe}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Creator Role Selection */}
                    <section className="form-section">
                        <h2>התפקיד שלי בהרכב (חובה)</h2>
                        <p className="text-secondary text-sm mb-4">בחר כלי נגינה או תפקידים שאתה ממלא בפרויקט (ניתן לבחור יותר מאחד)</p>

                        <div className="creator-roles-list flex flex-wrap gap-sm mb-4">
                            {creatorRoles.map((role, index) => (
                                <div key={index} className="selected-role-chip flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1">
                                    {role.kind === 'INSTRUMENT' ? (
                                        <>
                                            <span>{getInstrumentIcon(role.value)}</span>
                                            <span>{getInstrumentName(role.value)}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🎤</span>
                                            <span>{getRoleName(role.value)}</span>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        className="hover:text-error"
                                        onClick={() => handleRemoveCreatorRole(index)}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="role-actions flex gap-3">
                            <button
                                type="button"
                                className="btn btn-outline flex-1 flex items-center justify-center gap-2"
                                onClick={() => {
                                    setIsSelectingForCreator(true);
                                    setShowInstrumentModal(true);
                                }}
                            >
                                <Music size={18} />
                                הוסף כלי נגינה
                            </button>

                            <div className="relative flex-1">
                                <button
                                    type="button"
                                    className="btn btn-outline w-full flex items-center justify-center gap-2"
                                    onClick={() => setShowRoleSelector(!showRoleSelector)}
                                >
                                    <span>🎤</span>
                                    הוסף תפקיד כללי
                                </button>

                                {showRoleSelector && (
                                    <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-surface border border-border rounded-lg shadow-xl z-20">
                                        <div className="grid grid-cols-2 gap-2">
                                            {BAND_ROLES.map(role => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    className="text-right px-3 py-2 hover:bg-bg-secondary rounded text-sm"
                                                    onClick={() => {
                                                        handleAddCreatorRole({ kind: 'ROLE', value: role.id });
                                                        setShowRoleSelector(false);
                                                    }}
                                                >
                                                    {role.nameHe}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Type & Roles */}
                    <section className="form-section">
                        <h2>סוג ההרכב</h2>

                        <div className="type-selector">
                            <div
                                className={`type-card ${type === BandRequestType.TARGETED ? 'selected' : ''}`}
                                onClick={() => setType(BandRequestType.TARGETED)}
                            >
                                <div className="type-icon">🎯</div>
                                <h3>חיפוש ממוקד</h3>
                                <p>אני יודע בדיוק אילו כלים חסרים לי</p>
                            </div>
                            <div
                                className={`type-card ${type === BandRequestType.OPEN ? 'selected' : ''}`}
                                onClick={() => setType(BandRequestType.OPEN)}
                            >
                                <div className="type-icon">🎲</div>
                                <h3>הרכב פתוח</h3>
                                <p>כל מי שרוצה מוזמן להצטרף</p>
                            </div>
                        </div>

                        {type === BandRequestType.TARGETED ? (
                            <div className="slots-editor">
                                <h3>כלים דרושים (בנוסף אליך)</h3>
                                {instrumentSlots.map((slot, index) => (
                                    <div key={index} className="slot-row">
                                        <div
                                            className="slot-instrument-btn"
                                            onClick={() => {
                                                setIsSelectingForCreator(false);
                                                setActiveSlotIndex(index);
                                                setShowInstrumentModal(true);
                                            }}
                                        >
                                            <span className="selected-inst-icon">{getInstrumentIcon(slot.instrumentId)}</span>
                                            <span className="selected-inst-name">{getInstrumentName(slot.instrumentId)}</span>
                                            <span className="change-inst-label">שנה</span>
                                        </div>
                                        <input
                                            type="number"
                                            className="form-input slot-quantity"
                                            value={slot.quantity}
                                            onChange={e => handleSlotChange(index, 'quantity', parseInt(e.target.value))}
                                            min={1}
                                            max={5}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-ghost slot-remove"
                                            onClick={() => handleRemoveSlot(index)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-outline btn-sm" onClick={handleAddSlot}>
                                    <Plus size={16} />
                                    הוסף כלי
                                </button>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>מספר חברים מקסימלי</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={maxMembers}
                                    onChange={e => setMaxMembers(parseInt(e.target.value))}
                                    min={2}
                                    max={20}
                                />
                            </div>
                        )}
                    </section>

                    {/* Music Style */}
                    <section className="form-section">
                        <h2>סגנון מוזיקלי</h2>

                        <div className="form-group">
                            <label>סגנונות (עד 5)</label>
                            <div className="genres-grid">
                                {GENRES.map(genre => (
                                    <div
                                        key={genre.id}
                                        className={`genre-chip ${selectedGenres.includes(genre.id) ? 'selected' : ''}`}
                                        onClick={() => toggleGenre(genre.id)}
                                    >
                                        {selectedGenres.includes(genre.id) && <Check size={14} />}
                                        {genre.nameHe}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>יחס מקורי / קאברים: {originalVsCoverRatio}% מקורי</label>
                            <input
                                type="range"
                                className="form-range"
                                min="0"
                                max="100"
                                step="10"
                                value={originalVsCoverRatio}
                                onChange={e => setOriginalVsCoverRatio(parseInt(e.target.value))}
                            />
                            <div className="range-labels">
                                <span>רק קאברים</span>
                                <span>רק מקורי</span>
                            </div>
                        </div>
                    </section>

                    {/* Cover Image */}
                    <section className="form-section">
                        <h2>תמונת קאבר</h2>
                        <p className="text-secondary text-sm mb-4">בחר תמונה שתייצג את ההרכב שלך</p>

                        <div className="cover-image-section">
                            {/* Selected Image Preview */}
                            <div className="selected-cover-preview">
                                {selectedCoverUrl ? (
                                    <div className="preview-container">
                                        <img src={selectedCoverUrl} alt="Selected cover" />
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-danger remove-cover-btn"
                                            onClick={() => {
                                                setSelectedCoverUrl('');
                                                setCustomCoverUrl('');
                                                setImageFile(null);
                                            }}
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="no-cover-placeholder">
                                        <div className="placeholder-icon">📷</div>
                                        <span>לא נבחרה תמונה</span>
                                    </div>
                                )}
                            </div>

                            <div className="cover-actions">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => setShowCoverModal(true)}
                                >
                                    <Music size={18} className="me-2" />
                                    בחר ממאגר התמונות
                                </button>

                                <div className="file-upload-wrapper">
                                    <input
                                        type="file"
                                        id="cover-upload"
                                        accept="image/*"
                                        className="hidden-file-input"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setImageFile(file);
                                                setSelectedCoverUrl(URL.createObjectURL(file));
                                                setCustomCoverUrl(''); // Clear custom URL if file selected
                                            }
                                        }}
                                    />
                                    <label htmlFor="cover-upload" className="btn btn-outline">
                                        <Plus size={18} className="me-2" />
                                        העלה תמונה מהמכשיר
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-block"
                            disabled={loading}
                        >
                            {loading ? <div className="spinner spinner-sm"></div> : 'צור הרכב'}
                        </button>
                    </div>

                </form>
            </div>

            {/* Instrument Selector Modal */}
            <Modal
                isOpen={showInstrumentModal}
                onClose={() => setShowInstrumentModal(false)}
                title="בחר כלי נגינה"
            >
                <div className="instrument-grid">
                    {INSTRUMENTS.map(inst => (
                        <div
                            key={inst.id}
                            className={`instrument-option-card ${(isSelectingForCreator && creatorRoles.some(r => r.kind === 'INSTRUMENT' && r.value === inst.id)) ||
                                (!isSelectingForCreator && activeSlotIndex !== null && instrumentSlots[activeSlotIndex]?.instrumentId === inst.id)
                                ? 'active' : ''
                                }`}
                            onClick={() => {
                                if (isSelectingForCreator) {
                                    handleAddCreatorRole({ kind: 'INSTRUMENT', value: inst.id });
                                    setShowInstrumentModal(false);
                                } else if (activeSlotIndex !== null) {
                                    handleSlotChange(activeSlotIndex, 'instrumentId', inst.id);
                                    setShowInstrumentModal(false);
                                }
                            }}
                        >
                            <span className="instrument-icon-lg">{inst.icon}</span>
                            <span className="instrument-name">{inst.nameHe}</span>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Cover Image Modal */}
            <Modal
                isOpen={showCoverModal}
                onClose={() => setShowCoverModal(false)}
                title="בחר תמונת קאבר"
            >
                <div className="cover-selection-grid-modal">
                    {BAND_COVER_OPTIONS.map((url, index) => (
                        <div
                            key={index}
                            className={`cover-option ${selectedCoverUrl === url ? 'selected' : ''}`}
                            onClick={() => {
                                setSelectedCoverUrl(url);
                                setCustomCoverUrl('');
                                setImageFile(null);
                                setShowCoverModal(false);
                            }}
                        >
                            <img src={url} alt={`Cover option ${index + 1}`} />
                            {selectedCoverUrl === url && (
                                <div className="selected-overlay">
                                    <Check size={24} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>
        </div>
    );
}
