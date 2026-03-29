import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import api from '../utils/api';
import { countWords, formatDuration } from '../utils/helpers';

interface AutoSaveStatus {
  state: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
}

interface PasteEvent {
  pastedAt: Date;
  textLength: number;
  wordCount: number;
  cursorPosition: number;
  pastedText: string; // kept client-side only for existence checking
}

/**
 * Checks whether pasted text still exists ANYWHERE in the document.
 * We search the entire content, not just near the original cursor,
 * because typing after the paste shifts its position rightward.
 */
function pasteStillExists(evt: PasteEvent, currentContent: string): boolean {
  if (!evt.pastedText || evt.pastedText.length === 0) return false;
  return currentContent.includes(evt.pastedText);
}

const EditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [autoSave, setAutoSave] = useState<AutoSaveStatus>({ state: 'idle' });
  const [duration, setDuration] = useState(0);
  const [titleFocused, setTitleFocused] = useState(false);

  const [pasteEvents, setPasteEvents] = useState<PasteEvent[]>([]);
  const [lastPasteAlert, setLastPasteAlert] = useState<string | null>(null);

  // Refs for stale-closure-free saves
  const contentRef = useRef('');
  const titleRef = useRef('');
  const durationRef = useRef(0);
  const sessionIdRef = useRef<string | null>(id || null);
  const pasteEventsRef = useRef<PasteEvent[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep refs in sync
  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { durationRef.current = duration; }, [duration]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);
  useEffect(() => { pasteEventsRef.current = pasteEvents; }, [pasteEvents]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Load existing session
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const { data } = await api.get(`/sessions/${id}`);
        const loadedTitle = data.session.title === 'Untitled Session' ? '' : data.session.title;
        setTitle(loadedTitle);
        setContent(data.session.content);
        setDuration(data.session.duration);
        titleRef.current = loadedTitle;
        contentRef.current = data.session.content;
        durationRef.current = data.session.duration;
        startTimeRef.current = Date.now() - data.session.duration * 1000;
        if (data.session.pasteEvents?.length) {
          // Loaded events from backend don't have pastedText, mark as verified
          setPasteEvents(data.session.pasteEvents);
          pasteEventsRef.current = data.session.pasteEvents;
        }
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  // ── PASTE DETECTION ──────────────────────────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    if (!pastedText.trim()) return;

    const cursorPos = textareaRef.current?.selectionStart ?? contentRef.current.length;

    const event: PasteEvent = {
      pastedAt: new Date(),
      textLength: pastedText.length,
      wordCount: countWords(pastedText),
      cursorPosition: cursorPos,
      pastedText,
    };

    setPasteEvents((prev) => [...prev, event]);

    const msg = `📋 Paste detected: ${pastedText.length} chars (${countWords(pastedText)} words)`;
    setLastPasteAlert(msg);
    if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
    alertTimerRef.current = setTimeout(() => setLastPasteAlert(null), 3500);
  }, []);
  // ────────────────────────────────────────────────────────────────

  // Core save
  const doSave = useCallback(async (manual = false): Promise<boolean> => {
    const currentContent = contentRef.current;
    const currentTitle = titleRef.current;
    const currentDuration = durationRef.current;
    const currentSessionId = sessionIdRef.current;
    const allPasteEvents = pasteEventsRef.current;

    if (!currentContent.trim() && !currentTitle.trim()) return false;

    if (manual) setSaving(true);

    try {
      // Only keep paste events whose text still exists somewhere in the document
      const activePasteEvents = allPasteEvents.filter((evt) => {
        // Events loaded from backend (no pastedText stored) are always kept
        if (!evt.pastedText) return true;
        return pasteStillExists(evt, currentContent);
      });

      // Sync state if some were discarded
      if (activePasteEvents.length !== allPasteEvents.length) {
        setPasteEvents(activePasteEvents);
        pasteEventsRef.current = activePasteEvents;
      }

      // Strip pastedText before sending to backend
      const pasteEventsForBackend = activePasteEvents.map(
        ({ pastedText: _pt, ...rest }) => rest
      );

      const payload = {
        title: currentTitle.trim() || 'Untitled Session',
        content: currentContent,
        wordCount: countWords(currentContent),
        characterCount: currentContent.length,
        duration: currentDuration,
        pasteEvents: pasteEventsForBackend,
        totalPastedChars: activePasteEvents.reduce((sum, e) => sum + e.textLength, 0),
        totalPastedWords: activePasteEvents.reduce((sum, e) => sum + e.wordCount, 0),
      };

      if (currentSessionId) {
        await api.put(`/sessions/${currentSessionId}`, payload);
      } else {
        const { data } = await api.post('/sessions', payload);
        const newId = data.session._id;
        sessionIdRef.current = newId;
        setSessionId(newId);
        window.history.replaceState(null, '', `/editor/${newId}`);
      }

      setAutoSave({ state: 'saved', lastSaved: new Date() });
      return true;
    } catch {
      setAutoSave({ state: 'error' });
      return false;
    } finally {
      if (manual) setSaving(false);
    }
  }, []);

  // Auto-save trigger
  const triggerAutoSave = useCallback(() => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    if (!contentRef.current.trim() && !titleRef.current.trim()) return;
    setAutoSave({ state: 'saving' });
    autoSaveRef.current = setTimeout(() => doSave(false), 1500);
  }, [doSave]);

  useEffect(() => { triggerAutoSave(); }, [content, title, triggerAutoSave]);

  const handleSaveAndExit = async () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    await doSave(true);
    navigate('/dashboard');
  };

  const handleCancel = () => {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    navigate('/dashboard');
  };

  const wordCount = countWords(content);
  const charCount = content.length;

  // Live badge: events with pastedText → check existence; events from backend → always count
  const activePasteEvents = pasteEvents.filter((evt) => {
    if (!evt.pastedText) return true;
    return pasteStillExists(evt, content);
  });
  const pasteCount = activePasteEvents.length;
  const totalPasted = activePasteEvents.reduce((sum, e) => sum + e.textLength, 0);

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      {/* Paste toast */}
      {lastPasteAlert && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-hover)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 18px',
          fontSize: 13,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          {lastPasteAlert}
        </div>
      )}

      {/* Toolbar */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <Stat label="Words" value={wordCount.toString()} />
          <Stat label="Chars" value={charCount.toString()} />
          <Stat label="Time" value={formatDuration(duration)} accent />
          {pasteCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 10px',
            }}>
              <span style={{ fontSize: 13 }}>📋</span>
              <span style={{
                fontSize: 12,
                color: 'var(--warning)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 500,
              }}>
                {pasteCount} paste{pasteCount !== 1 ? 's' : ''} · {totalPasted} chars
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AutoSaveIndicator status={autoSave} />
          <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSaveAndExit} loading={saving}>Save & Exit</Button>
        </div>
      </div>

      {/* Writing area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        maxWidth: 760, width: '100%', margin: '0 auto',
        padding: '40px 24px', gap: 16,
      }}>
        <input
          type="text"
          placeholder="Session title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setTitleFocused(true)}
          onBlur={() => setTitleFocused(false)}
          style={{
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${titleFocused ? 'var(--accent)' : 'var(--border)'}`,
            outline: 'none', color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', fontSize: 26, fontWeight: 700,
            letterSpacing: '-0.03em', padding: '4px 0 10px', width: '100%',
            transition: 'border-color var(--transition)', caretColor: 'var(--accent)',
          }}
        />
        <textarea
          ref={textareaRef}
          placeholder="Start writing here… Paste events are recorded only if the pasted text remains in the document."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={handlePaste}
          autoFocus={!id}
          style={{
            flex: 1, minHeight: 'calc(100vh - 280px)',
            background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
            fontSize: 16, lineHeight: 1.8, padding: '4px 0', width: '100%',
            caretColor: 'var(--accent)',
          }}
        />
      </div>

      {/* Bottom bar */}
      <div style={{
        borderTop: '1px solid var(--border)', background: 'var(--bg-secondary)',
        padding: '8px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 24, flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {wordCount} words · {charCount} characters
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Session time: {formatDuration(duration)}
        </span>
        {pasteCount > 0 && (
          <span style={{ fontSize: 12, color: 'var(--warning)', fontFamily: 'var(--font-mono)' }}>
            {pasteCount} active paste{pasteCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <span style={{
      fontSize: 15, fontWeight: 600,
      color: accent ? 'var(--accent-light)' : 'var(--text-primary)',
      fontFamily: 'var(--font-mono)',
    }}>
      {value}
    </span>
    <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
  </div>
);

const AutoSaveIndicator: React.FC<{ status: AutoSaveStatus }> = ({ status }) => {
  if (status.state === 'idle') return null;
  const configs = {
    saving: { color: 'var(--text-muted)', text: 'Saving…', pulse: true },
    saved: { color: 'var(--success)', text: 'Saved', pulse: false },
    error: { color: 'var(--error)', text: 'Save failed', pulse: false },
  };
  const cfg = configs[status.state];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%',
        background: cfg.color,
        animation: cfg.pulse ? 'pulse 1s infinite' : 'none',
      }} />
      <span style={{ fontSize: 12, color: cfg.color, fontFamily: 'var(--font-mono)' }}>{cfg.text}</span>
    </div>
  );
};

export default EditorPage;