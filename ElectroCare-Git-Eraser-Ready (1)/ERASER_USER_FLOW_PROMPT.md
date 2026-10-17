# Prompt Eraser.io — ElectroCare User Flow (source-grounded)

Tạo **User Flow diagram** cho hệ thống ElectroCare dựa CHỈ trên mã nguồn repository này. Đọc trước các file `giao-dien/ung-dung.js`, `giao-dien/trang-chu.html`, `may-chu/may-chu.js`, `co-so-du-lieu/tao-co-so-du-lieu.sql` và `co-so-du-lieu/nhap-tai-khoan-cu.sql`. Đây là user flow, không phải kiến trúc hệ thống, ERD hay UML class diagram.

## Quy tắc độ chính xác
- Không tự thêm tính năng, màn hình, vai trò, trường nhập liệu hoặc nhánh nghiệp vụ không được hỗ trợ bởi mã nguồn.
- Dùng nhãn tiếng Việt trong node; giữ nguyên tên trạng thái nghiệp vụ tiếng Việt như trong mã nguồn.
- Vẽ theo hướng trái sang phải, chia thành 4 swimlanes: **Khách truy cập**, **Khách hàng**, **Kỹ thuật viên**, **Quản trị viên**. Có thể đặt điểm bắt đầu/kết thúc chung ngoài swimlane.
- Hình bầu dục cho Bắt đầu/Kết thúc; hình chữ nhật cho màn hình/hành động; hình thoi cho điều kiện; mũi tên có nhãn cho kết quả/điều kiện. Giữ sơ đồ dễ đọc, không nối chéo tùy tiện.
- Chỉ đưa luồng xác nhận từ code vào sơ đồ chính. Các chi tiết chưa xác định rõ phải ghi chú “Cần xác minh”, không tự suy luận.
- Đừng đưa API key, mật khẩu, JWT secret, mã mời mẫu hoặc thông tin bí mật vào sơ đồ.

## Điểm vào chung và điều hướng đã thấy trong frontend
Từ điều hướng chính, người dùng có thể vào: **Trang chủ**, **Dịch vụ & linh kiện**, **Cửa hàng**, **Tra cứu sửa chữa**, **Bảo hành**, **AI chẩn đoán**, **Đăng nhập**; khi đã đăng nhập, điều hướng hiện mục theo vai trò và nút **Đăng xuất**. Trang chủ có CTA **Đặt lịch sửa chữa** và **Tra cứu phiếu**.

## Luồng Khách truy cập
1. Bắt đầu → Trang chủ.
2. Có thể mở Dịch vụ & linh kiện để xem dịch vụ và linh kiện; API hỗ trợ danh sách dịch vụ và tìm/lọc/sắp xếp linh kiện theo từ khóa, danh mục và giá/tên. Không khẳng định hành vi bộ lọc cụ thể nào khác ngoài code.
3. Có thể mở Cửa hàng để xem danh sách cửa hàng.
4. Có thể mở Tra cứu sửa chữa → nhập mã phiếu → gửi tra cứu → nếu tìm thấy, hiển thị chi tiết/trạng thái/tiến độ/báo giá/lịch sử; nếu không tìm thấy hoặc lỗi thì hiển thị thông báo lỗi. API tra cứu ticket không yêu cầu auth trong route.
5. Có thể mở Bảo hành → nhập mã phiếu → kiểm tra. API chỉ trả kết quả bảo hành cho phiếu có trạng thái **Đã bàn giao**; nhánh không đủ điều kiện/không tìm thấy hiển thị lỗi. Thời hạn bảo hành được tính 180 ngày từ thời điểm bàn giao thực tế hoặc created_at theo SQL API.
6. Có thể mở Đăng nhập → chọn vai trò.

## Luồng xác thực — ba vai trò tách biệt
Màn hình chọn vai trò có **Khách hàng**, **Kỹ thuật viên**, **Quản trị viên**. Mỗi vai trò có hành động **Đăng nhập** và **Tạo tài khoản**.
- Đăng ký: nhập họ tên, email, mật khẩu tối thiểu 6 ký tự; với Kỹ thuật viên và Quản trị viên còn nhập mã mời. Khách hàng không cần mã mời.
- Đăng nhập: nhập email và mật khẩu theo vai trò đã chọn.
- Thành công: phiên người dùng được lưu ở frontend và chuyển sang khu vực phù hợp theo vai trò.
- Thất bại: hiển thị thông báo; cho phép thử lại/chọn vai trò khác theo giao diện.
- Đăng xuất: xóa token và thông tin người dùng phía frontend, trở về Trang chủ.
Không ghi mã mời cụ thể hay thông tin bí mật vào sơ đồ.

## Luồng Khách hàng đã đăng nhập
1. Từ Dashboard khách hàng xem danh sách phiếu của mình, các số liệu tổng phiếu/chưa bàn giao/chờ duyệt báo giá/đã bàn giao và mở chi tiết phiếu.
2. Chọn **Đặt lịch mới** hoặc CTA đặt lịch.
3. Điều kiện: nếu chưa đăng nhập, hệ thống yêu cầu đăng nhập bằng vai trò Khách hàng rồi quay lại quy trình đặt lịch.
4. Form đặt lịch gồm: thiết bị, thương hiệu, số điện thoại, mô tả lỗi, ảnh tùy chọn, chọn một hoặc nhiều dịch vụ, ngày và giờ hẹn, địa điểm/thông tin liên hệ theo form thực tế. Gửi form tạo booking và lưu các dịch vụ đã chọn.
5. Thành công → phiếu sửa chữa có mã phiếu → khách hàng theo dõi từ Dashboard hoặc Tra cứu sửa chữa. Lỗi validation/API → hiển thị thông báo và cho phép sửa/gửi lại.
6. AI chẩn đoán: nhập thiết bị, triệu chứng, ảnh tùy chọn → gửi phân tích Gemini → xem gợi ý nguyên nhân, dịch vụ/linh kiện liên quan và giá tham khảo. Kết quả AI chỉ tham khảo, kỹ thuật viên cần kiểm tra thực tế. Nếu người dùng chọn đặt lịch từ kết quả AI, dữ liệu thiết bị/triệu chứng và dịch vụ gợi ý có thể được đưa sang form đặt lịch theo frontend. API chẩn đoán yêu cầu đăng nhập.
7. Khi phiếu có báo giá và khách hàng chưa duyệt, mở chi tiết phiếu → xem chẩn đoán/chi phí công/chi phí linh kiện/tổng chi phí → **Duyệt báo giá** → hệ thống ghi nhận quyết định.
8. Xem trạng thái/tiến độ/timeline và lịch bàn giao; sau bàn giao có thể tra cứu bảo hành bằng mã phiếu. Không thêm chức năng hủy/sửa lịch nếu không thấy trong mã nguồn.

## Luồng Kỹ thuật viên
1. Chọn vai trò Kỹ thuật viên → đăng nhập (hoặc đăng ký với mã mời) → Dashboard kỹ thuật viên.
2. Dashboard chia nhóm phiếu: **Sắp tới bàn giao**, **Chưa tới bàn giao**, **Chưa hoàn thành**, **Sẵn sàng bàn giao**, **Đã xong**, **Quá hạn bàn giao**; mỗi phiếu hiển thị mã phiếu, khách hàng, thiết bị, trạng thái, thời gian bàn giao dự kiến và thao tác mở phiếu.
3. Mở phiếu được phân công → xem chi tiết/timeline.
4. Cập nhật trạng thái/tiến độ/ghi chú và thời gian bàn giao dự kiến theo form hỗ trợ; phân biệt lỗi quyền nếu phiếu không được phân công cho kỹ thuật viên.
5. Lập báo giá gồm chẩn đoán, chi phí công và chi phí linh kiện → báo giá chờ khách hàng duyệt.
6. Xem/tạo checklist kiểm tra cho phiếu.
7. Khi sẵn sàng bàn giao → xác nhận bàn giao kèm ghi chú → trạng thái phiếu được cập nhật.
Không vẽ bước tự động thanh toán vì không thấy API thanh toán trong source.

## Luồng Quản trị viên
1. Chọn vai trò Quản trị viên → đăng nhập (hoặc đăng ký với mã mời) → Dashboard quản trị.
2. Dashboard xem số liệu: tổng phiếu, đang xử lý, sẵn sàng bàn giao, quá hạn bàn giao, khách hàng, kỹ thuật viên.
3. Xem danh sách phiếu và phân công kỹ thuật viên từ danh sách nhân sự; API kiểm tra người được chọn có vai trò staff.
4. Xem tải công việc kỹ thuật viên, gồm số phiếu được giao/đang hoạt động/sẵn sàng bàn giao và các thông tin bàn giao có trong API.
5. Quản lý người dùng: xem danh sách người dùng và đổi vai trò trong các giá trị customer/staff/admin; API chặn tự hạ vai trò tài khoản admin hiện tại.
6. Quản lý dịch vụ: xem danh sách, thêm dịch vụ, cập nhật thông tin/giá/danh mục/trạng thái hoạt động.
7. Quản lý linh kiện: xem danh sách, thêm linh kiện và cập nhật thông tin như tên, thương hiệu, danh mục, thông số, dung lượng, tồn kho, giá/trạng thái theo API.
8. Mở phiếu xem chi tiết; theo dõi phân công và lịch bàn giao.

## Trạng thái phiếu cần thể hiện đúng thứ tự timeline trong frontend
**Đã đặt lịch → Đã tiếp nhận → Đã phân công → Đang kiểm tra → Chờ duyệt báo giá → Đang sửa chữa → Kiểm tra chất lượng → Sẵn sàng bàn giao → Đã bàn giao**.
Nếu backend có trạng thái bổ sung như **Đã hủy**, chỉ thêm như nhánh phụ khi được thể hiện trong code; không tự chèn nó vào chuỗi timeline chính.

## Điều kiện đầu ra
- Sơ đồ thể hiện user flow, không phải sơ đồ endpoint/API.
- Bao gồm các quyết định chính: đã đăng nhập chưa; vai trò nào; xác thực thành công/thất bại; tìm thấy mã phiếu hay không; phiếu đã bàn giao chưa; khách hàng có báo giá cần duyệt hay không; AI trả kết quả/lỗi; phân công kỹ thuật viên hợp lệ hay không.
- Đặt nhãn điều kiện trên nhánh, ví dụ `[Có]`, `[Không]`, `[Thành công]`, `[Thất bại]`.
- Giữ chi tiết đủ để đối chiếu mã nguồn nhưng bố cục gọn; dùng nhóm/swimlane theo vai trò.
- Cuối cùng, liệt kê ngắn các điểm trong source chưa đủ rõ để khẳng định và đánh dấu “Cần xác minh”, không tự lấp khoảng trống.
