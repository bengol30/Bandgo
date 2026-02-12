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
import { Event, EventType, EventRegistration } from '../../types';
import './Events.css';

const eventTypeLabels: Record<EventType, string> = {
    [EventType.JAM]: "ג'אם",
    [EventType.BAND_PERFORMANCE]: 'הופעה',
    [EventType.SHARED_PERFORMANCE]: 'ערב להקות',
    [EventType.WORKSHOP]: 'סדנה',
    [EventType.OTHER]: 'אירוע',
};

const eventTypeClasses: Record<EventType, string> = {
    [EventType.JAM]: 'jam',
    [EventType.BAND_PERFORMANCE]: 'performance',
    [EventType.SHARED_PERFORMANCE]: 'performance',
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
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<EventType | 'all'>('all');

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

            // Load my registrations
            if (user) {
                const myRegs = await localRepository.getMyEventRegistrations(user.id);
                setMyRegistrations(new Set(myRegs.map(r => r.eventId)));
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
        <div className="page">
            <div className="container">
                {/* Header */}
                <div className="page-header">
                    <h1 className="page-title">אירועים</h1>
                    <p className="page-subtitle">ג'אמים, הופעות ואירועים בסלון פטיפון</p>
                </div>

                {/* Filters */}
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
                {filteredEvents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <h3 className="empty-state-title">אין אירועים קרובים</h3>
                        <p className="empty-state-text">
                            עקוב אחרי העדכונים לפרסום אירועים חדשים
                        </p>
                    </div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
