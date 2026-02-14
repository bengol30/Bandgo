
import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, MapPin, Clock, Ticket, Music, Shield, Info, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Event, EventType } from '../../types';
import './EditEventModal.css';

interface EditEventModalProps {
    event: Event;
    isOpen: boolean;
    onClose: () => void;
    onEventUpdated: (event: Event) => void;
}

export function EditEventModal({ event, isOpen, onClose, onEventUpdated }: EditEventModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState(event.title);
    const [description, setDescription] = useState(event.description);
    const [type, setType] = useState<EventType>(event.type);
    const [location, setLocation] = useState(event.location);
    const [dateTime, setDateTime] = useState(new Date(event.dateTime).toISOString().slice(0, 16));
    const [durationMinutes, setDurationMinutes] = useState(event.durationMinutes);
    const [capacity, setCapacity] = useState(event.capacity || 0);
    const [price, setPrice] = useState(event.price || 0);
    const [coverImageUrl, setCoverImageUrl] = useState(event.coverImageUrl || '');

    // Advanced Details
    const [backlineProvided, setBacklineProvided] = useState(event.backlineProvided || '');
    const [ticketLink, setTicketLink] = useState(event.ticketLink || '');
    const [ticketPrice, setTicketPrice] = useState(event.ticketPrice || 0); // Is this redundant with price? Let's assume price is internal/display and ticketPrice might be external? 
    // Actually, let's just use 'price' for internal registration and 'ticketLink' for external. 
    // But if ticketLink is present, maybe we shouldn't allow internal registration? 
    // For now, let's keep it simple. 'price' is what shows on the card.

    const [ageRestriction, setAgeRestriction] = useState(event.ageRestriction || '');
    const [whatsappGroupId, setWhatsappGroupId] = useState(event.whatsappGroupId || '');
    const [isAccessible, setIsAccessible] = useState(event.isAccessible || false);

    useEffect(() => {
        if (isOpen) {
            setTitle(event.title);
            setDescription(event.description);
            setType(event.type);
            setLocation(event.location);
            setDateTime(new Date(event.dateTime).toISOString().slice(0, 16));
            setDurationMinutes(event.durationMinutes);
            setCapacity(event.capacity || 0);
            setPrice(event.price || 0);
            setCoverImageUrl(event.coverImageUrl || '');
            setBacklineProvided(event.backlineProvided || '');
            setTicketLink(event.ticketLink || '');
            setTicketPrice(event.ticketPrice || 0);
            setAgeRestriction(event.ageRestriction || '');
            setWhatsappGroupId(event.whatsappGroupId || '');
            setIsAccessible(event.isAccessible || false);
        }
    }, [isOpen, event]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updatedEvent = await localRepository.updateEvent(event.id, {
                title,
                description,
                type,
                location,
                dateTime: new Date(dateTime),
                durationMinutes: Number(durationMinutes),
                capacity: Number(capacity),
                price: Number(price),
                coverImageUrl,
                backlineProvided,
                ticketLink,
                ticketPrice: Number(ticketPrice),
                ageRestriction,
                whatsappGroupId,
                isAccessible
            });

            onEventUpdated(updatedEvent);
            showToast('האירוע עודכן בהצלחה', 'success');
            onClose();
        } catch (error) {
            console.error('Failed to update event:', error);
            showToast('שגיאה בעדכון האירוע', 'error');
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
                        <span>עריכת פרטי אירוע</span>
                    </div>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="edit-event-content">

                    {/* General Section */}
                    <div className="form-grid">
                        <div className="edit-section-title">
                            <Info size={18} />
                            <span>מידע כללי</span>
                        </div>

                        <div className="full-width">
                            <label className="form-label">שם האירוע</label>
                            <input
                                type="text"
                                className="form-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">סוג אירוע</label>
                            <select
                                className="form-select"
                                value={type}
                                onChange={e => setType(e.target.value as EventType)}
                            >
                                <option value={EventType.JAM}>ג'אם</option>
                                <option value={EventType.BAND_PERFORMANCE}>הופעה</option>
                                <option value={EventType.SHARED_PERFORMANCE}>ערב להקות</option>
                                <option value={EventType.OPEN_SESSION}>סשן פתוח</option>
                                <option value={EventType.WORKSHOP}>סדנה</option>
                                <option value={EventType.OTHER}>אחר</option>
                            </select>
                        </div>

                        <div>
                            <label className="form-label">מיקום</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="form-input pl-10"
                                    value={location}
                                    onChange={e => setLocation(e.target.value)}
                                    required
                                />
                                <MapPin size={16} className="absolute left-3 top-3 text-secondary" />
                            </div>
                        </div>

                        <div className="full-width">
                            <label className="form-label">תיאור</label>
                            <textarea
                                className="form-textarea"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="full-width">
                            <label className="form-label">קישור לתמונה (URL)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={coverImageUrl}
                                onChange={e => setCoverImageUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Time Section */}
                    <div className="form-grid mt-lg">
                        <div className="edit-section-title">
                            <Clock size={18} />
                            <span>זמנים</span>
                        </div>

                        <div>
                            <label className="form-label">תאריך ושעה</label>
                            <input
                                type="datetime-local"
                                className="form-input"
                                value={dateTime}
                                onChange={e => setDateTime(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="form-label">משך (דקות)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={durationMinutes}
                                onChange={e => setDurationMinutes(Number(e.target.value))}
                                min={15}
                            />
                        </div>
                    </div>

                    {/* Registration Section */}
                    <div className="form-grid mt-lg">
                        <div className="edit-section-title">
                            <Ticket size={18} />
                            <span>הרשמה וכרטיסים</span>
                        </div>

                        <div>
                            <label className="form-label">מחיר הרשמה מערכת (₪)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={price}
                                onChange={e => setPrice(Number(e.target.value))}
                                min={0}
                            />
                            <p className="text-xs text-secondary mt-1">השאר 0 לחינם</p>
                        </div>

                        <div>
                            <label className="form-label">הגבלת משתתפים</label>
                            <input
                                type="number"
                                className="form-input"
                                value={capacity}
                                onChange={e => setCapacity(Number(e.target.value))}
                                min={0}
                            />
                            <p className="text-xs text-secondary mt-1">0 = ללא הגבלה</p>
                        </div>

                        <div className="full-width">
                            <label className="form-label">קישור לרכישת כרטיסים (חיצוני)</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="form-input pl-10"
                                    value={ticketLink}
                                    onChange={e => setTicketLink(e.target.value)}
                                    placeholder="https://eventer.co.il/..."
                                />
                                <LinkIcon size={16} className="absolute left-3 top-3 text-secondary" />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Details */}
                    <div className="form-grid mt-lg">
                        <div className="edit-section-title">
                            <Shield size={18} />
                            <span>פרטים מתקדמים</span>
                        </div>

                        <div className="full-width">
                            <label className="form-label">Backline (ציוד קיים)</label>
                            <textarea
                                className="form-textarea"
                                rows={2}
                                value={backlineProvided}
                                onChange={e => setBacklineProvided(e.target.value)}
                                placeholder="למשל: תופים מלאים, מגברי גיטרה Fender & Marshall, מיקרופונים..."
                            />
                        </div>

                        <div>
                            <label className="form-label">הגבלת גיל</label>
                            <input
                                type="text"
                                className="form-input"
                                value={ageRestriction}
                                onChange={e => setAgeRestriction(e.target.value)}
                                placeholder="למשל: 18+, לכל המשפחה"
                            />
                        </div>

                        <div>
                            <label className="form-label">קבוצת WhatsApp לאירוע</label>
                            <input
                                type="text"
                                className="form-input"
                                value={whatsappGroupId}
                                onChange={e => setWhatsappGroupId(e.target.value)}
                                placeholder="קישור לקבוצה"
                            />
                        </div>

                        <div className="full-width mt-md">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isAccessible}
                                    onChange={e => setIsAccessible(e.target.checked)}
                                />
                                <span>נגיש לבעלי מוגבלויות ♿</span>
                            </label>
                        </div>
                    </div>

                    <div className="edit-event-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner spinner-white spinner-sm"></span> : <Save size={18} />}
                            <span>שמור שינויים</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
