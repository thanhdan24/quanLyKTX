'use strict';

async function renderManagerApps() {
  const lookups = await api('/api/lookups');
  const filters = filterValues('managerAppFilter');
  const [apps, rooms] = await Promise.all([api('/api/applications' + queryString(filters)), api('/api/rooms')]);
  const rows = apps.map((a) => `
    <tr>
      <td>#${a.ApplicationID}<br><span class="muted">${dt(a.SubmittedAt)}</span></td>
      <td>${esc(a.StudentName)}<br><span class="muted">${esc(a.StudentCode)} · ${esc(labels[a.Gender] || a.Gender)}</span></td>
      <td>${esc(a.PeriodName)}<br><span class="muted">${a.DurationMonths} tháng · muốn: ${esc(a.PreferredBuildingName || '—')}</span></td>
      <td>${badge(a.Status)}</td>
      <td>${esc(a.AssignedBuildingName || '—')} ${esc(a.RoomCode || '')}<br><span class="muted">${a.TotalAmount == null ? 'Chưa tính tiền' : money(a.TotalAmount)}</span></td>
      <td class="actions">
        ${a.Status === 'PENDING' ? `<button class="btn ok small" onclick="decideApp(${a.ApplicationID}, 'APPROVED')">Duyệt</button><button class="btn danger small" onclick="decideApp(${a.ApplicationID}, 'REJECTED')">Từ chối</button>` : ''}
        ${a.Status === 'APPROVED' ? `<button class="btn primary small" onclick='openAssignRoom(${JSON.stringify(a).replace(/'/g, '&#39;')})'>Phân phòng</button>` : ''}
      </td>
    </tr>
  `);
  window._rooms = rooms;
  content.innerHTML = `
    <section class="card">
      <h3>Phiếu xử lý hồ sơ / phân phòng</h3>
      <form id="managerAppFilter" class="filter-row">
        <input name="keyword" placeholder="Tên SV / Mã SV / phòng / tòa">
        <select name="status"><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ xử lý</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option><option value="CHECKED_IN">Đã nhận phòng</option><option value="CHECKED_OUT">Đã trả phòng</option></select>
        <select name="periodId"><option value="">Tất cả đợt</option>${optionRows(lookups.RegistrationPeriods, 'PeriodID', 'PeriodName')}</select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      ${table(['Mã', 'Sinh viên', 'Đợt', 'Trạng thái', 'Phòng/Tiền', 'Thao tác'], rows)}
    </section>`;
  $('managerAppFilter').onsubmit = async (event) => { event.preventDefault(); await renderManagerApps(); };
}

async function decideApp(id, status) {
  const note = prompt(status === 'APPROVED' ? 'Ghi chú duyệt hồ sơ:' : 'Lý do từ chối hồ sơ:', status === 'APPROVED' ? 'Hồ sơ hợp lệ' : 'Hồ sơ chưa đủ điều kiện');
  if (note === null) return;
  await runAction(() => api(`/api/applications/${id}/decision`, { method: 'POST', body: JSON.stringify({ Status: status, Note: note }) }), status === 'APPROVED' ? 'Đã duyệt hồ sơ.' : 'Đã từ chối hồ sơ.');
}

function openAssignRoom(appRow) {
  const rooms = (window._rooms || []).filter((r) => {
    const sameGender = [r.GenderScope, r.BuildingGenderScope || r.GenderScope].every((scope) => scope === 'ALL' || scope === appRow.Gender || appRow.Gender === 'OTHER');
    const hasBed = Number(r.Capacity) - Number(r.UsedBeds || 0) > 0;
    return r.RoomStatus === 'AVAILABLE' && sameGender && hasBed;
  });
  showModal('Phân phòng cho hồ sơ #' + appRow.ApplicationID, `
    <form id="assignRoomForm" class="form-stack">
      <p class="muted">Chỉ hiển thị phòng AVAILABLE, còn chỗ và phù hợp giới tính sinh viên theo QĐ03. Tổng tiền sẽ tính theo QĐ04.</p>
      <label>Phòng còn trống<select name="RoomID" required>
        ${rooms.map((r) => `<option value="${r.RoomID}">${esc(r.BuildingName)} / ${esc(r.RoomCode)} - ${esc(labels[r.GenderScope] || r.GenderScope)} - còn ${Number(r.Capacity) - Number(r.UsedBeds || 0)}/${r.Capacity} - ${money(r.PricePerMonth)}/tháng${String(r.BuildingID) === String(appRow.PreferredBuildingID) ? ' - đúng tòa mong muốn' : ''}</option>`).join('')}
      </select></label>
      <label>Ghi chú<input name="Note" value="Phân phòng theo hồ sơ đã duyệt"></label>
    </form>
  `, `<button type="button" class="btn secondary" onclick="closeModal()">Hủy</button><button type="button" class="btn primary" ${rooms.length ? '' : 'disabled'} onclick="submitAssignRoom(${appRow.ApplicationID})">Lưu phân phòng</button>`);
}

async function submitAssignRoom(id) {
  const form = validForm('assignRoomForm');
  if (!form) return;
  const payload = formData(form);
  await runAction(() => api(`/api/applications/${id}/assign-room`, { method: 'POST', body: JSON.stringify(payload) }), 'Đã phân phòng và tính tiền.');
}

async function renderManagerCheckin() {
  const apps = await api('/api/applications');
  const rows = apps.filter((a) => ['APPROVED', 'CHECKED_IN'].includes(a.Status)).map((a) => `
    <tr>
      <td>#${a.ApplicationID}</td><td>${esc(a.StudentName)}<br><span class="muted">${esc(a.StudentCode)}</span></td>
      <td>${esc(a.AssignedBuildingName || '—')} ${esc(a.RoomCode || '')}</td>
      <td>${money(a.TotalAmount || 0)}<br><span class="muted">Đã thu: ${money(a.ConfirmedAmount || 0)} · Nợ: ${money(a.DebtAmount || 0)}</span></td>
      <td>${badge(a.Status)}</td>
      <td class="actions">
        ${a.Status === 'APPROVED' ? `<button class="btn ok small" onclick="checkIn(${a.ApplicationID})">Xác nhận nhận phòng</button>` : ''}
        ${a.Status === 'CHECKED_IN' ? `<button class="btn warn small" onclick="checkOut(${a.ApplicationID})">Xác nhận trả phòng</button>` : ''}
      </td>
    </tr>
  `);
  content.innerHTML = `<section class="card"><h3>Phiếu nhận phòng / trả phòng</h3>${table(['Mã', 'Sinh viên', 'Phòng', 'Tài chính', 'Trạng thái', 'Thao tác'], rows)}</section>`;
}

async function checkIn(id) {
  if (!confirm('Xác nhận sinh viên đã nhận phòng? Hệ thống sẽ kiểm tra đã thanh toán đủ.')) return;
  await runAction(() => api(`/api/applications/${id}/check-in`, { method: 'POST', body: JSON.stringify({ CheckInDate: today() }) }), 'Đã xác nhận nhận phòng.');
}

async function checkOut(id) {
  if (!confirm('Xác nhận sinh viên trả phòng?')) return;
  await runAction(() => api(`/api/applications/${id}/check-out`, { method: 'POST', body: JSON.stringify({ CheckOutDate: today() }) }), 'Đã xác nhận trả phòng.');
}

async function renderManagerRequests() {
  const filters = filterValues('managerRequestFilter');
  const requests = await api('/api/requests' + queryString(filters));
  const rows = requests.map((r) => `
    <tr>
      <td>#${r.RequestID}</td><td>${esc(r.StudentName)}<br><span class="muted">${esc(r.StudentCode)}</span></td>
      <td>${esc(requestLabels[r.RequestType] || r.RequestType)}</td><td>${esc(r.Title)}<br><span class="muted">${esc(r.Content || '')}</span></td>
      <td>${badge(r.Status)}</td><td>${esc(r.ResultNote || '')}</td>
      <td class="actions">${['PENDING', 'APPROVED'].includes(r.Status) ? `<button class="btn ok small" onclick="processRequest(${r.RequestID}, 'APPROVED')">Chấp nhận</button><button class="btn danger small" onclick="processRequest(${r.RequestID}, 'REJECTED')">Từ chối</button><button class="btn primary small" onclick="processRequest(${r.RequestID}, 'DONE')">Hoàn tất</button>` : ''}</td>
    </tr>
  `);
  content.innerHTML = `
    <section class="card">
      <h3>Xử lý yêu cầu phát sinh</h3>
      <form id="managerRequestFilter" class="filter-row">
        <input name="keyword" placeholder="Tên SV / Mã SV / tiêu đề">
        <select name="type"><option value="">Tất cả loại</option><option value="EXTEND">Gia hạn</option><option value="TRANSFER">Chuyển phòng</option><option value="CHECKOUT">Trả phòng</option><option value="INCIDENT">Sự cố</option><option value="FEEDBACK">Phản ánh</option></select>
        <select name="status"><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ xử lý</option><option value="APPROVED">Đã chấp nhận</option><option value="REJECTED">Từ chối</option><option value="DONE">Hoàn tất</option></select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      ${table(['Mã', 'Sinh viên', 'Loại', 'Nội dung', 'Trạng thái', 'Kết quả', 'Thao tác'], rows)}
    </section>`;
  $('managerRequestFilter').onsubmit = async (event) => { event.preventDefault(); await renderManagerRequests(); };
}

async function processRequest(id, status) {
  const ResultNote = prompt('Ghi chú kết quả xử lý:', status === 'DONE' ? 'Đã xử lý xong' : 'Đã cập nhật theo quy định');
  if (ResultNote === null) return;
  await runAction(() => api(`/api/requests/${id}/process`, { method: 'POST', body: JSON.stringify({ Status: status, ResultNote }) }), 'Đã cập nhật yêu cầu.');
}

async function renderResidenceReport() {
  const lookups = await api('/api/lookups');
  const filters = filterValues('residenceFilter');
  const data = await api('/api/reports/residence' + queryString(filters));
  const rowsData = Array.isArray(data) ? data : data.rooms;
  const summary = Array.isArray(data) ? {} : (data.summary || {});
  const rows = rowsData.map((r) => `<tr><td>${esc(r.BuildingName)}</td><td>${esc(r.RoomCode)}</td><td>${r.Capacity}</td><td>${r.UsedBeds}</td><td>${r.AvailableBeds}</td><td>${badge(r.RoomStatus)}</td></tr>`);
  content.innerHTML = `
    <section class="card">
      <h3>Báo cáo cư trú</h3>
      <form id="residenceFilter" class="filter-row">
        <select name="periodId"><option value="">Tất cả đợt</option>${optionRows(lookups.RegistrationPeriods, 'PeriodID', 'PeriodName')}</select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      <div class="grid four">
        <div class="stat-card"><span>Tổng hồ sơ</span><strong>${summary.TotalApplications ?? 0}</strong></div>
        <div class="stat-card"><span>Đã duyệt</span><strong>${summary.ApprovedApplications ?? 0}</strong></div>
        <div class="stat-card"><span>Đã nhận phòng</span><strong>${summary.CheckedInApplications ?? 0}</strong></div>
        <div class="stat-card"><span>Đang chờ</span><strong>${summary.PendingApplications ?? 0}</strong></div>
      </div>
      ${table(['Tòa nhà', 'Phòng', 'Sức chứa', 'Đang ở/đã gán', 'Còn chỗ', 'Trạng thái'], rows)}
    </section>`;
  $('residenceFilter').onsubmit = async (event) => { event.preventDefault(); await renderResidenceReport(); };
}

window.decideApp = decideApp;
window.openAssignRoom = openAssignRoom;
window.submitAssignRoom = submitAssignRoom;
window.checkIn = checkIn;
window.checkOut = checkOut;
window.processRequest = processRequest;

