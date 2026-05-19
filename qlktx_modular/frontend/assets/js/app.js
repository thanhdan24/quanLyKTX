'use strict';

function showLogin() {
  closeModal();
  $('loginPage').hidden = false;
  $('appPage').hidden = true;
}

function showApp() {
  closeModal();
  $('loginPage').hidden = true;
  $('appPage').hidden = false;
  $('roleText').textContent = roleNames[currentUser.Role] || currentUser.Role;
  $('userPill').textContent = `${currentUser.FullName} · ${roleNames[currentUser.Role]}`;
  renderMenu();
  navigate('dashboard');
}

function renderMenu() {
  $('menu').innerHTML = (menus[currentUser.Role] || []).map(([key, text]) => `
    <button class="${currentView === key ? 'active' : ''}" onclick="navigate('${key}')">${esc(text)}</button>
  `).join('');
}

async function navigate(view) {
  currentView = view;
  $('viewTitle').textContent = titles[view] || 'Chức năng';
  renderMenu();
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
  const payload = formData(event.target);
  try {
    const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    currentUser = result.user;
    toast('Đăng nhập thành công.');
    showApp();
  } catch (error) {
    toast(error.message || 'Đăng nhập thất bại.');
  }
};

$('logoutBtn').onclick = logout;

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
