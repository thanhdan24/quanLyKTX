'use strict';

async function renderStudentProfile() {
  const s = await api('/api/me/student');
  content.innerHTML = `
    <section class="card">
      <h3>BM01 - Hồ sơ sinh viên</h3>
      <form id="studentProfileForm" class="form-grid">
        <label>Họ và tên<input name="FullName" value="${esc(s.FullName)}" required></label>
        <label>Mã sinh viên<input value="${esc(s.StudentCode)}" disabled></label>
        <label>Giới tính<select name="Gender"><option value="MALE" ${s.Gender === 'MALE' ? 'selected' : ''}>Nam</option><option value="FEMALE" ${s.Gender === 'FEMALE' ? 'selected' : ''}>Nữ</option><option value="OTHER" ${s.Gender === 'OTHER' ? 'selected' : ''}>Khác</option></select></label>
        <label>Ngày sinh<input type="date" name="DateOfBirth" value="${esc((s.DateOfBirth || '').slice(0, 10))}"></label>
        <label>Khoa<input name="Faculty" value="${esc(s.Faculty || '')}"></label>
        <label>Lớp<input name="ClassName" value="${esc(s.ClassName || '')}"></label>
        <label>Số điện thoại<input name="Phone" value="${esc(s.Phone || '')}"></label>
        <label>Email<input name="Email" value="${esc(s.Email || '')}"></label>
        <div class="actions"><button class="btn primary" type="submit">Lưu hồ sơ</button></div>
      </form>
    </section>
  `;
  $('studentProfileForm').onsubmit = async (event) => {
    event.preventDefault();
    await runAction(() => api('/api/me/student', { method: 'PUT', body: JSON.stringify(formData(event.target)) }), 'Đã cập nhật hồ sơ.');
  };
}

async function renderStudentRegister() {
  const lookups = await api('/api/lookups');
  const openPeriods = lookups.RegistrationPeriods.filter((p) => p.Status === 'OPEN');
  content.innerHTML = `
    <section class="card">
      <h3>BM02 - Phiếu đăng ký ở ký túc xá</h3>
      ${openPeriods.length ? '' : '<p class="warn-text">Hiện chưa có đợt đăng ký đang mở. Sinh viên chỉ nộp hồ sơ khi đợt đăng ký OPEN và còn trong thời gian cho phép.</p>'}
      <form id="applicationForm" class="form-grid">
        <label>Đợt đăng ký<select name="PeriodID" required>${optionRows(openPeriods, 'PeriodID', 'PeriodName')}</select></label>
        <label>Tòa nhà mong muốn<select name="PreferredBuildingID" required><option value="">-- Chọn tòa nhà --</option>${optionRows(lookups.Buildings, 'BuildingID', 'BuildingName')}</select></label>
        <label>Số tháng đăng ký<input type="number" min="1" name="DurationMonths" value="6" required></label>
        <label>Đường dẫn tệp đính kèm<input name="AttachmentUrl" placeholder="https://... hoặc để trống"></label>
        <div class="actions"><button class="btn primary" ${openPeriods.length ? '' : 'disabled'} type="submit">Gửi hồ sơ</button></div>
      </form>
    </section>
  `;
  $('applicationForm').onsubmit = async (event) => {
    event.preventDefault();
    await runAction(() => api('/api/applications', { method: 'POST', body: JSON.stringify(formData(event.target)) }), 'Đã gửi hồ sơ đăng ký.', 'student-apps');
  };
}

async function renderApplications() {
  const lookups = await api('/api/lookups');
  const filters = currentUser.Role === 'STUDENT' ? filterValues('studentAppFilter') : {};
  const apps = await api('/api/applications' + queryString(filters));
  const rows = apps.map((a) => `
    <tr>
      <td>#${a.ApplicationID}</td>
      <td>${esc(a.PeriodName)}<br><span class="muted">Nộp: ${dt(a.SubmittedAt)}</span></td>
      <td>${esc(a.PreferredBuildingName || '—')}</td>
      <td>${a.DurationMonths} tháng</td>
      <td>${badge(a.Status)}</td>
      <td>${esc(a.AssignedBuildingName || '—')} ${esc(a.RoomCode || '')}</td>
      <td>${a.TotalAmount == null ? '—' : money(a.TotalAmount)}<br><span class="muted">Đã xác nhận: ${money(a.ConfirmedAmount || 0)} · Còn nợ: ${a.DebtAmount == null ? '—' : money(a.DebtAmount)}</span></td>
      <td>${esc(a.Note || '')}</td>
    </tr>
  `);
  content.innerHTML = `
    <section class="card">
      <h3>BM06 - Danh sách hồ sơ đăng ký</h3>
      <form id="studentAppFilter" class="filter-row">
        <select name="status"><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ xử lý</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option><option value="CHECKED_IN">Đã nhận phòng</option><option value="CHECKED_OUT">Đã trả phòng</option></select>
        <select name="periodId"><option value="">Tất cả đợt</option>${optionRows(lookups.RegistrationPeriods, 'PeriodID', 'PeriodName')}</select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      ${table(['Mã', 'Đợt', 'Tòa mong muốn', 'Thời gian', 'Trạng thái', 'Phòng', 'Tài chính', 'Ghi chú'], rows)}
    </section>`;
  $('studentAppFilter').onsubmit = async (event) => { event.preventDefault(); await renderApplications(); };
}

async function renderStudentPayments() {
  const [apps, payments] = await Promise.all([api('/api/applications'), api('/api/payments')]);
  const payable = apps.filter((a) => a.TotalAmount != null && ['APPROVED', 'CHECKED_IN'].includes(a.Status));
  const rows = payments.map((p) => `
    <tr><td>#${p.PaymentID}</td><td>Hồ sơ #${p.ApplicationID}</td><td>${money(p.Amount)}</td><td>${esc(labels[p.PaymentMethod] || p.PaymentMethod)}</td><td>${esc(p.TransactionCode || '—')}</td><td>${badge(p.PaymentStatus)}</td><td>${dt(p.PaidAt)}</td><td>${esc(p.Note || '')}</td></tr>
  `);
  content.innerHTML = `
    <section class="card">
      <h3>BM03 - Gửi thông tin thanh toán</h3>
      ${payable.length ? '' : '<p class="muted">Chỉ thanh toán khi hồ sơ đã được duyệt, đã phân phòng và đã có tổng tiền.</p>'}
      <form id="paymentForm" class="form-grid">
        <label>Hồ sơ<select name="ApplicationID" required>${payable.map((a) => `<option value="${a.ApplicationID}">#${a.ApplicationID} - ${esc(a.PeriodName)} - còn nợ ${money(a.DebtAmount || 0)}</option>`).join('')}</select></label>
        <label>Số tiền<input name="Amount" type="number" min="1" required></label>
        <label>Phương thức<select name="PaymentMethod"><option value="TRANSFER">Chuyển khoản</option><option value="CASH">Tiền mặt</option><option value="ONLINE">Trực tuyến</option></select></label>
        <label>Mã giao dịch<input name="TransactionCode" placeholder="Bắt buộc với chuyển khoản/trực tuyến"></label>
        <label>Ghi chú<input name="Note"></label>
        <div class="actions"><button class="btn primary" ${payable.length ? '' : 'disabled'} type="submit">Gửi thanh toán</button></div>
      </form>
    </section>
    <section class="card"><h3>Lịch sử thanh toán</h3>${table(['Mã', 'Hồ sơ', 'Số tiền', 'Phương thức', 'Mã GD', 'Trạng thái', 'Thời điểm', 'Ghi chú'], rows)}</section>
  `;
  $('paymentForm').onsubmit = async (event) => {
    event.preventDefault();
    await runAction(() => api('/api/payments', { method: 'POST', body: JSON.stringify(formData(event.target)) }), 'Đã gửi thanh toán.');
  };
}

async function renderStudentRequests() {
  const [apps, requests] = await Promise.all([api('/api/applications'), api('/api/requests')]);
  const activeApps = apps.filter((a) => ['APPROVED', 'CHECKED_IN'].includes(a.Status));
  const rows = requests.map((r) => `
    <tr><td>#${r.RequestID}</td><td>Hồ sơ #${r.ApplicationID}</td><td>${esc(requestLabels[r.RequestType] || r.RequestType)}</td><td>${esc(r.Title)}</td><td>${badge(r.Status)}</td><td>${dt(r.CreatedAt)}</td><td>${esc(r.ResultNote || '')}</td></tr>
  `);
  content.innerHTML = `
    <section class="card">
      <h3>BM05 - Phiếu yêu cầu phát sinh / phản ánh</h3>
      <form id="requestForm" class="form-grid">
        <label>Hồ sơ<select name="ApplicationID" required>${activeApps.map((a) => `<option value="${a.ApplicationID}">#${a.ApplicationID} - ${esc(a.PeriodName)} - ${esc(a.RoomCode || 'chưa có phòng')}</option>`).join('')}</select></label>
        <label>Loại yêu cầu<select name="RequestType"><option value="EXTEND">Gia hạn</option><option value="TRANSFER">Chuyển phòng</option><option value="CHECKOUT">Trả phòng</option><option value="INCIDENT">Sự cố</option><option value="FEEDBACK">Phản ánh</option></select></label>
        <label>Tiêu đề<input name="Title" required></label>
        <label>Nội dung<textarea name="Content" required></textarea></label>
        <div class="actions"><button class="btn primary" ${activeApps.length ? '' : 'disabled'} type="submit">Gửi yêu cầu</button></div>
      </form>
    </section>
    <section class="card"><h3>Yêu cầu đã gửi</h3>${table(['Mã', 'Hồ sơ', 'Loại', 'Tiêu đề', 'Trạng thái', 'Ngày tạo', 'Kết quả'], rows)}</section>
  `;
  $('requestForm').onsubmit = async (event) => {
    event.preventDefault();
    await runAction(() => api('/api/requests', { method: 'POST', body: JSON.stringify(formData(event.target)) }), 'Đã gửi yêu cầu.');
  };
}

