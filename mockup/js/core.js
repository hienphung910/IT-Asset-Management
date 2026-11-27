/* Mockup ITAM: lõi dùng chung.
   - Router theo hash (#/duong-dan), chạy được khi mở file trực tiếp (file://).
   - Vai trò đang xem (đổi ở dải vàng trên cùng) quyết định menu và nút nào hiện.
   - Các hàm dựng giao diện M.* trả về chuỗi HTML; mọi giá trị chèn vào đều qua M.esc().
   Mỗi file js/screens-*.js tự khai báo dữ liệu mẫu (M.data.xxx) và màn hình (M.screen). */
(function () {
  "use strict";
  const M = (window.M = {});
  M.data = {};
  M.tabState = {};
  const screens = [];
  const actions = {};
  const modals = {};

  /* ===================== Tiện ích ===================== */
  M.esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  M.map = (arr, fn) => (arr || []).map(fn).join("");
  M.num = (n) => Number(n || 0).toLocaleString("vi-VN");
  M.money = (n) => (n == null ? "—" : Number(n).toLocaleString("vi-VN") + " ₫");
  M.fold = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  M.find = (list, id) => (M.data[list] || []).find((x) => String(x.id) === String(id));
  M.initials = (name) => {
    const p = String(name || "?").trim().split(/\s+/);
    return ((p.length > 1 ? p[p.length - 2][0] : "") + p[p.length - 1][0]).toUpperCase();
  };
  M.store = {
    get(k, d) { try { const v = localStorage.getItem("itam-mock-" + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("itam-mock-" + k, v); } catch (e) {} },
  };

  /* ===================== Vai trò và quyền ===================== */
  M.ROLES = [
    { key: "admin", label: "Quản trị hệ thống", user: "Trần Minh Quân", username: "quan.tm" },
    { key: "infra", label: "Quản trị hạ tầng", user: "Lê Hoàng Nam", username: "nam.lh" },
    { key: "asset", label: "Quản lý tài sản", user: "Phạm Thu Hà", username: "ha.pt" },
    { key: "helpdesk", label: "Helpdesk", user: "Nguyễn Đức Anh", username: "anh.nd" },
    { key: "audit", label: "Kiểm toán", user: "Vũ Thanh Hương", username: "huong.vt" },
    { key: "employee", label: "Nhân viên", user: "Đỗ Mai Linh", username: "linh.dm", employeeId: "e5" },
  ];
  const ALL = ["admin", "infra", "asset", "helpdesk", "audit", "employee"];
  const STAFF = ["admin", "infra", "asset", "helpdesk", "audit"];
  M.ALL = ALL;
  M.STAFF = STAFF;
  M.role = M.store.get("role", "admin");
  if (!M.ROLES.some((r) => r.key === M.role)) M.role = "admin";
  M.me = () => M.ROLES.find((r) => r.key === M.role);
  M.roleLabel = (k) => (M.ROLES.find((r) => r.key === k) || {}).label || k;
  M.is = (...keys) => keys.includes(M.role);
  M.myNotifications = () => (M.data.notifications || []).filter((n) => !n.roles || n.roles.includes(M.role));

  /* Bảng quyền thao tác: NT-2 (đang áp dụng) + mục 13 (đề xuất cho phần chưa làm). */
  M.PERMS = {
    "asset.edit": ["admin", "asset"],
    "asset.status": ["admin", "asset"],
    "asset.checkout": ["admin", "asset"],
    "employee.edit": ["admin", "asset"],
    "catalog.edit": ["admin"],
    "user.manage": ["admin"],
    "agent.enroll": ["admin", "infra"],
    "agent.link": ["admin", "infra", "asset"],
    "scan.credentials": ["admin", "infra"],
    "scan.manage": ["admin", "infra"],
    "dup.merge": ["admin", "infra", "asset"],
    "stock.manage": ["admin", "asset"],
    "component.manage": ["admin", "infra", "asset"],
    "asset.import": ["admin", "asset"],
    "terms.edit": ["admin", "asset"],
    "stocktake.manage": ["admin", "asset"],
    "software.manage": ["admin", "infra"],
    "license.manage": ["admin", "asset"],
    "license.key": ["admin", "asset"],
    "vuln.handle": ["admin", "infra"],
    "ticket.work": ["admin", "infra", "asset", "helpdesk"],
    "change.manage": ["admin", "infra"],
    "sla.config": ["admin", "helpdesk"],
    "cmdb.edit": ["admin", "infra"],
    "kb.write": ["admin", "infra", "helpdesk"],
    "finance.manage": ["admin", "asset"],
    "finance.view": ["admin", "asset", "audit"],
    "warranty.edit": ["admin", "asset"],
    "deploy.manage": ["admin", "infra"],
    "script.run": ["admin", "infra"],
    "script.approve": ["admin"],
    "report.run": STAFF,
    "sql.query": ["admin", "infra"],
    "org.manage": ["admin"],
    "audit.view": ["admin", "audit"],
    "system.config": ["admin"],
  };
  M.can = (perm) => (M.PERMS[perm] || []).includes(M.role);

  /* ===================== Trạng thái tài sản ===================== */
  M.STATUS = {
    ready: "Sẵn sàng cấp phát",
    deployed: "Đang sử dụng",
    maintenance: "Đang sửa chữa",
    broken: "Hỏng / Chờ thanh lý",
    archived: "Đã thanh lý",
  };

  /* ===================== Menu thanh bên ===================== */
  const cnt = (fn) => () => { try { return fn(); } catch (e) { return 0; } };
  M.NAV = [
    { group: "Tổng quan", items: [
      { path: "dashboard", label: "Dashboard", icon: "home", roles: STAFF },
      { path: "notifications", label: "Thông báo", icon: "bell", roles: ALL, count: cnt(() => M.myNotifications().filter((n) => !n.read).length) },
    ] },
    { group: "Cổng nhân viên", items: [
      { path: "portal", label: "Trang của tôi", icon: "home", roles: ["employee"] },
      { path: "portal/assets", label: "Tài sản của tôi", icon: "box", roles: ["employee"] },
      { path: "portal/handovers", label: "Biên bản của tôi", icon: "file", roles: ["employee"], count: cnt(() => M.data.handovers.filter((h) => h.employeeId === "e5" && h.status === "pending").length), tone: "warn" },
      { path: "portal/requests", label: "Yêu cầu của tôi", icon: "lifebuoy", roles: ["employee"] },
      { path: "portal/faq", label: "Hỏi đáp", icon: "book", roles: ["employee"] },
    ] },
    { group: "Tài sản", items: [
      { path: "assets", label: "Tài sản định danh", icon: "box", roles: STAFF },
      { path: "accessories", label: "Phụ kiện", icon: "mouse", roles: STAFF },
      { path: "components", label: "Linh kiện", icon: "cpu", roles: STAFF },
      { path: "consumables", label: "Vật tư tiêu hao", icon: "droplet", roles: STAFF, count: cnt(() => M.data.consumables.filter((c) => c.stock <= c.min).length), tone: "warn" },
      { path: "handovers", label: "Biên bản bàn giao", icon: "file", roles: ["admin", "asset", "helpdesk", "audit"] },
      { path: "stocktakes", label: "Kiểm kê", icon: "scan", roles: ["admin", "asset", "audit"] },
      { path: "disposals", label: "Thanh lý", icon: "archive", roles: ["admin", "asset", "audit"] },
      { path: "labels", label: "In tem hàng loạt", icon: "printer", roles: ["admin", "asset"] },
      { path: "import", label: "Nhập từ tệp", icon: "upload", roles: ["admin", "asset"] },
      { path: "terms", label: "Điều khoản sử dụng", icon: "scroll", roles: ["admin", "asset", "audit"] },
    ] },
    { group: "Phát hiện & kiểm kê sâu", items: [
      { path: "agents", label: "Agent & máy chờ", icon: "radar", roles: STAFF, count: cnt(() => M.data.agents.filter((a) => a.state === "pending").length), tone: "warn" },
      { path: "discovery/targets", label: "Mục tiêu & lịch quét", icon: "target", roles: ["admin", "infra", "audit"] },
      { path: "discovery/runs", label: "Phiên quét", icon: "activity", roles: ["admin", "infra", "audit"] },
      { path: "discovery/credentials", label: "Thông tin xác thực", icon: "key", roles: ["admin", "infra"] },
      { path: "discovery/connectors", label: "Ảo hóa, cloud, MDM", icon: "cloud", roles: ["admin", "infra", "audit"] },
      { path: "discovery/satellites", label: "Trạm quét vệ tinh", icon: "satellite", roles: ["admin", "infra", "audit"] },
      { path: "discovery/duplicates", label: "Nghi trùng", icon: "copy", roles: ["admin", "infra", "asset", "audit"], count: cnt(() => M.data.duplicates.filter((d) => d.state === "open").length), tone: "warn" },
      { path: "discovery/changes", label: "Thay đổi phần cứng", icon: "diff", roles: STAFF },
      { path: "discovery/unseen", label: "Lâu không thấy", icon: "eyeoff", roles: STAFF },
    ] },
    { group: "Phần mềm & rủi ro", items: [
      { path: "software", label: "Danh mục phần mềm", icon: "grid", roles: ["admin", "infra", "audit"] },
      { path: "licenses", label: "Bản quyền", icon: "key", roles: STAFF },
      { path: "licenses/compliance", label: "Đối chiếu bản quyền", icon: "scale", roles: STAFF },
      { path: "vulns", label: "Lỗ hổng bảo mật", icon: "shield", roles: STAFF, count: cnt(() => M.data.cves.filter((c) => c.severity === "Critical").length), tone: "bad" },
      { path: "eol", label: "Hết hỗ trợ (EOL)", icon: "clock", roles: STAFF },
      { path: "compliance", label: "Tuân thủ máy trạm", icon: "check", roles: STAFF },
      { path: "ssl", label: "Chứng chỉ SSL", icon: "lock", roles: STAFF },
    ] },
    { group: "Dịch vụ CNTT", items: [
      { path: "tickets", label: "Ticket", icon: "lifebuoy", roles: STAFF, count: cnt(() => M.data.tickets.filter((t) => !["resolved", "closed"].includes(t.status)).length) },
      { path: "approvals", label: "Chờ tôi duyệt", icon: "stamp", roles: STAFF, count: cnt(() => M.data.approvals.filter((a) => a.state === "pending").length), tone: "warn" },
      { path: "problems", label: "Vấn đề gốc", icon: "alert", roles: STAFF },
      { path: "changes", label: "Thay đổi", icon: "git", roles: ["admin", "infra", "helpdesk", "audit"] },
      { path: "cmdb", label: "Sơ đồ CMDB", icon: "share", roles: STAFF },
      { path: "kb", label: "Cơ sở tri thức", icon: "book", roles: STAFF },
      { path: "sla", label: "SLA & định tuyến", icon: "timer", roles: ["admin", "helpdesk", "audit"] },
    ] },
    { group: "Tài chính", items: [
      { path: "vendors", label: "Nhà cung cấp", icon: "building", roles: ["admin", "asset", "audit"] },
      { path: "purchases", label: "Đơn mua", icon: "cart", roles: ["admin", "asset", "audit"] },
      { path: "contracts", label: "Hợp đồng", icon: "file", roles: ["admin", "asset", "audit"] },
      { path: "warranty", label: "Bảo hành", icon: "shieldcheck", roles: ["admin", "asset", "helpdesk", "audit"] },
      { path: "depreciation", label: "Khấu hao", icon: "trend", roles: ["admin", "asset", "audit"] },
    ] },
    { group: "Triển khai từ xa", items: [
      { path: "packages", label: "Gói cài đặt", icon: "package", roles: ["admin", "infra", "audit"] },
      { path: "deployments", label: "Đợt triển khai", icon: "rocket", roles: ["admin", "infra", "audit"] },
      { path: "scripts", label: "Thư viện script", icon: "terminal", roles: ["admin", "infra", "audit"] },
      { path: "script-runs", label: "Lần chạy & phê duyệt", icon: "play", roles: ["admin", "infra", "audit"], count: cnt(() => M.data.scriptRuns.filter((r) => r.state === "approval").length), tone: "warn" },
    ] },
    { group: "Báo cáo", items: [
      { path: "reports", label: "Báo cáo dựng sẵn", icon: "chart", roles: STAFF },
      { path: "reports/builder", label: "Trình tạo báo cáo", icon: "sliders", roles: STAFF },
      { path: "reports/sql", label: "Truy vấn SQL", icon: "database", roles: ["admin", "infra"] },
      { path: "reports/schedules", label: "Lịch gửi báo cáo", icon: "mail", roles: STAFF },
    ] },
    { group: "Danh mục dùng chung", items: [
      { path: "employees", label: "Nhân viên", icon: "users", roles: STAFF },
      { path: "departments", label: "Phòng ban", icon: "sitemap", roles: STAFF },
      { path: "locations", label: "Vị trí", icon: "map", roles: STAFF },
      { path: "categories", label: "Danh mục tài sản", icon: "tag", roles: STAFF },
      { path: "models", label: "Hãng & model", icon: "layers", roles: STAFF },
      { path: "org-units", label: "Đơn vị", icon: "building", roles: ["admin", "audit"] },
    ] },
    { group: "Quản trị hệ thống", items: [
      { path: "users", label: "Tài khoản & phân quyền", icon: "user", roles: ["admin"], count: cnt(() => M.data.users.filter((u) => u.status === "pending").length), tone: "warn" },
      { path: "audit-log", label: "Nhật ký kiểm toán", icon: "list", roles: ["admin", "audit"] },
      { path: "notify-settings", label: "Thông báo & kênh gửi", icon: "send", roles: ["admin", "audit"] },
      { path: "integrations/sso", label: "SSO & danh bạ", icon: "login", roles: ["admin", "audit"] },
      { path: "integrations/api", label: "Khóa API & webhook", icon: "plug", roles: ["admin", "audit"] },
      { path: "integrations/hrm", label: "Đồng bộ nhân sự", icon: "refresh", roles: ["admin", "audit"] },
    ] },
  ];
  M.navItem = (path) => {
    for (const g of M.NAV) for (const it of g.items) if (it.path === path) return it;
    return null;
  };

  /* ===================== Biểu tượng (nét 1.8px, khung 24) ===================== */
  const I = {
    home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
    bell: "M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0",
    box: "M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8",
    mouse: "M12 3a6 6 0 0 1 6 6v6a6 6 0 0 1-12 0V9a6 6 0 0 1 6-6zM12 7v4",
    cpu: "M6 6h12v12H6zM9 9h6v6H9zM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4",
    droplet: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
    file: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 13h6M9 17h6",
    scan: "M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16",
    archive: "M3 4h18v4H3zM5 8v12h14V8M10 12h4",
    printer: "M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z",
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
    download: "M12 4v12M7 11l5 5 5-5M4 20h16",
    scroll: "M8 3h11v15a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-2h11v2a3 3 0 0 0 3 3M8 3a3 3 0 0 0-3 3v10M11 8h5M11 12h5",
    radar: "M12 12l7-7M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5",
    target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
    activity: "M3 12h4l3-8 4 16 3-8h4",
    key: "M15 7a4 4 0 1 1-3.9 5H3v4h3v-2h2v2h3.1A4 4 0 0 1 15 7zM16 11h.01",
    cloud: "M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z",
    satellite: "M5 19a7 7 0 0 1 0-10M8.5 15.5a3 3 0 0 1 0-4M14 4l6 6-4 4-6-6zM12 12l-2 2",
    copy: "M8 8h12v12H8zM4 16V4h12",
    diff: "M6 3v12M18 9v12M3 6l3-3 3 3M15 18l3 3 3-3M10 12h4",
    eyeoff: "M3 3l18 18M10.6 6.1A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3 3.6M6.2 6.6C3.9 8.2 2.5 12 2.5 12S6 18 12 18a9 9 0 0 0 4-.9M9.9 9.9a3 3 0 0 0 4.2 4.2",
    eye: "M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    scale: "M12 3v18M6 21h12M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z",
    shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
    shieldcheck: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5 4.5-5",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
    check: "M5 12l5 5 9-10",
    lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
    lifebuoy: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6",
    stamp: "M9 3h6v6l-1 3h6v4H4v-4h6l-1-3zM5 20h14",
    alert: "M12 3l10 18H2zM12 10v5M12 18h.01",
    git: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
    share: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4",
    book: "M4 19V5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2 2 2 0 0 0 2 2h14",
    timer: "M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6",
    building: "M4 21V5l8-3v19M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M2 21h20",
    cart: "M3 4h2l2.5 11h11L21 7H6.2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    trend: "M3 17l6-6 4 4 8-8M15 7h6v6",
    package: "M16.5 9.4L7.5 4.2M21 16V8l-9-5-9 5v8l9 5zM3.3 7L12 12l8.7-5M12 22V12",
    rocket: "M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 15l-3-3a13 13 0 0 1 12-9c0 3-1 8-9 12zM14 10.01h.01",
    terminal: "M4 17l6-6-6-6M12 19h8",
    play: "M7 4l13 8-13 8z",
    chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
    database: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    mail: "M3 5h18v14H3zM3 6l9 7 9-7",
    users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.7",
    sitemap: "M9 3h6v5H9zM3 16h6v5H3zM15 16h6v5h-6zM12 8v4M6 16v-4h12v4",
    map: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    tag: "M3 12V3h9l9 9-9 9zM7.5 7.5h.01",
    layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
    user: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a8 8 0 0 1 16 0v1",
    list: "M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01",
    send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
    login: "M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3",
    logout: "M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4M16 17l5-5-5-5M21 12H9",
    plug: "M9 2v6M15 2v6M6 8h12v4a6 6 0 0 1-12 0zM12 18v4",
    refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
    search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
    plus: "M12 5v14M5 12h14",
    x: "M6 6l12 12M18 6L6 18",
    chevron: "M6 9l6 6 6-6",
    right: "M9 6l6 6-6 6",
    left: "M15 6l-6 6 6 6",
    info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01",
    menu: "M3 6h18M3 12h18M3 18h18",
    moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
    link: "M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
    qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2",
    pen: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
    swap: "M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
    filter: "M3 5h18l-7 8v6l-4 2v-8z",
    paperclip: "M21 11l-9 9a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8",
    star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z",
    flow: "M5 3h6v6H5zM13 15h6v6h-6zM8 9v4a2 2 0 0 0 2 2h3",
    phone: "M7 2h10v20H7zM11 18h2",
  };
  M.icon = (name, cls) => `<svg class="icon ${cls || ""}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${I[name] || I.info}"/></svg>`;

  /* ===================== Thành phần giao diện ===================== */
  M.tape = (tag, assetId, size) => assetId
    ? `<a class="tape ${size ? "tape-" + size : ""}" href="#/assets/${M.esc(assetId)}">${M.esc(tag)}</a>`
    : `<span class="tape ${size ? "tape-" + size : ""}">${M.esc(tag)}</span>`;
  M.led = (st) => `<span class="led s-${M.esc(st)}">${M.esc(M.STATUS[st] || (st === "lost" ? "Thất lạc" : st))}</span>`;
  /* tone: ok | info | warn | bad | mute | accent */
  M.pill = (text, tone, solid) => `<span class="pill t-${tone || "mute"} ${solid ? "solid" : ""}">${M.esc(text)}</span>`;
  M.avatar = (name, lg) => `<span class="tile ${lg ? "tile-lg" : ""}">${M.esc(M.initials(name))}</span>`;
  M.person = (name, href, sub) => `<${href ? `a href="${href}"` : "span"} class="holder">${M.avatar(name)}<span>${M.esc(name)}${sub ? `<span class="cell-sub">${M.esc(sub)}</span>` : ""}</span></${href ? "a" : "span"}>`;
  M.empty = (text) => `<div class="empty">${M.esc(text)}</div>`;

  /* Nút. opts: primary, danger, ghost, sm, icon, href, act, arg, modal, msg, perm, roles, disabled, title, type */
  M.btn = (label, o = {}) => {
    if (o.perm && !M.can(o.perm)) return "";
    if (o.roles && !o.roles.includes(M.role)) return "";
    const cls = ["btn", o.primary && "btn-primary", o.danger && "btn-danger", o.ghost && "btn-ghost", o.sm && "btn-sm", o.cls].filter(Boolean).join(" ");
    const inner = (o.icon ? M.icon(o.icon) : "") + M.esc(label);
    const data = [
      o.act && `data-act="${M.esc(o.act)}"`,
      o.modal && `data-modal="${M.esc(o.modal)}"`,
      o.arg != null && `data-arg="${M.esc(o.arg)}"`,
      o.msg && `data-msg="${M.esc(o.msg)}"`,
      o.confirm && `data-confirm="${M.esc(o.confirm)}"`,
      o.title && `title="${M.esc(o.title)}"`,
    ].filter(Boolean).join(" ");
    if (o.href) return `<a class="${cls}" href="${o.href}" ${data}>${inner}</a>`;
    return `<button type="${o.type || "button"}" class="${cls}" ${data} ${o.disabled ? "disabled" : ""}>${inner}</button>`;
  };

  /* Đầu trang. codes: mảng mã nghiệp vụ (NT-x, NV-x.y.z) hiện thành chip chú thích. */
  M.page = ({ title, sub, codes, back, actions, body, above }) => `
    <div class="page-head">
      <div class="titles">
        ${back ? `<a class="back" href="${back[0]}">${M.icon("left")}${M.esc(back[1])}</a>` : M.crumb()}
        ${M.codeChips(codes)}
        ${sub && !/[<&]/.test(sub)
          ? `<div class="title-row"><h1>${title}</h1><span class="info-tip" title="${M.esc(sub)}" aria-label="${M.esc(sub)}">${M.icon("info")}</span></div>`
          : `<h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}`}
      </div>
      ${actions ? `<div class="head-actions">${actions}</div>` : ""}
    </div>
    ${above || ""}
    ${body || ""}`;

  /* Đường dẫn phân cấp kiểu "Nhóm menu › Màn hình" cho màn không có nút quay lại. */
  M.crumb = () => {
    const nav = M._def && M._def.nav;
    if (!nav) return "";
    const g = M.NAV.find((x) => x.items.some((it) => it.path === nav));
    const it = M.navItem(nav);
    return g ? `<div class="crumb">${M.esc(g.group)} <span>›</span> <b>${M.esc(it.label)}</b></div>` : "";
  };

  M.codeChips = (codes) => {
    if (!codes || !codes.length) return "";
    const cov = M.COVERAGE || [];
    return `<div class="codes">${codes.map((c) => {
      const row = cov.find((r) => r.code === c);
      const st = row ? row.st : "todo";
      const t = row ? `${row.name} - ${({ done: "Đã có", partial: "Một phần", todo: "Chưa có" })[st]}` : c;
      return `<a class="code-chip st-${st}" href="#/sitemap?code=${M.esc(c)}" title="${M.esc(t)}">${M.esc(c)}</a>`;
    }).join("")}</div>`;
  };

  /* Panel: M.panel({ title, actions, body, flush, foot, cls, id }) */
  M.panel = (o) => `
    <section class="panel ${o.flush ? "flush" : ""} ${o.cls || ""}" ${o.id ? `id="${o.id}"` : ""}>
      ${o.title || o.actions ? `<div class="panel-head">${o.title ? `<h2>${o.title}</h2>` : ""}<span class="grow"></span>${o.actions || ""}</div>` : ""}
      <div class="panel-body">${o.body || ""}</div>
      ${o.foot ? `<div class="panel-foot">${o.foot}</div>` : ""}
    </section>`;

  /* Bảng: M.table({ id, cols: [{ h, r: row => html, cls }], rows, href: row => "#/...", empty, select }) */
  M.table = (o) => {
    const rows = o.rows || [];
    const head = `<tr>${o.select ? `<th class="chk"><input type="checkbox" data-check-all="${o.id}" aria-label="Chọn tất cả"></th>` : ""}${o.cols.map((c) => `<th class="${c.cls || ""}">${c.h}</th>`).join("")}</tr>`;
    const body = rows.length
      ? rows.map((r, i) => `<tr ${o.href ? `data-href="${o.href(r, i)}"` : ""}>${o.select ? `<td class="chk"><input type="checkbox" data-row-check="${o.id}" value="${M.esc(r.id ?? i)}" aria-label="Chọn dòng"></td>` : ""}${o.cols.map((c) => `<td class="${c.cls || ""}">${c.r(r, i)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${o.cols.length + (o.select ? 1 : 0)}">${M.empty(o.empty || "Không có dữ liệu.")}</td></tr>`;
    return `<div class="table-scroll"><table ${o.id ? `id="${o.id}"` : ""}><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  };

  /* Ô tìm nhanh lọc các dòng của một bảng trên trang (không dấu, không phân biệt hoa thường). */
  M.searchBox = (tableId, placeholder) => `<label class="search">${M.icon("search")}<input type="search" data-filter="${tableId}" placeholder="${M.esc(placeholder || "Tìm…")}" aria-label="${M.esc(placeholder || "Tìm")}"></label>`;
  M.toolbar = (html) => `<div class="toolbar">${html}</div>`;
  M.bulkbar = (tableId, html) => `<div class="bulkbar" data-bulk="${tableId}" hidden><span><b class="n">0</b> dòng đã chọn</span><span class="grow"></span>${html}</div>`;

  /* Tab: M.tabs(id, [{ key, label, n, body }]). Giữ tab đang mở khi vẽ lại trang. */
  M.tabs = (id, tabs, def) => {
    const active = M.tabState[id] && tabs.some((t) => t.key === M.tabState[id]) ? M.tabState[id] : (def || tabs[0].key);
    return `<div class="tabset" data-tabset="${id}">
      <div class="tabs" role="tablist">${tabs.map((t) => `<button type="button" role="tab" data-tab="${t.key}" class="${t.key === active ? "active" : ""}">${M.esc(t.label)}${t.n != null ? ` <span class="n">${M.esc(t.n)}</span>` : ""}</button>`).join("")}</div>
      ${tabs.map((t) => `<div class="tab-pane ${t.key === active ? "active" : ""}" data-pane="${t.key}" role="tabpanel">${t.body}</div>`).join("")}
    </div>`;
  };
  M.seg = (name, opts, value) => `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-seg-val="${M.esc(v)}" class="${v === value ? "active" : ""}">${M.esc(l)}</button>`).join("")}</div>`;

  M.kv = (pairs) => `<dl class="kv">${pairs.filter(Boolean).map(([k, v]) => `<dt>${M.esc(k)}</dt><dd>${v ?? '<span class="muted">—</span>'}</dd>`).join("")}</dl>`;

  /* Thẻ số liệu: M.stats([{ label, value, sub, tone, href }]) */
  M.stats = (list) => `<div class="stats">${list.map((s) => `<${s.href ? `a href="${s.href}"` : "div"} class="stat t-${s.tone || "mute"}"><span class="lbl">${M.esc(s.label)}</span><span class="val">${M.esc(s.value)}</span>${s.sub ? `<span class="sub">${s.sub}</span>` : ""}</${s.href ? "a" : "div"}>`).join("")}</div>`;

  /* Ô nhập: M.field(label, controlHtml, { req, hint, full, err }) */
  M.field = (label, control, o = {}) => `<label class="field ${o.full ? "full" : ""} ${o.err ? "invalid" : ""}"><span>${M.esc(label)}${o.req ? ' <span class="req">*</span>' : ""}</span>${control}${o.hint ? `<span class="hint">${o.hint}</span>` : ""}${o.err ? `<span class="err">${M.esc(o.err)}</span>` : ""}</label>`;
  M.input = (name, o = {}) => `<input name="${name}" type="${o.type || "text"}" ${o.value != null ? `value="${M.esc(o.value)}"` : ""} ${o.ph ? `placeholder="${M.esc(o.ph)}"` : ""} ${o.req ? "required" : ""} ${o.ro ? "readonly" : ""} ${o.list ? `list="${o.list}"` : ""} ${o.attrs || ""}>`;
  M.select = (name, options, value, o = {}) => `<select name="${name}" ${o.req ? "required" : ""} ${o.attrs || ""}>${o.blank ? `<option value="">${M.esc(o.blank)}</option>` : ""}${options.map((op) => {
    if (op.group) return `<optgroup label="${M.esc(op.group)}">${op.options.map(([v, l]) => `<option value="${M.esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${M.esc(l)}</option>`).join("")}</optgroup>`;
    const [v, l] = Array.isArray(op) ? op : [op, op];
    return `<option value="${M.esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${M.esc(l)}</option>`;
  }).join("")}</select>`;
  M.textarea = (name, value, o = {}) => `<textarea name="${name}" ${o.ph ? `placeholder="${M.esc(o.ph)}"` : ""} ${o.rows ? `rows="${o.rows}"` : ""} ${o.req ? "required" : ""}>${M.esc(value || "")}</textarea>`;
  M.checkbox = (name, label, checked, o = {}) => `<label class="check"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} ${o.attrs || ""}> ${M.esc(label)}</label>`;
  M.radio = (name, value, label, checked) => `<label class="check"><input type="radio" name="${name}" value="${M.esc(value)}" ${checked ? "checked" : ""}> ${M.esc(label)}</label>`;
  /* Form trên trang: submit gọi M.action(form) nếu có, không thì hiện thông báo msg. */
  M.form = (name, inner, o = {}) => `<form data-form="${name}" ${o.msg ? `data-msg="${M.esc(o.msg)}"` : ""} class="${o.cls || ""}" novalidate>${inner}</form>`;

  M.note = (html, tone) => `<div class="note t-${tone || "info"}">${M.icon(tone === "warn" || tone === "bad" ? "alert" : "info")}<div>${html}</div></div>`;
  /* Điểm cần chốt (mục 10 của tài liệu nghiệp vụ). */
  M.cc = (code, html) => `<div class="cc"><b class="code">${M.esc(code)} - Cần chốt</b><div>${html}</div></div>`;
  /* Ghi chú của riêng mockup; tắt được bằng nút "Chú thích". */
  M.anno = (html) => `<div class="anno">${html}</div>`;

  M.steps = (list, cur) => `<ol class="steps">${list.map((s, i) => `<li class="${i < cur ? "done" : i === cur ? "cur" : ""}">${M.esc(s)}</li>`).join("")}</ol>`;
  M.progress = (v, max, tone) => `<div class="progress t-${tone || "ok"}" title="${M.esc(v)}/${M.esc(max)}"><span style="width:${max ? Math.min(100, (v / max) * 100) : 0}%"></span></div>`;
  /* Biểu đồ thanh ngang: M.bars([{ label, value, tone }], { unit }) */
  M.bars = (list, o = {}) => {
    const max = o.max || Math.max(1, ...list.map((x) => x.value));
    return `<div class="hbars">${list.map((x) => `<div class="hbar"><span>${M.esc(x.label)}</span><div class="track"><span class="t-${x.tone || "info"}" style="width:${(x.value / max) * 100}%;background:var(--c)"></span></div><span class="v">${M.esc(M.num(x.value))}${o.unit || ""}</span></div>`).join("")}</div>`;
  };
  M.vbars = (list) => {
    const max = Math.max(1, ...list.map((x) => x.value));
    return `<div class="vbars">${list.map((x) => `<div class="col t-${x.tone || "info"}"><span style="height:${(x.value / max) * 100}%;background:var(--c)" title="${M.esc(x.value)}"></span><small>${M.esc(x.label)}</small></div>`).join("")}</div>`;
  };
  M.stackbar = (parts, o = {}) => {
    const total = parts.reduce((s, p) => s + p.value, 0) || 1;
    return `<div class="stackbar">${parts.filter((p) => p.value).map((p) => `<span class="${p.cls || "t-" + (p.tone || "mute")}" style="flex:${p.value / total}" title="${M.esc(p.label)}: ${p.value}"></span>`).join("")}</div>
      ${o.legend === false ? "" : `<div class="legend">${parts.map((p) => `<span class="led ${p.cls || "t-" + (p.tone || "mute")}">${M.esc(p.label)} - <b class="mono">${p.value}</b></span>`).join("")}</div>`}`;
  };

  /* QR giả lập: lưới điểm sinh theo chuỗi, có ba ô định vị như QR thật. */
  M.qr = (text) => {
    const n = 25;
    let h = 2166136261;
    for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
    const finder = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    let rects = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (finder(x, y) || ((x === 7 || y === 7) && (x < 8 && y < 8)) || (x === n - 8 && y < 8) || (y === n - 8 && x < 8)) continue;
      if (rnd() > 0.52) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    const fp = (fx, fy) => `<rect x="${fx}" y="${fy}" width="7" height="7"/><rect x="${fx + 1}" y="${fy + 1}" width="5" height="5" fill="#fff"/><rect x="${fx + 2}" y="${fy + 2}" width="3" height="3"/>`;
    return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" shape-rendering="crispEdges" aria-label="Mã QR"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#111">${rects}${fp(0, 0)}${fp(n - 7, 0)}${fp(0, n - 7)}</g></svg>`;
  };
  M.assetLabel = (a) => `<div class="asset-label"><div class="label-band">Tài sản công ty - Phòng IT</div><div class="label-body">${M.qr(a.tag)}<div><div class="label-tag">${M.esc(a.tag)}</div><div class="label-name">${M.esc(a.name)}</div>${a.serial ? `<div class="label-serial">S/N ${M.esc(a.serial)}</div>` : ""}</div></div><div class="label-foot">Quét QR để mở hồ sơ - không bóc tem</div></div>`;

  /* ===================== Thông báo nhanh ===================== */
  let toastTimer;
  M.toast = (msg, tone) => {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast " + (tone === "bad" ? "bad" : "");
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3200);
  };

  /* ===================== Hộp thoại =====================
     M.defModal(name, arg => ({ title, body, submit, danger, wide, msg, onSubmit(data, form, arg) }))
     onSubmit trả về false để giữ hộp thoại (ví dụ báo lỗi ô nhập), trả về chuỗi để thay thông báo. */
  M.defModal = (name, fn) => { modals[name] = fn; };
  M.openModal = (name, arg) => {
    const fn = modals[name];
    if (!fn) { M.toast("Mockup: chưa vẽ hộp thoại " + name); return; }
    const d = fn(arg);
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-wrap" data-close-modal><form class="modal ${d.wide ? "wide" : ""}" novalidate role="dialog" aria-modal="true" aria-label="${M.esc(d.title)}">
      <div class="modal-head"><h3>${M.esc(d.title)}</h3><button type="button" class="icon-btn" data-close-modal aria-label="Đóng">${M.icon("x")}</button></div>
      <div class="modal-body">${d.body || ""}</div>
      <div class="modal-foot">${d.cancel === false ? "" : `<button type="button" class="btn" data-close-modal>${M.esc(d.cancelLabel || "Hủy")}</button>`}${d.submit === false ? "" : `<button type="submit" class="btn ${d.danger ? "btn-danger" : "btn-primary"}">${M.esc(d.submit || "Lưu")}</button>`}</div>
    </form></div>`;
    const form = root.querySelector("form");
    const first = form.querySelector("input:not([type=hidden]):not([readonly]), select, textarea");
    if (first) first.focus();
    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      form.querySelectorAll(".field.invalid").forEach((f) => { f.classList.remove("invalid"); const e = f.querySelector(".err.js"); if (e) e.remove(); });
      const data = Object.fromEntries(new FormData(form).entries());
      const res = d.onSubmit ? d.onSubmit(data, form, arg) : undefined;
      if (res === false) return;
      M.closeModal();
      M.toast(typeof res === "string" ? res : d.msg || "Đã lưu (mockup, không ghi vào server).");
      if (d.refresh !== false) M.refresh();
    });
  };
  M.closeModal = () => { document.getElementById("modal-root").innerHTML = ""; };
  /* Đánh dấu lỗi tại một ô trong form (dùng trong onSubmit). */
  M.invalid = (form, name, msg) => {
    const input = form.querySelector(`[name="${name}"]`);
    const f = input && input.closest(".field");
    if (!f) { M.toast(msg, "bad"); return false; }
    f.classList.add("invalid");
    f.insertAdjacentHTML("beforeend", `<span class="err js">${M.esc(msg)}</span>`);
    input.focus();
    return false;
  };

  /* ===================== Hành động =====================
     M.action(name, (el, arg, ev) => {...}) cho nút data-act; cho form data-form thì (form, data, ev). */
  M.action = (name, fn) => { actions[name] = fn; };

  /* ===================== Router ===================== */
  /* M.screen("assets/:id", { nav, codes, roles, bare, narrow, title, render(params, query) }) */
  M.screen = (pattern, def) => {
    const keys = [];
    const re = new RegExp("^" + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$");
    screens.push({ pattern, keys, re, def });
  };
  M.screens = () => screens.map((s) => ({ pattern: s.pattern, def: s.def }));
  M.go = (path) => { location.hash = "#/" + path.replace(/^#?\//, ""); };
  M.refresh = () => render(true);
  const parse = () => {
    const raw = decodeURIComponent((location.hash || "").replace(/^#\/?/, ""));
    const [path, qs] = raw.split("?");
    const query = Object.fromEntries(new URLSearchParams(qs || ""));
    return { path: path.replace(/\/$/, ""), query };
  };
  M.current = () => parse();

  function match(path) {
    for (const s of screens) {
      const m = s.re.exec(path);
      if (m) {
        const params = {};
        s.keys.forEach((k, i) => (params[k] = m[i + 1]));
        return { s, params };
      }
    }
    return null;
  }

  function allowed(def) {
    const roles = def.roles || (def.nav && M.navItem(def.nav) && M.navItem(def.nav).roles) || ALL;
    return roles.includes(M.role);
  }

  let lastPath = null;
  function render(keepScroll) {
    let { path, query } = parse();
    if (!path) { M.go(M.role === "employee" ? "portal" : "dashboard"); return; }
    if (path === "dashboard" && M.role === "employee") { M.go("portal"); return; }
    const root = document.getElementById("root");
    const hit = match(path);
    let body, def;
    if (!hit) {
      def = { nav: null };
      body = M.page({ title: "Không có màn hình này", sub: `Đường dẫn <code>#/${M.esc(path)}</code> chưa có trong mockup.`, body: M.btn("Về bản đồ màn hình", { href: "#/sitemap", primary: true }) });
    } else {
      def = hit.s.def;
      if (!allowed(def)) {
        body = M.page({
          title: "Không có quyền xem",
          sub: `Vai trò <b>${M.esc(M.me().label)}</b> không được mở màn hình này.`,
          body: M.anno("Menu của vai trò này không có mục đó; gọi thẳng API sẽ nhận mã 403 (NT-2). Đổi vai trò ở dải vàng để xem."),
        });
      } else {
        M._def = def;
        try { body = def.render(hit.params, query); }
        catch (err) { console.error(err); body = M.page({ title: "Lỗi vẽ màn hình", sub: M.esc(err.message) }); }
      }
    }
    root.innerHTML = mockbar() + (def.bare ? body : shell(def, body));
    document.title = (def.title ? def.title + " - " : "") + "Mockup ITAM";
    if (def.after) try { def.after(root, hit ? hit.params : {}, query); } catch (e) { console.error(e); }
    if (!keepScroll || lastPath !== path) window.scrollTo(0, 0);
    lastPath = path;
    document.body.classList.remove("nav-open");
  }

  /* ===================== Khung: dải mockup + thanh bên + thanh trên ===================== */
  const navToggle = new Map();
  const groupOpen = (g, active) => (navToggle.has(g.group) ? navToggle.get(g.group) : g.group === "Tổng quan" || g.group === "Cổng nhân viên" || g.items.some((it) => it.path === active));
  function mockbar() {
    if (M.capture) return "";
    const clean = document.body.classList.contains("clean");
    const stitch = document.documentElement.classList.contains("skin-stitch");
    return `<div class="mockbar no-print">
      <b>MOCKUP</b><span class="desc">Dữ liệu mẫu - không có server - mọi thao tác chỉ minh họa</span>
      <span class="grow"></span>
      <label>Xem với vai trò ${M.select("mock-role", M.ROLES.map((r) => [r.key, r.label]), M.role, { attrs: 'data-mock-role aria-label="Vai trò"' })}</label>
      <button type="button" data-mock-notes class="${clean ? "" : "on"}" title="Hiện hoặc ẩn mã nghiệp vụ, ghi chú mockup và điểm cần chốt">Chú thích: ${clean ? "Tắt" : "Bật"}</button>
      <button type="button" data-mock-skin title="Đổi giữa giao diện theo trang mẫu Stitch và giao diện Phòng thiết bị của ứng dụng hiện tại">Giao diện: ${stitch ? "Stitch" : "Phòng thiết bị"}</button>
      <a href="#/sitemap">Bản đồ màn hình</a>
      <a href="#/flows">Luồng nghiệp vụ</a>
    </div>`;
  }

  function shell(def, body) {
    const active = def.nav;
    const groups = M.NAV.map((g) => {
      const items = g.items.filter((it) => it.roles.includes(M.role));
      if (!items.length) return "";
      const closed = !groupOpen(g, active);
      return `<div class="nav-group ${closed ? "closed" : ""}"><button type="button" data-nav-group="${M.esc(g.group)}">${M.esc(g.group)}${M.icon("chevron")}</button><div class="nav-items">${items.map((it) => {
        const n = it.count ? it.count() : 0;
        return `<a class="nav-item ${it.path === active ? "active" : ""}" href="#/${it.path}">${M.icon(it.icon)}<span>${M.esc(it.label)}</span>${n ? `<span class="count ${it.tone || ""}">${n}</span>` : ""}</a>`;
      }).join("")}</div></div>`;
    }).join("");
    const me = M.me();
    const unread = M.myNotifications().filter((n) => !n.read).length;
    const theme = document.documentElement.dataset.theme || "system";
    return `<div class="app">
      <aside class="side" aria-label="Điều hướng chính">
        <a class="side-brand" href="#/"><span class="tape tape-lg">ITAM</span><span class="brand-sub">Tài sản &amp;<br>dịch vụ CNTT</span></a>
        <nav>${groups}</nav>
      </aside>
      <div class="main-col">
        <header class="topbar">
          <button type="button" class="icon-btn menu-btn" data-toggle-nav aria-label="Mở menu">${M.icon("menu")}</button>
          <form class="global-search" data-form="global-search" role="search">${M.icon("search")}<input type="search" name="q" placeholder="Tìm serial, IP, nhân viên, mã ticket…" aria-label="Tìm kiếm toàn hệ thống"><kbd>/</kbd></form>
          <span class="spacer"></span>
          ${M.role === "employee" ? "" : `<select class="unit" data-unit aria-label="Đơn vị đang xem" title="NT-3: chỉ thấy dữ liệu của đơn vị được gán">${M.map((M.data.orgUnits || []).filter((u) => u.level < 2), (u) => `<option ${u.id === "u0" ? "selected" : ""}>${"  ".repeat(u.level)}${M.esc(u.name)}</option>`)}</select>`}
          <button type="button" class="icon-btn" data-theme-cycle title="Giao diện: ${theme === "dark" ? "Tối" : theme === "light" ? "Sáng" : "Theo hệ thống"}" aria-label="Đổi giao diện sáng tối">${M.icon(theme === "dark" ? "moon" : "sun")}</button>
          <a class="icon-btn" href="#/notifications" aria-label="Thông báo">${M.icon("bell")}${unread ? `<span class="dot">${unread}</span>` : ""}</a>
          <a class="user-chip" href="#/settings" title="Cài đặt tài khoản">${M.avatar(me.user)}<span class="who"><b>${M.esc(me.user)}</b><span>${M.esc(me.label)}</span></span></a>
          <a class="icon-btn" href="#/login" title="Đăng xuất" aria-label="Đăng xuất">${M.icon("logout")}</a>
        </header>
        <main class="content ${def.narrow ? "narrow" : ""}">${body}</main>
      </div>
    </div>`;
  }

  /* ===================== Sự kiện chung (ủy quyền) ===================== */
  function setTheme(t) {
    if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    try { localStorage.setItem("itam-theme", t); } catch (e) {}
  }
  M.setTheme = (t) => { setTheme(t); M.refresh(); };

  document.addEventListener("click", (ev) => {
    const t = ev.target;
    const close = t.closest("[data-close-modal]");
    if (close) {
      /* Nền tối chỉ đóng khi bấm đúng vào nền; nút Hủy/X đóng ngay. */
      if (!close.classList.contains("modal-wrap")) { M.closeModal(); return; }
      if (t === close) { M.closeModal(); return; }
    }
    const navGroup = t.closest("[data-nav-group]");
    if (navGroup) {
      const g = navGroup.dataset.navGroup;
      navToggle.set(g, navGroup.parentElement.classList.contains("closed"));
      navGroup.parentElement.classList.toggle("closed");
      return;
    }
    if (t.closest("[data-toggle-nav]")) { document.body.classList.toggle("nav-open"); return; }
    if (t.closest("[data-theme-cycle]")) {
      const cur = document.documentElement.dataset.theme || "system";
      M.setTheme(cur === "system" ? "dark" : cur === "dark" ? "light" : "system");
      return;
    }
    if (t.closest("[data-mock-skin]")) {
      const on = !document.documentElement.classList.contains("skin-stitch");
      M.store.set("skin", on ? "stitch" : "classic");
      applySkin(on);
      M.refresh();
      return;
    }
    if (t.closest("[data-mock-notes]")) {
      document.body.classList.toggle("clean");
      M.store.set("clean", document.body.classList.contains("clean") ? "1" : "0");
      M.refresh();
      return;
    }
    const tab = t.closest("[data-tab]");
    if (tab) {
      const set = tab.closest("[data-tabset]");
      M.tabState[set.dataset.tabset] = tab.dataset.tab;
      set.querySelectorAll(":scope > .tabs [data-tab]").forEach((b) => b.classList.toggle("active", b === tab));
      set.querySelectorAll(":scope > [data-pane]").forEach((p) => p.classList.toggle("active", p.dataset.pane === tab.dataset.tab));
      return;
    }
    const seg = t.closest("[data-seg-val]");
    if (seg) {
      seg.parentElement.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === seg));
      const fn = actions["seg:" + seg.parentElement.dataset.seg];
      if (fn) fn(seg.dataset.segVal, seg);
      return;
    }
    const modalBtn = t.closest("[data-modal]");
    if (modalBtn) { ev.preventDefault(); M.openModal(modalBtn.dataset.modal, modalBtn.dataset.arg); return; }
    const actBtn = t.closest("[data-act]");
    if (actBtn) {
      ev.preventDefault();
      if (actBtn.dataset.confirm && !window.confirm(actBtn.dataset.confirm)) return;
      const fn = actions[actBtn.dataset.act];
      if (fn) {
        const res = fn(actBtn, actBtn.dataset.arg, ev);
        if (typeof res === "string") M.toast(res);
      } else M.toast(actBtn.dataset.msg || "Mockup: thao tác chỉ minh họa.");
      return;
    }
    const msgBtn = t.closest("button[data-msg], a[data-msg]");
    if (msgBtn) {
      ev.preventDefault();
      if (msgBtn.dataset.confirm && !window.confirm(msgBtn.dataset.confirm)) return;
      M.toast(msgBtn.dataset.msg);
      return;
    }
    const row = t.closest("[data-href]");
    if (row && !t.closest("a, button, input, select, label, textarea")) { location.hash = row.dataset.href; return; }
  });

  document.addEventListener("change", (ev) => {
    const t = ev.target;
    if (t.matches("[data-mock-role]")) {
      M.role = t.value;
      M.store.set("role", t.value);
      M.toast("Đang xem với vai trò " + M.me().label);
      const { path } = parse();
      if (M.role === "employee" && !path.startsWith("portal")) M.go("portal");
      else if (M.role !== "employee" && path.startsWith("portal")) M.go("dashboard");
      else render(true);
      return;
    }
    if (t.matches("[data-unit]")) { M.toast("Đang xem dữ liệu của: " + t.value.trim()); return; }
    if (t.matches("[data-check-all]")) {
      const id = t.dataset.checkAll;
      document.querySelectorAll(`[data-row-check="${id}"]`).forEach((c) => { if (c.closest("tr").style.display !== "none") c.checked = t.checked; });
      updateBulk(id);
      return;
    }
    if (t.matches("[data-row-check]")) { updateBulk(t.dataset.rowCheck); return; }
    const fn = t.dataset.change && actions[t.dataset.change];
    if (fn) { const res = fn(t, t.value, ev); if (typeof res === "string") M.toast(res); }
  });
  function updateBulk(id) {
    const checks = [...document.querySelectorAll(`[data-row-check="${id}"]`)];
    const n = checks.filter((c) => c.checked).length;
    checks.forEach((c) => c.closest("tr").classList.toggle("sel", c.checked));
    const bar = document.querySelector(`[data-bulk="${id}"]`);
    if (bar) { bar.hidden = n === 0; bar.querySelector(".n").textContent = n; }
  }
  M.selected = (id) => [...document.querySelectorAll(`[data-row-check="${id}"]:checked`)].map((c) => c.value);

  document.addEventListener("input", (ev) => {
    const t = ev.target;
    if (t.matches("[data-filter]")) {
      const q = M.fold(t.value.trim());
      document.querySelectorAll(`#${t.dataset.filter} tbody tr`).forEach((tr) => {
        if (tr.querySelector(".empty")) return;
        tr.style.display = !q || M.fold(tr.textContent).includes(q) ? "" : "none";
      });
    }
    const fn = t.dataset.input && actions[t.dataset.input];
    if (fn) fn(t, t.value, ev);
  });

  document.addEventListener("submit", (ev) => {
    const form = ev.target.closest("form[data-form]");
    if (!form) return;
    ev.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    form.querySelectorAll(".field.invalid").forEach((f) => { f.classList.remove("invalid"); const e = f.querySelector(".err.js"); if (e) e.remove(); });
    const fn = actions[form.dataset.form];
    if (fn) { const res = fn(form, data, ev); if (typeof res === "string") M.toast(res); }
    else M.toast(form.dataset.msg || "Đã lưu (mockup, không ghi vào server).");
  });

  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") M.closeModal();
    if (ev.key === "/" && !ev.target.closest("input, textarea, select")) {
      const s = document.querySelector(".global-search input");
      if (s) { ev.preventDefault(); s.focus(); }
    }
  });

  M.action("global-search", (form, data) => { M.go("search?q=" + encodeURIComponent(data.q || "")); });

  /* Giao diện Stitch chỉ có bản sáng; tắt nó thì trả lại lựa chọn sáng/tối đã lưu. */
  function applySkin(on) {
    document.documentElement.classList.toggle("skin-stitch", on);
    if (on) document.documentElement.dataset.theme = "light";
    else { let t = null; try { t = localStorage.getItem("itam-theme"); } catch (e) {} if (t === "light" || t === "dark") document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; }
  }
  /* Chế độ chụp sang Figma (index.html?capture): bỏ dải mockup, tắt chú thích, thanh bên không dính. */
  M.capture = new URLSearchParams(location.search).has("capture");

  M.start = () => {
    applySkin(M.store.get("skin", "stitch") === "stitch");
    if (M.capture) document.body.classList.add("capture", "clean");
    if (M.store.get("clean", "0") === "1") document.body.classList.add("clean");
    window.addEventListener("hashchange", () => render(false));
    render(false);
  };
})();
