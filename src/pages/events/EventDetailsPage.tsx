import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, ArrowRight, Share2, Ticket, Music, Check, Edit2, Shield, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Event, EventRegistration, User } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { EditEventModal } from '../../components/events/EditEventModal';
import './EventDetails.css';

export function EventDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [organizer, setOrganizer] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [userRegistration, setUserRegistration] = useState<EventRegistration | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (id) loadData();
    }, [id, user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const foundEvent = await localRepository.getEvent(id!);
            if (!foundEvent) {
                navigate('/events');
                return;
            }
            setEvent(foundEvent);

            // Get organizer
            if (foundEvent.organizerId) {
                const org = await localRepository.getUser(foundEvent.organizerId);
                setOrganizer(org);
            }

            // Check registration
            if (user) {
                const regs = await localRepository.getEventRegistrations(id!);
                const myReg = regs.find(r => r.userId === user.id && r.status !== 'cancelled');
                setUserRegistration(myReg || null);
            }

        } catch (error) {
            console.error('Failed to load event:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!user) {
            showToast('יש להתחבר כדי להירשם לאירוע', 'warning');
            return;
        }
        try {
            setRegistering(true);
            await localRepository.registerForEvent(id!, user.id);
            showToast('נרשמת לאירוע בהצלחה!', 'success');
            loadData();
        } catch (error) {
            console.error(error);
            showToast('שגיאה בהרשמה', 'error');
        } finally {
            setRegistering(false);
        }
    };

    const handleCancelRegistration = async () => {
        if (!confirm('האם לבטל את ההרשמה?')) return;
        try {
            setRegistering(true);
            await localRepository.cancelRegistration(id!, user!.id);
            showToast('ההרשמה בוטלה', 'info');
            loadData();
        } catch (error) {
            showToast('שגיאה בביטול', 'error');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div></div>;
    if (!event) return null;

    const isPast = new Date(event.dateTime) < new Date();
    const priceText = event.price && event.price > 0 ? `₪${event.price}` : 'חינם';

    return (
        <div className="page page-event-details">
            <div className="event-hero" style={{ backgroundImage: `url(${event.coverImageUrl || 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&q=80&w=2000'})` }}>
                <div className="event-hero-overlay">
                    <div className="container">
                        <button className="btn btn-icon btn-ghost back-btn-white" onClick={() => navigate('/events')}>
                            <ArrowRight />
                        </button>
                        <div className="event-hero-content">
                            <span className="event-type-badge">{event.type}</span>
                            <div className="flex justify-between items-start">
                                <h1 className="event-title">{event.title}</h1>
                                {user && (user.id === event.organizerId || user.role === 'admin') && (
                                    <button
                                        className="btn btn-icon btn-secondary"
                                        onClick={() => setShowEditModal(true)}
                                        title="ערוך אירוע"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                            </div>
                            <div className="event-meta-large">
                                <div className="meta-item">
                                    <Calendar className="icon" />
                                    <span>{new Date(event.dateTime).toLocaleDateString()}</span>
                                </div>
                                <div className="meta-item">
                                    <Clock className="icon" />
                                    <span>{new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="meta-item">
                                    <MapPin className="icon" />
                                    <span>{event.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container event-body-container">
                <div className="event-main-content">
                    <section className="event-section">
                        <h2 className="section-title">על האירוע</h2>
                        <p className="event-description">{event.description}</p>
                    </section>

                    {event.backlineProvided && (
                        <section className="event-section mt-xl">
                            <h2 className="section-title flex items-center gap-sm">
                                <Music size={20} />
                                <span>ציוד ו-Backline</span>
                            </h2>
                            <div className="bg-bg-secondary p-md rounded-lg whitespace-pre-wrap">
                                {event.backlineProvided}
                            </div>
                        </section>
                    )}

                    {organizer && (
                        <section className="event-section mt-xl">
                            <h3 className="section-subtitle">מארגן האירוע</h3>
                            <div className="card organizer-card flex items-center gap-md p-md">
                                {organizer.avatarUrl ? (
                                    <img src={organizer.avatarUrl} className="avatar avatar-lg" alt={organizer.displayName} />
                                ) : (
                                    <div className="avatar avatar-lg avatar-placeholder">{organizer.displayName[0]}</div>
                                )}
                                <div>
                                    <div className="font-bold text-lg">{organizer.displayName}</div>
                                    <div className="text-secondary text-sm">חבר קהילה</div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <div className="event-sidebar">
                    <div className="event-action-card card">
                        {event.whatsappGroupId && (
                            <a
                                href={event.whatsappGroupId}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-outline w-full mb-md flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={18} />
                                קבוצת WhatsApp
                            </a>
                        )}

                        <div className="price-tag">
                            {priceText}
                        </div>

                        {isPast ? (
                            <button className="btn btn-secondary w-full" disabled>האירוע הסתיים</button>
                        ) : event.ticketLink ? (
                            <a
                                href={event.ticketLink}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary w-full btn-lg flex items-center justify-center gap-2"
                            >
                                <Ticket size={20} />
                                רכישת כרטיסים
                                <ExternalLink size={16} />
                            </a>
                        ) : userRegistration ? (
                            <div className="registration-status">
                                <div className="status-message success mb-md">
                                    <Check size={20} />
                                    <span>אתה רשום לאירוע זה</span>
                                </div>
                                <button
                                    className="btn btn-ghost text-error w-full"
                                    onClick={handleCancelRegistration}
                                    disabled={registering}
                                >
                                    בטל הרשמה
                                </button>
                            </div>
                        ) : (
                            <button
                                className="btn btn-primary w-full btn-lg"
                                onClick={handleRegister}
                                disabled={registering}
                            >
                                <Ticket size={20} />
                                הירשם עכשיו
                            </button>
                        )}

                        <div className="sidebar-meta mt-lg">
                            <div className="sidebar-item">
                                <Users size={16} />
                                <span>{event.capacity ? `מוגבל ל-${event.capacity} משתתפים` : 'אין הגבלת משתתפים'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {event && (
                <EditEventModal
                    event={event}
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    onEventUpdated={(updated) => setEvent(updated)}
                />
            )}
        </div>
    );
}
