import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Upload, X, Plus, User as UserIcon, Music, Disc, Camera, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { INSTRUMENTS, GENRES } from '../../data/constants';
import { InstrumentLevel, UserInstrument } from '../../types';
import './EditProfile.css';

export function EditProfilePage() {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [city, setCity] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [instruments, setInstruments] = useState<UserInstrument[]>([]);
    const [genres, setGenres] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName || '');
            setBio(user.bio || '');
            setCity(user.city || '');
            setAvatarUrl(user.avatarUrl || '');
            setInstruments(user.instruments || []);
            setGenres(user.genres || []);
        } else {
            navigate('/');
        }
    }, [user, navigate]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('הקובץ גדול מדי (מקסימום 5MB)', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
                showToast('התמונה נטענה בהצלחה!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateProfile({
                displayName,
                bio,
                city,
                avatarUrl,
                instruments,
                genres
            });
            showToast('הפרופיל עודכן בהצלחה! 🎉', 'success');
            navigate('/profile');
        } catch (error) {
            console.error(error);
            showToast('שגיאה בעדכון הפרופיל', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddInstrument = () => {
        setInstruments([...instruments, { instrumentId: 'guitar', level: InstrumentLevel.BEGINNER }]);
    };

    const handleRemoveInstrument = (index: number) => {
        const newInstruments = [...instruments];
        newInstruments.splice(index, 1);
        setInstruments(newInstruments);
    };

    const handleUpdateInstrument = (index: number, field: keyof UserInstrument, value: any) => {
        const newInstruments = [...instruments];
        newInstruments[index] = { ...newInstruments[index], [field]: value };
        setInstruments(newInstruments);
    };

    const toggleGenre = (genreId: string) => {
        if (genres.includes(genreId)) {
            setGenres(genres.filter(g => g !== genreId));
        } else {
            setGenres([...genres, genreId]);
        }
    };

    if (!user) return null;

    return (
        <div className="page edit-profile-page">
            <div className="container edit-profile-container">
                <header className="edit-profile-header">
                    <button className="btn btn-icon btn-ghost back-btn" onClick={() => navigate('/profile')}>
                        <ArrowLeft />
                    </button>
                    <h1 className="edit-profile-title">עריכת פרופיל</h1>
                    <div className="header-spacer"></div>
                </header>

                <form onSubmit={handleSubmit} className="edit-profile-form">
                    {/* Avatar Section */}
                    <section className="form-card avatar-section">
                        <div className="avatar-upload-container">
                            <div
                                className="avatar-preview-wrapper"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Profile" className="avatar-preview" />
                                ) : (
                                    <div className="avatar-placeholder-large">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="avatar-edit-overlay">
                                    <Camera size={24} />
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <button
                                type="button"
                                className="btn btn-text btn-change-photo"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                החלף תמונה
                            </button>
                        </div>
                    </section>

                    {/* Personal Info */}
                    <section className="form-card">
                        <div className="card-header">
                            <UserIcon size={20} className="text-primary" />
                            <h2>פרטים אישיים</h2>
                        </div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">שם תצוגה</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder="איך יקראו לך באפליקציה?"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">עיר מגורים</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                    placeholder="איפה אתה מנגן?"
                                />
                            </div>

                            <div className="form-group full-width">
                                <label className="form-label">קצת עליי</label>
                                <textarea
                                    className="form-textarea"
                                    rows={4}
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="ספר/י על הרקע המוזיקלי, השפעות ומה את/ה מחפש/ת..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Instruments */}
                    <section className="form-card">
                        <div className="card-header">
                            <div className="header-title">
                                <Music size={20} className="text-secondary" />
                                <h2>הכלים שלי</h2>
                            </div>
                            <button type="button" className="btn btn-text-primary" onClick={handleAddInstrument}>
                                <Plus size={16} />
                                <span>הוסף כלי</span>
                            </button>
                        </div>

                        <div className="instruments-stack">
                            {instruments.map((inst, index) => (
                                <div key={index} className="instrument-row-card">
                                    <div className="instrument-select-wrapper">
                                        <select
                                            className="form-select instrument-name"
                                            value={inst.instrumentId}
                                            onChange={e => handleUpdateInstrument(index, 'instrumentId', e.target.value)}
                                        >
                                            {INSTRUMENTS.map(i => (
                                                <option key={i.id} value={i.id}>{i.nameHe}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="level-select-wrapper">
                                        <select
                                            className="form-select instrument-level"
                                            value={inst.level}
                                            onChange={e => handleUpdateInstrument(index, 'level', e.target.value)}
                                        >
                                            <option value={InstrumentLevel.BEGINNER}>מתחיל</option>
                                            <option value={InstrumentLevel.INTERMEDIATE}>בינוני</option>
                                            <option value={InstrumentLevel.ADVANCED}>מתקדם</option>
                                            <option value={InstrumentLevel.PROFESSIONAL}>מקצועי</option>
                                        </select>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn-icon-danger"
                                        onClick={() => handleRemoveInstrument(index)}
                                        title="הסר"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {instruments.length === 0 && (
                                <div className="empty-instruments">
                                    <p>עדיין לא הוספת כלי נגינה</p>
                                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddInstrument}>
                                        הוסף את הכלי הראשון שלך
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Genres */}
                    <section className="form-card">
                        <div className="card-header">
                            <Disc size={20} className="text-accent" />
                            <h2>סגנונות מועדפים</h2>
                        </div>
                        <div className="genres-container">
                            {GENRES.map(genre => (
                                <button
                                    key={genre.id}
                                    type="button"
                                    className={`genre-choice ${genres.includes(genre.id) ? 'active' : ''}`}
                                    onClick={() => toggleGenre(genre.id)}
                                >
                                    {genre.nameHe}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="form-actions-sticky">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => navigate('/profile')}
                            disabled={loading}
                        >
                            ביטול
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-save"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner spinner-white spinner-sm"></span> : <Save size={18} />}
                            <span>שמור שינויים</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
