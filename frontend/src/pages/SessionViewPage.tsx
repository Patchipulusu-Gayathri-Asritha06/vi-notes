import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import api from '../utils/api';
import { Session } from '../types';
import { formatDate, formatDuration } from '../utils/helpers';

interface PasteEvent {
  pastedAt: string;
  textLength: number;
  wordCount: number;
  cursorPosition: number;
}

interface SessionWithPaste extends Session {
  pasteEvents: PasteEvent[];
  totalPastedChars: number;
  totalPastedWords: number;
}

const SessionViewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionWithPaste | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/sessions/${id}`);
        setSession(data.session);
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 60px)' }}>
          <div style={{
            width: 32, height: 32,
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const avgWPM = session.duration > 0
    ? Math.round((session.wordCount / session.duration) * 60)
    : 0;
  const readingTime = Math.ceil(session.wordCount / 200);
  const pasteCount = session.pasteEvents?.length ?? 0;
  const totalPastedChars = session.totalPastedChars ?? 0;
  const totalPastedWords = session.totalPastedWords ?? 0;

  // What % of total chars were pasted
  const pastePercentage = session.characterCount > 0
    ? Math.round((totalPastedChars / session.characterCount) * 100)
    : 0;

  // Authenticity score: 100% typed = green, high paste = red
  const authenticityScore = Math.max(0, 100 - pastePercentage);
  const scoreColor = authenticityScore >= 80
    ? 'var(--success)'
    : authenticityScore >= 50
      ? 'var(--warning)'
      : 'var(--error)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 28, padding: 0, transition: 'color var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          ← Back to dashboard
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32, animation: 'fadeIn 0.4s ease' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: 8 }}>
            {session.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Created {formatDate(session.createdAt)} · Last edited {formatDate(session.updatedAt)}
          </p>
        </div>

        {/* Authenticity score banner */}
        <div style={{
          background: 'var(--bg-card)',
          border: `1px solid ${scoreColor}40`,
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}>
          {/* Score ring */}
          <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="28"
                fill="none"
                stroke={scoreColor}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - authenticityScore / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: scoreColor,
              fontFamily: 'var(--font-mono)',
            }}>
              {authenticityScore}%
            </div>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
              Authenticity Score
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {authenticityScore >= 80
                ? '✅ Content appears to be genuinely typed. Low paste activity detected.'
                : authenticityScore >= 50
                  ? '⚠️ Moderate paste activity detected. Some content may not be original.'
                  : '🚨 High paste activity. Most content was pasted rather than typed.'}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatBox icon="📝" label="Word Count" value={session.wordCount.toLocaleString()} sub="total words" />
          <StatBox icon="⏱" label="Session Duration" value={formatDuration(session.duration)} sub="active writing time" />
          <StatBox icon="⚡" label="Writing Speed" value={`${avgWPM} WPM`} sub="average pace" />
          <StatBox icon="📖" label="Reading Time" value={`~${readingTime} min`} sub="at 200 WPM" />
        </div>

        {/* Paste analysis section */}
        <div style={{
          background: 'var(--bg-card)',
          border: `1px solid ${pasteCount > 0 ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          marginBottom: 24,
        }}>
          {/* Section header */}
          <div style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
              Paste Activity Analysis
            </h2>
            {pasteCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                color: 'var(--warning)',
                fontFamily: 'var(--font-mono)',
              }}>
                {pasteCount} event{pasteCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {pasteCount === 0 ? (
            <div style={{ padding: '28px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, marginBottom: 8 }}>✅</p>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>
                No paste events detected
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                All content appears to have been typed manually
              </p>
            </div>
          ) : (
            <>
              {/* Summary row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 0,
                borderBottom: '1px solid var(--border)',
              }}>
                <MiniStat label="Total Pastes" value={pasteCount.toString()} />
                <MiniStat label="Pasted Chars" value={totalPastedChars.toLocaleString()} border />
                <MiniStat label="Pasted Words" value={totalPastedWords.toLocaleString()} border />
              </div>

              {/* Progress bar: typed vs pasted */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    Typed: {100 - pastePercentage}%
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--warning)' }}>
                    Pasted: {pastePercentage}%
                  </span>
                </div>
                <div style={{
                  height: 8,
                  borderRadius: 4,
                  background: 'var(--bg-elevated)',
                  overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{
                      width: `${100 - pastePercentage}%`,
                      background: 'var(--success)',
                      transition: 'width 0.8s ease',
                    }} />
                    <div style={{
                      width: `${pastePercentage}%`,
                      background: 'var(--warning)',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                </div>
              </div>

              {/* Individual paste events */}
              <div style={{ padding: '12px 22px 16px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Event Log
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {session.pasteEvents.map((evt, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 14px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                    }}>
                      <span style={{
                        width: 24, height: 24,
                        borderRadius: '50%',
                        background: 'rgba(245,158,11,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: 'var(--warning)', fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                        <b style={{ color: 'var(--text-primary)' }}>{evt.textLength} chars</b>
                        {' '}({evt.wordCount} words) pasted at position {evt.cursorPosition}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {new Date(evt.pastedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content preview */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>
            Content Preview
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            maxHeight: 300,
            overflowY: 'auto',
          }}>
            {session.content ? (
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 15,
                lineHeight: 1.8, color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {session.content}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 14, fontStyle: 'italic' }}>
                No content in this session.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button onClick={() => navigate(`/editor/${session._id}`)} size="md">
            ✏️ Continue Writing
          </Button>
          <Button variant="secondary" onClick={() => navigate('/dashboard')} size="md">
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

const StatBox: React.FC<{ icon: string; label: string; value: string; sub: string }> = ({ icon, label, value, sub }) => (
  <div style={{
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '18px 20px',
    animation: 'fadeIn 0.4s ease',
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <span style={{ fontSize: 20, marginTop: 2 }}>{icon}</span>
      <div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>
          {value}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</p>
      </div>
    </div>
  </div>
);

const MiniStat: React.FC<{ label: string; value: string; border?: boolean }> = ({ label, value, border }) => (
  <div style={{
    padding: '14px 20px',
    borderLeft: border ? '1px solid var(--border)' : 'none',
    textAlign: 'center',
  }}>
    <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--warning)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
      {value}
    </p>
    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </p>
  </div>
);

export default SessionViewPage;