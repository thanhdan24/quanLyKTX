# Bản modular dễ quản lý

Dự án đã được tách nhỏ theo backend routes/services/middleware và frontend theo từng vai trò người dùng. Xem chi tiết trong `docs/PROJECT_STRUCTURE.md`.

# Website quản lý ký túc xá - bản full-stack

Dự án được hoàn thiện theo 2 file yêu cầu:

- `docs/DOITUONGYEUCAU.docx`: tài liệu yêu cầu nghiệp vụ, use case, biểu mẫu.
- `CSDL_QLKTX_RutGon.sql` / `database/01_schema_original.sql`: cơ sở dữ liệu SQL Server gốc.

## 1. Ngôn ngữ / công nghệ sử dụng

- Frontend: HTML, CSS, JavaScript thuần.
- Backend: Node.js + Express.
- Database: SQL Server, ngôn ngữ SQL/T-SQL.
- Kết nối SQL Server: thư viện `mssql`.
- Đăng nhập: API `/api/auth/login`, token ký bằng HMAC SHA-256.
- Mật khẩu demo trong database được lưu dạng SHA-256 của chuỗi `123456`.

## 2. Cấu trúc thư mục

```text
qlktx_fullstack/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── db.js
│       └── server.js
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── app.js
│       └── styles.css
├── database/
│   ├── 00_full_database.sql
│   ├── 01_schema_original.sql
│   └── 02_seed_demo_data.sql
├── docs/
│   └── DOITUONGYEUCAU.docx
├── CSDL_QLKTX_RutGon.sql
└── README.md
```

## 3. Cài phần mềm cần có

Cài trước:

1. VS Code.
2. Node.js LTS.
3. SQL Server Developer hoặc SQL Server Express.
4. SQL Server Management Studio hoặc Azure Data Studio.

## 4. Tạo cơ sở dữ liệu

Mở SQL Server Management Studio, kết nối SQL Server, sau đó mở file:

```text
database/00_full_database.sql
```

Chạy toàn bộ script. File này sẽ:

1. Xóa database `QLKTX_RutGon` cũ nếu có.
2. Tạo lại database.
3. Tạo 8 bảng chính: `Users`, `Students`, `Buildings`, `Rooms`, `RegistrationPeriods`, `Applications`, `Payments`, `Requests`.
4. Thêm dữ liệu mẫu để đăng nhập và kiểm thử.

Nếu không muốn xóa database cũ, chỉ chạy `database/01_schema_original.sql`, rồi tự thêm dữ liệu hoặc chỉnh file seed.

## 5. Cấu hình backend

Mở terminal trong VS Code:

```bash
cd backend
copy .env.example .env
```

Nếu dùng macOS/Linux thì dùng:

```bash
cp .env.example .env
```

Mở file `backend/.env` và sửa thông tin kết nối SQL Server:

```env
PORT=3000
DB_USER=sa
DB_PASSWORD=mat_khau_sql_server_cua_ban
DB_SERVER=localhost
DB_DATABASE=QLKTX_RutGon
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
APP_SECRET=doi_mot_chuoi_bi_mat_khac
```

Nếu dùng SQL Server Express dạng named instance, ví dụ `localhost\SQLEXPRESS`, cấu hình như sau:

```env
DB_USER=sa
DB_PASSWORD=mat_khau_sql_server_cua_ban
DB_SERVER=localhost
DB_DATABASE=QLKTX_RutGon
DB_INSTANCE=SQLEXPRESS
DB_ENCRYPT=false
DB_TRUST_SERVER_CERTIFICATE=true
```

Khi dùng `DB_INSTANCE`, nên bỏ hoặc comment dòng `DB_PORT`.

## 6. Chạy backend và website

Trong terminal:

```bash
cd backend
npm install
npm start
```

Nếu chạy thành công, terminal sẽ hiện:

```text
Da ket noi SQL Server: localhost QLKTX_RutGon
QLKTX backend dang chay tai http://localhost:3000
```

Mở trình duyệt:

```text
http://localhost:3000
```

Backend đã serve luôn frontend, nên không bắt buộc chạy Live Server.

## 7. Tài khoản demo

Tất cả tài khoản có mật khẩu:

```text
123456
```

Danh sách tài khoản:

```text
sv001       - Sinh viên
sv002       - Sinh viên
sv003       - Sinh viên
manager     - Cán bộ quản lý KTX
accountant  - Kế toán / Thu ngân
admin       - Quản trị hệ thống
```

## 8. Các chức năng đã làm

### Sinh viên

- Đăng nhập.
- Cập nhật hồ sơ sinh viên.
- Nộp hồ sơ đăng ký ở KTX.
- Theo dõi trạng thái hồ sơ.
- Gửi thanh toán.
- Gửi yêu cầu phát sinh: gia hạn, chuyển phòng, trả phòng, sự cố, phản ánh.

### Cán bộ quản lý KTX

- Xem danh sách hồ sơ đăng ký.
- Duyệt hoặc từ chối hồ sơ.
- Phân phòng cho hồ sơ đã duyệt.
- Tự động tính `TotalAmount = DurationMonths x PricePerMonth`.
- Kiểm tra phòng còn chỗ và phù hợp giới tính.
- Xác nhận nhận phòng khi đã thanh toán đủ.
- Xác nhận trả phòng.
- Xử lý yêu cầu phát sinh.
- Xem báo cáo cư trú.

### Kế toán / Thu ngân

- Xem danh sách thanh toán.
- Xác nhận hoặc từ chối thanh toán.
- Theo dõi công nợ.
- Xem báo cáo thu phí.

### Quản trị hệ thống

- Quản lý tài khoản người dùng.
- Quản lý hồ sơ sinh viên.
- Quản lý tòa nhà.
- Quản lý phòng.
- Quản lý đợt đăng ký.

## 9. Một số API chính

```text
POST /api/auth/login
GET  /api/auth/me
GET  /api/dashboard
GET  /api/lookups
GET  /api/applications
POST /api/applications
POST /api/applications/:id/decision
POST /api/applications/:id/assign-room
POST /api/applications/:id/check-in
POST /api/payments
POST /api/payments/:id/confirm
POST /api/requests
POST /api/requests/:id/process
GET  /api/reports/debts
GET  /api/reports/fees
GET  /api/reports/residence
```

## 10. Lỗi thường gặp

### Lỗi không kết nối được SQL Server

Kiểm tra:

- SQL Server đang chạy chưa.
- Sai `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_PORT` hoặc `DB_INSTANCE`.
- SQL Server đã bật TCP/IP chưa.
- Nếu dùng SQL Server Authentication, tài khoản `sa` đã được bật chưa.

### Lỗi đăng nhập sai

Hãy chắc chắn đã chạy `database/00_full_database.sql`. Mật khẩu demo là `123456`.

### Mở `frontend/index.html` trực tiếp bị lỗi API

Nên mở qua backend:

```text
http://localhost:3000
```

Nếu vẫn muốn dùng Live Server, frontend sẽ mặc định gọi API tại:

```text
http://localhost:3000
```

nên backend vẫn phải đang chạy.

## 11. Kiểm tra kỹ thuật đã thực hiện

- Kiểm tra cú pháp backend bằng `node --check backend/src/server.js`.
- Kiểm tra cú pháp file kết nối bằng `node --check backend/src/db.js`.
- Kiểm tra cú pháp frontend bằng `node --check frontend/assets/app.js`.
- Đóng gói zip và kiểm tra danh sách file trong zip.

Chưa thể kiểm thử kết nối SQL Server thực tế trong môi trường ChatGPT vì không có SQL Server đang chạy trong container. Khi chạy trên máy của bạn, chỉ cần chỉnh `.env` đúng thông tin SQL Server.

## Bản sửa CRUD

Bản này đã bổ sung và sửa các phần thao tác dữ liệu:

- Nút Lưu có kiểm tra form và hiện thông báo lỗi rõ ràng nếu backend hoặc SQL Server trả lỗi.
- Các thao tác duyệt hồ sơ, phân phòng, nhận/trả phòng, xác nhận thanh toán, xử lý yêu cầu đều có bắt lỗi.
- Bổ sung nút Xóa/Xóa-khóa cho các danh mục quản trị: tài khoản, sinh viên, tòa nhà, phòng, đợt đăng ký.
- Bổ sung API DELETE tương ứng trong backend.
- Với dữ liệu đã có khóa ngoại liên quan, hệ thống sẽ khóa/ngừng dùng/đóng thay vì xóa vật lý ở các trường hợp phù hợp, hoặc báo lỗi rõ ràng nếu không thể xóa.

Nếu dùng máy của bạn với SQL Server `SQLEXPRESS` và mật khẩu `sa` là `123`, file `backend/.env` đã được đặt sẵn:

```env
DB_USER=sa
DB_PASSWORD=123
DB_SERVER=localhost
DB_DATABASE=QLKTX_RutGon
DB_INSTANCE=SQLEXPRESS
```

Chạy lại:

```powershell
cd D:\doAnCNPN\qlktx_fullstack_complete\qlktx_fullstack\backend
npm.cmd install
npm.cmd start
```

## 11. Bản use-case aligned

Bản trong gói này đã được rà lại theo 12 use case trong `docs/DOITUONGYEUCAU.docx`.
Xem chi tiết tại:

```text
docs/USE_CASE_COVERAGE.md
README_CHANGES_USECASE.md
```

Các điểm đã siết lại gồm: chỉ duyệt hồ sơ `PENDING`, bắt buộc nội dung yêu cầu phát sinh, kiểm tra số tiền thanh toán > 0, yêu cầu mã giao dịch với chuyển khoản/trực tuyến, lọc dữ liệu ở các danh sách/báo cáo, và tạo hồ sơ sinh viên tương ứng khi admin tạo tài khoản `STUDENT`.
