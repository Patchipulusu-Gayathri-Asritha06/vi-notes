import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 400);
  };

  const isDark = theme === 'dark';

  return (
    <button
      onClick={handleClick}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 18,
        transition: 'border-color 0.2s ease, background 0.2s ease',
        flexShrink: 0,
      }}
      className={animating ? 'theme-toggling' : ''}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {isDark ? '🌙' : '☀️'}
    </button>
  );
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMenu, setShowMenu] = useState(false);

  const isEditor = location.pathname.startsWith('/editor');

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(var(--bg-primary-rgb, 10, 11, 15), 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: 60,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)',
    }}>
      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 0,
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-accent)',
        }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>V</span>
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 17,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
        }}>
          Vi-Notes
        </span>
      </button>

      {isEditor && (
        <span style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          writing session
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ThemeToggle />

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowMenu((v) => !v)}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '7px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              transition: 'border-color var(--transition)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#fff',
              flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transform: showMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {showMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 8,
                minWidth: 200,
                boxShadow: 'var(--shadow-lg)',
                animation: 'fadeIn 0.15s ease',
                zIndex: 200,
              }}
              onMouseLeave={() => setShowMenu(false)}
            >
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <MenuBtn onClick={() => { setShowMenu(false); navigate('/dashboard'); }}>
                📋 Dashboard
              </MenuBtn>
              <MenuBtn onClick={() => { setShowMenu(false); navigate('/editor'); }}>
                ✏️ New Session
              </MenuBtn>
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 6, paddingTop: 6 }}>
                <MenuBtn
                  onClick={() => { setShowMenu(false); logout(); navigate('/login'); }}
                  style={{ color: 'var(--error)' }}
                >
                  🚪 Sign out
                </MenuBtn>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const MenuBtn: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  style?: React.CSSProperties;
}> = ({ children, onClick, style }) => (
  <button
    onClick={onClick}
    style={{
      width: '100%',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: 'var(--radius-sm)',
      color: 'var(--text-secondary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      textAlign: 'left',
      transition: 'background var(--transition), color var(--transition)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      ...style,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
  >
    {children}
  </button>
);

export default Navbar;