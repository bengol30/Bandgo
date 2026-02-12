import React from 'react';
import { Clock, Check, X, MapPin, Calendar, CheckCircle2, Users, Copy } from 'lucide-react';
import { RehearsalPoll, User, BandMember } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { googleCalendarService } from '../../services/GoogleCalendarService';
import './Rehearsals.css';

interface PollCardProps {
    poll: RehearsalPoll;
    usersMap: Record<string, User>;
    bandMembers: BandMember[];
    onVote: () => void; // Trigger reload
    isLeader: boolean;
}

export function PollCard({ poll, usersMap, bandMembers, onVote, isLeader }: PollCardProps) {
    const { user } = useAuth();
    const [finalizing, setFinalizing] = React.useState<string | null>(null);

    const handleVote = async (optionId: string, canAttend: boolean) => {
        if (!user) return;
        try {
            await localRepository.voteOnPoll(poll.id, optionId, user.id, canAttend);
            onVote();
        } catch (error) {
            console.error('Vote failed:', error);
            alert('שגיאה בהצבעה');
        }
    };

    const { showToast } = useToast();

    const handleCopyInvite = () => {
        const inviteText = `
🎸 *הצבעה לחזרה חדשה!* 🎸
היי חברים, בואו נקבע מתי נפגשים לחזרה.

📍 מיקום: ${poll.location}
📅 *האפשרויות:*
${poll.options.map((opt, i) => `${i + 1}. ${new Date(opt.dateTime).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' })} בשעה ${new Date(opt.dateTime).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`).join('\n')}

נא להצביע בהקדם באפליקציה! 🤘
`;
        navigator.clipboard.writeText(inviteText);
        showToast('ההזמנה הועתקה! הדביקו בוואטסאפ', 'success');
    };

    const handleFinalize = async (optionId: string) => {
        const option = poll.options.find(o => o.id === optionId);
        if (!option) return;

        if (!confirm('האם אתה בטוח שברצונך לקבוע את החזרה למועד זה? ההצבעה תיסגר.')) return;
        try {
            setFinalizing(optionId);

            // Finalize in local repo
            await localRepository.finalizePoll(poll.id, optionId);

            // SYNC TO GOOGLE: If connected, create an event
            if (googleCalendarService.isConnected()) {
                await googleCalendarService.createEvent(
                    `חזרת להקה למועד שנקבע`, // Could be improved with actual band name but would need to pass it
                    new Date(option.dateTime),
                    option.durationMinutes,
                    poll.location
                );
            }

            onVote(); // Will likely remove the poll from the list
            showToast('החזרה נקבעה בהצלחה!', 'success');
        } catch (error) {
            console.error('Finalize failed:', error);
            showToast('שגיאה בקביעת החזרה', 'error');
        } finally {
            setFinalizing(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('he-IL', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="poll-card">
            <div className="poll-card-header">
                <div>
                    <h3 className="poll-card-title">תיאום חזרה</h3>
                    <div className="poll-meta">
                        <span><MapPin size={14} /> {poll.location}</span>
                        <span>נוצר על ידי {usersMap[poll.creatorId]?.displayName || 'משתמש לא ידוע'}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <div className="expire-tag" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        מסתיים ב: {new Date(poll.deadline).toLocaleDateString('he-IL')}
                    </div>
                    <button
                        className="btn btn-icon-sm btn-ghost"
                        onClick={handleCopyInvite}
                        title="העתק הזמנה לוואטסאפ"
                    >
                        <Copy size={16} />
                    </button>
                </div>
            </div>

            <div className="poll-options">
                {poll.options.map(option => {
                    const myVote = option.votes.find(v => v.userId === user?.id);
                    const yesVotes = option.votes.filter(v => v.canAttend);

                    return (
                        <div key={option.id} className="poll-option-vote-row">
                            <div className="poll-option-info">
                                <span className="poll-date">{formatDate(option.dateTime)}</span>
                                <span className="poll-duration">{option.durationMinutes} דקות</span>

                                <div className="voters-avatars">
                                    {yesVotes.slice(0, 5).map(v => (
                                        <img
                                            key={v.userId}
                                            src={usersMap[v.userId]?.avatarUrl}
                                            alt={usersMap[v.userId]?.displayName}
                                            title={usersMap[v.userId]?.displayName}
                                            className="avatar avatar-sm"
                                            style={{ borderColor: 'var(--color-success)' }}
                                        />
                                    ))}
                                    {yesVotes.length > 5 && <span className="more-voters">+{yesVotes.length - 5}</span>}

                                    {/* Waiting for indicator (simple version: count how many haven't voted) */}
                                    {usersMap && Object.values(usersMap).map(u => {
                                        // This is tricky because we need to know who OUGHT to vote (band members)
                                        // But PollCard only blindly gets usersMap.
                                        // Ideally we check if they are in the band.
                                        // For now, let's just assume we want to show if *I* haven't voted yet? 
                                        // Or maybe just show nothing if no one voted yes.
                                        return null;
                                    })}
                                </div>
                                <div className="waiting-list" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {(() => {
                                        // Calculate who hasn't voted
                                        const votedUserIds = option.votes.map(v => v.userId);
                                        // We need the band members list to know who is missing.
                                        // Passed props don't have band members list, just usersMap.
                                        // We can infer relevant users from usersMap if we assume it contains band members.

                                        // For this iteration, let's just show "Waiting for vote" if current user hasn't voted.
                                        const myVote = option.votes.find(v => v.userId === user?.id);
                                        if (!myVote) return <span style={{ color: 'var(--warning)' }}>טרם הצבעת!</span>;
                                        return null;
                                    })()}
                                </div>
                            </div>

                            <div className="vote-actions">
                                {isLeader && !finalizing && (
                                    <button
                                        className="btn btn-icon-sm btn-ghost text-accent"
                                        onClick={() => handleFinalize(option.id)}
                                        title="קבע מועד זה סופית"
                                        style={{ marginLeft: '0.5rem' }}
                                    >
                                        <CheckCircle2 size={20} />
                                    </button>
                                )}

                                <button
                                    className={`vote-btn ${myVote?.canAttend === true ? 'voted-yes' : ''}`}
                                    onClick={() => handleVote(option.id, true)}
                                    title="יכול להגיע"
                                >
                                    <Check size={18} />
                                </button>
                                <button
                                    className={`vote-btn ${myVote?.canAttend === false ? 'voted-no' : ''}`}
                                    onClick={() => handleVote(option.id, false)}
                                    title="לא יכול להגיע"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
