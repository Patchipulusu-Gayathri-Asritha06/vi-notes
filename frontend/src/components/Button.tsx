import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  disabled,
  style,
  ...rest
}) => {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius-md)',
    border: '1px solid transparent',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.55 : 1,
    transition: 'all var(--transition)',
    width: fullWidth ? '100%' : undefined,
    whiteSpace: 'nowrap',
  };

  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 14 },
    lg: { padding: '13px 28px', fontSize: 15 },
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--accent)',
      color: '#fff',
      borderColor: 'var(--accent)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      borderColor: 'var(--border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      borderColor: 'transparent',
    },
    danger: {
      background: 'var(--error-subtle)',
      color: 'var(--error)',
      borderColor: 'rgba(239,68,68,0.2)',
    },
  };

  return (
    <button
      disabled={disabled || loading}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        if (variant === 'primary') el.style.background = 'var(--accent-light)';
        if (variant === 'secondary') el.style.borderColor = 'var(--border-hover)';
        if (variant === 'ghost') el.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        if (disabled || loading) return;
        const el = e.currentTarget;
        if (variant === 'primary') el.style.background = 'var(--accent)';
        if (variant === 'secondary') el.style.borderColor = 'var(--border)';
        if (variant === 'ghost') el.style.color = 'var(--text-secondary)';
      }}
      {...rest}
    >
      {loading && (
        <span style={{
          width: 14, height: 14,
          border: '2px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {children}
    </button>
  );
};

export default Button;
