
import React, { useState } from 'react';
import { X, Save, Target, Clock, Users, Music } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Band, BandCommitmentLevel } from '../../types';
import './BandRefinementModal.css';

interface BandRefinementModalProps {
    band: Band;
    isOpen: boolean;
    onClose: () => void;
    onBandUpdated: (band: Band) => void;
}

export function BandRefinementModal({ band, isOpen, onClose, onBandUpdated }: BandRefinementModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [commitmentLevel, setCommitmentLevel] = useState<BandCommitmentLevel>(band.commitmentLevel || BandCommitmentLevel.HOBBY);
    const [rehearsalFrequency, setRehearsalFrequency] = useState(band.rehearsalFrequency || '');
    const [targetAgeMin, setTargetAgeMin] = useState(band.targetAgeRange?.min || 18);
    const [targetAgeMax, setTargetAgeMax] = useState(band.targetAgeRange?.max || 99);
    const [influences, setInfluences] = useState(band.influences?.join(', ') || '');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updatedBand = await localRepository.updateBand(band.id, {
                commitmentLevel,
                rehearsalFrequency,
                targetAgeRange: {
                    min: Number(targetAgeMin),
                    max: Number(targetAgeMax)
                },
                influences: influences.split(',').map(s => s.trim()).filter(s => s)
            });

            onBandUpdated(updatedBand);
            showToast('פרטי החיפוש עודכנו בהצלחה', 'success');
            onClose();
        } catch (error) {
            console.error('Failed to update band refinement:', error);
            showToast('שגיאה בעדכון הפרטים', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="refinement-modal">
                <div className="refinement-header">
                    <div className="refinement-title">
                        <Target size={24} className="text-primary" />
                        <span>דיוק חיפוש נגנים</span>
                    </div>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="refinement-content">

                    {/* Commitment Level */}
                    <div className="refinement-section">
                        <h3 className="refinement-section-title">
                            <Target size={18} />
                            רמת מחויבות
                        </h3>
                        <div className="commitment-grid">
                            <div
                                className={`commitment-option ${commitmentLevel === BandCommitmentLevel.HOBBY ? 'selected' : ''}`}
                                onClick={() => setCommitmentLevel(BandCommitmentLevel.HOBBY)}
                            >
                                <span className="commitment-icon">🍻</span>
                                <span className="commitment-label">תחביב / כיף</span>
                            </div>
                            <div
                                className={`commitment-option ${commitmentLevel === BandCommitmentLevel.INTERMEDIATE ? 'selected' : ''}`}
                                onClick={() => setCommitmentLevel(BandCommitmentLevel.INTERMEDIATE)}
                            >
                                <span className="commitment-icon">🎸</span>
                                <span className="commitment-label">רציני (חזרות והופעות)</span>
                            </div>
                            <div
                                className={`commitment-option ${commitmentLevel === BandCommitmentLevel.PROFESSIONAL ? 'selected' : ''}`}
                                onClick={() => setCommitmentLevel(BandCommitmentLevel.PROFESSIONAL)}
                            >
                                <span className="commitment-icon">🏆</span>
                                <span className="commitment-label">מקצועי / פרנסה</span>
                            </div>
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="refinement-section">
                        <h3 className="refinement-section-title">
                            <Clock size={18} />
                            תדירות חזרות
                        </h3>
                        <input
                            type="text"
                            className="form-input w-full"
                            placeholder="למשל: פעם בשבוע בערב"
                            value={rehearsalFrequency}
                            onChange={e => setRehearsalFrequency(e.target.value)}
                        />
                    </div>

                    {/* Age Range */}
                    <div className="refinement-section">
                        <h3 className="refinement-section-title">
                            <Users size={18} />
                            טווח גילאים רצוי
                        </h3>
                        <div className="range-inputs">
                            <div className="range-input-group">
                                <label>מגיל</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '80px' }}
                                    value={targetAgeMin}
                                    onChange={e => setTargetAgeMin(Number(e.target.value))}
                                    min={10} max={99}
                                />
                            </div>
                            <span>עד</span>
                            <div className="range-input-group">
                                <label>גיל</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ width: '80px' }}
                                    value={targetAgeMax}
                                    onChange={e => setTargetAgeMax(Number(e.target.value))}
                                    min={10} max={99}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Influences */}
                    <div className="refinement-section">
                        <h3 className="refinement-section-title">
                            <Music size={18} />
                            השפעות מוזיקליות (לאלגוריתם ההתאמה)
                        </h3>
                        <textarea
                            className="form-textarea w-full"
                            rows={3}
                            placeholder="Beatles, Radiohead, Arctic Monkeys..."
                            value={influences}
                            onChange={e => setInfluences(e.target.value)}
                        />
                    </div>

                    <div className="refinement-footer">
                        <button type="button" className="btn btn-ghost" onClick={onClose}>ביטול</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner spinner-white spinner-sm"></span> : <Save size={18} />}
                            <span>שמור הגדרות</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
