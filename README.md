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
- Giao diện có chế độ sáng, tối, hoặc tự theo cài đặt của máy.

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

3. Tạo file cấu hình từ file mẫu, sau đó mở `.env` và điền mật khẩu MySQL vào dòng `DB_PASSWORD=`:

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

6. Mở http://127.0.0.1:8000 trên trình duyệt. Ở lần chạy đầu, server tự tạo database `itam`, các bảng và 5 danh mục mặc định. Tài liệu API tự sinh nằm ở http://127.0.0.1:8000/docs.

Nếu server dừng với thông báo "Không kết nối được MySQL", hãy kiểm tra MySQL đã bật chưa và mật khẩu trong `.env` có đúng không.

Trên macOS hoặc Linux, thay `.venv\Scripts\python` bằng `.venv/bin/python`, và thay `Copy-Item` bằng `cp`.

## Cấu trúc thư mục

```
server/
  app/                 code phía server: API, bảng dữ liệu, quy tắc cấp phát và thu hồi
  static/              giao diện web
  requirements.txt     danh sách thư viện Python
  .env.example         mẫu cấu hình kết nối MySQL
```
