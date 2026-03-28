import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import api from '../utils/api';
import { SessionListItem } from '../types';
import { formatRelativeTime, formatDuration } from '../utils/helpers';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const { data } = await api.get('/sessions');
      setSessions(data.sessions);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    try {
      await api.delete(`/sessions/${id}`);
      setSessions((s) => s.filter((sess) => sess._id !== id));
    } catch {
      // silent
    } finally {
      setDeleteId(null);
    }
  };

  const totalWords = sessions.reduce((sum, s) => sum + s.wordCount, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        {/* Greeting */}
        <div style={{ marginBottom: 36, animation: 'fadeIn 0.4s ease' }}>
          <h1 style={{
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary)',
            marginBottom: 6,
          }}>
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Your writing sessions and authenticity records
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 36 }}>
          <StatCard label="Total Sessions" value={sessions.length.toString()} icon="📝" />
          <StatCard label="Words Written" value={totalWords.toLocaleString()} icon="✍️" />
          <StatCard label="Time Spent" value={formatDuration(totalTime)} icon="⏱" />
        </div>

        {/* Sessions list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Writing Sessions
          </h2>
          <Button onClick={() => navigate('/editor')} size="sm">
            + New Session
          </Button>
        </div>

        {loading ? (
          <SkeletonList />
        ) : sessions.length === 0 ? (
          <EmptyState onNew={() => navigate('/editor')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.map((s, i) => (
              <SessionCard
                key={s._id}
                session={s}
                index={i}
                onOpen={() => navigate(`/editor/${s._id}`)}
                onView={() => navigate(`/session/${s._id}`)}
                onDelete={() => handleDelete(s._id)}
                deleting={deleteId === s._id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px 22px',
    animation: 'fadeIn 0.4s ease',
  }}>
    <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
    <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 4 }}>
      {value}
    </div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </div>
  </div>
);

const SessionCard: React.FC<{
  session: SessionListItem;
  index: number;
  onOpen: () => void;
  onView: () => void;
  onDelete: () => void;
  deleting: boolean;
}> = ({ session, index, onOpen, onView, onDelete, deleting }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-elevated)' : 'var(--bg-card)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        transition: 'all var(--transition)',
        cursor: 'pointer',
        animation: `fadeIn 0.3s ease ${index * 0.05}s both`,
      }}
      onClick={onOpen}
    >
      {/* Icon */}
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--accent-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        flexShrink: 0,
      }}>
        📄
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--text-primary)',
          marginBottom: 3,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {session.title || 'Untitled Session'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {session.wordCount} words · {formatDuration(session.duration)} · {formatRelativeTime(session.updatedAt)}
        </p>
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: 8, flexShrink: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="ghost" size="sm" onClick={onView} title="View report">
          📊 View
        </Button>
        <Button variant="secondary" size="sm" onClick={onOpen}>
          ✏️ Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          loading={deleting}
          title="Delete session"
        >
          🗑
        </Button>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div style={{
    textAlign: 'center',
    padding: '72px 24px',
    background: 'var(--bg-card)',
    border: '1px dashed var(--border)',
    borderRadius: 'var(--radius-xl)',
    animation: 'fadeIn 0.4s ease',
  }}>
    <div style={{ fontSize: 48, marginBottom: 16 }}>🖊️</div>
    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
      No sessions yet
    </h3>
    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
      Start your first writing session to begin tracking authenticity
    </p>
    <Button onClick={onNew} size="lg">Start writing</Button>
  </div>
);

const SkeletonList: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
    {[1, 2, 3].map((i) => (
      <div key={i} style={{
        height: 76,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s infinite',
        }} />
      </div>
    ))}
  </div>
);

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default DashboardPage;
