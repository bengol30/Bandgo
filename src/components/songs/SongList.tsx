import { Music, Edit2, Trash2, Youtube, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { Song } from '../../types';
import './Songs.css';

interface SongListProps {
    songs: Song[];
    onEdit: (song: Song) => void;
    onDelete: (songId: string) => void;
}

export function SongList({ songs, onEdit, onDelete }: SongListProps) {
    if (songs.length === 0) {
        return (
            <div className="songs-empty-state">
                <Music size={48} className="songs-empty-icon" />
                <h3>עדיין אין שירים</h3>
                <p>הוסיפו שירים לרפרטואר הלהקה שלכם</p>
            </div>
        );
    }

    const getLinkIcon = (type: string) => {
        switch (type) {
            case 'youtube': return <Youtube size={14} color="#FF0000" />;
            case 'spotify': return <Music size={14} color="#1DB954" />;
            case 'apple_music': return <Music size={14} color="#FA243C" />;
            default: return <LinkIcon size={14} />;
        }
    };

    return (
        <div className="song-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {songs.map(song => (
                <div key={song.id} className="song-card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="song-header-wrapper mb-3">
                        <h3 className="song-title">{song.title}</h3>
                    </div>

                    <div className="song-details mb-4 flex-grow">
                        {(song.key || song.bpm) && (
                            <div className="flex gap-2 mb-2" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {song.key && <span className="badge badge-outline text-xs" style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid currentColor', fontSize: '0.75rem' }}>Key: {song.key}</span>}
                                {song.bpm && <span className="badge badge-outline text-xs" style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid currentColor', fontSize: '0.75rem' }}>{song.bpm} BPM</span>}
                            </div>
                        )}

                        {song.structure && (
                            <div className="text-sm text-secondary truncate mb-2" title={song.structure} style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>
                                מבנה: {song.structure}
                            </div>
                        )}

                        <div className="flex gap-2 mt-2" style={{ display: 'flex', gap: '0.5rem' }}>
                            {song.lyrics && <span className="text-xs badge badge-secondary" style={{ fontSize: '0.75rem', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>מילים</span>}
                            {song.chords && <span className="text-xs badge badge-secondary" style={{ fontSize: '0.75rem', background: 'var(--color-bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>אקורדים</span>}
                        </div>

                        {/* Links */}
                        {song.links && song.links.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-border" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
                                {song.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link-chip text-xs flex items-center gap-1 bg-bg-tertiary px-2 py-1 rounded hover:bg-bg-secondary transition-colors"
                                        title={link.url}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--color-text-primary)', background: 'var(--color-bg-tertiary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}
                                    >
                                        {getLinkIcon(link.type)}
                                        <span className="truncate max-w-[100px]" style={{ maxWidth: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {link.type === 'youtube' ? 'YouTube' : link.type === 'spotify' ? 'Spotify' : 'Link'}
                                        </span>
                                        <ExternalLink size={10} className="opacity-50" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="song-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button className="song-action-btn" onClick={() => onEdit(song)}>
                            <Edit2 size={16} />
                            ערוך
                        </button>
                        <button className="song-action-btn delete" onClick={() => {
                            if (window.confirm('האם למחוק את השיר?')) {
                                onDelete(song.id);
                            }
                        }}>
                            <Trash2 size={16} />
                            מחק
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
