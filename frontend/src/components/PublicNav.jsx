import { NavLink } from 'react-router-dom';

export default function PublicNav() {
  return <nav className="public-nav" aria-label="Menu chính">
    <NavLink to="/" end>Trang chủ</NavLink>
    <NavLink to="/gioi-thieu">Giới thiệu</NavLink>
    <NavLink to="/huong-dan">Hướng dẫn</NavLink>
    <NavLink to="/dang-nhap">Đăng nhập</NavLink>
  </nav>;
}
