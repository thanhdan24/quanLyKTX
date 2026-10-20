USE QLKTX_RutGon;
GO

/* Mat khau demo cho tat ca tai khoan: 123456 */
INSERT INTO Users (Username, PasswordHash, FullName, Role, Phone, Email, Status)
VALUES
('sv001', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Nguyễn Văn An', 'STUDENT', '0901000001', 'sv001@university.edu.vn', 'ACTIVE'),
('sv002', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Trần Thị Bình', 'STUDENT', '0901000002', 'sv002@university.edu.vn', 'ACTIVE'),
('sv003', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Lê Quốc Cường', 'STUDENT', '0901000003', 'sv003@university.edu.vn', 'ACTIVE'),
('manager', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Phạm Minh Quản', 'MANAGER', '0902000001', 'manager@ktx.edu.vn', 'ACTIVE'),
('accountant', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Lê Thu Ngân', 'ACCOUNTANT', '0903000001', 'accountant@ktx.edu.vn', 'ACTIVE'),
('admin', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', N'Võ Quản Trị', 'ADMIN', '0904000001', 'admin@ktx.edu.vn', 'ACTIVE');
GO
