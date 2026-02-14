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
import { localRepository } from '../../repositories/LocalRepository';
import { useToast } from '../../contexts/ToastContext';
import { User, PerformanceRequest, Event, Band, PerformanceRequestStatus, EventType, SystemSettings, Report as AppReport, UserRole, EventSubmission, EventSubmissionStatus } from '../../types';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { googleCalendarService } from '../../services/GoogleCalendarService';
import './Admin.css';

export function AdminPage() {
    const { user, isAdmin } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'users' | 'events' | 'settings' | 'reports' | 'submissions'>('overview');
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        users: 0,
        requests: 0,
        bands: 0,
        events: 0,
        reports: 0,
        submissions: 0
    });

    const [users, setUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<PerformanceRequest[]>([]);
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

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

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
                    localRepository.getAllUsers(),
                    localRepository.getAllPerformanceRequests(),
                    localRepository.getBands(),
                    localRepository.getEvents(),
                    localRepository.getSystemSettings(),
                    localRepository.getReports()
                ]);

                setStats({
                    users: allUsers.length,
                    requests: allRequests.length,
                    bands: allBands.length,
                    events: allEvents.length,
                    reports: allReports.filter(r => r.status === 'pending').length,
                    submissions: (await localRepository.getPendingEventSubmissions()).length
                });

                const bMap: Record<string, Band> = {};
                allBands.forEach(b => bMap[b.id] = b);
                setBandsMap(bMap);
                setSettings(currentSettings);

                // Fallthrough to set specific sets if this was the intended tab
                if (tabToLoad === 'users') setUsers(allUsers);
                if (tabToLoad === 'requests') setRequests(allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                if (tabToLoad === 'events') setEvents(allEvents);
                if (tabToLoad === 'reports') setReports(allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

                return;
            }

            // Selective Tab Loading
            switch (tabToLoad) {
                case 'submissions':
                    const allSubmissions = await localRepository.getAllEventSubmissions();
                    console.log('AdminPage loaded submissions:', allSubmissions);
                    setSubmissions(allSubmissions);
                    break;
                case 'users':
                    const usersData = await localRepository.getAllUsers();
                    setUsers(usersData);
                    break;
                case 'requests':
                    const requestsData = await localRepository.getAllPerformanceRequests();
                    setRequests(requestsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                    break;
                case 'events':
                    const eventsData = await localRepository.getEvents();
                    setEvents(eventsData);
                    break;
                case 'reports':
                    const reportsData = await localRepository.getReports();
                    setReports(reportsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                    break;
                case 'settings':
                    const settingsData = await localRepository.getSystemSettings();
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

    const handleApproveRequest = async (req: PerformanceRequest) => {
        const band = bandsMap[req.bandId];
        openConfirmDialog(
            'אישור בקשת הופעה',
            `האם לאשר את הבקשה של להקת "${band?.name || 'להקה'}" וליצור אירוע הופעה?`,
            async () => {
                try {
                    await localRepository.reviewPerformanceRequest(req.id, PerformanceRequestStatus.APPROVED);

                    const newEvent = await localRepository.createEvent({
                        title: `הופעה: ${band?.name || 'להקה'}`,
                        description: `הופעה חיה של ${band?.name || 'להקה'}!`,
                        type: EventType.BAND_PERFORMANCE,
                        dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default 2 weeks from now
                        location: 'סלון פטיפון',
                        durationMinutes: 60,
                        organizerId: user!.id,
                        capacity: 50,
                        price: 0,
                        coverImageUrl: band?.coverImageUrl,
                        createdBy: user!.id
                    });

                    if (band && band.members) {
                        band.members.forEach(member => {
                            localRepository.createNotification({
                                userId: member.userId,
                                type: 'performance_approved',
                                title: 'הופעה אושרה!',
                                body: `ההופעה של ${band.name} נקבעה ל-${newEvent.dateTime.toLocaleDateString()}.`,
                                relatedEntityType: 'event',
                                relatedEntityId: newEvent.id
                            });
                        });
                    }

                    showToast('הבקשה אושרה והאירוע נוצר!', 'success');
                    loadData();
                } catch (error) {
                    console.error(error);
                    showToast('שגיאה באישור הבקשה', 'error');
                }
            },
            'warning'
        );
    };

    const openRejectModal = (reqId: string) => {
        setRejectRequestId(reqId);
        setRejectReason('');
        setShowRejectModal(true);
    };

    const handleRejectRequestConfirm = async () => {
        if (!rejectRequestId || !rejectReason.trim()) {
            showToast('יש להזין סיבת דחייה', 'error');
            return;
        }
        try {
            await localRepository.reviewPerformanceRequest(rejectRequestId, PerformanceRequestStatus.REJECTED, rejectReason);
            showToast('הבקשה נדחתה', 'info');
            setShowRejectModal(false);
            setRejectRequestId(null);
            setRejectReason('');
            loadData();
        } catch (error) {
            showToast('שגיאה בדחיית הבקשה', 'error');
        }
    };

    // === EVENT SUBMISSION HANDLERS ===

    const handleApproveSubmission = (sub: EventSubmission) => {
        openConfirmDialog(
            'אישור בקשת אירוע',
            `האם לאשר את האירוע "${sub.title}" וליצור אותו בלוח האירועים?`,
            async () => {
                try {
                    await localRepository.approveEventSubmission(sub.id, user!.id);
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
            await localRepository.rejectEventSubmission(selectedSubmissionId, submissionNote);
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
            await localRepository.requestChangesOnSubmission(selectedSubmissionId, submissionNote);
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

    const handleDeleteUser = (userId: string) => {
        const targetUser = users.find(u => u.id === userId);
        openConfirmDialog(
            'מחיקת משתמש',
            `האם אתה בטוח שברצונך למחוק את "${targetUser?.displayName || 'משתמש'}"? פעולה זו לא ניתנת לביטול.`,
            async () => {
                try {
                    await localRepository.deleteUser(userId);
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
                    await localRepository.deleteEvent(eventId);
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
            await localRepository.createEvent({
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
            await localRepository.resolveReport(selectedReportId, status, reportNote || undefined);
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
                    await localRepository.updateUserRole(userId, UserRole.BANNED);
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
                    await localRepository.updateUserRole(userId, UserRole.MODERATOR);
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
                    <button className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                        <Music size={18} />
                        <span>בקשות להקה</span>
                        {stats.requests > 0 && <span className="badge badge-primary badge-sm ml-2">{stats.requests}</span>}
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
                                <div className="stat-icon"><TrendingUp size={24} /></div>
                                <div className="stat-info">
                                    <span className="stat-value">{stats.requests}</span>
                                    <span className="stat-label">בקשות להופעה</span>
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

                    {activeTab === 'requests' && (
                        <div className="table-container">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>להקה</th>
                                        <th>תאריך מבוקש</th>
                                        <th>סטטוס</th>
                                        <th>פעולות</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map(req => (
                                        <tr key={req.id}>
                                            <td>
                                                <div className="font-bold">{bandsMap[req.bandId]?.name || 'לא ידוע'}</div>
                                                <div className="text-xs text-secondary">{req.notes}</div>
                                            </td>
                                            <td>
                                                {req.preferredDateRange ? (
                                                    <span className="text-sm">
                                                        {new Date(req.preferredDateRange.start).toLocaleDateString()} -
                                                        {new Date(req.preferredDateRange.end).toLocaleDateString()}
                                                    </span>
                                                ) : 'גמיש'}
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${req.status.toLowerCase()}`}>
                                                    {req.status}
                                                </span>
                                            </td>
                                            <td className="action-cell">
                                                {req.status === PerformanceRequestStatus.SUBMITTED && (
                                                    <>
                                                        <button
                                                            className="btn btn-icon-sm btn-ghost text-success"
                                                            onClick={() => handleApproveRequest(req)}
                                                            title="אשר וצור אירוע"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            className="btn btn-icon-sm btn-ghost text-error"
                                                            onClick={() => openRejectModal(req.id)}
                                                            title="דחה בקשה"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {requests.length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-secondary py-4">אין בקשות להצגה</td></tr>
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
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div><strong>סוג:</strong> {sub.type}</div>
                                                    <div><strong>תאריך:</strong> {new Date(sub.startAt).toLocaleString()}</div>
                                                    <div><strong>מיקום:</strong> {sub.locationText}</div>
                                                    <div><strong>צפי:</strong> {sub.capacity || 'ללא הגבלה'}</div>
                                                </div>
                                                <div className="mt-2 text-secondary">
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
                                        className="input w-full"
                                        value={settings.rehearsalGoal}
                                        onChange={(e) => setSettings({ ...settings, rehearsalGoal: parseInt(e.target.value) })}
                                    />
                                    <p className="text-xs text-secondary mt-1">מספר חזרות מומלץ ללהקה חדשה</p>
                                </div>
                                <div className="form-group">
                                    <label className="label">משך סקר (שעות)</label>
                                    <input
                                        type="number"
                                        className="input w-full"
                                        value={settings.pollDurationHours}
                                        onChange={(e) => setSettings({ ...settings, pollDurationHours: parseInt(e.target.value) })}
                                    />
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
                                                    await localRepository.updateSystemSettings(updated);
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
                                                await localRepository.updateSystemSettings(updated);
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
                                    onClick={() => localRepository.updateSystemSettings(settings).then(() => showToast('הגדרות נשמרו בהצלחה', 'success'))}
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

                {/* Reject Request Modal */}
                <Modal
                    isOpen={showRejectModal}
                    onClose={() => setShowRejectModal(false)}
                    title="דחיית בקשת הופעה"
                    size="sm"
                >
                    <div className="modal-form">
                        <div className="form-group">
                            <label className="form-label">סיבת הדחייה</label>
                            <textarea
                                className="form-textarea"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="הסבר מדוע הבקשה נדחתה..."
                                required
                            />
                        </div>
                        <div className="form-actions">
                            <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>ביטול</button>
                            <button className="btn btn-danger" onClick={handleRejectRequestConfirm}>דחה בקשה</button>
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
        </div>
    );
}
