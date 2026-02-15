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
import { INSTRUMENTS, GENRES, REGIONS } from '../../data/constants';
import { getInstrumentName, getInstrumentIcon } from '../../utils';
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

    // Targeted specific
    const [instrumentSlots, setInstrumentSlots] = useState<InstrumentSlot[]>([]);

    // Open specific
    const [maxMembers, setMaxMembers] = useState(4);

    // Instrument Selector Modal
    const [showInstrumentModal, setShowInstrumentModal] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

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
        if (selectedGenres.length === 0) {
            showToast('נא לבחור לפחות סגנון אחד', 'error');
            return;
        }

        try {
            setLoading(true);

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
                instrumentSlots: type === BandRequestType.TARGETED ? instrumentSlots : undefined,
                maxMembers: type === BandRequestType.OPEN ? maxMembers : undefined,
                currentMembers: [user.id],
                sketches: [],
                sketchPending: false,
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
                                <h3>כלים דרושים</h3>
                                {instrumentSlots.map((slot, index) => (
                                    <div key={index} className="slot-row">
                                        <div
                                            className="slot-instrument-btn"
                                            onClick={() => {
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
                            className={`instrument-option-card ${activeSlotIndex !== null && instrumentSlots[activeSlotIndex]?.instrumentId === inst.id ? 'active' : ''}`}
                            onClick={() => {
                                if (activeSlotIndex !== null) {
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
        </div>
    );
}
