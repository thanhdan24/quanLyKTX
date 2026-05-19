'use strict';

async function renderDashboard() {
  const data = await api('/api/dashboard');
  const cards = (data.cards || []).map((card) => `
    <div class="stat-card"><span>${esc(card.label)}</span><strong>${card.money ? money(card.value) : esc(card.value)}</strong></div>
  `).join('');
  content.innerHTML = `
    <section class="grid three">${cards}</section>
    <section class="card">
      <h3>Gợi ý sử dụng</h3>
      <p class="muted">Website đang kết nối backend Node.js/Express và SQL Server. Dữ liệu hiển thị, thêm, sửa, duyệt hồ sơ, phân phòng, thanh toán và báo cáo đều được xử lý qua API.</p>
    </section>
  `;
}
