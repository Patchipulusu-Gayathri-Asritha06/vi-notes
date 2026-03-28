import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { AxiosError } from 'axios';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setApiError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      const ax = err as AxiosError<{ message: string }>;
      setApiError(ax.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      {/* Background grid */}
      <div style={gridBg} />

      <div style={cardStyle} className="animate-fade-in">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={logoStyle}>V</div>
          <h1 style={headingStyle}>Welcome back</h1>
          <p style={subStyle}>Sign in to your Vi-Notes account</p>
        </div>

        {apiError && (
          <div style={errorBanner}>{apiError}</div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth loading={loading} size="lg" style={{ marginTop: 8 }}>
            Sign in
          </Button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  position: 'relative',
  overflow: 'hidden',
};

const gridBg: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundImage: `
    linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)
  `,
  backgroundSize: '48px 48px',
  pointerEvents: 'none',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xl)',
  padding: '40px 36px',
  boxShadow: 'var(--shadow-lg), 0 0 80px rgba(108,99,255,0.06)',
  position: 'relative',
  zIndex: 1,
};

const logoStyle: React.CSSProperties = {
  width: 52,
  height: 52,
  background: 'var(--accent)',
  borderRadius: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 24,
  fontWeight: 700,
  color: '#fff',
  margin: '0 auto 20px',
  boxShadow: 'var(--shadow-accent)',
};

const headingStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: 'var(--text-primary)',
  letterSpacing: '-0.03em',
  marginBottom: 6,
};

const subStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'var(--text-muted)',
};

const errorBanner: React.CSSProperties = {
  background: 'var(--error-subtle)',
  border: '1px solid rgba(239,68,68,0.2)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 14px',
  fontSize: 13,
  color: 'var(--error)',
  marginBottom: 16,
};

export default LoginPage;
