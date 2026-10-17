# ElectroCare — GitHub và Eraser.io

## Lưu ý bảo mật
Bản ZIP này không chứa `may-chu/.env`. Không commit `.env`, API key Gemini, mật khẩu DB hoặc JWT secret lên GitHub. Hãy giữ file `.env` cục bộ trên máy và tạo từ `may-chu/.env.example` nếu cần. Nếu API key từng bị đưa lên ảnh/chia sẻ, hãy thu hồi và tạo key mới.

## Tạo Git repository cục bộ
Mở PowerShell tại thư mục gốc chứa `may-chu`, `giao-dien`, `co-so-du-lieu`, rồi chạy:

```powershell
git init
git add .
git status
git commit -m "Initial ElectroCare source for user flow"
```

Kiểm tra `git status` và bảo đảm `.env` không xuất hiện trong danh sách file được thêm. Nếu Git chưa có tên/email, cấu hình `git config --global user.name "Ten cua ban"` và `git config --global user.email "email-cua-ban"`.

## Đẩy lên GitHub
1. Tạo repository mới trên GitHub, để trống (không thêm README/license/gitignore).
2. Sao chép URL repository của chính bạn.
3. Chạy các lệnh sau, thay URL bằng URL GitHub thật:

```powershell
git branch -M main
git remote add origin https://github.com/TEN-TAI-KHOAN/TEN-REPO.git
git push -u origin main
```

Không dùng URL ví dụ nguyên văn.

## Làm User Flow trên Eraser.io
Mở Eraser.io, tạo diagram mới, chọn diagram-as-code / flowchart nếu có, rồi dán nội dung trong `ERASER_USER_FLOW_PROMPT.md` vào Eraser AI. Nếu Eraser có thể import GitHub repository, kết nối repository của bạn; nếu không, dùng prompt đã soạn từ mã nguồn này.

## Cơ sở xác định luồng
Luồng được rút từ `giao-dien/ung-dung.js`, API trong `may-chu/may-chu.js` và schema trong `co-so-du-lieu/tao-co-so-du-lieu.sql`. Những nhánh được thể hiện là các thao tác được hỗ trợ bởi mã nguồn; không nên hiểu là đã kiểm thử end-to-end trên máy chạy thật.
