# Ma trận đối chiếu use case và phần triển khai

Bản này được rà soát theo tài liệu `DOITUONGYEUCAU.docx` và triển khai đủ 12 use case chính.

| Use case | Trạng thái | Màn hình/API chính | Ghi chú kiểm soát nghiệp vụ |
|---|---:|---|---|
| UC01 - Đăng nhập hệ thống | Đủ | Login, `POST /api/auth/login`, `GET /api/auth/me` | Chỉ tài khoản `ACTIVE` đăng nhập được; chuyển giao diện theo vai trò. |
| UC02 - Cập nhật hồ sơ sinh viên | Đủ | Sinh viên > Hồ sơ sinh viên, `GET/PUT /api/me/student` | Cập nhật Users + Students; mã SV không cho sinh viên tự sửa. |
| UC03 - Nộp hồ sơ đăng ký ở KTX | Đủ | Sinh viên > Đăng ký ở KTX, `POST /api/applications` | Chỉ đợt `OPEN`, trong StartDate-EndDate, hồ sơ sinh viên `ACTIVE`, bắt buộc chọn đợt/tòa/số tháng; DB chặn trùng StudentID-PeriodID. |
| UC04 - Theo dõi trạng thái hồ sơ | Đủ | Sinh viên > Theo dõi hồ sơ, `GET /api/applications` | Có bộ lọc theo đợt/trạng thái; hiển thị phòng, ghi chú, tổng tiền, đã xác nhận, còn nợ. |
| UC05 - Duyệt hoặc từ chối hồ sơ | Đủ | Quản lý > Duyệt và phân phòng, `POST /api/applications/:id/decision` | Chỉ MANAGER và chỉ hồ sơ `PENDING`; lưu ApprovedBy, ApprovedAt, Note. |
| UC06 - Phân phòng cho sinh viên | Đủ | Quản lý > Duyệt và phân phòng, `POST /api/applications/:id/assign-room` | Chỉ hồ sơ `APPROVED`; kiểm tra phòng `AVAILABLE`, còn chỗ, phù hợp giới tính; tính `TotalAmount = DurationMonths x PricePerMonth`. |
| UC07 - Thanh toán phí ở KTX | Đủ | Sinh viên > Thanh toán, `POST /api/payments` | Chỉ hồ sơ đã duyệt/đang ở và đã có tổng tiền; số tiền > 0; chuyển khoản/trực tuyến cần mã giao dịch; tạo `PENDING`. |
| UC08 - Xác nhận thanh toán | Đủ | Kế toán > Xác nhận thanh toán, `POST /api/payments/:id/confirm` | Chỉ ACCOUNTANT; chỉ thanh toán `PENDING`; xác nhận/từ chối, lưu ConfirmedBy và PaidAt. |
| UC09 - Xác nhận nhận phòng | Đủ | Quản lý > Nhận/trả phòng, `POST /api/applications/:id/check-in` | Chỉ khi hồ sơ `APPROVED`, đã có phòng, thanh toán xác nhận đủ tổng tiền; cập nhật `CHECKED_IN`, CheckInDate. |
| UC10 - Gửi yêu cầu phát sinh | Đủ | Sinh viên > Yêu cầu phát sinh, `POST /api/requests` | Chỉ hồ sơ `APPROVED` hoặc `CHECKED_IN`; loại yêu cầu đúng tập EXTEND/TRANSFER/CHECKOUT/INCIDENT/FEEDBACK; tiêu đề và nội dung bắt buộc. |
| UC11 - Xử lý yêu cầu phát sinh | Đủ | Quản lý > Xử lý yêu cầu, `POST /api/requests/:id/process` | Cập nhật APPROVED/REJECTED/DONE; lưu ProcessedBy, ProcessedAt, ResultNote. |
| UC12 - Quản lý tài khoản và danh mục nền | Đủ | Admin > Tài khoản/Sinh viên/Tòa nhà/Phòng/Đợt đăng ký | CRUD tài khoản, sinh viên, tòa nhà, phòng, đợt; khi tạo tài khoản STUDENT có thể tạo luôn hồ sơ Students tương ứng; kiểm tra unique/FK. |

## Các yêu cầu hệ thống đã bổ sung

- Phân quyền theo 4 vai trò ở cả giao diện và API.
- Bộ lọc cho hồ sơ, thanh toán, yêu cầu, công nợ, báo cáo thu phí, báo cáo cư trú.
- Công thức công nợ: `DebtAmount = TotalAmount - SUM(Amount CONFIRMED)`.
- Báo cáo cư trú có tổng hồ sơ, đã duyệt, đã nhận phòng, đang chờ xử lý.
- Bảo mật mức đồ án: mật khẩu demo lưu SHA-256; API dùng token ký HMAC; mật khẩu gốc không lưu trong Users.
