import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Link as LinkIcon, Youtube, Music } from 'lucide-react';
import { Song, SongLink } from '../../types';
import './Songs.css';

interface ManageSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (songData: Partial<Song>) => Promise<void>;
    initialData?: Song | null;
    saving: boolean;
}

export function ManageSongModal({ isOpen, onClose, onSave, initialData, saving }: ManageSongModalProps) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState<Partial<Song>>({
        title: '',
        lyrics: '',
        chords: '',
        bpm: undefined,
        key: '',
        notes: '',
        structure: '',
        links: []
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                lyrics: initialData.lyrics || '',
                chords: initialData.chords || '',
                bpm: initialData.bpm,
                key: initialData.key || '',
                notes: initialData.notes || '',
                structure: initialData.structure || '',
                links: initialData.links || []
            });
        } else {
            setFormData({
                title: '',
                lyrics: '',
                chords: '',
                bpm: undefined,
                key: '',
                notes: '',
                structure: '',
                links: []
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const addLink = () => {
        setFormData(prev => ({
            ...prev,
            links: [...(prev.links || []), { url: '', type: 'youtube', title: '' }]
        }));
    };

    const removeLink = (index: number) => {
        setFormData(prev => ({
            ...prev,
            links: prev.links?.filter((_, i) => i !== index)
        }));
    };

    const updateLink = (index: number, field: keyof SongLink, value: string) => {
        const newLinks = [...(formData.links || [])];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData(prev => ({ ...prev, links: newLinks }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {initialData ? 'עריכת שיר' : 'הוספת שיר חדש'}
                    </h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-body">
                    {/* Basic Info Row */}
                    <div className="form-grid gap-md" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        <div className="form-group col-span-2" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">שם השיר *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                                placeholder="לדוגמה: Sweet Child O' Mine"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">סולם (Key)</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.key || ''}
                                onChange={e => setFormData({ ...formData, key: e.target.value })}
                                placeholder="לדוגמה: Am"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">BPM (קצב)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.bpm || ''}
                                onChange={e => setFormData({ ...formData, bpm: parseInt(e.target.value) || undefined })}
                                placeholder="לדוגמה: 120"
                            />
                        </div>

                        <div className="form-group col-span-2" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">מבנה השיר</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.structure || ''}
                                onChange={e => setFormData({ ...formData, structure: e.target.value })}
                                placeholder="Intro -> V1 -> C -> V2 -> C -> Solo -> C -> Outro"
                            />
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="form-section mt-md" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                        <div className="flex justify-between items-center mb-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label className="form-label mb-0">קישורים (YouTube, Spotify)</label>
                            <button type="button" className="btn btn-sm btn-ghost text-accent" onClick={addLink} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}>
                                <Plus size={16} /> הוסף קישור
                            </button>
                        </div>
                        <div className="space-y-sm" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {formData.links?.map((link, index) => (
                                <div key={index} className="flex gap-sm items-center" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        className="form-select w-32"
                                        value={link.type}
                                        onChange={e => updateLink(index, 'type', e.target.value as any)}
                                        style={{ width: '120px', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                                    >
                                        <option value="youtube">YouTube</option>
                                        <option value="spotify">Spotify</option>
                                        <option value="apple_music">Apple Music</option>
                                        <option value="other">אחר</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="form-input flex-1"
                                        value={link.url}
                                        onChange={e => updateLink(index, 'url', e.target.value)}
                                        placeholder="הדבק קישור כאן..."
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-icon btn-ghost text-error"
                                        onClick={() => removeLink(index)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(!formData.links || formData.links.length === 0) && (
                                <div className="text-sm text-secondary italic">אין קישורים מצורפים</div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="form-grid gap-md mt-md" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">מילים</label>
                            <textarea
                                className="form-textarea"
                                value={formData.lyrics || ''}
                                onChange={e => setFormData({ ...formData, lyrics: e.target.value })}
                                placeholder="הכנס את מילות השיר כאן..."
                                rows={6}
                                style={{ width: '100%', padding: '0.75rem', resize: 'vertical' }}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">אקורדים / טאבים</label>
                            <textarea
                                className="form-textarea font-mono"
                                value={formData.chords || ''}
                                onChange={e => setFormData({ ...formData, chords: e.target.value })}
                                placeholder="C G Am F..."
                                rows={6}
                                style={{ width: '100%', padding: '0.75rem', fontFamily: 'monospace', resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
                            ביטול
                        </button>
                        <button type="submit" className="btn-submit" disabled={saving || !formData.title?.trim()}>
                            {saving ? (
                                <>
                                    <div className="spinner spinner-sm"></div>
                                    שומר...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {initialData ? 'עדכן שיר' : 'שמור שיר'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
