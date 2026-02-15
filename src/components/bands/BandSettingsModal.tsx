import React, { useState, useEffect } from 'react';
import { X, UserMinus, Save, Check, XCircle, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { Band, User, BandApplication } from '../../types';
import { repository } from '../../repositories';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getInstrumentName } from '../../utils';
import './BandSettings.css';

interface BandSettingsModalProps {
    band: Band;
    usersMap: Record<string, User>;
    isOpen: boolean;
    onClose: () => void;
    onBandUpdated: (band: Band) => void;
    onBandDeleted?: () => void;
}

export function BandSettingsModal({ band, usersMap, isOpen, onClose, onBandUpdated, onBandDeleted }: BandSettingsModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'general' | 'members' | 'applications'>('general');

    // Form State
    const [name, setName] = useState(band.name || '');
    const [description, setDescription] = useState(band.description || '');
    const [city, setCity] = useState(band.city || '');
    const [saving, setSaving] = useState(false);

    // Applications State
    const [applications, setApplications] = useState<BandApplication[]>([]);
    const [loadingApps, setLoadingApps] = useState(false);

    // Danger zone state
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (activeTab === 'applications' && band.originalBandRequestId) {
            loadApplications();
        }
    }, [activeTab]);

    const loadApplications = async () => {
        if (!band.originalBandRequestId) return;
        setLoadingApps(true);
        try {
            const apps = await repository.getApplications(band.originalBandRequestId);
            // Filter only pending
            const pending = apps.filter(a => a.status === 'pending');
            setApplications(pending);
        } catch (error) {
            console.error('Failed to load applications:', error);
        } finally {
            setLoadingApps(false);
        }
    };

    const handleReviewApplication = async (appId: string, status: 'approved' | 'rejected') => {
        try {
            await repository.reviewApplication(appId, status);
            showToast(status === 'approved' ? 'הבקשה אושרה והנגן צורף!' : 'הבקשה נדחתה', 'success');

            // Reload apps
            loadApplications();

            // Should also refresh band data if approved
            if (status === 'approved') {
                const updatedBand = await repository.getBand(band.id);
                if (updatedBand) onBandUpdated(updatedBand);
            }
        } catch (error) {
            console.error(error);
            showToast('שגיאה בביצוע הפעולה', 'error');
        }
    };

    // Leader ID
    const leaderId = band.members.find(m => m.isLeader)?.userId;
    const isCurrentUserLeader = user?.id === leaderId;

    const handleSaveDetails = async () => {
        try {
            setSaving(true);
            const updatedBand = await repository.updateBand(band.id, {
                name,
                description,
                city
            });
            onBandUpdated(updatedBand);
            showToast('הפרטים עודכנו בהצלחה', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            showToast('שגיאה בעדכון הפרטים', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveMember = async (memberUserId: string) => {
        if (!confirm('האם אתה בטוח שברצונך להסיר חבר זה מהלהקה?')) return;

        try {
            const updatedMembers = band.members.filter(m => m.userId !== memberUserId);
            const updatedBand = await repository.updateBand(band.id, {
                members: updatedMembers
            });
            onBandUpdated(updatedBand);
            showToast('החבר הוסר בהצלחה', 'success');
        } catch (error) {
            console.error(error);
            showToast('שגיאה בהסרת החבר', 'error');
        }
    };

    const handleLeaveBand = async () => {
        if (!user) return;
        try {
            setProcessing(true);
            const result = await repository.leaveBand(band.id, user.id);
            if (result.deleted) {
                showToast('עזבת את הלהקה. הלהקה נמחקה כי לא נותרו חברים.', 'info');
            } else {
                showToast('עזבת את הלהקה בהצלחה', 'success');
            }
            onClose();
            onBandDeleted?.();
        } catch (error) {
            console.error(error);
            showToast('שגיאה ביציאה מהלהקה', 'error');
        } finally {
            setProcessing(false);
            setConfirmLeave(false);
        }
    };

    const handleDeleteBand = async () => {
        if (!user) return;
        try {
            setProcessing(true);
            await repository.deleteBand(band.id, user.id);
            showToast('הלהקה נמחקה לצמיתות', 'success');
            onClose();
            onBandDeleted?.();
        } catch (error) {
            console.error(error);
            showToast('שגיאה במחיקת הלהקה', 'error');
        } finally {
            setProcessing(false);
            setConfirmDelete(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content band-settings-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>הגדרות להקה</h3>
                    <button className="btn-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        כללי
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
                        onClick={() => setActiveTab('members')}
                    >
                        חברים ({band.members.length})
                    </button>
                    {isCurrentUserLeader && (
                        <button
                            className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                            onClick={() => setActiveTab('applications')}
                        >
                            בקשות
                        </button>
                    )}
                </div>

                <div className="modal-body">
                    {activeTab === 'general' && (
                        <div className="settings-form">
                            <div className="form-group">
                                <label>שם הלהקה</label>
                                <input
                                    className="input-field"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    disabled={!isCurrentUserLeader}
                                />
                            </div>
                            <div className="form-group">
                                <label>תיאור</label>
                                <textarea
                                    className="input-field"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    disabled={!isCurrentUserLeader}
                                />
                            </div>
                            <div className="form-group">
                                <label>עיר</label>
                                <input
                                    className="input-field"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    disabled={!isCurrentUserLeader}
                                />
                            </div>
                            {!isCurrentUserLeader && (
                                <p className="text-sm text-warning mt-2" style={{ color: 'var(--text-muted)' }}>
                                    רשאים לערוך פרטים: מנהל הלהקה בלבד.
                                </p>
                            )}

                            {/* Danger Zone */}
                            <div className="danger-zone">
                                <h4 className="danger-zone-title">
                                    <AlertTriangle size={18} />
                                    אזור מסוכן
                                </h4>

                                {/* Leave Band - visible to everyone */}
                                <div className="danger-zone-item">
                                    <div className="danger-zone-info">
                                        <strong>עזיבת הלהקה</strong>
                                        <p>צא מהלהקה. אם אתה האחרון, הלהקה תימחק.</p>
                                    </div>
                                    {!confirmLeave ? (
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => setConfirmLeave(true)}
                                            disabled={processing}
                                        >
                                            <LogOut size={16} />
                                            עזוב להקה
                                        </button>
                                    ) : (
                                        <div className="confirm-actions">
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={handleLeaveBand}
                                                disabled={processing}
                                            >
                                                {processing ? 'יוצא...' : 'אישור עזיבה'}
                                            </button>
                                            <button
                                                className="btn btn-sm btn-ghost"
                                                onClick={() => setConfirmLeave(false)}
                                                disabled={processing}
                                            >
                                                ביטול
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Delete Band - only leader */}
                                {isCurrentUserLeader && (
                                    <div className="danger-zone-item">
                                        <div className="danger-zone-info">
                                            <strong>מחיקת הלהקה</strong>
                                            <p>מחיקה לצמיתות של הלהקה, כולל כל המשימות, השירים והחזרות.</p>
                                        </div>
                                        {!confirmDelete ? (
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => setConfirmDelete(true)}
                                                disabled={processing}
                                            >
                                                <Trash2 size={16} />
                                                מחק להקה
                                            </button>
                                        ) : (
                                            <div className="confirm-actions">
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={handleDeleteBand}
                                                    disabled={processing}
                                                >
                                                    {processing ? 'מוחק...' : 'מחק לצמיתות'}
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-ghost"
                                                    onClick={() => setConfirmDelete(false)}
                                                    disabled={processing}
                                                >
                                                    ביטול
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="members-list-settings">
                            {band.members.map(member => {
                                const memberUser = usersMap[member.userId];
                                const isMemberLeader = member.isLeader;
                                return (
                                    <div key={member.userId} className="member-item-settings">
                                        <div className="member-info-container">
                                            {memberUser?.avatarUrl ? (
                                                <img src={memberUser.avatarUrl} className="member-avatar-small" alt="" />
                                            ) : (
                                                <div className="member-avatar-small">{memberUser?.displayName?.[0]}</div>
                                            )}
                                            <div className="member-details">
                                                <span className="member-name">{memberUser?.displayName || 'Unknown'}</span>
                                                <div className="member-badges">
                                                    {isMemberLeader && <span className="member-badge leader">מנהל</span>}
                                                    <span className="member-badge instrument">{getInstrumentName(member.instrumentId)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isCurrentUserLeader && !isMemberLeader && (
                                            <button
                                                className="btn-icon text-danger"
                                                onClick={() => handleRemoveMember(member.userId)}
                                                title="הסר חבר"
                                            >
                                                <UserMinus size={18} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'applications' && (
                        <div className="applications-list">
                            {loadingApps ? (
                                <div className="text-center py-4">טוען...</div>
                            ) : applications.length === 0 ? (
                                <div className="empty-state text-center py-4 text-muted">אין בקשות ממתינות</div>
                            ) : (
                                applications.map(app => {
                                    const applicant = usersMap[app.applicantId];
                                    return (
                                        <div key={app.id} className="application-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                                            <div className="app-info">
                                                <div className="font-bold">{applicant?.displayName || 'משתמש לא ידוע'}</div>
                                                <div className="text-sm text-primary">{getInstrumentName(app.instrumentId)}</div>
                                                {app.message && <div className="text-sm text-muted mt-1">"{app.message}"</div>}
                                            </div>
                                            <div className="app-actions flex gap-2">
                                                <button
                                                    className="btn btn-sm btn-success btn-icon"
                                                    onClick={() => handleReviewApplication(app.id, 'approved')}
                                                    title="אשר"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger btn-icon"
                                                    onClick={() => handleReviewApplication(app.id, 'rejected')}
                                                    title="דחה"
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {activeTab === 'general' && isCurrentUserLeader && (
                        <button className="btn btn-primary" onClick={handleSaveDetails} disabled={saving}>
                            {saving ? 'שומר...' : (
                                <>
                                    <Save size={18} style={{ marginLeft: '0.5rem' }} />
                                    שמור שינויים
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

