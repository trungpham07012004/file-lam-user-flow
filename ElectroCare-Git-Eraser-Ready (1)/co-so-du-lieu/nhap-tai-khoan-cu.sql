-- Nhap tai khoan tu users.sql cu vao database ElectroCare moi.
-- Chi them email chua ton tai; khong xoa/ghi de tai khoan da co.
-- Truoc khi chay, hay sao luu database. Chay sau khi da import tao-co-so-du-lieu.sql.
SET NAMES utf8mb4;

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'Khách hàng Demo','customer@electrocare.local','3ce320d0effaec302cb7342607a34dbf:0c76c7131df65b12249f031daa65a53ff502807d814648d8eee015b03d6b488292aae80588a27217a223117b5e19e54c17aeb61d5a1efcc70efe626973233caa','customer','2026-10-02 08:18:18'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='customer@electrocare.local');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'Kỹ thuật viên Demo','staff@electrocare.local','d809961a54927f6d582d3d091aca4d17:5a2ebed9c6521a9b91c1bee9bd16c41d2373df639dd0455d4a0d2355e3ad9fa031d4b028d5c609802b3debe56a20f5cfe8ed285ec6487b807b53fcb06888df47','staff','2026-10-02 08:18:18'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='staff@electrocare.local');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'Quản trị viên Demo','admin@electrocare.local','81e83dc044b69ddd0d65fbed3fe9d319:67cf5faa91bea5458ecafe7a4206683b8e0f864a7906d3cb45c4b8fc0c16a6cac11b1f20fe38e1a1dd754f61d2ec87867363b77583f5e76723ce9a8be8b4fd4d','admin','2026-10-02 08:18:18'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@electrocare.local');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'Phạm Phước Long','trunghahabaka345@gmail.com','38304d26f988b7410372e1c29116b392:5a79c54cff1bdd01197cefbc776a0374f010158dca39ddcb26c0b0e2ee6375c00ee3a26e5837ef0ce2541f085688d42e65404d7971872d7b2ff861c23375049c','customer','2026-10-02 08:25:55'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='trunghahabaka345@gmail.com');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'phạm kim','trunghihu@gmail.com','14958c7fdf2ede8f11b8f70d6669f1ab:6a1edb4a7301fe72655266e40eb383a676767eecab3ff74c8a1c92866f5dd6c1435aed3f4e70d648db39d3ea95e46e351db712822571b64caf4aac0403f84f81','customer','2026-10-02 09:48:36'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='trunghihu@gmail.com');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'Trung Phạm','trungdodo345@gmail.com','7c5ace880fedd75b16dd17d7dc838696:d142f060e798fdf8ca1ae431a1fba758f76a8fcd05093155c34aa05fb3be73dda0c4140c3cf1140c13c609ee0831eb4aa59075f3ab85cf59a1f6e7fadbb35023','customer','2026-10-08 06:42:16'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='trungdodo345@gmail.com');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'Trung Phạm','trunghaha345@gmail.com','ba90fe489e34c56dba203be867760c25:6ccdbe7687b09b25ca32c3df265abfaff48847c1be7c7462e77e6d92c0a12eadfed84050ae9f7414717bbde3e8a0490c106315a9831a5fa2dfc7e4c0c898afb6','admin','2026-10-08 08:07:06'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='trunghaha345@gmail.com');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'phạm hoàng kiều anh','anhpham@gmail.com','1890a3aca3b7544184c9f166196a31bb:d8e507aaa9a6109ce3029e9a14b3fb4c1296a563d86261e3002014a49352761283b2c2e015368b3b4299de76ee36a6007c3e6fb858ff322469dd848a470e7eb5','staff','2026-10-08 08:13:06'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='anhpham@gmail.com');

INSERT INTO users (full_name,email,password_hash,role,created_at)
SELECT 'phuoctrung910','phuoctrung910@gmail.com','e0935aa6e52c645bd7723ae571ef0a3b:21e45c94c226304095b75ae44861c2f21f65e2730302c4c5cf8719161a86eb56c47fd14cf71a3337cfac0e5284bcf568abb121ce79a9e35a71c0fca2e5feaa89','customer','2026-10-09 02:48:22'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='phuoctrung910@gmail.com');

-- Kiem tra so tai khoan: SELECT id,full_name,email,role,created_at FROM users ORDER BY id;
