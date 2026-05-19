# Cấu trúc dự án sau khi tách file

Dự án đã được tách thành nhiều file nhỏ để dễ quản lý, sửa lỗi và trình bày đồ án.

## Backend

```text
backend/
├── src/
│   ├── server.js                 # Chỉ khởi động server
│   ├── app.js                    # Cấu hình Express, middleware, đăng ký routes
│   ├── config.js                 # Cấu hình PORT, secret, đường dẫn frontend
│   ├── db.js                     # Kết nối SQL Server
│   ├── middleware/
│   │   ├── auth.js               # Kiểm tra đăng nhập và phân quyền
│   │   └── errorHandler.js       # Xử lý lỗi chung
│   ├── services/
│   │   └── studentService.js     # Hàm dùng chung về sinh viên, hồ sơ, phòng
│   ├── utils/
│   │   ├── http.js               # Hàm kiểm tra dữ liệu, asyncHandler
│   │   └── security.js           # Băm mật khẩu, tạo/kiểm tra token
│   └── routes/
│       ├── authRoutes.js         # UC01 đăng nhập, kiểm tra phiên, dữ liệu lookup
│       ├── dashboardRoutes.js    # Tổng quan, UC02 cập nhật hồ sơ sinh viên
│       ├── userRoutes.js         # UC12 quản lý tài khoản, sinh viên
│       ├── catalogRoutes.js      # UC12 quản lý tòa nhà, phòng, đợt đăng ký
│       ├── applicationRoutes.js  # UC03, UC04, UC05, UC06, UC09
│       ├── paymentRoutes.js      # UC07, UC08
│       ├── requestRoutes.js      # UC10, UC11
│       └── reportRoutes.js       # BM08, BM09, BM10 báo cáo
└── package.json
```

## Frontend

```text
frontend/
├── index.html
└── assets/
    ├── styles.css
    ├── app.js                    # File ghi chú: frontend đã tách module
    └── js/
        ├── core.js               # Cấu hình API, helper, modal, toast, table
        ├── dashboard.js          # Màn hình tổng quan
        ├── student.js            # Chức năng sinh viên: UC02, UC03, UC04, UC07, UC10
        ├── manager.js            # Chức năng cán bộ: UC05, UC06, UC09, UC11, BM08
        ├── accountant.js         # Chức năng kế toán: UC08, BM09, BM10
        ├── admin.js              # Chức năng quản trị: UC12
        └── app.js                # Điều hướng, đăng nhập, đăng xuất, boot app
```

## Cách chạy

```powershell
cd "D:\doAnCNPN\qlktx_modular\qlktx_modular\backend"
npm.cmd install
npm.cmd start
```

Sau đó mở:

```text
http://localhost:3000
```

Tài khoản demo:

```text
admin / 123456
manager / 123456
accountant / 123456
sv001 / 123456
```
