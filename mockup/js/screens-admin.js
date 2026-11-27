/* Mockup ITAM: Danh mục dùng chung (NT-3, NT-4) và Quản trị hệ thống
   (NT-1, NT-2, NT-5, NT-6 phần cấu hình, NV-7.3.1 → NV-7.3.5).
   Dữ liệu riêng của phần này khai báo ở đầu file; nhân viên, tài khoản, vị trí, danh mục,
   model, đơn vị, tài sản lấy từ data.js. Mọi thay đổi chỉ sửa dữ liệu trong bộ nhớ. */
(function () {
  "use strict";
  const D = M.data;

  /* ===================== Dữ liệu mẫu riêng ===================== */

  /* Một tài khoản đã khóa từng thao tác trên tài sản, để minh họa "không xóa được, chỉ khóa" (NT-1). */
  if (!D.users.some((u) => u.id === "us11")) {
    D.users.push({ id: "us11", username: "cuong.pv", name: "Phạm Văn Cường", role: "asset", employeeId: null, status: "disabled", created: "05/09/2026" });
  }
  /* Tài khoản đã có dòng trong nhật ký (tạo, cấp phát, tạo mã kết nạp…) */
  const USERS_WITH_LOG = new Set(["us1", "us2", "us3", "us4", "us5", "us11"]);

  /* NT-3: tài khoản được gán vào đơn vị nào */
  D.userUnits = { us1: ["u0"], us2: ["u1", "u2"], us3: ["u1", "u2"], us4: ["u1"], us5: ["u0"], us6: ["u1"], us7: ["u1"], us8: ["u1"], us9: ["u2"], us10: ["u1"], us11: ["u1"] };
  /* NT-3: điều chuyển tài sản giữa hai đơn vị (ghi nhật ký cả bên giao và bên nhận) */
  D.unitTransfers = [
    { at: "21/05/2026 10:15", assetId: "a21", from: "u1", to: "u2", by: "Phạm Thu Hà", note: "Chuyển máy trạm từ kho Hà Nội vào chi nhánh để mở phòng kinh doanh HCM" },
    { at: "18/05/2026 15:40", assetId: "a20", from: "u1", to: "u2", by: "Phạm Thu Hà", note: "Laptop cho nhân viên kinh doanh miền Nam" },
  ];

  /* NT-5: nhật ký kiểm toán. user = tên đăng nhập, "system" = hệ thống tự làm */
  D.auditLog = [
    { at: "27/11/2026 14:21", user: "nam.lh", ip: "10.10.2.15", act: "credential_view", target: 'Thông tin xác thực "AD - svc-scan"', detail: "Mở xem bộ thông tin xác thực; giá trị bí mật vẫn được che" },
    { at: "27/11/2026 14:05", user: "quan.tm", ip: "10.10.2.11", act: "role_change", target: "Tài khoản anh.nd", field: "Vai trò", before: "Kiểm toán", after: "Helpdesk" },
    { at: "27/11/2026 13:40", user: "ha.pt", ip: "10.10.1.40", act: "asset_update", target: "TS-000012", field: "Ghi chú", before: "", after: "Gãy bản lề, chờ linh kiện từ hãng" },
    { at: "27/11/2026 11:02", user: "nam.lh", ip: "10.10.2.15", act: "sql_run", target: "Truy vấn SQL chỉ đọc", detail: "SELECT hostname, os_name FROM asset WHERE os_name LIKE 'Windows 10%' - 14 dòng - 0,21 giây" },
    { at: "27/11/2026 10:30", user: "nam.lh", ip: "10.10.2.15", act: "script_run", target: 'Script S-04 "Gỡ phần mềm bị cấm" phiên bản 3', detail: "Chạy trên HCM-KHOA-LT, đã được quan.tm duyệt lúc 10:12" },
    { at: "27/11/2026 09:12", user: "huong.vt", ip: "10.10.1.62", act: "export", target: "Nhật ký kiểm toán", detail: "Xuất 1.204 dòng từ 01/11/2026 đến 26/11/2026 ra tệp CSV" },
    { at: "27/11/2026 09:05", user: "ha.pt", ip: "10.10.1.40", act: "asset_checkout", target: "TS-000002", detail: "Cấp phát cho Đỗ Mai Linh (NV0030), sinh biên bản BB-2026-0118" },
    { at: "27/11/2026 08:31", user: "ha.pt", ip: "10.10.1.40", act: "login", target: "Đăng nhập", detail: "Đăng nhập thành công" },
    { at: "27/11/2026 08:29", user: "ha.pt", ip: "10.10.1.40", act: "login_fail", target: "Đăng nhập", detail: "Sai mật khẩu" },
    { at: "26/11/2026 17:20", user: "quan.tm", ip: "10.10.2.11", act: "agent_revoke", target: "Agent trên máy KD-OLD-LT", detail: "Thu hồi agent; báo cáo kế tiếp của máy này bị từ chối" },
    { at: "26/11/2026 16:02", user: "quan.tm", ip: "10.10.2.11", act: "enroll_code", target: 'Mã kết nạp "Đợt cài phòng Kế toán"', detail: "Thu hồi mã; 6 agent đã kết nạp bằng mã này vẫn hoạt động" },
    { at: "26/11/2026 15:44", user: "quan.tm", ip: "10.10.2.11", act: "catalog_edit", target: "Danh mục c3", field: "Tên", before: "Man hinh", after: "Màn hình" },
    { at: "25/11/2026 09:45", user: "ha.pt", ip: "10.10.1.40", act: "asset_update", target: "TS-000004", field: "Serial", before: "9HZ1QW", after: "9HZ1QW3" },
    { at: "24/11/2026 22:14", user: "anh.nd", ip: "113.161.20.7", act: "login_fail", target: "Đăng nhập", detail: "Sai mật khẩu, đăng nhập từ ngoài mạng công ty" },
    { at: "24/11/2026 16:30", user: "quan.tm", ip: "10.10.2.11", act: "api_key", target: 'Khóa API "Đồng bộ ERP"', detail: "Tạo khóa, vai trò Kiểm toán, hạn 23/11/2027" },
    { at: "24/11/2026 14:00", user: "nam.lh", ip: "10.10.2.15", act: "credential_edit", target: 'Thông tin xác thực "SNMP v3 - core"', detail: "Đổi giá trị bí mật" },
    { at: "23/11/2026 10:20", user: "quan.tm", ip: "10.10.2.11", act: "user_link", target: "Tài khoản binh.nv", detail: "Nối với nhân viên NV0012 - Nguyễn Văn Bình" },
    { at: "22/11/2026 15:05", user: "ha.pt", ip: "10.10.1.40", act: "asset_status", target: "TS-000014", field: "Trạng thái", before: "Đang sửa chữa", after: "Hỏng / Chờ thanh lý" },
    { at: "20/11/2026 09:00", user: "huong.vt", ip: "10.10.1.62", act: "login", target: "Đăng nhập", detail: "Đăng nhập thành công" },
    { at: "30/09/2026 17:00", user: "system", ip: "", act: "lock", target: "Tài khoản lan.vt", detail: "Khóa do đồng bộ danh bạ: người dùng bị vô hiệu hóa trong Active Directory" },
    { at: "10/09/2026 08:40", user: "quan.tm", ip: "10.10.2.11", act: "user_approve", target: "Tài khoản huong.vt", detail: "Duyệt tài khoản, vai trò Kiểm toán" },
  ];
  const AUDIT_ACT = {
    login: ["Đăng nhập", "ok"], login_fail: ["Đăng nhập lỗi", "bad"], role_change: ["Đổi vai trò", "warn"], lock: ["Khóa tài khoản", "warn"],
    user_approve: ["Duyệt tài khoản", "info"], user_link: ["Nối nhân viên", "info"], catalog_edit: ["Sửa danh mục", "info"],
    agent_revoke: ["Thu hồi agent", "warn"], enroll_code: ["Thu hồi mã kết nạp", "warn"], credential_view: ["Xem credential quét", "bad"],
    credential_edit: ["Sửa credential quét", "bad"], script_run: ["Chạy script từ xa", "bad"], sql_run: ["Chạy truy vấn SQL", "warn"],
    asset_update: ["Sửa tài sản", "mute"], asset_checkout: ["Cấp phát", "mute"], asset_status: ["Đổi trạng thái", "mute"],
    api_key: ["Tạo khóa API", "info"], export: ["Xuất nhật ký", "info"],
  };

  /* NV-7.3.5: kênh gửi thông báo */
  D.notifyChannels = [
    { id: "email", name: "Email", kind: "SMTP - STARTTLS", enabled: true, required: true,
      fields: [["Máy chủ", "smtp.anphat.vn:587"], ["Kiểu xác thực", "Tài khoản và mật khẩu"], ["Tài khoản gửi", "itam-noreply@anphat.vn"], ["Mật khẩu", "••••••••••••"]],
      test: ["ok", "Gửi thử thành công lúc 26/11/2026 15:10"] },
    { id: "teams", name: "Microsoft Teams", kind: "Webhook vào kênh #it-canh-bao", enabled: true,
      fields: [["Webhook URL", "https://anphat.webhook.office.com/webhookb2/••••••••"]], test: ["ok", "Gửi thử thành công lúc 20/11/2026 10:02"] },
    { id: "slack", name: "Slack", kind: "Chưa cấu hình", enabled: false, fields: [], test: null },
    { id: "telegram", name: "Telegram", kind: "Bot @anphat_itam_bot", enabled: true,
      fields: [["Bot token", "7012••••••••:AA••••••••"], ["Chat ID", "-1002233445566"]],
      test: ["bad", "Gửi thử thất bại lúc 27/11/2026 08:00: Telegram trả lỗi 401 Unauthorized (bot token không hợp lệ)."] },
  ];
  /* NT-6: sự kiện cần thông báo, ai nhận, kênh nào, mốc nhắc lại */
  D.notifyEvents = [
    { id: "ev1", name: "Yêu cầu ký biên bản bàn giao", code: "NV-2.3.1", to: ["Nhân viên có tên trong biên bản"], ch: ["email"], remind: "Mỗi 3 ngày cho tới khi ký", on: true },
    { id: "ev2", name: "Vật tư dưới ngưỡng tồn", code: "NV-2.1.5", to: ["Quản lý tài sản"], ch: ["email", "teams"], remind: "Khi chạm ngưỡng; nhắc lại sau 7 ngày", on: true },
    { id: "ev3", name: "Phần cứng bị thay đổi", code: "NV-1.3.3", to: ["Quản trị hạ tầng"], ch: ["teams"], remind: "Một lần cho mỗi thay đổi", on: true },
    { id: "ev4", name: "Bản quyền sắp hết hạn hoặc thiếu ghế", code: "NV-3.1.4", to: ["Quản lý tài sản"], ch: ["email"], remind: "Còn 60, 30, 7 ngày; thiếu ghế: một lần khi chuyển sang thiếu", on: true },
    { id: "ev5", name: "Lỗ hổng mức Critical mới", code: "NV-3.2.2", to: ["Quản trị hạ tầng", "Kiểm toán"], ch: ["email", "teams", "telegram"], remind: "Một lần", on: true },
    { id: "ev6", name: "Thiết bị sắp hết hỗ trợ (EOL)", code: "NV-3.3.1", to: ["Quản trị hạ tầng"], ch: ["email"], remind: "Còn 180, 90, 30 ngày", on: true },
    { id: "ev7", name: "Ticket được giao", code: "NV-4.1.2", to: ["Người được giao"], ch: ["email", "teams"], remind: "Một lần", on: true },
    { id: "ev8", name: "Ticket sắp vi phạm SLA", code: "NV-4.2.3", to: ["Người đang xử lý", "Trưởng nhóm khi đã vi phạm"], ch: ["teams"], remind: "Mỗi mức leo thang một lần", on: true },
    { id: "ev9", name: "Bảo hành sắp hết", code: "NV-5.2.2", to: ["Quản lý tài sản"], ch: ["email"], remind: "Còn 90, 60, 30 ngày", on: true },
    { id: "ev10", name: "Kết quả triển khai phần mềm", code: "NV-6.1.3", to: ["Người tạo đợt triển khai"], ch: ["email"], remind: "Khi đợt kết thúc", on: false },
    { id: "ev11", name: "Chứng chỉ SSL sắp hết hạn", code: "NV-3.3.3", to: ["Quản trị hạ tầng"], ch: ["email", "telegram"], remind: "Còn 30, 14, 7 ngày", on: true },
  ];
  D.notifyLog = [
    ["27/11/2026 14:12", "Lỗ hổng mức Critical mới", "nam.lh, huong.vt", "telegram", "bad", "401 Unauthorized: bot token không hợp lệ"],
    ["27/11/2026 14:12", "Lỗ hổng mức Critical mới", "nam.lh, huong.vt", "email", "ok", ""],
    ["27/11/2026 14:12", "Lỗ hổng mức Critical mới", "#it-canh-bao", "teams", "ok", ""],
    ["27/11/2026 10:03", "Ticket sắp vi phạm SLA", "anh.nd", "teams", "ok", ""],
    ["27/11/2026 09:06", "Yêu cầu ký biên bản bàn giao", "linh.dm@anphat.vn", "email", "ok", ""],
    ["27/11/2026 08:30", "Vật tư dưới ngưỡng tồn", "ha.pt@anphat.vn", "email", "ok", ""],
    ["26/11/2026 09:00", "Bản quyền sắp hết hạn hoặc thiếu ghế", "ha.pt@anphat.vn", "email", "bad", "Máy chủ SMTP từ chối: 451 Temporary local problem. Đã thử lại 3 lần."],
    ["25/11/2026 07:00", "Bảo hành sắp hết", "ha.pt@anphat.vn", "email", "ok", ""],
  ];
  const CH_NAME = { email: "Email", teams: "Teams", slack: "Slack", telegram: "Telegram" };

  /* NV-7.3.1: lịch sử đồng bộ danh bạ */
  D.ssoSync = [
    { at: "27/11/2026 12:00", ok: true, read: 214, added: 0, updated: 3, disabled: 0, note: "Cập nhật phòng ban của 3 người" },
    { at: "27/11/2026 08:00", ok: false, note: "Không kết nối được dc01.anphat.local:636 (hết thời gian chờ 30 giây). Dữ liệu nhân viên giữ nguyên." },
    { at: "26/11/2026 20:00", ok: true, read: 214, added: 1, updated: 0, disabled: 0, note: "Thêm Phạm Văn Đạt (NV0071) - Phòng IT" },
    { at: "30/09/2026 16:00", ok: true, read: 213, added: 0, updated: 1, disabled: 1, note: "Võ Thị Lan bị vô hiệu hóa trong AD → tài khoản lan.vt bị khóa, nhân viên NV0009 chuyển Đã nghỉ" },
  ];
  D.ssoGroupMap = [
    ["GG-ITAM-Admins", "admin", 2], ["GG-IT-Infra", "infra", 4], ["GG-Asset-Managers", "asset", 2],
    ["GG-Helpdesk", "helpdesk", 3], ["GG-Internal-Audit", "audit", 2], ["Domain Users", "employee", 201],
  ];

  /* NV-7.3.2: khóa API; NV-7.3.3: webhook */
  D.apiKeys = [
    { id: "k1", name: "Đồng bộ ERP", prefix: "itam_7Qf2", role: "audit", created: "24/11/2026", createdBy: "quan.tm", expires: "23/11/2027", lastUsed: "27/11/2026 13:00", rate: 600, state: "active" },
    { id: "k2", name: "Zabbix tạo ticket", prefix: "itam_Lm8x", role: "helpdesk", created: "02/10/2026", createdBy: "quan.tm", expires: "02/10/2027", lastUsed: "27/11/2026 14:18", rate: 120, state: "active" },
    { id: "k3", name: "Power BI đọc báo cáo", prefix: "itam_P0wr", role: "audit", created: "01/08/2026", createdBy: "quan.tm", expires: "01/11/2026", lastUsed: "31/10/2026 23:00", rate: 600, state: "expired" },
    { id: "k4", name: "Script kiểm kê cũ", prefix: "itam_Zx91", role: "infra", created: "10/06/2026", createdBy: "nam.lh", expires: "10/06/2027", lastUsed: "15/10/2026 08:12", rate: 300, state: "revoked" },
  ];
  D.apiCalls = [
    ["27/11/2026 14:18:22", "Zabbix tạo ticket", "POST /api/tickets", 201, "10.10.0.40", "88 ms", ""],
    ["27/11/2026 13:00:05", "Đồng bộ ERP", "GET /api/assets?page=3", 200, "10.10.0.60", "42 ms", ""],
    ["27/11/2026 13:00:04", "Đồng bộ ERP", "GET /api/assets?page=2", 200, "10.10.0.60", "39 ms", ""],
    ["27/11/2026 12:58:10", "Đồng bộ ERP", "GET /api/reports/depreciation", 429, "10.10.0.60", "3 ms", "Vượt giới hạn 600 lượt/phút, thử lại sau 21 giây"],
    ["27/11/2026 11:40:51", "Đồng bộ ERP", "PUT /api/assets/12", 403, "10.10.0.60", "5 ms", "Vai trò Kiểm toán của khóa không có quyền sửa tài sản"],
    ["26/11/2026 08:12:00", "Script kiểm kê cũ", "GET /api/assets", 401, "10.10.2.77", "2 ms", "Khóa đã bị thu hồi"],
  ];
  const WEBHOOK_EVENTS = ["Tài sản được cấp phát", "Tài sản được thu hồi", "Tài sản đổi trạng thái", "Ticket mới", "Ticket vi phạm SLA", "Lỗ hổng Critical mới", "Agent mới chờ xác nhận"];
  D.webhooks = [
    { id: "w1", url: "https://hooks.anphat-erp.vn/itam/events", events: ["Tài sản được cấp phát", "Tài sản được thu hồi", "Tài sản đổi trạng thái"], secret: "whsec_••••••••3f9a", state: "ok", last: "27/11/2026 09:05 - 200 OK" },
    { id: "w2", url: "https://soc.anphat.vn/ingest/itam", events: ["Lỗ hổng Critical mới"], secret: "whsec_••••••••a1c0", state: "fail", last: "27/11/2026 14:12 - thất bại sau 3 lần thử" },
  ];
  D.webhookLog = [
    ["27/11/2026 14:12:40", "Lỗ hổng Critical mới", "https://soc.anphat.vn/ingest/itam", "3/3", "Hết thời gian chờ 10 giây", "bad"],
    ["27/11/2026 14:12:20", "Lỗ hổng Critical mới", "https://soc.anphat.vn/ingest/itam", "2/3", "502 Bad Gateway", "warn"],
    ["27/11/2026 14:12:10", "Lỗ hổng Critical mới", "https://soc.anphat.vn/ingest/itam", "1/3", "502 Bad Gateway", "warn"],
    ["27/11/2026 09:05:02", "Tài sản được cấp phát", "https://hooks.anphat-erp.vn/itam/events", "1/3", "200 OK", "ok"],
    ["26/11/2026 15:30:44", "Tài sản đổi trạng thái", "https://hooks.anphat-erp.vn/itam/events", "1/3", "200 OK", "ok"],
  ];

  /* NV-7.3.4: tín hiệu nhận từ HRM */
  D.hrmEvents = [
    { at: "26/11/2026 16:40", kind: "Nghỉ việc", emp: "e7", effective: "05/12/2026", result: "Đã tạo ticket thu hồi", ticket: "T-1047", state: ["Đang thu hồi", "warn"] },
    { at: "20/11/2026 09:00", kind: "Nhân viên mới", who: "Phạm Văn Đạt - NV0071 - Phòng IT", effective: "01/12/2026", result: "Đã tạo hồ sơ NV0071 và ticket chuẩn bị thiết bị T-1049 (laptop, dock, màn hình)", state: ["Đang chuẩn bị", "info"] },
    { at: "02/10/2026 10:00", kind: "Đổi phòng ban", emp: "e9", effective: "01/10/2026", result: "Cập nhật quản lý trực tiếp sang Trần Quốc Việt", state: ["Hoàn tất", "ok"] },
    { at: "25/09/2026 14:00", kind: "Nghỉ việc", emp: "e14", effective: "30/09/2026", result: "Ticket T-0987 đã đóng sau khi thu hồi đủ; nhân viên chuyển Đã nghỉ", state: ["Hoàn tất", "ok"] },
  ];
  D.hrmKits = [
    ["Phòng Kinh doanh", "Laptop, chuột, tai nghe, sạc USB-C"],
    ["Phòng Kế toán", "Máy tính để bàn, màn hình, bàn phím, chuột"],
    ["Phòng IT", "Laptop, dock, màn hình"],
    ["Phòng Marketing", "Laptop MacBook, tai nghe"],
  ];

  /* ===================== Tiện ích chung của file ===================== */
  const unitName = (id) => (M.find("orgUnits", id) || {}).name || "";
  const userByName = (n) => D.users.find((u) => u.username === n);
  const empLabel = (e) => `${e.code} - ${e.name}`;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const NAME_RE = /^[\p{L}\s'.-]+$/u;
  const heldAssets = (empId) => D.assets.filter((a) => a.holder && a.holder.type === "employee" && a.holder.id === empId);
  const attachedTo = (assetIds) => D.assets.filter((a) => a.holder && a.holder.type === "asset" && assetIds.includes(a.holder.id));
  const accHeld = (empId) => (D.accessories || []).map((ac) => { const h = (ac.holdings || []).find((x) => x[0] === empId); return h ? { ac, qty: h[1] } : null; }).filter(Boolean);
  /* Ghế bản quyền gắn với người hoặc với máy người đó giữ; đọc phòng thủ vì Module 3 khai báo dữ liệu. */
  const seatsOf = (empId) => {
    const myAssets = heldAssets(empId).map((a) => a.id);
    const out = [];
    (D.licenses || []).forEach((l) => (l.assignments || []).forEach((x) => {
      if (!x) return;
      if (x.employeeId === empId) out.push({ l, via: "Theo người dùng" });
      else if (x.assetId && myAssets.includes(x.assetId)) out.push({ l, via: "Theo máy " + ((M.asset(x.assetId) || {}).tag || "") });
    }));
    return out;
  };
  const TICKET_ST = { new: ["Mới", "info"], approval: ["Chờ duyệt", "warn"], owned: ["Đã nhận", "info"], working: ["Đang xử lý", "info"], waiting: ["Chờ phản hồi", "warn"], resolved: ["Đã giải quyết", "ok"], closed: ["Đã đóng", "mute"] };
  const ticketPill = (st) => { const p = TICKET_ST[st]; return p ? M.pill(p[0], p[1]) : M.pill(st || "Không rõ", "mute"); };
  const empStatusPill = (e) => { const s = M.EMP_STATUS[e.status] || ["Không rõ", "mute"]; return M.pill(s[0], s[1]); };
  /* dd/mm/yyyy[ hh:mm] → số yyyymmddhhmm để so sánh */
  const dkey = (s) => { const m = /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(s || ""); return m ? Number(m[3] + m[2] + m[1] + (m[4] || "00") + (m[5] || "00")) : 0; };
  const isoKey = (s) => (s ? Number(s.replace(/-/g, "") + "0000") : 0);

  /* ===================== NT-4: Nhân viên ===================== */
  const empF = { status: "", dept: "" };
  M.action("emp-filter", (el, value) => { empF[el.dataset.key] = value; M.refresh(); });

  M.screen("employees", {
    nav: "employees", title: "Nhân viên", codes: ["NT-4"],
    render() {
      const list = D.employees.filter((e) => (!empF.status || e.status === empF.status) && (!empF.dept || e.dept === empF.dept));
      const linked = new Set(D.users.filter((u) => u.employeeId).map((u) => u.employeeId));
      const cnt = (st) => D.employees.filter((e) => e.status === st).length;
      return M.page({
        title: "Nhân viên",
        codes: ["NT-4"],
        actions: M.btn("Thêm nhân viên", { primary: true, icon: "plus", modal: "emp-form", perm: "employee.edit" }),
        body: `
          ${M.stats([
            { label: "Đang làm", value: cnt("active"), tone: "ok" },
            { label: "Sắp nghỉ", value: cnt("leaving"), tone: "warn" },
            { label: "Chưa có tài khoản", value: D.employees.filter((e) => !linked.has(e.id)).length, tone: "info" },
          ])}
          <section class="panel flush">
            ${M.toolbar(`${M.searchBox("emp-table", "Tìm theo mã hoặc họ tên")}
              ${M.select("f-status", [["", "Mọi trạng thái"], ["active", "Đang làm"], ["leaving", "Sắp nghỉ"], ["left", "Đã nghỉ"]], empF.status, { attrs: 'data-change="emp-filter" data-key="status" aria-label="Lọc theo trạng thái"' })}
              ${M.select("f-dept", [["", "Mọi phòng ban"]].concat(D.departments.map((d) => [d.id, d.name])), empF.dept, { attrs: 'data-change="emp-filter" data-key="dept" aria-label="Lọc theo phòng ban"' })}`)}
            ${M.table({
              id: "emp-table",
              rows: list,
              href: (e) => "#/employees/" + e.id,
              empty: "Không có nhân viên nào khớp bộ lọc.",
              cols: [
                { h: "Mã NV", r: (e) => `<span class="mono">${M.esc(e.code)}</span>` },
                { h: "Họ tên", cls: "cell-name", r: (e) => `<a href="#/employees/${e.id}">${M.esc(e.name)}</a>` },
                { h: "Phòng ban", r: (e) => M.esc((M.dept(e.dept) || {}).name || "") },
                { h: "Đang giữ", cls: "right", r: (e) => `<span class="mono">${heldAssets(e.id).length}</span>` },
                { h: "Trạng thái", r: (e) => empStatusPill(e) + (e.leaveDate ? `<div class="cell-sub">Nghỉ ${M.esc(e.leaveDate)}</div>` : "") },
                { h: "", cls: "right", r: (e) => M.btn("Sửa", { sm: true, modal: "emp-form", arg: e.id, perm: "employee.edit" }) },
              ],
            })}
            <div class="panel-foot"><span>Hiển thị ${list.length} trong ${D.employees.length} nhân viên</span></div>
          </section>
          ${M.anno("MH-06 hiện đặt form một dòng ngay trên bảng. Mockup chuyển form vào hộp thoại để bảng có chỗ cho phòng ban và trạng thái nghỉ việc. Quản lý trực tiếp và đơn vị xem ở trang từng nhân viên (phần còn thiếu của NT-4).")}`,
      });
    },
  });

  M.defModal("emp-form", (id) => {
    const e = id ? M.emp(id) : null;
    return {
      title: e ? "Sửa nhân viên " + e.code : "Thêm nhân viên",
      submit: e ? "Lưu thay đổi" : "Thêm",
      body: `<div class="form-grid">
        ${M.field("Mã NV", M.input("code", { value: e ? e.code : "", ph: "NV0072" }), { req: true })}
        ${M.field("Họ tên", M.input("name", { value: e ? e.name : "" }), { req: true })}
        ${M.field("Email", M.input("email", { value: e ? e.email : "", ph: "ten@congty.vn" }))}
        ${M.field("Phòng ban", M.select("dept", D.departments.map((d) => [d.id, d.name]), e ? e.dept : "d5"))}
        ${M.field("Quản lý trực tiếp", M.select("manager", D.employees.filter((x) => !e || x.id !== e.id).map((x) => [x.id, empLabel(x)]), e ? e.managerId || "" : "", { blank: "Không có" }))}
        ${M.field("Đơn vị", M.select("unit", D.orgUnits.map((u) => [u.id, u.name]), e ? e.unit : "u1"))}
      </div>`,
      onSubmit(d, form) {
        const code = (d.code || "").trim(), name = (d.name || "").trim(), email = (d.email || "").trim().toLowerCase();
        if (!code) return M.invalid(form, "code", "Chưa nhập mã nhân viên.");
        const dupCode = D.employees.find((x) => x.code.toLowerCase() === code.toLowerCase() && (!e || x.id !== e.id));
        if (dupCode) return M.invalid(form, "code", `Mã nhân viên ${code} đã được dùng cho người khác.`);
        if (!name) return M.invalid(form, "name", "Chưa nhập họ tên.");
        if (!NAME_RE.test(name)) return M.invalid(form, "name", "Họ tên không được chứa số hoặc ký tự đặc biệt.");
        if (email && !EMAIL_RE.test(email)) return M.invalid(form, "email", "Email không hợp lệ. Nhập theo dạng ten@congty.vn.");
        const dupMail = email && D.employees.find((x) => (x.email || "").toLowerCase() === email && (!e || x.id !== e.id));
        if (dupMail) return M.invalid(form, "email", `Email này đã gắn với nhân viên ${dupMail.code} - ${dupMail.name}.`);
        const rec = { code, name, email, dept: d.dept, managerId: d.manager || null, unit: d.unit };
        if (e) { Object.assign(e, rec); return "Đã lưu thay đổi"; }
        const n = Math.max(...D.employees.map((x) => Number(x.id.slice(1)))) + 1;
        D.employees.push(Object.assign({ id: "e" + n, status: "active" }, rec));
        return `Đã thêm nhân viên ${code} - ${name}`;
      },
    };
  });

  M.defModal("emp-leave", (id) => {
    const e = M.emp(id);
    const held = heldAssets(id).length + accHeld(id).length;
    return {
      title: "Đánh dấu nghỉ việc: " + e.name,
      submit: "Lưu",
      body: `${held ? M.note(`Người này còn giữ <b>${held}</b> món (tài sản và phụ kiện). Thu hồi trước hoặc mở ticket thu hồi.`, "warn") : ""}
        ${M.radio("kind", "leaving", "Sắp nghỉ: chưa tới ngày nghỉ", true)}
        ${M.radio("kind", "left", "Đã nghỉ", false)}
        ${M.field("Ngày nghỉ", M.input("date", { type: "date", value: "2026-12-31" }), { req: true })}
        ${M.field("Ghi chú", M.textarea("note", "", { ph: "Lý do, người bàn giao công việc…" }))}`,
      onSubmit(d, form) {
        if (!d.date) return M.invalid(form, "date", "Chưa chọn ngày nghỉ.");
        const [y, mo, da] = d.date.split("-");
        e.status = d.kind === "left" ? "left" : "leaving";
        e.leaveDate = `${da}/${mo}/${y}`;
        return e.status === "left" ? `Đã chuyển ${e.name} sang Đã nghỉ. Người này không còn trong danh sách chọn khi cấp phát.` : `Đã ghi ngày nghỉ ${e.leaveDate} cho ${e.name}.`;
      },
    };
  });

  /* Trang một nhân viên */
  M.screen("employees/:id", {
    nav: "employees", title: "Nhân viên",
    render({ id }) {
      const e = M.emp(id);
      if (!e) return M.page({ title: "Không tìm thấy nhân viên này", back: ["#/employees", "Nhân viên"], codes: ["NT-4"] });
      const dept = M.dept(e.dept) || {};
      const mgr = e.managerId ? M.emp(e.managerId) : null;
      const acc = D.users.find((u) => u.employeeId === e.id);
      const assets = heldAssets(e.id);
      const attached = attachedTo(assets.map((a) => a.id));
      const accs = accHeld(e.id);
      const seats = seatsOf(e.id);
      const hos = D.handovers.filter((h) => h.employeeId === e.id);
      const tickets = (D.tickets || []).filter((t) => t.requesterId === e.id);
      const reports = D.employees.filter((x) => x.managerId === e.id);
      const leaving = e.status === "leaving";
      const banner = leaving
        ? M.note(`HRM báo <b>${M.esc(e.name)}</b> nghỉ việc ngày <b>${M.esc(e.leaveDate || "")}</b>. Thu hồi đủ các món dưới đây theo ticket <a href="#/tickets/T-1047">T-1047</a>.`, "warn")
        : "";
      const assetRows = assets.map((a) => ({ a, sub: "" })).concat(attached.map((a) => ({ a, sub: "Gắn vào " + M.asset(a.holder.id).tag })));
      return M.page({
        back: ["#/employees", "Nhân viên"],
        codes: leaving ? ["NT-4", "NV-7.3.4"] : ["NT-4"],
        title: M.esc(e.name),
        sub: `<span class="mono">${M.esc(e.code)}</span> - ${M.esc(dept.name || "")} &nbsp; ${empStatusPill(e)}`,
        actions: [
          M.btn("Sửa", { modal: "emp-form", arg: e.id, perm: "employee.edit", icon: "pen" }),
          e.status !== "left" ? M.btn("Đánh dấu nghỉ", { modal: "emp-leave", arg: e.id, perm: "employee.edit" }) : "",
          M.can("asset.checkout") ? (e.status === "active" ? M.btn("Cấp phát tài sản", { primary: true, href: "#/assets" }) : M.btn("Cấp phát tài sản", { primary: true, disabled: true, title: "Không cấp phát mới cho người đã có ngày nghỉ." })) : "",
        ].join(""),
        body: `${banner}
          <div class="side-layout">
            <div class="stack">
              ${M.panel({
                title: `Đang giữ ${assetRows.length} tài sản`, flush: true,
                body: M.table({
                  id: "emp-assets", rows: assetRows, href: (x) => "#/assets/" + x.a.id,
                  empty: "Nhân viên này chưa giữ tài sản nào.",
                  cols: [
                    { h: "Mã tài sản", r: (x) => M.tape(x.a.tag, x.a.id) },
                    { h: "Tài sản", cls: "cell-name", r: (x) => M.esc(x.a.name) + (x.sub ? `<div class="cell-sub">${M.esc(x.sub)}</div>` : "") },
                    { h: "Serial", r: (x) => `<span class="mono">${M.esc(x.a.serial || "")}</span>` },
                    { h: "Trạng thái", r: (x) => M.led(x.a.status) },
                  ],
                }),
              })}
              ${M.panel({
                title: `Phụ kiện đang giữ (${accs.reduce((s, x) => s + x.qty, 0)})`, flush: true,
                body: M.table({
                  id: "emp-acc", rows: accs, empty: "Không giữ phụ kiện nào.",
                  cols: [
                    { h: "Phụ kiện", cls: "cell-name", r: (x) => M.esc(x.ac.name) },
                    { h: "Loại", r: (x) => M.esc(x.ac.kind) },
                    { h: "Số lượng", cls: "right", r: (x) => `<span class="mono">${M.esc(x.qty)}</span>` },
                  ],
                }),
              })}
              ${M.panel({
                title: `Ghế bản quyền (${seats.length})`, flush: true,
                body: M.table({
                  id: "emp-seats", rows: seats, href: (x) => "#/licenses/" + x.l.id,
                  empty: "Không có ghế bản quyền nào gắn với người này hoặc máy người này giữ.",
                  cols: [
                    { h: "Bản quyền", cls: "cell-name", r: (x) => M.esc(x.l.software || x.l.name || x.l.id) },
                    { h: "Gán theo", r: (x) => M.esc(x.via) },
                  ],
                }),
              })}
              <div class="grid g2">
                ${M.panel({
                  title: `Biên bản bàn giao (${hos.length})`, flush: true,
                  body: M.table({
                    id: "emp-ho", rows: hos, href: (h) => "#/handovers/" + h.id, empty: "Chưa có biên bản nào.",
                    cols: [
                      { h: "Số", r: (h) => `<span class="mono">${M.esc(h.id)}</span><div class="cell-sub">${M.esc(M.HANDOVER_KIND[h.kind] || "")} - ${M.esc(h.createdAt)}</div>` },
                      { h: "Trạng thái", r: (h) => { const s = M.HANDOVER_ST[h.status] || ["Không rõ", "mute"]; return M.pill(s[0], s[1]); } },
                    ],
                  }),
                })}
                ${M.panel({
                  title: `Yêu cầu hỗ trợ (${tickets.length})`, flush: true,
                  body: M.table({
                    id: "emp-tk", rows: tickets, href: (t) => "#/tickets/" + t.id, empty: "Chưa gửi yêu cầu nào.",
                    cols: [
                      { h: "Ticket", cls: "cell-name", r: (t) => `<span class="mono">${M.esc(t.id)}</span><div class="cell-sub">${M.esc(t.title || "")}</div>` },
                      { h: "Trạng thái", r: (t) => ticketPill(t.status) },
                    ],
                  }),
                })}
              </div>
            </div>
            <div class="stack">
              ${M.panel({
                title: "Thông tin",
                body: M.kv([
                  ["Quản lý trực tiếp", mgr ? `<a href="#/employees/${mgr.id}">${M.esc(mgr.name)}</a>` : '<span class="muted">Không có</span>'],
                  ["Đơn vị", M.esc(unitName(e.unit))],
                  ["Email", M.esc(e.email || "Chưa có")],
                  e.leaveDate ? ["Ngày nghỉ", M.esc(e.leaveDate)] : null,
                  ["Tài khoản", acc ? `<span class="mono">${M.esc(acc.username)}</span> - ${M.esc(M.roleLabel(acc.role))}` : '<span class="muted">Chưa nối</span>'],
                ]),
              })}
              ${reports.length ? M.panel({ title: `Quản lý trực tiếp ${reports.length} người`, body: `<div class="stack-sm">${M.map(reports, (x) => M.person(x.name, "#/employees/" + x.id, (M.dept(x.dept) || {}).name))}</div>` }) : ""}
              ${leaving ? M.panel({ title: "Thu hồi khi nghỉ việc", body: `${M.steps(["HRM báo ngày nghỉ", "Tạo ticket thu hồi", "Thu hồi từng món", "Đóng ticket, chuyển Đã nghỉ"], 2)}<div class="row" style="margin-top:10px">${M.btn("Mở ticket T-1047", { href: "#/tickets/T-1047", sm: true })}${M.btn("Xem tín hiệu HRM", { href: "#/integrations/hrm", sm: true, ghost: true })}</div>` }) : ""}
            </div>
          </div>`,
      });
    },
  });

  /* ===================== NT-4: Phòng ban ===================== */
  M.screen("departments", {
    nav: "departments", title: "Phòng ban", codes: ["NT-4"],
    render() {
      return M.page({
        title: "Phòng ban",
        codes: ["NT-4"],
        actions: M.btn("Thêm phòng ban", { primary: true, icon: "plus", modal: "dept-form", perm: "catalog.edit" }),
        body: `
          <section class="panel flush">
            ${M.toolbar(M.searchBox("dept-table", "Tìm phòng ban"))}
            ${M.table({
              id: "dept-table", rows: D.departments,
              cols: [
                { h: "Phòng ban", cls: "cell-name", r: (d) => M.esc(d.name) },
                { h: "Đơn vị", r: (d) => M.esc(unitName(d.unit)) },
                { h: "Trưởng phòng", r: (d) => { const h = M.emp(d.headId); return h ? M.person(h.name, "#/employees/" + h.id) : '<span class="muted">Chưa chọn</span>'; } },
                { h: "Nhân viên", cls: "right", r: (d) => `<span class="mono">${D.employees.filter((e) => e.dept === d.id && e.status !== "left").length}</span>` },
                { h: "Tài sản đang giữ", cls: "right", r: (d) => `<span class="mono">${D.employees.filter((e) => e.dept === d.id).reduce((s, e) => s + heldAssets(e.id).length, 0)}</span>` },
                { h: "", cls: "right", r: (d) => M.btn("Sửa", { sm: true, modal: "dept-form", arg: d.id, perm: "catalog.edit" }) },
              ],
            })}
          </section>`,
      });
    },
  });
  M.defModal("dept-form", (id) => {
    const d = id ? M.dept(id) : null;
    return {
      title: d ? "Sửa phòng ban" : "Thêm phòng ban",
      submit: d ? "Lưu thay đổi" : "Thêm",
      body: `${M.field("Tên phòng ban", M.input("name", { value: d ? d.name : "" }), { req: true })}
        ${M.field("Đơn vị", M.select("unit", D.orgUnits.map((u) => [u.id, u.name]), d ? d.unit : "u1"))}
        ${M.field("Trưởng phòng", M.select("head", D.employees.filter((e) => e.status !== "left").map((e) => [e.id, empLabel(e)]), d ? d.headId : "", { blank: "Chưa chọn" }))}`,
      onSubmit(f, form) {
        const name = (f.name || "").trim();
        if (!name) return M.invalid(form, "name", "Chưa nhập tên phòng ban.");
        if (D.departments.some((x) => x.name.toLowerCase() === name.toLowerCase() && (!d || x.id !== d.id))) return M.invalid(form, "name", `Đã có phòng ban "${name}".`);
        if (d) { Object.assign(d, { name, unit: f.unit, headId: f.head || null }); return "Đã lưu thay đổi"; }
        D.departments.push({ id: "d" + (D.departments.length + 1), name, unit: f.unit, headId: f.head || null });
        return `Đã thêm phòng ban "${name}"`;
      },
    };
  });

  /* ===================== NT-4: Vị trí dạng cây ===================== */
  const LOC_KINDS = ["Tòa nhà", "Tầng", "Phòng", "Tủ rack", "Kho"];
  const locTree = () => {
    const out = [];
    const walk = (parent, level) => D.locations.filter((l) => (l.parent || null) === parent).forEach((l) => { out.push({ l, level }); walk(l.id, level + 1); });
    walk(null, 0);
    return out;
  };
  const locDirect = (id) => D.assets.filter((a) => (a.holder && a.holder.type === "location" && a.holder.id === id) || a.location === id).length;
  const locTotal = (id) => locDirect(id) + D.locations.filter((l) => l.parent === id).reduce((s, l) => s + locTotal(l.id), 0);

  M.screen("locations", {
    nav: "locations", title: "Vị trí", codes: ["NT-4"],
    render() {
      const rows = locTree();
      return M.page({
        title: "Vị trí",
        codes: ["NT-4"],
        actions: M.btn("Thêm tòa nhà", { primary: true, icon: "plus", modal: "loc-form", arg: "new:", perm: "catalog.edit" }),
        body: `
          <section class="panel flush">
            ${M.toolbar(M.searchBox("loc-table", "Tìm vị trí"))}
            ${M.table({
              id: "loc-table", rows,
              cols: [
                { h: "Vị trí", cls: "cell-name", r: (x) => `<div style="padding-left:${x.level * 26}px" class="row">${x.level ? '<span class="muted mono">└</span>' : ""}${M.icon(x.l.kind === "Tủ rack" ? "layers" : x.l.kind === "Kho" ? "archive" : x.l.kind === "Tòa nhà" ? "building" : "map")}<span>${M.esc(x.l.name)}</span></div>` },
                { h: "Loại", r: (x) => M.pill(x.l.kind, x.l.kind === "Tòa nhà" ? "info" : "mute") },
                { h: "Đơn vị", r: (x) => M.esc(unitName(x.l.unit)) },
                { h: "Tài sản tại đây", cls: "right", r: (x) => `<span class="mono">${locDirect(x.l.id)}</span>` },
                { h: "Gồm cả vị trí con", cls: "right", r: (x) => `<span class="mono">${locTotal(x.l.id)}</span>` },
                { h: "", cls: "right", r: (x) => M.can("catalog.edit") ? `<span class="row" style="justify-content:flex-end">${x.l.kind !== "Tủ rack" ? M.btn("Thêm vị trí con", { sm: true, ghost: true, icon: "plus", modal: "loc-form", arg: "new:" + x.l.id }) : ""}${M.btn("Sửa", { sm: true, modal: "loc-form", arg: "edit:" + x.l.id })}</span>` : "" },
              ],
            })}
            <div class="panel-foot"><span>${D.locations.length} vị trí - ${D.locations.filter((l) => !l.parent).length} tòa nhà</span></div>
          </section>
          ${M.anno('Code hiện lưu vị trí chỉ bằng một cái tên, không trùng trên toàn hệ thống. Cây vị trí (mục 5 SRS) cần đổi quy tắc thành "không trùng trong cùng vị trí cha", vì hai tòa nhà đều có "Tầng 5".')}`,
      });
    },
  });
  M.defModal("loc-form", (arg) => {
    const [mode, ref] = String(arg || "new:").split(":");
    const l = mode === "edit" ? M.find("locations", ref) : null;
    const parentId = l ? l.parent || "" : ref || "";
    const parent = parentId ? M.find("locations", parentId) : null;
    const nextKind = parent ? LOC_KINDS[Math.min(LOC_KINDS.indexOf(parent.kind) + 1, 3)] : "Tòa nhà";
    return {
      title: l ? "Sửa vị trí" : parent ? "Thêm vị trí con trong " + parent.name : "Thêm tòa nhà",
      submit: l ? "Lưu thay đổi" : "Thêm",
      body: `${M.field("Tên vị trí", M.input("name", { value: l ? l.name : "" }), { req: true })}
        <div class="grid g2">
          ${M.field("Loại", M.select("kind", LOC_KINDS, l ? l.kind : nextKind))}
          ${M.field("Đơn vị", M.select("unit", D.orgUnits.filter((u) => u.level > 0).map((u) => [u.id, u.name]), l ? l.unit : parent ? parent.unit : "u1"))}
        </div>
        ${M.field("Thuộc vị trí", M.select("parent", D.locations.filter((x) => !l || x.id !== l.id).map((x) => [x.id, M.locPath(x.id)]), parentId, { blank: "Gốc (tòa nhà)" }))}`,
      onSubmit(f, form) {
        const name = (f.name || "").trim();
        if (!name) return M.invalid(form, "name", "Chưa nhập tên vị trí.");
        const p = f.parent || null;
        if (D.locations.some((x) => (x.parent || null) === p && x.name.toLowerCase() === name.toLowerCase() && (!l || x.id !== l.id))) return M.invalid(form, "name", `Đã có vị trí "${name}".`);
        if (l) { Object.assign(l, { name, kind: f.kind, unit: f.unit, parent: p }); return "Đã lưu thay đổi"; }
        const n = Math.max(...D.locations.map((x) => Number(x.id.slice(1)))) + 1;
        D.locations.push({ id: "l" + n, name, kind: f.kind, unit: f.unit, parent: p });
        return `Đã thêm vị trí "${name}"`;
      },
    };
  });

  /* ===================== NT-4: Danh mục tài sản ===================== */
  M.screen("categories", {
    nav: "categories", title: "Danh mục tài sản", codes: ["NT-4"],
    render() {
      const modelsOf = (c) => D.models.filter((m) => m.cat === c.id);
      const assetsOf = (c) => D.assets.filter((a) => { const m = M.model(a.model); return m && m.cat === c.id; });
      return M.page({
        title: "Danh mục tài sản",
        codes: ["NT-4"],
        actions: M.btn("Thêm danh mục", { primary: true, icon: "plus", modal: "cat-form", perm: "catalog.edit" }),
        body: `
          <section class="panel flush">
            ${M.table({
              id: "cat-table", rows: D.categories,
              cols: [
                { h: "Danh mục", cls: "cell-name", r: (c) => M.esc(c.name) + (c.inactive ? ` ${M.pill("Ngừng dùng", "mute")}` : "") },
                { h: "Model", cls: "right", r: (c) => `<span class="mono">${modelsOf(c).length}</span>` },
                { h: "Tài sản", cls: "right", r: (c) => `<span class="mono">${assetsOf(c).length}</span>` },
                { h: "Khấu hao", r: (c) => (c.depMonths ? `<a href="#/depreciation">${M.esc(c.depMonths)} tháng - đường thẳng</a>` : '<span class="muted">Chưa đặt</span>') },
                { h: "Điều khoản sử dụng", cls: "wrap", r: (c) => { const t = c.termsId ? M.find("terms", c.termsId) : null; return t ? `<a href="#/terms">${M.esc(t.name)}</a> <span class="muted small">bản ${M.esc(t.version)}</span>` : '<span class="muted">Không gắn</span>'; } },
                { h: "", cls: "right", r: (c) => M.can("catalog.edit") ? `<span class="row" style="justify-content:flex-end">${M.btn("Sửa", { sm: true, modal: "cat-form", arg: c.id })}${c.inactive ? M.btn("Dùng lại", { sm: true, ghost: true, act: "cat-toggle", arg: c.id }) : M.btn("Ngừng dùng", { sm: true, ghost: true, act: "cat-toggle", arg: c.id, confirm: `Ngừng dùng danh mục "${c.name}"? Tài sản đang thuộc danh mục giữ nguyên; danh mục không còn trong danh sách chọn khi thêm tài sản.` })}</span>` : "" },
              ],
            })}
            <div class="panel-foot"><span>${D.categories.length} danh mục</span></div>
          </section>`,
      });
    },
  });
  M.action("cat-toggle", (el, id) => {
    const c = M.cat(id);
    c.inactive = !c.inactive;
    M.refresh();
    return c.inactive ? `Đã ngừng dùng danh mục "${c.name}"` : `Đã dùng lại danh mục "${c.name}"`;
  });
  M.defModal("cat-form", (id) => {
    const c = id ? M.cat(id) : null;
    return {
      title: c ? "Sửa danh mục" : "Thêm danh mục",
      submit: c ? "Lưu thay đổi" : "Thêm",
      body: `${M.field("Tên danh mục", M.input("name", { value: c ? c.name : "" }), { req: true })}
        <div class="grid g2">
          ${M.field("Khấu hao (tháng)", M.input("dep", { type: "number", value: c ? c.depMonths : 36, attrs: 'min="1" max="240"' }))}
          ${M.field("Điều khoản sử dụng", M.select("terms", (D.terms || []).map((t) => [t.id, t.name]), c ? c.termsId || "" : "", { blank: "Không gắn" }))}
        </div>`,
      onSubmit(f, form) {
        const name = (f.name || "").trim();
        if (!name) return M.invalid(form, "name", "Chưa nhập tên danh mục.");
        if (D.categories.some((x) => x.name.toLowerCase() === name.toLowerCase() && (!c || x.id !== c.id))) return M.invalid(form, "name", `Đã có danh mục "${name}".`);
        const rec = { name, depMonths: Number(f.dep) || null, termsId: f.terms || null };
        if (c) { Object.assign(c, rec); return "Đã lưu thay đổi"; }
        D.categories.push(Object.assign({ id: "c" + (D.categories.length + 1) }, rec));
        return `Đã thêm danh mục "${name}"`;
      },
    };
  });

  /* ===================== NT-4: Hãng và model ===================== */
  const canModel = () => M.can("catalog.edit") || M.can("asset.edit");
  const modelAssets = (id) => D.assets.filter((a) => a.model === id);
  M.screen("models", {
    nav: "models", title: "Hãng & model", codes: ["NT-4"],
    render() {
      const makers = [...new Set(D.models.map((m) => m.maker))].sort((a, b) => a.localeCompare(b, "vi"));
      const makerRows = makers.map((mk) => {
        const ms = D.models.filter((m) => m.maker === mk);
        return { mk, models: ms.length, assets: ms.reduce((s, m) => s + modelAssets(m.id).length, 0), dirty: ms.some((m) => m.dirty) };
      });
      const dirty = D.models.filter((m) => m.dirty);
      return M.page({
        title: "Hãng & model",
        sub: "Gộp dòng trùng, sửa tên và dọn model không còn tài sản dùng.",
        codes: ["NT-4"],
        body: `${dirty.length ? M.note(`${dirty.map((m) => `<b>${M.esc(m.maker)} / ${M.esc(m.name)}</b>`).join(", ")} do agent tự báo: hãng trùng với "Dell", tên model là mã máy. Gộp hãng vào "Dell", rồi sửa tên hoặc dọn model này.`, "warn") : ""}
          ${M.panel({
            title: `Hãng sản xuất (${makers.length})`, flush: true,
            body: M.table({
              id: "maker-table", rows: makerRows,
              cols: [
                { h: "Hãng", cls: "cell-name", r: (x) => M.esc(x.mk) + (x.dirty ? ` ${M.pill("Chuỗi máy tự báo", "warn")}` : "") },
                { h: "Model", cls: "right", r: (x) => `<span class="mono">${x.models}</span>` },
                { h: "Tài sản", cls: "right", r: (x) => `<span class="mono">${x.assets}</span>` },
                { h: "", cls: "right", r: (x) => (canModel() && x.mk === "Dell Inc." && makers.includes("Dell") ? M.btn('Gộp vào "Dell"', { sm: true, act: "maker-merge", arg: x.mk, confirm: 'Gộp hãng "Dell Inc." vào "Dell"? Mọi model của "Dell Inc." chuyển sang "Dell". Thao tác không hoàn tác và được ghi nhật ký kiểm toán.' }) : "") },
              ],
            }),
          })}
          <section class="panel flush">
            <div class="panel-head"><h2>Model (${D.models.length})</h2><span class="grow"></span></div>
            ${M.toolbar(M.searchBox("model-table", "Tìm hãng hoặc model"))}
            ${M.table({
              id: "model-table", rows: D.models.slice().sort((a, b) => (a.maker + a.name).localeCompare(b.maker + b.name, "vi")),
              cols: [
                { h: "Hãng", r: (m) => M.esc(m.maker) },
                { h: "Model", cls: "cell-name", r: (m) => M.esc(m.name) },
                { h: "Danh mục", r: (m) => (m.cat ? M.esc(M.cat(m.cat).name) : '<span class="muted">Chưa phân loại</span>') },
                { h: "Nguồn", r: (m) => (m.dirty ? M.pill("Agent tự báo", "warn") : M.pill("Nhập tay", "mute")) },
                { h: "Tài sản", cls: "right", r: (m) => `<span class="mono">${modelAssets(m.id).length}</span>` },
                { h: "", cls: "right", r: (m) => canModel() ? `<span class="row" style="justify-content:flex-end">${M.btn("Sửa tên", { sm: true, modal: "model-rename", arg: m.id })}${modelAssets(m.id).length ? M.btn("Gộp vào…", { sm: true, ghost: true, modal: "model-merge", arg: m.id }) : M.btn("Dọn", { sm: true, ghost: true, act: "model-clean", arg: m.id, confirm: `Xóa model "${m.maker} ${m.name}"? Không còn tài sản nào dùng model này.` })}</span>` : "" },
              ],
            })}
          </section>`,
      });
    },
  });
  M.action("maker-merge", (el, mk) => {
    let moved = 0;
    D.models.filter((m) => m.maker === mk).forEach((m) => { m.maker = "Dell"; moved++; });
    M.refresh();
    return `Đã gộp hãng "${mk}" vào "Dell". ${moved} model được chuyển.`;
  });
  M.action("model-clean", (el, id) => {
    const m = M.model(id);
    D.models.splice(D.models.indexOf(m), 1);
    M.refresh();
    return `Đã dọn model "${m.maker} ${m.name}"`;
  });
  M.defModal("model-rename", (id) => {
    const m = M.model(id);
    return {
      title: "Sửa tên model",
      submit: "Lưu thay đổi",
      body: `<div class="grid g2">${M.field("Hãng sản xuất", M.input("maker", { value: m.maker }), { req: true })}${M.field("Model", M.input("name", { value: m.name }), { req: true, hint: m.dirty ? 'Tên thương mại, ví dụ "ThinkPad T14 Gen 1"' : "" })}</div>
        ${M.field("Danh mục", M.select("cat", D.categories.map((c) => [c.id, c.name]), m.cat || "", { blank: "Chưa phân loại" }), { hint: "Áp cho mọi tài sản cùng model" })}`,
      onSubmit(f, form) {
        const maker = (f.maker || "").trim(), name = (f.name || "").trim();
        if (!maker) return M.invalid(form, "maker", "Hãng sản xuất và model đi cùng nhau: nhập cả hai hoặc để trống cả hai.");
        if (!name) return M.invalid(form, "name", "Hãng sản xuất và model đi cùng nhau: nhập cả hai hoặc để trống cả hai.");
        const dup = D.models.find((x) => x.id !== m.id && x.maker.toLowerCase() === maker.toLowerCase() && x.name.toLowerCase() === name.toLowerCase());
        if (dup) return M.invalid(form, "name", `Đã có model "${name}" của hãng "${maker}". Dùng "Gộp vào…" để gộp hai dòng.`);
        Object.assign(m, { maker, name, cat: f.cat || null, dirty: false });
        return "Đã lưu thay đổi";
      },
    };
  });
  M.defModal("model-merge", (id) => {
    const m = M.model(id);
    const n = modelAssets(id).length;
    return {
      title: `Gộp "${m.maker} ${m.name}" vào model khác`,
      submit: "Gộp",
      danger: true,
      body: `${M.field("Model giữ lại", M.select("target", D.models.filter((x) => x.id !== id).map((x) => [x.id, `${x.maker} - ${x.name}`]), "", { blank: "Chọn model" }), { req: true })}
        ${M.note(`<b>${n}</b> tài sản chuyển sang model giữ lại và lấy danh mục của model đó. Thao tác không hoàn tác.`, "warn")}`,
      onSubmit(f, form) {
        if (!f.target) return M.invalid(form, "target", "Chọn model giữ lại.");
        const t = M.model(f.target);
        modelAssets(id).forEach((a) => (a.model = t.id));
        D.models.splice(D.models.indexOf(m), 1);
        return `Đã gộp "${m.maker} ${m.name}" vào "${t.maker} ${t.name}" (${n} tài sản)`;
      },
    };
  });

  /* ===================== NT-3: Đơn vị ===================== */
  const unitChildren = (id) => D.orgUnits.filter((u) => u.parent === id);
  const unitScope = (id) => [id].concat(unitChildren(id).flatMap((u) => unitScope(u.id)));
  M.screen("org-units", {
    nav: "org-units", title: "Đơn vị", codes: ["NT-3"],
    render() {
      const rows = [];
      const walk = (u) => {
        rows.push({ kind: u.level === 0 ? "Công ty" : "Chi nhánh", u, level: u.level });
        D.departments.filter((d) => d.unit === u.id).forEach((d) => rows.push({ kind: "Phòng ban", d, level: u.level + 1 }));
        unitChildren(u.id).forEach(walk);
      };
      D.orgUnits.filter((u) => !u.parent).forEach(walk);
      const empCount = (x) => x.d ? D.employees.filter((e) => e.dept === x.d.id && e.status !== "left").length : D.employees.filter((e) => unitScope(x.u.id).includes(e.unit) && e.status !== "left").length;
      const assetCount = (x) => x.d ? D.employees.filter((e) => e.dept === x.d.id).reduce((s, e) => s + heldAssets(e.id).length, 0) : D.assets.filter((a) => unitScope(x.u.id).includes(a.unit)).length;
      const userCount = (x) => x.u ? Object.values(D.userUnits).filter((l) => l.includes(x.u.id)).length : "";
      const assignable = D.users.filter((u) => u.status !== "disabled");
      return M.page({
        title: "Đơn vị",
        sub: "Mỗi đơn vị chỉ thấy dữ liệu của mình; cấp tổng thấy tất cả.",
        codes: ["NT-3"],
        actions: M.btn("Điều chuyển tài sản", { modal: "unit-transfer", icon: "swap", perm: "org.manage" }) + M.btn("Thêm đơn vị", { primary: true, icon: "plus", perm: "org.manage", msg: "Mockup: mở form thêm đơn vị con (tên, mã, đơn vị cha)." }),
        above: M.cc("CC-2", "Công ty hiện có mấy đơn vị, có thật sự cần tách dữ liệu ngay từ đầu không? Tách về sau, khi đã nhiều dữ liệu, tốn công hơn nhiều vì mọi bảng và mọi màn đều phải lọc theo đơn vị. Màn này vẽ theo hướng có tách: công ty → chi nhánh → phòng ban."),
        body: `
          ${M.panel({
            title: "Cây đơn vị", flush: true,
            body: M.table({
              id: "unit-table", rows,
              cols: [
                { h: "Đơn vị", cls: "cell-name", r: (x) => `<div class="row" style="padding-left:${x.level * 26}px">${x.level ? '<span class="muted mono">└</span>' : ""}${M.icon(x.d ? "sitemap" : "building")}<span>${M.esc(x.u ? x.u.name : x.d.name)}</span></div>` },
                { h: "Loại", r: (x) => M.pill(x.kind, x.kind === "Phòng ban" ? "mute" : "info") },
                { h: "Mã", r: (x) => `<span class="mono">${M.esc(x.u ? x.u.code : "")}</span>` },
                { h: "Nhân viên", cls: "right", r: (x) => `<span class="mono">${empCount(x)}</span>` },
                { h: "Tài sản", cls: "right", r: (x) => `<span class="mono">${assetCount(x)}</span>` },
                { h: "Tài khoản được gán", cls: "right", r: (x) => `<span class="mono">${userCount(x)}</span>` },
              ],
            }),
          })}
          <div class="grid g2" style="align-items:start">
            ${M.panel({
              title: "Tài khoản và đơn vị được gán", flush: true,
              body: M.table({
                id: "uu-table", rows: assignable,
                cols: [
                  { h: "Tài khoản", cls: "cell-name", r: (u) => M.esc(u.name) },
                  { h: "Vai trò", r: (u) => M.esc(M.roleLabel(u.role)) },
                  { h: "Đơn vị", cls: "wrap", r: (u) => M.map(D.userUnits[u.id] || [], (id) => M.pill(unitName(id), id === "u0" ? "accent" : "info") + " ") || '<span class="muted">Chưa gán</span>' },
                  { h: "", cls: "right", r: (u) => M.btn("Gán đơn vị", { sm: true, modal: "unit-assign", arg: u.id, perm: "org.manage" }) },
                ],
              }),
            })}
            ${M.panel({
              title: "Điều chuyển giữa hai đơn vị", flush: true,
              body: M.table({
                id: "ut-table", rows: D.unitTransfers,
                empty: "Chưa có lần điều chuyển nào.",
                cols: [
                  { h: "Tài sản", r: (t) => { const a = M.asset(t.assetId); return M.tape(a.tag, a.id) + `<div class="cell-sub">${M.esc(t.at)} - ${M.esc(t.by)}</div>`; } },
                  { h: "Từ → sang", cls: "wrap", r: (t) => `${M.esc(unitName(t.from))} → ${M.esc(unitName(t.to))}<div class="cell-sub">${M.esc(t.note)}</div>` },
                ],
              }),
            })}
          </div>`,
      });
    },
  });
  M.defModal("unit-assign", (id) => {
    const u = D.users.find((x) => x.id === id);
    const cur = D.userUnits[id] || [];
    return {
      title: "Gán đơn vị cho " + u.name,
      submit: "Lưu",
      body: `<div class="field"><span>Đơn vị được làm việc <span class="req">*</span></span>${M.map(D.orgUnits, (o) => `<label class="check" style="padding-left:${o.level * 20}px"><input type="checkbox" name="units" value="${o.id}" ${cur.includes(o.id) ? "checked" : ""}> ${M.esc(o.name)}</label>`)}</div>`,
      onSubmit(f, form) {
        const picked = [...form.querySelectorAll('input[name="units"]:checked')].map((c) => c.value);
        if (!picked.length) return M.invalid(form, "units", "Chọn ít nhất một đơn vị.");
        D.userUnits[id] = picked;
        return `Đã gán ${u.username} vào ${picked.map(unitName).join(", ")}`;
      },
    };
  });
  M.defModal("unit-transfer", () => ({
    title: "Điều chuyển tài sản giữa hai đơn vị",
    submit: "Điều chuyển",
    body: `${M.field("Tài sản", M.select("asset", D.assets.filter((a) => a.status !== "archived").map((a) => [a.id, `${a.tag} - ${a.name} (${unitName(a.unit)})`]), "", { blank: "Chọn tài sản" }), { req: true })}
      ${M.field("Sang đơn vị", M.select("to", D.orgUnits.filter((u) => u.level > 0).map((u) => [u.id, u.name]), "u2"), { req: true })}
      ${M.field("Lý do", M.textarea("note", "", { ph: "Ví dụ: chuyển máy cho nhân viên chi nhánh" }))}`,
    onSubmit(f, form) {
      if (!f.asset) return M.invalid(form, "asset", "Chọn tài sản cần điều chuyển.");
      const a = M.asset(f.asset);
      if (a.unit === f.to) return M.invalid(form, "to", "Tài sản đã thuộc đơn vị này.");
      D.unitTransfers.unshift({ at: "27/11/2026 15:00", assetId: a.id, from: a.unit, to: f.to, by: M.me().user, note: f.note || "Không ghi lý do" });
      const from = unitName(a.unit);
      a.unit = f.to;
      return `Đã điều chuyển ${a.tag} từ ${from} sang ${unitName(f.to)}. Nhật ký ghi ở cả hai đơn vị.`;
    },
  }));

  /* ===================== NT-1, NT-2: Tài khoản ===================== */
  const USER_ST = { pending: ["Chờ duyệt", "warn"], active: ["Đang hoạt động", "ok"], disabled: ["Đã khóa", "mute"] };
  /* Bảng quyền đang áp dụng (NT-2). Cột theo thứ tự M.ROLES. */
  const PERM_NOW = [
    ["Xem mọi tài sản, lịch sử, nhân viên, vị trí, danh mục", "Y Y Y Y Y -"],
    ["Thêm và sửa tài sản", "Y - Y - - -"],
    ["Đổi trạng thái tài sản, kể cả thanh lý", "Y - Y - - -"],
    ["Cấp phát và thu hồi tài sản", "Y - Y - - -"],
    ["Thêm và sửa nhân viên", "Y - Y - - -"],
    ["Thêm và sửa danh mục, vị trí", "Y - - - - -"],
    ["Duyệt, khóa, đổi vai trò, nối tài khoản với nhân viên", "Y - - - - -"],
    ["Cấp và thu hồi mã kết nạp, thu hồi agent", "Y Y - - - -"],
    ["Gắn máy do agent báo cáo vào tài sản có sẵn, bỏ gắn", "Y Y Y - - -"],
    ["Xem thông tin xác thực dùng để quét (Module 1)", "Y Y - - - -"],
    ["Chạy script từ xa (Module 6)", "Y Y - - - -"],
    ["Viết truy vấn SQL trực tiếp (Module 7)", "Y Y - - - -"],
  ];
  /* Đề xuất cho phần chưa làm (mục 13). R = chỉ xem, m = chỉ dữ liệu của mình. */
  const PERM_PLAN = [
    ["Nền tảng"],
    ["Khai báo đơn vị, gán tài khoản vào đơn vị", "NT-3", "Y - - - R -"],
    ["Xem và xuất nhật ký kiểm toán", "NT-5", "R - - - R -"],
    ["Cấu hình thông báo, kênh gửi, SSO, khóa API, webhook", "NT-6, NV-7.3.1 → 7.3.5", "Y - - - R -"],
    ["Module 1"],
    ["Thông tin xác thực dùng để quét", "NV-1.1.1", "Y Y - - - -"],
    ["Mục tiêu quét, lịch quét, trạm vệ tinh", "NV-1.1.2 → 1.1.5, NV-1.2.3", "Y Y - - R -"],
    ["Xử lý nghi trùng, gộp tài sản", "NV-1.3.2", "Y Y Y - R -"],
    ["Xem lịch sử thay đổi phần cứng", "NV-1.3.3", "R R R R R -"],
    ["Module 2"],
    ["Phụ kiện và vật tư: khai báo, cấp, thu, nhập", "NV-2.1.3, NV-2.1.5", "Y R Y R R Rm"],
    ["Linh kiện: khai báo, lắp, tháo", "NV-2.1.4", "Y Y Y R R -"],
    ["Nhập tài sản từ tệp, điều chuyển", "NV-2.1.6, NV-2.2.6", "Y - Y - - -"],
    ["Soạn điều khoản sử dụng", "NV-2.3.3", "Y - Y - R -"],
    ["Ký biên bản bàn giao", "NV-2.3.2", "- - - - - Ym"],
    ["Xem biên bản và trạng thái ký", "NV-2.3.1", "R - R R R Rm"],
    ["Mở đợt kiểm kê, xử lý chênh lệch", "NV-2.4.3, NV-2.4.4", "Y - Y - R -"],
    ["Module 3"],
    ["Chuẩn hóa tên phần mềm, danh sách cho phép và cấm", "NV-3.1.1, NV-3.1.5", "Y Y - - R -"],
    ["Kho bản quyền, gán ghế, gia hạn", "NV-3.1.2, 3.1.3, 3.1.6", "Y R Y R R -"],
    ["Xem đầy đủ khóa bản quyền", "NV-3.1.2", "Y - Y - - -"],
    ["Lỗ hổng, hết hạn hỗ trợ, tuân thủ: xem", "NV-3.1.4, 3.2.2, 3.3.1 → 3.3.3", "R R R R R -"],
    ["Lỗ hổng: ghi nhận xử lý, chấp nhận rủi ro", "NV-3.2.3", "Y Y - - R -"],
    ["Module 4"],
    ["Tạo và theo dõi yêu cầu của mình", "NV-4.1.1", "Y Y Y Y Y Y"],
    ["Xử lý ticket, vấn đề gốc", "NV-4.1.2, 4.1.3, 4.1.5", "Y Y Y Y R -"],
    ["Lập và thực hiện yêu cầu thay đổi", "NV-4.1.6", "Y Y - R R -"],
    ["Cấu hình định tuyến, SLA, lịch làm việc", "NV-4.1.2, 4.2.1", "Y - - Y R -"],
    ["Khai báo quan hệ CMDB", "NV-4.4.1", "Y Y - - R -"],
    ["Xem sơ đồ quan hệ, phân tích tác động", "NV-4.4.2, 4.4.3", "R R R R R -"],
    ["Viết bài tri thức", "NV-4.5.1", "Y Y - Y R -"],
    ["Đọc hỏi đáp công khai", "NV-4.5.2", "R R R R R R"],
    ["Module 5"],
    ["Nhà cung cấp, đơn mua, hợp đồng, chứng từ", "NV-5.1.1 → 5.1.4", "Y - Y - R -"],
    ["Bảo hành: nhập và tra cứu", "NV-5.2.1", "Y - Y R R -"],
    ["Quy tắc khấu hao, xem giá mua và giá trị còn lại", "NV-5.3.1, 5.3.2", "Y - Y - R -"],
    ["Module 6"],
    ["Gói cài, đợt triển khai", "NV-6.1.1 → 6.1.3", "Y Y - - R -"],
    ["Soạn và chạy script từ xa", "NV-6.2.1, 6.2.2", "Y Y - - R -"],
    ["Duyệt chạy script", "NV-6.2.3", "Y - - - - -"],
    ["Module 7"],
    ["Dashboard theo vai trò", "NV-7.1.1", "R R R R R -"],
    ["Báo cáo dựng sẵn, trình tạo báo cáo, đặt lịch gửi", "NV-7.2.1, 7.2.2, 7.2.4", "Y Y Y Y Y -"],
    ["Truy vấn SQL trực tiếp", "NV-7.2.3", "Y Y - - - -"],
  ];
  const permCell = (s) => {
    const mine = s.endsWith("m") ? ' <span class="muted small">của mình</span>' : "";
    const k = s.replace("m", "");
    if (k === "Y") return `<b title="Được thao tác">●</b>${mine}`;
    if (k === "R") return `<span title="Chỉ xem">○</span>${mine}`;
    return '<span class="muted" title="Không thấy">–</span>';
  };
  const permHead = () => `<tr><th class="wrap">Quyền</th>${M.ROLES.map((r) => `<th class="center wrap">${M.esc(r.label)}</th>`).join("")}</tr>`;

  M.screen("users", {
    nav: "users", title: "Tài khoản", codes: ["NT-1", "NT-2"],
    render() {
      const order = { pending: 0, active: 1, disabled: 2 };
      const rows = D.users.slice().sort((a, b) => order[a.status] - order[b.status]);
      const me = M.me().username;
      const cnt = (st) => D.users.filter((u) => u.status === st).length;
      const empOpts = [["", "Chưa nối"]].concat(D.employees.filter((e) => e.status !== "left" || D.users.some((u) => u.employeeId === e.id)).map((e) => [e.id, empLabel(e)]));
      const actionsOf = (u) => {
        if (u.username === me) return "";
        const n = u.name;
        if (u.status === "pending") return M.btn("Duyệt", { sm: true, primary: true, act: "user-approve", arg: u.id }) + M.btn("Từ chối", { sm: true, act: "user-reject", arg: u.id, confirm: `Từ chối và xóa yêu cầu đăng ký của ${n}?` });
        if (u.status === "active") return M.btn("Khóa", { sm: true, act: "user-lock", arg: u.id, confirm: `Khóa tài khoản ${n}? Người này sẽ bị đăng xuất ngay.` });
        return M.btn("Mở khóa", { sm: true, act: "user-unlock", arg: u.id }) + M.btn("Xóa", { sm: true, danger: true, act: "user-delete", arg: u.id, confirm: `Xóa hẳn tài khoản ${n}? Không khôi phục lại được.` });
      };
      const permNow = `<div class="table-scroll"><table><thead>${permHead()}</thead><tbody>${PERM_NOW.map(([name, cells]) => `<tr><td class="wrap">${M.esc(name)}</td>${cells.split(" ").map((c) => `<td class="center">${permCell(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      const permPlan = `<div class="table-scroll"><table><thead><tr><th class="wrap">Chức năng</th><th>Nghiệp vụ</th>${M.ROLES.map((r) => `<th class="center wrap">${M.esc(r.label)}</th>`).join("")}</tr></thead><tbody>${PERM_PLAN.map((row) => row.length === 1
        ? `<tr><td colspan="8" style="background:var(--surface-2)"><b class="small">${M.esc(row[0])}</b></td></tr>`
        : `<tr><td class="wrap">${M.esc(row[0])}</td><td class="mono small">${M.esc(row[1])}</td>${row[2].split(" ").map((c) => `<td class="center">${permCell(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      return M.page({
        title: "Tài khoản",
        sub: "Đổi vai trò hoặc khóa có hiệu lực ngay, kể cả với phiên đang đăng nhập.",
        codes: ["NT-1", "NT-2"],
        body: `${M.stats([
            { label: "Chờ duyệt", value: cnt("pending"), tone: "warn" },
            { label: "Đang hoạt động", value: cnt("active"), tone: "ok" },
          ])}
          <section class="panel flush">
            <div class="panel-head"><h2>Tài khoản (${D.users.length})</h2><span class="grow"></span></div>
            ${M.table({
              id: "user-table", rows,
              cols: [
                { h: "Họ tên", cls: "cell-name", r: (u) => M.esc(u.name) + (u.username === me ? ' <span class="muted">(bạn)</span>' : "") },
                { h: "Tên đăng nhập", r: (u) => `<span class="mono">${M.esc(u.username)}</span>` },
                { h: "Vai trò", r: (u) => u.username === me ? M.esc(M.roleLabel(u.role)) : M.select("role-" + u.id, M.ROLES.map((r) => [r.key, r.label]), u.role, { attrs: `data-change="user-role" data-user="${u.id}" aria-label="Vai trò của ${M.esc(u.name)}" style="min-width:170px"` }) },
                { h: "Hồ sơ nhân viên", r: (u) => M.select("emp-" + u.id, empOpts, u.employeeId || "", { attrs: `data-change="user-link" data-user="${u.id}" aria-label="Hồ sơ nhân viên của ${M.esc(u.name)}" style="min-width:210px"` }) },
                { h: "Trạng thái", r: (u) => M.pill(USER_ST[u.status][0], USER_ST[u.status][1]) },
                { h: "Thao tác", r: (u) => `<span class="row">${actionsOf(u)}</span>` },
              ],
            })}
          </section>
          ${M.panel({
            title: "Bảng quyền",
            actions: '<span class="small">● Được thao tác - ○ Chỉ xem - – Không thấy</span>',
            body: M.tabs("perm-tabs", [
              { key: "now", label: "Đang áp dụng (NT-2)", body: permNow },
              { key: "plan", label: "Đề xuất cho phần chưa làm (mục 13)", body: `${permPlan}${M.cc("CC-19", "Ai được cấp quyền truy vấn SQL trực tiếp? NV-7.2.3 nêu cả Kiểm toán, bảng quyền hiện chỉ gán Quản trị hệ thống và Quản trị hạ tầng.")}` },
            ]),
          })}`,
      });
    },
  });
  const userOf = (el, id) => D.users.find((u) => u.id === (id || el.dataset.user));
  M.action("user-role", (el, value) => {
    const u = userOf(el);
    if (value === "admin" && !window.confirm(`Cấp vai trò Quản trị hệ thống cho ${u.name}? Vai trò này có toàn quyền, kể cả quản lý tài khoản.`)) { el.value = u.role; return; }
    u.role = value;
    M.refresh();
    return `Đã đổi vai trò của ${u.name} thành ${M.roleLabel(value)}`;
  });
  M.action("user-link", (el, value) => {
    const u = userOf(el);
    if (!value) { u.employeeId = null; M.refresh(); return `Đã bỏ nối hồ sơ nhân viên của ${u.name}`; }
    const other = D.users.find((x) => x.employeeId === value && x.id !== u.id);
    if (other) { el.value = u.employeeId || ""; M.toast(`Nhân viên này đã được nối với tài khoản ${other.username}.`, "bad"); return; }
    u.employeeId = value;
    const e = M.emp(value);
    M.refresh();
    return `Đã nối ${u.username} với ${empLabel(e)}`;
  });
  M.action("user-approve", (el, id) => { const u = userOf(el, id); u.status = "active"; M.refresh(); return `Đã duyệt tài khoản ${u.name}`; });
  M.action("user-reject", (el, id) => { const u = userOf(el, id); D.users.splice(D.users.indexOf(u), 1); M.refresh(); return `Đã từ chối yêu cầu của ${u.name}`; });
  M.action("user-lock", (el, id) => { const u = userOf(el, id); u.status = "disabled"; M.refresh(); return `Đã khóa tài khoản ${u.name}`; });
  M.action("user-unlock", (el, id) => { const u = userOf(el, id); u.status = "active"; M.refresh(); return `Đã mở khóa tài khoản ${u.name}`; });
  M.action("user-delete", (el, id) => {
    const u = userOf(el, id);
    if (USERS_WITH_LOG.has(u.id)) { M.toast("Tài khoản này đã có thao tác trong nhật ký nên không xóa được. Hãy khóa tài khoản thay cho xóa.", "bad"); return; }
    D.users.splice(D.users.indexOf(u), 1);
    M.refresh();
    return `Đã xóa tài khoản ${u.name}`;
  });

  /* ===================== NT-5: Nhật ký kiểm toán ===================== */
  const auditF = { from: "", to: "", user: "", act: "" };
  M.action("audit-filter", (form, d) => { Object.assign(auditF, { from: d.from || "", to: d.to || "", user: d.user || "", act: d.act || "" }); M.refresh(); });
  M.action("audit-reset", () => { Object.assign(auditF, { from: "", to: "", user: "", act: "" }); M.refresh(); });

  M.screen("audit-log", {
    nav: "audit-log", title: "Nhật ký kiểm toán", codes: ["NT-5"],
    render() {
      const rows = D.auditLog
        .filter((r) => (!auditF.user || r.user === auditF.user) && (!auditF.act || r.act === auditF.act)
          && (!auditF.from || dkey(r.at) >= isoKey(auditF.from)) && (!auditF.to || dkey(r.at) <= isoKey(auditF.to) + 2359))
        .sort((a, b) => dkey(b.at) - dkey(a.at));
      const who = (n) => { const u = userByName(n); return u ? `${u.name} - ${M.roleLabel(u.role)}` : n; };
      const users = [...new Set(D.auditLog.map((r) => r.user))];
      const detail = (r) => r.field
        ? `Trường <b>${M.esc(r.field)}</b>: <span class="mono">${r.before ? `"${M.esc(r.before)}"` : '<span class="muted">(trống)</span>'}</span> → <span class="mono">"${M.esc(r.after)}"</span>`
        : M.esc(r.detail || "");
      return M.page({
        title: "Nhật ký kiểm toán",
        codes: ["NT-5"],
        actions: M.btn("Xuất ra tệp", { icon: "download", perm: "audit.view", msg: `Đã xuất ${rows.length} dòng đang lọc ra tệp CSV (mockup). Lần xuất này cũng được ghi vào nhật ký.` }),
        body: `${M.cc("CC-3", "Nhật ký kiểm toán lưu bao lâu? Ảnh hưởng dung lượng cơ sở dữ liệu và cách lưu trữ dài hạn (ví dụ đẩy sang SIEM, NV-7.3.4).")}
          <section class="panel flush">
            ${M.form("audit-filter", `<div class="toolbar">
              ${M.field("Từ ngày", M.input("from", { type: "date", value: auditF.from }))}
              ${M.field("Đến ngày", M.input("to", { type: "date", value: auditF.to }))}
              ${M.field("Tài khoản", M.select("user", users.map((n) => [n, n === "system" ? "Hệ thống" : n]), auditF.user, { blank: "Mọi tài khoản" }))}
              ${M.field("Hành động", M.select("act", Object.keys(AUDIT_ACT).map((k) => [k, AUDIT_ACT[k][0]]), auditF.act, { blank: "Mọi hành động" }))}
              <div class="row" style="align-self:flex-end">${M.btn("Lọc", { type: "submit", primary: true, icon: "filter" })}${M.btn("Bỏ lọc", { act: "audit-reset", ghost: true })}</div>
            </div>`)}
            ${M.table({
              id: "audit-table", rows, empty: "Không có dòng nhật ký nào khớp bộ lọc.",
              cols: [
                { h: "Thời điểm", r: (r) => `<span class="mono">${M.esc(r.at)}</span>` },
                { h: "Tài khoản", r: (r) => (r.user === "system" ? "Hệ thống" : `<span class="mono" title="${M.esc(who(r.user))}">${M.esc(r.user)}</span>`) },
                { h: "IP", r: (r) => `<span class="mono">${M.esc(r.ip || "—")}</span>` },
                { h: "Hành động", r: (r) => M.pill(AUDIT_ACT[r.act][0], AUDIT_ACT[r.act][1]) },
                { h: "Đối tượng", cls: "wrap", r: (r) => (/^TS-\d+$/.test(r.target) && M.assetByTag(r.target) ? M.tape(r.target, M.assetByTag(r.target).id) : M.esc(r.target)) },
                { h: "Chi tiết", cls: "wrap", r: detail },
              ],
            })}
            <div class="panel-foot"><span>${rows.length} dòng</span></div>
          </section>
          ${M.anno("Hiện code chỉ ghi chuỗi lưu ký của từng tài sản, chưa có IP và chưa ghi các hành động ngoài tài sản. Dòng sửa tài sản ở đây ghi tên trường, giá trị trước và sau theo đề xuất của NT-5.")}`,
      });
    },
  });

  /* ===================== NT-6, NV-7.3.5: Thông báo và kênh gửi ===================== */
  M.screen("notify-settings", {
    nav: "notify-settings", title: "Thông báo & kênh gửi", codes: ["NT-6", "NV-7.3.5"],
    render() {
      const can = M.can("system.config");
      const chCard = (c) => M.panel({
        title: `${M.esc(c.name)}`,
        actions: `${c.enabled ? M.pill("Đang bật", "ok") : M.pill("Đang tắt", "mute")}${c.required ? " " + M.pill("Bắt buộc", "accent") : ""}${can ? " " + M.btn(c.enabled ? "Tắt kênh" : "Bật kênh", { sm: true, ghost: true, act: "channel-toggle", arg: c.id }) : ""}`,
        body: `<p class="muted small" style="margin-bottom:10px">${M.esc(c.kind)}</p>
          ${c.fields.length ? M.kv(c.fields.map(([k, v]) => [k, `<span class="mono small">${M.esc(v)}</span>`])) : ""}
          ${c.test ? (c.test[0] === "ok" ? `<p class="small" style="margin-top:12px">${M.esc(c.test[1])}</p>` : `<div style="margin-top:12px">${M.note(M.esc(c.test[1]), "bad")}</div>`) : ""}
          ${can ? `<div class="row" style="margin-top:12px">${M.btn("Cấu hình", { sm: true, modal: "channel-form", arg: c.id })}${M.btn("Gửi thử", { sm: true, act: "channel-test", arg: c.id, icon: "send" })}</div>` : ""}`,
      });
      const evTable = M.table({
        id: "ev-table", rows: D.notifyEvents,
        cols: [
          { h: "Sự kiện", cls: "cell-name", r: (e) => M.esc(e.name) },
          { h: "Người nhận", cls: "wrap", r: (e) => M.esc(e.to.join(", ")) },
          { h: "Kênh", r: (e) => M.map(e.ch, (c) => M.pill(CH_NAME[c], "info") + " ") },
          { h: "Mốc nhắc lại", cls: "wrap", r: (e) => M.esc(e.remind) },
          { h: "Bật", r: (e) => (e.on ? M.pill("Bật", "ok") : M.pill("Tắt", "mute")) },
          { h: "", cls: "right", r: (e) => M.btn("Sửa", { sm: true, modal: "event-form", arg: e.id, perm: "system.config" }) },
        ],
      });
      const logTable = M.table({
        id: "nlog-table", rows: D.notifyLog,
        cols: [
          { h: "Thời điểm", r: (r) => `<span class="mono">${M.esc(r[0])}</span>` },
          { h: "Sự kiện", cls: "wrap", r: (r) => M.esc(r[1]) },
          { h: "Người nhận", r: (r) => M.esc(r[2]) },
          { h: "Kênh", r: (r) => M.pill(CH_NAME[r[3]], "info") },
          { h: "Kết quả", r: (r) => (r[4] === "ok" ? M.pill("Đã gửi", "ok") : M.pill("Thất bại", "bad")) },
          { h: "Lý do", cls: "wrap", r: (r) => (r[5] ? M.esc(r[5]) : '<span class="muted">—</span>') },
        ],
      });
      return M.page({
        title: "Thông báo & kênh gửi",
        codes: ["NT-6", "NV-7.3.5"],
        body: `
          ${M.tabs("notify-tabs", [
            { key: "ch", label: "Kênh gửi", n: D.notifyChannels.filter((c) => c.enabled).length, body: `<div class="grid g2">${M.map(D.notifyChannels, chCard)}</div>` },
            { key: "ev", label: "Sự kiện và người nhận", n: D.notifyEvents.length, body: `<section class="panel flush">${evTable}</section>` },
            { key: "log", label: "Lịch sử gửi", n: D.notifyLog.filter((r) => r[4] === "bad").length + " lỗi", body: `<section class="panel flush">${logTable}</section>` },
          ])}`,
      });
    },
  });
  M.action("channel-test", (el, id) => {
    const c = D.notifyChannels.find((x) => x.id === id);
    if (!c.fields.length) { M.toast(`Kênh ${c.name} chưa được cấu hình nên chưa gửi thử được.`, "bad"); return; }
    if (c.test && c.test[0] === "bad") { M.toast("Gửi thử thất bại: Telegram trả lỗi 401 Unauthorized (bot token không hợp lệ). Kiểm tra lại bot token.", "bad"); return; }
    return `Đã gửi tin thử qua ${c.name}. Kiểm tra hộp thư hoặc kênh nhận.`;
  });
  M.action("channel-toggle", (el, id) => {
    const c = D.notifyChannels.find((x) => x.id === id);
    if (c.required && c.enabled) { M.toast("Không tắt được kênh Email: đây là kênh bắt buộc vì biên bản bàn giao và báo cáo định kỳ cần tới.", "bad"); return; }
    if (!c.enabled && !c.fields.length) { M.toast(`Cấu hình kênh ${c.name} trước khi bật.`, "bad"); return; }
    c.enabled = !c.enabled;
    M.refresh();
    return c.enabled ? `Đã bật kênh ${c.name}` : `Đã tắt kênh ${c.name}. Không thông báo nào còn đi qua kênh này.`;
  });
  M.defModal("channel-form", (id) => {
    const c = D.notifyChannels.find((x) => x.id === id);
    const secret = (name, label) => M.field(label, M.input(name, { type: "password", ph: c.fields.length ? "Để trống nếu giữ giá trị cũ" : "" }), { hint: "Không hiện lại sau khi lưu" });
    const bodies = {
      email: `<div class="row">${M.radio("auth", "smtp", "SMTP tài khoản và mật khẩu", true)}${M.radio("auth", "oauth", "OAuth2 (Microsoft 365)", false)}</div>
        <div class="grid g2">${M.field("Máy chủ SMTP", M.input("host", { value: "smtp.anphat.vn" }), { req: true })}${M.field("Cổng", M.select("port", [["587", "587 - STARTTLS"], ["465", "465 - SSL"], ["25", "25 - không mã hóa"]], "587"))}</div>
        <div class="grid g2">${M.field("Tài khoản gửi", M.input("user", { value: "itam-noreply@anphat.vn" }))}${secret("pass", "Mật khẩu")}</div>
        ${M.field("Tên người gửi", M.input("from", { value: "ITAM An Phát" }))}`,
      teams: secret("url", "Webhook URL của kênh Teams"),
      slack: `${secret("token", "Bot token")}${M.field("Kênh nhận", M.input("channel", { ph: "#it-canh-bao" }))}`,
      telegram: `${secret("token", "Bot token")}${M.field("Chat ID", M.input("chat", { value: "-1002233445566" }))}`,
    };
    return {
      title: "Cấu hình kênh " + c.name,
      submit: "Lưu cấu hình",
      body: bodies[c.id],
      onSubmit(f, form) {
        if (c.id === "email" && !(f.host || "").trim()) return M.invalid(form, "host", "Chưa nhập máy chủ SMTP.");
        if (c.id !== "email" && !c.fields.length && !(f.token || f.url)) return M.invalid(form, c.id === "teams" ? "url" : "token", "Chưa nhập thông tin kết nối.");
        if (c.id === "slack" && !c.fields.length) { c.fields = [["Bot token", "xoxb-••••••••"], ["Kênh nhận", f.channel || "#it-canh-bao"]]; c.kind = "Bot vào kênh " + (f.channel || "#it-canh-bao"); }
        return `Đã lưu cấu hình kênh ${c.name}. Bấm "Gửi thử" để kiểm tra.`;
      },
    };
  });
  M.defModal("event-form", (id) => {
    const e = D.notifyEvents.find((x) => x.id === id);
    const recips = ["Quản trị hệ thống", "Quản trị hạ tầng", "Quản lý tài sản", "Helpdesk", "Kiểm toán", "Người liên quan trực tiếp"];
    return {
      title: e.name,
      submit: "Lưu",
      body: `<div class="field"><span>Người nhận</span>${M.map(recips, (r) => M.checkbox("to", r, e.to.some((t) => t.includes(r)) || (r === "Người liên quan trực tiếp" && e.to.some((t) => /Người|Nhân viên/.test(t)))))}</div>
        <div class="field"><span>Kênh</span><div class="row">${M.map(D.notifyChannels, (c) => M.checkbox("ch", c.name + (c.enabled ? "" : " (đang tắt)"), e.ch.includes(c.id), { attrs: `value="${c.id}"` }))}</div></div>
        ${M.field("Mốc nhắc lại", M.input("remind", { value: e.remind }), { hint: "Ví dụ: Còn 90, 60, 30 ngày" })}
        ${M.checkbox("on", "Bật thông báo cho sự kiện này", e.on)}`,
      onSubmit(f, form) {
        const ch = [...form.querySelectorAll('input[name="ch"]:checked')].map((x) => x.value);
        if (!ch.length) return M.invalid(form, "ch", "Chọn ít nhất một kênh.");
        e.ch = ch;
        e.remind = f.remind || e.remind;
        e.on = !!f.on;
        return `Đã lưu cấu hình sự kiện "${e.name}"`;
      },
    };
  });

  /* ===================== NV-7.3.1: SSO và đồng bộ danh bạ ===================== */
  M.screen("integrations/sso", {
    nav: "integrations/sso", title: "SSO & danh bạ", codes: ["NV-7.3.1"],
    render() {
      const can = M.can("system.config");
      return M.page({
        title: "SSO & danh bạ",
        codes: ["NV-7.3.1"],
        actions: can ? M.btn("Kiểm tra kết nối", { msg: "Kết nối tới ldaps://dc01.anphat.local:636 thành công (đọc được 214 người)." }) + M.btn("Đồng bộ ngay", { primary: true, icon: "refresh", msg: "Đã bắt đầu đồng bộ danh bạ. Kết quả hiện ở bảng Lịch sử đồng bộ." }) : "",
        above: M.cc("CC-20", "Công ty dùng nguồn danh bạ nào? Khi bật SSO thì có giữ luồng tự đăng ký và chờ duyệt hiện nay (NT-1) không? Màn này vẽ theo hướng Active Directory và tạm giữ cả hai luồng."),
        body: `
          <div class="grid g2" style="align-items:start">
            <div class="stack">
              ${M.panel({
                title: "Nguồn danh bạ",
                body: `<div class="row" style="margin-bottom:14px">${M.seg("dir-src", [["ad", "Active Directory"], ["ldap", "LDAP"], ["entra", "Microsoft Entra ID"], ["google", "Google Workspace"], ["okta", "Okta"]], "ad")}</div>
                  ${M.kv([
                    ["Máy chủ", '<span class="mono">ldaps://dc01.anphat.local:636</span>'],
                    ["Base DN", '<span class="mono">OU=Nhan vien,DC=anphat,DC=local</span>'],
                    ["Tài khoản đọc", '<span class="mono">svc-itam-ldap</span> - mật khẩu <span class="mono">••••••••</span>'],
                    ["Chu kỳ đồng bộ", "Mỗi 4 giờ"],
                  ])}
                  ${can ? `<div class="row" style="margin-top:12px">${M.btn("Sửa cấu hình", { sm: true, msg: "Mockup: mở form sửa máy chủ, Base DN, tài khoản đọc và chu kỳ." })}</div>` : ""}`,
              })}
              ${M.panel({
                title: "Ánh xạ nhóm sang vai trò", flush: true,
                body: M.table({
                  id: "sso-map", rows: D.ssoGroupMap,
                  cols: [
                    { h: "Nhóm trong danh bạ", r: (g) => `<span class="mono">${M.esc(g[0])}</span>` },
                    { h: "Vai trò trong ITAM", r: (g) => can ? M.select("map-" + g[0], M.ROLES.map((r) => [r.key, r.label]), g[1], { attrs: `data-change="sso-map" data-group="${M.esc(g[0])}" aria-label="Vai trò cho nhóm ${M.esc(g[0])}"` }) : M.esc(M.roleLabel(g[1])) },
                    { h: "Thành viên", cls: "right", r: (g) => `<span class="mono">${M.esc(g[2])}</span>` },
                  ],
                }),
              })}
            </div>
            <div class="stack">
              ${M.panel({
                title: "Đăng nhập một lần (SSO)",
                actions: M.pill("Đang tắt", "mute"),
                body: `<div class="row" style="margin-bottom:12px">${M.radio("proto", "saml", "SAML 2.0", true)}${M.radio("proto", "oidc", "OpenID Connect", false)}</div>
                  ${M.kv([
                    ["Entity ID", '<span class="mono small">https://itam.anphat.vn/sso/metadata</span>'],
                    ["ACS URL", '<span class="mono small">https://itam.anphat.vn/sso/acs</span>'],
                    ["Metadata của IdP", '<span class="mono small">https://adfs.anphat.vn/FederationMetadata/2007-06/FederationMetadata.xml</span>'],
                    ["Chứng chỉ IdP", '<span class="mono small">SHA-256 4A:9C:…:E1 - hết hạn 14/03/2028</span>'],
                    ["Tự đăng ký khi có SSO", "Tạm giữ, chờ chốt CC-20"],
                  ])}
                  ${can ? `<div class="row" style="margin-top:12px">${M.btn("Bật SSO", { sm: true, primary: true, confirm: "Bật đăng nhập một lần cho toàn hệ thống? Tài khoản admin dự phòng vẫn đăng nhập được bằng mật khẩu.", msg: "Đã bật SSO (mockup). Lần đăng nhập đầu, tài khoản tự nối với hồ sơ nhân viên theo email." })}</div>` : ""}`,
              })}
              ${M.panel({
                title: "Xác thực hai lớp bằng mã TOTP",
                body: `<div class="stack-sm">
                    ${M.checkbox("mfa-admin", "Bắt buộc với Quản trị hệ thống và Quản trị hạ tầng", true, { attrs: can ? "" : "disabled" })}
                    ${M.checkbox("mfa-asset", "Bắt buộc với Quản lý tài sản, Helpdesk, Kiểm toán", false, { attrs: can ? "" : "disabled" })}
                    ${M.checkbox("mfa-emp", "Bắt buộc với Nhân viên", false, { attrs: can ? "" : "disabled" })}
                  </div>
                  <div class="row" style="margin-top:12px">${M.btn("Xem màn nhập mã", { sm: true, href: "#/login/mfa" })}</div>`,
              })}
              ${M.panel({
                title: "Tài khoản quản trị dự phòng",
                body: M.person("Trần Minh Quân", "#/employees/e15", "quan.tm - đăng nhập bằng mật khẩu"),
              })}
            </div>
          </div>
          ${M.panel({
            title: "Lịch sử đồng bộ", flush: true,
            body: M.table({
              id: "sso-sync", rows: D.ssoSync,
              cols: [
                { h: "Thời điểm", r: (s) => `<span class="mono">${M.esc(s.at)}</span>` },
                { h: "Kết quả", r: (s) => (s.ok ? M.pill("Thành công", "ok") : M.pill("Lỗi", "bad")) },
                { h: "Thêm", cls: "right", r: (s) => `<span class="mono">${s.ok ? M.esc(s.added) : "—"}</span>` },
                { h: "Cập nhật", cls: "right", r: (s) => `<span class="mono">${s.ok ? M.esc(s.updated) : "—"}</span>` },
                { h: "Vô hiệu hóa", cls: "right", r: (s) => `<span class="mono">${s.ok ? M.esc(s.disabled) : "—"}</span>` },
                { h: "Ghi chú", cls: "wrap", r: (s) => M.esc(s.note) },
              ],
            }),
          })}`,
      });
    },
  });
  M.action("sso-map", (el, value) => {
    const g = D.ssoGroupMap.find((x) => x[0] === el.dataset.group);
    g[1] = value;
    return `Đã ánh xạ nhóm ${g[0]} sang vai trò ${M.roleLabel(value)}`;
  });
  M.action("seg:dir-src", (v) => { if (v !== "ad") M.toast("Mockup: nguồn này chưa cấu hình. Chọn nguồn thật sau khi chốt CC-20."); });

  /* ===================== NV-7.3.2, NV-7.3.3: Khóa API và webhook ===================== */
  let freshKey = null; // khóa vừa tạo: chỉ hiện đầy đủ đúng một lần
  const KEY_ST = { active: ["Đang dùng", "ok"], revoked: ["Đã thu hồi", "mute"], expired: ["Hết hạn", "warn"] };
  const internalHost = (h) => /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1\]?$)/i.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /\.(local|internal|lan)$/i.test(h);

  M.screen("integrations/api", {
    nav: "integrations/api", title: "Khóa API & webhook", codes: ["NV-7.3.2", "NV-7.3.3"],
    render() {
      const can = M.can("system.config");
      const shown = freshKey;
      freshKey = null; // tải lại trang thì chỉ còn tiền tố
      const keyTable = M.table({
        id: "key-table", rows: D.apiKeys,
        cols: [
          { h: "Tên", cls: "cell-name", r: (k) => `${M.esc(k.name)}<div class="cell-sub mono">${M.esc(k.prefix)}…</div>` },
          { h: "Vai trò", r: (k) => M.esc(M.roleLabel(k.role)) },
          { h: "Hạn dùng", r: (k) => `<span class="mono">${M.esc(k.expires)}</span>` },
          { h: "Gọi gần nhất", r: (k) => `<span class="mono">${M.esc(k.lastUsed)}</span>` },
          { h: "Trạng thái", r: (k) => M.pill(KEY_ST[k.state][0], KEY_ST[k.state][1]) },
          { h: "", cls: "right", r: (k) => (can && k.state === "active" ? M.btn("Thu hồi", { sm: true, act: "key-revoke", arg: k.id, confirm: `Thu hồi khóa API "${k.name}"? Lệnh gọi kế tiếp bằng khóa này bị từ chối.` }) : "") },
        ],
      });
      const hookTable = M.table({
        id: "hook-table", rows: D.webhooks,
        cols: [
          { h: "Địa chỉ nhận", cls: "wrap", r: (w) => `<span class="mono small">${M.esc(w.url)}</span>` },
          { h: "Sự kiện", cls: "wrap", r: (w) => M.map(w.events, (e) => M.pill(e, "info") + " ") },
          { h: "Khóa ký HMAC", r: (w) => `<span class="mono small">${M.esc(w.secret)}</span>` },
          { h: "Lần gửi cuối", cls: "wrap", r: (w) => (w.state === "ok" ? M.pill("Ổn", "ok") : M.pill("Lỗi", "bad")) + `<div class="cell-sub">${M.esc(w.last)}</div>` },
          { h: "", cls: "right", r: (w) => can ? `<span class="row" style="justify-content:flex-end">${M.btn("Gửi thử", { sm: true, msg: w.state === "ok" ? "Đã gửi sự kiện thử, địa chỉ nhận trả 200 OK." : "Gửi thử thất bại: hết thời gian chờ 10 giây." })}${M.btn("Tắt", { sm: true, ghost: true, msg: "Đã tắt webhook (mockup)." })}</span>` : "" },
        ],
      });
      const hookLog = M.table({
        id: "hook-log", rows: D.webhookLog,
        cols: [
          { h: "Thời điểm", r: (r) => `<span class="mono">${M.esc(r[0])}</span>` },
          { h: "Sự kiện", r: (r) => M.esc(r[1]) },
          { h: "Lần thử", r: (r) => `<span class="mono">${M.esc(r[3])}</span>` },
          { h: "Kết quả", cls: "wrap", r: (r) => M.pill(r[5] === "ok" ? "Thành công" : r[5] === "warn" ? "Thử lại" : "Thất bại", r[5]) + ` <span class="small">${M.esc(r[4])}</span>` },
          { h: "", cls: "right", r: (r) => (can && r[5] === "bad" ? M.btn("Gửi lại", { sm: true, msg: "Đã xếp lần gửi lại vào hàng đợi." }) : "") },
        ],
      });
      const callLog = M.table({
        id: "call-log", rows: D.apiCalls,
        cols: [
          { h: "Thời điểm", r: (r) => `<span class="mono">${M.esc(r[0])}</span>` },
          { h: "Khóa", r: (r) => M.esc(r[1]) },
          { h: "Lệnh gọi", r: (r) => `<span class="mono small">${M.esc(r[2])}</span>` },
          { h: "Mã", r: (r) => M.pill(String(r[3]), r[3] < 300 ? "ok" : r[3] === 429 ? "warn" : "bad") },
          { h: "IP", r: (r) => `<span class="mono">${M.esc(r[4])}</span>` },
          { h: "Ghi chú", cls: "wrap", r: (r) => (r[6] ? M.esc(r[6]) : '<span class="muted">—</span>') },
        ],
      });
      return M.page({
        title: "Khóa API & webhook",
        sub: 'Tài liệu API: <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener"><code>/docs</code></a>',
        codes: ["NV-7.3.2", "NV-7.3.3"],
        body: `
          ${shown ? `<section class="panel" style="border-color:var(--tape-edge)"><div class="panel-body stack-sm">
              <h3>Khóa API "${M.esc(shown.name)}" vừa tạo</h3>
              <div class="secret"><code>${M.esc(shown.full)}</code>${M.btn("Sao chép", { sm: true, icon: "copy", msg: "Đã sao chép khóa vào bộ nhớ tạm." })}</div>
              ${M.note("Khóa chỉ hiện đầy đủ một lần. Sao chép và lưu ở nơi an toàn.", "warn")}
            </div></section>` : ""}
          ${M.tabs("api-tabs", [
            { key: "keys", label: "Khóa API", n: D.apiKeys.filter((k) => k.state === "active").length, body: `<section class="panel flush">
                <div class="panel-head"><h2>Khóa API</h2><span class="grow"></span>${M.btn("Tạo khóa API", { primary: true, sm: true, icon: "plus", modal: "api-key-form", perm: "system.config" })}</div>
                ${keyTable}
              </section>` },
            { key: "hooks", label: "Webhook", n: D.webhooks.length, body: `<section class="panel flush">
                <div class="panel-head"><h2>Webhook</h2><span class="grow"></span>${M.btn("Thêm webhook", { primary: true, sm: true, icon: "plus", modal: "webhook-form", perm: "system.config" })}</div>
                ${hookTable}
              </section>
              <div class="grid g2" style="align-items:start">
                ${M.panel({ title: "Lịch sử gửi", flush: true, body: hookLog })}
                ${M.panel({ title: "Mẫu dữ liệu gửi đi", body: `<pre>POST /itam/events HTTP/1.1
Content-Type: application/json
X-ITAM-Event: asset.checked_out
X-ITAM-Signature: sha256=9f2c…b71a

{
  "event": "asset.checked_out",
  "at": "2026-11-27T09:05:02+07:00",
  "asset": { "tag": "TS-000002", "name": "Laptop Lenovo ThinkPad T14 Gen 4" },
  "holder": { "type": "employee", "code": "NV0030" },
  "by": "ha.pt"
}</pre>` })}
              </div>` },
            { key: "calls", label: "Nhật ký gọi API", body: `<section class="panel flush">${callLog}</section>` },
          ])}`,
      });
    },
  });
  M.action("key-revoke", (el, id) => {
    const k = D.apiKeys.find((x) => x.id === id);
    k.state = "revoked";
    M.refresh();
    return `Đã thu hồi khóa API "${k.name}"`;
  });
  M.defModal("api-key-form", () => ({
    title: "Tạo khóa API",
    submit: "Tạo khóa",
    body: `${M.field("Tên khóa", M.input("name", { ph: "Ví dụ: Đồng bộ ERP" }), { req: true })}
      <div class="grid g2">
        ${M.field("Vai trò của khóa", M.select("role", M.ROLES.filter((r) => r.key !== "employee").map((r) => [r.key, r.label]), "audit"), { req: true })}
        ${M.field("Hạn dùng", M.select("exp", [["30", "30 ngày"], ["90", "90 ngày"], ["365", "1 năm"]], "365"))}
      </div>
      ${M.field("Giới hạn tần suất", M.select("rate", [["60", "60 lượt/phút"], ["300", "300 lượt/phút"], ["600", "600 lượt/phút"]], "300"))}`,
    onSubmit(f, form) {
      const name = (f.name || "").trim();
      if (!name) return M.invalid(form, "name", "Chưa nhập tên khóa.");
      if (D.apiKeys.some((k) => k.name.toLowerCase() === name.toLowerCase() && k.state === "active")) return M.invalid(form, "name", `Đã có khóa đang dùng tên "${name}".`);
      const prefix = "itam_" + Math.random().toString(36).slice(2, 6);
      const full = prefix + "_" + Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join("");
      const exp = { "30": "27/12/2026", "90": "25/02/2027", "365": "27/11/2027" }[f.exp];
      D.apiKeys.unshift({ id: "k" + (D.apiKeys.length + 1), name, prefix, role: f.role, created: "27/11/2026", createdBy: M.me().username, expires: exp, lastUsed: "Chưa gọi", rate: Number(f.rate), state: "active" });
      freshKey = { name, full };
      M.tabState["api-tabs"] = "keys";
      return `Đã tạo khóa API "${name}"`;
    },
  }));
  M.defModal("webhook-form", () => ({
    title: "Thêm webhook",
    submit: "Lưu",
    body: `${M.field("Địa chỉ nhận", M.input("url", { ph: "https://he-thong-khac.vn/itam/events" }), { req: true })}
      <div class="field"><span>Sự kiện <span class="req">*</span></span>${M.map(WEBHOOK_EVENTS, (e) => M.checkbox("ev", e, false, { attrs: `value="${M.esc(e)}"` }))}</div>`,
    onSubmit(f, form) {
      const url = (f.url || "").trim();
      const m = /^https?:\/\/([^/:?#]+)/i.exec(url);
      if (!m) return M.invalid(form, "url", "Địa chỉ nhận không hợp lệ. Nhập dạng https://ten-mien/duong-dan.");
      if (internalHost(m[1])) return M.invalid(form, "url", "Địa chỉ nhận trỏ vào mạng nội bộ nên bị từ chối (chống SSRF).");
      const evs = [...form.querySelectorAll('input[name="ev"]:checked')].map((x) => x.value);
      if (!evs.length) return M.invalid(form, "ev", "Chọn ít nhất một sự kiện.");
      D.webhooks.push({ id: "w" + (D.webhooks.length + 1), url, events: evs, secret: "whsec_••••••••" + Math.random().toString(16).slice(2, 6), state: "ok", last: "Chưa gửi" });
      M.tabState["api-tabs"] = "hooks";
      return "Đã thêm webhook. Bấm Gửi thử để kiểm tra địa chỉ nhận.";
    },
  }));

  /* ===================== NV-7.3.4: Đồng bộ nhân sự ===================== */
  M.screen("integrations/hrm", {
    nav: "integrations/hrm", title: "Đồng bộ nhân sự", codes: ["NV-7.3.4"],
    render() {
      const can = M.can("system.config");
      const e7 = M.emp("e7");
      const e7Assets = heldAssets("e7");
      const e7Acc = accHeld("e7");
      const e7Seats = seatsOf("e7");
      const items = e7Assets.map((a) => [M.tape(a.tag, a.id) + " " + M.esc(a.name), "Tài sản"])
        .concat(e7Acc.map((x) => [M.esc(x.ac.name) + ` <span class="muted">× ${M.esc(x.qty)}</span>`, "Phụ kiện"]))
        .concat(e7Seats.map((x) => [M.esc(x.l.software || x.l.name || x.l.id), "Ghế bản quyền"]));
      return M.page({
        title: "Đồng bộ nhân sự",
        codes: ["NV-7.3.4"],
        actions: can ? M.btn("Kiểm tra kết nối", { msg: "HRM phản hồi bình thường. Tín hiệu gần nhất nhận lúc 26/11/2026 16:40." }) : "",
        body: `
          <div class="grid g2" style="align-items:start">
            ${M.panel({
              title: "Kết nối HRM",
              actions: M.pill("Đang hoạt động", "ok"),
              body: M.kv([
                ["Cách nhận", "HRM gọi webhook vào ITAM, kèm chữ ký"],
                ["Địa chỉ nhận", '<span class="mono small">https://itam.anphat.vn/api/hrm/events</span>'],
                ["Đối chiếu dự phòng", "Đọc danh sách nhân sự lúc 01:00 hằng ngày"],
              ]),
            })}
            ${M.panel({
              title: "Đang xử lý: " + M.esc(e7.name) + " nghỉ ngày " + M.esc(e7.leaveDate || ""),
              body: `${M.steps(["HRM báo ngày nghỉ", "Tạo ticket thu hồi", "Thu hồi từng món", "Đóng ticket, chuyển Đã nghỉ"], 2)}
                <div class="stack-sm" style="margin-top:12px">${items.length ? M.map(items, (x) => `<div class="row between"><span>${x[0]}</span>${M.pill(x[1], "mute")}</div>`) : '<p class="muted">Không còn món nào phải thu hồi.</p>'}</div>
                <div class="row" style="margin-top:12px">${M.btn("Mở ticket T-1047", { sm: true, primary: true, href: "#/tickets/T-1047" })}${M.btn("Mở hồ sơ nhân viên", { sm: true, href: "#/employees/e7" })}</div>`,
            })}
          </div>
          ${M.panel({
            title: "Tín hiệu nhận từ HRM", flush: true,
            body: M.table({
              id: "hrm-events", rows: D.hrmEvents,
              cols: [
                { h: "Nhận lúc", r: (h) => `<span class="mono">${M.esc(h.at)}</span>` },
                { h: "Loại", r: (h) => M.pill(h.kind, h.kind === "Nghỉ việc" ? "warn" : h.kind === "Nhân viên mới" ? "info" : "mute") },
                { h: "Nhân viên", cls: "wrap", r: (h) => (h.emp ? `<a href="#/employees/${h.emp}">${M.esc(M.emp(h.emp).name)}</a> <span class="mono small muted">${M.esc(M.emp(h.emp).code)}</span>` : M.esc(h.who)) },
                { h: "Hiệu lực", r: (h) => `<span class="mono">${M.esc(h.effective)}</span>` },
                { h: "Hệ thống đã làm", cls: "wrap", r: (h) => M.esc(h.result) + (h.ticket ? ` <a class="mono" href="#/tickets/${M.esc(h.ticket)}">${M.esc(h.ticket)}</a>` : "") },
                { h: "Trạng thái", r: (h) => M.pill(h.state[0], h.state[1]) },
              ],
            }),
          })}
          <div class="grid g2" style="align-items:start">
            ${M.panel({
              title: "Bộ thiết bị chuẩn cho người mới", flush: true,
              actions: M.pill("Đề xuất", "accent"),
              body: M.table({
                id: "hrm-kits", rows: D.hrmKits,
                cols: [
                  { h: "Phòng ban", r: (k) => M.esc(k[0]) },
                  { h: "Ticket chuẩn bị thiết bị gồm", cls: "wrap", r: (k) => M.esc(k[1]) },
                  { h: "", cls: "right", r: () => M.btn("Sửa", { sm: true, perm: "system.config", msg: "Mockup: sửa danh sách thiết bị chuẩn của phòng ban." }) },
                ],
              }),
            })}
            ${M.panel({
              title: "Tích hợp khác",
              body: `<div class="stack-sm">${M.map(["ERP", "SIEM", "Zabbix / Prometheus"], (x) => `<div class="row between"><span>${M.esc(x)}</span><span class="row">${M.pill("Chưa cấu hình", "mute")}${M.btn("Cấu hình", { sm: true, perm: "system.config", msg: "Mockup: tích hợp " + x + " chưa được thiết kế chi tiết." })}</span></div>`)}</div>`,
            })}
          </div>`,
      });
    },
  });
})();
