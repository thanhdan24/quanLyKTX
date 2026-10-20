import { Link } from 'react-router-dom';
import PublicNav from '../components/PublicNav';
import logo from '../../assets/images/ptit-logo.png';

export default function InfoPage({ guide = false }) {
  return <main className="info-page">
    <header className="info-header"><Link to="/" className="info-brand"><img src={logo} alt="Logo PTIT" />KTX PTIT</Link><PublicNav /></header>
    <article className="card info-content">
      <p className="eyebrow">Cổng thông tin ký túc xá PTIT</p>
      <h1>{guide ? 'Hướng dẫn sử dụng' : 'Giới thiệu hệ thống'}</h1>
      {guide ? <>
        <p>Sử dụng tài khoản do nhà trường hoặc quản trị viên cung cấp để đăng nhập.</p>
        <ol>
          <li>Kiểm tra và cập nhật thông tin tại mục Hồ sơ sinh viên.</li>
          <li>Chọn Đăng ký ở KTX, chọn đợt đang mở, tòa nhà và thời gian đăng ký.</li>
          <li>Theo dõi kết quả duyệt và phân phòng tại mục Theo dõi hồ sơ.</li>
          <li>Khi hồ sơ được duyệt và có tổng tiền, gửi thông tin thanh toán để kế toán xác nhận.</li>
          <li>Gửi yêu cầu gia hạn, chuyển phòng, trả phòng hoặc phản ánh tại mục Yêu cầu phát sinh.</li>
        </ol>
        <p>Nếu gặp vấn đề về tài khoản hoặc dữ liệu, vui lòng liên hệ cán bộ quản lý ký túc xá.</p>
      </> : <>
        <p>Hệ thống hỗ trợ sinh viên và cán bộ PTIT quản lý quá trình đăng ký và sinh hoạt tại ký túc xá.</p>
        <div className="grid two">
          <section><h2>Dành cho sinh viên</h2><p>Cập nhật hồ sơ, đăng ký chỗ ở, theo dõi thanh toán và gửi yêu cầu hỗ trợ.</p></section>
          <section><h2>Dành cho cán bộ</h2><p>Duyệt hồ sơ, phân phòng, nhận trả phòng, xác nhận thanh toán và theo dõi báo cáo theo vai trò.</p></section>
        </div>
      </>}
      <Link to="/dang-nhap" className="btn primary">Đăng nhập hệ thống</Link>
    </article>
  </main>;
}
