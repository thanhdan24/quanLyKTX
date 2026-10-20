import { content, currentUser, esc, money, api, menus, menuIcon, titles, date, badge } from './core.js';

const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const descriptions = {
  'student-profile': 'Xem và cập nhật thông tin cá nhân',
  'student-register': 'Đăng ký chỗ ở trong đợt đang mở',
  'student-apps': 'Theo dõi kết quả duyệt và phân phòng',
  'student-payments': 'Gửi và theo dõi các khoản thanh toán',
  'student-requests': 'Gửi yêu cầu và nhận hỗ trợ',
  'manager-apps': 'Kiểm tra hồ sơ và bố trí chỗ ở',
  'manager-checkin': 'Theo dõi sinh viên nhận và trả phòng',
  'manager-requests': 'Tiếp nhận và xử lý yêu cầu sinh viên',
  'manager-residence-report': 'Theo dõi tình hình cư trú tại ký túc xá',
  'accountant-payments': 'Đối soát và xác nhận giao dịch',
  'accountant-debts': 'Kiểm tra các khoản cần thanh toán',
  'accountant-fee-report': 'Tổng hợp tình hình thu phí',
  'admin-users': 'Quản lý tài khoản và quyền truy cập',
  'admin-students': 'Tra cứu và quản lý hồ sơ sinh viên',
  'admin-buildings': 'Thiết lập danh mục các tòa nhà',
  'admin-rooms': 'Quản lý phòng và sức chứa',
  'admin-periods': 'Thiết lập thời gian đăng ký chỗ ở',
};

const guides = {
  STUDENT: ['Hoàn thiện hồ sơ cá nhân', 'Đăng ký chỗ ở trong đợt đang mở', 'Theo dõi kết quả và thanh toán'],
  MANAGER: ['Kiểm tra các hồ sơ chờ duyệt', 'Phân phòng phù hợp cho sinh viên', 'Theo dõi nhận phòng và yêu cầu hỗ trợ'],
  ACCOUNTANT: ['Đối soát các giao dịch thanh toán', 'Xác nhận giao dịch hợp lệ', 'Theo dõi công nợ và báo cáo thu phí'],
  ADMIN: ['Cập nhật danh mục tòa nhà và phòng', 'Quản lý tài khoản theo đúng vai trò', 'Thiết lập các đợt đăng ký chỗ ở'],
};

function metricDetails(card) {
  const label = String(card.label || '').toLocaleLowerCase('vi');
  if (card.money) return { tone: 'amber', note: 'Tổng các khoản đã xác nhận', path: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h3M16 14v3M14.5 15.5h3"/>' };
  if (label.includes('thanh toán')) return { tone: 'amber', note: 'Giao dịch chờ được xác nhận', path: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4M17 14v3"/>' };
  if (label.includes('yêu cầu')) return { tone: 'rose', note: 'Yêu cầu đang chờ phản hồi', path: '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 10 10 0 0 1-4-.8L3 21l1.5-4.5A9 9 0 1 1 21 11.5Z"/><path d="M8 10h8M8 14h5"/>' };
  if (label.includes('khả dụng')) return { tone: 'teal', note: 'Phòng có trạng thái còn chỗ', path: '<path d="M4 21V3h12v18M16 8h4v13M9 12h1M2 21h20"/>' };
  if (label.includes('nhận phòng')) return { tone: 'blue', note: 'Hồ sơ đã xác nhận nhận phòng', path: '<path d="M3 18v-8h18v8M3 16h18M5 10V6h6v4M13 10V6h6v4M5 18v3M19 18v3"/>' };
  return { tone: 'teal', note: label.includes('chờ') ? 'Hồ sơ cần được xem xét' : 'Hồ sơ đăng ký của bạn', path: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>' };
}

function campusIllustration() {
  const windows = (x, y, cols, rows, color) => Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => `<rect x="${x + col * 24}" y="${y + row * 26}" width="10" height="14" rx="2" fill="${color}"/>`).join('')).join('');
  return `<svg class="campus-scene" viewBox="0 0 380 225" aria-hidden="true">
    <circle cx="212" cy="110" r="97" fill="#e4eadc"/><circle cx="315" cy="45" r="17" fill="#eacfa0"/>
    <path d="M57 193h278" stroke="#b6c9ba" stroke-width="2"/>
    <rect x="74" y="85" width="92" height="107" rx="3" fill="#b7d1c5"/><path d="M68 85h104v-9H68z" fill="#86b29d"/>
    ${windows(88, 100, 3, 3, '#f1f6eb')}
    <rect x="164" y="43" width="109" height="149" rx="3" fill="#fafaf0"/><path d="M157 43h123v-9H157z" fill="#527f6b"/>
    <path d="M164 53h109" stroke="#e5e5d6" stroke-width="3"/>${windows(181, 69, 4, 3, '#85b09b')}
    <rect x="203" y="161" width="32" height="31" rx="2" fill="#376e57"/><path d="M219 162v30" stroke="#8fbaa3"/>
    <rect x="273" y="110" width="49" height="82" rx="2" fill="#c9dccd"/>${windows(283, 124, 2, 2, '#759c86')}
    <path d="M49 191v-48M333 192v-37" stroke="#648f74" stroke-width="4"/>
    <ellipse cx="49" cy="140" rx="20" ry="31" fill="#7da58a"/><ellipse cx="333" cy="151" rx="17" ry="24" fill="#8aaf91"/>
    <path d="M38 193h29M321 193h24" stroke="#8eac94" stroke-width="4"/>
    <rect x="193" y="13" width="50" height="18" rx="4" fill="#fffdf7"/><text x="218" y="25.5" text-anchor="middle" fill="#54735e" stroke="none" font-family="Arial, sans-serif" font-size="10" font-weight="700" letter-spacing="2">PTIT</text>
    <path d="M195 205h44M176 215h81" stroke="#d4d9c7" stroke-width="3" stroke-linecap="round"/>
  </svg>`;
}

async function renderDashboard() {
  const data = await api('/api/dashboard');
  const role = currentUser?.Role;
  const firstName = String(currentUser?.FullName || 'bạn').trim().split(/\s+/).slice(-1)[0];
  const actions = (menus[role] || []).filter(([view]) => view !== 'dashboard');
  const primary = { STUDENT: 'student-register', MANAGER: 'manager-apps', ACCOUNTANT: 'accountant-payments', ADMIN: 'admin-rooms' }[role] || actions[0]?.[0];
  const roleGuide = {
    STUDENT: 'Một không gian sống tốt, một hành trình học tập trọn vẹn. Mọi thông tin về chỗ ở của bạn đều ở đây.',
    MANAGER: 'Cùng tạo nên một môi trường sống tốt hơn. Theo dõi và quản lý hoạt động ký túc xá ngay tại đây.',
    ACCOUNTANT: 'Nắm bắt tình hình thanh toán, quản lý công nợ và theo dõi các khoản thu một cách rõ ràng.',
    ADMIN: 'Một góc nhìn tổng thể về ký túc xá. Quản lý con người, không gian sống và các đợt đăng ký tại một nơi.',
  };
  const metrics = (data.cards || []).map(card => {
    const details = metricDetails(card);
    return `<article class="stat-card metric-${details.tone}">
      <div class="metric-top"><span class="metric-label">${esc(card.label)}</span><i class="metric-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${details.path}</svg></i></div>
      <strong class="${card.money ? 'metric-money' : ''}">${card.money ? money(card.value) : esc(card.value)}</strong>
      <small class="metric-caption">${esc(details.note)}</small>
    </article>`;
  }).join('');
  const quickLinks = actions.map(([view, title]) => `<a class="quick-action" href="/${view}" data-view="${view}">
    ${menuIcon(view)}<div><strong>${esc(title)}</strong><span>${esc(descriptions[view] || 'Mở chức năng quản lý')}</span></div><span class="quick-arrow">${arrow}</span>
  </a>`).join('');
  const recent = role === 'STUDENT' && data.recent?.length ? `<section class="card recent-applications">
    <div class="panel-heading"><div><h3>Hồ sơ gần đây</h3><p>Cập nhật tình hình đăng ký chỗ ở của bạn</p></div><a href="/student-apps" data-view="student-apps" class="text-link">Xem tất cả ${arrow}</a></div>
    <div class="recent-list">${data.recent.slice(0, 3).map(app => `<div class="recent-item"><div><strong>${esc(app.PeriodName)}</strong><span>${date(app.SubmittedAt)} · ${esc(app.RoomCode || 'Chưa phân phòng')}</span></div>${badge(app.Status)}</div>`).join('')}</div>
  </section>` : '';

  content.innerHTML = `
    <section class="dashboard-hero">
      <div class="hero-copy">
        <span class="hero-kicker"><span class="live-dot"></span> CHÀO MỪNG ĐẾN VỚI KTX PTIT</span>
        <h3>Chúc một ngày tốt lành, ${esc(firstName)} <span class="greeting-spark" aria-hidden="true">✦</span></h3>
        <p>${esc(roleGuide[role] || 'Theo dõi và quản lý hoạt động ký túc xá của bạn.')}</p>
        ${primary ? `<a class="btn primary hero-action" href="/${primary}" data-view="${primary}">${esc(titles[primary])} ${arrow}</a>` : ''}
      </div>
      <div class="hero-art">${campusIllustration()}</div>
    </section>
    <div class="section-heading"><div><h3>Tình hình tổng quan</h3><p>Các thông tin chính trong không gian làm việc của bạn</p></div><span class="section-note"><span class="live-dot"></span> Dữ liệu từ hệ thống</span></div>
    <section class="grid three dashboard-metrics" aria-label="Thống kê tổng quan">${metrics || '<div class="card"><p class="muted">Chưa có số liệu thống kê.</p></div>'}</section>
    <div class="dashboard-bottom">
      <section class="card quick-panel">
        <div class="panel-heading"><div><h3>Truy cập nhanh</h3><p>Mọi công việc thường dùng, trong tầm tay</p></div><span class="panel-heading-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z"/></svg></span></div>
        <div class="quick-grid">${quickLinks}</div>
      </section>
      <section class="card guide-panel">
        <span class="guide-eyebrow">BẮT ĐẦU THẬT DỄ DÀNG</span><h3>Mỗi ngày, một chút<br>thuận tiện hơn.</h3>
        <ol>${(guides[role] || guides.STUDENT).map(step => `<li>${esc(step)}</li>`).join('')}</ol>
        <a class="text-link" href="/huong-dan" data-view="huong-dan">Xem hướng dẫn sử dụng ${arrow}</a>
      </section>
    </div>
    ${recent}
    <footer class="dashboard-footer"><span>KTX PTIT · Đồng hành cùng cuộc sống sinh viên</span><span>Học viện Công nghệ Bưu chính Viễn thông</span></footer>
  `;
  content.querySelectorAll('a[data-view]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      window.navigate(link.dataset.view);
    });
  });
}


export { renderDashboard };
