// ============================================
// bandgo - Onboarding Page
// Multi-step Wizard: Intro -> Account -> Profile -> Complete
// ============================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    CheckCircle,
    Heart,
    Star,
    User as UserIcon,
    Mail,
    Lock,
    Music,
    MapPin,
    ArrowRight,
    ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { UserRole } from '../../types';
import { INSTRUMENTS, GENRES } from '../../data/constants';
import './Onboarding.css';

const timelineSteps = [
    {
        icon: '🎯',
        title: 'פותחים הרכב או מצטרפים',
        text: 'פרסמו בקשה להרכב חדש או הגישו בקשה להצטרף להרכב קיים',
    },
    {
        icon: '🤝',
        title: 'מתגבשים ללהקה',
        text: 'לאחר שיש מספיק חברים, הלהקה מתגבשת ונפתח להם אזור משותף',
    },
    {
        icon: '🎵',
        title: 'חזרות בסלון המוזיקה',
        text: 'קובעים חזרות בסלון פטיפון ומתקדמים לקראת היעד',
    },
    {
        icon: '🎤',
        title: 'הופעה + סשן לייב מצולם',
        text: 'אחרי מספיק חזרות - מבקשים הופעה ואופציה לסשן מקצועי מצולם',
    },
];

export function OnboardingPage() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const { showToast } = useToast();

    // Steps: 0=Intro, 1=Account, 2=Profile
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        mainInstrument: '',
        genres: [] as string[],
        bio: '',
        city: ''
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await register({
                displayName: formData.displayName,
                email: formData.email,
                photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.email}`,
                role: UserRole.USER,
                bio: formData.bio,
                location: formData.city,
                radiusKm: 30, // Default radius
                isVocalist: false, // Default
                isSongwriter: false, // Default
                samples: [],
                mainInstrument: formData.mainInstrument, // Keeping for backward compatibility if needed, but better to rely on instruments array
                genres: formData.genres,
                isOnboarded: true,
                createdAt: new Date(),
                lastLoginAt: new Date(),
                updatedAt: new Date(),
                instruments: [{ instrumentId: formData.mainInstrument }]
            });
            showToast('ההרשמה בוצעה בהצלחה! ברוכים הבאים 🎉', 'success');
            navigate('/');
        } catch (error: any) {
            console.error('Registration failed:', error);
            showToast(error.message || 'שגיאה בהרשמה', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleGenre = (genreId: string) => {
        setFormData(prev => {
            if (prev.genres.includes(genreId)) {
                return { ...prev, genres: prev.genres.filter(g => g !== genreId) };
            }
            if (prev.genres.length >= 5) {
                showToast('ניתן לבחור עד 5 סגנונות', 'info');
                return prev;
            }
            return { ...prev, genres: [...prev.genres, genreId] };
        });
    };

    // --- RENDER STEPS ---

    const renderIntro = () => (
        <div className="onboarding-step-content fade-in">
            <div className="onboarding-header">
                <span className="onboarding-logo">🎸</span>
                <h1 className="onboarding-title">כאן בונים להקות</h1>
                <p className="onboarding-subtitle">
                    הפלטפורמה שמחברת מוזיקאים ומביאה אותם לבמה
                </p>
                <div className="onboarding-tagline">
                    <Sparkles size={16} />
                    <span>כמו טינדר להרכבים</span>
                </div>
            </div>

            <div className="onboarding-timeline">
                {timelineSteps.map((step, index) => (
                    <div key={index} className="timeline-item">
                        <div className="timeline-icon">{step.icon}</div>
                        <div className="timeline-content">
                            <h3 className="timeline-title">{step.title}</h3>
                            <p className="timeline-text">{step.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="onboarding-cta">
                <button className="btn btn-primary btn-lg w-full" onClick={handleNext}>
                    בואו נתחיל! 🚀
                </button>
                <div className="text-center mt-4">
                    <span className="text-secondary text-sm">יש לי כבר חשבון? </span>
                    <button onClick={() => navigate('/login')} className="btn-link text-sm font-bold">
                        התחבר
                    </button>
                </div>
            </div>
        </div>
    );

    const renderAccountForm = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="onboarding-step-content fade-in">
            <div className="step-header">
                <h2>יצירת חשבון</h2>
                <p>כמה פרטים בסיסיים ומתחילים</p>
            </div>

            <div className="form-group">
                <label className="form-label"><UserIcon size={16} /> שם מלא / כינוי</label>
                <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="איך יקראו לך בלהקה?"
                />
            </div>

            <div className="form-group">
                <label className="form-label"><Mail size={16} /> אימייל</label>
                <input
                    type="email"
                    className="form-input"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                />
            </div>

            <div className="form-group">
                <label className="form-label"><Lock size={16} /> סיסמה</label>
                <input
                    type="password"
                    className="form-input"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="לפחות 6 תווים"
                />
            </div>

            <div className="step-actions">
                <button type="button" className="btn btn-ghost" onClick={handleBack}>חזור</button>
                <button type="submit" className="btn btn-primary">המשך <ArrowLeft size={16} /></button>
            </div>
        </form>
    );

    const renderProfileForm = () => (
        <form onSubmit={handleRegister} className="onboarding-step-content fade-in">
            <div className="step-header">
                <h2>בניית פרופיל מוזיקאי</h2>
                <p>ספרו לנו על המוזיקה שלכם</p>
            </div>

            <div className="form-group">
                <label className="form-label"><Music size={16} /> כלי נגינה ראשי</label>
                <select
                    className="form-select"
                    required
                    value={formData.mainInstrument}
                    onChange={e => setFormData({ ...formData, mainInstrument: e.target.value })}
                >
                    <option value="">בחר כלי נגינה...</option>
                    {INSTRUMENTS.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.nameHe}</option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">סגנונות מועדפים (עד 5)</label>
                <div className="genres-grid">
                    {GENRES.map(genre => (
                        <button
                            key={genre.id}
                            type="button"
                            className={`genre-tag ${formData.genres.includes(genre.id) ? 'active' : ''}`}
                            onClick={() => toggleGenre(genre.id)}
                        >
                            {genre.nameHe}
                        </button>
                    ))}
                </div>
            </div>

            <div className="form-group">
                <label className="form-label"><MapPin size={16} /> עיר מגורים</label>
                <input
                    type="text"
                    className="form-input"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="איפה אתם גרים?"
                />
            </div>

            <div className="form-group">
                <label className="form-label">קצת עליי (אופציונלי)</label>
                <textarea
                    className="form-textarea"
                    rows={3}
                    value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="ניסיון מוזיקלי, להקות עבר, וכו'..."
                />
            </div>

            <div className="step-actions">
                <button type="button" className="btn btn-ghost" onClick={handleBack}>חזור</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'יוצר חשבון...' : 'סיימנו! צא לדרך 🚀'}
                </button>
            </div>
        </form>
    );

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                {/* Progress Indicators (Only for wizard steps) */}
                {step > 0 && (
                    <div className="onboarding-progress">
                        <div className={`progress-dot ${step >= 1 ? 'active' : ''}`}></div>
                        <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
                        <div className={`progress-dot ${step >= 2 ? 'active' : ''}`}></div>
                    </div>
                )}

                {step === 0 && renderIntro()}
                {step === 1 && renderAccountForm()}
                {step === 2 && renderProfileForm()}
            </div>
        </div>
    );
}
