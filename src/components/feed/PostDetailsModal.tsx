import React, { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import { Post, Comment, User } from '../../types';
import { repository } from '../../repositories';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import './PostDetailsModal.css';

interface PostDetailsModalProps {
    postId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

export function PostDetailsModal({ postId, isOpen, onClose }: PostDetailsModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [usersMap, setUsersMap] = useState<Record<string, User>>({});
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Create a ref for the comments end (for auto-scroll)
    const commentsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && postId) {
            loadPostData(postId);
        } else {
            // Reset state on close
            setPost(null);
            setComments([]);
            setLoading(true);
        }
    }, [isOpen, postId]);

    const loadPostData = async (id: string) => {
        try {
            setLoading(true);
            const [postData, commentsData] = await Promise.all([
                repository.getPost(id),
                repository.getComments(id)
            ]);

            if (postData) {
                setPost(postData);
                setComments(commentsData); // Assuming already sorted

                // Optimized fetching: only get authors of this post and comments
                const authorIds = new Set<string>();
                if (postData.authorId) authorIds.add(postData.authorId);
                commentsData.forEach(c => authorIds.add(c.authorId));

                const usersData = await repository.getUsersByIds(Array.from(authorIds));
                const uMap: Record<string, User> = {};
                usersData.forEach(u => uMap[u.id] = u);
                setUsersMap(uMap);

                // Scroll in a bit (after render)
                setTimeout(() => commentsEndRef.current?.scrollIntoView(), 200);
            } else {
                showToast('הפוסט לא נמצא', 'error');
                onClose();
            }
        } catch (err) {
            console.error(err);
            showToast('שגיאה בטעינת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendComment = async () => {
        if (!newComment.trim() || !user || !post) return;

        try {
            setSubmitting(true);
            const comment = await repository.createComment({
                postId: post.id,
                authorId: user.id,
                content: newComment.trim()
            });

            setComments([...comments, comment]);
            setNewComment('');

            // Scroll to bottom
            setTimeout(() => {
                commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);

        } catch (err) {
            showToast('שגיאה בשליחת תגובה', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const getUserDisplayName = (userId: string) => {
        return usersMap[userId]?.displayName || 'משתמש לא ידוע';
    };

    const getUserAvatar = (userId: string) => {
        const u = usersMap[userId];
        if (u?.avatarUrl) return <img src={u.avatarUrl} className="comment-avatar" alt={u.displayName} />;
        return <div className="avatar-placeholder sm">{u?.displayName?.[0] || '?'}</div>;
    };

    if (!isOpen) return null;

    return (
        <div className="post-modal-overlay" onClick={onClose}>
            <div className="post-modal-content" onClick={e => e.stopPropagation()}>
                <div className="post-modal-header">
                    <h3>תגובות</h3>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="post-modal-body">
                    {loading ? (
                        <div className="spinner-container">
                            <div className="spinner spinner-lg"></div>
                        </div>
                    ) : (
                        <>
                            {post && (
                                <div className="post-content-container">
                                    <div className="post-author-row text-sm mb-2">
                                        <span className="font-bold mr-2 text-primary">{getUserDisplayName(post.authorId || '')}</span>
                                        <span className="text-secondary">• {new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {post.content && <p className="whitespace-pre-wrap">{post.content}</p>}
                                    {post.media && post.media.length > 0 && post.media[0].type === 'image' && (
                                        <img src={post.media[0].url} alt="" className="post-modal-image" />
                                    )}
                                </div>
                            )}

                            <div className="comments-section">
                                {comments.length === 0 ? (
                                    <div className="text-center text-secondary py-4">
                                        אין עדיין תגובות. היה הראשון להגיב!
                                    </div>
                                ) : (
                                    <div className="comments-list">
                                        {comments.map(comment => (
                                            <div key={comment.id} className="comment-item">
                                                {getUserAvatar(comment.authorId)}
                                                <div className="comment-content-wrapper">
                                                    <span className="comment-author">{getUserDisplayName(comment.authorId)}</span>
                                                    <p className="comment-text">{comment.content}</p>
                                                    <span className="comment-time">
                                                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div ref={commentsEndRef} />
                            </div>
                        </>
                    )}
                </div>

                <div className="comment-input-area">
                    <input
                        className="comment-input"
                        placeholder="כתוב תגובה..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                        autoFocus
                    />
                    <button
                        className="send-comment-btn"
                        disabled={!newComment.trim() || submitting}
                        onClick={handleSendComment}
                        title="שלח תגובה"
                    >
                        {submitting ? <div className="spinner spinner-sm" style={{ borderColor: 'white', borderLeftColor: 'transparent' }}></div> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
