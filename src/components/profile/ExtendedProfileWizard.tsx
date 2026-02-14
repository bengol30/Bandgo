
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Check, Instagram, Phone, Globe, Music, Speaker, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { SearchStatus } from '../../types';
import './ExtendedProfileWizard.css';

interface ExtendedProfileWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
}

const STEPS = [
    { id: 'contact', title: 'איך יוצרים קשר?', icon: <Phone size={20} /> },
    { id: 'status', title: 'מה הסטטוס?', icon: <Search size={20} /> },
    { id: 'gear', title: 'ציוד וכלים', icon: <Speaker size={20} /> },
    { id: 'influences', title: 'השפעות מוזיקליות', icon: <Music size={20} /> },
];

export function ExtendedProfileWizard({ isOpen, onClose, onComplete }: ExtendedProfileWizardProps) {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form State
    const [contactInfo, setContactInfo] = useState({
        whatsapp: user?.contactInfo?.whatsapp || '',
        instagram: user?.contactInfo?.instagram || '',
        tiktok: user?.contactInfo?.tiktok || '',
        website: user?.contactInfo?.website || '',
    });
    const [searchStatus, setSearchStatus] = useState<SearchStatus | undefined>(user?.searchStatus);
    const [gear, setGear] = useState(user?.gear || '');
    const [influences, setInfluences] = useState(user?.influences?.join(', ') || '');

    if (!isOpen || !user) return null;

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            await handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await updateProfile({
                contactInfo,
                searchStatus,
                gear,
                influences: influences.split(',').map(s => s.trim()).filter(s => s),
            });
            showToast('הפרופיל עודכן בהצלחה! 🎸', 'success');
            onComplete();
        } catch (error) {
            console.error(error);
            showToast('שגיאה בעדכון הפרופיל', 'error');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Contact
                return (
                    <div className="wizard-step-content">
                        <h3 className="wizard-step-title">איך מוצאים אותך?</h3>
                        <p className="wizard-step-description">הוסף דרכי התקשרות כדי שמוזיקאים אחרים יוכלו להגיע אליך בקלות.</p>

                        <div className="wizard-form-group">
                            <label className="wizard-label">WhatsApp (מספר טלפון)</label>
                            <input
                                type="tel"
                                className="wizard-input"
                                placeholder="050-1234567"
                                value={contactInfo.whatsapp}
                                onChange={e => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                            />
                        </div>
                        <div className="wizard-form-group">
                            <label className="wizard-label">Instagram Username</label>
                            <input
                                type="text"
                                className="wizard-input"
                                placeholder="@username"
                                value={contactInfo.instagram}
                                onChange={e => setContactInfo({ ...contactInfo, instagram: e.target.value })}
                            />
                        </div>
                        <div className="wizard-form-group">
                            <label className="wizard-label">TikTok Username</label>
                            <input
                                type="text"
                                className="wizard-input"
                                placeholder="@username"
                                value={contactInfo.tiktok}
                                onChange={e => setContactInfo({ ...contactInfo, tiktok: e.target.value })}
                            />
                        </div>
                    </div>
                );
            case 1: // Status
                return (
                    <div className="wizard-step-content">
                        <h3 className="wizard-step-title">מה הסטטוס שלך?</h3>
                        <p className="wizard-step-description">עזור לנו להתאים לך את ההזדמנויות הנכונות.</p>

                        <div className="status-grid">
                            <div
                                className={`status-option ${searchStatus === SearchStatus.LOOKING ? 'selected' : ''}`}
                                onClick={() => setSearchStatus(SearchStatus.LOOKING)}
                            >
                                <span className="status-icon">🎸</span>
                                <span className="status-label">מחפש הרכב פעיל</span>
                            </div>
                            <div
                                className={`status-option ${searchStatus === SearchStatus.AVAILABLE_FOR_JAMS ? 'selected' : ''}`}
                                onClick={() => setSearchStatus(SearchStatus.AVAILABLE_FOR_JAMS)}
                            >
                                <span className="status-icon">🎷</span>
                                <span className="status-label">זמין לג'אמים והחלפות</span>
                            </div>
                            <div
                                className={`status-option ${searchStatus === SearchStatus.NOT_LOOKING ? 'selected' : ''}`}
                                onClick={() => setSearchStatus(SearchStatus.NOT_LOOKING)}
                            >
                                <span className="status-icon">✋</span>
                                <span className="status-label">לא מחפש כרגע</span>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Gear
                return (
                    <div className="wizard-step-content">
                        <h3 className="wizard-step-title">על מה אתה מנגן?</h3>
                        <p className="wizard-step-description">ציין את הציוד המקצועי שלך (מגברים, גיטרות, פדאלים וכו').</p>

                        <textarea
                            className="wizard-input"
                            rows={6}
                            placeholder="Fender Stratocaster American Pro, Marshall DSL40CR, Pedalboard..."
                            value={gear}
                            onChange={e => setGear(e.target.value)}
                        />
                    </div>
                );
            case 3: // Influences
                return (
                    <div className="wizard-step-content">
                        <h3 className="wizard-step-title">מי ההשראות שלך?</h3>
                        <p className="wizard-step-description">רשום את האמנים והלהקות שהכי השפיעו עליך (מופרדים בפסיקים).</p>

                        <textarea
                            className="wizard-input"
                            rows={4}
                            placeholder="Pink Floyd, Tame Impala, Led Zeppelin..."
                            value={influences}
                            onChange={e => setInfluences(e.target.value)}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="wizard-overlay">
            <div className="wizard-modal">
                <div className="wizard-header">
                    <div className="wizard-title">
                        {STEPS[currentStep].icon}
                        <span>{STEPS[currentStep].title}</span>
                    </div>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="wizard-content">
                    {renderStepContent()}
                </div>

                <div className="wizard-footer">
                    <button
                        className="btn btn-ghost btn-skip"
                        onClick={onClose}
                    >
                        דלג לשלב הבא
                    </button>

                    <div className="flex gap-sm">
                        {currentStep > 0 && (
                            <button
                                className="btn btn-secondary"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                <ChevronRight size={18} />
                                חזור
                            </button>
                        )}
                        <button
                            className="btn btn-primary"
                            onClick={handleNext}
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="spinner spinner-xs"></span>
                            ) : currentStep === STEPS.length - 1 ? (
                                <>
                                    <span>סיים</span>
                                    <Check size={18} />
                                </>
                            ) : (
                                <>
                                    <span>המשך</span>
                                    <ChevronLeft size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
