CREATE DATABASE IF NOT EXISTS electrocare_v2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE electrocare_v2;

CREATE TABLE IF NOT EXISTS users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 full_name VARCHAR(120) NOT NULL,
 email VARCHAR(160) UNIQUE NOT NULL,
 password_hash VARCHAR(255) NOT NULL,
 role ENUM('customer','staff','admin') DEFAULT 'customer',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(180) NOT NULL,
 category VARCHAR(100) DEFAULT 'Khác',
 price_min DECIMAL(12,0),
 price_max DECIMAL(12,0),
 description TEXT,
 active TINYINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stores (
 id INT AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(180) NOT NULL,
 area VARCHAR(120),
 address VARCHAR(255) NOT NULL,
 phone VARCHAR(40),
 hours VARCHAR(100),
 active TINYINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
 id INT AUTO_INCREMENT PRIMARY KEY,
 ticket_code VARCHAR(30) UNIQUE NOT NULL,
 user_id INT NULL,
 customer_name VARCHAR(120) NOT NULL,
 phone VARCHAR(30) NOT NULL,
 device VARCHAR(80) NOT NULL,
 brand VARCHAR(80),
 service VARCHAR(180),
 booking_date DATE NOT NULL,
 booking_time TIME NOT NULL,
 location VARCHAR(40),
 symptom TEXT NOT NULL,
 image_path VARCHAR(255),
 status VARCHAR(60) DEFAULT 'Đã đặt lịch',
 progress INT DEFAULT 0,
 technician_id INT NULL,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
 FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS repair_logs (
 id INT AUTO_INCREMENT PRIMARY KEY,
 booking_id INT NOT NULL,
 status VARCHAR(80),
 note TEXT,
 image_path VARCHAR(255),
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS repair_quotes (
 id INT AUTO_INCREMENT PRIMARY KEY,
 booking_id INT NOT NULL,
 diagnosis TEXT,
 labor_cost DECIMAL(12,0) DEFAULT 0,
 parts_cost DECIMAL(12,0) DEFAULT 0,
 total_cost DECIMAL(12,0) DEFAULT 0,
 customer_approved TINYINT DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parts (
 id INT AUTO_INCREMENT PRIMARY KEY,
 part_code VARCHAR(80) UNIQUE,
 name VARCHAR(180) NOT NULL,
 brand VARCHAR(80),
 stock INT DEFAULT 0,
 price DECIMAL(12,0) DEFAULT 0,
 active TINYINT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS part_compatibility (
 id INT AUTO_INCREMENT PRIMARY KEY,
 part_id INT NOT NULL,
 device_model VARCHAR(180) NOT NULL,
 FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS booking_parts (
 id INT AUTO_INCREMENT PRIMARY KEY,
 booking_id INT NOT NULL,
 part_id INT NOT NULL,
 quantity INT DEFAULT 1,
 unit_price DECIMAL(12,0) DEFAULT 0,
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
 FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS checklists (
 id INT AUTO_INCREMENT PRIMARY KEY,
 booking_id INT NOT NULL,
 speaker_ok TINYINT DEFAULT 0,
 keyboard_ok TINYINT DEFAULT 0,
 camera_ok TINYINT DEFAULT 0,
 screen_ok TINYINT DEFAULT 0,
 wifi_ok TINYINT DEFAULT 0,
 charging_ok TINYINT DEFAULT 0,
 notes TEXT,
 checked_by INT NULL,
 checked_at TIMESTAMP NULL,
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
 FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reviews (
 id INT AUTO_INCREMENT PRIMARY KEY,
 booking_id INT NOT NULL,
 user_id INT NOT NULL,
 rating TINYINT NOT NULL,
 comment TEXT,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vouchers (
 id INT AUTO_INCREMENT PRIMARY KEY,
 code VARCHAR(50) UNIQUE NOT NULL,
 discount_percent INT DEFAULT 0,
 discount_amount DECIMAL(12,0) DEFAULT 0,
 active TINYINT DEFAULT 1,
 expires_at DATETIME NULL
);

INSERT INTO services(name,price_min,price_max,description)
SELECT 'Vệ sinh & bảo dưỡng laptop',150000,350000,'Vệ sinh bụi, kiểm tra tản nhiệt'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Vệ sinh & bảo dưỡng laptop');
INSERT INTO services(name,price_min,price_max,description)
SELECT 'Thay keo tản nhiệt',180000,450000,'Thay keo và kiểm tra nhiệt độ'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Thay keo tản nhiệt');
INSERT INTO services(name,price_min,price_max,description)
SELECT 'Sửa/thay quạt tản nhiệt',350000,950000,'Kiểm tra và thay quạt tương thích'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Sửa/thay quạt tản nhiệt');
INSERT INTO services(name,price_min,price_max,description)
SELECT 'Sửa màn hình laptop',900000,3500000,'Kiểm tra panel, cáp màn hình'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Sửa màn hình laptop');


INSERT INTO services(name,price_min,price_max,description)
SELECT 'Thay pin laptop / MacBook',700000,3200000,'Kiểm tra pin, chu kỳ sạc và thay pin tương thích'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Thay pin laptop / MacBook');
INSERT INTO services(name,price_min,price_max,description)
SELECT 'Sửa nguồn / mainboard',500000,2500000,'Kiểm tra mạch nguồn, IC và linh kiện trên mainboard'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Sửa nguồn / mainboard');
INSERT INTO services(name,price_min,price_max,description)
SELECT 'Cài đặt & xử lý phần mềm',150000,600000,'Cài hệ điều hành, driver, xử lý lỗi phần mềm'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Cài đặt & xử lý phần mềm');
INSERT INTO services(name,price_min,price_max,description)
SELECT 'Sửa điện thoại / tablet',250000,3500000,'Kiểm tra màn hình, pin, sạc, loa và mainboard'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE name='Sửa điện thoại / tablet');
INSERT INTO stores(name,area,address,phone,hours)
SELECT 'ElectroCare Hải Châu','Hải Châu','123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng','1800 2026','08:00 - 20:00'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name='ElectroCare Hải Châu');
INSERT INTO stores(name,area,address,phone,hours)
SELECT 'ElectroCare Thanh Khê','Thanh Khê','88 Hàm Nghi, Thanh Khê, Đà Nẵng','1800 2026','08:00 - 20:00'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name='ElectroCare Thanh Khê');
INSERT INTO stores(name,area,address,phone,hours)
SELECT 'ElectroCare Ngũ Hành Sơn','Ngũ Hành Sơn','101 Nguyễn Văn Thoại, Ngũ Hành Sơn, Đà Nẵng','1800 2026','08:00 - 20:00'
WHERE NOT EXISTS (SELECT 1 FROM stores WHERE name='ElectroCare Ngũ Hành Sơn');

-- Tài khoản demo để test 3 vai trò. Mật khẩu của cả 3: 123456
INSERT INTO users(full_name,email,password_hash,role)
SELECT 'Khách hàng Demo','customer@electrocare.local','3ce320d0effaec302cb7342607a34dbf:0c76c7131df65b12249f031daa65a53ff502807d814648d8eee015b03d6b488292aae80588a27217a223117b5e19e54c17aeb61d5a1efcc70efe626973233caa','customer'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='customer@electrocare.local');
INSERT INTO users(full_name,email,password_hash,role)
SELECT 'Kỹ thuật viên Demo','staff@electrocare.local','d809961a54927f6d582d3d091aca4d17:5a2ebed9c6521a9b91c1bee9bd16c41d2373df639dd0455d4a0d2355e3ad9fa031d4b028d5c609802b3debe56a20f5cfe8ed285ec6487b807b53fcb06888df47','staff'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='staff@electrocare.local');
INSERT INTO users(full_name,email,password_hash,role)
SELECT 'Quản trị viên Demo','admin@electrocare.local','81e83dc044b69ddd0d65fbed3fe9d319:67cf5faa91bea5458ecafe7a4206683b8e0f864a7906d3cb45c4b8fc0c16a6cac11b1f20fe38e1a1dd754f61d2ec87867363b77583f5e76723ce9a8be8b4fd4d','admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@electrocare.local');

INSERT INTO parts(part_code,name,brand,stock,price)
SELECT 'FAN-ASUS-001','Quạt tản nhiệt laptop ASUS','ASUS',10,450000
WHERE NOT EXISTS (SELECT 1 FROM parts WHERE part_code='FAN-ASUS-001');
INSERT INTO part_compatibility(part_id,device_model)
SELECT p.id,'ASUS VivoBook 15' FROM parts p WHERE p.part_code='FAN-ASUS-001' AND NOT EXISTS (SELECT 1 FROM part_compatibility pc WHERE pc.part_id=p.id AND pc.device_model='ASUS VivoBook 15');

-- ============================================================
-- NÂNG CẤP VẬN HÀNH THỰC TẾ
-- ============================================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS expected_handover_at DATETIME NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_handover_at DATETIME NULL;
ALTER TABLE parts ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Khác';
ALTER TABLE parts ADD COLUMN IF NOT EXISTS specification VARCHAR(255) DEFAULT '';
ALTER TABLE parts ADD COLUMN IF NOT EXISTS capacity VARCHAR(80) DEFAULT '';

CREATE TABLE IF NOT EXISTS booking_services (
 id INT AUTO_INCREMENT PRIMARY KEY,
 booking_id INT NOT NULL,
 service_id INT NOT NULL,
 unit_price_min DECIMAL(12,0) DEFAULT 0,
 unit_price_max DECIMAL(12,0) DEFAULT 0,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_booking_service (booking_id,service_id),
 FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
 FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT
);

-- Một số dữ liệu linh kiện để trang danh mục có thể lọc theo loại, giá và dung lượng.
INSERT INTO parts(part_code,name,brand,category,specification,capacity,stock,price)
SELECT 'RAM-DDR4-8','RAM Laptop DDR4 8GB','Kingston','RAM','DDR4 3200MHz','8GB',20,420000
WHERE NOT EXISTS (SELECT 1 FROM parts WHERE part_code='RAM-DDR4-8');
INSERT INTO parts(part_code,name,brand,category,specification,capacity,stock,price)
SELECT 'RAM-DDR4-16','RAM Laptop DDR4 16GB','Kingston','RAM','DDR4 3200MHz','16GB',15,780000
WHERE NOT EXISTS (SELECT 1 FROM parts WHERE part_code='RAM-DDR4-16');
INSERT INTO parts(part_code,name,brand,category,specification,capacity,stock,price)
SELECT 'SSD-NVME-512','SSD NVMe 512GB','WD','SSD','PCIe NVMe','512GB',12,990000
WHERE NOT EXISTS (SELECT 1 FROM parts WHERE part_code='SSD-NVME-512');
INSERT INTO parts(part_code,name,brand,category,specification,capacity,stock,price)
SELECT 'SSD-NVME-1TB','SSD NVMe 1TB','WD','SSD','PCIe NVMe','1TB',10,1590000
WHERE NOT EXISTS (SELECT 1 FROM parts WHERE part_code='SSD-NVME-1TB');
INSERT INTO parts(part_code,name,brand,category,specification,capacity,stock,price)
SELECT 'BAT-MAC-001','Pin MacBook tương thích','Green Cell','Pin','Pin lithium tương thích','',8,1850000
WHERE NOT EXISTS (SELECT 1 FROM parts WHERE part_code='BAT-MAC-001');

ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Khác';
