/* Mockup ITAM - Module 3: Phần mềm, bản quyền và đánh giá rủi ro (NV-3.1.1 → NV-3.3.3).
   Màn hình: software, licenses, licenses/compliance, licenses/:id, vulns, vulns/:id, eol, compliance, ssl. */
(function () {
  "use strict";
  const D = M.data;
  const e = M.esc;

  /* ===================== Ngày (hôm nay 27/11/2026) ===================== */
  const TODAY = new Date(2026, 10, 27);
  const nowText = "27/11/2026 14:15";
  const parseD = (s) => { const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(s || ""); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const daysTo = (s) => { const d = parseD(s); return d ? Math.round((d - TODAY) / 864e5) : null; };
  const validDate = (s) => { const d = parseD(s); return !!d && /^\d{2}\/\d{2}\/\d{4}$/.test(String(s).trim()) && d.getDate() === +s.slice(0, 2); };
  const dueText = (days) => days == null ? "Vĩnh viễn" : days < 0 ? `Quá ${-days} ngày` : days === 0 ? "Hôm nay" : `Còn ${days} ngày`;
  const dueTone = (days, warn) => days == null ? "mute" : days < 0 ? "bad" : days <= (warn || 90) ? "warn" : "ok";

  /* ===================== Dữ liệu mẫu ===================== */
  /* NV-3.1.1, NV-3.1.5: phần mềm chuẩn hóa. policy: allowed | banned | unclassified */
  D.software = [
    { id: "sw1", name: "Microsoft 365 Apps", publisher: "Microsoft", versions: ["16.0.17928", "16.0.17830"], installs: 18, aliases: ["Microsoft 365 Apps for enterprise - vi-vn", "Microsoft 365 Apps for enterprise - en-us"], policy: "allowed", licenseId: "L-03" },
    { id: "sw2", name: "Google Chrome", publisher: "Google", versions: ["131.0.6778.86", "131.0.6778.108"], installs: 21, aliases: ["Google Chrome"], policy: "allowed" },
    { id: "sw3", name: "Zoom Workplace", publisher: "Zoom Video Communications", versions: ["6.2.11"], installs: 9, aliases: ["Zoom Workplace"], policy: "allowed", licenseId: "L-10" },
    { id: "sw4", name: "Adobe Acrobat Reader", publisher: "Adobe", versions: ["24.004.20220"], installs: 19, aliases: ["Adobe Acrobat Reader", "Adobe Acrobat Reader DC - Vietnamese"], policy: "allowed" },
    { id: "sw5", name: "Adobe Acrobat Pro", publisher: "Adobe", versions: ["24.004.20220"], installs: 12, aliases: ["Adobe Acrobat (64-bit)", "Adobe Acrobat DC Pro"], policy: "allowed", licenseId: "L-05" },
    { id: "sw6", name: "Kaspersky Endpoint Security", publisher: "AO Kaspersky Lab", versions: ["12.6.0.438"], installs: 52, aliases: ["Kaspersky Endpoint Security for Windows"], policy: "allowed", licenseId: "L-02" },
    { id: "sw7", name: "MISA SME", publisher: "MISA", versions: ["R12"], installs: 2, aliases: ["MISA SME 2025"], policy: "allowed", licenseId: "L-04" },
    { id: "sw8", name: "Java 8", publisher: "Oracle", versions: ["8.0.3810"], installs: 9, aliases: ["Java 8 Update 381"], policy: "allowed", note: "Chỉ dùng cho máy Kế toán (MISA cần)" },
    { id: "sw9", name: "TeamViewer", publisher: "TeamViewer", versions: ["15.59.3"], installs: 2, aliases: ["TeamViewer"], policy: "allowed", licenseId: "L-07" },
    { id: "sw10", name: "AnyDesk", publisher: "AnyDesk Software", versions: ["8.1.0"], installs: 1, aliases: ["AnyDesk"], policy: "banned", note: "Công cụ truy cập từ xa chưa được duyệt" },
    { id: "sw11", name: "UltraViewer", publisher: "DucFabulous", versions: ["6.6"], installs: 1, aliases: ["UltraViewer"], policy: "banned", note: "Công cụ truy cập từ xa chưa được duyệt" },
    { id: "sw12", name: "uTorrent", publisher: "BitTorrent", versions: ["3.6.0"], installs: 1, aliases: ["uTorrent"], policy: "banned", note: "Phần mềm chia sẻ ngang hàng" },
    { id: "sw13", name: "7-Zip", publisher: "Igor Pavlov", versions: ["23.01"], installs: 20, aliases: ["7-Zip 23.01 (x64)"], policy: "allowed" },
    { id: "sw14", name: "Wireshark", publisher: "Wireshark Foundation", versions: ["4.2.2"], installs: 1, aliases: ["wireshark"], policy: "unclassified" },
    { id: "sw15", name: "Visual Studio Code", publisher: "Microsoft", versions: ["1.95.3"], installs: 3, aliases: ["code", "Microsoft Visual Studio Code"], policy: "allowed" },
    { id: "sw16", name: "OpenSSH Server", publisher: "OpenBSD", versions: ["8.9p1", "9.6p1"], installs: 2, aliases: ["openssh-server"], policy: "allowed" },
    { id: "sw17", name: "Docker Engine", publisher: "Docker", versions: ["27.3.1"], installs: 2, aliases: ["docker-ce"], policy: "allowed" },
    { id: "sw18", name: "AutoCAD LT", publisher: "Autodesk", versions: ["2025.1"], installs: 1, aliases: ["AutoCAD LT 2025 - English"], policy: "allowed", licenseId: "L-06" },
  ];
  /* Tên quét được chưa gộp vào phần mềm chuẩn nào (nằm trong danh sách chờ xem xét) */
  D.rawSoftware = [
    { id: "rw1", raw: "Microsoft Office 365 ProPlus - en-us", publisher: "Microsoft Corporation", count: 3, first: "26/11/2026", suggest: "sw1" },
    { id: "rw2", raw: "Zoom", publisher: "Zoom Video Communications, Inc.", count: 2, first: "25/11/2026", suggest: "sw3" },
    { id: "rw3", raw: "Microsoft Visual Studio Code (User)", publisher: "Microsoft Corporation", count: 1, first: "24/11/2026", suggest: "sw15" },
    { id: "rw4", raw: "Notepad++ (64-bit x64)", publisher: "Notepad++ Team", count: 5, first: "20/11/2026", suggest: null },
    { id: "rw5", raw: "WinRAR 7.01 (64-bit)", publisher: "win.rar GmbH", count: 4, first: "20/11/2026", suggest: null },
    { id: "rw6", raw: "Zalo PC", publisher: "VNG Corporation", count: 11, first: "18/11/2026", suggest: null },
    { id: "rw7", raw: "CCleaner", publisher: "Piriform", count: 2, first: "16/11/2026", suggest: null },
  ];
  D.mergeRules = [
    ["Microsoft 365 Apps for enterprise - vi-vn", "Microsoft 365 Apps", "Lê Hoàng Nam", "12/11/2026"],
    ["Microsoft 365 Apps for enterprise - en-us", "Microsoft 365 Apps", "Lê Hoàng Nam", "12/11/2026"],
    ["Adobe Acrobat (64-bit)", "Adobe Acrobat Pro", "Lê Hoàng Nam", "13/11/2026"],
    ["openssh-server", "OpenSSH Server", "Lê Hoàng Nam", "14/11/2026"],
  ];
  D.swViolations = [
    { assetId: "a20", sw: "uTorrent", version: "3.6.0", found: "26/11/2026 09:31" },
    { assetId: "a1", sw: "AnyDesk", version: "8.1.0", found: "21/11/2026 14:05" },
    { assetId: "a4", sw: "UltraViewer", version: "6.6", found: "18/11/2026 12:40" },
  ];

  /* NV-3.1.2, NV-3.1.3, NV-3.1.6: kho bản quyền.
     type: device | user | volume | subscription; countBy: device | user (cách đếm khi đối chiếu) */
  const userSeats = (ids, at) => ids.map((id) => ({ employeeId: id, at }));
  D.licenses = [
    { id: "L-01", software: "Windows 11 Pro", swId: null, type: "volume", countBy: "device", seats: 22, used: 22, expires: null, vendorId: "v5", cost: 99000000, key: "Q7M2K-8HD4P-TW93X-6RJ2B-K4NVC",
      batches: [["PO-2025-031", "12/03/2025", 12, 54000000], ["PO-2025-077", "28/09/2025", 10, 45000000]], renewals: [],
      assignments: [{ assetId: "a1", at: "14/03/2025" }, { assetId: "a2", at: "02/10/2025" }, { assetId: "a4", at: "15/04/2024" }, { assetId: "a17", at: "14/03/2025" }, { assetId: "a20", at: "20/05/2026" }, { assetId: "a22", at: "02/10/2025" }] },
    { id: "L-02", software: "Kaspersky Endpoint Security for Business", swId: "sw6", type: "device", countBy: "device", seats: 60, used: 52, expires: "31/12/2026", vendorId: "v5", cost: 54000000, key: "KES-4F2A-91BC-77D0-3E5F",
      batches: [["PO-2026-002", "02/01/2026", 60, 54000000]], renewals: [["02/01/2026", "01/01/2026", "31/12/2026", 54000000, "Phạm Thu Hà"]],
      assignments: [{ assetId: "a1", at: "05/01/2026" }, { assetId: "a2", at: "05/01/2026" }, { assetId: "a4", at: "05/01/2026" }, { assetId: "a5", at: "05/01/2026" }, { assetId: "a17", at: "05/01/2026" }, { assetId: "a20", at: "20/05/2026" }] },
    { id: "L-03", software: "Microsoft 365 Business Standard", swId: "sw1", type: "user", countBy: "user", seats: 20, used: 18, expires: "15/03/2027", vendorId: "v5", cost: 63000000, key: "Tenant anphat.onmicrosoft.com - hợp đồng MCA 7731-2290-4418",
      batches: [["PO-2026-012", "15/03/2026", 15, 47250000], ["PO-2026-039", "02/09/2026", 5, 15750000]],
      renewals: [["15/03/2026", "15/03/2026", "15/03/2027", 47250000, "Phạm Thu Hà"], ["14/03/2025", "15/03/2025", "15/03/2026", 44100000, "Phạm Thu Hà"]],
      assignments: userSeats(["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13", "e15", "e16", "e17", "e18", "e19"], "15/03/2026") },
    { id: "L-04", software: "MISA SME 2025", swId: "sw7", type: "device", countBy: "device", seats: 3, used: 2, expires: "30/06/2027", vendorId: "v5", cost: 12950000, key: "MISA-SME-25-88K2-QW71",
      batches: [["PO-2025-044", "30/06/2025", 3, 12950000]], renewals: [["30/06/2026", "01/07/2026", "30/06/2027", 6500000, "Phạm Thu Hà"]],
      assignments: [{ assetId: "a1", at: "01/07/2025" }, { assetId: "a4", at: "01/07/2025" }] },
    { id: "L-05", software: "Adobe Acrobat Pro", swId: "sw5", type: "subscription", countBy: "user", seats: 10, used: 10, expires: "20/02/2027", vendorId: "v5", cost: 54000000, key: "VIP-ANPHAT-0042-ACRO",
      batches: [["PO-2026-008", "20/02/2026", 10, 54000000]], renewals: [["20/02/2026", "20/02/2026", "20/02/2027", 54000000, "Phạm Thu Hà"]],
      assignments: userSeats(["e1", "e4", "e11", "e2", "e12", "e5", "e3", "e9", "e17", "e20"], "20/02/2026") },
    { id: "L-06", software: "AutoCAD LT 2025", swId: "sw18", type: "subscription", countBy: "user", seats: 3, used: 1, expires: "08/01/2027", vendorId: "v5", cost: 37500000, key: "AUTODESK-561-88231940",
      batches: [["PO-2026-001", "08/01/2026", 3, 37500000]], renewals: [], assignments: userSeats(["e3"], "10/01/2026") },
    { id: "L-07", software: "TeamViewer Business", swId: "sw9", type: "subscription", countBy: "device", seats: 1, used: 1, expires: "10/11/2026", vendorId: "v5", cost: 18900000, key: "TV-BUS-7Q2M-5501",
      batches: [["PO-2025-070", "10/11/2025", 1, 18900000]], renewals: [], assignments: [{ assetId: "a2", at: "12/11/2025" }] },
    { id: "L-08", software: "Windows Server 2022 Standard (16 lõi)", swId: null, type: "device", countBy: "device", seats: 2, used: 2, expires: null, vendorId: "v5", cost: 42000000, key: "WS22-STD-9VXM2-K8Q4T",
      batches: [["PO-2024-002", "18/01/2024", 2, 42000000]], renewals: [], assignments: [{ assetId: "a6", at: "20/01/2024" }, { assetId: "a5", at: "20/01/2024" }] },
    { id: "L-09", software: "VMware vSphere Standard (theo CPU)", swId: null, type: "device", countBy: "device", seats: 2, used: 2, expires: "18/01/2027", vendorId: "v3", cost: 98000000, key: "VSPHERE-STD-2CPU-5H0K1",
      batches: [["PO-2024-002", "18/01/2024", 2, 98000000]], renewals: [["18/01/2026", "19/01/2026", "18/01/2027", 32000000, "Trần Minh Quân"]], assignments: [{ assetId: "a6", at: "20/01/2024" }] },
    { id: "L-10", software: "Zoom Workplace Business", swId: "sw3", type: "subscription", countBy: "user", seats: 15, used: 9, expires: "01/04/2027", vendorId: "v5", cost: 49500000, key: "ZOOM-ACC-882-410-7731",
      batches: [["PO-2026-015", "01/04/2026", 15, 49500000]], renewals: [], assignments: userSeats(["e5", "e7", "e8", "e12", "e13", "e3", "e9", "e2", "e20"], "01/04/2026") },
  ];
  D.licKeyLog = [
    { at: "20/11/2026 10:02", who: "Phạm Thu Hà", lic: "L-03", ip: "10.10.1.30" },
    { at: "02/09/2026 15:44", who: "Phạm Thu Hà", lic: "L-03", ip: "10.10.1.30" },
    { at: "12/08/2026 09:10", who: "Trần Minh Quân", lic: "L-01", ip: "10.10.2.11" },
  ];
  const LIC_TYPE = { device: "Theo thiết bị", user: "Theo người dùng", volume: "Volume", subscription: "Thuê bao" };

  /* NV-3.1.4: kết quả đối chiếu (chạy mỗi ngày 06:00) */
  D.licCompliance = [
    { lic: "L-05", name: "Adobe Acrobat Pro", countBy: "user", installs: 12, assignedNotInstalled: 0, since: "26/11/2026 09:00" },
    { lic: "L-07", name: "TeamViewer Business", countBy: "device", installs: 2, assignedNotInstalled: 0, since: "11/11/2026 06:00" },
    { lic: "L-03", name: "Microsoft 365 Business Standard", countBy: "user", installs: 18, assignedNotInstalled: 1 },
    { lic: "L-02", name: "Kaspersky Endpoint Security for Business", countBy: "device", installs: 52, assignedNotInstalled: 0 },
    { lic: "L-04", name: "MISA SME 2025", countBy: "device", installs: 2, assignedNotInstalled: 0 },
    { lic: "L-06", name: "AutoCAD LT 2025", countBy: "user", installs: 1, assignedNotInstalled: 0 },
    { lic: "L-10", name: "Zoom Workplace Business", countBy: "user", installs: 9, assignedNotInstalled: 2 },
    { lic: "L-01", name: "Windows 11 Pro", countBy: "device", installs: 22, assignedNotInstalled: 0 },
    { lic: "L-08", name: "Windows Server 2022 Standard", countBy: "device", installs: 2, assignedNotInstalled: 0 },
    { lic: "L-09", name: "VMware vSphere Standard", countBy: "device", installs: 2, assignedNotInstalled: 0 },
  ];

  /* NV-3.2.x: lỗ hổng. status: new | working | patched | accepted | false_positive */
  D.nvdSync = { last: "27/11/2026 06:00", total: 241882, added: 137, history: [
    ["27/11/2026 06:00", "ok", "Tải 137 CVE mới, cập nhật 412 CVE"],
    ["26/11/2026 06:00", "error", "Hết thời gian kết nối nvd.nist.gov sau 60 giây. Dữ liệu lỗ hổng cũ giữ nguyên; đã báo Quản trị hạ tầng."],
    ["25/11/2026 06:00", "ok", "Tải 96 CVE mới, cập nhật 288 CVE"],
    ["24/11/2026 06:00", "ok", "Tải 104 CVE mới, cập nhật 301 CVE"],
  ] };
  D.cves = [
    { id: "CVE-2026-21410", severity: "Critical", cvss: 9.8, product: "OpenSSH", affected: "< 9.9p2", title: "Thực thi mã từ xa trước xác thực trong sshd", published: "25/11/2026", status: "working", assetIds: ["a5", "a24", "a4"],
      perAsset: { a5: ["working", "8.9p1-3ubuntu0.10", "Đã lập CHG-031, chờ cửa sổ bảo trì"], a24: ["new", "9.6p1-3ubuntu13.5", ""], a4: ["working", "OpenSSH for Windows 8.1p1", "Gỡ thành phần OpenSSH Server tùy chọn"] } },
    { id: "CVE-2026-12890", severity: "Critical", cvss: 9.6, product: "FortiOS", affected: "7.0.0 đến 7.0.15", title: "Vượt qua xác thực SSL-VPN", published: "12/11/2026", status: "working", assetIds: ["a8"],
      perAsset: { a8: ["working", "FortiOS 7.0.14", "Đã tắt SSL-VPN tạm thời, chờ nâng firmware"] } },
    { id: "CVE-2026-20871", severity: "High", cvss: 8.8, product: "Google Chrome", affected: "< 131.0.6778.108", title: "Lỗi use-after-free trong V8", published: "20/11/2026", status: "new", assetIds: ["a1", "a2", "a4", "a17", "a20"] },
    { id: "CVE-2026-19422", severity: "High", cvss: 7.8, product: "Microsoft 365 Apps", affected: "< 16.0.17928.20216", title: "Thực thi mã khi mở tệp Excel độc hại", published: "11/11/2026", status: "working", assetIds: ["a1", "a2", "a4", "a17", "a20"] },
    { id: "CVE-2026-17733", severity: "High", cvss: 7.5, product: "nginx", affected: "1.18.0 đến 1.25.2", title: "Từ chối dịch vụ qua HTTP/2", published: "05/11/2026", status: "new", assetIds: ["a5"] },
    { id: "CVE-2026-11005", severity: "High", cvss: 7.8, product: "Windows 10 22H2", affected: "Bản dựng < 19045.5247", title: "Leo thang đặc quyền trong nhân Windows", published: "12/11/2026", status: "new", assetIds: ["a4"] },
    { id: "CVE-2026-15108", severity: "High", cvss: 7.3, product: "Zoom Workplace (Windows)", affected: "< 6.2.12", title: "Leo thang đặc quyền qua trình cập nhật", published: "14/10/2026", status: "patched", assetIds: ["a1", "a2", "a17"] },
    { id: "CVE-2026-18004", severity: "Medium", cvss: 5.9, product: "Java 8", affected: "8u381 trở xuống", title: "Lỗi trong thành phần JAXP", published: "21/10/2026", status: "accepted", assetIds: ["a1", "a4"],
      perAsset: { a1: ["accepted", "8.0.3810", "MISA SME cần Java 8; máy không mở dịch vụ ra ngoài. Duyệt: Trần Minh Quân 22/10/2026"], a4: ["accepted", "8.0.3810", "Như trên"] } },
    { id: "CVE-2026-16520", severity: "Medium", cvss: 5.3, product: "OpenSSL", affected: "3.0.0 đến 3.0.14", title: "Đọc ngoài vùng nhớ khi xử lý chứng chỉ X.509", published: "30/10/2026", status: "false_positive", assetIds: ["a5"],
      perAsset: { a5: ["false_positive", "3.0.2-0ubuntu1.18", "Ubuntu đã vá ngược (backport) nhưng giữ số phiên bản 3.0.2"] } },
    { id: "CVE-2026-14002", severity: "Medium", cvss: 6.5, product: "7-Zip", affected: "< 24.07", title: "Vượt qua Mark-of-the-Web khi giải nén", published: "02/10/2026", status: "new", assetIds: ["a1", "a2", "a4", "a17", "a20"] },
    { id: "CVE-2026-10450", severity: "Low", cvss: 3.6, product: "Docker Engine", affected: "< 27.3.2", title: "Lộ thông tin qua nhật ký build", published: "18/09/2026", status: "new", assetIds: ["a5", "a24"] },
    { id: "CVE-2026-09321", severity: "Low", cvss: 3.1, product: "Cisco IOS XE", affected: "17.6.x", title: "Lộ thông tin qua SNMP khi dùng community mặc định", published: "04/09/2026", status: "working", assetIds: ["a7"] },
  ];
  const SEV = { Critical: ["bad", true], High: ["bad", false], Medium: ["warn", false], Low: ["mute", false] };
  const SEV_ORDER = ["Critical", "High", "Medium", "Low"];
  const VST = { new: ["Mới", "info"], working: ["Đang xử lý", "warn"], patched: ["Đã vá", "ok"], accepted: ["Chấp nhận rủi ro", "mute"], false_positive: ["Báo nhầm", "mute"] };
  const sevPill = (s) => M.pill(s, SEV[s][0], SEV[s][1]);
  const vst = (k) => M.pill(VST[k][0], VST[k][1]);

  /* NV-3.3.1: ngày hết hỗ trợ */
  D.eol = [
    { id: "eo1", product: "Windows 10 22H2", kind: "Hệ điều hành", date: "14/10/2025", source: "Nhập tay", assetIds: ["a4"] },
    { id: "eo2", product: "Windows 11 Pro 23H2", kind: "Hệ điều hành", date: "11/11/2025", source: "Nhập tay", assetIds: ["a1", "a2"] },
    { id: "eo3", product: "Windows 11 Pro 22H2", kind: "Hệ điều hành", date: "08/10/2024", source: "Nhập tay", assetIds: ["a17"] },
    { id: "eo4", product: "VMware ESXi 7.0", kind: "Ảo hóa", date: "02/04/2025", source: "Nhập tay", assetIds: ["a6"] },
    { id: "eo5", product: "PostgreSQL 14", kind: "Phần mềm máy chủ", date: "12/11/2026", source: "Nhập tay", assetIds: ["a5"] },
    { id: "eo6", product: "Java 8 (bản cập nhật công cộng)", kind: "Phần mềm", date: "31/12/2026", source: "Nhập tay", assetIds: ["a1", "a4"] },
    { id: "eo7", product: "HP LaserJet Pro M404dn (ngừng cấp linh kiện)", kind: "Thiết bị", date: "31/01/2027", source: "Nhập tay", assetIds: ["a9"] },
    { id: "eo8", product: "Cisco Catalyst 9200-24P (ngừng bán)", kind: "Thiết bị mạng", date: "30/04/2027", source: "Nhập tay", assetIds: ["a7"] },
    { id: "eo9", product: "Ubuntu 22.04 LTS (hỗ trợ tiêu chuẩn)", kind: "Hệ điều hành", date: "01/06/2027", source: "Nhập tay", assetIds: ["a5"] },
    { id: "eo10", product: "Windows 11 Pro 24H2", kind: "Hệ điều hành", date: "12/10/2027", source: "Nhập tay", assetIds: ["a20"] },
  ];

  /* NV-3.3.2: tuân thủ bảo mật máy trạm. pass | fail | unknown | na */
  D.compliancePolicies = [
    { name: "Máy trạm Windows", applies: "Laptop và máy để bàn chạy Windows", av: true, enc: true, adm: true, allowed: "ANPHAT\\IT-Admins, Administrator (đã tắt)" },
    { name: "Laptop macOS / Linux", applies: "Laptop chạy macOS hoặc Linux", av: true, enc: true, adm: true, allowed: "Nhóm IT, tài khoản người giữ máy (Linux: nhóm sudo)" },
    { name: "Máy chủ", applies: "Máy chủ vật lý và máy ảo", av: true, enc: false, adm: true, allowed: "ANPHAT\\Server-Admins, root" },
  ];
  D.compliance = [
    { assetId: "a1", policy: "Máy trạm Windows", av: ["pass", "Kaspersky 12.6, mẫu nhận diện 27/11/2026"], enc: ["pass", "BitLocker bật (C:)"], adm: ["fail", "Ngoài danh sách: KT-BINH-LT\\binh.local"] },
    { assetId: "a2", policy: "Máy trạm Windows", av: ["pass", "Kaspersky 12.6, mẫu nhận diện 27/11/2026"], enc: ["pass", "BitLocker bật (C:)"], adm: ["pass", ""] },
    { assetId: "a4", policy: "Máy trạm Windows", av: ["pass", "Kaspersky 12.6, mẫu nhận diện 27/11/2026"], enc: ["fail", "BitLocker đang tắt"], adm: ["pass", ""] },
    { assetId: "a17", policy: "Máy trạm Windows", av: ["pass", "Kaspersky 12.6, mẫu nhận diện 27/11/2026"], enc: ["pass", "BitLocker bật (C:)"], adm: ["pass", ""] },
    { assetId: "a20", policy: "Máy trạm Windows", av: ["fail", "Mẫu nhận diện cũ 19 ngày (08/11/2026)"], enc: ["pass", "BitLocker bật (C:)"], adm: ["fail", "Ngoài danh sách: HCM-KHOA-LT\\khoa.admin"] },
    { assetId: "a24", policy: "Laptop macOS / Linux", av: ["unknown", "Agent chưa thu hạng mục này trên Linux"], enc: ["pass", "LUKS trên phân vùng gốc"], adm: ["pass", "Nhóm sudo: huy"] },
    { assetId: "a13", policy: "Laptop macOS / Linux", av: ["unknown", "Chưa có agent"], enc: ["unknown", "Chưa có agent"], adm: ["unknown", "Chưa có agent"] },
    { assetId: "a22", policy: "Máy trạm Windows", av: ["unknown", "Chưa có dữ liệu"], enc: ["unknown", "Chưa có dữ liệu"], adm: ["unknown", "Chưa có dữ liệu"] },
    { assetId: "a18", policy: "Máy trạm Windows", av: ["unknown", "Chưa có dữ liệu"], enc: ["unknown", "Chưa có dữ liệu"], adm: ["unknown", "Chưa có dữ liệu"] },
    { assetId: "a5", policy: "Máy chủ", av: ["pass", "ClamAV, mẫu 27/11/2026"], enc: ["na", "Không bắt buộc với máy chủ"], adm: ["pass", ""] },
  ];
  const CST = { pass: ["Đạt", "ok"], fail: ["Không đạt", "bad"], unknown: ["Chưa rõ", "mute"], na: ["Không áp dụng", "mute"] };
  const machineResult = (c) => { const v = [c.av[0], c.enc[0], c.adm[0]]; return v.includes("fail") ? "fail" : v.includes("unknown") ? "unknown" : "pass"; };

  /* NV-3.3.3: chứng chỉ SSL. state: ok | warn | expired | error */
  D.ssl = [
    { host: "vpn.anphat.vn:10443", issuer: "GlobalSign GCC R6 AlphaSSL CA 2025", expires: "20/11/2026", daysLeft: -7, state: "expired", source: "Nhập tay", checked: "27/11/2026 06:00" },
    { host: "erp.anphat.vn", issuer: "Let's Encrypt R11", expires: "15/12/2026", daysLeft: 18, state: "warn", source: "Quét mạng R-0411", checked: "27/11/2026 06:00" },
    { host: "itam.anphat.vn", issuer: "Let's Encrypt R10", expires: "14/02/2027", daysLeft: 79, state: "ok", source: "Nhập tay", checked: "27/11/2026 06:00" },
    { host: "mail.anphat.vn", issuer: "Sectigo RSA Domain Validation", expires: "03/03/2027", daysLeft: 96, state: "ok", source: "Nhập tay", checked: "27/11/2026 06:00" },
    { host: "crm.anphat.vn", issuer: "Sectigo RSA Domain Validation", expires: "19/12/2026", daysLeft: 22, state: "warn", source: "Nhập tay", checked: "27/11/2026 06:00" },
    { host: "intranet.anphat.local", issuer: "AnPhat Internal CA", expires: "01/06/2028", daysLeft: 552, state: "ok", source: "Quét mạng R-0412", checked: "27/11/2026 06:00" },
    { host: "vc01.anphat.local:443", issuer: "", expires: "", daysLeft: null, state: "error", source: "Quét mạng R-0411", checked: "27/11/2026 06:00", error: "Không kết nối được: hết thời gian chờ sau 10 giây. Chưa kiểm tra được ngày hết hạn." },
    { host: "printer-301.anphat.local", issuer: "HP Self-signed", expires: "04/06/2034", daysLeft: 2746, state: "ok", source: "Quét mạng R-0412", checked: "27/11/2026 06:00" },
  ];
  const SSL_ST = { ok: ["Còn hạn", "ok"], warn: ["Sắp hết hạn", "warn"], expired: ["Đã hết hạn", "bad"], error: ["Lỗi kết nối", "mute"] };

  /* ===================== Tiện ích ===================== */
  const assetCell = (id) => { const a = M.asset(id); return a ? `${M.tape(a.tag, a.id)}<div class="cell-sub">${e((a.tech && a.tech.hostname) || a.hostname || a.name)}</div>` : '<span class="muted">—</span>'; };
  const holderOfAsset = (id) => { const a = M.asset(id); return a ? M.holderHtml(a) : ""; };
  const licUsed = (l) => l.used;
  const licValid = (l) => (l.expires && daysTo(l.expires) < 0 ? 0 : l.seats);
  const seatTarget = (s) => s.employeeId ? M.person(M.emp(s.employeeId).name, "#/employees/" + s.employeeId, M.emp(s.employeeId).status !== "active" ? M.EMP_STATUS[M.emp(s.employeeId).status][0] : "") : assetCell(s.assetId);
  const POL = { allowed: ["Được phép", "ok"], banned: ["Bị cấm", "bad"], unclassified: ["Chưa phân loại", "mute"] };

  /* ===================== Danh mục phần mềm (NV-3.1.1, NV-3.1.5) ===================== */
  M.defModal("sw-merge", (id) => {
    const r = M.find("rawSoftware", id);
    return {
      title: "Gộp tên vào phần mềm chuẩn",
      body: `<p>Tên quét được: <b>${e(r.raw)}</b> - ${e(r.publisher)} - ${e(r.count)} bản cài</p>
        ${M.field("Gộp vào phần mềm chuẩn", M.select("target", [["__new", "+ Tạo phần mềm chuẩn mới từ tên này"]].concat(D.software.map((s) => [s.id, `${s.name} - ${s.publisher}`])), r.suggest || "__new"), { req: true })}
        ${M.field("Tên chuẩn (khi tạo mới)", M.input("newName", { value: r.raw.replace(/\s*\((64|32)-bit.*\)$/i, "").replace(/\s+\d[\d.]*\s*$/, "") }))}`,
      submit: "Gộp",
      onSubmit(d, form) {
        let target;
        if (d.target === "__new") {
          const name = (d.newName || "").trim();
          if (!name) return M.invalid(form, "newName", "Nhập tên phần mềm chuẩn.");
          target = { id: "sw" + (D.software.length + 1), name, publisher: r.publisher, versions: [], installs: 0, aliases: [], policy: "unclassified" };
          D.software.push(target);
        } else target = M.find("software", d.target);
        target.installs += r.count;
        target.aliases.push(r.raw);
        D.mergeRules.unshift([r.raw, target.name, M.me().user, "27/11/2026"]);
        D.rawSoftware = D.rawSoftware.filter((x) => x.id !== r.id);
        return `Đã gộp "${r.raw}" vào ${target.name}; số bản cài của phần mềm chuẩn là ${target.installs}.`;
      },
    };
  });
  M.action("sw-policy", (el, val) => {
    const s = M.find("software", el.dataset.id);
    s.policy = val;
    setTimeout(M.refresh, 0);
    return `Đã đánh dấu ${s.name} là "${POL[val][0]}". Danh sách vi phạm được tính lại sau lần quét kế tiếp.`;
  });

  M.screen("software", {
    nav: "software", title: "Danh mục phần mềm", codes: ["NV-3.1.1", "NV-3.1.5"],
    render() {
      const can = M.can("software.manage");
      const policyCell = (s) => can
        ? M.select("pol-" + s.id, Object.entries(POL).map(([k, v]) => [k, v[0]]), s.policy, { attrs: `data-change="sw-policy" data-id="${e(s.id)}" aria-label="Phân loại ${e(s.name)}" style="width:auto;height:30px;font-size:12.5px"` })
        : M.pill(POL[s.policy][0], POL[s.policy][1]);
      const swTable = (id, rows) => M.table({
        id,
        cols: [
          { h: "Phần mềm chuẩn", r: (s) => `<div class="cell-name">${e(s.name)}</div><div class="cell-sub">${e(s.publisher)}</div>` },
          { h: "Phiên bản", r: (s) => `<span class="mono small">${e(s.versions.join(", ") || "—")}</span>`, cls: "wrap" },
          { h: "Bản cài", r: (s) => `<span class="mono">${e(s.installs)}</span>`, cls: "right" },
          { h: "Bản quyền", r: (s) => s.licenseId ? `<a class="mono" href="#/licenses/${e(s.licenseId)}">${e(s.licenseId)}</a>` : '<span class="muted">—</span>' },
          { h: "Phân loại", r: policyCell },
        ],
        rows,
      });
      const uncls = D.software.filter((s) => s.policy === "unclassified");
      return M.page({
        title: "Danh mục phần mềm chuẩn hóa",
        sub: "Gộp các tên máy báo về thành một phần mềm chuẩn.",
        codes: ["NV-3.1.1", "NV-3.1.5"],
        body: `${M.tabs("software", [
          { key: "norm", label: "Đã chuẩn hóa", n: D.software.length, body: M.panel({ flush: true, body: M.toolbar(M.searchBox("sw-norm", "Lọc theo tên, nhà phát hành…")) + swTable("sw-norm", D.software) }) },
          { key: "raw", label: "Chưa chuẩn hóa", n: D.rawSoftware.length, body: `${M.panel({ title: "Tên quét được chưa thuộc phần mềm chuẩn nào", flush: true, body: M.table({
            id: "sw-raw",
            cols: [
              { h: "Tên máy báo về", r: (r) => `<div class="cell-name">${e(r.raw)}</div><div class="cell-sub">${e(r.publisher)}</div>` },
              { h: "Bản cài", r: (r) => `<span class="mono">${e(r.count)}</span>`, cls: "right" },
              { h: "Thấy lần đầu", r: (r) => `<span class="mono small">${e(r.first)}</span>` },
              { h: "Gợi ý", r: (r) => r.suggest ? `Gộp vào <b>${e(M.find("software", r.suggest).name)}</b>` : '<span class="muted">Phần mềm mới</span>', cls: "wrap" },
              { h: "", r: (r) => can ? M.btn("Gộp", { sm: true, modal: "sw-merge", arg: r.id }) : "" },
            ],
            rows: D.rawSoftware, empty: "Không còn tên nào chờ chuẩn hóa.",
          }) })}
          ${M.panel({ title: "Quy tắc gộp đã nhớ", flush: true, body: M.table({
            id: "sw-rules",
            cols: [{ h: "Tên máy báo về", r: (r) => `<span class="mono small">${e(r[0])}</span>` }, { h: "Thuộc phần mềm chuẩn", r: (r) => `<b>${e(r[1])}</b>` }, { h: "Người tạo", r: (r) => e(r[2]) }, { h: "Ngày", r: (r) => `<span class="mono small">${e(r[3])}</span>` }],
            rows: D.mergeRules,
          }) })}` },
          { key: "policy", label: "Được phép / bị cấm", body: `<div class="grid g3">
            ${["allowed", "banned", "unclassified"].map((p) => M.panel({ title: `${POL[p][0]} (${D.software.filter((s) => s.policy === p).length})`, body: `<div class="chips">${D.software.filter((s) => s.policy === p).map((s) => `<span class="pill t-${POL[p][1]}">${e(s.name)}</span>`).join("") || '<span class="muted">Không có</span>'}</div>` })).join("")}
            </div>
            ${uncls.length ? M.panel({ title: "Chờ xem xét", flush: true, body: swTable("sw-uncls", uncls) }) : ""}` },
          { key: "violations", label: "Máy vi phạm", n: D.swViolations.length, body: M.panel({ title: "Máy đang cài phần mềm bị cấm", flush: true, actions: M.btn("Xuất danh sách vi phạm", { sm: true, icon: "download", msg: "Đã xuất danh sách vi phạm (Excel)." }), body: M.table({
            id: "sw-viol",
            cols: [
              { h: "Máy", r: (v) => assetCell(v.assetId) },
              { h: "Người / nơi giữ", r: (v) => holderOfAsset(v.assetId) },
              { h: "Phần mềm bị cấm", r: (v) => `<span class="strong">${e(v.sw)}</span> <span class="mono small muted">${e(v.version)}</span>` },
              { h: "Phát hiện lúc", r: (v) => `<span class="mono small">${e(v.found)}</span>` },
              { h: "Xử lý", r: (v) => `<div class="row">${M.btn("Mở ticket", { sm: true, href: "#/tickets/new?asset=" + v.assetId, perm: "ticket.work" })}${M.btn("Gỡ bằng script", { sm: true, href: "#/scripts/S-04", perm: "script.run" })}</div>` },
            ],
            rows: D.swViolations, empty: "Không có máy nào cài phần mềm bị cấm.",
          }) }) },
        ])}`,
      });
    },
  });

  /* ===================== Kho bản quyền (NV-3.1.2, NV-3.1.6) ===================== */
  M.defModal("lic-add", () => ({
    title: "Thêm bản quyền", wide: true,
    body: `<div class="form-grid">
      ${M.field("Phần mềm", M.select("sw", D.software.map((s) => [s.id, s.name]), "", { blank: "Chọn phần mềm chuẩn" }), { req: true })}
      ${M.field("Loại bản quyền", M.select("type", Object.entries(LIC_TYPE), "", { blank: "Chọn loại" }), { req: true })}
      ${M.field("Số ghế", M.input("seats", { type: "number", attrs: 'min="1"' }), { req: true })}
      ${M.field("Khóa bản quyền", M.input("key", { ph: "XXXXX-XXXXX-…" }))}
      ${M.field("Ngày mua", M.input("bought", { ph: "dd/mm/yyyy" }))}
      ${M.field("Ngày hết hạn", M.input("expires", { ph: "dd/mm/yyyy, để trống nếu vĩnh viễn" }))}
      ${M.field("Nhà cung cấp", M.select("vendor", D.vendors.filter((v) => v.active).map((v) => [v.id, v.name]), "v5"))}
      ${M.field("Chi phí (₫)", M.input("cost", { type: "number" }))}
    </div>`,
    submit: "Thêm bản quyền",
    onSubmit(d, form) {
      if (!d.sw) return M.invalid(form, "sw", "Chọn phần mềm.");
      if (!d.type) return M.invalid(form, "type", "Chọn loại bản quyền.");
      if (!(+d.seats >= 1)) return M.invalid(form, "seats", "Nhập số ghế (ít nhất 1).");
      if (d.expires && !validDate(d.expires)) return M.invalid(form, "expires", "Ngày không hợp lệ. Nhập dạng dd/mm/yyyy.");
      const sw = M.find("software", d.sw);
      const existing = D.licenses.find((l) => l.swId === d.sw && l.type === d.type);
      if (existing) {
        existing.seats += +d.seats;
        existing.batches.push(["Nhập tay", d.bought || "27/11/2026", +d.seats, +d.cost || 0]);
        return `Đã thêm lô ${d.seats} ghế vào ${existing.id}; tổng số ghế là ${existing.seats}.`;
      }
      const id = "L-" + String(D.licenses.length + 1).padStart(2, "0");
      D.licenses.push({ id, software: sw.name, swId: sw.id, type: d.type, countBy: d.type === "device" || d.type === "volume" ? "device" : "user", seats: +d.seats, used: 0, expires: d.expires || null, vendorId: d.vendor, cost: +d.cost || 0, key: d.key || "", batches: [["Nhập tay", d.bought || "27/11/2026", +d.seats, +d.cost || 0]], renewals: [], assignments: [] });
      return `Đã thêm bản quyền ${id} - ${sw.name}`;
    },
  }));

  M.screen("licenses", {
    nav: "licenses", title: "Bản quyền", codes: ["NV-3.1.2", "NV-3.1.6"],
    render() {
      const finance = M.can("finance.view") || M.can("license.manage");
      const withDays = D.licenses.map((l) => ({ ...l, days: l.expires ? daysTo(l.expires) : null }));
      const soon = withDays.filter((l) => l.days != null && l.days >= 0 && l.days <= 90);
      const expired = withDays.filter((l) => l.days != null && l.days < 0);
      const cols = [
        { h: "Mã", r: (l) => `<span class="mono strong">${e(l.id)}</span>` },
        { h: "Phần mềm", r: (l) => `<div class="cell-name">${e(l.software)}</div><div class="cell-sub">${e(LIC_TYPE[l.type])}</div>` },
        { h: "Ghế đã dùng", r: (l) => `<div class="row" style="gap:8px;flex-wrap:nowrap"><span class="mono">${e(licUsed(l))}/${e(l.seats)}</span>${M.progress(licUsed(l), l.seats, licUsed(l) >= l.seats ? "warn" : "ok")}</div>` },
        { h: "Hết hạn", r: (l) => l.expires ? `<span class="mono small">${e(l.expires)}</span><div class="cell-sub">${M.pill(dueText(l.days), dueTone(l.days))}</div>` : '<span class="muted">Vĩnh viễn</span>' },
      ];
      if (finance) cols.push({ h: "Chi phí", r: (l) => `<span class="mono small">${e(M.money(l.cost))}</span>`, cls: "right" });
      const table = (id, rows) => M.table({ id, cols, rows, href: (l) => "#/licenses/" + l.id, empty: "Không có bản quyền nào." });
      const totalCost = D.licenses.reduce((s, l) => s + (l.cost || 0), 0);
      return M.page({
        title: "Kho bản quyền phần mềm",
        codes: ["NV-3.1.2", "NV-3.1.6"],
        actions: M.btn("Đối chiếu với thực tế cài đặt", { href: "#/licenses/compliance", icon: "scale" }) + M.btn("Thêm bản quyền", { primary: true, icon: "plus", modal: "lic-add", perm: "license.manage" }),
        body: `${M.stats([
          { label: "Ghế đã dùng / tổng", value: `${D.licenses.reduce((s, l) => s + l.used, 0)}/${D.licenses.reduce((s, l) => s + l.seats, 0)}`, tone: "ok" },
        ].concat(finance ? [{ label: "Tổng chi phí đang theo dõi", value: M.money(totalCost), tone: "accent" }] : []))}
        ${M.tabs("licenses", [
          { key: "all", label: "Tất cả", n: D.licenses.length, body: M.panel({ flush: true, body: M.toolbar(M.searchBox("lic-all", "Lọc theo mã, phần mềm…")) + table("lic-all", withDays) }) },
          { key: "soon", label: "Sắp hết hạn", n: soon.length, body: M.panel({ flush: true, body: table("lic-soon", soon.sort((a, b) => a.days - b.days)) }) },
          { key: "expired", label: "Đã hết hạn", n: expired.length, body: M.panel({ flush: true, body: table("lic-exp", expired) }) },
        ])}`,
      });
    },
  });

  /* ===================== Đối chiếu bản quyền (NV-3.1.4) ===================== */
  M.screen("licenses/compliance", {
    nav: "licenses/compliance", title: "Đối chiếu bản quyền", codes: ["NV-3.1.4"],
    render() {
      const rows = D.licCompliance.map((c) => {
        const l = M.find("licenses", c.lic);
        const valid = licValid(l);
        const diff = valid - c.installs;
        const perSeat = l.seats ? l.cost / l.seats : 0;
        return { ...c, l, valid, diff, verdict: diff < 0 ? "short" : diff > 0 ? "waste" : "ok", wasteCost: diff > 0 ? diff * perSeat : 0 };
      });
      const short = rows.filter((r) => r.verdict === "short");
      const waste = rows.filter((r) => r.verdict === "waste");
      const VERD = { short: (r) => M.pill(`Thiếu ${-r.diff}`, "bad", true), waste: (r) => M.pill(`Lãng phí ${r.diff}`, "warn"), ok: () => M.pill("Đủ", "ok") };
      const finance = M.can("finance.view") || M.can("license.manage");
      return M.page({
        title: "Đối chiếu bản quyền với thực tế cài đặt",
        codes: ["NV-3.1.4"],
        actions: M.btn("Chạy đối chiếu ngay", { icon: "refresh", msg: "Đã chạy đối chiếu lúc 14:15. Kết quả không đổi." }) + M.btn("Xuất báo cáo", { icon: "download", msg: "Đã xuất báo cáo tuân thủ bản quyền (Excel)." }),
        body: `${M.stats([
          { label: "Thiếu bản quyền", value: short.length, tone: "bad", sub: `${short.reduce((s, r) => s - r.diff, 0)} ghế thiếu` },
          { label: "Lãng phí", value: waste.length, tone: "warn", sub: `${waste.reduce((s, r) => s + r.diff, 0)} ghế thừa${finance ? " ≈ " + e(M.money(Math.round(waste.reduce((s, r) => s + r.wasteCost, 0)))) + "/năm" : ""}` },
          { label: "Đủ", value: rows.length - short.length - waste.length, tone: "ok" },
          { label: "Đối chiếu gần nhất", value: "06:00", tone: "info", sub: "27/11/2026" },
        ])}
        ${short.length ? M.note(short.map((r) => `<b>${e(r.name)}</b> thiếu ${-r.diff} ghế${r.l.expires && daysTo(r.l.expires) < 0 ? ` vì ${e(r.l.id)} đã hết hạn ${e(r.l.expires)}` : ""}.`).join(" "), "bad") : ""}
        ${M.panel({ title: "Kết quả theo phần mềm", flush: true, body: M.table({
          id: "lic-comp",
          cols: [
            { h: "Phần mềm", r: (r) => `<div class="cell-name">${e(r.name)}</div><div class="cell-sub"><a class="mono" href="#/licenses/${e(r.lic)}">${e(r.lic)}</a> - ${r.countBy === "user" ? "Đếm theo người" : "Đếm theo máy"}</div>` },
            { h: "Cài thực tế", r: (r) => `<span class="mono">${e(r.installs)}</span>`, cls: "right" },
            { h: "Ghế còn hiệu lực", r: (r) => `<span class="mono">${e(r.valid)}</span>${r.valid !== r.l.seats ? `<div class="cell-sub">${e(r.l.seats)} ghế đã hết hạn</div>` : ""}`, cls: "right" },
            { h: "Gán nhưng không cài", r: (r) => r.assignedNotInstalled ? `<span class="mono">${e(r.assignedNotInstalled)}</span>` : '<span class="muted">0</span>', cls: "right" },
            { h: "Kết luận", r: (r) => VERD[r.verdict](r) },
            { h: "Xử lý", r: (r) => r.verdict === "short" ? `<div class="row">${M.btn("Mua thêm", { sm: true, href: "#/purchases", perm: "license.manage" })}${M.btn("Gỡ khỏi máy", { sm: true, href: "#/scripts/S-04", perm: "script.run" })}</div>` : "", cls: "wrap" },
          ],
          rows: rows.sort((a, b) => a.diff - b.diff),
        }) })}
        ${M.anno("Nguồn số bản cài là danh sách phần mềm agent và quét mạng thu được (NV-1.4.1), sau khi chuẩn hóa tên (NV-3.1.1).")}`,
      });
    },
  });

  /* ===================== Chi tiết bản quyền (NV-3.1.2, NV-3.1.3, NV-3.1.6) ===================== */
  const revealed = new Set();
  M.action("lic-reveal", (el, id) => {
    if (!M.can("license.key")) return "Vai trò của bạn không xem được khóa đầy đủ.";
    revealed.add(id);
    D.licKeyLog.unshift({ at: nowText, who: M.me().user, lic: id, ip: "10.10.1.30" });
    M.refresh();
    return "Đã hiện khóa bản quyền. Lần xem này được ghi vào nhật ký kiểm toán.";
  });
  M.action("lic-hide", (el, id) => { revealed.delete(id); M.refresh(); });
  M.action("seat-revoke", (el, arg) => {
    const [id, idx] = arg.split("|");
    const l = M.find("licenses", id);
    const s = l.assignments[+idx];
    if (!s) return;
    const who = s.employeeId ? M.emp(s.employeeId).name : M.asset(s.assetId).tag;
    if (!window.confirm(`Thu hồi ghế ${l.software} của ${who}?`)) return;
    l.assignments.splice(+idx, 1);
    l.used = Math.max(0, l.used - 1);
    M.refresh();
    return `Đã thu hồi ghế của ${who}; còn ${l.seats - l.used} ghế trống.`;
  });

  M.defModal("seat-assign", (id) => {
    const l = M.find("licenses", id);
    const byUser = l.countBy === "user";
    const taken = new Set(l.assignments.map((s) => s.employeeId || s.assetId));
    const opts = byUser
      ? D.employees.filter((x) => x.status === "active" && !taken.has(x.id)).map((x) => [x.id, `${x.name} - ${x.code}`])
      : D.assets.filter((a) => a.status !== "archived" && !taken.has(a.id)).map((a) => [a.id, `${a.tag} - ${a.name}`]);
    return {
      title: `Gán ghế - ${l.software}`,
      body: `<p>Đang dùng <b class="mono">${e(l.used)}/${e(l.seats)}</b> ghế.</p>
        ${M.field(byUser ? "Nhân viên" : "Thiết bị", M.select("target", opts, "", { blank: byUser ? "Chọn nhân viên" : "Chọn thiết bị" }), { req: true })}`,
      submit: "Gán ghế",
      onSubmit(d, form) {
        if (l.used >= l.seats) return M.invalid(form, "target", `Đã hết ghế: ${l.used}/${l.seats} ghế đang dùng. Thu hồi một ghế hoặc thêm lô bản quyền trước.`);
        if (!d.target) return M.invalid(form, "target", byUser ? "Chọn nhân viên nhận ghế." : "Chọn thiết bị nhận ghế.");
        l.assignments.push(byUser ? { employeeId: d.target, at: "27/11/2026" } : { assetId: d.target, at: "27/11/2026" });
        l.used += 1;
        return `Đã gán ghế; đang dùng ${l.used}/${l.seats}.`;
      },
    };
  });

  M.defModal("lic-renew", (id) => {
    const l = M.find("licenses", id);
    return {
      title: `Ghi nhận gia hạn - ${l.software}`,
      body: `<div class="form-grid">
        ${M.field("Hết hạn hiện tại", M.input("cur", { value: l.expires || "Vĩnh viễn", ro: true }))}
        ${M.field("Ngày hết hạn mới", M.input("to", { ph: "dd/mm/yyyy" }), { req: true })}
        ${M.field("Chi phí gia hạn (₫)", M.input("cost", { type: "number" }), { req: true })}
        ${M.field("Số ghế sau gia hạn", M.input("seats", { type: "number", value: l.seats }))}
      </div>`,
      submit: "Lưu gia hạn",
      onSubmit(d, form) {
        if (!validDate(d.to)) return M.invalid(form, "to", "Ngày không hợp lệ. Nhập dạng dd/mm/yyyy.");
        if (l.expires && parseD(d.to) <= parseD(l.expires)) return M.invalid(form, "to", "Ngày hết hạn mới phải sau ngày hết hạn hiện tại.");
        if (!(+d.cost >= 0) || d.cost === "") return M.invalid(form, "cost", "Nhập chi phí gia hạn.");
        l.renewals.unshift(["27/11/2026", l.expires || "27/11/2026", d.to, +d.cost, M.me().user]);
        l.expires = d.to;
        if (+d.seats >= l.used) l.seats = +d.seats;
        return `Đã ghi nhận gia hạn ${l.id} tới ${d.to}.`;
      },
    };
  });

  M.screen("licenses/:id", {
    nav: "licenses", title: "Chi tiết bản quyền", codes: ["NV-3.1.2", "NV-3.1.3", "NV-3.1.6"],
    render(p) {
      const l = M.find("licenses", p.id);
      if (!l) return M.page({ title: "Không tìm thấy bản quyền", back: ["#/licenses", "Bản quyền"], body: M.empty(`Không có bản quyền ${p.id}.`) });
      const can = M.can("license.manage");
      const days = l.expires ? daysTo(l.expires) : null;
      const finance = M.can("finance.view") || M.can("license.manage");
      const vendor = M.vendor(l.vendorId);
      const keyShown = revealed.has(l.id) && M.can("license.key");
      const masked = l.key ? l.key.slice(0, 5) + "-•••••-•••••-•••••" : "—";
      const leaving = l.assignments.filter((s) => s.employeeId && M.emp(s.employeeId).status === "leaving");
      const totalBatch = l.batches.reduce((s, b) => s + b[2], 0);
      return M.page({
        title: `${e(l.software)}`,
        back: ["#/licenses", "Bản quyền"],
        codes: ["NV-3.1.2", "NV-3.1.3", "NV-3.1.6"],
        sub: `<span class="mono">${e(l.id)}</span> - ${e(LIC_TYPE[l.type])}`,
        actions: M.btn("Ghi nhận gia hạn", { icon: "refresh", modal: "lic-renew", arg: l.id, perm: "license.manage" }) + M.btn("Gán ghế", { primary: true, icon: "plus", modal: "seat-assign", arg: l.id, perm: "license.manage" }),
        body: `${days != null && days < 0
          ? M.note(`Bản quyền đã hết hạn ${e(l.expires)}, ghế không còn được tính khi đối chiếu.`, "bad")
          : leaving.length ? M.note(`${leaving.map((s) => `<b>${e(M.emp(s.employeeId).name)}</b> sẽ nghỉ việc ngày ${e(M.emp(s.employeeId).leaveDate)}`).join(", ")} và đang giữ ghế. Thu hồi ghế khi xử lý <a href="#/tickets/T-1047">ticket T-1047</a>.`, "warn") : ""}
        <div class="side-layout">
          <div class="stack">
            ${M.panel({ title: `Ghế đã gán (${l.used}/${l.seats})`, flush: true, body: M.toolbar(M.searchBox("lic-seats", "Lọc theo tên, mã…")) + M.table({
              id: "lic-seats",
              cols: [
                { h: l.countBy === "user" ? "Nhân viên" : "Thiết bị", r: (s) => seatTarget(s) },
                { h: "Gán ngày", r: (s) => `<span class="mono small">${e(s.at)}</span>` },
                { h: "", r: (s, i) => can ? M.btn("Thu hồi ghế", { sm: true, ghost: true, act: "seat-revoke", arg: l.id + "|" + i }) : "" },
              ],
              rows: l.assignments, empty: "Chưa gán ghế nào.",
            }), foot: `<span>${l.assignments.length < l.used ? `Hiển thị ${l.assignments.length} trong ${l.used} ghế đã gán` : `${l.seats - l.used} ghế trống`}</span>${l.used >= l.seats ? M.pill("Đã hết ghế", "warn") : ""}` })}
            ${M.panel({ title: `Các lô đã mua (tổng ${totalBatch} ghế)`, flush: true, body: M.table({
              id: "lic-batches",
              cols: [{ h: "Đơn mua", r: (b) => `<span class="mono">${e(b[0])}</span>` }, { h: "Ngày", r: (b) => `<span class="mono small">${e(b[1])}</span>` }, { h: "Số ghế", r: (b) => `<span class="mono">${e(b[2])}</span>`, cls: "right" }].concat(finance ? [{ h: "Chi phí", r: (b) => `<span class="mono small">${e(M.money(b[3]))}</span>`, cls: "right" }] : []),
              rows: l.batches,
            }) })}
            ${M.panel({ title: "Lịch sử gia hạn", flush: true, body: M.table({
              id: "lic-renewals",
              cols: [{ h: "Ngày ghi nhận", r: (r) => `<span class="mono small">${e(r[0])}</span>` }, { h: "Hiệu lực", r: (r) => `<span class="mono small">${e(r[1])} → ${e(r[2])}</span>` }].concat(finance ? [{ h: "Chi phí", r: (r) => `<span class="mono small">${e(M.money(r[3]))}</span>`, cls: "right" }] : []).concat([{ h: "Người ghi", r: (r) => e(r[4]) }]),
              rows: l.renewals, empty: "Chưa có lần gia hạn nào.",
            }) })}
          </div>
          <div class="stack">
            ${M.panel({ title: "Thông tin", body: M.kv([
              ["Cách đếm", l.countBy === "user" ? "Theo số người" : "Theo số máy"],
              ["Hết hạn", l.expires ? `${e(l.expires)} ${M.pill(dueText(days), dueTone(days))}` : "Vĩnh viễn"],
              ["Nhà cung cấp", vendor ? e(vendor.name) : ""],
              finance ? ["Chi phí", e(M.money(l.cost))] : null,
            ]) })}
            ${M.panel({ title: "Khóa bản quyền", body: `<div class="stack-sm">
              <div class="secret"><code>${e(keyShown ? l.key : masked)}</code>${M.can("license.key") ? (keyShown ? M.btn("Che", { sm: true, act: "lic-hide", arg: l.id }) : M.btn("Xem đầy đủ", { sm: true, icon: "eye", act: "lic-reveal", arg: l.id })) : ""}</div>
              ${M.can("license.key") ? "" : '<p class="small muted">Vai trò của bạn không xem được khóa đầy đủ.</p>'}</div>` })}
            ${M.can("audit.view") || M.can("license.key") ? M.panel({ title: "Lần xem khóa gần đây", body: `<ul class="log">${D.licKeyLog.filter((x) => x.lic === l.id).map((x) => `<li><time>${e(x.at)}</time><div><div class="log-title">${e(x.who)}</div><div class="log-meta">Từ IP ${e(x.ip)}</div></div></li>`).join("") || '<li><div class="muted">Chưa ai xem khóa này.</div></li>'}</ul>` }) : ""}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== Lỗ hổng bảo mật (NV-3.2.1, NV-3.2.2) ===================== */
  M.action("seg:sev", (v) => M.go("vulns" + (v === "all" ? "" : "?sev=" + v)));
  M.defModal("nvd-import", () => ({
    title: "Nạp dữ liệu CVE từ tệp",
    body: `${M.field("Tệp dữ liệu NVD đã tải sẵn", '<input type="file" name="file" accept=".json,.gz,.zip">', { req: true, hint: "JSON 2.0 của NVD, có thể nén .gz" })}`,
    submit: "Nạp dữ liệu",
    onSubmit() { D.nvdSync.history.unshift([nowText, "ok", "Nạp từ tệp nvdcve-2.0-modified.json.gz: 412 CVE"]); D.nvdSync.last = nowText; return "Đã nạp dữ liệu CVE từ tệp; kết quả đối chiếu được tính lại."; },
  }));

  M.screen("vulns", {
    nav: "vulns", title: "Lỗ hổng bảo mật", codes: ["NV-3.2.1", "NV-3.2.2"],
    render(p, q) {
      const sev = SEV_ORDER.includes(q.sev) ? q.sev : "all";
      const list = D.cves.filter((c) => sev === "all" || c.severity === sev).sort((a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity) || b.cvss - a.cvss);
      const open = D.cves.filter((c) => !["patched", "false_positive"].includes(c.status));
      /* Máy cần vá gấp: đếm lỗ hổng Critical/High còn mở trên từng máy */
      const score = {};
      open.forEach((c) => c.assetIds.forEach((id) => { score[id] = score[id] || { c: 0, h: 0 }; if (c.severity === "Critical") score[id].c++; else if (c.severity === "High") score[id].h++; }));
      const urgent = Object.entries(score).filter(([, s]) => s.c + s.h > 0).sort((a, b) => b[1].c - a[1].c || b[1].h - a[1].h).slice(0, 6);
      const lastOk = D.nvdSync.history[0];
      return M.page({
        title: "Lỗ hổng bảo mật",
        codes: ["NV-3.2.1", "NV-3.2.2"],
        actions: M.btn("Đồng bộ NVD ngay", { icon: "refresh", perm: "vuln.handle", msg: "Đang đồng bộ dữ liệu NVD… Kết quả đối chiếu tự tính lại khi xong." }) + M.btn("Nạp từ tệp", { icon: "upload", modal: "nvd-import", perm: "vuln.handle" }),
        body: `${M.stats(SEV_ORDER.map((s) => ({ label: s, value: D.cves.filter((c) => c.severity === s && !["patched", "false_positive"].includes(c.status)).length, tone: SEV[s][0], href: "#/vulns?sev=" + s })))}
        <div class="row between">
          <div class="row"><span class="small muted">Đồng bộ NVD gần nhất:</span> <b class="mono">${e(D.nvdSync.last)}</b> ${lastOk[1] === "ok" ? M.pill("Thành công", "ok") : M.pill("Lỗi", "bad")}</div>
          ${M.seg("sev", [["all", "Tất cả"], ["Critical", "Critical"], ["High", "High"], ["Medium", "Medium"], ["Low", "Low"]], sev)}
        </div>
        ${M.note("Đối chiếu theo số phiên bản nên có thể báo nhầm khi máy đã vá mà số phiên bản không đổi.", "warn")}
        <div class="side-layout">
          ${M.panel({ title: "Bảng xếp hạng rủi ro", flush: true, body: M.table({
            id: "cves", href: (c) => "#/vulns/" + c.id,
            cols: [
              { h: "CVE", r: (c) => `<span class="mono strong">${e(c.id)}</span>` },
              { h: "Mức", r: (c) => sevPill(c.severity) },
              { h: "CVSS", r: (c) => `<span class="mono">${e(c.cvss.toFixed(1))}</span>`, cls: "right" },
              { h: "Sản phẩm", r: (c) => `<div class="cell-name">${e(c.product)}</div><div class="cell-sub">${e(c.title)}</div>` },
              { h: "Số máy", r: (c) => `<span class="mono">${e(c.assetIds.length)}</span>`, cls: "right" },
              { h: "Xử lý", r: (c) => vst(c.status) },
            ],
            rows: list, empty: "Không có lỗ hổng nào ở mức này.",
          }) })}
          <div class="stack">
            ${M.panel({ title: "Máy cần vá gấp", flush: true, body: M.table({
              id: "urgent",
              cols: [
                { h: "Máy", r: ([id]) => assetCell(id) },
                { h: "Critical", r: ([, s]) => s.c ? M.pill(String(s.c), "bad", true) : '<span class="muted">0</span>', cls: "right" },
                { h: "High", r: ([, s]) => s.h ? M.pill(String(s.h), "bad") : '<span class="muted">0</span>', cls: "right" },
              ],
              rows: urgent,
            }) })}
            ${M.panel({ title: "Lịch sử đồng bộ", body: `<ul class="log">${D.nvdSync.history.map(([t, st, msg]) => `<li><time>${e(t)}</time><div><div class="log-title">${st === "ok" ? "Thành công" : "Lỗi"}</div><div class="log-meta">${e(msg)}</div></div></li>`).join("")}</ul>` })}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== Chi tiết lỗ hổng (NV-3.2.2, NV-3.2.3) ===================== */
  M.defModal("vuln-status", (arg) => {
    const [cveId, assetId] = arg.split("|");
    const c = M.find("cves", cveId);
    const cur = (c.perAsset && c.perAsset[assetId]) || [c.status, "", ""];
    const a = M.asset(assetId);
    return {
      title: "Cập nhật trạng thái xử lý",
      body: `<p><b class="mono">${e(c.id)}</b> trên ${M.tape(a.tag)} ${e((a.tech && a.tech.hostname) || a.name)}</p>
        ${M.field("Trạng thái", M.select("st", Object.entries(VST).map(([k, v]) => [k, v[0]]), cur[0]), { req: true })}
        ${M.field("Lý do / ghi chú", M.textarea("reason", cur[2], { ph: "Bắt buộc khi chấp nhận rủi ro hoặc đánh dấu báo nhầm" }))}`,
      submit: "Lưu",
      onSubmit(d, form) {
        if ((d.st === "accepted" || d.st === "false_positive") && !(d.reason || "").trim()) return M.invalid(form, "reason", d.st === "accepted" ? "Chấp nhận rủi ro phải ghi lý do." : "Báo nhầm phải ghi lý do.");
        c.perAsset = c.perAsset || {};
        c.perAsset[assetId] = [d.st, cur[1], (d.reason || "").trim()];
        return d.st === "accepted" ? `Đã ghi nhận chấp nhận rủi ro cho ${a.tag}. Nhật ký kiểm toán ghi người quyết định: ${M.me().user}.` : `Đã cập nhật trạng thái xử lý của ${a.tag}.`;
      },
    };
  });

  M.screen("vulns/:id", {
    nav: "vulns", title: "Chi tiết lỗ hổng", codes: ["NV-3.2.2", "NV-3.2.3"],
    render(p) {
      const c = M.find("cves", p.id);
      if (!c) return M.page({ title: "Không tìm thấy lỗ hổng", back: ["#/vulns", "Lỗ hổng bảo mật"], body: M.empty(`Không có ${p.id} trong dữ liệu đã đồng bộ.`) });
      const can = M.can("vuln.handle");
      const per = (id) => (c.perAsset && c.perAsset[id]) || [c.status, "", ""];
      const isMain = c.id === "CVE-2026-21410";
      return M.page({
        title: `<span class="mono">${e(c.id)}</span>`,
        back: ["#/vulns", "Lỗ hổng bảo mật"],
        codes: ["NV-3.2.2", "NV-3.2.3"],
        sub: `${sevPill(c.severity)} <b>CVSS ${e(c.cvss.toFixed(1))}</b> - ${e(c.product)} ${e(c.affected)} - ${e(c.title)}`,
        actions: (isMain ? M.btn("Yêu cầu thay đổi CHG-031", { href: "#/changes/CHG-031", icon: "git" }) + M.btn("Triển khai bản vá DP-007", { href: "#/deployments/DP-007", icon: "rocket", primary: true }) : M.btn("Lập yêu cầu thay đổi", { href: "#/changes", icon: "git", perm: "change.manage" })),
        body: `<div class="side-layout">
          ${M.panel({ title: `Máy bị ảnh hưởng (${c.assetIds.length})`, flush: true, body: M.table({
            id: "cve-assets",
            cols: [
              { h: "Máy", r: (id) => assetCell(id) },
              { h: "Người / nơi giữ", r: (id) => holderOfAsset(id) },
              { h: "Phiên bản đang cài", r: (id) => `<span class="mono small">${e(per(id)[1] || c.affected)}</span>` },
              { h: "Trạng thái xử lý", r: (id) => vst(per(id)[0]) },
              { h: "Ghi chú", r: (id) => per(id)[2] ? `<span class="small">${e(per(id)[2])}</span>` : '<span class="muted">—</span>', cls: "wrap" },
              { h: "", r: (id) => can ? M.btn("Cập nhật", { sm: true, modal: "vuln-status", arg: c.id + "|" + id }) : "" },
            ],
            rows: c.assetIds,
          }) })}
          <div class="stack">
            ${M.panel({ title: "Thông tin", body: M.kv([
              ["Công bố", e(c.published)],
              ["Nguồn", "NVD - đồng bộ " + e(D.nvdSync.last)],
              ["Xử lý chung", vst(c.status)],
            ]) })}
            ${isMain ? M.panel({ title: "Diễn biến", body: `<ul class="log">${[
              ["25/11/2026", "NVD công bố CVE-2026-21410"],
              ["27/11/2026 06:00", "Đồng bộ NVD, đối chiếu thấy 3 máy bị ảnh hưởng"],
              ["27/11/2026 06:01", "Cảnh báo Critical gửi Quản trị hạ tầng, hiện trên dashboard"],
              ["27/11/2026 09:30", "Lê Hoàng Nam lập yêu cầu thay đổi CHG-031 kèm phân tích tác động"],
              ["28/11/2026 22:00", "Đợt triển khai bản vá DP-007 (đã lên lịch)"],
            ].map(([t, s]) => `<li><time>${e(t)}</time><div class="log-title" style="font-weight:500">${e(s)}</div></li>`).join("")}</ul>` }) : ""}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== Hết hạn hỗ trợ (NV-3.3.1) ===================== */
  M.defModal("eol-edit", (id) => {
    const x = M.find("eol", id);
    return {
      title: "Sửa ngày hết hỗ trợ",
      body: `<p><b>${e(x.product)}</b></p>${M.field("Ngày hết hỗ trợ", M.input("date", { value: x.date }), { req: true, hint: "dd/mm/yyyy" })}`,
      submit: "Lưu",
      onSubmit(d, form) {
        if (!validDate(d.date)) return M.invalid(form, "date", "Ngày không hợp lệ. Nhập dạng dd/mm/yyyy.");
        x.date = d.date.trim();
        x.source = "Nhập tay - " + M.me().user;
        return "Đã cập nhật ngày hết hỗ trợ; hai danh sách được tính lại.";
      },
    };
  });
  M.screen("eol", {
    nav: "eol", title: "Hết hỗ trợ (EOL)", codes: ["NV-3.3.1"],
    render() {
      const rows = D.eol.map((x) => ({ ...x, days: daysTo(x.date) }));
      const expired = rows.filter((x) => x.days < 0).sort((a, b) => a.days - b.days);
      const soon = rows.filter((x) => x.days >= 0 && x.days <= 180).sort((a, b) => a.days - b.days);
      const later = rows.filter((x) => x.days > 180);
      const can = M.can("software.manage");
      const table = (id, list) => M.table({
        id,
        cols: [
          { h: "Sản phẩm", r: (x) => `<div class="cell-name">${e(x.product)}</div><div class="cell-sub">${e(x.kind)}</div>` },
          { h: "Ngày hết hỗ trợ", r: (x) => `<span class="mono">${e(x.date)}</span><div class="cell-sub">${M.pill(dueText(x.days), dueTone(x.days, 180))}</div>` },
          { h: "Tài sản đang dùng", r: (x) => x.assetIds.map((id) => M.tape(M.asset(id).tag, id)).join(" "), cls: "wrap" },
          { h: "", r: (x) => can ? M.btn("Sửa ngày", { sm: true, ghost: true, modal: "eol-edit", arg: x.id }) : "" },
        ],
        rows: list, empty: "Không có sản phẩm nào.",
      });
      return M.page({
        title: "Vòng đời công nghệ: hết hạn hỗ trợ",
        sub: "Ngày hãng ngừng hỗ trợ, đối chiếu với tài sản đang dùng.",
        codes: ["NV-3.3.1"],
        actions: M.btn("Thêm sản phẩm", { icon: "plus", perm: "software.manage", msg: "Mockup: thêm sản phẩm và ngày hết hỗ trợ." }),
        body: `${M.stats([
          { label: "Đã hết hỗ trợ", value: expired.length, tone: "bad", sub: `${new Set(expired.flatMap((x) => x.assetIds)).size} tài sản bị ảnh hưởng` },
          { label: "Sắp hết (≤ 180 ngày)", value: soon.length, tone: "warn", sub: `${new Set(soon.flatMap((x) => x.assetIds)).size} tài sản bị ảnh hưởng` },
          { label: "Còn xa", value: later.length, tone: "ok" },
        ])}
        ${M.cc("CC-13", "Dữ liệu ngày hết hỗ trợ lấy từ đâu: nhập tay như hiện tại, hay đồng bộ từ một nguồn công khai?")}
        ${M.panel({ title: "Đã hết hỗ trợ", flush: true, body: table("eol-exp", expired) })}
        ${M.panel({ title: "Sắp hết hỗ trợ", flush: true, body: table("eol-soon", soon) })}
        ${M.panel({ title: "Còn xa", flush: true, body: table("eol-later", later) })}`,
      });
    },
  });

  /* ===================== Tuân thủ máy trạm (NV-3.3.2) ===================== */
  M.screen("compliance", {
    nav: "compliance", title: "Tuân thủ máy trạm", codes: ["NV-3.3.2"],
    render() {
      const rows = D.compliance.map((c) => ({ ...c, result: machineResult(c) }));
      const pass = rows.filter((r) => r.result === "pass").length;
      const fail = rows.filter((r) => r.result === "fail").length;
      const unknown = rows.filter((r) => r.result === "unknown").length;
      const rate = pass + fail ? Math.round((pass / (pass + fail)) * 100) : 0;
      const cell = (v) => `${M.pill(CST[v[0]][0], CST[v[0]][1], v[0] === "fail")}${v[0] === "fail" && v[1] ? `<div class="cell-sub">${e(v[1])}</div>` : ""}`;
      return M.page({
        title: "Tuân thủ bảo mật máy trạm",
        codes: ["NV-3.3.2"],
        actions: M.btn("Xuất báo cáo", { icon: "download", msg: "Đã xuất báo cáo tuân thủ: kết quả từng hạng mục của từng máy (Excel)." }),
        body: `${M.stats([
          { label: "Tỷ lệ tuân thủ", value: rate + "%", tone: rate >= 80 ? "ok" : "warn", sub: `${pass}/${pass + fail} máy có dữ liệu đạt` },
          { label: "Không đạt", value: fail, tone: "bad" },
          { label: "Chưa rõ", value: unknown, tone: "mute" },
        ])}
        ${M.panel({ title: "Kết quả từng máy", flush: true, body: M.toolbar(M.searchBox("compliance", "Lọc theo mã, tên máy, kết quả…")) + M.table({
          id: "compliance",
          cols: [
            { h: "Máy", r: (r) => assetCell(r.assetId) },
            { h: "Chính sách", r: (r) => e(r.policy) },
            { h: "Diệt virus", r: (r) => cell(r.av), cls: "wrap" },
            { h: "Mã hóa ổ đĩa", r: (r) => cell(r.enc), cls: "wrap" },
            { h: "Quản trị cục bộ", r: (r) => cell(r.adm), cls: "wrap" },
            { h: "Kết quả", r: (r) => M.pill(CST[r.result][0], CST[r.result][1], r.result === "fail") },
          ],
          rows: rows.sort((a, b) => ["fail", "unknown", "pass"].indexOf(a.result) - ["fail", "unknown", "pass"].indexOf(b.result)),
        }) })}
        ${M.panel({ title: "Chính sách theo nhóm máy", flush: true, body: M.table({
          id: "comp-policies",
          cols: [
            { h: "Nhóm", r: (p) => `<div class="cell-name">${e(p.name)}</div><div class="cell-sub">${e(p.applies)}</div>` },
            { h: "Diệt virus", r: (p) => p.av ? M.pill("Bắt buộc", "info") : M.pill("Không", "mute") },
            { h: "Mã hóa ổ đĩa", r: (p) => p.enc ? M.pill("Bắt buộc", "info") : M.pill("Không", "mute") },
            { h: "Quản trị cục bộ", r: (p) => p.adm ? M.pill("Kiểm tra", "info") : M.pill("Không", "mute") },
            { h: "Tài khoản quản trị được phép", r: (p) => `<span class="small mono">${e(p.allowed)}</span>`, cls: "wrap" },
            { h: "", r: () => M.can("software.manage") ? M.btn("Sửa", { sm: true, ghost: true, msg: "Mockup: sửa chính sách tuân thủ." }) : "" },
          ],
          rows: D.compliancePolicies,
        }) })}
        ${M.anno("Agent hiện chưa thu thành viên nhóm quản trị cục bộ và trạng thái diệt virus (NV-1.4.1, cột \"Chưa thu\"); màn này là thiết kế đích.")}`,
      });
    },
  });

  /* ===================== Chứng chỉ SSL (NV-3.3.3) ===================== */
  M.defModal("ssl-add", () => ({
    title: "Theo dõi chứng chỉ SSL",
    body: `${M.field("Địa chỉ", M.input("host", { ph: "erp.anphat.vn hoặc 10.10.0.20:8443" }), { req: true })}`,
    submit: "Thêm",
    onSubmit(d, form) {
      const h = (d.host || "").trim();
      if (!/^[a-z0-9.-]+(:\d{1,5})?$/i.test(h)) return M.invalid(form, "host", "Địa chỉ không hợp lệ. Nhập tên miền hoặc IP, có thể kèm cổng.");
      D.ssl.push({ host: h, issuer: "", expires: "", daysLeft: null, state: "error", source: "Nhập tay", checked: nowText, error: "Chưa kiểm tra lần nào. Kết quả có sau lần kiểm tra kế tiếp." });
      return `Đã thêm ${h} vào danh sách theo dõi.`;
    },
  }));
  M.screen("ssl", {
    nav: "ssl", title: "Chứng chỉ SSL", codes: ["NV-3.3.3"],
    render() {
      const order = { expired: 0, warn: 1, error: 2, ok: 3 };
      const rows = D.ssl.slice().sort((a, b) => order[a.state] - order[b.state] || (a.daysLeft ?? 99999) - (b.daysLeft ?? 99999));
      const count = (s) => D.ssl.filter((x) => x.state === s).length;
      return M.page({
        title: "Theo dõi chứng chỉ SSL",
        codes: ["NV-3.3.3"],
        actions: M.btn("Kiểm tra ngay", { icon: "refresh", perm: "vuln.handle", msg: "Đang kiểm tra lại toàn bộ chứng chỉ…" }) + M.btn("Thêm địa chỉ", { primary: true, icon: "plus", modal: "ssl-add", perm: "vuln.handle" }),
        body: `${M.stats([
          { label: "Đã hết hạn", value: count("expired"), tone: "bad" },
          { label: "Sắp hết hạn (≤ 30 ngày)", value: count("warn"), tone: "warn" },
          { label: "Lỗi kết nối", value: count("error"), tone: "mute" },
          { label: "Còn hạn", value: count("ok"), tone: "ok" },
        ])}
        ${M.panel({ title: `Chứng chỉ đang theo dõi (${D.ssl.length})`, flush: true, body: M.table({
          id: "ssl",
          cols: [
            { h: "Địa chỉ", r: (x) => `<span class="mono strong">${e(x.host)}</span>` },
            { h: "Bên cấp", r: (x) => x.issuer ? `<span class="small">${e(x.issuer)}</span>` : '<span class="muted">—</span>', cls: "wrap" },
            { h: "Hết hạn", r: (x) => x.expires ? `<span class="mono">${e(x.expires)}</span><div class="cell-sub">${e(dueText(x.daysLeft))}</div>` : '<span class="muted">—</span>' },
            { h: "Trạng thái", r: (x) => `${M.pill(SSL_ST[x.state][0], SSL_ST[x.state][1], x.state === "expired")}${x.error ? `<div class="cell-sub">${e(x.error)}</div>` : ""}`, cls: "wrap" },
          ],
          rows,
        }) })}`,
      });
    },
  });
})();
