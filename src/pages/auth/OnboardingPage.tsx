// ============================================
// bandgo - Onboarding Page
// "איך זה עובד" - How it works
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Sparkles,
    Users,
    Music,
    Calendar,
    Mic,
    Video,
    CheckCircle,
    Heart,
    Star
} from 'lucide-react';
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

    const handleStart = () => {
        // In real app, mark onboarding as complete in user preferences
        navigate('/');
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-content">
                {/* Header */}
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

                {/* Timeline */}
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

                {/* Transparency */}
                <div className="onboarding-transparency">
                    <div className="transparency-item">
                        <Heart className="transparency-icon" size={18} />
                        <p className="transparency-text">
                            <strong>ממומן ע״י יחידת הצעירים</strong> של עיריית קריית שמונה
                        </p>
                    </div>
                    <div className="transparency-item">
                        <CheckCircle className="transparency-icon" size={18} />
                        <p className="transparency-text">
                            כל <strong>השירותים וההזדמנויות בחינם</strong> - חזרות, הופעות, סשנים
                        </p>
                    </div>
                    <div className="transparency-item">
                        <Star className="transparency-icon" size={18} />
                        <p className="transparency-text">
                            מצפים <strong>לרצינות ומחויבות</strong> - כדי לפתוח שלבים והזדמנויות
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="onboarding-cta">
                    <button className="btn btn-primary" onClick={handleStart}>
                        בואו נתחיל! 🚀
                    </button>
                    <a href="/" className="onboarding-skip">
                        יש לי כבר חשבון, תכניסו אותי
                    </a>
                </div>
            </div>
        </div>
    );
}
