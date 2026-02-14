
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Music,
    MessageSquare,
    CheckSquare,
    Shield,
    Plus,
    Settings
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { localRepository } from '../../repositories/LocalRepository';
import { Band, Task, Song, User } from '../../types';
import { BandProgress } from '../../components/bands/BandProgress';
import { BandChat } from '../../components/chat/BandChat';
import { RehearsalScheduler } from '../../components/scheduling/RehearsalScheduler';
import { SongList } from '../../components/songs/SongList';
import { ManageSongModal } from '../../components/songs/ManageSongModal';
import { CreateTaskModal } from '../../components/tasks/CreateTaskModal';
import { BandSettingsModal } from '../../components/bands/BandSettingsModal';
import './BandWorkspace.css';

interface TasksTabProps {
    band: Band;
    tasks: Task[];
    users: Record<string, User>;
    onUpdateTask: (task: Task) => void;
    onOpenCreateModal: () => void;
}

const TasksTab = ({ band, tasks, users, onUpdateTask, onOpenCreateModal }: TasksTabProps) => (
    <div className="workspace-tab-content">
        <div className="flex justify-between items-center mb-md">
            <h2>משימות</h2>
            <button className="btn btn-primary btn-sm gap-xs" onClick={onOpenCreateModal}>
                <Plus size={16} />
                משימה חדשה
            </button>
        </div>

        {tasks.length === 0 ? (
            <div className="empty-state text-center py-xl bg-card rounded-lg border border-border">
                <CheckSquare size={48} className="mx-auto mb-md opacity-30" />
                <p className="font-bold">אין משימות פתוחות</p>
                <span className="text-secondary text-sm">צור את המשימה הראשונה כדי להתחיל לעבוד</span>
            </div>
        ) : (
            <div className="tasks-list grid gap-sm">
                {tasks.map(task => {
                    const assignee = task.assignedTo ? users[task.assignedTo] : null;
                    return (
                        <div key={task.id} className={`task-card status-${task.status} bg-card p-md rounded-lg border border-border flex items-start gap-md`}>
                            <div className="task-status-toggle mt-1">
                                {task.status === 'completed' ? (
                                    <button className="text-success hover:opacity-80 transition-opacity" onClick={() => onUpdateTask(task)}>
                                        <CheckSquare size={24} />
                                    </button>
                                ) : (
                                    <button className="text-secondary hover:text-primary transition-colors" onClick={() => onUpdateTask(task)}>
                                        <div className="w-6 h-6 border-2 border-current rounded" />
                                    </button>
                                )}
                            </div>
                            <div className="task-details flex-1">
                                <h3 className={`font-bold ${task.status === 'completed' ? 'line-through text-secondary' : ''}`}>{task.title}</h3>
                                <p className="text-secondary text-sm mt-xs">{task.description}</p>
                                <div className="task-meta mt-sm flex gap-sm text-xs text-secondary opacity-70">
                                    <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                    {assignee && (
                                        <span className="flex items-center gap-xs">
                                            • הוקצה ל{assignee.displayName}
                                            {assignee.avatarUrl && <img src={assignee.avatarUrl} className="w-4 h-4 rounded-full" alt="" />}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);

export function BandWorkspacePage() {
    const { bandId } = useParams<{ bandId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [band, setBand] = useState<Band | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [songs, setSongs] = useState<Song[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'progress' | 'rehearsals' | 'songs' | 'chat' | 'tasks'>('progress');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Song Management State
    const [isManageSongModalOpen, setIsManageSongModalOpen] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | undefined>(undefined);

    // Task Management State
    const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);

    useEffect(() => {
        if (bandId && user) {
            loadBandData();
        }
    }, [bandId, user]);

    const loadBandData = async () => {
        try {
            setLoading(true);
            const foundBand = await localRepository.getBand(bandId!);

            if (!foundBand) {
                navigate('/bands');
                return;
            }

            // Security check: Only members can access workspace
            const isMember = foundBand.members.some(m => m.userId === user?.id);
            if (!isMember && user?.role !== 'admin') {
                navigate(`/bands/${bandId}`); // Redirect to public profile
                return;
            }

            setBand(foundBand);

            // Load tasks, songs, and users
            const [bandTasks, bandSongs, allUsers] = await Promise.all([
                localRepository.getBandTasks(bandId!),
                localRepository.getSongs(bandId!),
                localRepository.getAllUsers()
            ]);

            setTasks(bandTasks);
            setSongs(bandSongs);

            const usersMap: Record<string, User> = {};
            allUsers.forEach((u: User) => { usersMap[u.id] = u; });
            setUsers(usersMap);

        } catch (error) {
            console.error('Failed to load workspace:', error);
            showToast('שגיאה בטעינת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Song Handlers
    const handleCreateSong = async (songData: Partial<Song>) => {
        if (!bandId || !user) return;
        try {
            setIsSaving(true);
            const newSong = await localRepository.createSong({ ...songData, bandId, createdBy: user.id } as any);
            setSongs(prev => [...prev, newSong]);
            setIsManageSongModalOpen(false);
            showToast('השיר נוסף בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to create song:', error);
            showToast('שגיאה ביצירת השיר', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateSong = async (songData: Partial<Song>) => {
        if (!editingSong) return;
        try {
            setIsSaving(true);
            const songId = editingSong.id;
            await localRepository.updateSong(songId, songData);
            setSongs(prev => prev.map(s => s.id === songId ? { ...s, ...songData } : s));
            setIsManageSongModalOpen(false);
            setEditingSong(undefined);
            showToast('השיר עודכן בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to update song:', error);
            showToast('שגיאה בעדכון השיר', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSong = async (songId: string) => {
        try {
            await localRepository.deleteSong(songId);
            setSongs(prev => prev.filter(s => s.id !== songId));
            showToast('השיר נמחק בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to delete song:', error);
            showToast('שגיאה במחיקת השיר', 'error');
        }
    };

    const openCreateSongModal = () => {
        setEditingSong(undefined);
        setIsManageSongModalOpen(true);
    };

    const openEditSongModal = (song: Song) => {
        setEditingSong(song);
        setIsManageSongModalOpen(true);
    };

    // Task Handlers
    const handleCreateTask = async (taskData: Partial<Task>) => {
        if (!bandId) return;
        try {
            setIsSaving(true);
            const newTask = await localRepository.createTask(bandId, taskData as any);
            setTasks(prev => [...prev, newTask]);
            setIsCreateTaskModalOpen(false);
            showToast('המשימה נוצרה בהצלחה', 'success');
        } catch (error) {
            console.error('Failed to create task:', error);
            showToast('שגיאה ביצירת המשימה', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleTask = async (task: Task) => {
        if (!bandId) return;
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        try {
            const updated = await localRepository.updateTask(bandId, task.id, { status: newStatus });
            setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
            showToast(newStatus === 'completed' ? 'המשימה הושלמה! ✅' : 'המשימה סומנה כפתוחה', 'success');
        } catch (error) {
            showToast('שגיאה בעדכון המשימה', 'error');
        }
    };

    if (loading) return <div className="page-loading"><div className="spinner spinner-lg"></div></div>;
    if (!band) return null;

    // Prepare members list for assignments
    const bandMembersList = band.members.map(m => ({
        userId: m.userId,
        displayName: users[m.userId]?.displayName || 'Unknown',
        avatarUrl: users[m.userId]?.avatarUrl
    }));

    return (
        <div className="page page-workspace">
            <div className="workspace-header bg-surface border-b border-border mb-md">
                <div className="container py-md">
                    <div className="workspace-title-row flex justify-between items-center">
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <Shield size={24} className="text-primary" />
                            {band.name} <span className="text-secondary font-normal text-lg">| אזור עבודה</span>
                        </h1>
                        <button className="btn btn-sm btn-ghost" onClick={() => navigate(`/bands/${bandId}`)}>
                            צפה בפרופיל ציבורי
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => setIsSettingsOpen(true)} title="הגדרות">
                            <Settings size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="workspace-nav-container sticky top-0 bg-bg-primary z-10 border-b border-border mb-md">
                <div className="container">
                    <nav className="workspace-nav flex gap-md overflow-x-auto hide-scrollbar">
                        <button
                            className={`nav-item btn btn-ghost rounded-none border-b-2 border-transparent px-md py-sm flex items-center gap-xs transition-colors ${activeTab === 'progress' ? 'border-primary text-primary font-bold' : 'text-secondary opacity-70 hover:opacity-100'}`}
                            onClick={() => setActiveTab('progress')}
                        >
                            <LayoutDashboard size={20} />
                            <span>התקדמות</span>
                        </button>
                        <button
                            className={`nav-item btn btn-ghost rounded-none border-b-2 border-transparent px-md py-sm flex items-center gap-xs transition-colors ${activeTab === 'rehearsals' ? 'border-primary text-primary font-bold' : 'text-secondary opacity-70 hover:opacity-100'}`}
                            onClick={() => setActiveTab('rehearsals')}
                        >
                            <Calendar size={20} />
                            <span>חזרות</span>
                        </button>
                        <button
                            className={`nav-item btn btn-ghost rounded-none border-b-2 border-transparent px-md py-sm flex items-center gap-xs transition-colors ${activeTab === 'songs' ? 'border-primary text-primary font-bold' : 'text-secondary opacity-70 hover:opacity-100'}`}
                            onClick={() => setActiveTab('songs')}
                        >
                            <Music size={20} />
                            <span>שירים</span>
                        </button>
                        <button
                            className={`nav-item btn btn-ghost rounded-none border-b-2 border-transparent px-md py-sm flex items-center gap-xs transition-colors ${activeTab === 'tasks' ? 'border-primary text-primary font-bold' : 'text-secondary opacity-70 hover:opacity-100'}`}
                            onClick={() => setActiveTab('tasks')}
                        >
                            <CheckSquare size={20} />
                            <span>משימות</span>
                            {tasks.some(t => t.status === 'pending') && <span className="w-2 h-2 rounded-full bg-error ml-xs"></span>}
                        </button>
                        <button
                            className={`nav-item btn btn-ghost rounded-none border-b-2 border-transparent px-md py-sm flex items-center gap-xs transition-colors ${activeTab === 'chat' ? 'border-primary text-primary font-bold' : 'text-secondary opacity-70 hover:opacity-100'}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            <MessageSquare size={20} />
                            <span>צ'אט</span>
                        </button>
                    </nav>
                </div>
            </div>

            <main className="workspace-content container pb-xl">
                {activeTab === 'progress' && (
                    <div className="workspace-tab-content animate-fade-in">
                        <h2 className="text-lg font-bold mb-md">התקדמות הלהקה</h2>
                        <BandProgress band={band} />
                    </div>
                )}

                {activeTab === 'tasks' && (
                    <TasksTab
                        band={band}
                        tasks={tasks}
                        users={users}
                        onUpdateTask={handleToggleTask}
                        onOpenCreateModal={() => setIsCreateTaskModalOpen(true)}
                    />
                )}

                {activeTab === 'rehearsals' && (
                    <div className="workspace-tab-content animate-fade-in">
                        <RehearsalScheduler band={band} />
                    </div>
                )}

                {activeTab === 'songs' && (
                    <div className="workspace-tab-content animate-fade-in">
                        <div className="flex justify-between items-center mb-md">
                            <div className="flex items-center gap-sm">
                                <h2 className="text-lg font-bold">מאגר שירים</h2>
                                <span className="badge badge-secondary">{songs.length}</span>
                            </div>
                            <button className="btn btn-primary btn-sm gap-xs" onClick={openCreateSongModal}>
                                <Plus size={16} />
                                הוסף שיר
                            </button>
                        </div>
                        <SongList
                            songs={songs}
                            onEdit={openEditSongModal}
                            onDelete={handleDeleteSong}
                        />
                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="workspace-tab-content animate-fade-in">
                        <BandChat band={band} />
                    </div>
                )}
            </main>

            {/* Modals */}
            <ManageSongModal
                isOpen={isManageSongModalOpen}
                onClose={() => setIsManageSongModalOpen(false)}
                onSave={editingSong ? handleUpdateSong : handleCreateSong}
                initialData={editingSong}
                saving={isSaving}
            />

            <CreateTaskModal
                isOpen={isCreateTaskModalOpen}
                onClose={() => setIsCreateTaskModalOpen(false)}
                onSave={handleCreateTask}
                bandMembers={bandMembersList}
            />

            {band && (
                <BandSettingsModal
                    band={band}
                    usersMap={users}
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    onBandUpdated={(updatedBand) => setBand(updatedBand)}
                    onBandDeleted={() => navigate('/bands')}
                />
            )}
        </div>
    );
}
