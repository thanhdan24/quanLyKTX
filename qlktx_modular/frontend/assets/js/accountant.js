'use strict';

async function renderAccountantPayments() {
  const filters = filterValues('accountantPaymentFilter');
  const payments = await api('/api/payments' + queryString(filters));
  const rows = payments.map((p) => `
    <tr>
      <td>#${p.PaymentID}</td><td>${esc(p.StudentName)}<br><span class="muted">${esc(p.StudentCode)} · Hồ sơ #${p.ApplicationID}</span></td>
      <td>${money(p.Amount)}</td><td>${esc(labels[p.PaymentMethod] || p.PaymentMethod)}</td><td>${esc(p.TransactionCode || '—')}</td>
      <td>${badge(p.PaymentStatus)}</td><td>${dt(p.PaidAt)}</td>
      <td class="actions">${p.PaymentStatus === 'PENDING' ? `<button class="btn ok small" onclick="confirmPayment(${p.PaymentID}, 'CONFIRMED')">Xác nhận</button><button class="btn danger small" onclick="confirmPayment(${p.PaymentID}, 'REJECTED')">Từ chối</button>` : ''}</td>
    </tr>
  `);
  content.innerHTML = `
    <section class="card">
      <h3>BM03 - Xác nhận thanh toán</h3>
      <form id="accountantPaymentFilter" class="filter-row">
        <input name="keyword" placeholder="Tên SV / Mã SV / mã giao dịch">
        <select name="status"><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="REJECTED">Từ chối</option></select>
        <select name="method"><option value="">Tất cả phương thức</option><option value="CASH">Tiền mặt</option><option value="TRANSFER">Chuyển khoản</option><option value="ONLINE">Trực tuyến</option></select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      ${table(['Mã', 'Sinh viên', 'Số tiền', 'Phương thức', 'Mã GD', 'Trạng thái', 'Thời điểm', 'Thao tác'], rows)}
    </section>`;
  $('accountantPaymentFilter').onsubmit = async (event) => { event.preventDefault(); await renderAccountantPayments(); };
}

async function confirmPayment(id, status) {
  const Note = prompt(status === 'CONFIRMED' ? 'Ghi chú xác nhận:' : 'Lý do từ chối:', status === 'CONFIRMED' ? 'Đã đối soát hợp lệ' : 'Giao dịch chưa hợp lệ');
  if (Note === null) return;
  await runAction(() => api(`/api/payments/${id}/confirm`, { method: 'POST', body: JSON.stringify({ PaymentStatus: status, Note }) }), status === 'CONFIRMED' ? 'Đã xác nhận thanh toán.' : 'Đã từ chối thanh toán.');
}

async function renderDebtReport() {
  const lookups = await api('/api/lookups');
  const filters = filterValues('debtFilter');
  const rowsData = await api('/api/reports/debts' + queryString(filters));
  const rows = rowsData.map((r) => `
    <tr><td>#${r.ApplicationID}</td><td>${esc(r.StudentName)}<br><span class="muted">${esc(r.StudentCode)}</span></td><td>${esc(r.PeriodName)}</td><td>${money(r.TotalAmount)}</td><td>${money(r.ConfirmedAmount)}</td><td>${money(r.DebtAmount)}</td><td>${badge(r.Status)}</td></tr>
  `);
  content.innerHTML = `
    <section class="card">
      <h3>BM09 - Danh sách công nợ</h3>
      <form id="debtFilter" class="filter-row">
        <input name="keyword" placeholder="Tên SV / Mã SV">
        <select name="periodId"><option value="">Tất cả đợt</option>${optionRows(lookups.RegistrationPeriods, 'PeriodID', 'PeriodName')}</select>
        <select name="debtStatus"><option value="">Tất cả</option><option value="DEBT">Còn nợ</option><option value="PAID">Đã đủ</option></select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      ${table(['Hồ sơ', 'Sinh viên', 'Đợt', 'Tổng tiền', 'Đã thu', 'Còn nợ', 'Trạng thái'], rows)}
    </section>`;
  $('debtFilter').onsubmit = async (event) => { event.preventDefault(); await renderDebtReport(); };
}

async function renderFeeReport() {
  const lookups = await api('/api/lookups');
  const filters = filterValues('feeFilter');
  const rowsData = await api('/api/reports/fees' + queryString(filters));
  const rows = rowsData.map((r) => `<tr><td>${esc(labels[r.PaymentMethod] || r.PaymentMethod)}</td><td>${badge(r.PaymentStatus)}</td><td>${r.TotalTransactions}</td><td>${money(r.TotalAmount)}</td></tr>`);
  content.innerHTML = `
    <section class="card">
      <h3>BM10 - Báo cáo thu phí</h3>
      <form id="feeFilter" class="filter-row">
        <select name="periodId"><option value="">Tất cả đợt</option>${optionRows(lookups.RegistrationPeriods, 'PeriodID', 'PeriodName')}</select>
        <select name="method"><option value="">Tất cả phương thức</option><option value="CASH">Tiền mặt</option><option value="TRANSFER">Chuyển khoản</option><option value="ONLINE">Trực tuyến</option></select>
        <select name="status"><option value="">Tất cả trạng thái</option><option value="PENDING">Chờ xác nhận</option><option value="CONFIRMED">Đã xác nhận</option><option value="REJECTED">Từ chối</option></select>
        <button class="btn secondary" type="submit">Lọc</button>
      </form>
      ${table(['Phương thức', 'Trạng thái', 'Số giao dịch', 'Tổng tiền'], rows)}
    </section>`;
  $('feeFilter').onsubmit = async (event) => { event.preventDefault(); await renderFeeReport(); };
}

window.confirmPayment = confirmPayment;
