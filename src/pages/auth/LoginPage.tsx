import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { repository } from '../../repositories';
import { User } from '../../types';
import './Login.css';

export function LoginPage() {
    const { signIn, signInWithGoogle, user } = useAuth();
    const navigate = useNavigate();

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dev State
    const [showDevTools, setShowDevTools] = useState(false);
    const [devUsers, setDevUsers] = useState<User[]>([]);

    useEffect(() => {
        // Load users for dev quick login hidden option
        repository.getAllUsers().then(setDevUsers);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await signIn(email, password);
            // Check if user needs onboarding
            const currentUser = await repository.getCurrentUser();
            if (currentUser && !currentUser.isOnboarded) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError('האימייל או הסיסמה שגויים. נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDevLogin = async (user: User) => {
        try {
            await signIn(user.email || '', 'password');
            // Check if user needs onboarding
            const currentUser = await repository.getCurrentUser();
            if (currentUser && !currentUser.isOnboarded) {
                navigate('/onboarding');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">🎸</div>
                    <h1>התחברות</h1>
                    <p className="text-lg" style={{ color: 'var(--color-text-primary)', opacity: 0.9 }}>כמו טינדר להרכבים</p>
                </div>

                {/* Social Login Mocks */}
                <div className="social-login">
                    <button
                        type="button"
                        className="social-btn"
                        onClick={async () => {
                            try {
                                await signInWithGoogle();
                                // Check if user needs onboarding
                                const currentUser = await repository.getCurrentUser();
                                if (currentUser && !currentUser.isOnboarded) {
                                    navigate('/onboarding');
                                } else {
                                    navigate('/');
                                }
                            } catch (err) {
                                const error = err as Error;
                                setError(error.message || 'התחברות נכשלה');
                            }
                        }}
                    >
                        <img src="https://www.svgrepo.com/show/355037/google.svg" alt="" width="18" height="18" />
                        <span>Google</span>
                    </button>
                    <button type="button" className="social-btn" onClick={() => alert('Apple login coming soon!')}>
                        <img src="https://www.svgrepo.com/show/445328/apple.svg" alt="" width="18" height="18" style={{ filter: 'invert(1)' }} />
                        <span>Apple</span>
                    </button>
                </div>

                <div className="divider-text">או התחבר עם אימייל</div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="alert alert-error mb-md">{error}</div>}

                    <div className="form-group">
                        <label className="form-label">כתובת אימייל</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <div className="flex-between mb-xs">
                            <label className="form-label mb-0">סיסמה</label>
                            <button type="button" className="btn-link" onClick={() => alert('עדיין לא מומש')}>שחכתי סיסמה?</button>
                        </div>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg mb-lg"
                        disabled={isSubmitting}
                        style={{ marginTop: '1.5rem' }}
                    >
                        {isSubmitting ? 'מתחבר...' : 'היכנס'}
                    </button>

                    <div className="text-center text-sm text-secondary">
                        עדיין אין לך חשבון?{' '}
                        <button type="button" className="btn-link font-bold" onClick={() => navigate('/onboarding')}>
                            הירשם עכשיו
                        </button>
                    </div>
                </form>

                {/* Quick Login for Devs */}
                <div className="dev-login-section">
                    <button
                        className="text-xs text-secondary hover:text-primary w-full text-center btn-ghost p-xs"
                        onClick={() => setShowDevTools(!showDevTools)}
                        style={{ background: 'transparent' }}
                    >
                        {showDevTools ? 'הסתר משתמשי פיתוח' : 'מצב פיתוח: התחברות מהירה'}
                    </button>

                    {showDevTools && (
                        <div className="user-list">
                            {devUsers.map(u => (
                                <button key={u.id} className="user-select-btn" onClick={() => handleDevLogin(u)}>
                                    <div className="avatar-small">
                                        {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" /> : u.displayName[0]}
                                    </div>
                                    <div className="text-right flex-1">
                                        <div className="font-bold text-sm">{u.displayName}</div>
                                        <div className="text-xs text-secondary">{u.email}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
