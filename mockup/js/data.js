/* Mockup ITAM: dữ liệu mẫu dùng chung cho mọi module.
   Chỉ gồm các thực thể mà nhiều module cùng tham chiếu: đơn vị, phòng ban, vị trí, danh mục,
   hãng/model, nhân viên, tài khoản, tài sản, thông báo. Dữ liệu riêng của từng module
   (ticket, bản quyền, CVE, hợp đồng…) nằm ở đầu file screens-*.js của module đó.
   Tên người, công ty, email đều là giả. */
(function () {
  const D = M.data;

  D.company = "Công ty CP Công nghệ An Phát";

  /* NT-3: cây đơn vị (đề xuất, chờ CC-2) */
  D.orgUnits = [
    { id: "u0", name: "Toàn công ty", level: 0, parent: null, code: "AP" },
    { id: "u1", name: "Trụ sở Hà Nội", level: 1, parent: "u0", code: "HN" },
    { id: "u2", name: "Chi nhánh TP.HCM", level: 1, parent: "u0", code: "HCM" },
    { id: "u3", name: "Văn phòng Đà Nẵng", level: 1, parent: "u0", code: "DN" },
  ];

  D.departments = [
    { id: "d1", name: "Ban Giám đốc", unit: "u1", headId: "e20" },
    { id: "d2", name: "Phòng IT", unit: "u1", headId: "e15" },
    { id: "d3", name: "Phòng Kế toán", unit: "u1", headId: "e11" },
    { id: "d4", name: "Phòng Nhân sự", unit: "u1", headId: "e2" },
    { id: "d5", name: "Phòng Kinh doanh", unit: "u1", headId: "e12" },
    { id: "d6", name: "Phòng Marketing", unit: "u1", headId: "e3" },
    { id: "d7", name: "Kinh doanh miền Nam", unit: "u2", headId: "e13" },
    { id: "d8", name: "Hành chính", unit: "u1", headId: "e17" },
  ];

  /* NT-4: vị trí dạng cây (tòa nhà → tầng → phòng → tủ rack) */
  D.locations = [
    { id: "l1", name: "Tòa A - 18 Láng Hạ", kind: "Tòa nhà", parent: null, unit: "u1" },
    { id: "l2", name: "Tầng 3", kind: "Tầng", parent: "l1", unit: "u1" },
    { id: "l3", name: "Phòng 301 - Kế toán", kind: "Phòng", parent: "l2", unit: "u1" },
    { id: "l4", name: "Phòng máy chủ", kind: "Phòng", parent: "l2", unit: "u1" },
    { id: "l5", name: "Tủ rack R1", kind: "Tủ rack", parent: "l4", unit: "u1" },
    { id: "l6", name: "Tủ rack R2", kind: "Tủ rack", parent: "l4", unit: "u1" },
    { id: "l7", name: "Kho IT", kind: "Kho", parent: "l2", unit: "u1" },
    { id: "l8", name: "Phòng họp Sen", kind: "Phòng", parent: "l2", unit: "u1" },
    { id: "l13", name: "Tầng 5", kind: "Tầng", parent: "l1", unit: "u1" },
    { id: "l14", name: "Phòng Kinh doanh", kind: "Phòng", parent: "l13", unit: "u1" },
    { id: "l9", name: "Tòa B - 25 Nguyễn Huệ", kind: "Tòa nhà", parent: null, unit: "u2" },
    { id: "l10", name: "Tầng 5", kind: "Tầng", parent: "l9", unit: "u2" },
    { id: "l11", name: "Phòng kinh doanh HCM", kind: "Phòng", parent: "l10", unit: "u2" },
    { id: "l12", name: "Kho chi nhánh", kind: "Kho", parent: "l10", unit: "u2" },
  ];
  M.locPath = (id) => {
    const parts = [];
    let l = M.find("locations", id);
    while (l) { parts.unshift(l.name); l = l.parent ? M.find("locations", l.parent) : null; }
    return parts.join(" › ");
  };

  D.categories = [
    { id: "c1", name: "Laptop", depMonths: 36, termsId: "tm2" },
    { id: "c2", name: "Máy tính để bàn", depMonths: 48, termsId: "tm1" },
    { id: "c3", name: "Màn hình", depMonths: 48, termsId: "tm1" },
    { id: "c4", name: "Máy chủ", depMonths: 60, termsId: null },
    { id: "c5", name: "Thiết bị mạng", depMonths: 60, termsId: null },
    { id: "c6", name: "Máy in", depMonths: 36, termsId: null },
    { id: "c7", name: "Bộ lưu điện (UPS)", depMonths: 48, termsId: null },
  ];

  /* Hãng và model: một model thuộc đúng một danh mục (NT-4) */
  D.models = [
    { id: "m1", maker: "Dell", name: "Latitude 5440", cat: "c1" },
    { id: "m2", maker: "Lenovo", name: "ThinkPad T14 Gen 4", cat: "c1" },
    { id: "m3", maker: "HP", name: "EliteBook 840 G10", cat: "c1" },
    { id: "m4", maker: "Apple", name: "MacBook Air M2", cat: "c1" },
    { id: "m5", maker: "Dell", name: "OptiPlex 7010", cat: "c2" },
    { id: "m6", maker: "Dell", name: "P2422H", cat: "c3" },
    { id: "m7", maker: "Dell", name: "PowerEdge R650", cat: "c4" },
    { id: "m8", maker: "Cisco", name: "Catalyst 9200-24P", cat: "c5" },
    { id: "m9", maker: "Fortinet", name: "FortiGate 100F", cat: "c5" },
    { id: "m10", maker: "HP", name: "LaserJet Pro M404dn", cat: "c6" },
    { id: "m11", maker: "APC", name: "Smart-UPS 1500", cat: "c7" },
    { id: "m12", maker: "Dell Inc.", name: "20UES1K600", cat: null, dirty: true },
  ];

  /* Nhân viên. status: active | leaving (HRM đã báo ngày nghỉ) | left */
  D.employees = [
    { id: "e1", code: "NV0012", name: "Nguyễn Văn Bình", email: "binh.nv@anphat.vn", dept: "d3", managerId: "e11", status: "active", unit: "u1" },
    { id: "e2", code: "NV0018", name: "Hoàng Thị Mai", email: "mai.ht@anphat.vn", dept: "d4", managerId: "e20", status: "active", unit: "u1" },
    { id: "e3", code: "NV0021", name: "Trần Quốc Việt", email: "viet.tq@anphat.vn", dept: "d6", managerId: "e20", status: "active", unit: "u1" },
    { id: "e4", code: "NV0025", name: "Lý Thanh Tâm", email: "tam.lt@anphat.vn", dept: "d3", managerId: "e11", status: "active", unit: "u1" },
    { id: "e5", code: "NV0030", name: "Đỗ Mai Linh", email: "linh.dm@anphat.vn", dept: "d5", managerId: "e12", status: "active", unit: "u1" },
    { id: "e6", code: "NV0034", name: "Đặng Văn Hùng", email: "hung.dv@anphat.vn", dept: "d2", managerId: "e15", status: "active", unit: "u1" },
    { id: "e7", code: "NV0041", name: "Lê Văn Tùng", email: "tung.lv@anphat.vn", dept: "d5", managerId: "e12", status: "leaving", leaveDate: "05/12/2026", unit: "u1" },
    { id: "e8", code: "NV0047", name: "Phan Minh Khoa", email: "khoa.pm@anphat.vn", dept: "d7", managerId: "e13", status: "active", unit: "u2" },
    { id: "e9", code: "NV0052", name: "Ngô Thùy Dung", email: "dung.nt@anphat.vn", dept: "d6", managerId: "e3", status: "active", unit: "u1" },
    { id: "e10", code: "NV0056", name: "Bùi Gia Huy", email: "huy.bg@anphat.vn", dept: "d2", managerId: "e15", status: "active", unit: "u1" },
    { id: "e11", code: "NV0003", name: "Trịnh Văn Long", email: "long.tv@anphat.vn", dept: "d3", managerId: "e20", status: "active", unit: "u1" },
    { id: "e12", code: "NV0002", name: "Mai Anh Tuấn", email: "tuan.ma@anphat.vn", dept: "d5", managerId: "e20", status: "active", unit: "u1" },
    { id: "e13", code: "NV0060", name: "Châu Ngọc Hân", email: "han.cn@anphat.vn", dept: "d7", managerId: "e12", status: "active", unit: "u2" },
    { id: "e14", code: "NV0009", name: "Võ Thị Lan", email: "lan.vt@anphat.vn", dept: "d4", managerId: "e2", status: "left", leaveDate: "30/09/2026", unit: "u1" },
    { id: "e15", code: "NV0005", name: "Trần Minh Quân", email: "quan.tm@anphat.vn", dept: "d2", managerId: "e20", status: "active", unit: "u1" },
    { id: "e16", code: "NV0011", name: "Lê Hoàng Nam", email: "nam.lh@anphat.vn", dept: "d2", managerId: "e15", status: "active", unit: "u1" },
    { id: "e17", code: "NV0015", name: "Phạm Thu Hà", email: "ha.pt@anphat.vn", dept: "d8", managerId: "e20", status: "active", unit: "u1" },
    { id: "e18", code: "NV0038", name: "Nguyễn Đức Anh", email: "anh.nd@anphat.vn", dept: "d2", managerId: "e15", status: "active", unit: "u1" },
    { id: "e19", code: "NV0044", name: "Vũ Thanh Hương", email: "huong.vt@anphat.vn", dept: "d1", managerId: "e20", status: "active", unit: "u1" },
    { id: "e20", code: "NV0001", name: "Đinh Quang Minh", email: "minh.dq@anphat.vn", dept: "d1", managerId: null, status: "active", unit: "u0" },
  ];
  M.emp = (id) => M.find("employees", id);
  M.dept = (id) => M.find("departments", id);
  M.EMP_STATUS = { active: ["Đang làm", "ok"], leaving: ["Sắp nghỉ", "warn"], left: ["Đã nghỉ", "mute"] };

  /* NT-1, NT-2: tài khoản đăng nhập. status: pending | active | disabled */
  D.users = [
    { id: "us1", username: "quan.tm", name: "Trần Minh Quân", role: "admin", employeeId: "e15", status: "active", created: "02/09/2026" },
    { id: "us2", username: "nam.lh", name: "Lê Hoàng Nam", role: "infra", employeeId: "e16", status: "active", created: "02/09/2026" },
    { id: "us3", username: "ha.pt", name: "Phạm Thu Hà", role: "asset", employeeId: "e17", status: "active", created: "03/09/2026" },
    { id: "us4", username: "anh.nd", name: "Nguyễn Đức Anh", role: "helpdesk", employeeId: "e18", status: "active", created: "05/09/2026" },
    { id: "us5", username: "huong.vt", name: "Vũ Thanh Hương", role: "audit", employeeId: "e19", status: "active", created: "10/09/2026" },
    { id: "us6", username: "linh.dm", name: "Đỗ Mai Linh", role: "employee", employeeId: "e5", status: "active", created: "12/10/2026" },
    { id: "us7", username: "binh.nv", name: "Nguyễn Văn Bình", role: "employee", employeeId: "e1", status: "active", created: "12/10/2026" },
    { id: "us8", username: "huy.bg", name: "Bùi Gia Huy", role: "helpdesk", employeeId: null, status: "pending", created: "26/11/2026" },
    { id: "us9", username: "khoa.pm", name: "Phan Minh Khoa", role: "employee", employeeId: null, status: "pending", created: "27/11/2026" },
    { id: "us10", username: "lan.vt", name: "Võ Thị Lan", role: "employee", employeeId: "e14", status: "disabled", created: "15/09/2026" },
  ];

  /* Tài sản định danh.
     holder: { type: "employee" | "location" | "asset", id }
     tech: hồ sơ kỹ thuật do agent báo cáo (NV-1.4.2); null = chưa có báo cáo. */
  const sw = (list) => list.map(([name, version]) => ({ name, version }));
  const officeSw = sw([["Microsoft 365 Apps for enterprise - vi-vn", "16.0.17928"], ["Google Chrome", "131.0.6778.86"], ["Zoom Workplace", "6.2.11"], ["7-Zip 23.01 (x64)", "23.01"], ["Adobe Acrobat Reader", "24.004.20220"], ["Microsoft Teams", "24295.605"], ["Kaspersky Endpoint Security", "12.6.0.438"], ["Java 8 Update 381", "8.0.3810"]]);
  D.assets = [
    { id: "a1", tag: "TS-000001", name: "Laptop Dell Latitude 5440", model: "m1", serial: "7XK2H93", status: "deployed", holder: { type: "employee", id: "e1" }, created: "12/03/2025", note: "", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2025-031", date: "12/03/2025", cost: 28500000 }, warranty: { end: "12/03/2028", type: "ProSupport 3 năm", source: "Tra tự động (Dell)", checked: "20/11/2026" },
      tech: { hostname: "KT-BINH-LT", os: "Windows 11 Pro 23H2 (22631.4460)", cpu: "Intel Core i5-1345U - 10 nhân - 12 luồng", ram: "16 GB", disks: ["Samsung PM9B1 - 512 GB - SSD"], nics: [["Intel Wi-Fi 6E AX211", "3C:21:9C:4A:11:0E", "10.10.3.21"], ["Intel Ethernet I219-LM", "C4:5A:B1:02:7F:33", "—"]], ip: "10.10.3.21", bios: "Dell 1.18.0 - UUID 4C4C4544-0037-5810-8032-B7C04F483933", reported: "Dell Inc. - Latitude 5440 - 7XK2H93", agent: "ag3", linkVia: "Tự khớp theo serial", lastReport: "27/11/2026 14:05", lastLogon: "ANPHAT\\binh.nv", software: officeSw.concat(sw([["MISA SME 2025", "R12"], ["AnyDesk", "8.1.0"]])) } },
    { id: "a2", tag: "TS-000002", name: "Laptop Lenovo ThinkPad T14 Gen 4", model: "m2", serial: "PF4B2K1L", status: "deployed", holder: { type: "employee", id: "e5" }, created: "02/10/2025", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2025-077", date: "28/09/2025", cost: 31200000 }, warranty: { end: "28/09/2027", type: "Premier Support 2 năm", source: "Nhập tay", checked: null },
      tech: { hostname: "KD-LINH-LT", os: "Windows 11 Pro 23H2 (22631.4460)", cpu: "AMD Ryzen 7 PRO 7840U - 8 nhân - 16 luồng", ram: "32 GB", disks: ["SK hynix BC901 - 1 TB - SSD"], nics: [["Realtek RTL8852CE Wi-Fi", "F4:26:79:AB:20:9D", "10.10.5.44"]], ip: "10.10.5.44", bios: "Lenovo R2FET41W - UUID 0F1E8A40-2C41-11B2-A85C-BB12D5E64A21", reported: "LENOVO - 21K3CTO1WW - PF4B2K1L", agent: "ag4", linkVia: "Tự khớp theo serial", lastReport: "27/11/2026 13:52", lastLogon: "ANPHAT\\linh.dm", software: officeSw.concat(sw([["Salesforce for Outlook", "4.2.0"], ["TeamViewer", "15.59.3"]])) } },
    { id: "a3", tag: "TS-000003", name: "Màn hình Dell P2422H", model: "m6", serial: "CN0F2T4G7444", status: "deployed", holder: { type: "asset", id: "a2" }, created: "02/10/2025", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2025-077", date: "28/09/2025", cost: 4890000 }, warranty: { end: "28/09/2028", type: "Bảo hành 3 năm", source: "Nhập tay" }, tech: null },
    { id: "a4", tag: "TS-000004", name: "Máy tính để bàn Dell OptiPlex 7010", model: "m5", serial: "9HZ1QW3", status: "deployed", holder: { type: "location", id: "l3" }, created: "15/04/2024", note: "Máy dùng chung in hóa đơn", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2024-012", date: "10/04/2024", cost: 18900000 }, warranty: { end: "10/01/2027", type: "Basic 3 năm", source: "Tra tự động (Dell)", checked: "20/11/2026" },
      tech: { hostname: "KT-PC-301", os: "Windows 10 Pro 22H2 (19045.5131)", cpu: "Intel Core i5-13500 - 14 nhân - 20 luồng", ram: "8 GB", disks: ["Kingston NV2 - 256 GB - SSD", "Seagate ST1000DM010 - 1 TB - HDD"], nics: [["Intel Ethernet I219-V", "B0:4F:13:9E:2A:01", "10.10.3.30"]], ip: "10.10.3.30", bios: "Dell 1.9.0", reported: "Dell Inc. - OptiPlex 7010 - 9HZ1QW3", agent: "ag5", linkVia: "Tự khớp theo serial", lastReport: "27/11/2026 12:40", lastLogon: "ANPHAT\\tam.lt", software: officeSw.concat(sw([["MISA SME 2025", "R12"], ["UltraViewer", "6.6"]])) } },
    { id: "a5", tag: "TS-000005", name: "Máy chủ Dell PowerEdge R650 (ERP)", model: "m7", serial: "DPE650A1", status: "deployed", holder: { type: "location", id: "l5" }, created: "20/01/2024", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2024-002", date: "18/01/2024", cost: 245000000 }, warranty: { end: "18/01/2029", type: "ProSupport Plus 5 năm", source: "Tra tự động (Dell)", checked: "20/11/2026" },
      tech: { hostname: "SRV-ERP-01", os: "Ubuntu 22.04.5 LTS", cpu: "2 × Intel Xeon Silver 4314 - 32 nhân - 64 luồng", ram: "256 GB", disks: ["Dell PERC H755 RAID10 - 3.84 TB - SSD"], nics: [["Broadcom BCM57414 eno1", "D0:8E:79:11:C0:01", "10.10.0.11"], ["Broadcom BCM57414 eno2", "D0:8E:79:11:C0:02", "10.20.0.11"]], ip: "10.10.0.11", bios: "Dell 1.13.2", reported: "Dell Inc. - PowerEdge R650 - DPE650A1", agent: "ag1", linkVia: "Tự khớp theo serial", lastReport: "27/11/2026 14:00", lastLogon: "root", software: sw([["openssh-server", "1:8.9p1-3ubuntu0.10"], ["postgresql-14", "14.13-0ubuntu0.22.04.1"], ["nginx", "1.18.0-6ubuntu14.4"], ["openssl", "3.0.2-0ubuntu1.18"], ["docker-ce", "27.3.1"]]) } },
    { id: "a6", tag: "TS-000006", name: "Máy chủ Dell PowerEdge R650 (ảo hóa)", model: "m7", serial: "DPE650B7", status: "deployed", holder: { type: "location", id: "l5" }, created: "20/01/2024", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2024-002", date: "18/01/2024", cost: 268000000 }, warranty: { end: "18/01/2029", type: "ProSupport Plus 5 năm", source: "Tra tự động (Dell)" },
      tech: { hostname: "SRV-VMH-01", os: "VMware ESXi 7.0 Update 3", cpu: "2 × Intel Xeon Gold 6330 - 56 nhân - 112 luồng", ram: "512 GB", disks: ["Dell BOSS-S2 - 480 GB - SSD", "vSAN - 15.36 TB - SSD"], nics: [["vmnic0", "D0:8E:79:22:A0:10", "10.10.0.20"]], ip: "10.10.0.20", bios: "Dell 1.13.2", reported: "Dell Inc. - PowerEdge R650 - DPE650B7", agent: null, linkVia: "Quét vCenter (đề xuất)", lastReport: "27/11/2026 06:00", software: [] } },
    { id: "a7", tag: "TS-000007", name: "Switch lõi Cisco Catalyst 9200-24P", model: "m8", serial: "JAE24151X9K", status: "deployed", holder: { type: "location", id: "l6" }, created: "20/01/2024", unit: "u1",
      purchase: { vendorId: "v3", po: "PO-2024-003", date: "19/01/2024", cost: 62000000 }, warranty: { end: "19/01/2027", type: "SmartNet 8x5xNBD", source: "Nhập tay" }, tech: null, ip: "10.10.0.2", hostname: "SW-CORE-01" },
    { id: "a8", tag: "TS-000008", name: "Tường lửa FortiGate 100F", model: "m9", serial: "FG100FTK22013377", status: "deployed", holder: { type: "location", id: "l6" }, created: "20/01/2024", unit: "u1",
      purchase: { vendorId: "v3", po: "PO-2024-003", date: "19/01/2024", cost: 89000000 }, warranty: { end: "19/01/2027", type: "FortiCare UTP 3 năm", source: "Nhập tay" }, tech: null, ip: "10.10.0.1", hostname: "FW-01" },
    { id: "a9", tag: "TS-000009", name: "Máy in HP LaserJet Pro M404dn", model: "m10", serial: "PHBBK12345", status: "deployed", holder: { type: "location", id: "l3" }, created: "05/06/2024", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2024-019", date: "01/06/2024", cost: 7200000 }, warranty: { end: "01/06/2025", type: "Bảo hành 1 năm", source: "Nhập tay" }, tech: null, ip: "10.10.3.50" },
    { id: "a10", tag: "TS-000010", name: "Laptop HP EliteBook 840 G10", model: "m3", serial: "5CG3471JKW", status: "ready", holder: null, location: "l7", created: "18/11/2026", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2026-044", date: "15/11/2026", cost: 29900000 }, warranty: { end: "15/11/2029", type: "Wolf Pro Security 3 năm", source: "Nhập tay" }, tech: null },
    { id: "a11", tag: "TS-000011", name: "Laptop HP EliteBook 840 G10", model: "m3", serial: "5CG3471JL2", status: "ready", holder: null, location: "l7", created: "18/11/2026", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2026-044", date: "15/11/2026", cost: 29900000 }, warranty: { end: "15/11/2029", type: "Wolf Pro Security 3 năm", source: "Nhập tay" }, tech: null },
    { id: "a12", tag: "TS-000012", name: "Laptop Dell Latitude 5440", model: "m1", serial: "3MN8K21", status: "maintenance", holder: null, location: "l7", created: "12/03/2025", note: "Gãy bản lề, chờ linh kiện từ hãng", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2025-031", date: "12/03/2025", cost: 28500000 }, warranty: { end: "12/03/2028", type: "ProSupport 3 năm", source: "Tra tự động (Dell)" }, tech: null },
    { id: "a13", tag: "TS-000013", name: "Laptop Apple MacBook Air M2", model: "m4", serial: "C02H71ABQ6L4", status: "deployed", holder: { type: "employee", id: "e3" }, created: "08/07/2025", unit: "u1",
      purchase: { vendorId: "v4", po: "PO-2025-052", date: "05/07/2025", cost: 27490000 }, warranty: { end: "05/07/2026", type: "AppleCare 1 năm", source: "Nhập tay" }, tech: null },
    { id: "a14", tag: "TS-000014", name: "Laptop Lenovo ThinkPad T14 Gen 4", model: "m2", serial: "PF4B2K9Z", status: "broken", holder: null, location: "l7", created: "02/10/2025", note: "Vào nước, mainboard hỏng", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2025-077", date: "28/09/2025", cost: 31200000 }, warranty: { end: "28/09/2027", type: "Premier Support 2 năm", source: "Nhập tay" }, tech: null },
    { id: "a15", tag: "TS-000015", name: "Máy tính để bàn Dell OptiPlex 7010", model: "m5", serial: "1QWE7Y2", status: "archived", holder: null, created: "15/04/2021", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2021-008", date: "10/04/2021", cost: 16500000 }, warranty: { end: "10/04/2024", type: "Basic 3 năm", source: "Nhập tay" }, tech: null,
      disposal: { date: "20/10/2026", reason: "Hết khấu hao, hỏng nguồn", method: "Bán thanh lý", value: 1200000 } },
    { id: "a16", tag: "TS-000016", name: "Bộ lưu điện APC Smart-UPS 1500", model: "m11", serial: "AS2214123456", status: "deployed", holder: { type: "location", id: "l5" }, created: "20/01/2024", unit: "u1",
      purchase: { vendorId: "v3", po: "PO-2024-003", date: "19/01/2024", cost: 14500000 }, warranty: { end: "19/01/2026", type: "Bảo hành 2 năm", source: "Nhập tay" }, tech: null },
    { id: "a17", tag: "TS-000017", name: "Laptop Dell Latitude 5440", model: "m1", serial: "8JQ4L55", status: "deployed", holder: { type: "employee", id: "e2" }, created: "12/03/2025", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2025-031", date: "12/03/2025", cost: 28500000 }, warranty: { end: "12/03/2028", type: "ProSupport 3 năm", source: "Tra tự động (Dell)" },
      tech: { hostname: "NS-MAI-LT", os: "Windows 11 Pro 22H2 (22621.4317)", cpu: "Intel Core i5-1345U - 10 nhân - 12 luồng", ram: "16 GB", disks: ["Samsung PM9B1 - 512 GB - SSD"], nics: [["Intel Wi-Fi 6E AX211", "3C:21:9C:4A:55:10", "10.10.4.18"]], ip: "10.10.4.18", bios: "Dell 1.15.1", reported: "Dell Inc. - Latitude 5440 - 8JQ4L55", agent: "ag6", linkVia: "Tự khớp theo serial", lastReport: "27/11/2026 11:15", lastLogon: "ANPHAT\\mai.ht", software: officeSw } },
    { id: "a18", tag: "TS-000018", name: "Laptop Dell Latitude 5440", model: "m1", serial: "6TR2P08", status: "deployed", holder: { type: "employee", id: "e7" }, created: "12/03/2025", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2025-031", date: "12/03/2025", cost: 28500000 }, warranty: { end: "12/03/2028", type: "ProSupport 3 năm", source: "Tra tự động (Dell)" }, tech: null },
    { id: "a19", tag: "TS-000019", name: "Màn hình Dell P2422H", model: "m6", serial: "CN0F2T4G7450", status: "ready", holder: null, location: "l7", created: "02/10/2025", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2025-077", date: "28/09/2025", cost: 4890000 }, warranty: { end: "28/09/2028", type: "Bảo hành 3 năm", source: "Nhập tay" }, tech: null },
    { id: "a20", tag: "TS-000020", name: "Laptop HP EliteBook 840 G10", model: "m3", serial: "5CG3471H8P", status: "deployed", holder: { type: "employee", id: "e8" }, created: "20/05/2026", unit: "u2",
      purchase: { vendorId: "v2", po: "PO-2026-018", date: "18/05/2026", cost: 30500000 }, warranty: { end: "18/05/2029", type: "Wolf Pro Security 3 năm", source: "Nhập tay" },
      tech: { hostname: "HCM-KHOA-LT", os: "Windows 11 Pro 24H2 (26100.2314)", cpu: "Intel Core Ultra 5 125U - 12 nhân - 14 luồng", ram: "16 GB", disks: ["Samsung PM9C1a - 512 GB - SSD"], nics: [["Intel Wi-Fi 6E AX211", "48:51:C5:7A:00:9E", "10.30.5.12"]], ip: "10.30.5.12", bios: "HP V70 01.04.00", reported: "HP - HP EliteBook 840 G10 - 5CG3471H8P", agent: "ag7", linkVia: "Tự khớp theo serial", lastReport: "27/11/2026 09:31", lastLogon: "ANPHAT\\khoa.pm", software: officeSw.concat(sw([["uTorrent", "3.6.0"]])) } },
    { id: "a21", tag: "TS-000021", name: "Máy tính để bàn Dell OptiPlex 7010", model: "m5", serial: "4BT7RX1", status: "deployed", holder: { type: "location", id: "l11" }, created: "20/05/2026", unit: "u2",
      purchase: { vendorId: "v2", po: "PO-2026-018", date: "18/05/2026", cost: 19500000 }, warranty: { end: "18/05/2029", type: "Basic 3 năm", source: "Tra tự động (Dell)" }, tech: null, lastSeen: "02/10/2026" },
    { id: "a22", tag: "TS-000022", name: "Laptop Lenovo ThinkPad T14 Gen 4", model: "m2", serial: "PF4B3A77", status: "deployed", holder: { type: "employee", id: "e9" }, created: "02/10/2025", unit: "u1",
      purchase: { vendorId: "v2", po: "PO-2025-077", date: "28/09/2025", cost: 31200000 }, warranty: { end: "28/09/2027", type: "Premier Support 2 năm", source: "Nhập tay" }, tech: null },
    { id: "a23", tag: "TS-000023", name: "Laptop Apple MacBook Air M2", model: "m4", serial: "C02H71ABQ9X1", status: "ready", holder: null, location: "l7", created: "08/07/2025", unit: "u1",
      purchase: { vendorId: "v4", po: "PO-2025-052", date: "05/07/2025", cost: 27490000 }, warranty: { end: "05/07/2026", type: "AppleCare 1 năm", source: "Nhập tay" }, tech: null },
    { id: "a24", tag: "TS-000024", name: "Laptop Dell Latitude 5440", model: "m1", serial: "2WD9N44", status: "deployed", holder: { type: "employee", id: "e10" }, created: "12/03/2025", unit: "u1",
      purchase: { vendorId: "v1", po: "PO-2025-031", date: "12/03/2025", cost: 28500000 }, warranty: { end: "12/03/2028", type: "ProSupport 3 năm", source: "Tra tự động (Dell)" },
      tech: { hostname: "IT-HUY-LT", os: "Ubuntu 24.04.1 LTS", cpu: "Intel Core i5-1345U - 10 nhân - 12 luồng", ram: "32 GB", disks: ["Samsung PM9B1 - 512 GB - SSD"], nics: [["Intel Wi-Fi 6E AX211", "3C:21:9C:4B:01:77", "10.10.2.31"]], ip: "10.10.2.31", bios: "Dell 1.18.0", reported: "Dell Inc. - Latitude 5440 - 2WD9N4A", agent: "ag8", linkVia: "Gắn bằng tay", lastReport: "27/11/2026 14:10", lastLogon: "huy.bg", software: sw([["openssh-server", "1:9.6p1-3ubuntu13.5"], ["docker-ce", "27.3.1"], ["code", "1.95.3"], ["wireshark", "4.2.2"]]) } },
  ];
  M.asset = (id) => M.find("assets", id);
  M.model = (id) => M.find("models", id);
  M.cat = (id) => M.find("categories", id);
  M.assetCat = (a) => { const m = M.model(a.model); return m ? M.cat(m.cat) : null; };
  M.assetByTag = (tag) => D.assets.find((a) => a.tag.toLowerCase() === String(tag).trim().toLowerCase());
  /* Tên người/nơi đang giữ một tài sản, dạng HTML có liên kết. */
  M.holderHtml = (a) => {
    if (!a.holder) return '<span class="muted">—</span>';
    const h = a.holder;
    if (h.type === "employee") { const e = M.emp(h.id); return M.person(e.name, "#/employees/" + e.id, e.status !== "active" ? M.EMP_STATUS[e.status][0] : ""); }
    if (h.type === "location") { const l = M.find("locations", h.id); return `<span class="holder"><span class="tile">${M.icon("map")}</span><span>${M.esc(l.name)}</span></span>`; }
    const p = M.asset(h.id);
    return `<span class="holder"><span class="tile">${M.icon("link")}</span><span>Gắn vào ${M.tape(p.tag, p.id)}</span></span>`;
  };
  M.holderText = (a) => {
    if (!a.holder) return "";
    const h = a.holder;
    if (h.type === "employee") return M.emp(h.id).name;
    if (h.type === "location") return M.find("locations", h.id).name;
    return "Gắn vào " + M.asset(h.id).tag;
  };

  /* NV-5.1.1: nhà cung cấp (tên giả). Tài sản tham chiếu qua purchase.vendorId. */
  D.vendors = [
    { id: "v1", name: "Công ty TNHH Giải pháp Số Hưng Thịnh", taxCode: "0108123456", address: "12 Duy Tân, Cầu Giấy, Hà Nội", contact: "Nguyễn Thị Hằng", phone: "024 3795 1122", email: "sales@hungthinh-digital.vn", active: true, note: "Đại lý Dell" },
    { id: "v2", name: "Công ty CP Thiết bị Văn phòng Sao Mai", taxCode: "0106987654", address: "88 Trần Duy Hưng, Hà Nội", contact: "Phạm Quốc Bảo", phone: "024 3556 7788", email: "kinhdoanh@saomai-office.vn", active: true, note: "HP, Lenovo, máy in" },
    { id: "v3", name: "Công ty TNHH Hạ tầng Mạng Lưới Việt", taxCode: "0312456789", address: "45 Lê Duẩn, Quận 1, TP.HCM", contact: "Trương Minh Đức", phone: "028 3822 4455", email: "duc.tm@luoiviet.vn", active: true, note: "Cisco, Fortinet, APC" },
    { id: "v4", name: "Công ty TNHH Thương mại Táo Xanh", taxCode: "0109334455", address: "201 Bà Triệu, Hà Nội", contact: "Lê Thu Trang", phone: "024 3974 0099", email: "b2b@taoxanh.vn", active: true, note: "Thiết bị Apple" },
    { id: "v5", name: "Công ty CP Phần mềm Bản Quyền Việt", taxCode: "0105667788", address: "9 Phạm Hùng, Hà Nội", contact: "Đoàn Văn Kiên", phone: "024 3768 2233", email: "license@banquyenviet.vn", active: true, note: "Microsoft, Adobe, Kaspersky" },
    { id: "v6", name: "Công ty TNHH Văn phòng phẩm Bình Minh", taxCode: "0104112233", address: "30 Kim Mã, Hà Nội", contact: "Hồ Thị Nga", phone: "024 3726 5544", email: "order@binhminh-vpp.vn", active: false, note: "Ngừng dùng từ 08/2026" },
  ];
  M.vendor = (id) => M.find("vendors", id);

  /* NV-2.3.3: điều khoản sử dụng theo danh mục, có phiên bản */
  D.terms = [
    { id: "tm1", name: "Điều khoản sử dụng thiết bị văn phòng", version: 3, updated: "02/09/2026", by: "Phạm Thu Hà", cats: ["c2", "c3"],
      body: ["Thiết bị là tài sản của công ty, chỉ dùng cho công việc.", "Không tự ý tháo lắp, thay linh kiện hoặc cài phần mềm ngoài danh sách được phép.", "Báo ngay cho Phòng IT khi thiết bị hỏng, mất hoặc có dấu hiệu bất thường.", "Hoàn trả đầy đủ thiết bị và phụ kiện khi nghỉ việc hoặc khi công ty yêu cầu."],
      history: [[3, "02/09/2026", "Thêm điều khoản phần mềm được phép"], [2, "10/03/2025", "Bổ sung trách nhiệm báo mất"], [1, "15/01/2024", "Bản đầu"]] },
    { id: "tm2", name: "Điều khoản sử dụng laptop", version: 2, updated: "15/10/2026", by: "Phạm Thu Hà", cats: ["c1"],
      body: ["Laptop được mang ra ngoài văn phòng khi đi công tác hoặc làm việc từ xa; người giữ chịu trách nhiệm bảo quản.", "Luôn bật mã hóa ổ đĩa (BitLocker/FileVault) và khóa màn hình khi rời máy.", "Không cho người ngoài công ty sử dụng.", "Mất máy phải báo trong 24 giờ; trường hợp do lỗi cá nhân có thể phải bồi thường theo giá trị còn lại.", "Hoàn trả đầy đủ máy, sạc và phụ kiện khi nghỉ việc."],
      history: [[2, "15/10/2026", "Thêm yêu cầu mã hóa ổ đĩa"], [1, "12/03/2025", "Bản đầu"]] },
  ];

  /* NV-2.3.1, NV-2.3.2: biên bản bàn giao.
     kind: issue (cấp) | return (trả) | transfer (điều chuyển); status: pending | signed | rejected | overdue */
  D.handovers = [
    { id: "BB-2026-0118", kind: "issue", employeeId: "e5", assetIds: ["a2", "a3"], accessories: [["Chuột Logitech M331 Silent", 1], ["Dock Dell WD19S", 1]], createdAt: "27/11/2026 09:05", createdBy: "Phạm Thu Hà", status: "pending", termsId: "tm2", termsVersion: 2, due: "04/12/2026" },
    { id: "BB-2026-0119", kind: "issue", employeeId: "e2", assetIds: ["a17"], accessories: [], createdAt: "15/11/2026 10:20", createdBy: "Phạm Thu Hà", status: "overdue", termsId: "tm2", termsVersion: 2, due: "22/11/2026", reminded: 2 },
    { id: "BB-2026-0116", kind: "issue", employeeId: "e9", assetIds: ["a22"], accessories: [], createdAt: "02/10/2025 14:00", createdBy: "Phạm Thu Hà", status: "rejected", reason: "Serial trên máy (PF4B3A77) đúng, nhưng thiếu sạc 65W ghi trong biên bản.", termsId: "tm2", termsVersion: 1 },
    { id: "BB-2026-0115", kind: "issue", employeeId: "e8", assetIds: ["a20"], accessories: [["Bàn phím Logitech K120", 1]], createdAt: "20/05/2026 09:00", createdBy: "Phạm Thu Hà", status: "signed", signedAt: "20/05/2026 09:42", ip: "10.30.5.12", termsId: "tm2", termsVersion: 1 },
    { id: "BB-2026-0110", kind: "return", employeeId: "e14", assetIds: ["a23"], accessories: [["Tai nghe Jabra Evolve2 30", 1]], createdAt: "30/09/2026 16:30", createdBy: "Phạm Thu Hà", status: "signed", signedAt: "30/09/2026 16:41", ip: "10.10.1.25", termsId: "tm2", termsVersion: 1 },
    { id: "BB-2026-0101", kind: "issue", employeeId: "e1", assetIds: ["a1"], accessories: [], createdAt: "14/03/2025 08:30", createdBy: "Trần Minh Quân", status: "signed", signedAt: "14/03/2025 08:55", ip: "10.10.3.21", termsId: "tm2", termsVersion: 1 },
  ];
  M.HANDOVER_KIND = { issue: "Cấp phát", return: "Thu hồi", transfer: "Điều chuyển" };
  M.HANDOVER_ST = { pending: ["Chờ ký", "warn"], signed: ["Đã ký", "ok"], rejected: ["Từ chối", "bad"], overdue: ["Quá hạn ký", "bad"] };

  /* NV-2.1.3: phụ kiện quản lý theo số lượng, có thu hồi */
  D.accessories = [
    { id: "ac1", name: "Chuột Logitech M331 Silent", kind: "Chuột", location: "l7", total: 40, stock: 12, min: 5, holdings: [["e1", 1], ["e5", 1], ["e7", 1], ["e2", 1], ["e9", 1], ["e10", 1]] },
    { id: "ac2", name: "Bàn phím Logitech K120", kind: "Bàn phím", location: "l7", total: 30, stock: 9, min: 5, holdings: [["e1", 1], ["e8", 1], ["e7", 1]] },
    { id: "ac3", name: "Tai nghe Jabra Evolve2 30", kind: "Tai nghe", location: "l7", total: 15, stock: 3, min: 3, holdings: [["e5", 1], ["e3", 1], ["e12", 1]] },
    { id: "ac4", name: "Dock Dell WD19S", kind: "Dock sạc", location: "l7", total: 12, stock: 4, min: 2, holdings: [["e5", 1], ["e10", 1], ["e7", 1]] },
    { id: "ac5", name: "Sạc USB-C 65W", kind: "Sạc", location: "l12", total: 20, stock: 7, min: 3, holdings: [["e8", 1], ["e13", 1]] },
  ];

  /* NT-6: thông báo trong ứng dụng */
  D.notifications = [
    { id: "n1", at: "27/11/2026 14:12", kind: "bad", title: "Lỗ hổng Critical mới: CVE-2026-21410 (OpenSSH)", body: "Ảnh hưởng 3 máy, gồm SRV-ERP-01.", href: "#/vulns/CVE-2026-21410", read: false, roles: ["admin", "infra", "audit"] },
    { id: "n2", at: "27/11/2026 10:03", kind: "warn", title: "Ticket T-1045 sắp vi phạm SLA giải quyết", body: "Còn 45 phút. Người xử lý: Nguyễn Đức Anh.", href: "#/tickets/T-1045", read: false, roles: ["admin", "helpdesk"] },
    { id: "n3", at: "27/11/2026 08:30", kind: "warn", title: "Mực in HP 76A dưới ngưỡng tồn", body: "Còn 2 hộp, ngưỡng tối thiểu 5.", href: "#/consumables", read: false, roles: ["admin", "asset"] },
    { id: "n4", at: "26/11/2026 16:40", kind: "info", title: "Nhân viên Lê Văn Tùng sẽ nghỉ việc ngày 05/12/2026", body: "Đã tạo ticket thu hồi T-1047 từ HRM.", href: "#/tickets/T-1047", read: false, roles: ["admin", "asset", "helpdesk"] },
    { id: "n5", at: "26/11/2026 09:00", kind: "warn", title: "Bản quyền Adobe Acrobat Pro thiếu 2 ghế", body: "Cài thực tế 12, ghế còn hiệu lực 10.", href: "#/licenses/compliance", read: true, roles: ["admin", "asset", "audit"] },
    { id: "n6", at: "25/11/2026 07:00", kind: "warn", title: "Bảo hành TS-000004 còn 45 ngày", body: "Dell OptiPlex 7010 tại Phòng 301, hết hạn 10/01/2027.", href: "#/warranty", read: true, roles: ["admin", "asset"] },
    { id: "n7", at: "24/11/2026 15:20", kind: "info", title: "Phần cứng thay đổi trên KT-PC-301", body: "RAM 16 GB → 8 GB, không có ticket nâng cấp.", href: "#/discovery/changes", read: true, roles: ["admin", "infra"] },
    { id: "n8", at: "27/11/2026 09:10", kind: "warn", title: "Bạn có biên bản bàn giao chờ ký", body: "BB-2026-0118: ThinkPad T14 Gen 4 và màn hình P2422H.", href: "#/portal/handovers/BB-2026-0118", read: false, roles: ["employee"] },
    { id: "n9", at: "26/11/2026 17:05", kind: "info", title: "Yêu cầu T-1043 đã được giải quyết", body: "Kỹ thuật viên đã cài lại máy in mạng. Bấm để xác nhận hoặc mở lại.", href: "#/portal/requests", read: false, roles: ["employee"] },
  ];
})();
