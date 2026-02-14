
import React, { useState } from 'react';
import { X, Save, Calendar, User } from 'lucide-react';
import { Task } from '../../types';
import '../Modal.css';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Partial<Task>) => Promise<void>;
    bandMembers: { userId: string, displayName?: string, avatarUrl?: string }[];
}

export function CreateTaskModal({ isOpen, onClose, onSave, bandMembers }: CreateTaskModalProps) {
    if (!isOpen) return null;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || saving) return;

        try {
            setSaving(true);
            await onSave({
                title,
                description,
                assignedTo: assignedTo || undefined,
                status: 'pending',
                type: 'OTHER'
            });
            onClose();
            setTitle('');
            setDescription('');
            setAssignedTo('');
        } catch (error) {
            console.error('Failed to create task:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">משימה חדשה</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    <div className="form-group">
                        <label className="form-label">כותרת המשימה *</label>
                        <input
                            type="text"
                            className="form-input"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            placeholder="מה צריך לעשות?"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">תיאור (אופציונלי)</label>
                        <textarea
                            className="form-textarea"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="פרטים נוספים..."
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">הקצאה לחבר להקה</label>
                        <select
                            className="form-select"
                            value={assignedTo}
                            onChange={e => setAssignedTo(e.target.value)}
                        >
                            <option value="">ללא הקצאה</option>
                            {bandMembers.map(member => (
                                <option key={member.userId} value={member.userId}>
                                    {member.displayName || 'משתמש'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
                            ביטול
                        </button>
                        <button type="submit" className="btn-submit" disabled={saving || !title.trim()}>
                            {saving ? (
                                <div className="spinner spinner-sm"></div>
                            ) : (
                                <>
                                    <Save size={18} />
                                    צור משימה
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
