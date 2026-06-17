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
    ['dashboard', 'Tổng quan'],
    ['student-profile', 'Hồ sơ sinh viên'],
    ['student-register', 'Đăng ký ở KTX'],
    ['student-apps', 'Theo dõi hồ sơ'],
    ['student-payments', 'Thanh toán'],
    ['student-requests', 'Yêu cầu phát sinh']
  ],
  MANAGER: [
    ['dashboard', 'Tổng quan'],
    ['manager-apps', 'Duyệt và phân phòng'],
    ['manager-checkin', 'Nhận / trả phòng'],
    ['manager-requests', 'Xử lý yêu cầu'],
    ['manager-residence-report', 'Báo cáo cư trú']
  ],
  ACCOUNTANT: [
    ['dashboard', 'Tổng quan'],
    ['accountant-payments', 'Xác nhận thanh toán'],
    ['accountant-debts', 'Theo dõi công nợ'],
    ['accountant-fee-report', 'Báo cáo thu phí']
  ],
  ADMIN: [
    ['dashboard', 'Tổng quan'],
    ['admin-users', 'Tài khoản'],
    ['admin-students', 'Sinh viên'],
    ['admin-buildings', 'Tòa nhà'],
    ['admin-rooms', 'Phòng'],
    ['admin-periods', 'Đợt đăng ký']
  ]
};

const menuIconPaths = {
  dashboard: '<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/>',
  'student-profile': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'student-register': '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 12h6M9 16h4"/>',
  'student-apps': '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  'student-payments': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>',
  'student-requests': '<path d="M4 5h16v12H8l-4 4z"/><path d="M8 9h8M8 13h5"/>',
  'manager-apps': '<path d="M7 3h10v4H7z"/><path d="M5 5H4v16h16V5h-1M8 12l2 2 5-5M8 18h8"/>',
  'manager-checkin': '<path d="M3 18v-8h18v8M5 10V5h6v5M13 10V7h6v3M3 18h18M5 18v3M19 18v3"/>',
  'manager-requests': '<path d="m14.7 6.3 3 3M5 19l4.5-1 8.2-8.2a2.1 2.1 0 0 0-3-3L6.5 15z"/><path d="M13 5 9 3 4 5v6c0 2.5 1.2 4.5 3 6"/>',
  'manager-residence-report': '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  'accountant-payments': '<path d="M3 7h18v13H3zM3 11h18M7 16h4"/><path d="M17 4v6M14 7h6"/>',
  'accountant-debts': '<path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/><circle cx="17.5" cy="17.5" r="3.5"/><path d="M17.5 15.5v2.3l1.4.8"/>',
  'accountant-fee-report': '<path d="M4 20V9M10 20V4M16 20v-8M22 20H2"/><path d="m4 7 6-4 6 6 5-5"/>',
  'admin-users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M16 11h6"/>',
  'admin-students': '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
  'admin-buildings': '<path d="M4 21V8l8-5 8 5v13M8 21v-5h8v5M8 10h2M14 10h2M8 13h2M14 13h2"/>',
  'admin-rooms': '<path d="M4 21V3h12v18M16 7h4v14M8 12h.01M2 21h20"/>',
  'admin-periods': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>'
};

function menuIcon(view) {
  const path = menuIconPaths[view] || menuIconPaths.dashboard;
  return `<span class="menu-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg></span>`;
}

const titles = Object.fromEntries(Object.values(menus).flat().map(([k, v]) => [k, v]));
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

