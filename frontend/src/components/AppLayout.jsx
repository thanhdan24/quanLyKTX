import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { menus, menuIcon, roleNames, titles } from '../../assets/js/core';
import logo from '../../assets/images/ptit-logo.png';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const view = location.pathname.split('/')[1];
  const initial = user.FullName.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
  const today = new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    function closeOnResize() { if (window.innerWidth > 960) setOpen(false); }
    function closeOnEscape(event) { if (event.key === 'Escape') setOpen(false); }
    window.addEventListener('resize', closeOnResize);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('resize', closeOnResize);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = open && window.innerWidth <= 960 ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return <main id="appPage" className="app-shell">
    <div id="sidebarBackdrop" className="sidebar-backdrop" hidden={!open} onClick={() => setOpen(false)} />
    <aside id="sidebar" className={`sidebar${open ? ' open' : ''}`}>
      <div className="side-brand-row">
        <Link to="/dashboard" id="brandLink" className="side-brand" title="Quay lại trang chủ">
          <span className="brand-symbol compact"><img src={logo} alt="Logo PTIT" /></span>
          <div className="side-brand-text"><strong>KTX PTIT</strong><span id="roleText">{roleNames[user.Role]}</span></div>
        </Link>
        <button id="closeSidebarBtn" className="sidebar-close" type="button" aria-label="Đóng menu" onClick={() => setOpen(false)}>
          <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>
      <div className="menu-caption">Không gian làm việc</div>
      <nav id="menu" className="menu" aria-label="Chức năng ký túc xá">
        {(menus[user.Role] || []).map(([key, title]) => <NavLink key={key} to={`/${key}`} end>
          <span dangerouslySetInnerHTML={{ __html: menuIcon(key) }} />
          <span className="menu-text">{title}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-support">
        <span className="support-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13H3v6h4v-6H4ZM20 13h1v6h-4v-6h3ZM17 19c0 2-2 2-5 2" /></svg></span>
        <div><strong>Luôn sẵn sàng hỗ trợ</strong><span>Cùng bạn sử dụng hệ thống dễ dàng hơn.</span></div>
        <Link to="/huong-dan">Xem hướng dẫn <span aria-hidden="true">↗</span></Link>
      </div>
      <button id="logoutBtn" className="btn logout-btn full" type="button" onClick={logout}>
        <svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg><span>Đăng xuất</span>
      </button>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <div className="topbar-left">
          <button id="mobileMenuBtn" className="mobile-menu-btn" type="button" aria-label="Mở menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(true)}><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
          <div><p className="eyebrow">Ký túc xá PTIT <span aria-hidden="true">/</span> Không gian làm việc</p><h2 id="viewTitle">{titles[view] || 'Chức năng'}</h2></div>
        </div>
        <div className="topbar-right">
          <div className="today-pill"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2" /></svg>{today}</div>
          <div className="user-pill" id="userPill" data-initial={initial} title={`${user.FullName} · ${roleNames[user.Role]}`}>
            <div className="account-copy"><strong>{user.FullName}</strong><span>{roleNames[user.Role]}</span></div>
          </div>
        </div>
      </header>
      <Outlet />
    </section>
  </main>;
}
