import { test, expect } from '@playwright/test';

const routes = {
  STUDENT: ['dashboard', 'student-profile', 'student-register', 'student-apps', 'student-payments', 'student-requests'],
  MANAGER: ['dashboard', 'manager-apps', 'manager-checkin', 'manager-requests', 'manager-residence-report'],
  ACCOUNTANT: ['dashboard', 'accountant-payments', 'accountant-debts', 'accountant-fee-report'],
  ADMIN: ['dashboard', 'admin-users', 'admin-students', 'admin-buildings', 'admin-rooms', 'admin-periods'],
};

async function mockApi(page, role = 'STUDENT', signedIn = true) {
  const user = { UserID: 1, FullName: 'Sinh viên kiểm thử', Username: 'sv001', Role: role, Status: 'ACTIVE' };
  const student = { ...user, StudentID: 1, StudentCode: 'SV001', Gender: 'MALE', DateOfBirth: '2005-01-01', StudentStatus: 'ACTIVE' };
  const buildings = [{ BuildingID: 1, BuildingName: 'Tòa A', GenderScope: 'ALL' }];
  const rooms = [{ RoomID: 1, BuildingID: 1, BuildingName: 'Tòa A', RoomCode: 'A101', Capacity: 4, UsedBeds: 1, AvailableBeds: 3, PricePerMonth: 500000, GenderScope: 'ALL', RoomStatus: 'AVAILABLE' }];
  const periods = [{ PeriodID: 1, PeriodName: 'Đợt kiểm thử', Status: 'OPEN', StartDate: '2026-01-01', EndDate: '2026-12-31' }];
  const applications = [{ ApplicationID: 1, PeriodName: 'Đợt kiểm thử', StudentName: user.FullName, StudentCode: 'SV001', Gender: 'MALE', Status: 'APPROVED', TotalAmount: 3000000, DebtAmount: 3000000, DurationMonths: 6, AssignedBuildingName: 'Tòa A', RoomCode: 'A101' }];
  const payments = [{ PaymentID: 1, ApplicationID: 1, StudentName: user.FullName, StudentCode: 'SV001', Amount: 500000, PaymentMethod: 'TRANSFER', PaymentStatus: 'PENDING', PaidAt: '2026-10-01' }];
  const data = {
    '/api/auth/me': { user },
    '/api/auth/login': { user, token: 'test-token' },
    '/api/dashboard': { cards: [{ label: 'Hồ sơ', value: 1 }] },
    '/api/me/student': student,
    '/api/lookups': { Buildings: buildings, Rooms: rooms, RegistrationPeriods: periods },
    '/api/buildings': buildings,
    '/api/rooms': rooms,
    '/api/periods': periods,
    '/api/users': [user],
    '/api/students': [student],
    '/api/applications': applications,
    '/api/payments': payments,
    '/api/requests': [{ RequestID: 1, ApplicationID: 1, StudentName: user.FullName, Title: 'Yêu cầu kiểm thử', RequestType: 'INCIDENT', Status: 'PENDING' }],
    '/api/reports/debts': applications,
    '/api/reports/fees': [{ PaymentMethod: 'TRANSFER', PaymentStatus: 'PENDING', TotalTransactions: 1, TotalAmount: 500000 }],
    '/api/reports/residence': { summary: { TotalApplications: 1 }, rooms },
  };
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (route.request().method() !== 'GET' && path !== '/api/auth/login') return route.fulfill({ json: { message: 'Đã lưu kiểm thử.' } });
    if (!(path in data)) throw new Error(`Unexpected API: ${path}`);
    return route.fulfill({ json: data[path] });
  });
  if (signedIn) await page.addInitScript(({ user }) => {
    localStorage.setItem('QLKTX_TOKEN_FULLSTACK', 'test-token');
    localStorage.setItem('QLKTX_USER_FULLSTACK', JSON.stringify(user));
  }, { user });
}

test('public home, menu, direct URL, refresh and 404', async ({ page }) => {
  await mockApi(page, 'STUDENT', false);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
  await page.getByRole('link', { name: 'Giới thiệu', exact: true }).click();
  await expect(page).toHaveURL(/\/gioi-thieu$/);
  await expect(page.getByRole('heading', { name: 'Giới thiệu hệ thống' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Giới thiệu hệ thống' })).toBeVisible();
  await page.goto('/huong-dan');
  await expect(page.getByRole('heading', { name: 'Hướng dẫn sử dụng' })).toBeVisible();
  await page.goto('/duong-dan-khong-ton-tai');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
});

for (const [role, views] of Object.entries(routes)) {
  test(`${role}: all menu pages, URL, refresh and browser history`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockApi(page, role);
    await page.goto(`/${views[1]}`);
    for (const view of views) {
      await page.locator(`#menu a[href="/${view}"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${view}$`));
      await expect(page.locator('#content .card, #content .dashboard-hero').first()).toBeVisible();
      await expect(page.locator('#content')).not.toContainText('Không tải được dữ liệu');
      await expect(page.locator('#content')).not.toContainText('Đang tải dữ liệu');
      await expect(page.locator(`#menu a[href="/${view}"]`)).toHaveAttribute('aria-current', 'page');
    }
    await page.reload();
    await expect(page.locator('#content')).not.toContainText('Đang tải dữ liệu');
    await expect(page.locator('#content')).not.toContainText('Không tải được dữ liệu');
    await page.locator('#menu a[href="/dashboard"]').click();
    await expect(page.locator('.dashboard-hero')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/${views.at(-1)}$`));
    await expect(page.locator('#content .card').first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('protected deep link survives login; password toggle and logout work', async ({ page }) => {
  await mockApi(page, 'STUDENT', false);
  await page.goto('/student-payments');
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('sv001');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  await expect(page.locator('#passwordInput')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Đăng nhập hệ thống' }).click();
  await expect(page).toHaveURL(/\/student-payments$/);
  await expect(page.locator('#paymentForm')).toBeVisible();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await expect(page).toHaveURL(/\/dang-nhap$/);
  expect(await page.evaluate(() => localStorage.getItem('QLKTX_TOKEN_FULLSTACK'))).toBeNull();
});

test('wrong role cannot open admin page', async ({ page }) => {
  await mockApi(page);
  await page.goto('/admin-users');
  await expect(page.getByRole('heading', { name: 'Bạn không có quyền truy cập trang này' })).toBeVisible();
  await expect(page.locator('#menu a[href="/admin-users"]')).toHaveCount(0);
});

test('student profile save preserves API method and body and refreshes page', async ({ page }) => {
  await mockApi(page);
  await page.goto('/student-profile');
  await page.locator('#studentProfileForm input[name="FullName"]').fill('Tên đã cập nhật');
  const saved = page.waitForRequest(request => request.url().endsWith('/api/me/student') && request.method() === 'PUT');
  await page.getByRole('button', { name: 'Lưu hồ sơ' }).click();
  expect((await saved).postDataJSON().FullName).toBe('Tên đã cập nhật');
  await expect(page.locator('.toast')).toContainText('Đã lưu kiểm thử.');
  await expect(page.locator('#studentProfileForm')).toBeVisible();
  await expect(page).toHaveURL(/\/student-profile$/);
});

test('existing filters still send query parameters', async ({ page }) => {
  await mockApi(page, 'ACCOUNTANT');
  await page.goto('/accountant-payments');
  await page.locator('#accountantPaymentFilter select[name="status"]').selectOption('PENDING');
  const filtered = page.waitForRequest(request => request.url().includes('/api/payments?status=PENDING'));
  await page.getByRole('button', { name: 'Lọc', exact: true }).click();
  await filtered;
  await expect(page.locator('#content table')).toBeVisible();
});

test('admin modal actions remain available after module migration', async ({ page }) => {
  await mockApi(page, 'ADMIN');
  await page.goto('/admin-buildings');
  await page.getByRole('button', { name: 'Thêm tòa nhà', exact: true }).click();
  await expect(page.locator('#modal')).toBeVisible();
  await page.locator('#buildingForm input[name="BuildingName"]').fill('Tòa kiểm thử');
  const saved = page.waitForRequest(request => request.url().endsWith('/api/buildings') && request.method() === 'POST');
  await page.locator('#modal').getByRole('button', { name: 'Lưu', exact: true }).click();
  expect((await saved).postDataJSON().BuildingName).toBe('Tòa kiểm thử');
  await expect(page.locator('#modal')).toBeHidden();
});

test('expired session redirects to login and clears token', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, json: { message: 'Phiên đã hết hạn.' } }));
  await page.goto('/student-profile');
  await expect(page).toHaveURL(/\/dang-nhap$/);
  await expect(page.locator('#loginForm')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('QLKTX_TOKEN_FULLSTACK'))).toBeNull();
});

test('mobile menu opens, navigates and closes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto('/dashboard');
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await page.getByRole('button', { name: 'Mở menu' }).click();
  await expect(page.locator('#sidebar')).toHaveClass(/open/);
  await page.locator('#menu a[href="/student-profile"]').click();
  await expect(page.locator('#studentProfileForm')).toBeVisible();
  await expect(page.locator('#sidebar')).not.toHaveClass(/open/);
  await expect(page.locator('#sidebarBackdrop')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('slow response cannot overwrite the next page', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await mockApi(page);
  await page.route('**/api/me/student', async route => {
    await new Promise(resolve => setTimeout(resolve, 350));
    await route.fulfill({ json: { FullName: 'Dữ liệu chậm', StudentCode: 'SV001', Gender: 'MALE' } }).catch(() => {});
  });
  await page.goto('/student-profile');
  await expect(page.locator('#content')).toContainText('Đang tải dữ liệu');
  await page.locator('#menu a[href="/dashboard"]').click();
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page.locator('.dashboard-hero')).toBeVisible();
  await expect(page.locator('#studentProfileForm')).toHaveCount(0);
  expect(errors).toEqual([]);
});
