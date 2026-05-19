# Bản sửa lỗi màn hình đăng nhập bị phủ mờ

Bản này sửa lỗi `modal`/lớp phủ làm màn hình đăng nhập bị mờ và không bấm được.

Các sửa đổi chính:

- Thêm CSS `[hidden] { display: none !important; }`.
- Thêm CSS `#modal:empty { display: none !important; }`.
- Khi quay về màn hình đăng nhập hoặc vào app, tự đóng modal cũ bằng `closeModal()`.

Cách chạy giữ nguyên:

```powershell
cd D:\doAnCNPN\qlktx_usecase_aligned_fixed\backend
npm.cmd install
npm.cmd start
```

Mở: http://localhost:3000
