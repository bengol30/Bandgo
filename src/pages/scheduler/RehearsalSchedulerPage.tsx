// ============================================
// bandgo - Rehearsal Scheduler Page
// Availability calendar and scheduling suggestions
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Calendar,
    Clock,
    Check,
    X,
    HelpCircle,
    Users,
    ChevronLeft,
    ChevronRight,
    Lock as LockIcon,
    Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import type { Band, User, AvailabilitySlot, SchedulingSuggestion } from '../../types';
import { RehearsalPoll } from '../../types';
import { AvailabilityStatus, RehearsalStatus } from '../../types';
import { googleCalendarService } from '../../services/GoogleCalendarService';
import { CreatePollModal } from '../../components/rehearsals/CreatePollModal';
import { PollCard } from '../../components/rehearsals/PollCard';
import './Scheduler.css';

export function RehearsalSchedulerPage() {
    const { bandId } = useParams<{ bandId: string }>();
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const { showToast } = useToast();

    const [band, setBand] = useState<Band | null>(null);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
    const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
    const [suggestions, setSuggestions] = useState<SchedulingSuggestion[]>([]);
    const [polls, setPolls] = useState<RehearsalPoll[]>([]); // Active polls
    const [activeTab, setActiveTab] = useState<'availability' | 'suggestions'>('availability');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isRoomSynced, setIsRoomSynced] = useState(false);
    const [studioBusySlots, setStudioBusySlots] = useState<{ start: Date, end: Date }[]>([]);
    const [showCreatePollModal, setShowCreatePollModal] = useState(false);
    const timeSlots = [
        { start: '09:00', end: '12:00', label: 'בוקר' },
        { start: '12:00', end: '16:00', label: 'צהריים' },
        { start: '16:00', end: '20:00', label: 'אחה״צ' },
        { start: '20:00', end: '23:00', label: 'ערב' },
    ];

    // Days of the week
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        return date;
    });

    useEffect(() => {
        if (bandId) {
            loadData();
        }
    }, [bandId, currentWeekStart]);

    function getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    const loadData = async () => {
        if (!bandId) return;
        try {
            setLoading(true);
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const [bandData, usersData, availData, suggestionsData, systemSettings, pollsData] = await Promise.all([
                localRepository.getBand(bandId),
                localRepository.getAllUsers(),
                localRepository.getAvailability(bandId, currentWeekStart, weekEnd),
                localRepository.getSchedulingSuggestions(bandId),
                localRepository.getSettings(),
                localRepository.getActivePolls(bandId),
            ]);

            if (!bandData) {
                showToast('הלהקה לא נמצאה', 'error');
                navigate('/bands');
                return;
            }

            setBand(bandData);
            setSuggestions(suggestionsData);
            setPolls(pollsData);
            setIsRoomSynced(systemSettings.googleCalendarConnected);

            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);

            // Build availability map from saved data
            const availMap: Record<string, AvailabilityStatus> = {};
            availData.forEach(slot => {
                if (slot.userId === user?.id) {
                    slot.timeSlots.forEach(ts => {
                        const key = `${slot.date.toDateString()}-${ts.start}`;
                        availMap[key] = ts.status;
                    });
                }
            });

            // SYNC WITH GOOGLE (STUDIO CALENDAR): If enabled in settings, fetch busy slots
            if (systemSettings.googleCalendarConnected) {
                try {
                    const busySlots = await googleCalendarService.getBusySlots(currentWeekStart, weekEnd);
                    setStudioBusySlots(busySlots);
                    busySlots.forEach(busy => {
                        timeSlots.forEach(slot => {
                            days.forEach(day => {
                                const slotDateTimeStart = new Date(day);
                                const [h, m] = slot.start.split(':').map(Number);
                                slotDateTimeStart.setHours(h, m, 0, 0);

                                const slotDateTimeEnd = new Date(day);
                                const [eh, em] = slot.end.split(':').map(Number);
                                slotDateTimeEnd.setHours(eh, em, 0, 0);

                                if (busy.start < slotDateTimeEnd && busy.end > slotDateTimeStart) {
                                    const key = `${day.toDateString()}-${slot.start}`;
                                    // Mark as unavailable because the STUDIO is busy
                                    availMap[key] = AvailabilityStatus.UNAVAILABLE;
                                }
                            });
                        });
                    });
                    console.log('✅ Synchronized with Studio Google Calendar');
                } catch (err) {
                    console.error('Failed to sync with Studio Google:', err);
                }
            }

            setAvailability(availMap);
        } catch (error) {
            console.error('Failed to load scheduler:', error);
            showToast('שגיאה בטעינת לוח הזמנים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = (date: Date, slot: typeof timeSlots[0]) => {
        // Check if this slot is blocked by studio
        const slotDateTimeStart = new Date(date);
        const [h, m] = slot.start.split(':').map(Number);
        slotDateTimeStart.setHours(h, m, 0, 0);

        const slotDateTimeEnd = new Date(date);
        const [eh, em] = slot.end.split(':').map(Number);
        slotDateTimeEnd.setHours(eh, em, 0, 0);

        const isStudioBusy = studioBusySlots.some(busy =>
            busy.start < slotDateTimeEnd && busy.end > slotDateTimeStart
        );

        if (isStudioBusy) {
            showToast('לא ניתן לשנות זמינות בשעות שהסטודיו תפוס', 'warning');
            return;
        }

        const key = `${date.toDateString()}-${slot.start}`;
        const currentStatus = availability[key]; // undefined = not set yet

        let nextStatus: AvailabilityStatus;
        switch (currentStatus) {
            case undefined: // Not set → available
            case AvailabilityStatus.UNAVAILABLE:
                nextStatus = AvailabilityStatus.AVAILABLE;
                break;
            case AvailabilityStatus.AVAILABLE:
                nextStatus = AvailabilityStatus.MAYBE;
                break;
            default:
                nextStatus = AvailabilityStatus.UNAVAILABLE;
        }

        setAvailability(prev => ({ ...prev, [key]: nextStatus }));
    };

    const getStatusIcon = (status: AvailabilityStatus | undefined) => {
        switch (status) {
            case AvailabilityStatus.AVAILABLE:
                return <Check className="status-available" size={16} />;
            case AvailabilityStatus.MAYBE:
                return <HelpCircle className="status-maybe" size={16} />;
            case AvailabilityStatus.UNAVAILABLE:
                return <X className="status-unavailable" size={16} />;
            default:
                return null; // Not set yet — neutral/empty
        }
    };

    const saveAvailability = async () => {
        if (!bandId) return;
        try {
            setSaving(true);

            // Group availability by date
            const dateMap = new Map<string, AvailabilitySlot['timeSlots']>();
            Object.entries(availability).forEach(([key, status]) => {
                // Key format: "Mon Feb 14 2026-09:00" — split at last '-'
                const lastDash = key.lastIndexOf('-');
                if (lastDash === -1) return;
                const dateStr = key.substring(0, lastDash);
                const slot = timeSlots.find(s => key.endsWith(s.start));
                if (!slot) return;

                if (!dateMap.has(dateStr)) {
                    dateMap.set(dateStr, []);
                }
                dateMap.get(dateStr)!.push({
                    start: slot.start,
                    end: slot.end,
                    status,
                });
            });

            // Save each date's availability
            for (const [dateStr, slots] of dateMap.entries()) {
                await localRepository.updateAvailability(bandId, new Date(dateStr), slots);
            }

            showToast('הזמינות נשמרה בהצלחה', 'success');

            // Refresh suggestions
            const newSuggestions = await localRepository.getSchedulingSuggestions(bandId);
            setSuggestions(newSuggestions);
        } catch (error) {
            console.error('Failed to save availability:', error);
            showToast('שגיאה בשמירת הזמינות', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleScheduleRehearsal = async (suggestion: SchedulingSuggestion) => {
        if (!bandId || !band) return;

        try {
            setSaving(true);
            await localRepository.createRehearsal({
                bandId,
                dateTime: new Date(suggestion.dateTime),
                durationMinutes: suggestion.durationMinutes,
                location: band.city || 'סטודיו',
                status: RehearsalStatus.SCHEDULED,
            });

            // SYNC TO GOOGLE: If connected, create an event
            if (googleCalendarService.isConnected()) {
                await googleCalendarService.createEvent(
                    `חזרת להקה: ${band.name}`,
                    new Date(suggestion.dateTime),
                    suggestion.durationMinutes,
                    band.city || 'סטודיו'
                );
            }

            showToast('החזרה נקבעה בהצלחה!', 'success');
            navigate(`/bands/${bandId}`);

        } catch (error) {
            console.error('Failed to schedule rehearsal:', error);
            showToast('שגיאה בקביעת החזרה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const formatDayName = (date: Date) => {
        return date.toLocaleDateString('he-IL', { weekday: 'short' });
    };

    const formatDayNumber = (date: Date) => {
        return date.getDate();
    };

    const handleCreatePollFromSuggestion = async (suggestion: SchedulingSuggestion) => {
        if (!bandId || !user) return;
        try {
            setSaving(true);
            const newPoll = await localRepository.createRehearsalPoll({
                bandId,
                creatorId: user.id,
                deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                location: band?.city || 'סטודיו',
                options: [{
                    id: crypto.randomUUID(),
                    dateTime: new Date(suggestion.dateTime),
                    durationMinutes: suggestion.durationMinutes,
                    votes: []
                }, {
                    id: crypto.randomUUID(),
                    dateTime: new Date(new Date(suggestion.dateTime).getTime() + 7 * 24 * 60 * 60 * 1000), // Option for next week same time
                    durationMinutes: suggestion.durationMinutes,
                    votes: []
                }]
            });
            showToast('ההצבעה נוצרה בהצלחה', 'success');
            loadData(); // Reload everything
        } catch (error) {
            console.error('Failed to create poll from suggestion:', error);
            showToast('שגיאה ביצירת ההצבעה', 'error');
        } finally {
            setSaving(false);
        }
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeekStart(newStart);
    };

    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    if (!band) return null;

    return (
        <div className="page page-scheduler">
            {/* Header */}
            <div className="scheduler-header">
                {band.coverImageUrl && (
                    <img src={band.coverImageUrl} alt={band.name} className="scheduler-cover-image" />
                )}
                <div className="scheduler-header-overlay">
                    <button className="back-button" onClick={() => navigate(-1)}>
                        <ArrowRight size={20} />
                    </button>
                    <div className="scheduler-header-content">
                        <h1>תיאום חזרות</h1>
                        <span>{band.name}</span>
                    </div>
                </div>
            </div>

            {/* Active Polls Section */}
            {polls.length > 0 && (
                <div className="active-polls-section mb-lg">
                    <h2 className="section-title mb-md" style={{ fontSize: '1.2rem' }}>הצבעות פתוחות</h2>
                    <div className="polls-grid">
                        {polls.map(poll => (
                            <PollCard
                                key={poll.id}
                                poll={poll}
                                usersMap={users}
                                bandMembers={band.members}
                                bandName={band.name || 'להקה'}
                                onVote={loadData}
                                isLeader={band.members.find(m => m.userId === user?.id)?.isLeader || false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="scheduler-tabs">
                <button
                    className={`tab-btn ${activeTab === 'availability' ? 'active' : ''}`}
                    onClick={() => setActiveTab('availability')}
                >
                    <Calendar size={18} />
                    הזמינות שלי
                </button>
                <button
                    className={`tab-btn ${activeTab === 'suggestions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('suggestions')}
                >
                    <Clock size={18} />
                    הצעות ({suggestions.length})
                </button>
                <button
                    className="tab-btn create-poll-btn"
                    onClick={() => setShowCreatePollModal(true)}
                    style={{ marginRight: 'auto', background: 'var(--primary-color)', color: 'white', border: 'none' }}
                >
                    <Plus size={18} />
                    יצירת הצבעה חדשה
                </button>
            </div>

            {activeTab === 'availability' && (
                <div className="availability-section">
                    {/* Week Navigation */}
                    <div className="week-nav">
                        <button onClick={() => navigateWeek('prev')}>
                            <ChevronRight size={20} />
                        </button>
                        <span className="week-label">
                            {currentWeekStart.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => navigateWeek('next')}>
                            <ChevronLeft size={20} />
                        </button>

                        <div style={{ marginRight: 'auto' }}>
                            {isRoomSynced ? (
                                <div className="badge badge-success" style={{ gap: 'var(--spacing-xs)', border: 'none' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }}></div>
                                    מסונכרן עם יומן הסטודיו
                                </div>
                            ) : (
                                <div className="badge" style={{ gap: 'var(--spacing-xs)', opacity: 0.6 }}>
                                    סנכרון סטודיו לא פעיל
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="legend">
                        <div className="legend-item">
                            <Check className="status-available" size={14} />
                            <span>פנוי</span>
                        </div>
                        <div className="legend-item">
                            <HelpCircle className="status-maybe" size={14} />
                            <span>אולי</span>
                        </div>
                        <div className="legend-item" title="זמן שבו הסטודיו תפוס ביומן גוגל">
                            <LockIcon className="status-unavailable" size={14} />
                            <span>סטודיו תפוס</span>
                        </div>
                        <div className="legend-item">
                            <X className="status-unavailable" size={14} />
                            <span>לא פנוי (שלי)</span>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-grid">
                        <div className="calendar-header">
                            <div className="time-col-header"></div>
                            {days.map(day => (
                                <div key={day.toISOString()} className="day-header">
                                    <span className="day-name">{formatDayName(day)}</span>
                                    <span className="day-number">{formatDayNumber(day)}</span>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(slot => (
                            <div key={slot.start} className="calendar-row">
                                <div className="time-label">{slot.label}</div>
                                {days.map(day => {
                                    const key = `${day.toDateString()}-${slot.start}`;
                                    const status = availability[key];
                                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                                    return (
                                        <button
                                            key={key}
                                            className={`slot-btn ${status || 'unavailable'} ${isPast ? 'past' : ''} ${isRoomSynced && status === AvailabilityStatus.UNAVAILABLE ? 'blocked' : ''}`}
                                            onClick={() => !isPast && toggleAvailability(day, slot)}
                                            disabled={isPast}
                                        >
                                            {getStatusIcon(status)}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Save Button */}
                    <button
                        className="save-btn"
                        onClick={saveAvailability}
                        disabled={saving}
                    >
                        {saving ? (
                            <div className="spinner spinner-sm"></div>
                        ) : (
                            <>
                                <Check size={18} />
                                שמור זמינות
                            </>
                        )}
                    </button>
                </div>
            )}

            {activeTab === 'suggestions' && (
                <div className="suggestions-section">
                    {suggestions.length === 0 ? (
                        <div className="empty-suggestions">
                            <Calendar size={48} />
                            <p>אין הצעות זמינות</p>
                            <span>עדכנו את הזמינות שלכם כדי לקבל הצעות</span>
                        </div>
                    ) : (
                        <div className="suggestions-list">
                            {suggestions.map(suggestion => (
                                <div key={suggestion.id} className="suggestion-card">
                                    <div className="suggestion-date">
                                        <Calendar size={18} />
                                        <span>
                                            {new Date(suggestion.dateTime).toLocaleDateString('he-IL', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long'
                                            })}
                                        </span>
                                    </div>
                                    <div className="suggestion-time">
                                        <Clock size={18} />
                                        <span>
                                            {new Date(suggestion.dateTime).toLocaleTimeString('he-IL', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                            {' - '}
                                            {suggestion.durationMinutes} דקות
                                        </span>
                                    </div>
                                    <div className="suggestion-match">
                                        <Users size={18} />
                                        <span>
                                            {suggestion.availableMembers.length} מתוך {band.members.length} חברים פנויים
                                        </span>
                                        <div
                                            className="match-bar"
                                            style={{ '--match-percent': `${suggestion.matchScore}%` } as React.CSSProperties}
                                        >
                                            <div className="match-fill"></div>
                                        </div>
                                    </div>
                                    <div className="suggestion-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            className="schedule-btn"
                                            onClick={() => handleScheduleRehearsal(suggestion)}
                                            disabled={saving}
                                            style={{ flex: 1 }}
                                        >
                                            {saving ? (
                                                <div className="spinner spinner-sm" style={{ borderColor: 'white', borderLeftColor: 'transparent' }}></div>
                                            ) : (
                                                'קבע חזרה'
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => handleCreatePollFromSuggestion(suggestion)}
                                            disabled={saving}
                                            title="פתח הצבעה על המועד הזה"
                                        >
                                            <Users size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {band && (
                <CreatePollModal
                    isOpen={showCreatePollModal}
                    onClose={() => setShowCreatePollModal(false)}
                    bandId={band.id}
                    onPollCreated={() => {
                        loadData();
                        showToast('ההצבעה נוצרה בהצלחה', 'success');
                    }}
                />
            )}
        </div>
    );
}
