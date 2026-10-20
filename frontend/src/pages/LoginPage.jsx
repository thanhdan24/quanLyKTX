import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import PublicNav from '../components/PublicNav';
import logo from '../../assets/images/ptit-logo.png';

export default function LoginPage() {
  const { user } = useAuth();
  const location = useLocation();
  const from = location.state?.from;
  const target = from?.startsWith('/') && !from.startsWith('//') ? from : '/dashboard';
  if (user) return <Navigate to={target} replace />;
  return (
<main id="loginPage" className="login-page">
    <section className="login-showcase" aria-label="Giới thiệu hệ thống ký túc xá PTIT">
      <div className="showcase-brand">
        <span className="brand-symbol" aria-hidden="true">
          <img src={logo} alt="" />
        </span>
        <div className="brand-copy">
          <strong>KTX PTIT</strong>
          <span>Cổng thông tin ký túc xá</span>
          <small>Học viện Công nghệ Bưu chính Viễn thông</small>
        </div>
      </div>

      <div className="showcase-copy">
        <span className="showcase-kicker">Quản lý tập trung · Vận hành hiệu quả · Phục vụ sinh viên</span>
        <h2><span>Ký Túc Xá</span><em>Học Viện Công Nghệ<br />Bưu Chính Viễn Thông</em></h2>
        <p>Hệ thống quản lý ký túc xá tập trung, minh bạch và hiện đại, đồng hành cùng sinh viên PTIT trong suốt hành trình học tập.</p>
      </div>

      <div className="showcase-dashboard" aria-hidden="true">
        <div className="mock-window-head">
          <div className="mock-title">
            <svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M9 20v-6h6v6"/></svg>
            <span>Tổng quan ký túc xá PTIT</span>
          </div>
          <span className="mock-status"><i></i> Đang hoạt động</span>
        </div>

        <div className="mock-grid">
          <div className="mock-stat">
            <span className="mock-stat-icon"><svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
            <div><b>1.248</b><span>Sinh viên đang ở</span></div>
          </div>
          <div className="mock-stat">
            <span className="mock-stat-icon"><svg viewBox="0 0 24 24"><path d="M3 7v11M21 11v7M3 15h18M7 11h11a3 3 0 0 1 3 3v1H3v-4h4ZM7 11V7h5a3 3 0 0 1 3 3v1"/></svg></span>
            <div><b>86%</b><span>Công suất phòng</span></div>
          </div>
          <div className="mock-stat">
            <span className="mock-stat-icon"><svg viewBox="0 0 24 24"><path d="M9 5h6M9 9h6M9 13h4M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/></svg></span>
            <div><b>98%</b><span>Hồ sơ đã xử lý</span></div>
          </div>
        </div>

        <div className="mock-chart">
          <div className="mock-chart-label">
            <span>Tình hình cư trú</span>
            <b><svg viewBox="0 0 24 24"><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg> Ổn định</b>
          </div>
          <svg viewBox="0 0 600 130" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#5eead4" stopOpacity=".34"/>
                <stop offset="1" stopColor="#5eead4" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path className="area" d="M0 104 C60 100,76 80,128 86 S214 61,262 69 S342 39,388 51 S476 30,600 19 L600 130 L0 130 Z"/>
            <path className="line" d="M0 104 C60 100,76 80,128 86 S214 61,262 69 S342 39,388 51 S476 30,600 19"/>
          </svg>
        </div>
      </div>
    </section>

    <section className="login-panel">
      <div className="login-card"><PublicNav />
        <div className="mobile-login-brand">
          <span className="brand-symbol compact" aria-hidden="true">
            <img src={logo} alt="" />
          </span>
          <div><strong>KTX PTIT</strong><span>Học viện Công nghệ Bưu chính Viễn thông</span></div>
        </div>

        <div className="login-heading">
          <span className="login-badge">
            <svg viewBox="0 0 24 24"><path d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M9 20v-6h6v6"/></svg>
            Hệ thống Ký túc xá PTIT
          </span>
          <h1>Chào mừng trở lại</h1>
          <p>Đăng nhập để truy cập Hệ thống Ký túc xá<br />Học viện Công nghệ Bưu chính Viễn thông.</p>
        </div>

        <LoginForm />

        <p className="login-help"><svg viewBox="0 0 24 24"><path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>Hệ thống được bảo mật và chỉ dành cho sinh viên, cán bộ PTIT.</p>
      </div>
    </section>
  </main>
  );
}
