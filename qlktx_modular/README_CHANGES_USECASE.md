# Những điểm đã sửa để bám sát file yêu cầu

1. Sửa UC03: form đăng ký bắt buộc chọn đợt, tòa nhà mong muốn và số tháng; backend kiểm tra đợt đăng ký `OPEN`, còn trong thời gian cho phép và hồ sơ sinh viên hợp lệ.
2. Sửa UC05: backend chỉ cho duyệt/từ chối hồ sơ đang `PENDING`, đúng đặc tả use case.
3. Sửa UC06: danh sách phòng phân chỉ hiển thị phòng còn chỗ/phù hợp giới tính; backend vẫn kiểm tra lại và tự tính `TotalAmount`.
4. Sửa UC07/UC08: thanh toán phải có số tiền > 0; chuyển khoản/trực tuyến cần mã giao dịch; kế toán chỉ xác nhận thanh toán `PENDING`.
5. Sửa UC10: yêu cầu phát sinh bắt buộc có tiêu đề và nội dung; loại yêu cầu đúng danh sách trong QĐ08.
6. Sửa UC12: khi admin tạo tài khoản sinh viên có thể nhập mã sinh viên, giới tính, khoa, lớp để tạo luôn hồ sơ Students tương ứng.
7. Bổ sung bộ lọc cho hồ sơ, thanh toán, yêu cầu và báo cáo theo yêu cầu chức năng hệ thống.
8. Bổ sung file `docs/USE_CASE_COVERAGE.md` để đối chiếu từng use case với màn hình/API.
