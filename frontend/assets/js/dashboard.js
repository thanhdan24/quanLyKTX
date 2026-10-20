'use strict';

async function renderDashboard() {
  const data = await api('/api/dashboard');
  const cards = (data.cards || []).map((card) => `
    <div class="stat-card">
      <span>${esc(card.label)}</span>
      <strong>${card.money ? money(card.value) : esc(card.value)}</strong>
    </div>
  `).join('');

  const firstName = String(currentUser?.FullName || 'bạn').trim().split(/\s+/).slice(-1)[0];
  const roleGuide = {
    STUDENT: 'Theo dõi hồ sơ đăng ký, tình trạng phòng ở, thanh toán và các yêu cầu phát sinh của bạn.',
    MANAGER: 'Kiểm soát hồ sơ, phân phòng, nhận trả phòng và xử lý yêu cầu sinh viên tại một nơi.',
    ACCOUNTANT: 'Theo dõi giao dịch, xác nhận thanh toán, công nợ và số liệu thu phí nhanh chóng.',
    ADMIN: 'Quản trị người dùng, sinh viên, tòa nhà, phòng ở và các đợt đăng ký của hệ thống.'
  };

  content.innerHTML = `
    <section class="dashboard-hero">
      <div class="hero-copy">
        <span class="hero-kicker">Bảng điều khiển cá nhân</span>
        <h3>Xin chào, ${esc(firstName)}!</h3>
        <p>${esc(roleGuide[currentUser?.Role] || 'Theo dõi và quản lý các hoạt động ký túc xá trên một giao diện thống nhất.')}</p>
      </div>
      <div class="hero-art" aria-hidden="true">
        <svg viewBox="0 0 96 96">
          <path d="M15 81V34L48 15l33 19v47"/>
          <path d="M26 81V42h44v39M39 81V62h18v19M34 50h7M55 50h7"/>
          <path d="M7 81h82"/>
        </svg>
      </div>
    </section>
    <section class="grid three">${cards}</section>
    <section class="card dashboard-note">
      <div class="dashboard-note-icon">
        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>
      </div>
      <div>
        <h3>Thông tin hệ thống</h3>
        <p class="muted">Dữ liệu được đồng bộ trực tiếp với hệ thống quản lý. Hãy chọn chức năng ở thanh điều hướng để bắt đầu thao tác.</p>
      </div>
    </section>
  `;
}

