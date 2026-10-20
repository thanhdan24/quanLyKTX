# Đối chiếu 7 yêu cầu React

## Kết quả

| Yêu cầu | Trước khi bổ sung | Hiện tại |
| --- | --- | --- |
| 1. ReactJS với Vite/Next.js | JavaScript thuần, chưa có cấu hình React | React 19 + Vite 7, có package.json và package-lock.json |
| 2. HTML giao diện trang chủ đúng đề tài | Đã có giao diện KTX PTIT | Giữ giao diện trong JSX tại src/pages/LoginPage.jsx, có menu công khai |
| 3. File CSS riêng | Đã có assets/styles.css | Giữ CSS và hình ảnh hiện có; src/styles.css bổ sung kiểu cho React/menu/trang thông tin |
| 4. Repository GitHub và push source | Có Git và remote origin | Đã xác minh repository trên GitHub; bản React được cập nhật vào repository này, xem lịch sử commit để đối chiếu phiên bản |
| 5. Pages/components | Các hàm render theo vai trò | Có pages và components React, layout dùng chung, trang giới thiệu, hướng dẫn, 404 và các trang nghiệp vụ |
| 6. Tích hợp react-router | Chưa có | BrowserRouter, Routes, Route, Outlet, NavLink, Navigate và useNavigate |
| 7. Chuyển trang bằng menu hoặc URL | Menu chỉ đổi nội dung, không đổi URL | Menu có URL riêng, hỗ trợ Back/Forward, URL trực tiếp, tải lại trang, kiểm tra đăng nhập và vai trò |

Repository hiện có: https://github.com/thanhdan24/quanLyKTX

**Git:** `.env` và `node_modules` được bỏ theo dõi trong bản cập nhật React; các file trên máy vẫn được giữ lại. `.gitignore` ngăn thêm lại các file này. Commit cũ vẫn có `.env` trong lịch sử; nếu đó là thông tin bí mật thật, chủ repository cần thay thông tin đã công khai. Không đưa nội dung `.env` vào báo cáo hoặc commit mới.

## Chạy website

Yêu cầu Node.js đáp ứng Vite 7 (20.19+ hoặc 22.12+; môi trường kiểm tra dùng Node 24).

Trong PowerShell sử dụng `npm.cmd` để không vướng chính sách chặn `npm.ps1`.

### Chạy bản build cùng backend

Từ thư mục `qlktx_modular`:

```powershell
cd frontend
npm.cmd ci
npm.cmd run build
cd ../backend
npm.cmd ci
npm.cmd start
```

Giữ cấu hình SQL Server trong `backend/.env` theo hướng dẫn README. Không cần khởi tạo lại hoặc xóa database khi chuyển sang React. Truy cập http://localhost:3000.

Backend phục vụ `frontend/dist` và trả `index.html` cho các URL trang. API không tồn tại vẫn trả JSON 404; asset không tồn tại không bị trả HTML. Nếu chưa build, trang trả thông báo 503 hướng dẫn build.

### Phát triển bằng Vite

Chạy backend trong một terminal như trên, rồi terminal khác:

```powershell
cd frontend
npm.cmd run dev
```

Truy cập http://127.0.0.1:5173. Vite proxy `/api` tới http://127.0.0.1:3000. Có thể đặt `VITE_API_BASE` khi backend ở máy khác; mặc định API cùng origin. Khóa localStorage `QLKTX_API_BASE` cũ vẫn được hỗ trợ nếu đã thiết lập.

`vite preview` chỉ xem bản build; khi cần API thật hãy dùng backend phục vụ bản build hoặc Vite dev proxy. Hosting khác cần rewrite URL trang về `index.html`; repository GitHub không tự động là hosting website.

## Các đường dẫn

| Đối tượng | URL |
| --- | --- |
| Công khai | `/`, `/dang-nhap`, `/gioi-thieu`, `/huong-dan` |
| Mọi tài khoản đã đăng nhập | `/dashboard` |
| Sinh viên | `/student-profile`, `/student-register`, `/student-apps`, `/student-payments`, `/student-requests` |
| Cán bộ quản lý | `/manager-apps`, `/manager-checkin`, `/manager-requests`, `/manager-residence-report` |
| Kế toán | `/accountant-payments`, `/accountant-debts`, `/accountant-fee-report` |
| Quản trị viên | `/admin-users`, `/admin-students`, `/admin-buildings`, `/admin-rooms`, `/admin-periods` |

Trang nghiệp vụ yêu cầu đăng nhập. Sau đăng nhập, người dùng trở về đường dẫn đã yêu cầu. Mỗi vai trò chỉ truy cập các trang có trong menu của vai trò đó. API vẫn thực thi kiểm tra quyền hiện có trên backend.

## Cấu trúc React

```text
frontend/
  index.html
  package.json
  vite.config.js
  src/
    main.jsx
    App.jsx
    styles.css
    context/AuthContext.jsx
    components/{AppLayout,LoginForm,PublicNav}.jsx
    pages/{LoginPage,InfoPage,NotFoundPage,BusinessPage}.jsx
  assets/
    styles.css
    images/
    js/{core,dashboard,student,manager,accountant,admin}.js
  tests/navigation.spec.js
```

React quản lý khởi động ứng dụng, đăng nhập, layout, menu và vòng đời trang. Các renderer/biểu mẫu nghiệp vụ đã được chuyển thành ES modules và được `BusinessPage` gắn vào vùng nội dung riêng để giữ các API, modal và hành vi hiện có. Chưa chuyển toàn bộ biểu mẫu nghiệp vụ thành JSX. File `assets/js/app.js` là bootstrap cũ, không còn được nạp từ `index.html`.

Khi rời trang, các truy vấn đọc bị hủy để dữ liệu trả về chậm không ghi đè trang mới. Sau thao tác lưu, `window.navigate` tương thích với các biểu mẫu cũ và chuyển qua React Router hoặc tải lại trang hiện tại.

## Kiểm tra

```powershell
cd frontend
npm.cmd run check
npm.cmd run build
npm.cmd run test:e2e
cd ../backend
npm.cmd run check
npm.cmd test
```

E2E dùng Microsoft Edge đã cài sẵn, chạy trên bản build với API giả lập, không ghi vào SQL Server. Nếu cần dùng Chrome, đặt biến `PLAYWRIGHT_CHANNEL=chrome`. Test backend kiểm tra riêng middleware phục vụ React; có thể chạy `node test/frontend.test.js` trong môi trường hạn chế tạo tiến trình con.

Kết quả kiểm tra ngày 20/10/2026: lint và build đạt; 13 bài kiểm tra trình duyệt đạt; kiểm tra middleware backend đạt. Đã khởi động backend, kết nối SQL Server thật và đăng nhập/xem tất cả trang của 4 tài khoản demo `sv001`, `manager`, `accountant`, `admin` thành công, bao gồm tải lại URL. Không ghi dữ liệu nghiệp vụ trong lượt kiểm tra với SQL Server thật.

Các tình huống kiểm tra: menu của 4 vai trò, URL trực tiếp, tải lại, lịch sử trình duyệt, đường dẫn yêu cầu trước đăng nhập, đăng xuất, sai quyền, lưu hồ sơ, bộ lọc, modal, phiên hết hạn, menu điện thoại và phản hồi chậm. Thao tác ghi được kiểm tra bằng API giả lập; các kiểm tra này không thay thế kiểm thử giao dịch trên SQL Server thật.

Tài liệu tham khảo: https://reactrouter.com/start/declarative/installation
