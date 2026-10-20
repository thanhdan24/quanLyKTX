import { useEffect, useLayoutEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { menus } from '../assets/js/core';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import BusinessPage from './pages/BusinessPage';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/NotFoundPage';

function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/dang-nhap" replace state={{ from: location.pathname + location.search }} />;
}

function RolePage({ view }) {
  const { user } = useAuth();
  return (menus[user.Role] || []).some(([key]) => key === view)
    ? <BusinessPage key={view} view={view} />
    : <NotFoundPage forbidden />;
}

export default function App() {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    // Compatibility for existing inline actions: route changes go through React Router.
    window.navigate = view => {
      const path = `/${view}`;
      if (location.pathname === path) window.dispatchEvent(new Event('qlktx:refresh'));
      else navigate(path);
    };
    return () => { delete window.navigate; };
  }, [navigate, location.pathname]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Hệ thống Ký túc xá PTIT';
  }, [location.pathname]);

  if (loading) return <main className="status-page"><div className="card" role="status">Đang kiểm tra phiên đăng nhập...</div></main>;

  const views = [...new Set(Object.values(menus).flat().map(([key]) => key))];
  return <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/dang-nhap" element={<LoginPage />} />
    <Route path="/gioi-thieu" element={<InfoPage />} />
    <Route path="/huong-dan" element={<InfoPage guide />} />
    <Route element={<RequireAuth />}>
      <Route element={<AppLayout />}>
        {views.map(view => <Route key={view} path={`/${view}`} element={<RolePage view={view} />} />)}
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
