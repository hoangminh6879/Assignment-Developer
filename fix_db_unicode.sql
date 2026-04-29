-- SCRIPT SỬA LỖI UNICODE "VẠN NĂNG" (PHIÊN BẢN CỰC MẠNH)
-- Script này sẽ tự động tìm và xóa các ràng buộc đang chặn việc đổi kiểu dữ liệu.

USE HomestayDev; 
GO

-- 1. XỬ LÝ BẢNG room_types (Cột name có ràng buộc Unique)
DECLARE @ConstraintName NVARCHAR(255);
SELECT @ConstraintName = name FROM sys.objects 
WHERE parent_object_id = OBJECT_ID('room_types') AND type = 'UQ'; -- Tìm Unique Constraint

IF @ConstraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE room_types DROP CONSTRAINT ' + @ConstraintName);
    PRINT 'Da xoa rang buoc: ' + @ConstraintName;
END

-- Đổi kiểu dữ liệu
ALTER TABLE room_types ALTER COLUMN name NVARCHAR(255) NOT NULL;
ALTER TABLE room_types ALTER COLUMN description NVARCHAR(MAX);

-- Thêm lại ràng buộc Unique với tên chuẩn
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_RoomType_Name')
BEGIN
    ALTER TABLE room_types ADD CONSTRAINT UQ_RoomType_Name UNIQUE (name);
END
GO

-- 2. XỬ LÝ BẢNG rooms
ALTER TABLE rooms ALTER COLUMN name NVARCHAR(255) NOT NULL;
GO

-- 3. XỬ LÝ BẢNG homestays
ALTER TABLE homestays ALTER COLUMN name NVARCHAR(255) NOT NULL;
ALTER TABLE homestays ALTER COLUMN description NVARCHAR(MAX);
ALTER TABLE homestays ALTER COLUMN address NVARCHAR(255) NOT NULL;
ALTER TABLE homestays ALTER COLUMN city NVARCHAR(255) NOT NULL;
ALTER TABLE homestays ALTER COLUMN admin_reason NVARCHAR(MAX);
GO

-- 4. DỌN DẸP DỮ LIỆU 'undefined'
UPDATE homestays SET address = N'Vui lòng cập nhật' WHERE address = 'undefined' OR address IS NULL;
UPDATE homestays SET city = N'Vui lòng cập nhật' WHERE city = 'undefined' OR city IS NULL;
GO

PRINT '=== DA HOAN THANH CAP NHAT UNICODE ===';
PRINT 'Hay khoi dong lai Backend va kiem tra.';
GO

-- Kiểm tra lại kiểu dữ liệu thực tế
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME IN ('room_types', 'rooms', 'homestays') AND DATA_TYPE = 'nvarchar';
