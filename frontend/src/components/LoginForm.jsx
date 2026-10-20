import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from '../../assets/js/core';

export default function LoginForm() {
  const { login, error: authError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setSubmitting(true);
    setError('');
    try {
      await login({ username: values.get('username'), password: values.get('password') });
      toast('Đăng nhập thành công.');
    } catch (err) {
      setError(err.status ? err.message : 'Không kết nối được máy chủ. Vui lòng kiểm tra backend và thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return <form id="loginForm" className="form-stack login-form" onSubmit={submit}>
    <label><span>Tên đăng nhập</span><div className="input-shell">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" /></svg>
      <input name="username" autoComplete="username" placeholder="Nhập tên đăng nhập" required disabled={submitting} />
    </div></label>
    <label><span>Mật khẩu</span><div className="input-shell">
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></svg>
      <input id="passwordInput" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Nhập mật khẩu" required disabled={submitting} />
      <button className="password-toggle" type="button" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></svg>
      </button>
    </div></label>
    {(error || authError) && <p role="alert" className="login-error">{error || authError}</p>}
    <button className="btn primary login-submit" type="submit" disabled={submitting}>
      <span>{submitting ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  </form>;
}
