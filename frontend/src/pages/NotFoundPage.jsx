import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage({ forbidden = false }) {
  const { user } = useAuth();
  return <main className="status-page"><section className="card">
    <h1>{forbidden ? 'Bạn không có quyền truy cập trang này' : 'Không tìm thấy trang'}</h1>
    <p>{forbidden ? 'Vui lòng chọn chức năng phù hợp với vai trò tài khoản của bạn.' : 'Đường dẫn bạn truy cập không tồn tại.'}</p>
    <Link className="btn primary" to={user ? '/dashboard' : '/'}>Về trang chủ</Link>
  </section></main>;
}
