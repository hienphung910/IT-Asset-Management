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
- Giao diện mặc định theo cài đặt sáng/tối của máy; sau khi đăng nhập có thể đổi sang sáng hoặc tối trong trang Cài đặt.
- Phải đăng nhập mới dùng được, và mỗi tài khoản có một trong ba vai trò (xem bảng dưới). Nhật ký của tài sản ghi cả tài khoản đã thao tác.

## Tài khoản và vai trò

| Vai trò | Được làm gì | Cách có tài khoản |
|---|---|---|
| Nhân viên | Chỉ xem | Tự đăng ký, chờ admin duyệt rồi mới đăng nhập được |
| Quản lý | Xem, thêm và sửa nhân viên, cấp phát và thu hồi tài sản | Tự đăng ký, chờ admin duyệt rồi mới đăng nhập được |
| Admin | Toàn quyền: thêm và sửa tài sản, đổi trạng thái, danh mục, vị trí, duyệt, khóa và đổi vai trò tài khoản | Tài khoản đầu tiên lấy từ `.env`; các admin sau do admin khác cấp ở trang Tài khoản |

Tài khoản đăng nhập khác với mục Nhân viên trên menu: Nhân viên là danh sách người nhận tài sản, không cần có tài khoản.

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

## Cấu trúc thư mục

```
server/
  app/                 code phía server: API, bảng dữ liệu, quy tắc cấp phát và thu hồi
  static/              giao diện web
  requirements.txt     danh sách thư viện Python
```
