# ITAM

Ứng dụng web quản lý tài sản CNTT trong công ty. Nó ghi lại công ty đang có những thiết bị nào, ai đang giữ từng thiết bị và thiết bị đó đang ở trạng thái gì.

## Tính năng

- Quản lý danh mục thiết bị (Laptop, PC, Màn hình…), vị trí hoặc phòng ban, và danh sách nhân viên.
- Thêm, sửa và tìm tài sản theo mã, tên, serial hoặc người đang giữ. Mỗi tài sản có một mã riêng; nếu để trống, hệ thống tự tạo mã dạng `TS-000001`.
- Cấp phát tài sản cho một nhân viên hoặc một vị trí, và thu hồi khi người đó trả lại.
- Theo dõi 5 trạng thái: Sẵn sàng cấp phát, Đang sử dụng, Đang sửa chữa, Hỏng / Chờ thanh lý, Đã thanh lý. Tài sản đã thanh lý thì không đổi trạng thái được nữa.
- Mỗi lần thêm, sửa, cấp phát, thu hồi hay đổi trạng thái đều được ghi vào nhật ký của tài sản đó.
- Mỗi tài sản có mã QR và tem để in dán lên thiết bị.
- Kiểm tra dữ liệu nhập: email phải đúng dạng và không trùng giữa hai nhân viên, họ tên không chứa số, mã và serial không được trùng.
- Hãng sản xuất và model được lưu riêng, nên form tài sản gợi ý các hãng và model đã nhập trước đó. Hai ô này đi cùng nhau: nhập cả hai hoặc để trống cả hai.
- Danh mục thuộc về model chứ không thuộc từng tài sản: mọi tài sản cùng model có cùng danh mục, và tài sản chưa nhập hãng, model thì chưa có danh mục.
- Giao diện mặc định theo cài đặt sáng/tối của máy; sau khi đăng nhập có thể đổi sang sáng hoặc tối trong trang Cài đặt.
- Phải đăng nhập mới dùng được, và mỗi tài khoản có một trong sáu vai trò (xem bảng dưới). Nhật ký của tài sản ghi cả tài khoản đã thao tác.

## Tài khoản và vai trò

| Vai trò | Được làm gì |
|---|---|
| Quản trị hệ thống | Toàn quyền: thêm và sửa tài sản, đổi trạng thái, danh mục, vị trí, duyệt, khóa, đổi vai trò tài khoản |
| Quản trị hạ tầng | Xem toàn bộ. Các quyền riêng (cấu hình quét, chạy script từ xa) đã khai báo sẵn cho các module sau |
| Quản lý tài sản | Xem toàn bộ, thêm và sửa nhân viên, cấp phát và thu hồi tài sản |
| Helpdesk | Xem toàn bộ, để tra cứu thiết bị và lịch sử của người báo lỗi |
| Kiểm toán | Xem toàn bộ, không sửa gì |
| Nhân viên | Chỉ xem tài sản đang giao cho chính mình |

Ai cũng tự đăng ký được và chọn vai trò mong muốn (trừ Quản trị hệ thống), nhưng tài khoản mới phải chờ quản trị hệ thống duyệt rồi mới đăng nhập được; khi duyệt có thể đổi vai trò. Tài khoản quản trị đầu tiên lấy từ `.env`. Trang Tài khoản có bảng quyền theo vai trò đúng như server đang áp dụng.
Tài khoản đăng nhập khác với mục Nhân viên trên menu: Nhân viên là danh sách người nhận tài sản, không cần có tài khoản. Quản trị hệ thống nối một tài khoản với một hồ sơ nhân viên ở trang Tài khoản; tài khoản vai trò Nhân viên phải được nối thì mới thấy tài sản của mình.

Bấm vào tên mình ở góc phải thanh trên để mở menu tài khoản: mục Cài đặt cho đổi họ tên, đổi mật khẩu và chọn giao diện; Đăng xuất cũng nằm ở đây.

Tài khoản đã từng thao tác trên tài sản thì không xóa được, chỉ khóa được, để nhật ký luôn còn tên người làm.

## Công nghệ

Server viết bằng Python (FastAPI, SQLAlchemy), dữ liệu lưu trong MySQL 8.0. Giao diện là HTML, CSS và JavaScript thuần do chính server phục vụ, nên không cần cài Node.js.

## Chạy trên một máy mới

Máy cần có Python 3.10 trở lên, MySQL 8.0 (và mật khẩu của user `root`) cùng Git. Các lệnh dưới đây dùng PowerShell trên Windows.

1. Tải code về và vào thư mục `server`:

   ```powershell
   git clone https://github.com/hienphung910/IT-Asset-Management.git
   cd IT-Asset-Management\server
   ```

2. Tạo môi trường Python riêng rồi cài thư viện:

   ```powershell
   python -m venv .venv
   .venv\Scripts\python -m pip install -r requirements.txt
   ```

3. Tạo file cấu hình từ file mẫu, sau đó mở `.env`, điền mật khẩu MySQL vào dòng `DB_PASSWORD=` và đặt mật khẩu cho tài khoản admin đầu tiên ở dòng `ADMIN_PASSWORD=` (ít nhất 8 ký tự):

   ```powershell
   Copy-Item .env.example .env
   ```

   File `.env` chứa mật khẩu nên không được đưa lên Git. Mỗi máy tự tạo file này.

4. Bật MySQL. Mở PowerShell bằng quyền Administrator rồi chạy lệnh dưới. Nếu cài MySQL theo cách khác, tên service có thể không phải `MySQL80`.

   ```powershell
   Start-Service MySQL80
   ```

5. Chạy server (vẫn trong thư mục `server`):

   ```powershell
   .venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
   ```

6. Mở http://127.0.0.1:8000 trên trình duyệt. Ở lần chạy đầu, server tự tạo database `itam`, các bảng, 5 danh mục mặc định và tài khoản admin. Đăng nhập bằng `ADMIN_USERNAME` (mặc định là `admin`) và `ADMIN_PASSWORD` đã đặt trong `.env`. Tài liệu API tự sinh nằm ở http://127.0.0.1:8000/docs.

Nếu server dừng với thông báo "Không kết nối được MySQL", hãy kiểm tra MySQL đã bật chưa và mật khẩu trong `.env` có đúng không.

Nếu server dừng với thông báo "Hệ thống chưa có tài khoản admin", hãy điền `ADMIN_PASSWORD` trong `.env` rồi chạy lại. Hai dòng `ADMIN_...` chỉ được dùng khi database chưa có admin nào; sửa chúng về sau không đổi mật khẩu của tài khoản đã tạo.

Trên macOS hoặc Linux, thay `.venv\Scripts\python` bằng `.venv/bin/python`, và thay `Copy-Item` bằng `cp`.

## Nâng cấp từ bản cũ

Server không tự sửa bảng đã có. Nếu database được tạo trước khi có sáu vai trò, chạy hai lệnh SQL sau một lần (hoặc xóa database để server tạo lại từ đầu):

```sql
ALTER TABLE user ADD COLUMN employee_id INT NULL,
  ADD UNIQUE KEY uq_user_employee (employee_id),
  ADD CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employee(id);
UPDATE user SET role = 'auditor' WHERE role = 'staff';
```

Vai trò cũ `staff` (xem toàn bộ, không sửa) nay tên là Kiểm toán (`auditor`); quyền của các tài khoản đó không đổi.

## Cấu trúc thư mục

```
server/
  app/                 code phía server: API, bảng dữ liệu, quy tắc cấp phát và thu hồi
  static/              giao diện web
  requirements.txt     danh sách thư viện Python
```
