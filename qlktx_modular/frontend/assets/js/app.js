'use strict';

function setSidebar(open) {
  const sidebar = $('sidebar');
  const backdrop = $('sidebarBackdrop');
  if (!sidebar || !backdrop) return;
  sidebar.classList.toggle('open', open);
  backdrop.hidden = !open;
  document.body.style.overflow = open && window.innerWidth <= 960 ? 'hidden' : '';
}

function userInitial(name) {
  const parts = String(name || 'KTX').trim().split(/\s+/).filter(Boolean);
  return parts.slice(-2).map((part) => part[0]).join('').toUpperCase() || 'KTX';
}

function updateToday() {
  const el = $('todayPill');
  if (!el) return;
  el.textContent = new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(new Date());
}

function showLogin() {
  closeModal();
  setSidebar(false);
  $('loginPage').hidden = false;
  $('appPage').hidden = true;
}

function showApp() {
  closeModal();
  $('loginPage').hidden = true;
  $('appPage').hidden = false;
  $('roleText').textContent = roleNames[currentUser.Role] || currentUser.Role;
  $('userPill').textContent = `${currentUser.FullName} · ${roleNames[currentUser.Role]}`;
  $('userPill').dataset.initial = userInitial(currentUser.FullName);
  updateToday();
  renderMenu();
  navigate('dashboard');
}

function renderMenu() {
  $('menu').innerHTML = (menus[currentUser.Role] || []).map(([key, text]) => `
    <button type="button" class="${currentView === key ? 'active' : ''}" onclick="navigate('${key}')">
      ${menuIcon(key)}
      <span class="menu-text">${esc(text)}</span>
    </button>
  `).join('');
}

async function navigate(view) {
  currentView = view;
  $('viewTitle').textContent = titles[view] || 'Chức năng';
  renderMenu();
  setSidebar(false);
  content.innerHTML = '<div class="card"><p class="muted">Đang tải dữ liệu...</p></div>';
  try {
    const renderers = {
      dashboard: renderDashboard,
      'student-profile': renderStudentProfile,
      'student-register': renderStudentRegister,
      'student-apps': renderApplications,
      'student-payments': renderStudentPayments,
      'student-requests': renderStudentRequests,
      'manager-apps': renderManagerApps,
      'manager-checkin': renderManagerCheckin,
      'manager-requests': renderManagerRequests,
      'manager-residence-report': renderResidenceReport,
      'accountant-payments': renderAccountantPayments,
      'accountant-debts': renderDebtReport,
      'accountant-fee-report': renderFeeReport,
      'admin-users': renderUsers,
      'admin-students': renderStudents,
      'admin-buildings': renderBuildings,
      'admin-rooms': renderRooms,
      'admin-periods': renderPeriods
    };
    await (renderers[view] || renderDashboard)();
  } catch (error) {
    if (error.status === 401) logout();
    content.innerHTML = `<div class="card"><h3>Không tải được dữ liệu</h3><p class="muted">${esc(error.message)}</p></div>`;
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  currentUser = null;
  showLogin();
}

$('loginForm').onsubmit = async (event) => {
  event.preventDefault();
  const submitButton = event.target.querySelector('[type="submit"]');
  const originalText = submitButton?.innerHTML;
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<span>Đang đăng nhập...</span>';
  }
  const payload = formData(event.target);
  delete payload.remember;
  try {
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    currentUser = result.user;
    toast('Đăng nhập thành công.');
    showApp();
  } catch (error) {
    toast(error.message || 'Đăng nhập thất bại.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
    }
  }
};

$('logoutBtn').onclick = logout;
$('mobileMenuBtn').onclick = () => setSidebar(true);
$('closeSidebarBtn').onclick = () => setSidebar(false);
$('sidebarBackdrop').onclick = () => setSidebar(false);

$('togglePassword').onclick = () => {
  const input = $('passwordInput');
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  $('togglePassword').setAttribute('aria-label', showing ? 'Hiện mật khẩu' : 'Ẩn mật khẩu');
};

window.addEventListener('resize', () => {
  if (window.innerWidth > 960) setSidebar(false);
});

(async function boot() {
  closeModal();
  const saved = localStorage.getItem(USER_KEY);
  if (!saved || !token()) return showLogin();
  try {
    const result = await api('/api/auth/me');
    currentUser = result.user;
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
    showApp();
  } catch {
    logout();
  }
})();

window.navigate = navigate;
window.logout = logout;

