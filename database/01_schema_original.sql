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
