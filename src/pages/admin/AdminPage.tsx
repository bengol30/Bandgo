import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Music,
    Calendar,
    Settings,
    Shield,
    ArrowRight,
    TrendingUp,
    Check,
    X,
    Trash2,
    MessageSquare,
    AlertTriangle,
    Ban,
    UserCog,
    Lock as LockIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { repository } from '../../repositories';
import { useToast } from '../../contexts/ToastContext';
import { User, PerformanceRequest, Event, Band, PerformanceRequestStatus, EventType, SystemSettings, Report as AppReport, UserRole, EventSubmission, EventSubmissionStatus } from '../../types';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { googleCalendarService } from '../../services/GoogleCalendarService';
import './Admin.css';

export function AdminPage() {
    const { user, isAdmin } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'overview' | 'bands' | 'users' | 'events' | 'settings' | 'reports' | 'submissions'>('overview');
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        users: 0,
        bands: 0,
        events: 0,
        reports: 0,
        submissions: 0
    });

    const [users, setUsers] = useState<User[]>([]);
    const [bands, setBands] = useState<Band[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [bandsMap, setBandsMap] = useState<Record<string, Band>>({});
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [reports, setReports] = useState<AppReport[]>([]);
    const [submissions, setSubmissions] = useState<EventSubmission[]>([]);

    // Modal States
    const [showCreateEventModal, setShowCreateEventModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' } | null>(null);
    const [showResolveReportModal, setShowResolveReportModal] = useState(false);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [reportNote, setReportNote] = useState('');

    // Submission Modals
    const [showSubmissionRejectModal, setShowSubmissionRejectModal] = useState(false);
    const [showSubmissionChangesModal, setShowSubmissionChangesModal] = useState(false);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
    const [submissionNote, setSubmissionNote] = useState('');

    // New Event Form State
    const [newEventTitle, setNewEventTitle] = useState('');

    useEffect(() => {
        if (!user || !isAdmin) {
            navigate('/');
            return;
        }
        loadData();
    }, [user, isAdmin, activeTab]);

    const loadData = async (targetTab?: string) => {
        const tabToLoad = targetTab || activeTab;
        try {
            setLoading(true);

            // Fetch core stats and initial data if not loaded
            if (tabToLoad === 'overview' || !settings) {
                const [allUsers, allRequests, allBands, allEvents, currentSettings, allReports] = await Promise.all([
                    repository.getAllUsers(),
                    repository.getAllPerformanceRequests(),
                    repository.getBands(),
                    repository.getEvents(),
                    repository.getSystemSettings(),
                    repository.getReports()
                ]);

                setStats({
                    users: allUsers.length,
                    bands: allBands.length,
                    events: allEvents.length,
                    reports: allReports.filter(r => r.status === 'pending').length,
                    submissions: (await repository.getPendingEventSubmissions()).length
                });

                const bMap: Record<string, Band> = {};
                allBands.forEach(b => bMap[b.id] = b);
                setBandsMap(bMap);
                setSettings(currentSettings);

                // Fallthrough to set specific sets if this was the intended tab
                if (tabToLoad === 'users') setUsers(allUsers);
                if (tabToLoad === 'events') setEvents(allEvents);
                if (tabToLoad === 'reports') setReports(allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                if (tabToLoad === 'bands') setBands(allBands);

                return;
            }

            // Selective Tab Loading
            switch (tabToLoad) {
                case 'submissions':
                    const allSubmissions = await repository.getAllEventSubmissions();
                    console.log('AdminPage loaded submissions:', allSubmissions);
                    setSubmissions(allSubmissions);
                    break;
                case 'bands': // Added bands case
                    const allBands = await repository.getBands();
                    setBands(allBands);
                    break;
                case 'users':
                    const usersData = await repository.getAllUsers();
                    setUsers(usersData);
                    break;

                case 'events':
                    const eventsData = await repository.getEvents();
                    setEvents(eventsData);
                    break;
                case 'reports':
                    const reportsData = await repository.getReports();
                    setReports(reportsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                    break;
                case 'settings':
                    const settingsData = await repository.getSystemSettings();
                    setSettings(settingsData);
                    break;
            }

        } catch (error) {
            console.error('Failed to load admin data:', error);
            showToast('שגיאה בטעינת נתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteBand = (bandId: string) => {
        const band = bands.find(b => b.id === bandId);
        openConfirmDialog(
            'מחיקת להקה',
            `האם אתה בטוח שברצונך למחוק את הלהקה "${band?.name || 'להקה'}"? פעולה זו היא בלתי הפיכה.`,
            async () => {
                try {
                    await repository.forceDeleteBand(bandId);
                    showToast('הלהקה נמחקה בהצלחה', 'success');
                    loadData('bands');
                } catch (error) {
                    console.error(error);
                    showToast('שגיאה במחיקת הלהקה', 'error');
                }
            }
        );
    };



    // === EVENT SUBMISSION HANDLERS ===

    const handleApproveSubmission = (sub: EventSubmission) => {
        openConfirmDialog(
            'אישור בקשת אירוע',
            `האם לאשר את האירוע "${sub.title}" וליצור אותו בלוח האירועים?`,
            async () => {
                try {
                    await repository.approveEventSubmission(sub.id, user!.id);
                    showToast('האירוע אושר ופורסם בהצלחה!', 'success');
                    loadData('submissions');
                } catch (error) {
                    console.error(error);
                    showToast('שגיאה באישור האירוע', 'error');
                }
            },
            'warning'
        );
    };

    const openSubmissionRejectModal = (subId: string) => {
        setSelectedSubmissionId(subId);
        setSubmissionNote('');
        setShowSubmissionRejectModal(true);
    };

    const handleRejectSubmissionConfirm = async () => {
        if (!selectedSubmissionId || !submissionNote.trim()) {
            showToast('יש להזין סיבת דחייה', 'error');
            return;
        }
        try {
            await repository.rejectEventSubmission(selectedSubmissionId, submissionNote);
            showToast('הבקשה נדחתה', 'info');
            setShowSubmissionRejectModal(false);
            loadData('submissions');
        } catch (error) {
            console.error(error);
            showToast('שגיאה בדחיית הבקשה', 'error');
        }
    };

    const openSubmissionChangesModal = (subId: string) => {
        setSelectedSubmissionId(subId);
        setSubmissionNote('');
        setShowSubmissionChangesModal(true);
    };

    const handleRequestChangesConfirm = async () => {
        if (!selectedSubmissionId || !submissionNote.trim()) {
            showToast('יש להזין הערות לתיקון', 'error');
            return;
        }
        try {
            await repository.requestChangesOnSubmission(selectedSubmissionId, submissionNote);
            showToast('הבקשה הוחזרה לתיקונים', 'info');
            setShowSubmissionChangesModal(false);
            loadData('submissions');
        } catch (error) {
            console.error(error);
            showToast('שגיאה בשליחת הבקשה לתיקון', 'error');
        }
    };

    // === MODAL-BASED HANDLERS ===

    const openConfirmDialog = (title: string, message: string, onConfirm: () => void, variant: 'danger' | 'warning' = 'danger') => {
        setConfirmAction({ title, message, onConfirm, variant });
        setShowConfirmModal(true);
    };

    const handleSaveSettings = async () => {
        if (!settings) return;
        try {
            await repository.updateSystemSettings(settings);
            showToast('הגדרות נשמרו בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to save settings:', error);
            showToast('שגיאה בשמירת ההגדרות', 'error');
        }
    };

    const handleDeleteUser = (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        openConfirmDialog(
            'מחיקת משתמש',
            `האם אתה בטוח שברצונך למחוק את "${targetUser?.displayName || 'משתמש'}"? פעולה זו לא ניתנת לביטול.`,
            async () => {
                try {
                    await repository.deleteUser(userId);
                    showToast('המשתמש נמחק בהצלחה', 'success');
                    loadData();
                } catch (error) {
                    showToast('שגיאה במחיקת משתמש', 'error');
                }
            }
        );
    };

    const handleDeleteEvent = (eventId: string) => {
        openConfirmDialog(
            'מחיקת אירוע',
            'האם אתה בטוח שברצונך למחוק אירוע זה? פעולה זו לא ניתנת לביטול.',
            async () => {
                try {
                    await repository.deleteEvent(eventId);
                    showToast('האירוע נמחק בהצלחה', 'success');
                    loadData();
                } catch (error) {
                    showToast('שגיאה במחיקת אירוע', 'error');
                }
            }
        );
    };

    const handleCreateManualEvent = async () => {
        if (!newEventTitle.trim()) {
            showToast('יש להזין שם לאירוע', 'error');
            return;
        }

        try {
            await repository.createEvent({
                title: newEventTitle,
                description: 'אירוע יזום ע"י מנהל',
                type: EventType.JAM,
                dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                location: 'סלון פטיפון',
                durationMinutes: 120,
                organizerId: user!.id,
                capacity: 50,
                price: 0,
                coverImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800',
                createdBy: user!.id
            });
            showToast('אירוע נוצר בהצלחה!', 'success');
            setNewEventTitle('');
            setShowCreateEventModal(false);
            loadData();
        } catch (error) {
            showToast('שגיאה ביצירת אירוע', 'error');
        }
    };

    const openResolveReportModal = (reportId: string) => {
        setSelectedReportId(reportId);
        setReportNote('');
        setShowResolveReportModal(true);
    };

    const handleResolveReportConfirm = async (status: 'reviewed' | 'dismissed') => {
        if (!selectedReportId) return;
        try {
            await repository.resolveReport(selectedReportId, status, reportNote || undefined);
            showToast(`הדיווח סומן כ-${status === 'reviewed' ? 'טופל' : 'נדחה'}`, 'success');
            setShowResolveReportModal(false);
            setSelectedReportId(null);
            setReportNote('');
            loadData();
        } catch (error) {
            showToast('שגיאה בעדכון הדיווח', 'error');
        }
    };

    const handleBanUser = (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        openConfirmDialog(
            'חסימת משתמש',
            `האם אתה בטוח שברצונך לחסום את "${targetUser?.displayName || 'משתמש'}"? המשתמש לא יוכל להתחבר למערכת.`,
            async () => {
                try {
                    await repository.updateUserRole(userId, UserRole.BANNED);
                    showToast('המשתמש נחסם בהצלחה', 'success');
                    loadData();
                } catch (error) {
                    showToast('שגיאה בחסימת משתמש', 'error');
                }
            }
        );
    };

    const handlePromoteUser = (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        openConfirmDialog(
            'קידום משתמש',
            `האם לקדם את "${targetUser?.displayName || 'משתמש'}" לתפקיד Moderator?`,
            async () => {
                try {
                    await repository.updateUserRole(userId, UserRole.MODERATOR);
                    showToast('המשתמש קודם בהצלחה', 'success');
                    loadData();
                } catch (error) {
                    showToast('שגיאה בקידום משתמש', 'error');
                }
            },
            'warning'
        );
    };

    if (loading && stats.users === 0) { // Initial loading only
        return (
            <div className="page-loading">
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="page page-admin">
            <header className="admin-header">
                <div className="container header-content">
                    <div className="flex items-center gap-md">
                        <button className="btn btn-icon btn-ghost back-btn" onClick={() => navigate('/')}>
                            <ArrowRight />
                        </button>
                        <div>
                            <h1><Shield size={24} className="text-accent inline-block ml-2" /> פאנל ניהול</h1>
                            <p className="text-secondary">ניהול המערכת, אישורים ותוכן</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container">
                <div className="admin-tabs tabs">
                    <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <LayoutDashboard size={16} /> סקירה
                    </button>
                    <button className={`tab ${activeTab === 'bands' ? 'active' : ''}`} onClick={() => setActiveTab('bands')}>
                        <Music size={18} />
                        <span>להקות</span>
                        {stats.bands > 0 && <span className="badge badge-secondary badge-sm ml-2">{stats.bands}</span>}
                    </button>
                    <button className={`tab ${activeTab === 'submissions' ? 'active' : ''}`} onClick={() => setActiveTab('submissions')}>
                        <Calendar size={18} />
                        <span>בקשות אירועים</span>
                        {stats.submissions > 0 && <span className="badge badge-primary badge-sm ml-2">{stats.submissions}</span>}
                    </button>
                    <button className={`tab ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
                        <Calendar size={16} /> אירועים
                    </button>
                    <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        <Users size={16} /> משתמשים
                    </button>
                    <button className={`tab ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
                        <AlertTriangle size={16} /> דיווחים
                        {stats.reports > 0 && <span className="badge badge-accent mr-2">{stats.reports}</span>}
                    </button>
                    <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
                        <Settings size={16} /> הגדרות
                    </button>
                </div>

                <div className="admin-content-body">
                    {activeTab === 'overview' && (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon"><Users size={24} /></div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.users}</span>
                                    <span className="stat-label">משתמשים רשומים</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><Music size={24} /></div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.bands}</span>
                                    <span className="stat-label">להקות פעילות</span>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><Calendar size={24} /></div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.events}</span>
                                    <span className="stat-label">אירועים מתוכננים</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon"><AlertTriangle size={24} /></div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.reports}</span>
                                    <span className="stat-label">דיווחים ממתינים</span>
                                </div>
                            </div>
                        </div>
                    )}




                    {activeTab === 'bands' && (
                        <div className="table-container">
                            <h3 className="section-title mb-4 pt-4 px-4">להקות רשומות ({bands.length})</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>שם הלהקה</th>
                                        <th>ז'אנרים</th>
                                        <th>חברים</th>
                                        <th>נוצר ב</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bands.map(band => (
                                        <tr
                                            key={band.id}
                                            onClick={() => navigate(`/bands/${band.id}`)}
                                            className="cursor-pointer hover:bg-base-200 transition-colors"
                                        >
                                            <td>
                                                <div className="flex items-center gap-3">
                                                    <div className="avatar">
                                                        <div className="w-10 h-10 rounded-full overflow-hidden">
                                                            <img
                                                                src={band.coverImageUrl || 'https://via.placeholder.com/150'}
                                                                alt={band.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="font-bold">{band.name}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex flex-wrap gap-1">
                                                    {band.genres.map(g => (
                                                        <span key={g} className="badge badge-ghost badge-xs">{g}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                {band.members?.length || 0} חברים
                                            </td>
                                            <td>
                                                {new Date(band.createdAt).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteBand(band.id);
                                                        }}
                                                        className="btn btn-ghost btn-sm text-error"
                                                        title="מחק להקה"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {bands.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center p-8 text-secondary">
                                                אין להקות רשומות במערכת
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="table-container">
                            <div className="mb-4 flex justify-between">
                                <h3 className="section-title">משתמשים ({users.length})</h3>
                                {/* Search input could go here */}
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>משתמש</th>
                                        <th>אימייל / תפקיד</th>
                                        <th>הצטרף ב</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className="flex items-center gap-sm">
                                                    {u.avatarUrl ? (
                                                        <img src={u.avatarUrl} className="avatar avatar-sm" alt="" />
                                                    ) : (
                                                        <div className="avatar avatar-sm avatar-placeholder">{u.displayName[0]}</div>
                                                    )}
                                                    <span className="font-medium">{u.displayName}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm">{u.email}</div>
                                                <div className="text-xs text-secondary badge mt-xs">{u.role}</div>
                                            </td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {u.id !== user?.id && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="btn btn-icon-sm btn-ghost text-error"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            title="מחק משתמש"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button
                                                            className="btn btn-icon-sm btn-ghost text-error"
                                                            onClick={() => handleBanUser(u.id)}
                                                            title="חסום משתמש"
                                                        >
                                                            <Ban size={18} />
                                                        </button>
                                                        {u.role !== UserRole.MODERATOR && (
                                                            <button
                                                                className="btn btn-icon-sm btn-ghost text-accent"
                                                                onClick={() => handlePromoteUser(u.id)}
                                                                title="קדם ל-Moderator"
                                                            >
                                                                <UserCog size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'events' && (
                        <div className="table-container">
                            <div className="flex justify-between items-center mb-4 px-4 pt-4">
                                <h3 className="section-title">אירועים במערכת</h3>
                                <button className="btn btn-sm btn-primary" onClick={() => setShowCreateEventModal(true)}>
                                    <Calendar size={16} className="mr-2" /> צור אירוע חדש
                                </button>
                            </div>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>אירוע</th>
                                        <th>תאריך</th>
                                        <th>מיקום</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.map(ev => (
                                        <tr key={ev.id}>
                                            <td>
                                                <div className="font-bold">{ev.title}</div>
                                                <div className="text-xs text-secondary">{ev.type}</div>
                                            </td>
                                            <td>{new Date(ev.dateTime).toLocaleDateString()} {new Date(ev.dateTime).toLocaleTimeString()}</td>
                                            <td>{ev.location}</td>
                                            <td>
                                                <button
                                                    className="btn btn-icon-sm btn-ghost text-error"
                                                    onClick={() => handleDeleteEvent(ev.id)}
                                                    title="מחק אירוע"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'reports' && (
                        <div className="table-container">
                            <h3 className="section-title mb-4 pt-4 px-4">דיווחים ותלונות</h3>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>אובייקט</th>
                                        <th>סיבה</th>
                                        <th>סטטוס</th>
                                        <th>תאריך</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(rep => (
                                        <tr key={rep.id}>
                                            <td>"{rep.targetType}" ({rep.targetId})</td>
                                            <td>{rep.reason}</td>
                                            <td><span className={`status-badge status-${rep.status}`}>{rep.status}</span></td>
                                            <td>{new Date(rep.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {rep.status === 'pending' && (
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openResolveReportModal(rep.id)} className="btn btn-icon-sm btn-ghost text-success" title="טפל בדיווח"><Check size={18} /></button>
                                                        <button onClick={() => { setSelectedReportId(rep.id); handleResolveReportConfirm('dismissed'); }} className="btn btn-icon-sm btn-ghost text-error" title="דחה תלונה"><X size={18} /></button>
                                                    </div>
                                                )}
                                                {rep.status === 'reviewed' && <span className="text-secondary text-xs">{rep.reviewNote}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {reports.length === 0 && <tr><td colSpan={5} className="text-center p-4">אין דיווחים</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'submissions' && (
                        <div className="tab-content">
                            <div className="section-header">
                                <h2>בקשות אירועים ממתינות</h2>
                                <button className="btn btn-secondary btn-sm" onClick={() => loadData('submissions')}>
                                    רענן
                                </button>
                            </div>

                            {submissions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-state-icon">✅</div>
                                    <h3>אין בקשות אירועים ממתינות</h3>
                                </div>
                            ) : (
                                <div className="grid">
                                    {submissions.map(sub => (
                                        <div key={sub.id} className="card p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-bold text-lg">{sub.title}</h3>
                                                        <span className={`badge ${sub.status === 'pending' ? 'badge-warning' :
                                                            sub.status === 'approved' ? 'badge-success' : 'badge-error'
                                                            }`}>
                                                            {sub.status === 'pending' ? 'ממתין' :
                                                                sub.status === 'approved' ? 'אושר' :
                                                                    sub.status === 'needs_changes' ? 'דורש תיקון' : 'נדחה'}
                                                        </span>
                                                    </div>
                                                    <p className="text-secondary text-sm">
                                                        מגיש: {(users.find(u => u.id === sub.submittedByUserId)?.displayName) || 'משתמש לא ידוע'} • {new Date(sub.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-tertiary p-3 rounded mb-4 text-sm">
                                                {sub.coverUrl && (
                                                    <div className="mb-3">
                                                        <img src={sub.coverUrl} alt="Event Cover" className="w-full h-32 object-cover rounded" />
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div><strong>סוג:</strong> {sub.type}</div>
                                                    <div><strong>תאריך:</strong> {new Date(sub.startAt).toLocaleString()}</div>
                                                    <div><strong>מיקום:</strong> {sub.locationText}</div>
                                                    <div><strong>צפי:</strong> {sub.capacity || 'ללא הגבלה'}</div>
                                                    <div><strong>מחיר:</strong> {sub.price ? `₪${sub.price}` : 'חינם'}</div>
                                                    <div><strong>הרשמה:</strong> {sub.registrationEnabled ? 'כן' : 'לא'}</div>
                                                </div>
                                                {sub.paymentDetails && (
                                                    <div className="mt-2 p-2 bg-base-200 rounded">
                                                        <strong>פרטי תשלום:</strong> {sub.paymentDetails}
                                                    </div>
                                                )}
                                                <div className="mt-2 text-secondary whitespace-pre-wrap">
                                                    {sub.description}
                                                </div>
                                            </div>

                                            {sub.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        className="btn btn-error btn-sm"
                                                        onClick={() => openSubmissionRejectModal(sub.id)}
                                                    >
                                                        <X size={16} /> דחה
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => openSubmissionChangesModal(sub.id)}
                                                    >
                                                        <MessageSquare size={16} /> בקש תיקון
                                                    </button>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        onClick={() => handleApproveSubmission(sub)}
                                                    >
                                                        <Check size={16} /> אשר וצור אירוע
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'settings' && settings && (
                        <div className="settings-container p-4 bg-base-200 rounded-lg m-4">
                            <h3 className="section-title mb-4 flex items-center gap-2">
                                <Settings size={18} /> הגדרות מערכת גלובליות
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-base-100 p-6 rounded-lg shadow-sm">
                                <div className="form-group">
                                    <label className="label">יעד חזרות שבועי (ברירת מחדל)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input w-full"
                                        value={settings.rehearsalGoal || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setSettings({ ...settings, rehearsalGoal: isNaN(val) ? 0 : val });
                                        }}
                                    />
                                    <p className="text-xs text-secondary mt-1">מספר חזרות מומלץ ללהקה חדשה</p>
                                </div>
                                <div className="form-group">
                                    <label className="label">משך סקר (שעות)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="input w-full"
                                        value={settings.pollDurationHours || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setSettings({ ...settings, pollDurationHours: isNaN(val) ? 0 : val });
                                        }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="label cursor-pointer justify-start gap-4">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={!!settings.autoFinalizePoll}
                                            onChange={(e) => setSettings({ ...settings, autoFinalizePoll: e.target.checked })}
                                        />
                                        <span className="label-text">נעילה אוטומטית של סקרים</span>
                                    </label>
                                    <p className="text-xs text-secondary mt-1">האם לנעול סקר ולקבוע חזרה אוטומטית כשיש רוב?</p>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-accent/5 border border-accent/20 rounded-xl">
                                <h4 className="font-bold flex items-center gap-2 mb-4">
                                    <Calendar size={18} className="text-accent" /> סנכרון יומן חדר מוזיקה
                                </h4>
                                <p className="text-sm text-secondary mb-6">
                                    חיבור יומן Google של חדר המוזיקה יאפשר למשתמשים לראות מתי החדר פנוי ולחסום אוטומטית מועדים שבהם החדר תפוס.
                                </p>

                                {!settings.googleCalendarConnected ? (
                                    <div className="flex flex-col items-start gap-4">
                                        <button
                                            className="btn btn-primary"
                                            onClick={async () => {
                                                const success = await googleCalendarService.connect();
                                                if (success) {
                                                    const updated = { ...settings, googleCalendarConnected: true };
                                                    await repository.updateSystemSettings(updated);
                                                    setSettings(updated);
                                                    showToast('יומן חדר המוזיקה חובּר בהצלחה', 'success');
                                                }
                                            }}
                                        >
                                            <img src="https://www.svgrepo.com/show/355037/google.svg" alt="" width="20" height="20" className="ml-2" />
                                            חבר יומן Google (Studio)
                                        </button>
                                        <span className="text-xs text-secondary">
                                            <LockIcon size={12} className="inline ml-1" /> חיבור מאובטח באמצעות Google OAuth
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                                            <div>
                                                <div className="font-bold text-success">מחובר לסנכרון יומן חדר מוזיקה</div>
                                                <div className="text-xs text-secondary italic">היומן מסתנכרן אוטומטית מול גוגל</div>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-sm btn-ghost text-error"
                                            onClick={async () => {
                                                googleCalendarService.disconnect();
                                                const updated = { ...settings, googleCalendarConnected: false };
                                                await repository.updateSystemSettings(updated);
                                                setSettings(updated);
                                                showToast('הסנכרון הופסק', 'info');
                                            }}
                                        >
                                            נתק סנכרון
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveSettings}
                                >
                                    שמור שינויים
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Event Modal */}
                <Modal
                    isOpen={showCreateEventModal}
                    onClose={() => setShowCreateEventModal(false)}
                    title="יצירת אירוע חדש"
                    size="md"
                >
                    <div className="modal-form">
                        <div className="form-group">
                            <label className="form-label">שם האירוע</label>
                            <input
                                type="text"
                                className="form-input"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                placeholder="הזן שם לאירוע..."
                            />
                        </div>
                        <p className="text-xs text-secondary">האירוע ייווצר עם פרטים ברירת מחדל - ניתן לערוך אותו לאחר מכן.</p>
                        <div className="form-actions">
                            <button className="btn btn-ghost" onClick={() => setShowCreateEventModal(false)}>ביטול</button>
                            <button className="btn btn-primary" onClick={handleCreateManualEvent}>צור אירוע</button>
                        </div>
                    </div>
                </Modal>

                {/* Confirm Dialog */}
                <ConfirmDialog
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmAction?.onConfirm || (() => { })}
                    title={confirmAction?.title || ''}
                    message={confirmAction?.message || ''}
                    variant={confirmAction?.variant || 'danger'}
                    confirmText="אישור"
                    cancelText="ביטול"
                />

                {/* Resolve Report Modal */}
                <Modal
                    isOpen={showResolveReportModal}
                    onClose={() => setShowResolveReportModal(false)}
                    title="טיפול בדיווח"
                    size="sm"
                >
                    <div className="modal-form">
                        <div className="form-group">
                            <label className="form-label">הערת טיפול (אופציונלי)</label>
                            <textarea
                                className="form-textarea"
                                value={reportNote}
                                onChange={(e) => setReportNote(e.target.value)}
                                placeholder="הוסף הערה לגבי אופן הטיפול..."
                            />
                        </div>
                        <div className="form-actions">
                            <button className="btn btn-ghost" onClick={() => setShowResolveReportModal(false)}>ביטול</button>
                            <button className="btn btn-primary" onClick={() => handleResolveReportConfirm('reviewed')}>סמן כטופל</button>
                        </div>
                    </div>
                </Modal>

            </div>
            {/* Submission Reject Modal */}
            <Modal
                isOpen={showSubmissionRejectModal}
                onClose={() => setShowSubmissionRejectModal(false)}
                title="דחיית בקשת אירוע"
            >
                <div className="p-4">
                    <p className="mb-4">נא לפרט את סיבת הדחייה (תישלח למשתמש):</p>
                    <textarea
                        className="form-textarea w-full mb-4"
                        rows={4}
                        value={submissionNote}
                        onChange={(e) => setSubmissionNote(e.target.value)}
                        placeholder="סיבת הדחייה..."
                    />
                    <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost" onClick={() => setShowSubmissionRejectModal(false)}>ביטול</button>
                        <button className="btn btn-error" onClick={handleRejectSubmissionConfirm}>דחה בקשה</button>
                    </div>
                </div>
            </Modal>

            {/* Submission Changes Modal */}
            <Modal
                isOpen={showSubmissionChangesModal}
                onClose={() => setShowSubmissionChangesModal(false)}
                title="בקשת תיקונים"
            >
                <div className="p-4">
                    <p className="mb-4">מה נדרש לתקן בבקשה?</p>
                    <textarea
                        className="form-textarea w-full mb-4"
                        rows={4}
                        value={submissionNote}
                        onChange={(e) => setSubmissionNote(e.target.value)}
                        placeholder="פרט את התיקונים הנדרשים..."
                    />
                    <div className="flex justify-end gap-2">
                        <button className="btn btn-ghost" onClick={() => setShowSubmissionChangesModal(false)}>ביטול</button>
                        <button className="btn btn-primary" onClick={handleRequestChangesConfirm}>שלח לבקשת תיקון</button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
