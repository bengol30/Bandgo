// ============================================
// bandgo - Feed Page
// Social feed with posts, comments, likes
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart, MessageCircle, Share2, MoreHorizontal, Image, Send, Pin, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { repository } from '../../repositories';
import { Post, PostType, User } from '../../types';
import { PostDetailsModal } from '../../components/feed/PostDetailsModal';
import './Feed.css';

export function FeedPage() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [posts, setPosts] = useState<Post[]>([]);
    const [users, setUsers] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPostContent, setNewPostContent] = useState('');

    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [searchParams] = useSearchParams();
    const deepLinkPostId = searchParams.get('postId');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (deepLinkPostId) {
            setActivePostId(deepLinkPostId);
        }
    }, [deepLinkPostId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [postsData, usersData] = await Promise.all([
                repository.getPosts(),
                repository.getAllUsers(),
            ]);
            setPosts(postsData);

            const usersMap: Record<string, User> = {};
            usersData.forEach(u => { usersMap[u.id] = u; });
            setUsers(usersMap);
        } catch (error) {
            console.error('Failed to load feed:', error);
            showToast('שגיאה בטעינת הפיד', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() && !selectedImage) return;
        if (!user) return;

        try {
            const newPost = await repository.createPost({
                type: PostType.USER_POST,
                authorId: user.id,
                content: newPostContent.trim(),
                imageUrl: selectedImage || undefined,
                isPinned: false,
            } as any); // Cast to any because Post creation omits might conflict with strict types sometimes
            setPosts([newPost, ...posts]);
            setNewPostContent('');
            setSelectedImage(null);
            setShowCreateModal(false);
            showToast('הפוסט פורסם בהצלחה!', 'success');
        } catch (error) {
            showToast('שגיאה בפרסום הפוסט', 'error');
        }
    };

    const handleLike = async (postId: string) => {
        if (!user) return;

        const isLiked = likedPosts.has(postId);
        try {
            if (isLiked) {
                await repository.unlikePost(postId, user.id);
                setLikedPosts(prev => {
                    const next = new Set(prev);
                    next.delete(postId);
                    return next;
                });
                setPosts(posts.map(p =>
                    p.id === postId ? { ...p, likesCount: Math.max(0, p.likesCount - 1) } : p
                ));
            } else {
                await repository.likePost(postId, user.id);
                setLikedPosts(prev => new Set(prev).add(postId));
                setPosts(posts.map(p =>
                    p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p
                ));
            }
        } catch (error) {
            showToast('שגיאה בעדכון לייק', 'error');
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'עכשיו';
        if (diffMins < 60) return `לפני ${diffMins} דקות`;
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        if (diffDays < 7) return `לפני ${diffDays} ימים`;
        return new Date(date).toLocaleDateString('he-IL');
    };

    const getPostTypeClass = (post: Post): string => {
        if (post.isPinned) return 'pinned';
        if (post.type === PostType.ADMIN_MESSAGE) return 'admin-message';
        if (post.type === PostType.SYSTEM_AUTO) return 'system';
        return '';
    };

    const getPostAvatar = (post: Post): React.ReactNode => {
        if (post.type === PostType.USER_POST && post.authorId) {
            const author = users[post.authorId];
            if (author?.avatarUrl) {
                return <img src={author.avatarUrl} alt={author.displayName} className="post-avatar" />;
            }
            return (
                <div className="post-avatar post-avatar-system">
                    {author?.displayName?.charAt(0) || '?'}
                </div>
            );
        }

        if (post.type === PostType.ADMIN_MESSAGE) {
            return <div className="post-avatar post-avatar-system">📢</div>;
        }

        return <div className="post-avatar post-avatar-system">🎸</div>;
    };

    const getPostAuthorName = (post: Post): string => {
        if (post.type === PostType.USER_POST && post.authorId) {
            return users[post.authorId]?.displayName || 'משתמש';
        }
        if (post.type === PostType.ADMIN_MESSAGE) {
            return 'הודעת מערכת';
        }
        return 'Band.go';
    };

    if (loading) {
        return (
            <div className="page">
                <div className="container">
                    <div className="flex-center" style={{ padding: '4rem 0' }}>
                        <div className="spinner spinner-lg"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="container">
                {/* Create Post Card */}
                {user && (
                    <div className="create-post-card">
                        <div className="create-post-header">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.displayName} className="avatar" />
                            ) : (
                                <div className="avatar avatar-placeholder">{user.displayName.charAt(0)}</div>
                            )}
                            <button
                                className="create-post-input"
                                onClick={() => setShowCreateModal(true)}
                            >
                                מה חדש, {user.displayName.split(' ')[0]}?
                            </button>
                        </div>
                    </div>
                )}

                {/* Posts */}
                {posts.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3 className="empty-state-title">אין פוסטים עדיין</h3>
                        <p className="empty-state-text">היה הראשון לפרסם משהו!</p>
                    </div>
                ) : (
                    posts.map(post => (
                        <article key={post.id} className={`post-card ${getPostTypeClass(post)}`}>
                            <div className="post-header">
                                {getPostAvatar(post)}
                                <div className="post-meta">
                                    <div className="flex items-center gap-sm">
                                        {post.isPinned && (
                                            <span className="badge badge-accent post-badge">
                                                <Pin size={12} />
                                                נעוץ
                                            </span>
                                        )}
                                        {post.type === PostType.ADMIN_MESSAGE && (
                                            <span className="badge badge-warning post-badge">
                                                הודעה חשובה
                                            </span>
                                        )}
                                        <span className="post-author">{getPostAuthorName(post)}</span>
                                    </div>
                                    <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
                                </div>
                            </div>

                            <p className="post-content">{post.content}</p>

                            {post.media && post.media.length > 0 && (
                                <div className="post-media">
                                    {post.media[0].type === 'image' && (
                                        <img src={post.media[0].url} alt="" />
                                    )}
                                </div>
                            )}

                            <div className="post-actions">
                                <button
                                    className={`post-action-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                                    onClick={() => handleLike(post.id)}
                                >
                                    <Heart size={18} fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} />
                                    <span>{post.likesCount}</span>
                                </button>

                                <button
                                    className="post-action-btn"
                                    onClick={() => setActivePostId(post.id)}
                                >
                                    <MessageCircle size={18} />
                                    <span>{post.commentsCount}</span>
                                </button>

                                <button className="post-action-btn">
                                    <Share2 size={18} />
                                </button>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* Create Post Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal create-post-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">פוסט חדש</h3>
                            <button
                                className="btn btn-icon btn-ghost"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <textarea
                                className="create-post-textarea"
                                placeholder="מה חדש אצלך?"
                                value={newPostContent}
                                onChange={e => setNewPostContent(e.target.value)}
                                autoFocus
                            />
                            <div className="create-post-actions">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageSelect}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                />
                                {selectedImage && (
                                    <div className="post-image-preview" style={{ position: 'relative', width: '100%', marginBottom: '1rem' }}>
                                        <img src={selectedImage} alt="Preview" style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'cover' }} />
                                        <button
                                            onClick={handleRemoveImage}
                                            style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                <button
                                    className="create-post-media-btn"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Image size={18} />
                                    <span>הוסף תמונה</span>
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreatePost}
                                    disabled={!newPostContent.trim() && !selectedImage}
                                >
                                    <Send size={18} />
                                    פרסם
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <PostDetailsModal
                postId={activePostId}
                isOpen={!!activePostId}
                onClose={() => {
                    setActivePostId(null);
                    loadData(); // Refresh to update comments count
                }}
            />
        </div>
    );
}
