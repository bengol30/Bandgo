import React from 'react';
import { CheckCircle, Circle, Music, Video, Star } from 'lucide-react';
import { Band } from '../../types';
import './BandProgress.css';

interface BandProgressProps {
    band: Band;
    compact?: boolean;
}

export function BandProgress({ band, compact = false }: BandProgressProps) {
    const rehearsalsDone = band.approvedRehearsalsCount || 0;
    const rehearsalGoal = band.rehearsalGoal || 5;
    const progressPercent = Math.min(100, (rehearsalsDone / rehearsalGoal) * 100);

    const hasPerformance = !!band.performanceRequestId;
    const hasSession = !!band.liveSessionRequestId;

    if (compact) {
        return (
            <div className="band-progress-compact" style={{ textAlign: 'left' }}>
                <div className="text-xs text-secondary mb-xs text-right">התקדמות</div>
                <div className="progress-bar-tiny h-1 bg-bg-tertiary rounded w-16 mb-xs overflow-hidden">
                    <div className="bg-accent h-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <div className="progress-icons flex gap-xs justify-end">
                    <span className={hasPerformance ? 'text-accent' : 'text-muted opacity-50'} title="הופעה">
                        <Music size={14} />
                    </span>
                    <span className={hasSession ? 'text-accent' : 'text-muted opacity-50'} title="סשן">
                        <Video size={14} />
                    </span>
                </div>
            </div>
        );
    }

    // Full Mode
    return (
        <div className="card p-lg mb-lg band-progress-full">
            <h3 className="text-lg font-bold mb-md flex items-center gap-sm">
                <Star className="text-accent" size={20} />
                התקדמות הלהקה
            </h3>

            <div className="space-y-md flex flex-col gap-md">
                {/* Rehearsals */}
                <div>
                    <div className="flex justify-between items-center mb-xs">
                        <span className="font-medium text-sm">חזרות ({rehearsalsDone}/{rehearsalGoal})</span>
                        {rehearsalsDone >= rehearsalGoal && <CheckCircle size={16} className="text-success" />}
                    </div>
                    <div className="progress-bar h-2 bg-bg-tertiary rounded-full overflow-hidden" style={{ height: '8px', background: 'var(--color-bg-tertiary)' }}>
                        <div
                            className="bg-accent h-full transition-all duration-500"
                            style={{ width: `${progressPercent}%`, background: 'var(--color-accent-primary)', height: '100%' }}
                        ></div>
                    </div>
                </div>

                {/* Performance */}
                <div className={`flex items-center gap-md p-sm rounded border ${hasPerformance ? 'bg-bg-secondary border-accent-secondary' : 'border-border'}`} style={{ display: 'flex', gap: 'var(--spacing-md)', padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div className={`p-xs rounded-full ${hasPerformance ? 'bg-accent text-white' : 'bg-bg-tertiary text-muted'}`} style={{ padding: '6px', borderRadius: '50%' }}>
                        <Music size={18} />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-sm">הופעה חיה</div>
                        <div className="text-xs text-secondary">
                            {hasPerformance ? 'אושרה ותוכננה!' : 'ממתין לסיום חזרות'}
                        </div>
                    </div>
                    {hasPerformance && <CheckCircle size={18} className="text-success" />}
                </div>

                {/* Session */}
                <div className={`flex items-center gap-md p-sm rounded border ${hasSession ? 'bg-bg-secondary border-accent-secondary' : 'border-border'}`} style={{ display: 'flex', gap: 'var(--spacing-md)', padding: 'var(--spacing-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                    <div className={`p-xs rounded-full ${hasSession ? 'bg-accent text-white' : 'bg-bg-tertiary text-muted'}`} style={{ padding: '6px', borderRadius: '50%' }}>
                        <Video size={18} />
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-sm">סשן מצולם</div>
                        <div className="text-xs text-secondary">
                            {hasSession ? 'הוזמן בהצלחה!' : 'היעד הבא שלנו'}
                        </div>
                    </div>
                    {hasSession && <CheckCircle size={18} className="text-success" />}
                </div>
            </div>
        </div>
    );
}
