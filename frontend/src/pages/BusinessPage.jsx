import { useEffect, useRef, useState } from 'react';
import { closeModal, esc, mountView } from '../../assets/js/core';
import * as dashboard from '../../assets/js/dashboard';
import * as student from '../../assets/js/student';
import * as manager from '../../assets/js/manager';
import * as accountant from '../../assets/js/accountant';
import * as admin from '../../assets/js/admin';

const renderers = {
  dashboard: dashboard.renderDashboard,
  'student-profile': student.renderStudentProfile,
  'student-register': student.renderStudentRegister,
  'student-apps': student.renderApplications,
  'student-payments': student.renderStudentPayments,
  'student-requests': student.renderStudentRequests,
  'manager-apps': manager.renderManagerApps,
  'manager-checkin': manager.renderManagerCheckin,
  'manager-requests': manager.renderManagerRequests,
  'manager-residence-report': manager.renderResidenceReport,
  'accountant-payments': accountant.renderAccountantPayments,
  'accountant-debts': accountant.renderDebtReport,
  'accountant-fee-report': accountant.renderFeeReport,
  'admin-users': admin.renderUsers,
  'admin-students': admin.renderStudents,
  'admin-buildings': admin.renderBuildings,
  'admin-rooms': admin.renderRooms,
  'admin-periods': admin.renderPeriods,
};

export default function BusinessPage({ view }) {
  const host = useRef(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    function reload() { setRevision(value => value + 1); }
    window.addEventListener('qlktx:refresh', reload);
    return () => window.removeEventListener('qlktx:refresh', reload);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const element = host.current;
    mountView(element, view, controller);
    closeModal();
    element.innerHTML = '<div class="card"><p class="muted" role="status">Đang tải dữ liệu...</p></div>';
    renderers[view]().catch(error => {
      if (controller.signal.aborted || error.name === 'AbortError') return;
      if (error.status === 401) window.dispatchEvent(new Event('qlktx:unauthorized'));
      element.innerHTML = `<div class="card" role="alert"><h3>Không tải được dữ liệu</h3><p class="muted">${esc(error.message)}</p><button class="btn secondary" type="button">Thử lại</button></div>`;
      element.querySelector('button').onclick = () => setRevision(value => value + 1);
    });
    return () => {
      controller.abort();
      closeModal();
    };
  }, [view, revision]);

  return <section id="content" className="content" ref={host} />;
}
