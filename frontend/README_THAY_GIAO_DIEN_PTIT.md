# Thay giao diện đăng nhập KTX PTIT

Gói này chỉ thay đổi frontend, không thay backend, database hoặc API.

## Cách nhanh nhất

1. Sao lưu thư mục `frontend` cũ.
2. Chép toàn bộ thư mục `frontend_ktx_ptit` này vào dự án.
3. Đổi tên thành `frontend`, hoặc chép đè các file vào thư mục `frontend` hiện tại.
4. Khởi động lại backend và nhấn `Ctrl + F5` trên trình duyệt.

## Nếu chỉ muốn thay đúng phần giao diện đăng nhập

Chép đè 3 mục sau:

- `index.html` -> `qlktx_modular/frontend/index.html`
- `assets/styles.css` -> `qlktx_modular/frontend/assets/styles.css`
- `assets/images/ptit-campus.png` -> `qlktx_modular/frontend/assets/images/ptit-campus.png`

Không cần thay các file JavaScript. Không thay thư mục `backend` và `database`.

