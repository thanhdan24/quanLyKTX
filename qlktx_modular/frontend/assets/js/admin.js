'use strict';

async function renderUsers() {
  const users = await api('/api/users');
  const rows = users.map((u) => `
    <tr><td>#${u.UserID}</td><td>${esc(u.Username)}</td><td>${esc(u.FullName)}</td><td>${esc(roleNames[u.Role] || u.Role)}</td><td>${esc(u.Email || '')}<br><span class="muted">${esc(u.Phone || '')}</span></td><td>${badge(u.Status)}</td><td><button class="btn secondary small" onclick='openUserForm(${JSON.stringify(u).replace(/'/g, '&#39;')})'>Sửa</button> <button class="btn danger small" onclick="deleteUser(${u.UserID})">Xóa/khóa</button></td></tr>
  `);
  content.innerHTML = `<section class="card"><div class="toolbar"><h3>BM11 - Tài khoản người dùng</h3><button class="btn primary" onclick="openUserForm()">Thêm tài khoản</button></div>${table(['Mã', 'Username', 'Họ tên', 'Vai trò', 'Liên hệ', 'Trạng thái', 'Thao tác'], rows)}</section>`;
}

function openUserForm(user = null) {
  showModal(user ? 'Cập nhật tài khoản' : 'Thêm tài khoản', `
    <form id="userForm" class="form-grid">
      <label>Tên đăng nhập<input name="Username" value="${esc(user?.Username || '')}" ${user ? 'disabled' : 'required'}></label>
      <label>Họ tên<input name="FullName" value="${esc(user?.FullName || '')}" required></label>
      <label>Mật khẩu ${user ? 'mới nếu cần đổi' : ''}<input name="Password" type="password" ${user ? '' : 'required'}></label>
      <label>Vai trò<select name="Role"><option value="STUDENT" ${user?.Role === 'STUDENT' ? 'selected' : ''}>Sinh viên</option><option value="MANAGER" ${user?.Role === 'MANAGER' ? 'selected' : ''}>Quản lý</option><option value="ACCOUNTANT" ${user?.Role === 'ACCOUNTANT' ? 'selected' : ''}>Kế toán</option><option value="ADMIN" ${user?.Role === 'ADMIN' ? 'selected' : ''}>Admin</option></select></label>
      <label>Email<input name="Email" value="${esc(user?.Email || '')}"></label>
      <label>Số điện thoại<input name="Phone" value="${esc(user?.Phone || '')}"></label>
      <label>Trạng thái<select name="Status"><option value="ACTIVE" ${user?.Status === 'ACTIVE' ? 'selected' : ''}>Hoạt động</option><option value="INACTIVE" ${user?.Status === 'INACTIVE' ? 'selected' : ''}>Ngừng hoạt động</option><option value="LOCKED" ${user?.Status === 'LOCKED' ? 'selected' : ''}>Khóa</option></select></label>
      ${user ? '' : `<div class="form-grid full" id="newStudentFields"><label>Mã sinh viên khi tạo tài khoản STUDENT<input name="StudentCode" placeholder="VD: SV004"></label><label>Giới tính sinh viên<select name="Gender"><option value="MALE">Nam</option><option value="FEMALE">Nữ</option><option value="OTHER">Khác</option></select></label><label>Ngày sinh<input type="date" name="DateOfBirth"></label><label>Khoa<input name="Faculty"></label><label>Lớp<input name="ClassName"></label></div>`}
    </form>
  `, `<button type="button" class="btn secondary" onclick="closeModal()">Hủy</button><button type="button" class="btn primary" onclick="submitUser(${user?.UserID || 'null'})">Lưu</button>`);
}

async function submitUser(id) {
  const form = validForm('userForm');
  if (!form) return;
  const payload = formData(form);
  await runAction(() => id
    ? api(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    : api('/api/users', { method: 'POST', body: JSON.stringify(payload) }), 'Đã lưu tài khoản.');
}

async function deleteUser(id) {
  await deleteRecord(`/api/users/${id}`, 'Bạn chắc chắn muốn xóa hoặc khóa tài khoản này?', 'Đã xử lý tài khoản.');
}

async function renderStudents() {
  const [students, users] = await Promise.all([api('/api/students'), api('/api/users')]);
  window._studentUsers = users.filter((u) => u.Role === 'STUDENT');
  const rows = students.map((s) => `
    <tr><td>#${s.StudentID}</td><td>${esc(s.StudentCode)}</td><td>${esc(s.FullName)}<br><span class="muted">${esc(s.Username)}</span></td><td>${esc(labels[s.Gender] || s.Gender || '—')}</td><td>${esc(s.Faculty || '')}<br><span class="muted">${esc(s.ClassName || '')}</span></td><td>${badge(s.Status)}</td><td><button class="btn secondary small" onclick='openStudentForm(${JSON.stringify(s).replace(/'/g, '&#39;')})'>Sửa</button> <button class="btn danger small" onclick="deleteStudent(${s.StudentID})">Xóa</button></td></tr>
  `);
  content.innerHTML = `<section class="card"><div class="toolbar"><h3>BM01 - Quản lý sinh viên</h3><button class="btn primary" onclick="openStudentForm()">Thêm hồ sơ</button></div>${table(['Mã', 'Mã SV', 'Tài khoản', 'Giới tính', 'Khoa/Lớp', 'Trạng thái', 'Thao tác'], rows)}</section>`;
}

function openStudentForm(student = null) {
  const users = window._studentUsers || [];
  showModal(student ? 'Cập nhật sinh viên' : 'Thêm hồ sơ sinh viên', `
    <form id="studentAdminForm" class="form-grid">
      <label>Tài khoản sinh viên<select name="UserID" ${student ? 'disabled' : ''}>${optionRows(users, 'UserID', 'FullName', student?.UserID)}</select></label>
      <label>Mã sinh viên<input name="StudentCode" value="${esc(student?.StudentCode || '')}" required></label>
      <label>Giới tính<select name="Gender"><option value="MALE" ${student?.Gender === 'MALE' ? 'selected' : ''}>Nam</option><option value="FEMALE" ${student?.Gender === 'FEMALE' ? 'selected' : ''}>Nữ</option><option value="OTHER" ${student?.Gender === 'OTHER' ? 'selected' : ''}>Khác</option></select></label>
      <label>Ngày sinh<input type="date" name="DateOfBirth" value="${esc((student?.DateOfBirth || '').slice(0, 10))}"></label>
      <label>Khoa<input name="Faculty" value="${esc(student?.Faculty || '')}"></label>
      <label>Lớp<input name="ClassName" value="${esc(student?.ClassName || '')}"></label>
      <label>Trạng thái<select name="Status"><option value="ACTIVE" ${student?.Status === 'ACTIVE' ? 'selected' : ''}>Hoạt động</option><option value="INACTIVE" ${student?.Status === 'INACTIVE' ? 'selected' : ''}>Ngừng hoạt động</option></select></label>
    </form>
  `, `<button type="button" class="btn secondary" onclick="closeModal()">Hủy</button><button type="button" class="btn primary" onclick="submitStudent(${student?.StudentID || 'null'})">Lưu</button>`);
}

async function submitStudent(id) {
  const form = validForm('studentAdminForm');
  if (!form) return;
  const payload = formData(form);
  await runAction(() => id
    ? api(`/api/students/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    : api('/api/students', { method: 'POST', body: JSON.stringify(payload) }), 'Đã lưu sinh viên.');
}

async function deleteStudent(id) {
  await deleteRecord(`/api/students/${id}`, 'Bạn chắc chắn muốn xóa hồ sơ sinh viên này?', 'Đã xử lý hồ sơ sinh viên.');
}

async function renderBuildings() {
  const rowsData = await api('/api/buildings');
  const rows = rowsData.map((b) => `<tr><td>#${b.BuildingID}</td><td>${esc(b.BuildingName)}</td><td>${esc(labels[b.GenderScope] || b.GenderScope)}</td><td>${esc(b.Notes || '')}</td><td><button class="btn secondary small" onclick='openBuildingForm(${JSON.stringify(b).replace(/'/g, '&#39;')})'>Sửa</button> <button class="btn danger small" onclick="deleteBuilding(${b.BuildingID})">Xóa</button></td></tr>`);
  content.innerHTML = `<section class="card"><div class="toolbar"><h3>BM12 - Danh mục tòa nhà</h3><button class="btn primary" onclick="openBuildingForm()">Thêm tòa nhà</button></div>${table(['Mã', 'Tên tòa', 'Phạm vi giới tính', 'Ghi chú', 'Thao tác'], rows)}</section>`;
}

function openBuildingForm(b = null) {
  showModal(b ? 'Cập nhật tòa nhà' : 'Thêm tòa nhà', `<form id="buildingForm" class="form-grid"><label>Tên tòa nhà<input name="BuildingName" value="${esc(b?.BuildingName || '')}" required></label><label>Phạm vi giới tính<select name="GenderScope"><option value="ALL" ${b?.GenderScope === 'ALL' ? 'selected' : ''}>Tất cả</option><option value="MALE" ${b?.GenderScope === 'MALE' ? 'selected' : ''}>Nam</option><option value="FEMALE" ${b?.GenderScope === 'FEMALE' ? 'selected' : ''}>Nữ</option></select></label><label>Ghi chú<input name="Notes" value="${esc(b?.Notes || '')}"></label></form>`, `<button type="button" class="btn secondary" onclick="closeModal()">Hủy</button><button type="button" class="btn primary" onclick="submitBuilding(${b?.BuildingID || 'null'})">Lưu</button>`);
}

async function submitBuilding(id) {
  const form = validForm('buildingForm');
  if (!form) return;
  const payload = formData(form);
  await runAction(() => id
    ? api(`/api/buildings/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    : api('/api/buildings', { method: 'POST', body: JSON.stringify(payload) }), 'Đã lưu tòa nhà.');
}

async function deleteBuilding(id) {
  await deleteRecord(`/api/buildings/${id}`, 'Bạn chắc chắn muốn xóa tòa nhà này?', 'Đã xóa tòa nhà.');
}

async function renderRooms() {
  const [rooms, buildings] = await Promise.all([api('/api/rooms'), api('/api/buildings')]);
  window._buildings = buildings;
  const rows = rooms.map((r) => `<tr><td>#${r.RoomID}</td><td>${esc(r.BuildingName)} / ${esc(r.RoomCode)}</td><td>${r.FloorNo || '—'}</td><td>${r.UsedBeds || 0}/${r.Capacity}</td><td>${money(r.PricePerMonth)}</td><td>${esc(labels[r.GenderScope] || r.GenderScope)}</td><td>${badge(r.RoomStatus)}</td><td><button class="btn secondary small" onclick='openRoomForm(${JSON.stringify(r).replace(/'/g, '&#39;')})'>Sửa</button> <button class="btn danger small" onclick="deleteRoom(${r.RoomID})">Xóa</button></td></tr>`);
  content.innerHTML = `<section class="card"><div class="toolbar"><h3>BM12 - Danh mục phòng</h3><button class="btn primary" onclick="openRoomForm()">Thêm phòng</button></div>${table(['Mã', 'Phòng', 'Tầng', 'Đang ở/Sức chứa', 'Đơn giá', 'Giới tính', 'Trạng thái', 'Thao tác'], rows)}</section>`;
}

function openRoomForm(r = null) {
  const buildings = window._buildings || [];
  showModal(r ? 'Cập nhật phòng' : 'Thêm phòng', `
    <form id="roomForm" class="form-grid">
      <label>Tòa nhà<select name="BuildingID">${optionRows(buildings, 'BuildingID', 'BuildingName', r?.BuildingID)}</select></label>
      <label>Mã phòng<input name="RoomCode" value="${esc(r?.RoomCode || '')}" required></label>
      <label>Tầng<input type="number" name="FloorNo" value="${esc(r?.FloorNo || '')}"></label>
      <label>Sức chứa<input type="number" min="1" name="Capacity" value="${esc(r?.Capacity || 4)}" required></label>
      <label>Đơn giá/tháng<input type="number" min="0" name="PricePerMonth" value="${esc(r?.PricePerMonth || 0)}" required></label>
      <label>Giới tính<select name="GenderScope"><option value="ALL" ${r?.GenderScope === 'ALL' ? 'selected' : ''}>Tất cả</option><option value="MALE" ${r?.GenderScope === 'MALE' ? 'selected' : ''}>Nam</option><option value="FEMALE" ${r?.GenderScope === 'FEMALE' ? 'selected' : ''}>Nữ</option></select></label>
      <label>Trạng thái<select name="RoomStatus"><option value="AVAILABLE" ${r?.RoomStatus === 'AVAILABLE' ? 'selected' : ''}>Còn chỗ</option><option value="FULL" ${r?.RoomStatus === 'FULL' ? 'selected' : ''}>Đầy</option><option value="MAINTENANCE" ${r?.RoomStatus === 'MAINTENANCE' ? 'selected' : ''}>Bảo trì</option><option value="INACTIVE" ${r?.RoomStatus === 'INACTIVE' ? 'selected' : ''}>Ngừng dùng</option></select></label>
      <label>Ghi chú<input name="Notes" value="${esc(r?.Notes || '')}"></label>
    </form>
  `, `<button type="button" class="btn secondary" onclick="closeModal()">Hủy</button><button type="button" class="btn primary" onclick="submitRoom(${r?.RoomID || 'null'})">Lưu</button>`);
}

async function submitRoom(id) {
  const form = validForm('roomForm');
  if (!form) return;
  const payload = formData(form);
  await runAction(() => id
    ? api(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    : api('/api/rooms', { method: 'POST', body: JSON.stringify(payload) }), 'Đã lưu phòng.');
}

async function deleteRoom(id) {
  await deleteRecord(`/api/rooms/${id}`, 'Bạn chắc chắn muốn xóa hoặc ngừng dùng phòng này?', 'Đã xử lý phòng.');
}

async function renderPeriods() {
  const rowsData = await api('/api/periods');
  const rows = rowsData.map((p) => `<tr><td>#${p.PeriodID}</td><td>${esc(p.PeriodName)}</td><td>${date(p.StartDate)} - ${date(p.EndDate)}</td><td>${badge(p.Status)}</td><td>${esc(p.Notes || '')}</td><td><button class="btn secondary small" onclick='openPeriodForm(${JSON.stringify(p).replace(/'/g, '&#39;')})'>Sửa</button> <button class="btn danger small" onclick="deletePeriod(${p.PeriodID})">Xóa/đóng</button></td></tr>`);
  content.innerHTML = `<section class="card"><div class="toolbar"><h3>BM12 - Đợt đăng ký</h3><button class="btn primary" onclick="openPeriodForm()">Thêm đợt</button></div>${table(['Mã', 'Tên đợt', 'Thời gian', 'Trạng thái', 'Ghi chú', 'Thao tác'], rows)}</section>`;
}

function openPeriodForm(p = null) {
  showModal(p ? 'Cập nhật đợt đăng ký' : 'Thêm đợt đăng ký', `
    <form id="periodForm" class="form-grid">
      <label>Tên đợt<input name="PeriodName" value="${esc(p?.PeriodName || '')}" required></label>
      <label>Bắt đầu<input type="date" name="StartDate" value="${esc((p?.StartDate || '').slice(0, 10))}" required></label>
      <label>Kết thúc<input type="date" name="EndDate" value="${esc((p?.EndDate || '').slice(0, 10))}" required></label>
      <label>Trạng thái<select name="Status"><option value="DRAFT" ${p?.Status === 'DRAFT' ? 'selected' : ''}>Nháp</option><option value="OPEN" ${p?.Status === 'OPEN' ? 'selected' : ''}>Đang mở</option><option value="CLOSED" ${p?.Status === 'CLOSED' ? 'selected' : ''}>Đã đóng</option></select></label>
      <label>Ghi chú<input name="Notes" value="${esc(p?.Notes || '')}"></label>
    </form>
  `, `<button type="button" class="btn secondary" onclick="closeModal()">Hủy</button><button type="button" class="btn primary" onclick="submitPeriod(${p?.PeriodID || 'null'})">Lưu</button>`);
}

async function submitPeriod(id) {
  const form = validForm('periodForm');
  if (!form) return;
  const payload = formData(form);
  await runAction(() => id
    ? api(`/api/periods/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
    : api('/api/periods', { method: 'POST', body: JSON.stringify(payload) }), 'Đã lưu đợt đăng ký.');
}

async function deletePeriod(id) {
  await deleteRecord(`/api/periods/${id}`, 'Bạn chắc chắn muốn xóa hoặc đóng đợt đăng ký này?', 'Đã xử lý đợt đăng ký.');
}

window.openUserForm = openUserForm;
window.submitUser = submitUser;
window.deleteUser = deleteUser;
window.openStudentForm = openStudentForm;
window.submitStudent = submitStudent;
window.deleteStudent = deleteStudent;
window.openBuildingForm = openBuildingForm;
window.submitBuilding = submitBuilding;
window.deleteBuilding = deleteBuilding;
window.openRoomForm = openRoomForm;
window.submitRoom = submitRoom;
window.deleteRoom = deleteRoom;
window.openPeriodForm = openPeriodForm;
window.submitPeriod = submitPeriod;
window.deletePeriod = deletePeriod;
