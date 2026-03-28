import React, { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input: React.FC<InputProps> = ({ label, error, hint, id, style, ...rest }) => {
  const [focused, setFocused] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: error ? 'var(--error)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          padding: '11px 14px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color var(--transition), box-shadow var(--transition)',
          boxShadow: focused && !error ? '0 0 0 3px var(--accent-subtle)' : 'none',
          ...style,
        }}
        {...rest}
      />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--error)', fontFamily: 'var(--font-sans)' }}>
          {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {hint}
        </span>
      )}
    </div>
  );
};

export default Input;