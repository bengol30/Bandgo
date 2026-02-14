import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Save, Upload, X, Plus, User as UserIcon, Music, Disc } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { INSTRUMENTS, GENRES, AVATAR_OPTIONS } from '../../data/constants';
import { InstrumentLevel, UserInstrument } from '../../types';
import './EditProfile.css';

export function EditProfilePage() {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

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
                    <button className="btn btn-icon btn-ghost" onClick={() => navigate('/profile')}>
                        <ArrowRight />
                    </button>
                    <h1 className="edit-profile-title">עריכת פרופיל</h1>
                </header>

                <form onSubmit={handleSubmit}>
                    {/* Avatar Section */}
                    <section className="avatar-edit-section">
                        <div className="avatar-preview-wrapper mb-md">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Preview" className="avatar-preview" />
                            ) : (
                                <div className="avatar-placeholder-large">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="avatar-selection-area">
                            <label className="form-label text-center mb-sm">בחר תמונת פרופיל</label>
                            <div className="avatar-grid">
                                {AVATAR_OPTIONS.map((url, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`avatar-option-btn ${avatarUrl === url ? 'selected' : ''}`}
                                        onClick={() => setAvatarUrl(url)}
                                    >
                                        <img src={url} alt={`Avatar ${index}`} className="avatar-option-img" />
                                    </button>
                                ))}
                            </div>

                            <div className="avatar-upload-divider">
                                <span>או קישור אישי</span>
                            </div>

                            <input
                                type="text"
                                className="form-input w-full text-center"
                                value={avatarUrl}
                                onChange={e => setAvatarUrl(e.target.value)}
                                placeholder="https://example.com/photo.jpg"
                            />
                        </div>
                    </section>

                    {/* Personal Info */}
                    <section className="edit-section">
                        <div className="edit-section-header">
                            <h2 className="edit-section-title">
                                <UserIcon size={20} className="text-primary" />
                                פרטים אישיים
                            </h2>
                        </div>

                        <div className="form-grid gap-md">
                            <div className="form-group mb-md">
                                <label className="form-label">שם תצוגה</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group mb-md">
                                <label className="form-label">עיר מגורים</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    value={city}
                                    onChange={e => setCity(e.target.value)}
                                />
                            </div>

                            <div className="form-group col-span-2">
                                <label className="form-label">קצת עליי (Bio)</label>
                                <textarea
                                    className="form-input w-full"
                                    rows={4}
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="ספר/י קצת על הרקע המוזיקלי שלך..."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Instruments */}
                    <section className="edit-section">
                        <div className="edit-section-header">
                            <h2 className="edit-section-title">
                                <Music size={20} className="text-secondary" />
                                הכלים שלי
                            </h2>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={handleAddInstrument}>
                                <Plus size={16} />
                                הוסף כלי
                            </button>
                        </div>

                        <div className="instruments-list">
                            {instruments.map((inst, index) => (
                                <div key={index} className="instrument-edit-item">
                                    <select
                                        className="instrument-select"
                                        value={inst.instrumentId}
                                        onChange={e => handleUpdateInstrument(index, 'instrumentId', e.target.value)}
                                    >
                                        {INSTRUMENTS.map(i => (
                                            <option key={i.id} value={i.id}>{i.nameHe}</option>
                                        ))}
                                    </select>

                                    <select
                                        className="level-select"
                                        value={inst.level}
                                        onChange={e => handleUpdateInstrument(index, 'level', e.target.value)}
                                    >
                                        <option value={InstrumentLevel.BEGINNER}>מתחיל</option>
                                        <option value={InstrumentLevel.INTERMEDIATE}>בינוני</option>
                                        <option value={InstrumentLevel.ADVANCED}>מתקדם</option>
                                        <option value={InstrumentLevel.PROFESSIONAL}>מקצועי</option>
                                    </select>

                                    <button
                                        type="button"
                                        className="btn btn-icon btn-ghost text-error remove-inst-btn"
                                        onClick={() => handleRemoveInstrument(index)}
                                        title="הסר כלי"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                            {instruments.length === 0 && (
                                <div className="text-center p-lg text-muted bg-bg-tertiary rounded-lg border-dashed border border-border">
                                    לא הוגדרו כלים עדיין. לחץ "הוסף כלי" כדי להתחיל.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Genres */}
                    <section className="edit-section">
                        <div className="edit-section-header">
                            <h2 className="edit-section-title">
                                <Disc size={20} className="text-accent" />
                                סגנונות מועדפים
                            </h2>
                        </div>
                        <div className="genres-grid">
                            {GENRES.map(genre => (
                                <button
                                    key={genre.id}
                                    type="button"
                                    className={`genre-chip ${genres.includes(genre.id) ? 'selected' : ''}`}
                                    onClick={() => toggleGenre(genre.id)}
                                >
                                    {genre.nameHe}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Sticky Footer Actions */}
                    <div className="edit-actions-footer">
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
                            className="btn btn-primary btn-lg shadow-lg flex items-center gap-sm"
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
