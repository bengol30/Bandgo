import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { RehearsalPoll } from '../../types';
import './Rehearsals.css';

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    bandId: string;
    onPollCreated: (poll: RehearsalPoll) => void;
}

export function CreatePollModal({ isOpen, onClose, bandId, onPollCreated }: CreatePollModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Default options - Use Local Time for initial values
    const getLocalISOString = (date: Date) => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const [location, setLocation] = useState('סלון המוזיקה של פטיפון');
    const [durationMinutes, setDurationMinutes] = useState(120); // 2 hours default
    const [options, setOptions] = useState<{ id: string; dateTime: string }[]>([
        { id: crypto.randomUUID(), dateTime: '' },
        { id: crypto.randomUUID(), dateTime: '' },
    ]);
    const [deadline, setDeadline] = useState(getLocalISOString(new Date(Date.now() + 48 * 60 * 60 * 1000)));

    if (!isOpen) return null;

    const handleAddOption = () => {
        setOptions([...options, { id: crypto.randomUUID(), dateTime: '' }]);
    };

    const handleRemoveOption = (id: string) => {
        if (options.length <= 2) return;
        setOptions(prev => prev.filter(o => o.id !== id));
    };

    const handleOptionChange = (id: string, value: string) => {
        setOptions(prev => prev.map(o => o.id === id ? { ...o, dateTime: value } : o));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || loading) return;

        // Filter out empty options
        const validOptions = options.filter(o => o.dateTime);
        if (validOptions.length < 2) {
            showToast('נא להזין לפחות 2 אפשרויות תאריך/שעה', 'warning');
            return;
        }

        try {
            setLoading(true);
            const newPoll = await repository.createRehearsalPoll({
                bandId,
                creatorId: user.id,
                location,
                deadline: new Date(deadline),
                options: validOptions.map(o => ({
                    id: o.id,
                    dateTime: new Date(o.dateTime),
                    durationMinutes,
                    votes: []
                })),
            });

            onPollCreated(newPoll);
            onClose();
        } catch (error) {
            console.error('Failed to create poll:', error);
            showToast('שגיאה ביצירת ההצבעה', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">תיאום חזרה חדשה</h2>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="label">מיקום</label>
                        <div className="input-with-icon">
                            <input
                                type="text"
                                className="input"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="label">משך החזרה (דקות)</label>
                        <input
                            type="number"
                            className="input"
                            value={durationMinutes}
                            onChange={e => setDurationMinutes(parseInt(e.target.value))}
                            min={30}
                            step={15}
                        />
                    </div>

                    <div className="form-group">
                        <label className="label">הצעות למועדים (לפחות 2)</label>
                        <div className="poll-options-list">
                            {options.map((option, index) => (
                                <div key={option.id} className="poll-option-row">
                                    <input
                                        type="datetime-local"
                                        className="input"
                                        value={option.dateTime}
                                        onChange={e => handleOptionChange(option.id, e.target.value)}
                                        required={index < 2}
                                    />
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-ghost text-error"
                                            onClick={() => handleRemoveOption(option.id)}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm mt-sm"
                            onClick={handleAddOption}
                        >
                            <Plus size={16} />
                            הוסף מועד
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="label">דדליין להצבעה</label>
                        <input
                            type="datetime-local"
                            className="input"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            required
                        />
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={loading}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'יוצר...' : 'צור הצבעה'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
