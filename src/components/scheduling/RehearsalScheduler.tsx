
// ============================================
// bandgo - Rehearsal Scheduler Component
// Availability calendar and scheduling suggestions
// ============================================

import React, { useState, useEffect } from 'react';
import {
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
import '../../pages/scheduler/Scheduler.css'; // Reusing existing styles

interface RehearsalSchedulerProps {
    band: Band;
}

export function RehearsalScheduler({ band }: RehearsalSchedulerProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const bandId = band.id;

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
        loadData();
    }, [bandId, currentWeekStart]);

    function getStartOfWeek(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    const loadData = async () => {
        try {
            setLoading(true);
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);

            const [usersData, availData, suggestionsData, systemSettings, pollsData] = await Promise.all([
                localRepository.getAllUsers(),
                localRepository.getAvailability(bandId, currentWeekStart, weekEnd),
                localRepository.getSchedulingSuggestions(bandId),
                localRepository.getSettings(),
                localRepository.getActivePolls(bandId),
            ]);

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
        const currentStatus = availability[key] || AvailabilityStatus.UNAVAILABLE;

        let nextStatus: AvailabilityStatus;
        switch (currentStatus) {
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
                return <Check className="text-success" size={16} />;
            case AvailabilityStatus.MAYBE:
                return <HelpCircle className="text-warning" size={16} />;
            default:
                return <X className="text-error" size={16} />;
        }
    };

    const saveAvailability = async () => {
        try {
            setSaving(true);

            // Group availability by date
            const dateMap = new Map<string, AvailabilitySlot['timeSlots']>();
            Object.entries(availability).forEach(([key, status]) => {
                const [dateStr, timeStart] = key.split('-');
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
            loadData();

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
        if (!user) return;
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
            <div className="component-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="scheduler-component">
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
                                onVote={loadData}
                                isLeader={band.members.find(m => m.userId === user?.id)?.isLeader || false}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="scheduler-tabs-inline flex gap-md mb-md border-b border-border pb-sm">
                <button
                    className={`btn btn-ghost btn-sm gap-xs ${activeTab === 'availability' ? 'text-primary font-bold bg-primary-light/10' : ''}`}
                    onClick={() => setActiveTab('availability')}
                >
                    <Calendar size={18} />
                    הזמינות שלי
                </button>
                <button
                    className={`btn btn-ghost btn-sm gap-xs ${activeTab === 'suggestions' ? 'text-primary font-bold bg-primary-light/10' : ''}`}
                    onClick={() => setActiveTab('suggestions')}
                >
                    <Clock size={18} />
                    הצעות ({suggestions.length})
                </button>
                <div className="flex-1"></div>
                <button
                    className="btn btn-primary btn-sm gap-xs"
                    onClick={() => setShowCreatePollModal(true)}
                >
                    <Plus size={18} />
                    יצירת הצבעה
                </button>
            </div>

            {activeTab === 'availability' && (
                <div className="availability-section">
                    {/* Week Navigation */}
                    <div className="week-nav flex items-center justify-between mb-md bg-card p-sm rounded-lg">
                        <div className="flex items-center gap-sm">
                            <button onClick={() => navigateWeek('prev')} className="btn btn-icon btn-ghost btn-sm">
                                <ChevronRight size={20} />
                            </button>
                            <span className="week-label font-bold">
                                {currentWeekStart.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                            </span>
                            <button onClick={() => navigateWeek('next')} className="btn btn-icon btn-ghost btn-sm">
                                <ChevronLeft size={20} />
                            </button>
                        </div>

                        <div>
                            {isRoomSynced ? (
                                <div className="badge badge-success gap-xs border-none">
                                    <div className="w-2 h-2 rounded-full bg-current"></div>
                                    מסונכרן עם סטודיו
                                </div>
                            ) : (
                                <div className="badge gap-xs opacity-60">
                                    סנכרון סטודיו לא פעיל
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-grid bg-card rounded-lg p-md overflow-x-auto">
                        <div className="calendar-header grid grid-cols-8 gap-xs mb-sm text-center">
                            <div className="time-col-header"></div>
                            {days.map(day => (
                                <div key={day.toISOString()} className="day-header flex flex-col items-center">
                                    <span className="day-name text-xs text-secondary">{formatDayName(day)}</span>
                                    <span className="day-number text-lg font-bold">{formatDayNumber(day)}</span>
                                </div>
                            ))}
                        </div>

                        {timeSlots.map(slot => (
                            <div key={slot.start} className="calendar-row grid grid-cols-8 gap-xs mb-xs">
                                <div className="time-label text-xs text-secondary flex items-center justify-end px-xs">{slot.label}</div>
                                {days.map(day => {
                                    const key = `${day.toDateString()}-${slot.start}`;
                                    const status = availability[key];
                                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                                    return (
                                        <button
                                            key={key}
                                            className={`slot-btn h-10 rounded flex items-center justify-center transition-colors ${status ? '' : 'bg-surface'} ${status === 'available' ? 'bg-success/20 text-success' : status === 'maybe' ? 'bg-warning/20 text-warning' : status === 'unavailable' ? 'bg-error/20 text-error' : ''} ${isPast ? 'opacity-30 cursor-not-allowed' : 'hover:brightness-95'}`}
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

                    {/* Legend & Save */}
                    <div className="mt-md flex justify-between items-center">
                        <div className="legend flex gap-md text-xs text-secondary">
                            <div className="flex items-center gap-xs">
                                <Check className="text-success" size={14} />
                                <span>פנוי</span>
                            </div>
                            <div className="flex items-center gap-xs">
                                <HelpCircle className="text-warning" size={14} />
                                <span>אולי</span>
                            </div>
                            <div className="flex items-center gap-xs">
                                <X className="text-error" size={14} />
                                <span>לא פנוי</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary gap-sm"
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
                </div>
            )}

            {activeTab === 'suggestions' && (
                <div className="suggestions-section">
                    {suggestions.length === 0 ? (
                        <div className="empty-suggestions text-center py-xl text-secondary">
                            <Calendar size={48} className="mx-auto mb-md opacity-30" />
                            <p className="text-lg font-bold">אין הצעות לגבי חזרות</p>
                            <span className="text-sm">עדכנו את הזמינות שלכם כדי לקבל הצעות למועדים מתאימים</span>
                        </div>
                    ) : (
                        <div className="suggestions-list grid gap-md">
                            {suggestions.map(suggestion => (
                                <div key={suggestion.id} className="suggestion-card bg-card p-md rounded-lg border border-border flex justify-between items-center">
                                    <div className="suggestion-info">
                                        <div className="suggestion-date flex items-center gap-sm font-bold text-lg mb-xs">
                                            <Calendar size={18} className="text-primary" />
                                            <span>
                                                {new Date(suggestion.dateTime).toLocaleDateString('he-IL', {
                                                    weekday: 'long',
                                                    day: 'numeric',
                                                    month: 'long'
                                                })}
                                            </span>
                                        </div>
                                        <div className="suggestion-time flex items-center gap-sm text-secondary text-sm mb-sm">
                                            <Clock size={16} />
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
                                            <div className="flex items-center gap-xs text-sm mb-xs">
                                                <Users size={14} />
                                                <span>
                                                    {suggestion.availableMembers.length} מתוך {band.members.length} חברים פנויים
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden w-32">
                                                <div
                                                    className="h-full bg-success rounded-full"
                                                    style={{ width: `${suggestion.matchScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="suggestion-actions flex flex-col gap-sm">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleScheduleRehearsal(suggestion)}
                                            disabled={saving}
                                        >
                                            {saving ? '...' : 'קבע חזרה'}
                                        </button>
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleCreatePollFromSuggestion(suggestion)}
                                            disabled={saving}
                                            title="פתח הצבעה"
                                        >
                                            <Users size={16} /> הצבעה
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <CreatePollModal
                isOpen={showCreatePollModal}
                onClose={() => setShowCreatePollModal(false)}
                bandId={band.id}
                onPollCreated={() => {
                    loadData();
                    showToast('ההצבעה נוצרה בהצלחה', 'success');
                }}
            />
        </div>
    );
}
