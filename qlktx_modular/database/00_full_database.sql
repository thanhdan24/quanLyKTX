IF DB_ID(N'QLKTX_RutGon') IS NOT NULL
BEGIN
    ALTER DATABASE QLKTX_RutGon SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE QLKTX_RutGon;
END
GO

CREATE DATABASE QLKTX_RutGon;
GO

USE QLKTX_RutGon;
GO
/* =========================================================
   1. Bảng Users
   Lưu tài khoản đăng nhập và phân quyền cho toàn hệ thống
   ========================================================= */
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(120) NOT NULL,
    Role VARCHAR(20) NOT NULL
        CHECK (Role IN ('STUDENT', 'MANAGER', 'ACCOUNTANT', 'ADMIN')),
    Phone VARCHAR(20) NULL,
    Email VARCHAR(120) NULL UNIQUE,
    Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (Status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
);
GO

/* =========================================================
   2. Bảng Students
   Lưu hồ sơ nghiệp vụ của sinh viên, tách riêng khỏi Users
   ========================================================= */
CREATE TABLE Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    StudentCode VARCHAR(20) NOT NULL UNIQUE,
    Gender VARCHAR(10) NULL
        CHECK (Gender IN ('MALE', 'FEMALE', 'OTHER')),
    DateOfBirth DATE NULL,
    Faculty NVARCHAR(100) NULL,
    ClassName NVARCHAR(50) NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (Status IN ('ACTIVE', 'INACTIVE')),

    CONSTRAINT FK_Students_Users
        FOREIGN KEY (UserID) REFERENCES Users(UserID)
);
GO

/* =========================================================
   3. Bảng Buildings
   Quản lý các tòa nhà hoặc khu nhà của ký túc xá
   ========================================================= */
CREATE TABLE Buildings (
    BuildingID INT IDENTITY(1,1) PRIMARY KEY,
    BuildingName NVARCHAR(100) NOT NULL UNIQUE,
    GenderScope VARCHAR(10) NOT NULL DEFAULT 'ALL'
        CHECK (GenderScope IN ('ALL', 'MALE', 'FEMALE')),
    Notes NVARCHAR(255) NULL
);
GO

/* =========================================================
   4. Bảng Rooms
   Quản lý phòng ở trong từng tòa nhà
   ========================================================= */
CREATE TABLE Rooms (
    RoomID INT IDENTITY(1,1) PRIMARY KEY,
    BuildingID INT NOT NULL,
    RoomCode VARCHAR(20) NOT NULL,
    FloorNo INT NULL,
    Capacity INT NOT NULL
        CHECK (Capacity > 0),
    PricePerMonth DECIMAL(18,2) NOT NULL
        CHECK (PricePerMonth >= 0),
    GenderScope VARCHAR(10) NOT NULL DEFAULT 'ALL'
        CHECK (GenderScope IN ('ALL', 'MALE', 'FEMALE')),
    RoomStatus VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
        CHECK (RoomStatus IN ('AVAILABLE', 'FULL', 'MAINTENANCE', 'INACTIVE')),
    Notes NVARCHAR(255) NULL,

    CONSTRAINT FK_Rooms_Buildings
        FOREIGN KEY (BuildingID) REFERENCES Buildings(BuildingID),
    CONSTRAINT UQ_Rooms_Building_RoomCode
        UNIQUE (BuildingID, RoomCode)
);
GO

/* =========================================================
   5. Bảng RegistrationPeriods
   Quản lý các đợt đăng ký ở ký túc xá
   ========================================================= */
CREATE TABLE RegistrationPeriods (
    PeriodID INT IDENTITY(1,1) PRIMARY KEY,
    PeriodName NVARCHAR(100) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
        CHECK (Status IN ('DRAFT', 'OPEN', 'CLOSED')),
    Notes NVARCHAR(255) NULL,

    CONSTRAINT CK_RegistrationPeriods_Date
        CHECK (EndDate >= StartDate)
);
GO

/* =========================================================
   6. Bảng Applications
   Lưu hồ sơ đăng ký ở KTX và thông tin xử lý chính
   ========================================================= */
CREATE TABLE Applications (
    ApplicationID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    PeriodID INT NOT NULL,
    PreferredBuildingID INT NULL,
    DurationMonths INT NOT NULL
        CHECK (DurationMonths > 0),
    AttachmentUrl NVARCHAR(255) NULL,
    TotalAmount DECIMAL(18,2) NULL
        CHECK (TotalAmount IS NULL OR TotalAmount >= 0),
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT')),
    SubmittedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    ApprovedBy INT NULL,
    ApprovedAt DATETIME2 NULL,
    AssignedRoomID INT NULL,
    CheckInDate DATE NULL,
    CheckOutDate DATE NULL,
    Note NVARCHAR(255) NULL,

    CONSTRAINT FK_Applications_Students
        FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    CONSTRAINT FK_Applications_RegistrationPeriods
        FOREIGN KEY (PeriodID) REFERENCES RegistrationPeriods(PeriodID),
    CONSTRAINT FK_Applications_PreferredBuildings
        FOREIGN KEY (PreferredBuildingID) REFERENCES Buildings(BuildingID),
    CONSTRAINT FK_Applications_ApprovedBy
        FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID),
    CONSTRAINT FK_Applications_AssignedRoom
        FOREIGN KEY (AssignedRoomID) REFERENCES Rooms(RoomID),
    CONSTRAINT UQ_Applications_Student_Period
        UNIQUE (StudentID, PeriodID),
    CONSTRAINT CK_Applications_CheckOutDate
        CHECK (CheckOutDate IS NULL OR CheckInDate IS NULL OR CheckOutDate >= CheckInDate)
);
GO

/* =========================================================
   7. Bảng Payments
   Lưu các khoản thanh toán của sinh viên theo hồ sơ
   ========================================================= */
CREATE TABLE Payments (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationID INT NOT NULL,
    Amount DECIMAL(18,2) NOT NULL
        CHECK (Amount > 0),
    PaymentMethod VARCHAR(20) NOT NULL
        CHECK (PaymentMethod IN ('CASH', 'TRANSFER', 'ONLINE')),
    TransactionCode VARCHAR(50) NULL,
    PaymentStatus VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (PaymentStatus IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    PaidAt DATETIME2 NULL,
    ConfirmedBy INT NULL,
    Note NVARCHAR(255) NULL,

    CONSTRAINT FK_Payments_Applications
        FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID),
    CONSTRAINT FK_Payments_ConfirmedBy
        FOREIGN KEY (ConfirmedBy) REFERENCES Users(UserID)
);
GO

/* =========================================================
   8. Bảng Requests
   Gộp các yêu cầu phát sinh và phản ánh vào một bảng chung
   ========================================================= */
CREATE TABLE Requests (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    ApplicationID INT NOT NULL,
    RequestType VARCHAR(20) NOT NULL
        CHECK (RequestType IN ('EXTEND', 'TRANSFER', 'CHECKOUT', 'INCIDENT', 'FEEDBACK')),
    Title NVARCHAR(150) NOT NULL,
    Content NVARCHAR(1000) NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (Status IN ('PENDING', 'APPROVED', 'REJECTED', 'DONE')),
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    ProcessedBy INT NULL,
    ProcessedAt DATETIME2 NULL,
    ResultNote NVARCHAR(255) NULL,

    CONSTRAINT FK_Requests_Applications
        FOREIGN KEY (ApplicationID) REFERENCES Applications(ApplicationID),
    CONSTRAINT FK_Requests_ProcessedBy
        FOREIGN KEY (ProcessedBy) REFERENCES Users(UserID)
);
GO

/* =========================================================
   Gợi ý dữ liệu người dùng theo vai trò:
   - STUDENT: sinh viên / học viên
   - MANAGER: cán bộ quản lý ký túc xá
   - ACCOUNTANT: kế toán / thu ngân
   - ADMIN: quản trị hệ thống
   ========================================================= */

/* =========================================================
   9. Du lieu mau de chay website
   Mat khau demo cho tat ca tai khoan: 123456
   PasswordHash = SHA-256('123456')
   ========================================================= */
USE QLKTX_RutGon;
GO

INSERT INTO Users (Username, PasswordHash, FullName, Role, Phone, Email, Status)
VALUES
('sv001', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Nguyễn Văn An', 'STUDENT', '0901000001', 'sv001@university.edu.vn', 'ACTIVE'),
('sv002', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Trần Thị Bình', 'STUDENT', '0901000002', 'sv002@university.edu.vn', 'ACTIVE'),
('sv003', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Lê Quốc Cường', 'STUDENT', '0901000003', 'sv003@university.edu.vn', 'ACTIVE'),
('manager', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Phạm Minh Quản', 'MANAGER', '0902000001', 'manager@ktx.edu.vn', 'ACTIVE'),
('accountant', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Lê Thu Ngân', 'ACCOUNTANT', '0903000001', 'accountant@ktx.edu.vn', 'ACTIVE'),
('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Võ Quản Trị', 'ADMIN', '0904000001', 'admin@ktx.edu.vn', 'ACTIVE');
GO

INSERT INTO Students (UserID, StudentCode, Gender, DateOfBirth, Faculty, ClassName, Status)
VALUES
(1, 'SV001', 'MALE', '2005-02-18', N'Công nghệ thông tin', 'D22CQCN01', 'ACTIVE'),
(2, 'SV002', 'FEMALE', '2005-09-09', N'Kế toán', 'D22KT02', 'ACTIVE'),
(3, 'SV003', 'MALE', '2004-12-05', N'Quản trị kinh doanh', 'D21QTKD03', 'ACTIVE');
GO

INSERT INTO Buildings (BuildingName, GenderScope, Notes)
VALUES
(N'Nhà A - Nam', 'MALE', N'Khu nam, gần sân thể thao'),
(N'Nhà B - Nữ', 'FEMALE', N'Khu nữ, gần thư viện'),
(N'Nhà C - Linh hoạt', 'ALL', N'Khu linh hoạt theo từng tầng');
GO

INSERT INTO Rooms (BuildingID, RoomCode, FloorNo, Capacity, PricePerMonth, GenderScope, RoomStatus, Notes)
VALUES
(1, 'A101', 1, 4, 450000, 'MALE', 'AVAILABLE', N'Gần cầu thang'),
(1, 'A102', 1, 4, 450000, 'MALE', 'AVAILABLE', N''),
(2, 'B201', 2, 6, 420000, 'FEMALE', 'AVAILABLE', N''),
(2, 'B202', 2, 6, 420000, 'FEMALE', 'AVAILABLE', N''),
(3, 'C301', 3, 4, 500000, 'ALL', 'AVAILABLE', N'Phòng dịch vụ'),
(3, 'C302', 3, 4, 500000, 'ALL', 'MAINTENANCE', N'Đang sửa chữa');
GO

INSERT INTO RegistrationPeriods (PeriodName, StartDate, EndDate, Status, Notes)
VALUES
(N'Đợt 1 học kỳ 1 năm 2026-2027', '2026-01-01', '2026-12-31', 'OPEN', N'Đợt đăng ký đang mở cho toàn KTX'),
(N'Đợt hè 2026', '2026-03-01', '2026-04-30', 'CLOSED', N'Đã kết thúc nhận hồ sơ'),
(N'Đợt dự thảo học kỳ 2', '2027-01-01', '2027-01-31', 'DRAFT', N'Chưa mở cho sinh viên');
GO

INSERT INTO Applications (StudentID, PeriodID, PreferredBuildingID, DurationMonths, AttachmentUrl, TotalAmount, Status, SubmittedAt, ApprovedBy, ApprovedAt, AssignedRoomID, CheckInDate, CheckOutDate, Note)
VALUES
(1, 1, 1, 6, NULL, NULL, 'PENDING', '2026-05-03T09:10:00', NULL, NULL, NULL, NULL, NULL, N'Chờ cán bộ duyệt'),
(2, 1, 2, 6, NULL, 2520000, 'APPROVED', '2026-05-02T10:20:00', 4, '2026-05-04T10:00:00', 3, NULL, NULL, N'Hồ sơ hợp lệ'),
(3, 1, 1, 4, NULL, 1800000, 'CHECKED_IN', '2026-05-01T08:15:00', 4, '2026-05-02T09:00:00', 1, '2026-05-05', NULL, N'Đã nhận phòng');
GO

INSERT INTO Payments (ApplicationID, Amount, PaymentMethod, TransactionCode, PaymentStatus, PaidAt, ConfirmedBy, Note)
VALUES
(2, 1500000, 'TRANSFER', 'GD20260504001', 'PENDING', '2026-05-04T13:15:00', NULL, N'Sinh viên chuyển trước một phần'),
(3, 1800000, 'TRANSFER', 'GD20260505001', 'CONFIRMED', '2026-05-05T08:30:00', 5, N'Đã đối soát đủ tiền');
GO

INSERT INTO Requests (ApplicationID, RequestType, Title, Content, Status, CreatedAt, ProcessedBy, ProcessedAt, ResultNote)
VALUES
(2, 'FEEDBACK', N'Cần kiểm tra ổ điện', N'Ổ điện gần bàn học bị lỏng, mong cán bộ kiểm tra.', 'PENDING', '2026-05-05T07:35:00', NULL, NULL, NULL),
(3, 'INCIDENT', N'Bóng đèn bị hỏng', N'Bóng đèn phòng A101 bị chập chờn.', 'DONE', '2026-05-06T18:20:00', 4, '2026-05-07T09:00:00', N'Đã thay bóng đèn mới');
GO
