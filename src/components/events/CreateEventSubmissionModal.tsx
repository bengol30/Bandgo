// ============================================
// bandgo - Create Event Submission Modal
// Users submit events for admin approval
// ============================================

import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, MapPin, Clock, Users, Ticket, Music, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { EventType, Band, EventSubmission } from '../../types';
import './EditEventModal.css'; // Reuse same styles

interface CreateEventSubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmitted?: () => void;
    onSuccess?: () => void;
    initialData?: EventSubmission | null;
}

const eventTypeOptions: { value: EventType; label: string }[] = [
    { value: EventType.JAM, label: "ג'אם" },
    { value: EventType.BAND_PERFORMANCE, label: 'הופעה' },
    { value: EventType.SHARED_PERFORMANCE, label: 'ערב להקות' },
    { value: EventType.OPEN_SESSION, label: 'סשן פתוח' },
    { value: EventType.WORKSHOP, label: 'סדנה' },
    { value: EventType.OTHER, label: 'אחר' },
];

export function CreateEventSubmissionModal({ isOpen, onClose, onSubmitted, onSuccess, initialData }: CreateEventSubmissionModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [myBands, setMyBands] = useState<Band[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState<EventType>(EventType.JAM);
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [locationText, setLocationText] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [registrationEnabled, setRegistrationEnabled] = useState(false);
    const [capacity, setCapacity] = useState<number | ''>('');
    const [price, setPrice] = useState(0);
    const [relatedBandId, setRelatedBandId] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            // Load user's bands
            repository.getBands().then(bands => {
                const mine = bands.filter(b => b.members.some(m => m.userId === user.id));
                setMyBands(mine);
            }).catch(err => console.error('Failed to load bands:', err));

            if (initialData) {
                // Edit Mode
                setTitle(initialData.title);
                setType(initialData.type);
                setDescription(initialData.description);
                setStartDate(new Date(initialData.startAt).toISOString().slice(0, 16));
                setEndDate(new Date(initialData.endAt).toISOString().slice(0, 16));
                setLocationText(initialData.locationText);
                setCoverUrl(initialData.coverUrl || '');
                setRegistrationEnabled(initialData.registrationEnabled || false);
                setCapacity(initialData.capacity || '');
                setPrice(initialData.price || 0);
                setRelatedBandId(initialData.relatedBandId || '');
            } else {
                // Create Mode
                setTitle('');
                setType(EventType.JAM);
                setDescription('');
                setStartDate('');
                setEndDate('');
                setLocationText('');
                setCoverUrl('');
                setRegistrationEnabled(false);
                setCapacity('');
                setPrice(0);
                setRelatedBandId('');
            }
        }
    }, [isOpen, user, initialData]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            showToast('יש להזין שם אירוע', 'error');
            return;
        }
        if (!startDate) {
            showToast('יש לבחור תאריך התחלה', 'error');
            return;
        }
        if (!endDate) {
            showToast('יש לבחור תאריך סיום', 'error');
            return;
        }
        if (new Date(endDate) <= new Date(startDate)) {
            showToast('שעת הסיום חייבת להיות אחרי שעת ההתחלה', 'error');
            return;
        }
        if (new Date(startDate) < new Date()) {
            showToast('לא ניתן לשלוח אירוע בתאריך שעבר', 'error');
            return;
        }
        if (!locationText.trim()) {
            showToast('יש להזין מיקום', 'error');
            return;
        }
        if (!description.trim()) {
            showToast('יש להזין תיאור', 'error');
            return;
        }

        try {
            setLoading(true);

            const submissionData = {
                title: title.trim(),
                type,
                description: description.trim(),
                startAt: new Date(startDate),
                endAt: new Date(endDate),
                locationText: locationText.trim(),
                coverUrl: coverUrl.trim() || undefined,
                registrationEnabled,
                capacity: capacity ? Number(capacity) : undefined,
                price,
                relatedBandId: relatedBandId || undefined,
            };

            if (initialData) {
                await repository.updateEventSubmission(initialData.id, submissionData);
                showToast('הבקשה עודכנה בהצלחה', 'success');
            } else {
                await repository.createEventSubmission({
                    ...submissionData,
                    submittedByUserId: user.id,
                    hostUserId: user.id,
                    updatedAt: new Date(),
                });
                showToast('הבקשה נשלחה לאישור! 🎉', 'success');
            }

            if (onSuccess && typeof onSuccess === 'function') onSuccess();
            if (onSubmitted && typeof onSubmitted === 'function') onSubmitted();
            onClose();
        } catch (error) {
            console.error('Failed to submit event:', error);
            showToast('שגיאה בשליחת הבקשה', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="edit-event-modal">
                <div className="edit-event-header">
                    <div className="edit-event-title">
                        <Calendar size={24} className="text-primary" />
                        <span>הגש אירוע חדש</span>
                    </div>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-event-content">
                    {/* General Section */}
                    <div className="form-grid">
                        <div className="edit-section-title">
                            <Music size={18} />
                            <span>פרטי האירוע</span>
                        </div>

                        <div className="full-width">
                            <label className="form-label">שם אירוע *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="למשל: ג'אם ערב שישי בפטיפון"
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">סוג אירוע *</label>
                            <select
                                className="form-select"
                                value={type}
                                onChange={e => setType(e.target.value as EventType)}
                            >
                                {eventTypeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="form-label">מיקום *</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="form-input pl-10"
                                    value={locationText}
                                    onChange={e => setLocationText(e.target.value)}
                                    placeholder="שם המקום + כתובת"
                                    required
                                />
                                <MapPin size={16} className="absolute left-3 top-3 text-secondary" />
                            </div>
                        </div>

                        <div className="full-width">
                            <label className="form-label">תיאור קצר *</label>
                            <textarea
                                className="form-textarea"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="ספרו על האירוע — מה יהיה, למי מתאים, מה לצפות..."
                                required
                            />
                        </div>
                    </div>

                    {/* Time Section */}
                    <div className="form-grid mt-lg">
                        <div className="edit-section-title">
                            <Clock size={18} />
                            <span>תאריך ושעה</span>
                        </div>

                        <div>
                            <label className="form-label">התחלה *</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">סיום *</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Registration Section */}
                    <div className="form-grid mt-lg">
                        <div className="edit-section-title">
                            <Ticket size={18} />
                            <span>הרשמה</span>
                        </div>

                        <div className="full-width">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={registrationEnabled}
                                    onChange={e => setRegistrationEnabled(e.target.checked)}
                                />
                                <span>האם יש הרשמה לאירוע?</span>
                            </label>
                        </div>

                        {registrationEnabled && (
                            <>
                                <div>
                                    <label className="form-label">כמות מקומות</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={capacity}
                                        onChange={e => setCapacity(e.target.value ? Number(e.target.value) : '')}
                                        min={1}
                                        placeholder="ללא הגבלה"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">עלות (₪)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={price}
                                        onChange={e => setPrice(Number(e.target.value))}
                                        min={0}
                                    />
                                    <p className="text-xs text-secondary mt-1">השאר 0 לחינם</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Optional Section */}
                    <div className="form-grid mt-lg">
                        <div className="edit-section-title">
                            <Users size={18} />
                            <span>אופציונלי</span>
                        </div>

                        {myBands.length > 0 && (
                            <div>
                                <label className="form-label">קשור ללהקה</label>
                                <select
                                    className="form-select"
                                    value={relatedBandId}
                                    onChange={e => setRelatedBandId(e.target.value)}
                                >
                                    <option value="">ללא</option>
                                    {myBands.map(band => (
                                        <option key={band.id} value={band.id}>{band.name || `להקה ${band.id.slice(0, 6)}`}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className={myBands.length > 0 ? '' : 'full-width'}>
                            <label className="form-label">תמונת קאבר (URL)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="form-input pl-10"
                                    value={coverUrl}
                                    onChange={e => setCoverUrl(e.target.value)}
                                    placeholder="https://..."
                                />
                                <ImageIcon size={16} className="absolute left-3 top-3 text-secondary" />
                            </div>
                        </div>
                    </div>

                    <div className="edit-event-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner spinner-white spinner-sm"></span> : <Send size={18} />}
                            <span>שלח לאישור</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
