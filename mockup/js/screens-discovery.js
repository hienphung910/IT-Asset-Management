/* Mockup ITAM - Module 1: Tự động phát hiện và kiểm kê sâu (NV-1.1.1 → NV-1.4.3).
   Màn hình: agents, discovery/targets, discovery/runs(/:id), discovery/credentials,
   discovery/connectors, discovery/satellites, discovery/duplicates, discovery/changes, discovery/unseen. */
(function () {
  "use strict";
  const D = M.data;
  const e = M.esc;

  /* ===================== Thời gian (mốc "bây giờ" của mockup: 27/11/2026 14:15) ===================== */
  const NOW = new Date(2026, 10, 27, 14, 15);
  const parseDT = (s) => {
    const m = /(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(s || "");
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
  };
  const hoursSince = (s) => { const d = parseDT(s); return d ? (NOW - d) / 36e5 : Infinity; };
  const daysSince = (s) => Math.floor(hoursSince(s) / 24);
  const nowText = "27/11/2026 14:15";

  /* ===================== Dữ liệu mẫu ===================== */
  D.agentCycleHours = 6; // CC-4: tạm đặt 6 giờ, đổi trong cấu hình máy chủ
  D.agentServer = "http://itam.anphat.vn:8000";

  D.enrollCodes = [
    { id: "ec1", name: "Máy chủ phòng máy chủ", prefix: "itam_enr_Qm3x", by: "Lê Hoàng Nam", at: "20/01/2026", count: 1, revoked: "22/01/2026" },
    { id: "ec2", name: "Đợt cài phòng Kế toán", prefix: "itam_enr_7Kq2", by: "Lê Hoàng Nam", at: "10/11/2026", count: 4, revoked: null },
    { id: "ec3", name: "Chi nhánh TP.HCM", prefix: "itam_enr_Hc9p", by: "Trần Minh Quân", at: "15/11/2026", count: 1, revoked: null },
    { id: "ec4", name: "Đợt cài Kinh doanh và Marketing", prefix: "itam_enr_Zt4w", by: "Lê Hoàng Nam", at: "25/11/2026", count: 6, revoked: null },
  ];

  /* state: pending (chờ xác nhận) | linked (đang báo cáo cho một tài sản) | revoked (đã thu hồi) */
  D.agents = [
    { id: "ag1", hostname: "SRV-ERP-01", state: "linked", assetId: "a5", serial: "DPE650A1", ip: "10.10.0.11", os: "Ubuntu 22.04.5 LTS", makerModel: "Dell Inc. - PowerEdge R650", version: "0.4.2", lastReport: "27/11/2026 14:00", enrolledAt: "20/01/2026", codeId: "ec1", linkVia: "Tự khớp theo serial" },
    { id: "ag3", hostname: "KT-BINH-LT", state: "linked", assetId: "a1", serial: "7XK2H93", ip: "10.10.3.21", os: "Windows 11 Pro 23H2", makerModel: "Dell Inc. - Latitude 5440", version: "0.4.2", lastReport: "27/11/2026 14:05", enrolledAt: "10/11/2026", codeId: "ec2", linkVia: "Tự khớp theo serial" },
    { id: "ag4", hostname: "KD-LINH-LT", state: "linked", assetId: "a2", serial: "PF4B2K1L", ip: "10.10.5.44", os: "Windows 11 Pro 23H2", makerModel: "LENOVO - 21K3CTO1WW", version: "0.4.2", lastReport: "27/11/2026 13:52", enrolledAt: "25/11/2026", codeId: "ec4", linkVia: "Tự khớp theo serial" },
    { id: "ag5", hostname: "KT-PC-301", state: "linked", assetId: "a4", serial: "9HZ1QW3", ip: "10.10.3.30", os: "Windows 10 Pro 22H2", makerModel: "Dell Inc. - OptiPlex 7010", version: "0.4.1", lastReport: "27/11/2026 12:40", enrolledAt: "10/11/2026", codeId: "ec2", linkVia: "Tự khớp theo serial" },
    { id: "ag6", hostname: "NS-MAI-LT", state: "linked", assetId: "a17", serial: "8JQ4L55", ip: "10.10.4.18", os: "Windows 11 Pro 22H2", makerModel: "Dell Inc. - Latitude 5440", version: "0.4.2", lastReport: "27/11/2026 11:15", enrolledAt: "10/11/2026", codeId: "ec2", linkVia: "Tự khớp theo serial" },
    { id: "ag7", hostname: "HCM-KHOA-LT", state: "linked", assetId: "a20", serial: "5CG3471H8P", ip: "10.30.5.12", os: "Windows 11 Pro 24H2", makerModel: "HP - HP EliteBook 840 G10", version: "0.4.2", lastReport: "27/11/2026 09:31", enrolledAt: "15/11/2026", codeId: "ec3", linkVia: "Tự khớp theo serial" },
    { id: "ag8", hostname: "IT-HUY-LT", state: "linked", assetId: "a24", serial: "2WD9N4A", ip: "10.10.2.31", os: "Ubuntu 24.04.1 LTS", makerModel: "Dell Inc. - Latitude 5440", version: "0.4.2", lastReport: "27/11/2026 14:10", enrolledAt: "10/11/2026", codeId: "ec2", linkVia: "Gắn bằng tay" },
    { id: "ag9", hostname: "ubuntu-kho-01", state: "pending", assetId: null, serial: null, ip: "10.10.7.15", os: "Ubuntu 24.04.1 LTS", makerModel: "To be filled by O.E.M. - System Product Name", cpu: "Intel Core i3-10100 - 4 nhân - 8 luồng", ram: "8 GB", version: "0.4.2", lastReport: "26/11/2026 01:12", enrolledAt: "25/11/2026", codeId: "ec4", reason: "Không khớp tài sản nào đã có." },
    { id: "ag10", hostname: "KT-BINH-LT", state: "pending", assetId: null, serial: "7XK2H93", ip: "10.10.3.21", os: "Windows 11 Pro 23H2", makerModel: "Dell Inc. - Latitude 5440", cpu: "Intel Core i5-1345U - 10 nhân - 12 luồng", ram: "16 GB", version: "0.4.2", lastReport: "27/11/2026 13:58", enrolledAt: "27/11/2026", codeId: "ec4", reason: "Khớp tài sản TS-000001 theo serial, nhưng tài sản này đang gắn với agent khác (KT-BINH-LT, agent số 3). Nếu đây là cùng một máy vừa cài lại agent thì thu hồi agent cũ." },
    { id: "ag11", hostname: "KHO-IT-LT", state: "pending", assetId: null, serial: null, ip: "10.10.3.140", os: "Windows 11 Pro 24H2", makerModel: "HP - HP EliteBook 840 G10", cpu: "Intel Core Ultra 5 125U - 12 nhân - 14 luồng", ram: "16 GB", version: "0.4.2", lastReport: "27/11/2026 10:44", enrolledAt: "25/11/2026", codeId: "ec4", reason: "Có nhiều tài sản cùng tên máy với máy này (TS-000010, TS-000011). Kiểm tra rồi gắn bằng tay vào đúng tài sản." },
    { id: "ag12", hostname: "MKT-DUNG-LT", state: "pending", assetId: null, serial: "PF4B3A7Z", ip: "10.10.6.22", os: "Windows 11 Pro 23H2", makerModel: "LENOVO - 21K3CTO1WW", cpu: "AMD Ryzen 7 PRO 7840U - 8 nhân - 16 luồng", ram: "32 GB", version: "0.4.2", lastReport: "27/11/2026 13:20", enrolledAt: "25/11/2026", codeId: "ec4", reason: "Trùng tên máy với tài sản TS-000022 nhưng serial khác nhau (máy báo PF4B3A7Z, tài sản ghi PF4B3A77). Kiểm tra rồi gắn bằng tay nếu đúng là một máy." },
    { id: "ag13", hostname: "DESKTOP-Q8M2K1F", state: "pending", assetId: null, serial: null, ip: "10.10.6.31", os: "Windows 11 Pro 23H2", makerModel: "Chưa có báo cáo", version: "0.4.2", lastReport: null, enrolledAt: "27/11/2026", codeId: "ec4", reason: "Chưa nhận được báo cáo đầu tiên từ máy này." },
    { id: "ag2", hostname: "KT-TAM-LT", state: "revoked", assetId: null, lastAssetId: null, serial: "5KD82L1", ip: "10.10.3.25", os: "Windows 11 Pro 22H2", makerModel: "Dell Inc. - Latitude 5420", version: "0.3.0", lastReport: "30/09/2026 17:02", enrolledAt: "02/09/2026", codeId: "ec2" },
    { id: "ag14", hostname: "TEST-VM-01", state: "revoked", assetId: null, lastAssetId: null, serial: "VMware-56 4d 1a 2b", ip: "10.10.0.99", os: "Ubuntu 24.04.1 LTS", makerModel: "VMware, Inc. - VMware Virtual Platform", version: "0.4.0", lastReport: "06/11/2026 10:30", enrolledAt: "05/11/2026", codeId: "ec4" },
  ];
  const agentNo = (ag) => ag.id.replace("ag", "");

  /* NV-1.1.1: thông tin xác thực dùng để quét (giá trị bí mật không lưu trong mockup) */
  D.credentials = [
    { id: "cr1", name: "AD dịch vụ quét", type: "Tài khoản Windows/AD", ident: "ANPHAT\\svc-itam-scan", updated: "02/11/2026", by: "Lê Hoàng Nam", lastUsed: "27/11/2026 01:00" },
    { id: "cr2", name: "SSH khóa quét Linux", type: "Khóa SSH", ident: "itam-scan (ed25519)", updated: "15/10/2026", by: "Lê Hoàng Nam", lastUsed: "27/11/2026 00:00" },
    { id: "cr3", name: "SNMP v2c chỉ đọc", type: "Chuỗi SNMP", ident: "community (v2c)", updated: "20/01/2026", by: "Lê Hoàng Nam", lastUsed: "27/11/2026 02:00" },
    { id: "cr4", name: "vCenter chỉ đọc", type: "Khóa API vCenter", ident: "itam-ro@vsphere.local", updated: "20/01/2026", by: "Trần Minh Quân", lastUsed: "27/11/2026 06:00" },
    { id: "cr5", name: "SNMP v3 máy in và UPS", type: "Chuỗi SNMP", ident: "user itam-snmp - SHA/AES", updated: "03/06/2026", by: "Lê Hoàng Nam", lastUsed: "23/11/2026 03:00" },
    { id: "cr6", name: "AWS chỉ đọc", type: "Khóa API cloud", ident: "AKIA••••••••7QXZ", updated: "27/05/2026", by: "Trần Minh Quân", lastUsed: "27/11/2026 06:00" },
    { id: "cr7", name: "Microsoft Entra ứng dụng Reader", type: "Khóa API cloud", ident: "app itam-reader", updated: "01/08/2026", by: "Trần Minh Quân", lastUsed: "27/11/2026 07:00" },
    { id: "cr8", name: "AD cũ (trước 11/2026)", type: "Tài khoản Windows/AD", ident: "ANPHAT\\itam-old", updated: "02/03/2026", by: "Lê Hoàng Nam", lastUsed: "01/11/2026 01:00" },
  ];
  D.credLog = [
    { at: "27/11/2026 09:12", who: "Lê Hoàng Nam", action: "Xem", cred: "AD dịch vụ quét", ip: "10.10.2.15" },
    { at: "27/11/2026 01:00", who: "Hệ thống", action: "Dùng trong phiên R-0412", cred: "AD dịch vụ quét", ip: "Máy chủ chính" },
    { at: "26/11/2026 16:40", who: "Trần Minh Quân", action: "Thử kết nối tới 10.10.0.20", cred: "vCenter chỉ đọc", ip: "10.10.2.11" },
    { at: "02/11/2026 10:05", who: "Lê Hoàng Nam", action: "Sửa (đổi mật khẩu)", cred: "AD dịch vụ quét", ip: "10.10.2.15" },
    { at: "15/10/2026 14:22", who: "Lê Hoàng Nam", action: "Thêm", cred: "SSH khóa quét Linux", ip: "10.10.2.15" },
  ];

  /* NV-1.1.2: mục tiêu quét. kind: ip | ou | list */
  D.scanTargets = [
    { id: "tg1", name: "Văn phòng Hà Nội tầng 3", kind: "ip", scope: "10.10.3.0/24", protocols: ["WinRM", "SSH", "SNMP v2c"], creds: ["cr1", "cr2", "cr3"], schedule: "Mỗi ngày 01:00", station: "Máy chủ chính", lastRun: "R-0412", enabled: true },
    { id: "tg2", name: "Phòng máy chủ", kind: "ip", scope: "10.10.0.0/24", protocols: ["SSH", "WinRM", "SNMP v3"], creds: ["cr2", "cr1", "cr5"], schedule: "Mỗi 6 giờ", station: "Máy chủ chính", lastRun: "R-0413", enabled: true },
    { id: "tg3", name: "OU Máy trạm Kế toán", kind: "ou", scope: "OU=KeToan,OU=MayTram,DC=anphat,DC=local", protocols: ["WinRM"], creds: ["cr1"], schedule: "Thứ 2 đến thứ 6, khung 12:00-13:00", station: "Máy chủ chính", lastRun: "R-0406", enabled: true },
    { id: "tg4", name: "Chi nhánh TP.HCM", kind: "ip", scope: "10.30.0.0/16", protocols: ["WinRM", "SNMP v2c"], creds: ["cr1", "cr3"], schedule: "Mỗi ngày 02:00", station: "Trạm HCM-SAT-01", lastRun: "R-0410", enabled: true },
    { id: "tg5", name: "Máy in và UPS", kind: "list", scope: "10.10.3.50, 10.10.0.30, 10.30.5.60", protocols: ["SNMP v3"], creds: ["cr5"], schedule: "Chủ nhật hằng tuần 03:00", station: "Máy chủ chính", lastRun: "R-0405", enabled: true },
    { id: "tg6", name: "Văn phòng Đà Nẵng", kind: "ip", scope: "10.40.1.0/24", protocols: ["WinRM", "SSH"], creds: ["cr1", "cr2"], schedule: "Mỗi ngày 02:30", station: "Trạm DN-SAT-01", lastRun: "R-0409", enabled: true },
    { id: "tg7", name: "Thử dải Wi-Fi khách", kind: "ip", scope: "10.99.0.0/22", protocols: ["SNMP v2c"], creds: ["cr3"], schedule: "Một lần", station: "Máy chủ chính", lastRun: null, enabled: false },
  ];
  D.scanExclusions = [
    { ip: "10.10.0.1", note: "Tường lửa FW-01: bị dò cổng làm tăng cảnh báo IPS" },
    { ip: "10.10.9.0/28", note: "Bộ điều khiển thang máy và hệ thống BMS của tòa nhà" },
    { ip: "10.10.3.200", note: "Máy chấm công vân tay, treo khi bị dò cổng" },
  ];
  const KIND = { ip: "Dải IP / subnet", ou: "Đơn vị tổ chức (OU) trong AD", list: "Danh sách máy cụ thể" };

  /* NV-1.1.3: phiên quét. state: ok | warn | stopped | running */
  D.scanRuns = [
    { id: "R-0413", target: "tg2", station: "Máy chủ chính", start: "27/11/2026 12:00", duration: "Đang chạy - 62%", found: 14, deep: 11, shallow: 1, errors: 0, state: "running", trigger: "Theo lịch" },
    { id: "R-0412", target: "tg1", station: "Máy chủ chính", start: "27/11/2026 01:00", duration: "14 phút", found: 48, deep: 41, shallow: 5, errors: 2, state: "warn", trigger: "Theo lịch" },
    { id: "R-0410", target: "tg4", station: "Trạm HCM-SAT-01", start: "27/11/2026 02:00", duration: "21 phút", found: 35, deep: 30, shallow: 4, errors: 1, state: "warn", trigger: "Theo lịch" },
    { id: "R-0411", target: "tg2", station: "Máy chủ chính", start: "27/11/2026 06:00", duration: "6 phút", found: 22, deep: 20, shallow: 2, errors: 0, state: "ok", trigger: "Theo lịch" },
    { id: "R-0409", target: "tg6", station: "Trạm DN-SAT-01", start: "25/11/2026 02:30", duration: "Dừng sau 4 phút", found: 9, deep: 3, shallow: 0, errors: 0, state: "stopped", trigger: "Theo lịch", stopReason: "Trạm DN-SAT-01 mất kết nối lúc 02:34. Dữ liệu cũ của 6 máy chưa kịp quét lại vẫn giữ nguyên." },
    { id: "R-0407", target: "tg1", station: "Máy chủ chính", start: "26/11/2026 01:00", duration: "13 phút", found: 47, deep: 41, shallow: 5, errors: 1, state: "warn", trigger: "Theo lịch" },
    { id: "R-0406", target: "tg3", station: "Máy chủ chính", start: "25/11/2026 12:10", duration: "3 phút", found: 9, deep: 9, shallow: 0, errors: 0, state: "ok", trigger: "Quét ngay (Lê Hoàng Nam)" },
    { id: "R-0405", target: "tg5", station: "Máy chủ chính", start: "23/11/2026 03:00", duration: "2 phút", found: 3, deep: 3, shallow: 0, errors: 0, state: "ok", trigger: "Theo lịch" },
  ];
  const RUN_ST = { ok: ["Hoàn tất", "ok"], warn: ["Hoàn tất, có lỗi", "warn"], stopped: ["Dừng giữa chừng", "bad"], running: ["Đang chạy", "info"] };
  /* Kết quả từng máy của phiên R-0412. result: deep | shallow | error */
  const R0412 = [
    ["10.10.3.21", "3C:21:9C:4A:11:0E", "Máy trạm Windows", "WinRM", "deep", "", "a1"],
    ["10.10.3.30", "B0:4F:13:9E:2A:01", "Máy trạm Windows", "WinRM", "deep", "", "a4"],
    ["10.10.3.50", "9C:7B:EF:21:40:AA", "Máy in", "SNMP v2c", "deep", "", "a9"],
    ["10.10.3.44", "F4:26:79:AB:20:9D", "Máy trạm Windows", "WinRM", "deep", "", "a2"],
    ["10.10.3.25", "54:BF:64:1A:9C:02", "Máy trạm Windows", "WinRM", "error", "Sai thông tin xác thực 3 lần liên tiếp (ANPHAT\\svc-itam-scan). Ngừng thử máy này trong phiên để tránh khóa tài khoản dịch vụ.", null],
    ["10.10.3.88", "70:B5:E8:3D:11:42", "Máy trạm Windows", "WinRM", "error", "WinRM: hết thời gian chờ cổng 5985 sau 30 giây.", null],
    ["10.10.3.61", "00:1A:2B:3C:4D:5E", "Không rõ (chỉ trả lời ping)", "—", "shallow", "Không mở cổng WinRM, SSH hay SNMP nào. Ghi nhận IP, MAC và loại đoán được.", null],
    ["10.10.3.77", "8C:F5:A3:6E:02:19", "Điện thoại (đoán theo MAC: Samsung)", "—", "shallow", "Thiết bị cá nhân, không có giao thức quản trị.", null],
    ["10.10.3.102", "A4:83:E7:12:9B:20", "macOS (đoán theo MAC: Apple)", "SSH", "shallow", "Máy macOS chưa bật Remote Login (SSH).", "a13"],
    ["10.10.3.140", "48:51:C5:7A:31:0C", "Máy trạm Windows", "WinRM", "deep", "Máy mới: chuyển sang bộ máy hợp nhất, đang chờ xác nhận.", null],
    ["10.10.3.150", "D8:BB:C1:09:5A:77", "Máy trạm Windows", "WinRM", "deep", "", "a17"],
    ["10.10.3.210", "00:0C:29:7E:44:10", "Bộ lưu điện (SNMP)", "SNMP v2c", "shallow", "Chuỗi SNMP không đúng; chỉ thấy ở mức tối thiểu.", null],
  ];

  /* NV-1.1.4, NV-1.1.5: kết nối ảo hóa, cloud, MDM. state: ok | error | off */
  D.connectors = [
    { id: "cn1", kind: "virt", platform: "VMware vCenter / ESXi", endpoint: "vc01.anphat.local", credId: "cr4", state: "ok", lastSync: "27/11/2026 06:00", schedule: "Mỗi 6 giờ", summary: "2 máy chủ vật lý - 18 máy ảo (15 đang bật) - 1 máy ảo không còn thấy" },
    { id: "cn2", kind: "virt", platform: "Microsoft Hyper-V", state: "off" },
    { id: "cn3", kind: "virt", platform: "Proxmox VE / KVM", state: "off" },
    { id: "cn4", kind: "cloud", platform: "Amazon Web Services", endpoint: "Tài khoản 4821-••••-3390 - ap-southeast-1", credId: "cr6", state: "error", lastSync: "26/11/2026 06:00", schedule: "Mỗi ngày 06:00", summary: "4 máy ảo EC2 - 2 cơ sở dữ liệu RDS", error: "Khóa truy cập đã hết hạn (ExpiredToken) lúc đồng bộ 27/11/2026 06:00. Dữ liệu của lần đồng bộ trước vẫn giữ nguyên." },
    { id: "cn5", kind: "cloud", platform: "Microsoft Azure", endpoint: "Subscription AnPhat-Prod", credId: "cr7", state: "ok", lastSync: "27/11/2026 06:05", schedule: "Mỗi ngày 06:00", summary: "6 máy ảo - 1 App Service" },
    { id: "cn6", kind: "cloud", platform: "Google Cloud", state: "off" },
    { id: "cn7", kind: "mdm", platform: "Microsoft 365 / Intune", endpoint: "anphat.onmicrosoft.com", credId: "cr7", state: "ok", lastSync: "27/11/2026 07:00", schedule: "Mỗi 4 giờ", summary: "37 thiết bị - 22 gộp vào tài sản có sẵn - 3 nghi trùng chờ xử lý" },
  ];
  D.vms = [
    ["VM-ERP-APP01", "a6", 8, "32 GB", "Bật", "Ubuntu 22.04"],
    ["VM-ERP-DB01", "a6", 16, "64 GB", "Bật", "Ubuntu 22.04"],
    ["VM-AD-DC01", "a6", 4, "8 GB", "Bật", "Windows Server 2022"],
    ["VM-AD-DC02", "a6", 4, "8 GB", "Bật", "Windows Server 2022"],
    ["VM-FILE01", "a6", 4, "16 GB", "Bật", "Windows Server 2022"],
    ["VM-MAIL-RELAY", "a6", 2, "4 GB", "Bật", "Ubuntu 24.04"],
    ["VM-ITAM01", "a6", 4, "8 GB", "Bật", "Ubuntu 24.04"],
    ["VM-BACKUP01", "a6", 4, "16 GB", "Tắt", "Ubuntu 22.04"],
    ["VM-TEST-OLD", "a6", 2, "4 GB", "Không còn thấy", "Windows Server 2016"],
  ];

  /* NV-1.2.3: trạm quét vệ tinh */
  D.satellites = [
    { id: "st0", name: "Máy chủ chính (VM-ITAM01)", main: true, networks: "10.10.0.0/16", targets: ["tg1", "tg2", "tg3", "tg5", "tg7"], state: "ok", lastContact: "27/11/2026 14:15", version: "—" },
    { id: "st1", name: "HCM-SAT-01", networks: "10.30.0.0/16", targets: ["tg4"], state: "ok", lastContact: "27/11/2026 14:02", version: "0.4.2", host: "Máy ảo trên NAS chi nhánh TP.HCM" },
    { id: "st2", name: "DN-SAT-01", networks: "10.40.1.0/24", targets: ["tg6"], state: "lost", lastContact: "25/11/2026 02:34", version: "0.4.1", host: "Mini PC tủ mạng văn phòng Đà Nẵng" },
  ];

  /* NV-1.3.2: cặp nghi trùng. state: open | merged | distinct */
  D.duplicates = [
    { id: "DUP-07", state: "open", reason: "Trùng MAC nhưng khác serial", detected: "27/11/2026 07:00", source: "Đồng bộ Intune",
      left: { assetId: "a13", tag: "TS-000013", name: "Laptop Apple MacBook Air M2", serial: "C02H71ABQ6L4", mac: "A4:83:E7:12:9B:20", host: "MKT-VIET-MBA", holder: "Trần Quốc Việt", source: "Nhập tay", created: "08/07/2025", logs: 6, tickets: 1 },
      right: { assetId: null, tag: "TS-000031", name: "MacBook Air (Intune)", serial: "C02H71ABQ6L", mac: "A4:83:E7:12:9B:20", host: "MKT-VIET-MBA", holder: "—", source: "Intune", created: "20/11/2026", logs: 1, tickets: 0 } },
    { id: "DUP-06", state: "open", reason: "Một tên máy xuất hiện ở hai máy", detected: "26/11/2026 01:14", source: "Quét mạng R-0407",
      left: { assetId: "a22", tag: "TS-000022", name: "Laptop Lenovo ThinkPad T14 Gen 4", serial: "PF4B3A77", mac: "F4:26:79:AB:44:01", host: "MKT-DUNG-LT", holder: "Ngô Thùy Dung", source: "Nhập tay", created: "02/10/2025", logs: 3, tickets: 0 },
      right: { assetId: null, tag: "TS-000029", name: "Máy trạm Windows (quét mạng)", serial: "Không đọc được", mac: "F4:26:79:AB:47:9C", host: "MKT-DUNG-LT", holder: "—", source: "Quét mạng", created: "24/11/2026", logs: 1, tickets: 0 } },
    { id: "DUP-05", state: "open", reason: "Trùng serial sau khi bỏ khoảng trắng và chữ hoa", detected: "25/11/2026 15:30", source: "Nhập từ tệp",
      left: { assetId: "a19", tag: "TS-000019", name: "Màn hình Dell P2422H", serial: "CN0F2T4G7450", mac: "—", host: "—", holder: "Kho IT", source: "Nhập tay", created: "02/10/2025", logs: 2, tickets: 0 },
      right: { assetId: null, tag: "TS-000027", name: "Màn hình Dell 24 inch", serial: "cn0f2t4g 7450", mac: "—", host: "—", holder: "Kho IT", source: "Nhập từ tệp kiem-ke-2024.xlsx", created: "25/11/2026", logs: 1, tickets: 0 } },
    { id: "DUP-04", state: "merged", reason: "Trùng serial", detected: "19/11/2026 01:05", source: "Quét mạng", resolved: "20/11/2026 09:40 - Phạm Thu Hà - giữ TS-000010, gộp TS-000026",
      left: { tag: "TS-000010" }, right: { tag: "TS-000026" } },
    { id: "DUP-03", state: "distinct", reason: "Trùng MAC (card USB dùng chung)", detected: "17/11/2026 01:02", source: "Quét mạng", resolved: "18/11/2026 16:12 - Lê Hoàng Nam - xác nhận hai thiết bị khác nhau",
      left: { tag: "TS-000004" }, right: { tag: "TS-000021" } },
  ];

  /* NV-1.3.3: lịch sử thay đổi phần cứng (tách khỏi chuỗi lưu ký) */
  D.hwChanges = [
    { id: "hc1", assetId: "a4", at: "24/11/2026 15:20", field: "RAM", from: "16 GB", to: "8 GB", reason: null, alerted: true },
    { id: "hc2", assetId: "a24", at: "20/11/2026 10:02", field: "RAM", from: "16 GB", to: "32 GB", reason: "Lắp linh kiện RAM 16 GB DDR5 qua hệ thống (NV-2.1.4)", alerted: false },
    { id: "hc3", assetId: "a1", at: "18/11/2026 08:44", field: "Địa chỉ IP", from: "10.10.3.17", to: "10.10.3.21", reason: null, alerted: false },
    { id: "hc4", assetId: "a20", at: "15/11/2026 09:12", field: "Card mạng", from: "1 card (Intel Wi-Fi 6E AX211)", to: "2 card (thêm Realtek USB GbE 00:E0:4C:68:12:01)", reason: null, alerted: true },
    { id: "hc5", assetId: "a1", at: "02/11/2026 08:30", field: "Ổ cứng", from: "Samsung PM9A1 - 256 GB - SSD", to: "Samsung PM9B1 - 512 GB - SSD", reason: "Ticket T-1031: nâng cấp ổ cứng", alerted: false },
    { id: "hc6", assetId: "a5", at: "28/10/2026 22:10", field: "RAM", from: "128 GB", to: "256 GB", reason: "Tài sản đang ở trạng thái Đang sửa chữa (bảo trì định kỳ)", alerted: false },
    { id: "hc7", assetId: "a17", at: "21/11/2026 11:15", field: "Địa chỉ IP", from: "10.10.4.33", to: "10.10.4.18", reason: null, alerted: false },
    { id: "hc8", assetId: "a2", at: "12/11/2026 13:52", field: "Ổ cứng", from: "SK hynix BC901 - 1 TB - SSD", to: "SK hynix BC901 - 1 TB - SSD + Samsung T7 - 1 TB (USB)", reason: null, alerted: true },
  ];
  D.hwAlertPrefs = { ram: true, disk: true, nic: true, ip: false };
  const FIELD_PREF = { "RAM": "ram", "Ổ cứng": "disk", "Card mạng": "nic", "Địa chỉ IP": "ip" };

  /* NV-1.4.3: thiết bị lâu không thấy */
  D.unseenDays = 30;
  D.unseen = [
    { assetId: "a21", lastSeen: "02/10/2026 09:15", source: "Quét mạng R-0371" },
    { assetId: "a13", lastSeen: "15/10/2026 18:40", source: "Đồng bộ Intune" },
    { assetId: "a16", lastSeen: "19/10/2026 03:00", source: "SNMP R-0378" },
    { assetId: "a18", lastSeen: "21/10/2026 01:07", source: "Quét mạng R-0380" },
    { assetId: "a22", lastSeen: "24/10/2026 01:10", source: "Quét mạng R-0384" },
    { assetId: "a7", lastSeen: "20/11/2026 06:00", source: "SNMP R-0405" },
  ];
  D.seenAgain = [
    { assetId: "a9", lastSeen: "27/11/2026 01:04", source: "Quét mạng R-0412", gap: "38 ngày" },
  ];

  /* ===================== Tiện ích hiển thị ===================== */
  const credName = (id) => { const c = M.find("credentials", id); return c ? c.name : id; };
  const targetName = (id) => { const t = M.find("scanTargets", id); return t ? t.name : id; };
  const assetCell = (id) => { const a = M.asset(id); return a ? `${M.tape(a.tag, a.id)}<div class="cell-sub">${e(a.name)}</div>` : '<span class="muted">—</span>'; };
  const ipOk = (s) => /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(s) && s.split(".").every((n) => +n <= 255);
  const rangeOk = (v) => {
    v = String(v || "").trim();
    let p = v.split("/");
    if (p.length === 2) return ipOk(p[0]) && /^\d{1,2}$/.test(p[1]) && +p[1] >= 8 && +p[1] <= 32;
    p = v.split("-");
    if (p.length === 2) return ipOk(p[0].trim()) && ipOk(p[1].trim());
    return ipOk(v);
  };
  const pillsOf = (list, tone) => list.map((x) => M.pill(x, tone || "mute")).join(" ");
  const nextTag = () => {
    const n = Math.max(...D.assets.map((a) => parseInt(a.tag.replace(/\D/g, ""), 10) || 0)) + 1;
    return "TS-" + String(n).padStart(6, "0");
  };
  const techFrom = (ag, via) => ({
    hostname: ag.hostname, os: ag.os, cpu: ag.cpu || "", ram: ag.ram || "", disks: [], nics: [["Card mạng chính", "—", ag.ip]], ip: ag.ip,
    bios: "", reported: ag.makerModel + (ag.serial ? " - " + ag.serial : ""), agent: ag.id, linkVia: via, lastReport: ag.lastReport || nowText, software: [],
  });

  /* ===================== Agent và máy chờ xác nhận (MH-10) ===================== */
  let justCreatedCode = null;

  M.defModal("agent-create-asset", (id) => {
    const ag = M.find("agents", id);
    return {
      title: "Tạo tài sản từ máy chờ",
      body: `<p>Tạo một tài sản mới từ máy <b>${e(ag.hostname)}</b>? Serial, hãng và model lấy theo báo cáo của máy; sau đó sửa lại được như mọi tài sản.</p>
        ${M.kv([["Tên máy", e(ag.hostname)], ["Hãng - model máy báo", e(ag.makerModel)], ["Serial máy báo", ag.serial ? `<span class="mono">${e(ag.serial)}</span>` : '<span class="muted">Không đọc được</span>'], ["Mã tài sản sẽ tạo", `<span class="tape">${e(nextTag())}</span>`]])}
        ${/O\.E\.M\.|System Product Name/i.test(ag.makerModel) ? M.note("Hãng và model máy báo là chuỗi mặc định nên không được lưu. Nhập lại ở form sửa tài sản.", "warn") : ""}`,
      submit: "Tạo tài sản",
      onSubmit() {
        const tag = nextTag();
        const newId = "a" + (Math.max(...D.assets.map((a) => parseInt(a.id.slice(1), 10))) + 1);
        const meaningless = /O\.E\.M\.|System Product Name/i.test(ag.makerModel);
        let modelId = null;
        if (!meaningless) {
          const [maker, model] = ag.makerModel.split(" - ");
          const found = D.models.find((m) => m.maker === maker && m.name === model);
          if (found) modelId = found.id;
          else { modelId = "m" + (D.models.length + 1); D.models.push({ id: modelId, maker, name: model, cat: null, dirty: true }); }
        }
        D.assets.push({
          id: newId, tag, name: meaningless ? "Máy " + ag.hostname : ag.makerModel.split(" - ").join(" ") + " (" + ag.hostname + ")",
          model: modelId, serial: ag.serial || "", status: "ready", holder: null, location: null, created: "27/11/2026", note: "Tạo từ máy chờ xác nhận " + ag.hostname, unit: "u1",
          purchase: null, warranty: null, tech: techFrom(ag, "Tạo tài sản từ máy chờ"),
        });
        Object.assign(ag, { state: "linked", assetId: newId, linkVia: "Tạo tài sản từ máy chờ", reason: null });
        setTimeout(() => M.go("assets/" + newId), 0);
        return `Đã tạo tài sản ${tag} từ máy ${ag.hostname}`;
      },
    };
  });

  M.defModal("agent-link", (id) => {
    const ag = M.find("agents", id);
    return {
      title: "Gắn vào tài sản có sẵn",
      body: M.field(`Máy ${ag.hostname} là tài sản nào? Nhập mã tài sản (ví dụ TS-000001):`, M.input("tag", { ph: "TS-000001", attrs: 'autocomplete="off"' }), { req: true }),
      submit: "Gắn",
      onSubmit(data, form) {
        const tag = (data.tag || "").trim();
        if (!tag) return M.invalid(form, "tag", "Nhập mã tài sản.");
        const a = M.assetByTag(tag);
        if (!a) return M.invalid(form, "tag", `Không có tài sản nào mang mã ${tag}.`);
        const other = D.agents.find((x) => x.state === "linked" && x.assetId === a.id && x.id !== ag.id);
        if (other) return M.invalid(form, "tag", `Tài sản ${a.tag} đang gắn với agent khác (${other.hostname}). Thu hồi hoặc bỏ gắn agent đó trước.`);
        Object.assign(ag, { state: "linked", assetId: a.id, linkVia: "Gắn bằng tay", reason: null });
        if (!a.tech) a.tech = techFrom(ag, "Gắn bằng tay");
        return `Đã gắn máy ${ag.hostname} vào tài sản ${a.tag}`;
      },
    };
  });

  M.defModal("agent-unlink", (id) => {
    const ag = M.find("agents", id);
    const a = M.asset(ag.assetId);
    return {
      title: "Bỏ gắn agent",
      body: `<p>Bỏ gắn máy <b>${e(ag.hostname)}</b> khỏi tài sản <b>${e(a ? a.tag : "")}</b>? Hồ sơ kỹ thuật agent đã ghi cho tài sản này sẽ bị xóa; máy quay về danh sách chờ xác nhận.</p>`,
      submit: "Bỏ gắn", danger: true,
      onSubmit() {
        if (a) a.tech = null;
        Object.assign(ag, { state: "pending", assetId: null, reason: `Đã bỏ gắn khỏi ${a ? a.tag : "tài sản"} bằng tay. Hệ thống thử khớp lại ở lần báo cáo kế tiếp.` });
        return `Đã bỏ gắn máy ${ag.hostname}`;
      },
    };
  });

  M.defModal("agent-revoke", (id) => {
    const ag = M.find("agents", id);
    return {
      title: "Thu hồi agent",
      body: `<p>Thu hồi agent trên máy <b>${e(ag.hostname)}</b>? Từ giờ báo cáo của nó bị từ chối; muốn dùng lại phải kết nạp lại bằng một mã kết nạp.</p>`,
      submit: "Thu hồi agent", danger: true,
      onSubmit() {
        const a = ag.assetId ? M.asset(ag.assetId) : null;
        if (a && a.tech) a.tech.agentRevoked = true;
        Object.assign(ag, { state: "revoked", lastAssetId: ag.assetId, assetId: null });
        return `Đã thu hồi agent trên máy ${ag.hostname}`;
      },
    };
  });

  M.defModal("enroll-revoke", (id) => {
    const c = M.find("enrollCodes", id);
    return {
      title: "Thu hồi mã kết nạp",
      body: `<p>Thu hồi mã kết nạp "${e(c.name)}"? Không kết nạp thêm được máy nào bằng mã này. ${e(c.count)} agent đã kết nạp vẫn hoạt động bình thường.</p>`,
      submit: "Thu hồi mã", danger: true,
      onSubmit() { c.revoked = "27/11/2026"; return `Đã thu hồi mã kết nạp "${c.name}"`; },
    };
  });

  M.defModal("agent-cycle", () => ({
    title: "Chu kỳ báo cáo của agent",
    body: `${M.field("Chu kỳ", M.select("h", [["1", "1 giờ"], ["3", "3 giờ"], ["6", "6 giờ"], ["12", "12 giờ"], ["24", "24 giờ"]], String(D.agentCycleHours)))}
      ${M.cc("CC-4", "Chu kỳ quét mặc định và khung giờ được phép quét chưa chốt. Đang tạm đặt 6 giờ.")}`,
    submit: "Lưu chu kỳ",
    onSubmit(data) { D.agentCycleHours = +data.h; return `Đã đổi chu kỳ báo cáo thành ${data.h} giờ. Agent áp dụng sau lần báo cáo kế tiếp.`; },
  }));

  M.action("enroll-create", (form, data) => {
    const name = (data.name || "").trim();
    if (!name) return M.invalid(form, "name", "Chưa nhập tên gợi nhớ.");
    if (name.length > 150) return M.invalid(form, "name", "Tên gợi nhớ tối đa 150 ký tự.");
    const rand = Array.from({ length: 36 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"[Math.floor(Math.random() * 56)]).join("");
    const code = "itam_enr_" + rand;
    D.enrollCodes.unshift({ id: "ec" + (D.enrollCodes.length + 1), name, prefix: code.slice(0, 13), by: M.me().user, at: "27/11/2026", count: 0, revoked: null });
    justCreatedCode = { name, code };
    M.refresh();
    return `Đã tạo mã kết nạp "${name}"`;
  });

  M.action("agent-delete", (el, id) => {
    const ag = M.find("agents", id);
    D.agents = D.agents.filter((x) => x.id !== id);
    M.refresh();
    return `Đã xóa agent ${ag.hostname} khỏi danh sách`;
  });

  M.action("agents-bulk-create", () => {
    const ids = M.selected("pending-agents");
    const ok = ids.map((id) => M.find("agents", id)).filter((ag) => ag && ag.lastReport);
    return ok.length ? `Mockup: sẽ tạo ${ok.length} tài sản từ các máy đã chọn (mỗi máy một tài sản, mỗi tài sản một dòng "Thêm tài sản" trong nhật ký).` : "Các máy đã chọn chưa có báo cáo nên chưa tạo được tài sản.";
  });

  const installCmds = (code) => {
    const c = code || "<MÃ_KẾT_NẠP>";
    const srv = D.agentServer;
    return M.tabs("agent-os", [
      { key: "linux", label: "Linux", body: `<pre>${e(`curl -fsSL ${srv}/agent/itam-agent.py -o itam-agent.py\nsudo python3 itam-agent.py enroll --server ${srv} --code ${c}\nsudo python3 itam-agent.py run        # chạy liên tục theo chu kỳ máy chủ đặt\npython3 itam-agent.py preview         # xem trước đúng dữ liệu sẽ gửi`)}</pre>` },
      { key: "mac", label: "macOS", body: `<pre>${e(`curl -fsSL ${srv}/agent/itam-agent.py -o itam-agent.py\nsudo python3 itam-agent.py enroll --server ${srv} --code ${c}\nsudo python3 itam-agent.py run`)}</pre>` },
      { key: "win", label: "Windows", body: `<pre>${e(`# PowerShell, chạy với quyền Administrator\nInvoke-WebRequest ${srv}/agent/itam-agent.py -OutFile itam-agent.py\npy itam-agent.py enroll --server ${srv} --code ${c}\npy itam-agent.py run`)}</pre>` },
    ]);
  };

  M.screen("agents", {
    nav: "agents", title: "Agent & máy chờ", codes: ["NV-1.2.1", "NV-1.2.2", "NV-1.3.1", "NV-1.4.1", "NV-1.4.2"],
    render() {
      const pending = D.agents.filter((a) => a.state === "pending");
      const linked = D.agents.filter((a) => a.state === "linked");
      const revoked = D.agents.filter((a) => a.state === "revoked");
      const limit = D.agentCycleHours * 2;
      const isOverdue = (a) => a.lastReport && hoursSince(a.lastReport) > limit;
      const overdue = D.agents.filter((a) => a.state !== "revoked" && isOverdue(a));
      const canEnroll = M.can("agent.enroll"), canLink = M.can("agent.link"), canCreate = M.can("asset.edit");
      const reportCell = (a) => a.lastReport
        ? `<span class="mono">${e(a.lastReport)}</span>${isOverdue(a) ? `<div class="cell-sub">${M.pill("Quá hạn báo cáo", "bad")}</div>` : ""}`
        : '<span class="muted">Chưa báo cáo</span>';
      const machineCell = (a) => `<div class="cell-name">${e(a.hostname)}</div><div class="cell-sub">${e(a.makerModel)} - ${e(a.os)}</div>`;
      const hostCell = (a) => `<span class="cell-name">${e(a.hostname)}</span>`;

      const pendCols = [
        { h: "Máy", r: machineCell, cls: "wrap" },
        { h: "Serial", r: (a) => a.serial ? `<span class="mono">${e(a.serial)}</span>` : '<span class="muted">Không đọc được</span>' },
        { h: "Địa chỉ IP", r: (a) => `<span class="mono">${e(a.ip)}</span>` },
        { h: "Báo cáo gần nhất", r: reportCell },
        { h: "Vì sao chưa gắn", r: (a) => `<span class="small">${e(a.reason)}</span>`, cls: "wrap" },
      ];
      if (canCreate || canLink || canEnroll) pendCols.push({ h: "Thao tác", r: (a) => `<div class="row">${
        (canCreate && a.lastReport ? M.btn("Tạo tài sản", { sm: true, primary: true, modal: "agent-create-asset", arg: a.id }) : "") +
        (canLink ? M.btn("Gắn vào tài sản có sẵn", { sm: true, modal: "agent-link", arg: a.id }) : "") +
        (canEnroll ? M.btn("Thu hồi", { sm: true, ghost: true, modal: "agent-revoke", arg: a.id }) : "")}</div>` });

      const linkCols = [
        { h: "Máy", r: hostCell },
        { h: "Tài sản", r: (a) => { const x = M.asset(a.assetId); return x ? M.tape(x.tag, x.id) : '<span class="muted">—</span>'; } },
        { h: "Gắn nhờ", r: (a) => e(a.linkVia) },
        { h: "Địa chỉ IP", r: (a) => `<span class="mono">${e(a.ip)}</span>` },
        { h: "Báo cáo gần nhất", r: reportCell },
      ];
      if (canLink || canEnroll) linkCols.push({ h: "Thao tác", r: (a) => `<div class="row">${
        (canLink ? M.btn("Bỏ gắn", { sm: true, modal: "agent-unlink", arg: a.id }) : "") +
        (canEnroll ? M.btn("Thu hồi", { sm: true, ghost: true, modal: "agent-revoke", arg: a.id }) : "")}</div>` });

      const pendingPanel = M.panel({
        title: `Máy chờ xác nhận (${pending.length})`, flush: true,
        body: (canCreate ? M.bulkbar("pending-agents", M.btn("Tạo tài sản cho các máy đã chọn", { sm: true, act: "agents-bulk-create" })) : "") +
          M.table({ id: "pending-agents", select: canCreate, cols: pendCols, rows: pending, empty: "Không có máy nào đang chờ. Máy do agent báo cáo mà chưa khớp được với tài sản nào sẽ hiện ở đây." }),
      });

      const linkedPanel = M.panel({
        title: `Agent đang báo cáo cho tài sản (${linked.length})`, flush: true,
        body: M.toolbar(M.searchBox("linked-agents", "Lọc theo tên máy, mã tài sản, IP…")) +
          M.table({ id: "linked-agents", cols: linkCols, rows: linked, empty: "Chưa có agent nào gắn với tài sản." }),
      });

      const installPanel = canEnroll ? M.panel({
        title: "Cài agent lên máy mới",
        body: `<div class="stack">
          ${M.form("enroll-create", `<div class="inline-form row" style="align-items:flex-end">
            <div style="flex:1;min-width:240px">${M.field("Tên gợi nhớ cho mã kết nạp", M.input("name", { ph: "Ví dụ: Đợt cài phòng Kế toán" }), { req: true })}</div>
            ${M.btn("Tạo mã kết nạp", { primary: true, type: "submit", icon: "key" })}</div>`)}
          ${justCreatedCode ? `<div class="stack-sm" style="border:1.5px solid var(--tape-edge);border-radius:6px;padding:14px;background:color-mix(in srgb,var(--tape) 10%,transparent)">
              <b>Mã kết nạp "${e(justCreatedCode.name)}"</b>
              <div class="secret"><code>${e(justCreatedCode.code)}</code>${M.btn("Sao chép", { sm: true, msg: "Đã sao chép mã kết nạp." })}</div>
              ${M.note("Mã chỉ hiện một lần này.", "warn")}
              ${installCmds(justCreatedCode.code)}</div>`
            : `<div><h3 style="margin-bottom:8px">Các lệnh cài agent</h3>${installCmds(null)}</div>`}
          ${M.cc("CC-21", "Agent hiện là một tệp Python nên máy trạm phải có Python 3.8 trở lên. Máy trạm của công ty có được cài Python không, hay phải đóng gói bộ cài riêng (.msi, .pkg, .deb) chạy như dịch vụ trước khi cài rộng?")}
        </div>`,
      }) : "";
      justCreatedCode = null; // mã đầy đủ chỉ hiện đúng một lần

      const codesPanel = canEnroll ? M.panel({
        title: "Mã kết nạp", flush: true,
        body: M.table({
          id: "enroll-codes",
          cols: [
            { h: "Tên", r: (c) => `<span class="strong">${e(c.name)}</span>`, cls: "wrap" },
            { h: "Mã", r: (c) => `<span class="mono">${e(c.prefix)}…</span>` },
            { h: "Người tạo, ngày tạo", r: (c) => `${e(c.by)} - <span class="mono">${e(c.at)}</span>` },
            { h: "Số agent đã kết nạp", r: (c) => `<span class="mono">${e(c.count)}</span>`, cls: "right" },
            { h: "Trạng thái", r: (c) => c.revoked ? M.pill("Đã thu hồi " + c.revoked, "mute") : M.pill("Đang dùng được", "ok") },
            { h: "", r: (c) => c.revoked ? "" : M.btn("Thu hồi", { sm: true, ghost: true, modal: "enroll-revoke", arg: c.id }) },
          ],
          rows: D.enrollCodes, empty: "Chưa có mã kết nạp nào.",
        }),
      }) : "";

      const revokedPanel = revoked.length ? M.panel({
        title: `Agent đã thu hồi (${revoked.length})`, flush: true,
        body: M.table({
          id: "revoked-agents",
          cols: [
            { h: "Máy", r: hostCell },
            { h: "Ngày kết nạp", r: (a) => `<span class="mono">${e(a.enrolledAt)}</span>` },
            { h: "Báo cáo cuối", r: (a) => a.lastReport ? `<span class="mono">${e(a.lastReport)}</span>` : '<span class="muted">Chưa báo cáo</span>' },
            { h: "", r: (a) => canEnroll ? M.btn("Xóa khỏi danh sách", { sm: true, ghost: true, act: "agent-delete", arg: a.id, confirm: `Xóa agent ${a.hostname} khỏi danh sách?` }) : "" },
          ],
          rows: revoked,
        }),
      }) : "";

      return M.page({
        title: "Agent &amp; máy chờ xác nhận",
        sub: "Máy khớp được một tài sản thì tự gắn, máy còn lại chờ người xác nhận.",
        codes: ["NV-1.2.1", "NV-1.2.2", "NV-1.3.1", "NV-1.4.1", "NV-1.4.2"],
        actions: M.btn("Đổi chu kỳ báo cáo", { modal: "agent-cycle", perm: "agent.enroll", icon: "clock" }),
        body: `${M.stats([
          { label: "Quá hạn báo cáo", value: overdue.length, tone: overdue.length ? "bad" : "mute" },
          { label: "Chu kỳ báo cáo", value: D.agentCycleHours + " giờ", tone: "info" },
        ])}
        ${M.cc("CC-6", "Tài sản do quét tự tạo có vào thẳng danh sách chính hay phải qua bước duyệt? Hiện tạm làm theo hướng cần người có quyền thêm tài sản bấm \"Tạo tài sản\".")}
        ${pendingPanel}${linkedPanel}${installPanel}${codesPanel}${revokedPanel}
        ${M.panel({
          title: "Dữ liệu agent thu thập", flush: true,
          body: M.table({
            id: "agent-scope",
            cols: [
              { h: "Nhóm", r: (r) => `<span class="strong">${e(r[0])}</span>` },
              { h: "Agent đã thu", r: (r) => `<span class="small">${e(r[1])}</span>`, cls: "wrap" },
            ],
            rows: [
              ["Phần cứng", "CPU (tên, số nhân, số luồng), tổng RAM, ổ đĩa (model, serial, dung lượng, SSD hay HDD), serial máy, hãng, model, BIOS UUID, phiên bản BIOS"],
              ["Phần mềm", "Tên và phiên bản phần mềm đã cài"],
              ["Hệ thống", "Hệ điều hành và phiên bản, tên máy, card mạng thật (tên, MAC, IPv4), địa chỉ IP đang dùng"],
            ],
          }),
        })}`,
      });
    },
  });

  /* ===================== Mục tiêu và lịch quét (NV-1.1.2) ===================== */
  M.defModal("scan-target", () => ({
    title: "Thêm mục tiêu quét", wide: true,
    body: `<div class="form-grid">
      ${M.field("Tên mục tiêu", M.input("name", { ph: "Ví dụ: Văn phòng Hà Nội tầng 5" }), { req: true })}
      ${M.field("Kiểu mục tiêu", M.select("kind", Object.entries(KIND), "ip"), { req: true })}
      ${M.field("Phạm vi", M.input("scope", { ph: "10.10.5.0/24" }), { req: true, full: true, hint: "10.10.5.0/24, 10.10.5.1-10.10.5.254, OU=...,DC=anphat,DC=local hoặc các IP cách nhau bằng dấu phẩy" })}
      <div class="field full">Giao thức sẽ thử<div class="row">${["WMI/WinRM", "SSH", "SNMP v1/v2c", "SNMP v3"].map((p) => M.checkbox("p_" + p, p, p !== "SNMP v1/v2c")).join("")}</div></div>
      <div class="field full">Thông tin xác thực sẽ thử<div class="row">${D.credentials.map((c) => M.checkbox("c_" + c.id, c.name, c.id === "cr1")).join("")}</div></div>
      ${M.field("Lịch chạy", M.select("schedule", [["once", "Chạy một lần"], ["repeat", "Lặp theo chu kỳ"], ["window", "Theo khung giờ tùy chỉnh"]], "repeat"))}
      ${M.field("Chu kỳ / khung giờ", M.input("when", { value: "Mỗi ngày 01:00" }))}
      ${M.field("Trạm quét thực hiện", M.select("station", D.satellites.map((s) => [s.name, s.name + (s.state === "lost" ? " (mất kết nối)" : "")]), D.satellites[0].name))}
    </div>`,
    submit: "Lưu mục tiêu",
    onSubmit(d, form) {
      if (!(d.name || "").trim()) return M.invalid(form, "name", "Chưa nhập tên mục tiêu.");
      if (!(d.scope || "").trim()) return M.invalid(form, "scope", "Chưa nhập phạm vi quét.");
      if (d.kind === "ip" && !rangeOk(d.scope)) return M.invalid(form, "scope", "Dải IP không đúng định dạng. Nhập dạng 10.10.3.0/24 hoặc 10.10.3.1-10.10.3.254.");
      if (d.kind === "list" && !d.scope.split(",").every((x) => ipOk(x.trim()))) return M.invalid(form, "scope", "Danh sách có địa chỉ IP không hợp lệ.");
      const protocols = Object.keys(d).filter((k) => k.startsWith("p_")).map((k) => k.slice(2));
      const creds = Object.keys(d).filter((k) => k.startsWith("c_")).map((k) => k.slice(2));
      D.scanTargets.push({ id: "tg" + (D.scanTargets.length + 1), name: d.name.trim(), kind: d.kind, scope: d.scope.trim(), protocols, creds, schedule: d.schedule === "once" ? "Một lần" : d.when, station: d.station, lastRun: null, enabled: true });
      return `Đã thêm mục tiêu quét "${d.name.trim()}"`;
    },
  }));

  M.action("excl-add", (form, d) => {
    const ip = (d.ip || "").trim();
    if (!rangeOk(ip)) return M.invalid(form, "ip", "Địa chỉ hoặc dải IP không đúng định dạng.");
    D.scanExclusions.push({ ip, note: (d.note || "").trim() || "Không ghi lý do" });
    M.refresh();
    return `Đã thêm ${ip} vào danh sách loại trừ`;
  });
  M.action("target-toggle", (el, id) => {
    const t = M.find("scanTargets", id);
    t.enabled = !t.enabled;
    M.refresh();
    return t.enabled ? `Đã bật mục tiêu "${t.name}"` : `Đã tắt mục tiêu "${t.name}"`;
  });

  M.screen("discovery/targets", {
    nav: "discovery/targets", title: "Mục tiêu & lịch quét", codes: ["NV-1.1.2"],
    render() {
      const can = M.can("scan.manage");
      const cols = [
        { h: "Mục tiêu", r: (t) => `<div class="cell-name">${e(t.name)}</div><div class="cell-sub mono">${e(t.scope)}</div>`, cls: "wrap" },
        { h: "Lịch", r: (t) => e(t.schedule), cls: "wrap" },
        { h: "Trạm quét", r: (t) => e(t.station) },
        { h: "Lần chạy gần nhất", r: (t) => t.lastRun ? `<a href="#/discovery/runs/${e(t.lastRun)}" class="mono">${e(t.lastRun)}</a>` : '<span class="muted">Chưa chạy</span>' },
        { h: "Trạng thái", r: (t) => t.enabled ? M.pill("Đang bật", "ok") : M.pill("Đã tắt", "mute") },
      ];
      if (can) cols.push({ h: "", r: (t) => `<div class="row">${M.btn("Quét ngay", { sm: true, icon: "play", msg: `Đã bắt đầu phiên quét R-0414 cho "${t.name}". Theo dõi ở trang Phiên quét.` })}${M.btn(t.enabled ? "Tắt" : "Bật", { sm: true, ghost: true, act: "target-toggle", arg: t.id })}</div>` });
      return M.page({
        title: "Mục tiêu &amp; lịch quét",
        sub: "Vùng mạng, OU hoặc danh sách máy cần quét không cần agent.",
        codes: ["NV-1.1.2", "NV-1.1.3"],
        actions: M.btn("Thêm mục tiêu", { primary: true, icon: "plus", modal: "scan-target", perm: "scan.manage" }),
        body: `${M.cc("CC-4", "Chu kỳ quét mặc định và khung giờ được phép quét (ví dụ chỉ ngoài giờ làm việc) chưa chốt.")}
          ${M.panel({ title: `Mục tiêu quét (${D.scanTargets.length})`, flush: true, body: M.table({ id: "scan-targets", cols, rows: D.scanTargets }) })}
          <div class="grid g2">
            ${M.panel({
              title: "Danh sách loại trừ", flush: true,
              body: M.table({ id: "scan-excl", cols: [{ h: "IP / dải", r: (x) => `<span class="mono">${e(x.ip)}</span>` }, { h: "Lý do", r: (x) => e(x.note), cls: "wrap" }], rows: D.scanExclusions }) +
                (can ? `<div class="panel-body">${M.form("excl-add", `<div class="row" style="align-items:flex-end">
                  <div style="flex:1;min-width:150px">${M.field("IP hoặc dải", M.input("ip", { ph: "10.10.3.201" }))}</div>
                  <div style="flex:2;min-width:180px">${M.field("Lý do", M.input("note", { ph: "Thiết bị nhạy cảm…" }))}</div>
                  ${M.btn("Thêm", { type: "submit" })}</div>`)}</div>` : ""),
            })}
            ${M.panel({ title: "Lịch 7 ngày tới", body: `<ul class="log">${[
              ["28/11 00:00", "Phòng máy chủ", "Mỗi 6 giờ"], ["28/11 01:00", "Văn phòng Hà Nội tầng 3", "Mỗi ngày"], ["28/11 02:00", "Chi nhánh TP.HCM (trạm HCM-SAT-01)", "Mỗi ngày"],
              ["28/11 02:30", "Văn phòng Đà Nẵng (trạm DN-SAT-01 đang mất kết nối)", "Mỗi ngày"], ["29/11 12:00", "OU Máy trạm Kế toán", "Thứ 2 đến thứ 6"], ["30/11 03:00", "Máy in và UPS", "Hằng tuần"],
            ].map(([t, n, k]) => `<li><time>${e(t)}</time><div><div class="log-title">${e(n)}</div><div class="log-meta">${e(k)}</div></div></li>`).join("")}</ul>` })}
          </div>`,
      });
    },
  });

  /* ===================== Phiên quét (NV-1.1.3) ===================== */
  M.screen("discovery/runs", {
    nav: "discovery/runs", title: "Phiên quét", codes: ["NV-1.1.3"],
    render() {
      const runs = D.scanRuns;
      const done = runs.filter((r) => r.state !== "running");
      return M.page({
        title: "Phiên quét mạng",
        codes: ["NV-1.1.3"],
        actions: M.btn("Quét ngay…", { primary: true, icon: "play", href: "#/discovery/targets", perm: "scan.manage" }),
        body: `${M.stats([
          { label: "Phiên trong 7 ngày", value: runs.length, tone: "info" },
          { label: "Thiết bị thấy (phiên gần nhất)", value: done[0].found, tone: "ok" },
          { label: "Phiên có lỗi", value: runs.filter((r) => r.state === "warn").length, tone: "warn" },
          { label: "Dừng giữa chừng", value: runs.filter((r) => r.state === "stopped").length, tone: "bad" },
        ])}
        ${M.panel({ title: "Lịch sử phiên quét", flush: true, body: M.toolbar(M.searchBox("scan-runs", "Lọc theo mã phiên, mục tiêu…")) + M.table({
          id: "scan-runs", href: (r) => "#/discovery/runs/" + r.id,
          cols: [
            { h: "Phiên", r: (r) => `<span class="mono strong">${e(r.id)}</span>` },
            { h: "Mục tiêu", r: (r) => e(targetName(r.target)), cls: "wrap" },
            { h: "Bắt đầu", r: (r) => `<span class="mono">${e(r.start)}</span>` },
            { h: "Thời lượng", r: (r) => e(r.duration) },
            { h: "Thấy / quét sâu / lỗi", r: (r) => `<span class="mono">${e(r.found)} / ${e(r.deep)} / ${e(r.errors)}</span>`, cls: "right" },
            { h: "Kết quả", r: (r) => M.pill(RUN_ST[r.state][0], RUN_ST[r.state][1]) },
          ],
          rows: runs,
        }) })}`,
      });
    },
  });

  M.screen("discovery/runs/:id", {
    nav: "discovery/runs", title: "Chi tiết phiên quét", codes: ["NV-1.1.3"],
    render(p) {
      const r = M.find("scanRuns", p.id);
      if (!r) return M.page({ title: "Không tìm thấy phiên quét", back: ["#/discovery/runs", "Phiên quét"], body: M.empty(`Không có phiên quét ${p.id}.`) });
      const t = M.find("scanTargets", r.target);
      const RES = { deep: ["Quét sâu", "ok"], shallow: ["Chưa quét sâu", "warn"], error: ["Lỗi", "bad"] };
      const devices = r.id === "R-0412" ? R0412 : [];
      return M.page({
        title: `Phiên quét <span class="mono">${e(r.id)}</span>`,
        back: ["#/discovery/runs", "Phiên quét"],
        codes: ["NV-1.1.3", "NV-1.3.1"],
        sub: `${e(targetName(r.target))} - ${e(r.trigger)}`,
        actions: M.btn("Quét lại", { icon: "refresh", perm: "scan.manage", msg: `Đã bắt đầu phiên quét mới cho "${targetName(r.target)}".` }) + (r.state === "running" ? M.btn("Dừng phiên", { danger: true, perm: "scan.manage", msg: "Đã dừng phiên. Dữ liệu của các máy chưa quét lại vẫn giữ nguyên." }) : ""),
        body: `${M.stats([
          { label: "Thiết bị thấy", value: r.found, tone: "info" },
          { label: "Quét sâu được", value: r.deep, tone: "ok" },
          { label: "Chưa quét sâu", value: r.shallow, tone: "warn" },
          { label: "Lỗi", value: r.errors, tone: r.errors ? "bad" : "mute" },
        ])}
        ${r.state === "stopped" ? M.note(e(r.stopReason), "bad") : ""}
        <div class="side-layout">
          ${M.panel({
            title: "Kết quả từng máy", flush: true,
            body: devices.length ? M.toolbar(M.searchBox("run-devices", "Lọc theo IP, MAC, loại, lý do…")) + M.table({
              id: "run-devices",
              cols: [
                { h: "IP", r: (d) => `<span class="mono">${e(d[0])}</span>` },
                { h: "MAC", r: (d) => `<span class="mono small">${e(d[1])}</span>` },
                { h: "Loại đoán được", r: (d) => e(d[2]), cls: "wrap" },
                { h: "Kết quả", r: (d) => M.pill(RES[d[4]][0], RES[d[4]][1]) },
                { h: "Lý do / ghi chú", r: (d) => d[5] ? `<span class="small">${e(d[5])}</span>` : '<span class="muted">—</span>', cls: "wrap" },
                { h: "Tài sản khớp", r: (d) => d[6] ? M.tape(M.asset(d[6]).tag, d[6]) : '<span class="muted">Chưa có</span>' },
              ],
              rows: devices,
            }) : `<div class="panel-body">${M.anno("Mockup chỉ vẽ kết quả từng máy cho phiên R-0412.")} <a href="#/discovery/runs/R-0412">Mở phiên R-0412</a></div>`,
            foot: devices.length ? `<span>Hiển thị ${devices.length} trong ${r.found} thiết bị. Bỏ qua 10.10.3.200 (danh sách loại trừ).</span>` : "",
          })}
          <div class="stack">
            ${M.panel({ title: "Thông tin phiên", body: M.kv([
              ["Mục tiêu", t ? `${e(t.name)}<div class="cell-sub mono">${e(t.scope)}</div>` : ""],
              ["Trạm quét", e(r.station)],
              ["Bắt đầu", `<span class="mono">${e(r.start)}</span>`],
              ["Thời lượng", e(r.duration)],
              ["Giao thức", t ? pillsOf(t.protocols, "info") : ""],
              ["Kết quả", M.pill(RUN_ST[r.state][0], RUN_ST[r.state][1])],
            ]) })}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== Thông tin xác thực dùng để quét (NV-1.1.1) ===================== */
  const usedBy = (credId) => D.scanTargets.filter((t) => t.creds.includes(credId)).map((t) => t.name)
    .concat(D.connectors.filter((c) => c.credId === credId).map((c) => c.platform));
  const logCred = (action, cred) => D.credLog.unshift({ at: nowText, who: M.me().user, action, cred, ip: "10.10.2.15" });

  M.defModal("cred-add", () => ({
    title: "Thêm thông tin xác thực",
    body: `<div class="form-grid">
      ${M.field("Loại", M.select("type", ["Tài khoản Windows/AD", "Khóa SSH", "Chuỗi SNMP", "Khóa API vCenter", "Khóa API cloud"], "Tài khoản Windows/AD"), { req: true })}
      ${M.field("Tên gợi nhớ", M.input("name", { ph: "Ví dụ: AD dịch vụ quét" }), { req: true })}
      ${M.field("Tài khoản / định danh", M.input("ident", { ph: "ANPHAT\\svc-itam-scan" }), { full: true })}
      ${M.field("Giá trị bí mật", '<textarea name="secret" rows="3" placeholder="Mật khẩu, khóa riêng SSH, chuỗi community hoặc khóa API"></textarea>', { req: true, full: true, hint: "Lưu xong không xem lại được." })}
    </div>`,
    submit: "Lưu",
    onSubmit(d, form) {
      if (!(d.name || "").trim()) return M.invalid(form, "name", "Chưa nhập tên gợi nhớ.");
      if (!(d.secret || "").trim()) return M.invalid(form, "secret", "Chưa nhập giá trị bí mật.");
      D.credentials.push({ id: "cr" + (D.credentials.length + 1), name: d.name.trim(), type: d.type, ident: (d.ident || "").trim() || "—", updated: "27/11/2026", by: M.me().user, lastUsed: null });
      logCred("Thêm", d.name.trim());
      return `Đã lưu thông tin xác thực "${d.name.trim()}"`;
    },
  }));

  M.defModal("cred-view", (id) => {
    const c = M.find("credentials", id);
    logCred("Xem", c.name);
    return {
      title: c.name,
      body: `${M.kv([["Loại", e(c.type)], ["Tài khoản / định danh", `<span class="mono">${e(c.ident)}</span>`], ["Giá trị bí mật", '<span class="mono">••••••••••••••••</span>'], ["Đang dùng bởi", e(usedBy(c.id).join(", ") || "Chưa dùng")], ["Cập nhật", `${e(c.updated)} - ${e(c.by)}`]])}
        ${M.field("Đổi giá trị bí mật", '<input type="password" name="secret" placeholder="Để trống nếu giữ nguyên">')}`,
      submit: "Lưu thay đổi",
      onSubmit(d) {
        if ((d.secret || "").trim()) { c.updated = "27/11/2026"; c.by = M.me().user; logCred("Sửa (đổi giá trị bí mật)", c.name); return `Đã đổi giá trị bí mật của "${c.name}"`; }
        return "Không có thay đổi.";
      },
    };
  });

  M.defModal("cred-test", (id) => {
    const c = M.find("credentials", id);
    return {
      title: "Thử kết nối",
      body: `<p>Thử bộ <b>${e(c.name)}</b> với một máy mẫu.</p>
        ${M.field("Máy mẫu (IP hoặc tên máy)", M.input("host", { value: c.type === "Khóa API vCenter" ? "10.10.0.20" : "10.10.3.21" }), { req: true })}`,
      submit: "Thử kết nối",
      onSubmit(d, form) {
        const h = (d.host || "").trim();
        if (!h) return M.invalid(form, "host", "Nhập máy mẫu để thử.");
        logCred("Thử kết nối tới " + h, c.name);
        return `Kết nối thành công tới ${h} (0,8 giây). Lần thử đã ghi vào nhật ký kiểm toán.`;
      },
    };
  });

  M.action("cred-del", (el, id) => {
    const c = M.find("credentials", id);
    const used = usedBy(id);
    if (used.length) { M.toast(`Không xóa được: bộ thông tin xác thực đang được mục tiêu quét "${used.join('", "')}" dùng. Gỡ khỏi mục tiêu trước.`, "bad"); return; }
    if (!window.confirm(`Xóa bộ thông tin xác thực "${c.name}"?`)) return;
    D.credentials = D.credentials.filter((x) => x.id !== id);
    logCred("Xóa", c.name);
    M.refresh();
    return `Đã xóa "${c.name}"`;
  });

  M.screen("discovery/credentials", {
    nav: "discovery/credentials", title: "Thông tin xác thực", codes: ["NV-1.1.1"],
    render() {
      const can = M.can("scan.credentials");
      return M.page({
        title: "Thông tin xác thực dùng để quét",
        sub: "Tài khoản, khóa SSH, chuỗi SNMP và khóa API dùng để đăng nhập khi quét.",
        codes: ["NV-1.1.1"],
        actions: M.btn("Thêm thông tin xác thực", { primary: true, icon: "plus", modal: "cred-add", perm: "scan.credentials" }),
        body: `${M.panel({ title: `Bộ thông tin xác thực (${D.credentials.length})`, flush: true, body: M.table({
          id: "creds",
          cols: [
            { h: "Tên gợi nhớ", r: (c) => `<span class="strong">${e(c.name)}</span>` },
            { h: "Loại", r: (c) => e(c.type) },
            { h: "Tài khoản / định danh", r: (c) => `<span class="mono small">${e(c.ident)}</span>` },
            { h: "Đang dùng bởi", r: (c) => { const u = usedBy(c.id); return u.length ? `<span class="small">${e(u.join(", "))}</span>` : M.pill("Chưa dùng", "mute"); }, cls: "wrap" },
            { h: "Dùng gần nhất", r: (c) => c.lastUsed ? `<span class="mono small">${e(c.lastUsed)}</span>` : '<span class="muted">—</span>' },
            { h: "", r: (c) => can ? `<div class="row">${M.btn("Xem / sửa", { sm: true, modal: "cred-view", arg: c.id })}${M.btn("Thử kết nối", { sm: true, modal: "cred-test", arg: c.id })}${M.btn("Xóa", { sm: true, ghost: true, act: "cred-del", arg: c.id })}</div>` : "" },
          ],
          rows: D.credentials,
        }) })}
        ${M.panel({ title: "Nhật ký truy cập thông tin xác thực", flush: true, body: M.table({
          id: "cred-log",
          cols: [
            { h: "Thời điểm", r: (l) => `<span class="mono small">${e(l.at)}</span>` },
            { h: "Người / hệ thống", r: (l) => e(l.who) },
            { h: "Hành động", r: (l) => e(l.action) },
            { h: "Bộ thông tin", r: (l) => e(l.cred) },
            { h: "Từ IP", r: (l) => `<span class="mono small">${e(l.ip)}</span>` },
          ],
          rows: D.credLog.slice(0, 10),
        }) })}`,
      });
    },
  });

  /* ===================== Ảo hóa, cloud, MDM (NV-1.1.4, NV-1.1.5) ===================== */
  const CN_ST = { ok: ["Đồng bộ thành công", "ok"], error: ["Lỗi đồng bộ", "bad"], off: ["Chưa cấu hình", "mute"] };
  M.defModal("connector", (id) => {
    const c = M.find("connectors", id);
    return {
      title: (c.state === "off" ? "Kết nối " : "Cấu hình ") + c.platform,
      body: `<div class="form-grid">
        ${M.field("Địa chỉ / tài khoản", M.input("endpoint", { value: c.endpoint || "", ph: c.kind === "virt" ? "vc01.anphat.local" : "ID tài khoản hoặc tenant" }), { req: true, full: true })}
        ${M.field("Thông tin xác thực", M.select("cred", D.credentials.map((x) => [x.id, x.name]), c.credId || "", { blank: "Chọn bộ thông tin xác thực" }), { req: true })}
        ${M.field("Lịch đồng bộ", M.select("sched", ["Mỗi 4 giờ", "Mỗi 6 giờ", "Mỗi ngày 06:00"], c.schedule || "Mỗi 6 giờ"))}
      </div>`,
      submit: "Lưu và đồng bộ thử",
      onSubmit(d, form) {
        if (!(d.endpoint || "").trim()) return M.invalid(form, "endpoint", "Chưa nhập địa chỉ hoặc tài khoản.");
        if (!d.cred) return M.invalid(form, "cred", "Chọn bộ thông tin xác thực.");
        Object.assign(c, { endpoint: d.endpoint.trim(), credId: d.cred, schedule: d.sched, state: "ok", lastSync: nowText, error: null, summary: c.summary || "Đang đồng bộ lần đầu…" });
        return `Đã lưu kết nối ${c.platform} và đồng bộ thử thành công.`;
      },
    };
  });

  M.screen("discovery/connectors", {
    nav: "discovery/connectors", title: "Ảo hóa, cloud, MDM", codes: ["NV-1.1.4", "NV-1.1.5"],
    render() {
      const can = M.can("scan.manage");
      const table = (kind) => M.table({
        id: "cn-" + kind,
        cols: [
          { h: "Nền tảng", r: (c) => `<span class="strong">${e(c.platform)}</span>` },
          { h: "Địa chỉ / tài khoản", r: (c) => c.endpoint ? `<span class="mono small">${e(c.endpoint)}</span>` : '<span class="muted">—</span>', cls: "wrap" },
          { h: "Thông tin xác thực", r: (c) => c.credId ? e(credName(c.credId)) : '<span class="muted">—</span>' },
          { h: "Đồng bộ gần nhất", r: (c) => c.lastSync ? `<span class="mono small">${e(c.lastSync)}</span>` : '<span class="muted">—</span>' },
          { h: "Kết quả", r: (c) => `${M.pill(CN_ST[c.state][0], CN_ST[c.state][1])}${c.summary ? `<div class="cell-sub">${e(c.summary)}</div>` : ""}${c.error ? `<div class="small" style="color:var(--bad);margin-top:4px">${e(c.error)}</div>` : ""}`, cls: "wrap" },
          { h: "", r: (c) => can ? `<div class="row">${c.state === "off" ? M.btn("Kết nối", { sm: true, primary: true, modal: "connector", arg: c.id }) : M.btn("Đồng bộ ngay", { sm: true, icon: "refresh", msg: `Đang đồng bộ ${c.platform}…` }) + M.btn("Cấu hình", { sm: true, ghost: true, modal: "connector", arg: c.id })}</div>` : "" },
        ],
        rows: D.connectors.filter((c) => (kind === "virt" ? c.kind === "virt" : c.kind !== "virt")),
      });
      return M.page({
        title: "Ảo hóa, cloud và MDM",
        sub: "Đọc máy chủ, máy ảo, tài nguyên cloud và thiết bị Intune qua API.",
        codes: ["NV-1.1.4", "NV-1.1.5"],
        body: `${M.cc("CC-5", "Công ty đang dùng những nền tảng cloud và ảo hóa nào? Làm trước đúng nền tảng cần, các nền tảng còn lại để \"Chưa cấu hình\".")}
        ${M.panel({ title: "Hạ tầng ảo hóa", flush: true, body: table("virt") })}
        ${M.panel({ title: "Cloud và thiết bị di động (MDM)", flush: true, body: table("cloud") })}
        ${M.panel({
          title: "Máy ảo từ vCenter", flush: true,
          body: M.table({
            id: "vms",
            cols: [
              { h: "Máy ảo", r: (v) => `<span class="strong mono">${e(v[0])}</span>` },
              { h: "Chạy trên", r: (v) => M.tape(M.asset(v[1]).tag, v[1]) },
              { h: "vCPU", r: (v) => `<span class="mono">${e(v[2])}</span>`, cls: "right" },
              { h: "RAM", r: (v) => e(v[3]) },
              { h: "Hệ điều hành", r: (v) => e(v[5]) },
              { h: "Trạng thái", r: (v) => v[4] === "Không còn thấy" ? M.pill("Không còn thấy", "warn") : M.pill(v[4], v[4] === "Bật" ? "ok" : "mute") },
            ],
            rows: D.vms,
          }),
        })}`,
      });
    },
  });

  /* ===================== Trạm quét vệ tinh (NV-1.2.3) ===================== */
  M.defModal("satellite", () => ({
    title: "Bật vai trò trạm quét",
    body: `${M.field("Máy đã cài agent trong vùng mạng cần quét", M.select("agent", D.agents.filter((a) => a.state === "linked").map((a) => [a.id, `${a.hostname} - ${a.ip}`]), "", { blank: "Chọn máy" }), { req: true })}
      ${M.field("Tên trạm", M.input("name", { ph: "DN-SAT-02" }), { req: true })}
      ${M.field("Vùng mạng trạm phụ trách", M.input("net", { ph: "10.40.1.0/24" }), { req: true })}`,
    submit: "Bật vai trò trạm quét",
    onSubmit(d, form) {
      if (!d.agent) return M.invalid(form, "agent", "Chọn máy làm trạm quét.");
      if (!(d.name || "").trim()) return M.invalid(form, "name", "Chưa nhập tên trạm.");
      if (!rangeOk(d.net)) return M.invalid(form, "net", "Dải IP không đúng định dạng. Nhập dạng 10.10.3.0/24 hoặc 10.10.3.1-10.10.3.254.");
      D.satellites.push({ id: "st" + D.satellites.length, name: d.name.trim(), networks: d.net.trim(), targets: [], state: "ok", lastContact: nowText, version: "0.4.2", host: M.find("agents", d.agent).hostname });
      return `Đã bật vai trò trạm quét cho ${M.find("agents", d.agent).hostname}. Gán mục tiêu quét cho trạm ở trang Mục tiêu.`;
    },
  }));

  M.screen("discovery/satellites", {
    nav: "discovery/satellites", title: "Trạm quét vệ tinh", codes: ["NV-1.2.3"],
    render() {
      const lost = D.satellites.filter((s) => s.state === "lost");
      return M.page({
        title: "Trạm quét vệ tinh",
        sub: "Máy cài agent ở chi nhánh hoặc VLAN xa, tự quét rồi đẩy kết quả về.",
        codes: ["NV-1.2.3"],
        actions: M.btn("Bật vai trò trạm quét", { primary: true, icon: "plus", modal: "satellite", perm: "scan.manage" }),
        body: `${lost.map((s) => M.note(`Trạm <b>${e(s.name)}</b> mất kết nối từ ${e(s.lastContact)}. Các mục tiêu của trạm không chạy được.`, "bad")).join("")}
        ${M.panel({ title: "Trạm quét", flush: true, body: M.table({
          id: "satellites",
          cols: [
            { h: "Trạm", r: (s) => `<div class="cell-name">${e(s.name)}</div><div class="cell-sub">${e(s.main ? "Máy chủ ITAM" : s.host)}</div>` },
            { h: "Vùng mạng", r: (s) => `<span class="mono">${e(s.networks)}</span>` },
            { h: "Mục tiêu được gán", r: (s) => `<span class="small">${e(s.targets.map(targetName).join(", ") || "Chưa gán")}</span>`, cls: "wrap" },
            { h: "Liên lạc cuối", r: (s) => `<span class="mono small">${e(s.lastContact)}</span>` },
            { h: "Trạng thái", r: (s) => s.state === "ok" ? M.pill("Đang kết nối", "ok") : M.pill("Mất kết nối", "bad") },
            { h: "", r: (s) => !s.main && M.can("scan.manage") ? M.btn("Tắt vai trò trạm", { sm: true, ghost: true, msg: `Mockup: tắt vai trò trạm cho ${s.name}; mục tiêu của trạm chuyển về máy chủ chính.` }) : "" },
          ],
          rows: D.satellites,
        }) })}
        ${M.anno("Trạng thái \"Mất kết nối\" bật khi trạm không liên lạc quá 2 chu kỳ báo cáo của agent.")}`,
      });
    },
  });

  /* ===================== Nghi trùng (NV-1.3.2) ===================== */
  const DUP_FIELDS = [["Mã tài sản", "tag"], ["Tên", "name"], ["Serial", "serial"], ["Địa chỉ MAC", "mac"], ["Tên máy", "host"], ["Người / nơi giữ", "holder"], ["Nguồn", "source"], ["Ngày tạo", "created"], ["Dòng lưu ký", "logs"], ["Ticket", "tickets"]];
  M.defModal("dup-merge", (id) => {
    const d = M.find("duplicates", id);
    return {
      title: "Gộp làm một tài sản",
      body: `<p>Chọn tài sản giữ lại. Lịch sử lưu ký, ticket và liên kết của tài sản kia sẽ chuyển sang.</p>
        <div class="stack-sm">${M.radio("keep", "left", `Giữ ${d.left.tag} - ${d.left.name} (${d.left.source})`, true)}${M.radio("keep", "right", `Giữ ${d.right.tag} - ${d.right.name} (${d.right.source})`, false)}</div>
        ${M.field("Ghi chú", M.textarea("note", "", { ph: "Lý do gộp" }))}
        <div class="field">${M.checkbox("ok", "Tôi hiểu thao tác gộp không hoàn tác được", false)}</div>`,
      submit: "Gộp", danger: true,
      onSubmit(data, form) {
        if (!data.ok) return M.invalid(form, "ok", "Đánh dấu xác nhận trước khi gộp.");
        const keep = data.keep === "right" ? d.right : d.left;
        const drop = data.keep === "right" ? d.left : d.right;
        d.state = "merged";
        d.resolved = `${nowText} - ${M.me().user} - giữ ${keep.tag}, gộp ${drop.tag}`;
        return `Đã gộp ${drop.tag} vào ${keep.tag}. Lịch sử lưu ký, ticket và liên kết đã chuyển sang tài sản giữ lại; nhật ký kiểm toán ghi lần gộp.`;
      },
    };
  });
  M.action("dup-distinct", (el, id) => {
    const d = M.find("duplicates", id);
    d.state = "distinct";
    d.resolved = `${nowText} - ${M.me().user} - xác nhận hai thiết bị khác nhau`;
    M.refresh();
    return "Đã ghi nhận hai thiết bị khác nhau. Cặp này không bị hỏi lại ở lần quét sau.";
  });

  M.screen("discovery/duplicates", {
    nav: "discovery/duplicates", title: "Nghi trùng", codes: ["NV-1.3.2"],
    render() {
      const open = D.duplicates.filter((d) => d.state === "open");
      const done = D.duplicates.filter((d) => d.state !== "open");
      const can = M.can("dup.merge");
      const side = (x) => x.assetId ? `${M.tape(x.tag, x.assetId)}` : `<span class="tape">${e(x.tag)}</span>`;
      const card = (d) => M.panel({
        title: `${e(d.id)} - ${e(d.reason)}`,
        actions: `<span class="small muted">${e(d.source)} - ${e(d.detected)}</span>`,
        flush: true,
        body: M.table({
          id: "dup-" + d.id,
          cols: [
            { h: "Trường", r: (f) => `<span class="muted">${e(f[0])}</span>` },
            { h: "Bản ghi A", r: (f) => f[1] === "tag" ? side(d.left) : e(d.left[f[1]]), cls: "wrap" },
            { h: "Bản ghi B", r: (f) => f[1] === "tag" ? side(d.right) : e(d.right[f[1]]), cls: "wrap" },
            { h: "So sánh", r: (f) => ["tag", "logs", "tickets", "created", "source"].includes(f[1]) ? "" : (String(d.left[f[1]]).toLowerCase().replace(/\s/g, "") === String(d.right[f[1]]).toLowerCase().replace(/\s/g, "") && d.left[f[1]] !== "—" ? M.pill("Trùng", "warn") : M.pill("Khác", "mute")) },
          ],
          rows: DUP_FIELDS,
        }),
        foot: can ? `<span></span><span class="row">${M.btn("Là hai thiết bị khác nhau", { sm: true, act: "dup-distinct", arg: d.id })}${M.btn("Gộp làm một", { sm: true, primary: true, modal: "dup-merge", arg: d.id })}</span>` : "",
      });
      return M.page({
        title: "Xử lý nghi trùng",
        sub: "Cặp bản ghi hệ thống không tự quyết được là một hay hai thiết bị.",
        codes: ["NV-1.3.2", "NV-1.3.1"],
        body: M.tabs("dups", [
          { key: "open", label: "Chờ xử lý", n: open.length, body: open.length ? open.map(card).join("") : M.empty("Không còn cặp nào chờ xử lý.") },
          { key: "done", label: "Đã xử lý", n: done.length, body: M.panel({ flush: true, body: M.table({
            id: "dups-done",
            cols: [
              { h: "Cặp", r: (d) => `<span class="mono strong">${e(d.id)}</span>` },
              { h: "Bản ghi", r: (d) => `<span class="tape">${e(d.left.tag)}</span> - <span class="tape">${e(d.right.tag)}</span>` },
              { h: "Lý do nghi trùng", r: (d) => e(d.reason), cls: "wrap" },
              { h: "Kết luận", r: (d) => d.state === "merged" ? M.pill("Đã gộp", "info") : M.pill("Hai thiết bị khác nhau", "mute") },
              { h: "Người xử lý", r: (d) => `<span class="small">${e(d.resolved)}</span>`, cls: "wrap" },
            ],
            rows: done,
          }) }) },
        ]),
      });
    },
  });

  /* ===================== Thay đổi phần cứng (NV-1.3.3) ===================== */
  M.action("hw-prefs", (form, d) => {
    if (!M.can("scan.manage")) return "Vai trò của bạn chỉ xem cấu hình cảnh báo.";
    Object.assign(D.hwAlertPrefs, { ram: !!d.ram, disk: !!d.disk, nic: !!d.nic, ip: !!d.ip });
    M.refresh();
    return "Đã lưu cấu hình cảnh báo thay đổi phần cứng.";
  });

  M.screen("discovery/changes", {
    nav: "discovery/changes", title: "Thay đổi phần cứng", codes: ["NV-1.3.3"],
    render() {
      const rows = D.hwChanges.slice().sort((a, b) => parseDT(b.at) - parseDT(a.at));
      const can = M.can("scan.manage");
      const alertCell = (c) => {
        if (c.alerted) return M.pill("Đã gửi cảnh báo", "warn");
        if (c.reason) return M.pill("Không gửi: có lý do", "mute");
        if (!D.hwAlertPrefs[FIELD_PREF[c.field]]) return M.pill("Không gửi: đã tắt", "mute");
        return M.pill("Không gửi", "mute");
      };
      return M.page({
        title: "Lịch sử thay đổi phần cứng",
        sub: "Khác biệt về RAM, ổ cứng, card mạng, địa chỉ IP giữa hai lần nhận dữ liệu.",
        codes: ["NV-1.3.3"],
        body: `${M.stats([
          { label: "Thay đổi trong 30 ngày", value: rows.length, tone: "info" },
          { label: "Đã cảnh báo", value: rows.filter((c) => c.alerted).length, tone: "warn" },
          { label: "Có lý do, không cảnh báo", value: rows.filter((c) => c.reason).length, tone: "ok" },
        ])}
        <div class="side-layout">
          ${M.panel({ title: "Các thay đổi", flush: true, body: M.toolbar(M.searchBox("hw-changes", "Lọc theo mã tài sản, hạng mục…")) + M.table({
            id: "hw-changes",
            cols: [
              { h: "Thời điểm", r: (c) => `<span class="mono small">${e(c.at)}</span>` },
              { h: "Tài sản", r: (c) => { const a = M.asset(c.assetId); return M.tape(a.tag, a.id); } },
              { h: "Hạng mục", r: (c) => `<span class="strong">${e(c.field)}</span>` },
              { h: "Trước → sau", r: (c) => `<span class="small">${e(c.from)}</span> <span class="muted">→</span> <span class="small strong">${e(c.to)}</span>`, cls: "wrap" },
              { h: "Lý do", r: (c) => c.reason ? `<span class="small">${e(c.reason)}</span>` : '<span class="muted">Không rõ</span>', cls: "wrap" },
              { h: "Cảnh báo", r: alertCell, cls: "wrap" },
            ],
            rows,
          }) })}
          ${M.panel({ title: "Gửi cảnh báo khi", body: M.form("hw-prefs", `<div class="stack-sm">
              ${[["ram", "RAM thay đổi"], ["disk", "Ổ cứng thay đổi"], ["nic", "Card mạng thay đổi"], ["ip", "Địa chỉ IP thay đổi"]].map(([k, l]) => M.checkbox(k, l, D.hwAlertPrefs[k], { attrs: can ? "" : "disabled" })).join("")}
              ${can ? M.btn("Lưu", { primary: true, type: "submit" }) : ""}</div>`) })}
        </div>`,
      });
    },
  });

  /* ===================== Lâu không thấy (NV-1.4.3) ===================== */
  M.defModal("unseen-days", () => ({
    title: "Ngưỡng \"lâu không thấy\"",
    body: M.field("Số ngày không được nguồn nào thấy", M.input("days", { type: "number", value: D.unseenDays, attrs: 'min="1" max="365"' }), { req: true }),
    submit: "Lưu",
    onSubmit(d, form) {
      const n = parseInt(d.days, 10);
      if (!(n >= 1 && n <= 365)) return M.invalid(form, "days", "Nhập số ngày từ 1 đến 365.");
      D.unseenDays = n;
      return `Đã đổi ngưỡng thành ${n} ngày.`;
    },
  }));
  M.defModal("unseen-check", (id) => {
    const a = M.asset(id);
    return {
      title: "Ghi kết luận kiểm tra thực tế",
      body: `<p>${M.tape(a.tag)} ${e(a.name)} - đang ${e(M.STATUS[a.status])}</p>
        ${M.field("Kết luận", M.select("result", [["store", "Máy đang cất kho"], ["broken", "Máy đã hỏng"], ["lost", "Không tìm thấy (nghi thất lạc)"], ["offline", "Vẫn dùng bình thường, chỉ không nối mạng"]], "store"), { req: true })}
        ${M.field("Ghi chú", M.textarea("note", "", { ph: "Đã kiểm tra ở đâu, với ai" }))}`,
      submit: "Lưu kết luận",
      onSubmit(d) { return `Đã ghi kết luận cho ${a.tag}. Trạng thái vòng đời không đổi.`; },
    };
  });

  M.screen("discovery/unseen", {
    nav: "discovery/unseen", title: "Lâu không thấy", codes: ["NV-1.4.3"],
    render() {
      const can = M.can("asset.status");
      const rows = D.unseen.map((u) => ({ ...u, days: daysSince(u.lastSeen) })).filter((u) => u.days >= D.unseenDays).sort((a, b) => b.days - a.days);
      const below = D.unseen.map((u) => ({ ...u, days: daysSince(u.lastSeen) })).filter((u) => u.days < D.unseenDays);
      return M.page({
        title: "Thiết bị lâu không thấy",
        sub: `Tài sản không nguồn nào thấy quá ${e(D.unseenDays)} ngày.`,
        codes: ["NV-1.4.3"],
        actions: M.btn(`Ngưỡng: ${D.unseenDays} ngày`, { icon: "sliders", modal: "unseen-days", perm: "asset.status" }) + M.btn("Đối chiếu với đợt kiểm kê", { href: "#/stocktakes" }),
        body: `${M.panel({ title: `Lâu không thấy (${rows.length})`, flush: true, body: M.table({
          id: "unseen",
          cols: [
            { h: "Tài sản", r: (u) => { const a = M.asset(u.assetId); return `${M.tape(a.tag, a.id)} ${M.pill("Lâu không thấy", "warn")}<div class="cell-sub">${e(a.name)}</div>`; }, cls: "wrap" },
            { h: "Trạng thái vòng đời", r: (u) => M.led(M.asset(u.assetId).status) },
            { h: "Người / nơi giữ", r: (u) => M.holderHtml(M.asset(u.assetId)) },
            { h: "Thấy lần cuối", r: (u) => `<span class="mono small">${e(u.lastSeen)}</span><div class="cell-sub">${e(u.source)}</div>` },
            { h: "Số ngày", r: (u) => `<span class="mono strong">${e(u.days)}</span>`, cls: "right" },
            { h: "", r: (u) => can ? M.btn("Ghi kết luận", { sm: true, modal: "unseen-check", arg: u.assetId }) : "" },
          ],
          rows, empty: "Không có tài sản nào vượt ngưỡng.",
        }) })}
        ${below.length ? M.panel({ title: `Sắp chạm ngưỡng (${below.length})`, flush: true, body: M.table({
          id: "unseen-soon",
          cols: [
            { h: "Tài sản", r: (u) => assetCell(u.assetId), cls: "wrap" },
            { h: "Thấy lần cuối", r: (u) => `<span class="mono small">${e(u.lastSeen)}</span><div class="cell-sub">${e(u.source)}</div>` },
            { h: "Số ngày", r: (u) => `<span class="mono">${e(u.days)}</span>`, cls: "right" },
          ],
          rows: below,
        }) }) : ""}
        ${M.panel({ title: "Đã thấy lại", flush: true, body: M.table({
          id: "seen-again",
          cols: [
            { h: "Tài sản", r: (u) => assetCell(u.assetId), cls: "wrap" },
            { h: "Thấy lại lúc", r: (u) => `<span class="mono small">${e(u.lastSeen)}</span><div class="cell-sub">${e(u.source)}</div>` },
            { h: "Đã vắng", r: (u) => e(u.gap) },
            { h: "Trạng thái vòng đời", r: (u) => M.led(M.asset(u.assetId).status) },
          ],
          rows: D.seenAgain,
        }) })}
        ${M.cc("CC-12", "Có thêm trạng thái \"Thất lạc\" vào vòng đời tài sản không? Nếu có, kết luận \"Không tìm thấy\" ở đây sẽ dẫn sang nghiệp vụ đổi trạng thái tương ứng.")}`,
      });
    },
  });
})();
