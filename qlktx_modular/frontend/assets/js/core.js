'use strict';

const API_BASE = localStorage.getItem('QLKTX_API_BASE') || (location.port === '3000' ? '' : 'http://localhost:3000');
const TOKEN_KEY = 'QLKTX_TOKEN_FULLSTACK';
const USER_KEY = 'QLKTX_USER_FULLSTACK';

const $ = (id) => document.getElementById(id);
const content = $('content');
let currentUser = null;
let currentView = 'dashboard';

const roleNames = {
  STUDENT: 'Sinh viên',
  MANAGER: 'Cán bộ quản lý KTX',
  ACCOUNTANT: 'Kế toán / Thu ngân',
  ADMIN: 'Quản trị hệ thống'
};

const requestLabels = {
  EXTEND: 'Gia hạn',
  TRANSFER: 'Chuyển phòng',
  CHECKOUT: 'Trả phòng',
  INCIDENT: 'Sự cố',
  FEEDBACK: 'Phản ánh'
};

const labels = {
  ACTIVE: 'Hoạt động', INACTIVE: 'Ngừng hoạt động', LOCKED: 'Đã khóa',
  PENDING: 'Chờ xử lý', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối',
  CHECKED_IN: 'Đã nhận phòng', CHECKED_OUT: 'Đã trả phòng',
  CONFIRMED: 'Đã xác nhận', DONE: 'Hoàn tất',
  OPEN: 'Đang mở', CLOSED: 'Đã đóng', DRAFT: 'Nháp',
  AVAILABLE: 'Còn chỗ', FULL: 'Đầy', MAINTENANCE: 'Bảo trì',
  MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác', ALL: 'Tất cả',
  CASH: 'Tiền mặt', TRANSFER: 'Chuyển khoản', ONLINE: 'Trực tuyến',
  EXTEND: 'Gia hạn', CHECKOUT: 'Trả phòng', INCIDENT: 'Sự cố', FEEDBACK: 'Phản ánh'
};

const menus = {
  STUDENT: [
    ['dashboard', '🏠 Tổng quan'],
    ['student-profile', '👤 Hồ sơ sinh viên'],
    ['student-register', '📝 Đăng ký ở KTX'],
    ['student-apps', '📄 Theo dõi hồ sơ'],
    ['student-payments', '💳 Thanh toán'],
    ['student-requests', '📬 Yêu cầu phát sinh']
  ],
  MANAGER: [
    ['dashboard', '🏠 Tổng quan'],
    ['manager-apps', '📋 Duyệt và phân phòng'],
    ['manager-checkin', '🛏️ Nhận/trả phòng'],
    ['manager-requests', '🧰 Xử lý yêu cầu'],
    ['manager-residence-report', '📊 Báo cáo cư trú']
  ],
  ACCOUNTANT: [
    ['dashboard', '🏠 Tổng quan'],
    ['accountant-payments', '💳 Xác nhận thanh toán'],
    ['accountant-debts', '📌 Theo dõi công nợ'],
    ['accountant-fee-report', '📈 Báo cáo thu phí']
  ],
  ADMIN: [
    ['dashboard', '🏠 Tổng quan'],
    ['admin-users', '🔐 Tài khoản'],
    ['admin-students', '🎓 Sinh viên'],
    ['admin-buildings', '🏢 Tòa nhà'],
    ['admin-rooms', '🚪 Phòng'],
    ['admin-periods', '🗓️ Đợt đăng ký']
  ]
};

const titles = Object.fromEntries(Object.values(menus).flat().map(([k, v]) => [k, v.replace(/^[^ ]+ /, '')]));
titles.dashboard = 'Tổng quan';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[m]));
}

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')} đ`;
}

function date(value) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '—';
}

function dt(value) {
  return value ? new Date(value).toLocaleString('vi-VN') : '—';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function statusClass(status) {
  if (['ACTIVE', 'APPROVED', 'CONFIRMED', 'CHECKED_IN', 'DONE', 'OPEN', 'AVAILABLE'].includes(status)) return 'ok';
  if (['PENDING', 'DRAFT', 'MAINTENANCE'].includes(status)) return 'warn';
  if (['REJECTED', 'LOCKED', 'INACTIVE', 'CLOSED', 'FULL'].includes(status)) return 'danger';
  return 'neutral';
}

function badge(status) {
  return `<span class="status ${statusClass(status)}">${esc(labels[status] || status || '—')}</span>`;
}

function toast(message) {
  const item = document.createElement('div');
  item.className = 'toast-item';
  item.textContent = message;
  $('toast').appendChild(item);
  setTimeout(() => item.remove(), 3600);
}

function token() {
  return localStorage.getItem(TOKEN_KEY);
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const tk = token();
  if (tk) headers.Authorization = `Bearer ${tk}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  let data = null;
  const text = await response.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { message: text }; }
  }
  if (!response.ok) {
    const error = new Error(data?.message || `Lỗi HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function queryString(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') params.set(key, value);
  });
  const text = params.toString();
  return text ? `?${text}` : '';
}

function filterValues(formId) {
  const form = $(formId);
  return form ? formData(form) : {};
}

function validForm(id) {
  const form = $(id);
  if (!form) {
    toast('Không tìm thấy biểu mẫu cần xử lý.');
    return null;
  }
  if (typeof form.reportValidity === 'function' && !form.reportValidity()) return null;
  return form;
}

async function runAction(action, successMessage, reloadView = currentView) {
  try {
    const result = await action();
    toast(result?.message || successMessage || 'Thao tác thành công.');
    closeModal();
    if (reloadView) await navigate(reloadView);
  } catch (error) {
    toast(error.message || 'Thao tác thất bại. Kiểm tra lại dữ liệu hoặc kết nối backend.');
  }
}

async function deleteRecord(url, confirmMessage, successMessage) {
  if (!confirm(confirmMessage || 'Bạn chắc chắn muốn xóa bản ghi này?')) return;
  await runAction(() => api(url, { method: 'DELETE' }), successMessage || 'Đã xóa dữ liệu.');
}

window.addEventListener('unhandledrejection', (event) => {
  toast(event.reason?.message || 'Có lỗi xảy ra khi xử lý thao tác.');
});

function table(headers, rows) {
  if (!rows.length) return '<div class="empty">Chưa có dữ liệu phù hợp.</div>';
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function closeModal() {
  $('modal').hidden = true;
  $('modal').innerHTML = '';
}

function showModal(title, body, footer = '') {
  $('modal').hidden = false;
  $('modal').innerHTML = `
    <section class="modal-card">
      <header class="modal-head"><h3>${esc(title)}</h3><button class="close-x" onclick="closeModal()">×</button></header>
      <div class="modal-body">${body}</div>
      <footer class="modal-foot">${footer || '<button type="button" class="btn secondary" onclick="closeModal()">Đóng</button>'}</footer>
    </section>
  `;
}

function optionRows(items, idKey, textKey, selected = '') {
  return items.map((item) => `<option value="${esc(item[idKey])}" ${String(item[idKey]) === String(selected) ? 'selected' : ''}>${esc(item[textKey])}</option>`).join('');
}

window.closeModal = closeModal;
