# Mockup giao diện ITAM

Mockup bấm được của toàn bộ hệ thống (7 module và phần nền tảng), dựng từ tài liệu nghiệp vụ chi tiết. Đây là bản thiết kế giao diện để duyệt trước khi làm tính năng: dữ liệu là dữ liệu mẫu, không có server, mọi thao tác chỉ chạy trong bộ nhớ của trang và mất khi tải lại.

## Mở mockup

Bấm đúp `index.html`, hoặc chạy một máy chủ tĩnh rồi mở `http://127.0.0.1:8765`:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory mockup
```

## Cách duyệt

- **Dải vàng trên cùng** là công cụ của mockup, không thuộc sản phẩm:
  - **Xem với vai trò**: đổi giữa sáu vai trò. Menu, nút và màn hình đổi theo bảng quyền (NT-2 và mục 13 của tài liệu). Vai trò Nhân viên chỉ thấy cổng tự phục vụ.
  - **Chú thích**: bật thì mỗi màn có chip mã nghiệp vụ (xanh: đã có code, cam: một phần, xám: chưa có), khung tím là điểm cần chốt (CC-x), khung vàng là ghi chú của mockup. Tắt để xem giao diện sạch.
  - **Bản đồ màn hình**: đối chiếu đủ 93 nghiệp vụ với màn hình, và bảng menu mỗi vai trò thấy.
  - **Luồng nghiệp vụ**: sáu luồng đi qua nhiều module, mỗi bước mở đúng màn thực hiện bước đó.
  - **Giao diện**: gạt giữa giao diện theo trang mẫu Stitch (mặc định, `css/skin-stitch.css`) và giao diện "Phòng thiết bị" của ứng dụng hiện tại.
- Thêm `?capture` vào địa chỉ (ví dụ `http://127.0.0.1:8765/?capture#/assets`) để ẩn dải vàng và chú thích. Chế độ này dùng khi chụp các màn sang Figma.
- Màn đăng nhập ở `#/login`: gõ tên đăng nhập của một vai trò (quan.tm, nam.lh, ha.pt, anh.nd, huong.vt, linh.dm) với mật khẩu bất kỳ từ 8 ký tự.

## Cấu trúc

| Tệp | Nội dung |
| :--- | :--- |
| `index.html` | Khung trang, nạp các tệp bên dưới theo thứ tự |
| `css/mockup.css` | Giao diện gốc, dùng lại bảng màu và kiểu chữ của ứng dụng thật (`server/static/style.css`) |
| `css/skin-stitch.css` | Giao diện theo trang mẫu Stitch: thanh bên navy, màu chính `#2563EB`, chữ Inter, nhãn trạng thái có chấm màu |
| `js/core.js` | Router theo hash, vai trò và quyền, menu thanh bên, các hàm dựng thành phần (`M.page`, `M.table`, `M.panel`, `M.tabs`, hộp thoại…) |
| `js/data.js` | Dữ liệu mẫu dùng chung: đơn vị, phòng ban, vị trí, danh mục, nhân viên, tài khoản, tài sản, biên bản, phụ kiện, thông báo |
| `js/coverage.js` | Bảng đối chiếu 93 nghiệp vụ với màn hình, và sáu luồng nghiệp vụ |
| `js/screens-common.js` | Đăng nhập, dashboard theo vai trò, thông báo, tìm kiếm toàn cục, cài đặt, bản đồ màn hình, luồng nghiệp vụ |
| `js/screens-assets.js` | Module 2: tài sản, cấp phát, thu hồi, phụ kiện, linh kiện, vật tư, biên bản, kiểm kê, thanh lý, in tem, nhập từ tệp |
| `js/screens-discovery.js` | Module 1: agent, quét mạng, nghi trùng, thay đổi phần cứng |
| `js/screens-software.js` | Module 3: phần mềm, bản quyền, lỗ hổng, EOL, tuân thủ, SSL |
| `js/screens-service.js` | Module 4: ticket, phê duyệt, vấn đề, thay đổi, CMDB, tri thức, SLA |
| `js/screens-portal.js` | Cổng tự phục vụ cho nhân viên |
| `js/screens-finance.js` | Module 5: nhà cung cấp, đơn mua, hợp đồng, bảo hành, khấu hao |
| `js/screens-automation.js` | Module 6: gói cài, đợt triển khai, script từ xa |
| `js/screens-reports.js` | Module 7: báo cáo dựng sẵn, trình tạo báo cáo, SQL, lịch gửi |
| `js/screens-admin.js` | Danh mục dùng chung và quản trị: nhân viên, vị trí, tài khoản, nhật ký kiểm toán, thông báo, SSO, API, HRM |

Thêm một màn: gọi `M.screen("duong-dan", { nav, title, codes, render })` trong tệp của module, và thêm mục menu vào `M.NAV` trong `core.js` nếu cần.
