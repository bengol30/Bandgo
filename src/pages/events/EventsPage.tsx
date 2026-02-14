// ============================================
// bandgo - Events Page
// Shows project events with registration
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Ticket } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Event, EventType, EventRegistration, EventSubmission, EventSubmissionStatus } from '../../types';
import { CreateEventSubmissionModal } from '../../components/events/CreateEventSubmissionModal';
import './Events.css';

const eventTypeLabels: Record<EventType, string> = {
    [EventType.JAM]: "ג'אם",
    [EventType.BAND_PERFORMANCE]: 'הופעה',
    [EventType.SHARED_PERFORMANCE]: 'ערב להקות',
    [EventType.OPEN_SESSION]: 'סשן פתוח',
    [EventType.WORKSHOP]: 'סדנה',
    [EventType.OTHER]: 'אירוע',
};

const eventTypeClasses: Record<EventType, string> = {
    [EventType.JAM]: 'jam',
    [EventType.BAND_PERFORMANCE]: 'performance',
    [EventType.SHARED_PERFORMANCE]: 'performance',
    [EventType.OPEN_SESSION]: 'jam',
    [EventType.WORKSHOP]: 'workshop',
    [EventType.OTHER]: 'jam',
};

export function EventsPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [events, setEvents] = useState<Event[]>([]);
    const [myRegistrations, setMyRegistrations] = useState<Set<string>>(new Set());
    const [registrationCounts, setRegistrationCounts] = useState<Record<string, number>>({});
    const [mySubmissions, setMySubmissions] = useState<EventSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [viewMode, setViewMode] = useState<'events' | 'submissions'>('events');

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const eventsData = await localRepository.getEvents();
            setEvents(eventsData);

            // Load registration counts
            const counts: Record<string, number> = {};
            for (const event of eventsData) {
                const regs = await localRepository.getEventRegistrations(event.id);
                counts[event.id] = regs.filter(r => r.status !== 'cancelled').length;
            }
            setRegistrationCounts(counts);

            setRegistrationCounts(counts);

            // Load my registrations & submissions
            if (user) {
                const myRegs = await localRepository.getMyEventRegistrations(user.id);
                setMyRegistrations(new Set(myRegs.map(r => r.eventId)));

                const mySubs = await localRepository.getMyEventSubmissions(user.id);
                setMySubmissions(mySubs);
            }
        } catch (error) {
            console.error('Failed to load events:', error);
            showToast('שגיאה בטעינת האירועים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (eventId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            showToast('יש להתחבר כדי להירשם לאירוע', 'warning');
            return;
        }

        try {
            if (myRegistrations.has(eventId)) {
                await localRepository.cancelRegistration(eventId, user.id);
                setMyRegistrations(prev => {
                    const next = new Set(prev);
                    next.delete(eventId);
                    return next;
                });
                setRegistrationCounts(prev => ({
                    ...prev,
                    [eventId]: Math.max(0, (prev[eventId] || 0) - 1),
                }));
                showToast('ההרשמה בוטלה', 'info');
            } else {
                await localRepository.registerForEvent(eventId, user.id);
                setMyRegistrations(prev => new Set(prev).add(eventId));
                setRegistrationCounts(prev => ({
                    ...prev,
                    [eventId]: (prev[eventId] || 0) + 1,
                }));
                showToast('נרשמת לאירוע בהצלחה!', 'success');
            }
        } catch (error) {
            showToast('שגיאה בהרשמה לאירוע', 'error');
        }
    };

    const formatDate = (date: Date) => {
        const d = new Date(date);
        return {
            day: d.getDate(),
            month: d.toLocaleDateString('he-IL', { month: 'short' }),
            time: d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
            full: d.toLocaleDateString('he-IL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }),
        };
    };

    const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} דקות`;
        if (mins === 0) return `${hours} שעות`;
        return `${hours}:${mins.toString().padStart(2, '0')} שעות`;
    };

    const filteredEvents = selectedType === 'all'
        ? events
        : events.filter(e => e.type === selectedType);

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
        <div className="page-container events-page">
            <div className="page-header">
                <div>
                    <h1>לוח אירועים</h1>
                    <p>ג'אמים, הופעות וסדנאות בקהילה</p>
                </div>
                {user && (
                    <div className="flex gap-2">
                        <button
                            className={`btn ${viewMode === 'submissions' ? 'btn-secondary' : 'btn-ghost'}`}
                            onClick={() => setViewMode(viewMode === 'events' ? 'submissions' : 'events')}
                        >
                            {viewMode === 'events' ? 'ההגשות שלי' : 'חזרה לאירועים'}
                            {mySubmissions.length > 0 && <span className="badge badge-primary mr-2">{mySubmissions.length}</span>}
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                            + הוסף אירוע
                        </button>
                    </div>
                )}
            </div>

            {viewMode === 'submissions' ? (
                <div className="submissions-list">
                    {mySubmissions.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} className="text-secondary mb-4" />
                            <h3>אין לך הגשות עדיין</h3>
                            <button className="btn btn-link" onClick={() => setShowCreateModal(true)}>
                                הרשמת אירוע חדש?
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {mySubmissions.map(sub => (
                                <div key={sub.id} className="card p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-2 h-12 rounded-full ${sub.status === 'approved' ? 'bg-success' :
                                            sub.status === 'rejected' ? 'bg-error' :
                                                sub.status === 'needs_changes' ? 'bg-warning' : 'bg-secondary'
                                            }`}></div>
                                        <div>
                                            <h3 className="font-bold text-lg">{sub.title}</h3>
                                            <div className="flex gap-4 text-sm text-secondary">
                                                <span>{new Date(sub.startAt).toLocaleDateString()}</span>
                                                <span>{eventTypeLabels[sub.type]}</span>
                                            </div>
                                            {sub.adminNote && (
                                                <p className="text-warning text-sm mt-1">הערת מנהל: {sub.adminNote}</p>
                                            )}
                                            {sub.rejectionReason && (
                                                <p className="text-error text-sm mt-1">סיבת דחייה: {sub.rejectionReason}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`badge ${sub.status === 'approved' ? 'badge-success' :
                                            sub.status === 'rejected' ? 'badge-error' :
                                                sub.status === 'needs_changes' ? 'badge-warning' : 'badge-secondary'
                                            }`}>
                                            {sub.status === 'approved' && 'אושר'}
                                            {sub.status === 'rejected' && 'נדחה'}
                                            {sub.status === 'needs_changes' && 'נדרש תיקון'}
                                            {sub.status === 'pending' && 'ממתין'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="events-filters">
                        <button
                            className={`chip chip-selectable ${selectedType === 'all' ? 'chip-selected' : ''}`}
                            onClick={() => setSelectedType('all')}
                        >
                            הכל
                        </button>
                        {Object.entries(eventTypeLabels).map(([type, label]) => (
                            <button
                                key={type}
                                className={`chip chip-selectable ${selectedType === type ? 'chip-selected' : ''}`}
                                onClick={() => setSelectedType(type as EventType)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Events List */}
                    {filteredEvents.length === 0 && (
                        <div className="empty-state">
                            <Calendar size={48} className="text-secondary opacity-50 mb-4" />
                            <h3>אין אירועים כרגע</h3>
                            <p>נסה לשנות את הסינון או חזור מאוחר יותר</p>
                        </div>
                    )}

                    <div className="grid">
                        {filteredEvents.map(event => {
                            const dateInfo = formatDate(event.dateTime);
                            const isRegistered = myRegistrations.has(event.id);
                            const regCount = registrationCounts[event.id] || 0;
                            const isFull = event.capacity ? regCount >= event.capacity : false;

                            return (
                                <Link
                                    key={event.id}
                                    className="event-card"
                                    to={`/events/${event.id}`}
                                >
                                    <div className="event-card-cover">
                                        {event.coverImageUrl ? (
                                            <img src={event.coverImageUrl} alt={event.title} />
                                        ) : (
                                            <div className="event-card-cover-placeholder">🎵</div>
                                        )}

                                        <div className="event-card-date">
                                            <div className="event-card-day">{dateInfo.day}</div>
                                            <div className="event-card-month">{dateInfo.month}</div>
                                        </div>

                                        <div className="event-card-type">
                                            <span className={`event-type-badge ${eventTypeClasses[event.type]}`}>
                                                {eventTypeLabels[event.type]}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="event-card-body">
                                        <h3 className="event-card-title">{event.title}</h3>

                                        <div className="event-card-info">
                                            <div className="event-card-info-item">
                                                <Clock size={14} />
                                                <span>{dateInfo.time} • {formatDuration(event.durationMinutes)}</span>
                                            </div>
                                            <div className="event-card-info-item">
                                                <MapPin size={14} />
                                                <span>{event.location}</span>
                                            </div>
                                        </div>

                                        <div className="event-card-footer">
                                            <span className="event-card-capacity">
                                                <strong>{regCount}</strong>
                                                {event.capacity ? ` / ${event.capacity}` : ''} נרשמו
                                            </span>

                                            <button
                                                className={`btn btn-sm ${isRegistered ? 'btn-secondary' : 'btn-primary'}`}
                                                onClick={(e) => handleRegister(event.id, e)}
                                                disabled={!isRegistered && isFull}
                                            >
                                                {isRegistered ? 'רשום ✓' : isFull ? 'מלא' : 'הרשמה'}
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </>
            )}

            <CreateEventSubmissionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmitted={loadData}
            />
        </div>
    );
}
