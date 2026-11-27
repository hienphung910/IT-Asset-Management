/* Mockup ITAM - Module 5: Tài chính, hợp đồng và bảo hành.
   Màn hình: nhà cung cấp, đơn mua (nhận hàng tạo tài sản), hợp đồng, chứng từ đính kèm,
   bảo hành (tra theo serial, cảnh báo mốc 90/60/30), khấu hao đường thẳng.
   Xuất M.residual(asset) để trang chi tiết tài sản dùng lại. */
(function () {
  "use strict";
  const D = M.data;

  /* ===================== Ngày tháng ===================== */
  const TODAY = new Date(2026, 10, 27);
  const NOW = "27/11/2026 15:20";
  const pd = (s) => {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(s || ""));
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  };
  const daysLeft = (s) => { const d = pd(s); return d ? Math.round((d - TODAY) / 86400000) : null; };
  const fmtD = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  const iso2vn = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
  const monthsBetween = (a, b) => {
    let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    if (b.getDate() < a.getDate()) m--;
    return Math.max(0, m);
  };
  const plusYear = (s, n) => { const d = pd(s); return d ? fmtD(new Date(d.getFullYear() + n, d.getMonth(), d.getDate())) : s; };
  const fmtSize = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const dash = '<span class="muted">—</span>';

  /* ===================== Dữ liệu mẫu ===================== */
  D.purchases = [
    { id: "PO-2026-051", vendorId: "v1", date: "24/11/2026", costCenter: "KD-HN - Phòng Kinh doanh", status: "ordered", createdBy: "Phạm Thu Hà", note: "Trang bị cho 5 nhân viên kinh doanh tuyển mới tháng 12",
      lines: [
        { item: "Laptop Dell Latitude 5440 (i5-1345U, 16 GB, 512 GB)", model: "m1", qty: 5, price: 28900000, assetIds: [] },
        { item: "Màn hình Dell P2422H 24 inch", model: "m6", qty: 5, price: 4790000, assetIds: [] },
        { item: "Dock Dell WD19S (phụ kiện)", model: null, qty: 5, price: 5200000, assetIds: [], accessory: "ac4", received: 0 },
      ],
      attachments: [{ name: "BaoGia-HT-2026-118.pdf", size: "286 KB", kind: "Báo giá", by: "Phạm Thu Hà", at: "22/11/2026 10:15" }] },
    { id: "PO-2026-049", vendorId: "v5", date: "20/11/2026", costCenter: "IT-HN - Phòng IT", status: "draft", createdBy: "Phạm Thu Hà", note: "Mua thêm 2 ghế Adobe Acrobat Pro do đối chiếu bản quyền báo thiếu",
      lines: [{ item: "Adobe Acrobat Pro (thuê bao 12 tháng)", model: null, qty: 2, price: 5350000, assetIds: [], license: true }],
      attachments: [] },
    { id: "PO-2026-044", vendorId: "v2", date: "15/11/2026", costCenter: "IT-HN - Phòng IT", status: "received", createdBy: "Phạm Thu Hà", note: "Máy dự phòng cho nhân viên mới và cấp thay thế tạm",
      lines: [
        { item: "Laptop HP EliteBook 840 G10 (i5, 16 GB, 512 GB)", model: "m3", qty: 2, price: 29900000, assetIds: ["a10", "a11"] },
        { item: "Túi chống sốc HP 14 inch (phụ kiện)", model: null, qty: 2, price: 450000, assetIds: [], accessory: "ac5", received: 2 },
      ],
      attachments: [
        { name: "HoaDon-0001842-SaoMai.pdf", size: "412 KB", kind: "Hóa đơn", by: "Phạm Thu Hà", at: "18/11/2026 09:02" },
        { name: "BienBanGiaoNhan-15-11-2026.pdf", size: "198 KB", kind: "Biên bản giao nhận", by: "Phạm Thu Hà", at: "18/11/2026 09:03" },
      ] },
    { id: "PO-2026-018", vendorId: "v2", date: "18/05/2026", costCenter: "KD-HCM - Kinh doanh miền Nam", status: "received", createdBy: "Phạm Thu Hà",
      lines: [
        { item: "Laptop HP EliteBook 840 G10", model: "m3", qty: 1, price: 30500000, assetIds: ["a20"] },
        { item: "Máy tính để bàn Dell OptiPlex 7010", model: "m5", qty: 1, price: 19500000, assetIds: ["a21"] },
      ],
      attachments: [{ name: "HoaDon-0000977-SaoMai.pdf", size: "355 KB", kind: "Hóa đơn", by: "Phạm Thu Hà", at: "20/05/2026 14:40" }] },
    { id: "PO-2025-077", vendorId: "v2", date: "28/09/2025", costCenter: "KD-HN - Phòng Kinh doanh", status: "received", createdBy: "Phạm Thu Hà",
      lines: [
        { item: "Laptop Lenovo ThinkPad T14 Gen 4", model: "m2", qty: 3, price: 31200000, assetIds: ["a2", "a14", "a22"] },
        { item: "Màn hình Dell P2422H", model: "m6", qty: 2, price: 4890000, assetIds: ["a3", "a19"] },
      ],
      attachments: [{ name: "HoaDon-0000531-SaoMai.pdf", size: "301 KB", kind: "Hóa đơn", by: "Phạm Thu Hà", at: "30/09/2025 08:45" }] },
    { id: "PO-2025-052", vendorId: "v4", date: "05/07/2025", costCenter: "MKT-HN - Phòng Marketing", status: "received", createdBy: "Phạm Thu Hà",
      lines: [{ item: "Laptop Apple MacBook Air M2 13 inch", model: "m4", qty: 2, price: 27490000, assetIds: ["a13", "a23"] }],
      attachments: [] },
    { id: "PO-2025-031", vendorId: "v1", date: "12/03/2025", costCenter: "IT-HN - Phòng IT", status: "received", createdBy: "Trần Minh Quân",
      lines: [{ item: "Laptop Dell Latitude 5440", model: "m1", qty: 5, price: 28500000, assetIds: ["a1", "a12", "a17", "a18", "a24"] }],
      attachments: [{ name: "HoaDon-HT-2025-0311.pdf", size: "520 KB", kind: "Hóa đơn", by: "Trần Minh Quân", at: "14/03/2025 10:00" }] },
    { id: "PO-2024-003", vendorId: "v3", date: "19/01/2024", costCenter: "IT-HN - Phòng IT", status: "received", createdBy: "Trần Minh Quân",
      lines: [
        { item: "Switch Cisco Catalyst 9200-24P", model: "m8", qty: 1, price: 62000000, assetIds: ["a7"] },
        { item: "Tường lửa FortiGate 100F", model: "m9", qty: 1, price: 89000000, assetIds: ["a8"] },
        { item: "Bộ lưu điện APC Smart-UPS 1500", model: "m11", qty: 1, price: 14500000, assetIds: ["a16"] },
      ],
      attachments: [{ name: "HopDong-MLV-2024-01.pdf", size: "1,4 MB", kind: "Hợp đồng", by: "Trần Minh Quân", at: "20/01/2024 16:10" }] },
    { id: "PO-2024-002", vendorId: "v1", date: "18/01/2024", costCenter: "IT-HN - Phòng IT", status: "received", createdBy: "Trần Minh Quân",
      lines: [{ item: "Máy chủ Dell PowerEdge R650", model: "m7", qty: 2, price: 256500000, assetIds: ["a5", "a6"] }],
      attachments: [] },
  ];
  M.PO_STATUS = { draft: ["Nháp", "mute"], ordered: ["Chờ nhận hàng", "warn"], partial: ["Nhận một phần", "info"], received: ["Đã nhận đủ", "ok"] };

  D.contracts = [
    { id: "HD-2023-011", no: "11/2023/MLV-BT", name: "Bảo trì UPS và điều hòa phòng máy", type: "maintenance", vendorId: "v3", start: "01/12/2023", end: "30/11/2026", value: 18000000, renewal: "Gia hạn theo năm, báo trước 30 ngày", assetIds: ["a16"], licenseIds: [], attachments: [], renewals: [] },
    { id: "HD-2024-007", no: "07/2024/MLV-BT", name: "Bảo trì SmartNet và FortiCare hạ tầng mạng", type: "maintenance", vendorId: "v3", start: "19/01/2024", end: "19/01/2027", value: 38500000, renewal: "Gia hạn theo năm, báo trước 30 ngày", assetIds: ["a7", "a8"], licenseIds: [],
      attachments: [{ name: "HD-07-2024-MLV.pdf", size: "2,1 MB", kind: "Hợp đồng", by: "Trần Minh Quân", at: "22/01/2024 09:30" }], renewals: [] },
    { id: "HD-2024-002", no: "02/2024/HT-PS", name: "ProSupport Plus máy chủ ERP và ảo hóa", type: "support", vendorId: "v1", start: "18/01/2024", end: "18/01/2029", value: 52000000, renewal: "Không tự gia hạn", assetIds: ["a5", "a6"], licenseIds: [],
      attachments: [{ name: "ProSupport-DPE650.pdf", size: "640 KB", kind: "Hợp đồng", by: "Trần Minh Quân", at: "19/01/2024 11:00" }], renewals: [] },
    { id: "HD-2024-001", no: "01/2024/HT-MB", name: "Mua máy chủ và thiết bị phòng máy", type: "purchase", vendorId: "v1", start: "10/01/2024", end: "31/03/2024", value: 513000000, renewal: "Không áp dụng", assetIds: ["a5", "a6"], licenseIds: [], attachments: [], renewals: [] },
    { id: "HD-2025-009", no: "09/2025/HT-PS", name: "Bảo hành mở rộng ProSupport cho laptop Latitude", type: "support", vendorId: "v1", start: "12/03/2025", end: "12/03/2028", value: 24000000, renewal: "Không tự gia hạn", assetIds: ["a1", "a12", "a17", "a18", "a24"], licenseIds: [], attachments: [], renewals: [] },
    { id: "HD-2025-014", no: "14/2025/SM-TH", name: "Thuê máy photocopy đa năng tầng 5", type: "lease", vendorId: "v2", start: "01/06/2025", end: "31/05/2027", value: 86400000, renewal: "Tự gia hạn 12 tháng nếu không báo hủy", assetIds: [], licenseIds: [], note: "Thiết bị thuê do bên cho thuê sở hữu, không phải tài sản của công ty.", attachments: [], renewals: [] },
    { id: "HD-2026-003", no: "03/2026/BQV", name: "Cung cấp bản quyền phần mềm năm 2026", type: "lease", vendorId: "v5", start: "01/01/2026", end: "31/12/2026", value: 186000000, renewal: "Gia hạn theo năm", assetIds: [], licenseIds: ["L-03"],
      attachments: [{ name: "HD-03-2026-BQV.pdf", size: "980 KB", kind: "Hợp đồng", by: "Phạm Thu Hà", at: "05/01/2026 15:20" }], renewals: [["31/12/2025", "31/12/2026", 172000000, "Phạm Thu Hà"]] },
  ];
  M.CONTRACT_TYPE = { purchase: "Mua", lease: "Thuê", maintenance: "Bảo trì", support: "Hỗ trợ" };

  /* Lịch sử sửa đơn giá (đồng thời ghi vào nhật ký kiểm toán NT-5) */
  D.priceChanges = [
    { po: "PO-2025-031", item: "Laptop Dell Latitude 5440", from: 28900000, to: 28500000, by: "Trần Minh Quân", at: "20/03/2025 10:12", reason: "Nhà cung cấp giảm giá theo hóa đơn điều chỉnh" },
  ];

  const COST_CENTERS = ["IT-HN - Phòng IT", "KD-HN - Phòng Kinh doanh", "KD-HCM - Kinh doanh miền Nam", "MKT-HN - Phòng Marketing", "KT-HN - Phòng Kế toán", "NS-HN - Phòng Nhân sự"];

  /* ===================== Khấu hao (dùng chung) ===================== */
  /* Đường thẳng: giá trị còn lại = giá mua − giá mua × tháng đã dùng ÷ tháng khấu hao, không âm.
     Tài sản đã thanh lý chốt tại ngày thanh lý. Thiếu dữ liệu thì trả null. */
  M.residual = (a) => {
    if (!a || !a.purchase || !a.purchase.date || a.purchase.cost == null) return null;
    const cat = M.assetCat(a);
    if (!cat || !cat.depMonths) return null;
    const start = pd(a.purchase.date);
    if (!start) return null;
    const end = a.status === "archived" && a.disposal && pd(a.disposal.date) ? pd(a.disposal.date) : TODAY;
    const months = monthsBetween(start, end);
    const cost = a.purchase.cost;
    const value = Math.max(0, Math.round(cost - (cost * months) / cat.depMonths));
    return { value, months, depMonths: cat.depMonths, cost, pct: cost ? value / cost : 0, frozen: a.status === "archived" };
  };

  /* ===================== Tiện ích ===================== */
  const poTotal = (po) => po.lines.reduce((s, l) => s + l.qty * l.price, 0);
  const lineReceived = (l) => (l.model ? l.assetIds.length : l.received || 0);
  const poQty = (po) => po.lines.reduce((s, l) => s + l.qty, 0);
  const poReceived = (po) => po.lines.reduce((s, l) => s + lineReceived(l), 0);
  const priceCell = (v) => (M.can("finance.view") ? `<span class="mono">${M.esc(M.money(v))}</span>` : '<span class="muted">Ẩn</span>');
  const vendorLink = (id) => { const v = M.vendor(id); return v ? `<a href="#/vendors/${M.esc(v.id)}">${M.esc(v.name)}</a>` : dash; };
  const daysPill = (d, expiredText) => {
    if (d == null) return dash;
    if (d < 0) return M.pill(expiredText ? expiredText.replace("{n}", -d) : `Đã hết ${-d} ngày`, "mute");
    if (d <= 30) return M.pill(`Còn ${d} ngày`, "bad");
    if (d <= 90) return M.pill(`Còn ${d} ngày`, "warn");
    return M.pill(`Còn ${d} ngày`, "ok");
  };
  const tapes = (ids) => (ids && ids.length ? `<span class="row">${ids.map((id) => { const a = M.asset(id); return a ? M.tape(a.tag, a.id) : ""; }).join("")}</span>` : dash);
  const nextAssetId = () => {
    const n = D.assets.reduce((m, a) => Math.max(m, parseInt(String(a.id).replace(/\D/g, ""), 10) || 0), 0) + 1;
    return { id: "a" + n, tag: "TS-" + String(n).padStart(6, "0") };
  };
  const licName = (id) => { const l = (D.licenses || []).find((x) => x.id === id); return l ? (l.software || l.name || l.id) : id; };

  /* Khối chứng từ đính kèm (NV-5.1.4), dùng cho đơn mua và hợp đồng */
  const attachPanel = (owner, key) => M.panel({
    title: `Chứng từ đính kèm (${owner.attachments.length})`,
    actions: M.btn("Tải lên", { sm: true, icon: "upload", modal: "fin-attach", arg: key, perm: "finance.manage" }),
    flush: true,
    body: M.table({
      cols: [
        { h: "Tệp", r: (f) => `<span class="row">${M.icon("paperclip")}<b>${M.esc(f.name)}</b></span>` },
        { h: "Loại", r: (f) => M.esc(f.kind) },
        { h: "Dung lượng", r: (f) => `<span class="mono">${M.esc(f.size)}</span>` },
        { h: "Người tải lên", r: (f) => `${M.esc(f.by)}<div class="cell-sub">${M.esc(f.at)}</div>` },
        { h: "", cls: "right", r: (f) => M.btn("Tải về", { sm: true, ghost: true, icon: "download", msg: `Đang tải ${f.name} (mockup).` }) },
      ],
      rows: owner.attachments,
      empty: "Chưa có chứng từ nào. Tải lên bản scan hóa đơn, hợp đồng hoặc biên bản.",
    }),
  });

  M.defModal("fin-attach", (key) => {
    const [kind, id] = String(key).split(":");
    const owner = kind === "po" ? M.find("purchases", id) : M.find("contracts", id);
    return {
      title: `Tải lên chứng từ cho ${id}`,
      body: `${M.field("Tệp", `<input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx">`, { req: true, hint: "PDF, JPG, PNG, XLSX, DOCX, tối đa 10 MB" })}
        ${M.field("Loại chứng từ", M.select("kind", ["Hóa đơn", "Hợp đồng", "Biên bản giao nhận", "Báo giá", "Khác"], "Hóa đơn"))}`,
      submit: "Tải lên",
      onSubmit(data, form) {
        const f = data.file;
        if (!f || !f.name) return M.invalid(form, "file", "Chọn tệp cần tải lên.");
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        if (!["pdf", "jpg", "jpeg", "png", "xlsx", "docx"].includes(ext)) return M.invalid(form, "file", `Tệp .${ext} không được nhận. Chỉ nhận PDF, JPG, PNG, XLSX, DOCX.`);
        if (f.size > 10 * 1048576) return M.invalid(form, "file", `Tệp ${f.name} (${fmtSize(f.size)}) vượt quá 10 MB nên bị từ chối.`);
        owner.attachments.push({ name: f.name, size: fmtSize(f.size), kind: data.kind, by: M.me().user, at: NOW });
        return `Đã tải lên ${f.name} vào ${id}.`;
      },
    };
  });

  /* ===================== NV-5.1.1: Nhà cung cấp ===================== */
  const vendorStats = (v) => ({
    assets: D.assets.filter((a) => a.purchase && a.purchase.vendorId === v.id),
    pos: D.purchases.filter((p) => p.vendorId === v.id),
    contracts: D.contracts.filter((c) => c.vendorId === v.id),
    licenses: (D.licenses || []).filter((l) => l.vendorId === v.id),
  });

  M.defModal("vendor-form", (id) => {
    const v = id ? M.vendor(id) : {};
    return {
      title: id ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp",
      wide: true,
      body: `<div class="form-grid">
        ${M.field("Tên nhà cung cấp", M.input("name", { value: v.name, req: true }), { req: true, full: true })}
        ${M.field("Mã số thuế", M.input("taxCode", { value: v.taxCode, ph: "0101234567" }))}
        ${M.field("Người liên hệ", M.input("contact", { value: v.contact }))}
        ${M.field("Điện thoại", M.input("phone", { value: v.phone }))}
        ${M.field("Email", M.input("email", { value: v.email, type: "email", ph: "ten@congty.vn" }))}
        ${M.field("Địa chỉ", M.input("address", { value: v.address }), { full: true })}
        ${M.field("Ghi chú", M.textarea("note", v.note, { rows: 2 }), { full: true })}
      </div>`,
      submit: id ? "Lưu thay đổi" : "Thêm nhà cung cấp",
      onSubmit(data, form) {
        const name = (data.name || "").trim();
        if (!name) return M.invalid(form, "name", "Nhập tên nhà cung cấp.");
        const dup = D.vendors.find((x) => x.id !== id && M.fold(x.name) === M.fold(name));
        if (dup) return M.invalid(form, "name", `Đã có nhà cung cấp "${dup.name}".`);
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) return M.invalid(form, "email", "Email không hợp lệ. Nhập theo dạng ten@congty.vn.");
        const rec = { name, taxCode: data.taxCode.trim(), contact: data.contact.trim(), phone: data.phone.trim(), email: data.email.trim().toLowerCase(), address: data.address.trim(), note: data.note.trim() };
        if (id) { Object.assign(v, rec); return "Đã lưu thay đổi"; }
        D.vendors.push(Object.assign({ id: "v" + (D.vendors.length + 1), active: true }, rec));
        return `Đã thêm nhà cung cấp ${name}`;
      },
    };
  });
  M.action("vendor-toggle", (el, id) => {
    const v = M.vendor(id);
    v.active = !v.active;
    M.refresh();
    return v.active ? `Đã dùng lại nhà cung cấp ${v.name}` : `Đã ngừng dùng ${v.name}. Nhà cung cấp này không chọn được cho đơn mua mới.`;
  });

  M.screen("vendors", {
    nav: "vendors", title: "Nhà cung cấp", codes: ["NV-5.1.1"],
    render() {
      const rows = D.vendors.slice().sort((a, b) => (b.active - a.active) || a.name.localeCompare(b.name, "vi"));
      return M.page({
        title: "Nhà cung cấp",
        codes: ["NV-5.1.1"],
        actions: M.btn("Thêm nhà cung cấp", { primary: true, icon: "plus", modal: "vendor-form", perm: "finance.manage" }),
        body: M.stats([
          { label: "Đang dùng", value: D.vendors.filter((v) => v.active).length, tone: "ok" },
          { label: "Ngừng dùng", value: D.vendors.filter((v) => !v.active).length, tone: "mute" },
          { label: "Đơn mua năm 2026", value: D.purchases.filter((p) => /2026$/.test(p.date)).length, tone: "info", href: "#/purchases" },
          { label: "Hợp đồng còn hiệu lực", value: D.contracts.filter((c) => daysLeft(c.end) >= 0).length, tone: "accent", href: "#/contracts" },
        ]) + M.panel({
          flush: true,
          body: M.toolbar(M.searchBox("vendor-table", "Tìm theo tên, mã số thuế, người liên hệ")) + M.table({
            id: "vendor-table",
            href: (v) => "#/vendors/" + v.id,
            cols: [
              { h: "Nhà cung cấp", r: (v) => `<div class="cell-name">${M.esc(v.name)}</div><div class="cell-sub">MST ${M.esc(v.taxCode)}${v.note ? " - " + M.esc(v.note) : ""}</div>` },
              { h: "Người liên hệ", r: (v) => `${M.esc(v.contact)}<div class="cell-sub">${M.esc(v.phone)}</div>` },
              { h: "Email", r: (v) => `<span class="mono small">${M.esc(v.email)}</span>` },
              { h: "Tài sản đã mua", cls: "right", r: (v) => `<span class="mono">${vendorStats(v).assets.length}</span>` },
              { h: "Hợp đồng", cls: "right", r: (v) => `<span class="mono">${vendorStats(v).contracts.length}</span>` },
              { h: "Trạng thái", r: (v) => (v.active ? M.pill("Đang dùng", "ok") : M.pill("Ngừng dùng", "mute")) },
            ],
            rows,
          }),
        }),
      });
    },
  });

  M.screen("vendors/:id", {
    nav: "vendors", title: "Nhà cung cấp", codes: ["NV-5.1.1"],
    render({ id }) {
      const v = M.vendor(id);
      if (!v) return M.page({ title: "Không tìm thấy nhà cung cấp", back: ["#/vendors", "Nhà cung cấp"] });
      const s = vendorStats(v);
      const spent = s.pos.reduce((t, p) => t + poTotal(p), 0);
      const assetTable = M.table({
        href: (a) => "#/assets/" + a.id,
        cols: [
          { h: "Mã tài sản", r: (a) => M.tape(a.tag, a.id) },
          { h: "Tài sản", r: (a) => `<div class="cell-name">${M.esc(a.name)}</div>` },
          { h: "Đơn mua", r: (a) => `<a href="#/purchases/${M.esc(a.purchase.po)}" class="mono">${M.esc(a.purchase.po)}</a>` },
          { h: "Ngày mua", r: (a) => M.esc(a.purchase.date) },
          { h: "Giá mua", cls: "right", r: (a) => priceCell(a.purchase.cost) },
          { h: "Trạng thái", r: (a) => M.led(a.status) },
        ],
        rows: s.assets,
        empty: "Chưa mua tài sản nào của nhà cung cấp này.",
      });
      const poTable = M.table({
        href: (p) => "#/purchases/" + p.id,
        cols: [
          { h: "Số PO", r: (p) => `<b class="mono">${M.esc(p.id)}</b>` },
          { h: "Ngày mua", r: (p) => M.esc(p.date) },
          { h: "Trung tâm chi phí", r: (p) => M.esc(p.costCenter) },
          { h: "Giá trị", cls: "right", r: (p) => priceCell(poTotal(p)) },
          { h: "Trạng thái", r: (p) => M.pill(...M.PO_STATUS[p.status]) },
        ],
        rows: s.pos,
        empty: "Chưa có đơn mua nào.",
      });
      const ctTable = M.table({
        href: (c) => "#/contracts/" + c.id,
        cols: [
          { h: "Hợp đồng", r: (c) => `<div class="cell-name">${M.esc(c.name)}</div><div class="cell-sub mono">${M.esc(c.no)}</div>` },
          { h: "Loại", r: (c) => M.esc(M.CONTRACT_TYPE[c.type]) },
          { h: "Hiệu lực", r: (c) => `${M.esc(c.start)} → ${M.esc(c.end)}` },
          { h: "Còn lại", r: (c) => daysPill(daysLeft(c.end), "Hết hiệu lực") },
        ],
        rows: s.contracts,
        empty: "Chưa có hợp đồng nào.",
      });
      const licTable = M.table({
        cols: [
          { h: "Bản quyền", r: (l) => `<a href="#/licenses/${M.esc(l.id)}">${M.esc(l.software || l.name || l.id)}</a>` },
          { h: "Số ghế", cls: "right", r: (l) => `<span class="mono">${M.esc(l.seats != null ? l.seats : "—")}</span>` },
          { h: "Hết hạn", r: (l) => M.esc(l.expires || "—") },
        ],
        rows: s.licenses,
        empty: "Chưa ghi nhận bản quyền nào mua của nhà cung cấp này.",
      });
      return M.page({
        back: ["#/vendors", "Nhà cung cấp"],
        title: M.esc(v.name),
        sub: v.active ? "" : "Đã ngừng dùng, không chọn được cho đơn mua mới.",
        codes: ["NV-5.1.1"],
        actions: M.btn("Sửa thông tin", { icon: "pen", modal: "vendor-form", arg: v.id, perm: "finance.manage" })
          + (M.can("finance.manage") ? (v.active
            ? M.btn("Ngừng dùng", { act: "vendor-toggle", arg: v.id, confirm: `Ngừng dùng nhà cung cấp ${v.name}? Nhà cung cấp đã có giao dịch nên không xóa được; sau khi ngừng dùng sẽ không chọn được cho đơn mua mới.` })
            : M.btn("Dùng lại", { act: "vendor-toggle", arg: v.id })) : ""),
        body: `<div class="side-layout">
          <div class="stack">
            ${M.panel({ flush: true, body: M.tabs("vendor-" + v.id, [
              { key: "assets", label: "Tài sản", n: s.assets.length, body: assetTable },
              { key: "pos", label: "Đơn mua", n: s.pos.length, body: poTable },
              { key: "contracts", label: "Hợp đồng", n: s.contracts.length, body: ctTable },
              { key: "licenses", label: "Bản quyền", n: s.licenses.length, body: licTable },
            ]) })}
          </div>
          <div class="stack">
            ${M.panel({ title: "Thông tin", body: M.kv([
              ["Trạng thái", v.active ? M.pill("Đang dùng", "ok") : M.pill("Ngừng dùng", "mute")],
              ["Mã số thuế", `<span class="mono">${M.esc(v.taxCode)}</span>`],
              ["Địa chỉ", M.esc(v.address)],
              ["Người liên hệ", M.esc(v.contact)],
              ["Điện thoại", M.esc(v.phone)],
              ["Email", `<span class="mono small">${M.esc(v.email)}</span>`],
              v.note ? ["Ghi chú", M.esc(v.note)] : null,
              M.can("finance.view") ? ["Tổng giá trị đơn mua", `<span class="mono">${M.esc(M.money(spent))}</span>`] : null,
            ]) })}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== NV-5.1.2: Đơn mua ===================== */
  M.defModal("po-new", () => {
    const n = D.purchases.reduce((m, p) => { const x = /^PO-2026-(\d+)$/.exec(p.id); return x ? Math.max(m, +x[1]) : m; }, 0) + 1;
    const next = "PO-2026-" + String(n).padStart(3, "0");
    return {
      title: "Lập đơn mua",
      wide: true,
      body: `<div class="form-grid">
        ${M.field("Nhà cung cấp", M.select("vendorId", D.vendors.filter((v) => v.active).map((v) => [v.id, v.name]), "", { blank: "Chọn nhà cung cấp" }), { req: true })}
        ${M.field("Số đơn đặt hàng (PO)", M.input("id", { value: next }), { req: true })}
        ${M.field("Ngày mua", M.input("date", { type: "date", value: "2026-11-27" }), { req: true })}
        ${M.field("Trung tâm chi phí", M.select("costCenter", COST_CENTERS, COST_CENTERS[0]))}
        <div class="form-section">Dòng hàng đầu tiên</div>
        ${M.field("Mặt hàng", M.input("item", { ph: "Laptop Dell Latitude 5440 (i5, 16 GB, 512 GB)" }), { req: true, full: true })}
        ${M.field("Model tài sản", M.select("model", D.models.filter((m) => !m.dirty).map((m) => [m.id, `${m.maker} ${m.name}`]), "", { blank: "Không tạo tài sản (phụ kiện, bản quyền…)" }))}
        ${M.field("Số lượng", M.input("qty", { type: "number", value: 1, attrs: 'min="1"' }), { req: true })}
        ${M.field("Đơn giá (₫)", M.input("price", { type: "number", ph: "28900000", attrs: 'min="0" step="1000"' }), { req: true })}
      </div>`,
      submit: "Lập đơn mua",
      onSubmit(data, form) {
        if (!data.vendorId) return M.invalid(form, "vendorId", "Chọn nhà cung cấp.");
        const id = data.id.trim().toUpperCase();
        if (!id) return M.invalid(form, "id", "Nhập số PO.");
        if (D.purchases.some((p) => p.id === id)) return M.invalid(form, "id", `Số PO ${id} đã có trong hệ thống.`);
        if (!data.date) return M.invalid(form, "date", "Nhập ngày mua.");
        if (!data.item.trim()) return M.invalid(form, "item", "Nhập mặt hàng.");
        const qty = parseInt(data.qty, 10);
        if (!(qty > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
        const price = Number(data.price);
        if (data.price === "" || !(price >= 0)) return M.invalid(form, "price", "Nhập đơn giá.");
        D.purchases.unshift({ id, vendorId: data.vendorId, date: iso2vn(data.date), costCenter: data.costCenter, status: "ordered", createdBy: M.me().user, attachments: [],
          lines: [{ item: data.item.trim(), model: data.model || null, qty, price, assetIds: [], received: 0 }] });
        return `Đã lập đơn mua ${id}`;
      },
    };
  });

  M.screen("purchases", {
    nav: "purchases", title: "Đơn mua", codes: ["NV-5.1.2"],
    render() {
      const waiting = D.purchases.filter((p) => p.status === "ordered" || p.status === "partial");
      const y2026 = D.purchases.filter((p) => /2026$/.test(p.date));
      return M.page({
        title: "Đơn mua",
        codes: ["NV-5.1.2", "NV-5.1.4"],
        actions: M.btn("Lập đơn mua", { primary: true, icon: "plus", modal: "po-new", perm: "finance.manage" }),
        body: M.stats([
          { label: "Chờ nhận hàng", value: waiting.length, tone: "warn" },
          { label: "Đơn mua năm 2026", value: y2026.length, tone: "info" },
          ...(M.can("finance.view") ? [{ label: "Tổng chi năm 2026", value: M.money(y2026.reduce((t, p) => t + poTotal(p), 0)), tone: "accent" }] : []),
          { label: "Tài sản đã tạo từ đơn mua", value: D.purchases.reduce((t, p) => t + p.lines.reduce((s, l) => s + l.assetIds.length, 0), 0), tone: "ok" },
        ]) + M.panel({
          flush: true,
          body: M.toolbar(M.searchBox("po-table", "Tìm theo số PO, nhà cung cấp, mặt hàng")
            + M.select("po-filter", [["", "Mọi trạng thái"], ...Object.entries(M.PO_STATUS).map(([k, v]) => [k, v[0]])], "", { attrs: 'aria-label="Lọc trạng thái" data-change="po-filter"' })) + M.table({
            id: "po-table",
            href: (p) => "#/purchases/" + p.id,
            cols: [
              { h: "Số PO", r: (p) => { const items = p.lines.map((l) => l.item).join("; "); return `<b class="mono">${M.esc(p.id)}</b><div class="cell-sub">${M.esc(items.length > 70 ? items.slice(0, 69) + "…" : items)}</div>`; } },
              { h: "Nhà cung cấp", r: (p) => vendorLink(p.vendorId) },
              { h: "Ngày mua", r: (p) => M.esc(p.date) },
              { h: "Trung tâm chi phí", r: (p) => M.esc(p.costCenter) },
              { h: "Giá trị", cls: "right", r: (p) => priceCell(poTotal(p)) },
              { h: "Trạng thái", r: (p) => `<span data-st="${p.status}">${M.pill(...M.PO_STATUS[p.status])}</span>${p.status === "ordered" || p.status === "partial" ? ` <span class="mono small">${poReceived(p)}/${poQty(p)}</span>` : ""}` },
            ],
            rows: D.purchases,
          }),
        }),
      });
    },
  });
  M.action("po-filter", (el, val) => {
    document.querySelectorAll("#po-table tbody tr").forEach((tr) => {
      const st = tr.querySelector("[data-st]");
      tr.style.display = !val || (st && st.dataset.st === val) ? "" : "none";
    });
  });

  /* Nhận hàng: tạo tài sản định danh từ dòng hàng, hoặc cộng kho phụ kiện */
  M.defModal("po-receive", (key) => {
    const [poId, idx] = String(key).split("|");
    const po = M.find("purchases", poId);
    const line = po.lines[+idx];
    const remain = line.qty - lineReceived(line);
    if (!line.model) {
      const ac = line.accessory ? M.find("accessories", line.accessory) : null;
      return {
        title: "Nhận hàng",
        body: `${M.kv([
            ["Đơn mua", `<b class="mono">${M.esc(po.id)}</b>`],
            ["Dòng hàng", M.esc(line.item)],
            ["Còn chờ nhận", `<span class="mono">${remain}</span>`],
            ac ? ["Cộng vào kho", `${M.esc(ac.name)} (đang tồn ${ac.stock})`] : line.license ? ["Cộng vào kho", "Số ghế bản quyền"] : null,
          ])}
          ${M.field("Số lượng nhận", M.input("qty", { type: "number", value: remain, attrs: `min="1" max="${remain}"` }), { req: true })}`,
        submit: "Xác nhận nhận hàng",
        onSubmit(data, form) {
          const q = parseInt(data.qty, 10);
          if (!(q > 0)) return M.invalid(form, "qty", "Số lượng nhận phải lớn hơn 0.");
          if (q > remain) return M.invalid(form, "qty", `Số lượng nhận vượt số còn chờ nhận (${remain}).`);
          line.received = (line.received || 0) + q;
          if (ac) { ac.stock += q; ac.total += q; }
          updatePoStatus(po);
          return ac ? `Đã cộng ${q} vào tồn kho phụ kiện ${ac.name}.` : `Đã nhận ${q} × ${line.item}.`;
        },
      };
    }
    const m = M.model(line.model);
    const serials = Array.from({ length: remain }, (_, i) => (m && m.maker === "Dell" ? "8KD2M" : "SN" + po.id.slice(-3)) + String(51 + i));
    return {
      title: "Nhận hàng và tạo tài sản",
      wide: true,
      body: `${M.kv([["Đơn mua", `<b class="mono">${M.esc(po.id)}</b> - ${M.esc((M.vendor(po.vendorId) || {}).name || "")}`], ["Dòng hàng", M.esc(line.item)], ["Model", m ? M.esc(m.maker + " " + m.name) : dash], ["Còn chờ nhận", `<span class="mono">${remain}</span> / ${line.qty}`]])}
        <div class="form-grid">
          ${M.field("Số lượng nhận lần này", M.input("qty", { type: "number", value: remain, attrs: `min="1" max="${remain}"` }), { req: true })}
          ${M.field("Nhập kho tại", M.select("location", D.locations.filter((l) => l.kind === "Kho").map((l) => [l.id, M.locPath(l.id)]), "l7"))}
          ${M.field("Hết bảo hành", M.input("wEnd", { type: "date", value: "2029-11-24" }))}
          ${M.field("Loại bảo hành", M.input("wType", { value: "Bảo hành 3 năm" }))}
          ${M.field("Serial", M.textarea("serials", serials.join("\n"), { rows: Math.min(6, remain + 1) }), { req: true, full: true, hint: "Mỗi dòng một serial. Mỗi serial tạo một tài sản mã TS-… tự sinh." })}
        </div>`,
      submit: "Tạo tài sản",
      onSubmit(data, form) {
        const q = parseInt(data.qty, 10);
        if (!(q > 0)) return M.invalid(form, "qty", "Số lượng nhận phải lớn hơn 0.");
        if (q > remain) return M.invalid(form, "qty", `Số lượng nhận vượt số còn chờ nhận (${remain}).`);
        const list = data.serials.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
        if (list.length !== q) return M.invalid(form, "serials", `Cần đúng ${q} serial, mỗi dòng một serial (đang có ${list.length}).`);
        const seen = new Set();
        for (const s of list) {
          if (seen.has(s.toLowerCase())) return M.invalid(form, "serials", `Serial ${s} bị lặp trong danh sách.`);
          seen.add(s.toLowerCase());
          const ex = D.assets.find((a) => a.serial && a.serial.toLowerCase() === s.toLowerCase());
          if (ex) return M.invalid(form, "serials", `Serial ${s} đã gắn với tài sản ${ex.tag}.`);
        }
        const created = [];
        list.forEach((serial) => {
          const { id, tag } = nextAssetId();
          D.assets.push({ id, tag, name: line.item.replace(/\s*\(.*\)\s*$/, ""), model: line.model, serial, status: "ready", holder: null, location: data.location, created: "27/11/2026", note: `Tạo từ đơn mua ${po.id}`, unit: "u1",
            purchase: { vendorId: po.vendorId, po: po.id, date: po.date, cost: line.price }, warranty: { end: iso2vn(data.wEnd) || "", type: data.wType, source: "Nhập tay" }, tech: null });
          line.assetIds.push(id);
          created.push(tag);
        });
        updatePoStatus(po);
        return `Đã tạo ${created.length} tài sản từ đơn ${po.id}: ${created.join(", ")}.`;
      },
    };
  });
  function updatePoStatus(po) {
    const r = poReceived(po), q = poQty(po);
    po.status = r === 0 ? (po.status === "draft" ? "draft" : "ordered") : r >= q ? "received" : "partial";
  }
  M.action("po-send", (el, id) => {
    const po = M.find("purchases", id);
    po.status = "ordered";
    M.refresh();
    return `Đã gửi đơn ${po.id} cho nhà cung cấp. Trạng thái: Chờ nhận hàng.`;
  });

  /* Sửa đơn giá: tài sản đã tính khấu hao thì ghi nhật ký kiểm toán giá cũ, giá mới */
  M.defModal("po-price", (key) => {
    const [poId, idx] = String(key).split("|");
    const po = M.find("purchases", poId);
    const line = po.lines[+idx];
    const depreciated = line.assetIds.some((id) => { const r = M.residual(M.asset(id)); return r && r.months > 0; });
    return {
      title: "Sửa đơn giá",
      body: `${M.kv([["Dòng hàng", M.esc(line.item)], ["Đơn giá hiện tại", `<span class="mono">${M.esc(M.money(line.price))}</span>`], ["Tài sản liên quan", tapes(line.assetIds)]])}
        ${M.field("Đơn giá mới (₫)", M.input("price", { type: "number", value: line.price, attrs: 'min="0" step="1000"' }), { req: true })}
        ${M.field("Lý do sửa", M.textarea("reason", "", { rows: 2, ph: "Ví dụ: hóa đơn điều chỉnh giảm giá" }), { req: true })}
        ${depreciated ? M.note("Tài sản của dòng này đã tính khấu hao. Sửa giá sẽ tính lại giá trị còn lại và ghi giá cũ, giá mới vào nhật ký kiểm toán.", "warn") : ""}`,
      submit: "Lưu đơn giá",
      onSubmit(data, form) {
        const p = Number(data.price);
        if (data.price === "" || !(p >= 0)) return M.invalid(form, "price", "Nhập đơn giá hợp lệ.");
        if (p === line.price) return M.invalid(form, "price", "Đơn giá mới đang giống đơn giá hiện tại.");
        if (!data.reason.trim()) return M.invalid(form, "reason", "Ghi lý do sửa giá.");
        D.priceChanges.unshift({ po: po.id, item: line.item, from: line.price, to: p, by: M.me().user, at: NOW, reason: data.reason.trim() });
        const old = line.price;
        line.price = p;
        line.assetIds.forEach((id) => { const a = M.asset(id); if (a && a.purchase) a.purchase.cost = p; });
        return `Đã sửa đơn giá; nhật ký kiểm toán ghi giá cũ ${M.money(old)} và giá mới ${M.money(p)}.`;
      },
    };
  });

  M.screen("purchases/:id", {
    nav: "purchases", title: "Đơn mua", codes: ["NV-5.1.2", "NV-5.1.4"],
    render({ id }) {
      const po = M.find("purchases", id);
      if (!po) return M.page({ title: "Không tìm thấy đơn mua", back: ["#/purchases", "Đơn mua"] });
      const canManage = M.can("finance.manage");
      const lines = M.table({
        cols: [
          { h: "Dòng hàng", r: (l) => `<div class="cell-name">${M.esc(l.item)}</div>${l.model ? "" : `<div class="cell-sub">${l.accessory ? "Phụ kiện" : l.license ? "Bản quyền" : "Không tạo tài sản"}</div>`}` },
          { h: "Đơn giá", cls: "right", r: (l) => priceCell(l.price) },
          { h: "Thành tiền", cls: "right", r: (l) => priceCell(l.qty * l.price) },
          { h: "Đã nhận", r: (l) => `<span class="mono">${lineReceived(l)}/${l.qty}</span>` },
          { h: "Tài sản đã tạo", cls: "wrap", r: (l) => tapes(l.assetIds) },
          { h: "", cls: "right", r: (l, i) => (canManage ? `<span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${lineReceived(l) < l.qty && po.status !== "draft" ? M.btn("Nhận hàng", { sm: true, modal: "po-receive", arg: `${po.id}|${i}` }) : ""}${M.btn("Sửa đơn giá", { sm: true, ghost: true, modal: "po-price", arg: `${po.id}|${i}` })}</span>` : "") },
        ],
        rows: po.lines,
      });
      const created = po.lines.reduce((s, l) => s.concat(l.assetIds), []);
      const changes = D.priceChanges.filter((c) => c.po === po.id);
      return M.page({
        back: ["#/purchases", "Đơn mua"],
        title: `Đơn mua <span class="mono">${M.esc(po.id)}</span>`,
        codes: ["NV-5.1.2", "NV-5.1.4"],
        actions: (po.status === "draft" && canManage ? M.btn("Gửi đơn", { primary: true, icon: "send", act: "po-send", arg: po.id }) : "")
          + (created.length ? M.btn("In tem tài sản", { icon: "printer", href: "#/labels", roles: ["admin", "asset"] }) : "")
          + M.btn("Xuất PDF", { icon: "download", msg: `Đã xuất ${po.id}.pdf (mockup).` }),
        body: `<div class="side-layout">
          <div class="stack">
            ${M.panel({ title: "Dòng hàng", flush: true, body: lines, foot: M.can("finance.view") ? `<span></span><span>Tổng cộng <b class="mono">${M.esc(M.money(poTotal(po)))}</b></span>` : "" })}
            ${attachPanel(po, "po:" + po.id)}
            ${changes.length ? M.panel({ title: "Lịch sử sửa giá", flush: true, body: M.table({
              cols: [
                { h: "Lúc", r: (c) => `<span class="mono small">${M.esc(c.at)}</span>` },
                { h: "Dòng hàng", r: (c) => M.esc(c.item) },
                { h: "Giá cũ → giá mới", r: (c) => `<span class="mono">${M.esc(M.money(c.from))} → ${M.esc(M.money(c.to))}</span>` },
                { h: "Người sửa", r: (c) => M.esc(c.by) },
                { h: "Lý do", cls: "wrap", r: (c) => M.esc(c.reason) },
              ],
              rows: changes,
            }) }) : ""}
          </div>
          <div class="stack">
            ${M.panel({ title: "Thông tin đơn", body: M.kv([
              ["Trạng thái", M.pill(...M.PO_STATUS[po.status])],
              ["Nhà cung cấp", vendorLink(po.vendorId)],
              ["Ngày mua", M.esc(po.date)],
              ["Trung tâm chi phí", M.esc(po.costCenter)],
              ["Người lập", M.esc(po.createdBy)],
              ["Đã nhận", `${M.progress(poReceived(po), poQty(po), "ok")}<span class="small">${poReceived(po)}/${poQty(po)} đơn vị</span>`],
              po.note ? ["Ghi chú", M.esc(po.note)] : null,
            ]) })}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== NV-5.1.3: Hợp đồng ===================== */
  const ctStatus = (c) => {
    const d = daysLeft(c.end);
    if (d < 0) return M.pill("Hết hiệu lực", "mute");
    if (daysLeft(c.start) > 0) return M.pill("Chưa hiệu lực", "info");
    if (d <= 30) return M.pill(`Còn ${d} ngày`, "bad");
    if (d <= 90) return M.pill(`Còn ${d} ngày`, "warn");
    return M.pill("Đang hiệu lực", "ok");
  };
  M.defModal("contract-form", () => ({
    title: "Thêm hợp đồng",
    wide: true,
    body: `<div class="form-grid">
      ${M.field("Tên hợp đồng", M.input("name", { ph: "Bảo trì máy in toàn công ty" }), { req: true, full: true })}
      ${M.field("Số hợp đồng", M.input("no", { ph: "12/2026/SM-BT" }), { req: true })}
      ${M.field("Loại", M.select("type", Object.entries(M.CONTRACT_TYPE), "maintenance"), { req: true })}
      ${M.field("Nhà cung cấp", M.select("vendorId", D.vendors.filter((v) => v.active).map((v) => [v.id, v.name]), "", { blank: "Chọn nhà cung cấp" }), { req: true })}
      ${M.field("Giá trị (₫)", M.input("value", { type: "number", attrs: 'min="0" step="1000"' }))}
      ${M.field("Ngày bắt đầu", M.input("start", { type: "date", value: "2026-12-01" }), { req: true })}
      ${M.field("Ngày kết thúc", M.input("end", { type: "date", value: "2027-11-30" }), { req: true })}
      ${M.field("Điều khoản gia hạn", M.input("renewal", { ph: "Gia hạn theo năm, báo trước 30 ngày" }), { full: true })}
      ${M.field("Gắn với tài sản", M.input("tags", { ph: "TS-000009, TS-000004" }), { full: true, hint: "Mã tài sản, cách nhau bởi dấu phẩy" })}
    </div>`,
    submit: "Thêm hợp đồng",
    onSubmit(data, form) {
      if (!data.name.trim()) return M.invalid(form, "name", "Nhập tên hợp đồng.");
      if (!data.no.trim()) return M.invalid(form, "no", "Nhập số hợp đồng.");
      if (!data.vendorId) return M.invalid(form, "vendorId", "Chọn nhà cung cấp.");
      if (!data.start) return M.invalid(form, "start", "Nhập ngày bắt đầu.");
      if (!data.end) return M.invalid(form, "end", "Nhập ngày kết thúc.");
      if (data.end < data.start) return M.invalid(form, "end", "Ngày kết thúc phải sau ngày bắt đầu.");
      const ids = [];
      for (const t of data.tags.split(",").map((s) => s.trim()).filter(Boolean)) {
        const a = M.assetByTag(t);
        if (!a) return M.invalid(form, "tags", `Không có tài sản nào mang mã ${t}.`);
        ids.push(a.id);
      }
      const id = "HD-2026-0" + String(10 + D.contracts.length);
      D.contracts.unshift({ id, no: data.no.trim(), name: data.name.trim(), type: data.type, vendorId: data.vendorId, start: iso2vn(data.start), end: iso2vn(data.end), value: Number(data.value) || 0, renewal: data.renewal.trim() || "Chưa ghi", assetIds: ids, licenseIds: [], attachments: [], renewals: [] });
      return `Đã thêm hợp đồng ${data.no.trim()}`;
    },
  }));

  M.screen("contracts", {
    nav: "contracts", title: "Hợp đồng", codes: ["NV-5.1.3", "NV-5.1.4"],
    render() {
      const live = D.contracts.filter((c) => daysLeft(c.end) >= 0);
      const soon = live.filter((c) => daysLeft(c.end) <= 90);
      const rows = D.contracts.slice().sort((a, b) => daysLeft(a.end) - daysLeft(b.end));
      const sorted = rows.filter((c) => daysLeft(c.end) >= 0).concat(rows.filter((c) => daysLeft(c.end) < 0));
      return M.page({
        title: "Hợp đồng",
        sub: "Cảnh báo trước ngày hết hạn ở các mốc 90, 60 và 30 ngày.",
        codes: ["NV-5.1.3", "NV-5.1.4"],
        actions: M.btn("Thêm hợp đồng", { primary: true, icon: "plus", modal: "contract-form", perm: "finance.manage" }),
        body: M.stats([
          { label: "Đang hiệu lực", value: live.length, tone: "ok" },
          { label: "Sắp hết hạn (≤ 90 ngày)", value: soon.length, tone: "warn" },
          { label: "Đã hết hiệu lực", value: D.contracts.length - live.length, tone: "mute" },
          ...(M.can("finance.view") ? [{ label: "Giá trị đang hiệu lực", value: M.money(live.reduce((t, c) => t + c.value, 0)), tone: "accent" }] : []),
        ]) + (soon.length ? M.note(`Cần gia hạn hoặc thay thế: ${soon.map((c) => `<b>${M.esc(c.name)}</b> (${M.esc(c.end)})`).join("; ")}.`, "warn") : "") + M.panel({
          flush: true,
          body: M.toolbar(M.searchBox("ct-table", "Tìm theo tên, số hợp đồng, nhà cung cấp")) + M.table({
            id: "ct-table",
            href: (c) => "#/contracts/" + c.id,
            cols: [
              { h: "Hợp đồng", r: (c) => `<div class="cell-name">${M.esc(c.name)}</div><div class="cell-sub mono">${M.esc(c.no)}</div>` },
              { h: "Loại", r: (c) => M.esc(M.CONTRACT_TYPE[c.type]) },
              { h: "Nhà cung cấp", r: (c) => M.esc((M.vendor(c.vendorId) || {}).name || "") },
              { h: "Hiệu lực", r: (c) => `<span class="mono small">${M.esc(c.start)} → ${M.esc(c.end)}</span>` },
              { h: "Tình trạng", r: (c) => ctStatus(c) },
              { h: "Giá trị", cls: "right", r: (c) => priceCell(c.value) },
            ],
            rows: sorted,
          }),
        }),
      });
    },
  });

  M.defModal("contract-renew", (id) => {
    const c = M.find("contracts", id);
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(c.end);
    const nextIso = m ? `${+m[3] + 1}-${m[2]}-${m[1]}` : "";
    return {
      title: "Gia hạn hợp đồng",
      body: `${M.kv([["Hợp đồng", M.esc(c.name)], ["Hết hạn hiện tại", M.esc(c.end)]])}
        ${M.field("Ngày kết thúc mới", M.input("end", { type: "date", value: nextIso }), { req: true })}
        ${M.field("Giá trị kỳ mới (₫)", M.input("value", { type: "number", value: c.value, attrs: 'min="0" step="1000"' }))}`,
      submit: "Gia hạn",
      onSubmit(data, form) {
        const newEnd = iso2vn(data.end);
        if (!newEnd) return M.invalid(form, "end", "Nhập ngày kết thúc mới.");
        if (pd(newEnd) <= pd(c.end)) return M.invalid(form, "end", "Ngày kết thúc mới phải sau ngày hết hạn hiện tại.");
        c.renewals.unshift([c.end, newEnd, Number(data.value) || c.value, M.me().user]);
        c.end = newEnd;
        c.value = Number(data.value) || c.value;
        return `Đã gia hạn ${c.no} tới ${newEnd}. Lịch sử còn giữ kỳ trước.`;
      },
    };
  });
  M.defModal("contract-link", (id) => {
    const c = M.find("contracts", id);
    return {
      title: "Gắn tài sản vào hợp đồng",
      body: `${M.kv([["Hợp đồng", M.esc(c.name)]])}${M.field("Mã tài sản", M.input("tag", { ph: "TS-000009" }), { req: true })}`,
      submit: "Gắn",
      onSubmit(data, form) {
        const a = M.assetByTag(data.tag);
        if (!a) return M.invalid(form, "tag", `Không có tài sản nào mang mã ${data.tag.trim()}.`);
        if (c.assetIds.includes(a.id)) return M.invalid(form, "tag", `${a.tag} đã thuộc hợp đồng này.`);
        c.assetIds.push(a.id);
        return `Đã gắn ${a.tag} vào hợp đồng ${c.no}. Trang tài sản hiện hợp đồng này.`;
      },
    };
  });
  M.action("contract-unlink", (el, key) => {
    const [cid, aid] = key.split("|");
    const c = M.find("contracts", cid);
    c.assetIds = c.assetIds.filter((x) => x !== aid);
    M.refresh();
    return "Đã gỡ tài sản khỏi hợp đồng.";
  });

  M.screen("contracts/:id", {
    nav: "contracts", title: "Hợp đồng", codes: ["NV-5.1.3", "NV-5.1.4"],
    render({ id }) {
      const c = M.find("contracts", id);
      if (!c) return M.page({ title: "Không tìm thấy hợp đồng", back: ["#/contracts", "Hợp đồng"] });
      const d = daysLeft(c.end);
      const marks = [90, 60, 30].map((m) => (d >= 0 && d <= m ? M.pill(`Đã gửi mốc ${m} ngày`, "warn") : M.pill(`Mốc ${m} ngày`, "mute"))).join(" ");
      return M.page({
        back: ["#/contracts", "Hợp đồng"],
        title: M.esc(c.name),
        sub: `Số <span class="mono">${M.esc(c.no)}</span> - ${M.esc(M.CONTRACT_TYPE[c.type])}`,
        codes: ["NV-5.1.3", "NV-5.1.4"],
        actions: M.btn("Gia hạn", { icon: "refresh", modal: "contract-renew", arg: c.id, perm: "finance.manage" }) + M.btn("Gắn tài sản", { icon: "link", modal: "contract-link", arg: c.id, perm: "finance.manage" }),
        body: `<div class="side-layout">
          <div class="stack">
            ${M.panel({ title: `Tài sản thuộc hợp đồng (${c.assetIds.length})`, flush: true, body: M.table({
              href: (a) => "#/assets/" + a.id,
              cols: [
                { h: "Mã tài sản", r: (a) => M.tape(a.tag, a.id) },
                { h: "Tài sản", r: (a) => `<div class="cell-name">${M.esc(a.name)}</div><div class="cell-sub">${M.esc(M.holderText(a))}</div>` },
                { h: "Serial", r: (a) => `<span class="mono">${M.esc(a.serial || "")}</span>` },
                { h: "Trạng thái", r: (a) => M.led(a.status) },
                { h: "", cls: "right", r: (a) => M.btn("Gỡ", { sm: true, ghost: true, act: "contract-unlink", arg: `${c.id}|${a.id}`, perm: "finance.manage", confirm: `Gỡ ${a.tag} khỏi hợp đồng ${c.no}?` }) },
              ],
              rows: c.assetIds.map(M.asset).filter(Boolean),
              empty: c.note || "Hợp đồng chưa gắn tài sản nào.",
            }) })}
            ${c.licenseIds.length ? M.panel({ title: `Bản quyền thuộc hợp đồng (${c.licenseIds.length})`, body: c.licenseIds.map((l) => `<a href="#/licenses/${M.esc(l)}">${M.esc(licName(l))}</a> <span class="mono small muted">${M.esc(l)}</span>`).join("<br>") }) : ""}
            ${attachPanel(c, "hd:" + c.id)}
            ${M.panel({ title: "Lịch sử gia hạn", flush: true, body: M.table({
              cols: [
                { h: "Kỳ cũ hết hạn", r: (r) => M.esc(r[0]) },
                { h: "Gia hạn tới", r: (r) => M.esc(r[1]) },
                { h: "Giá trị kỳ mới", cls: "right", r: (r) => priceCell(r[2]) },
                { h: "Người ghi nhận", r: (r) => M.esc(r[3]) },
              ],
              rows: c.renewals,
              empty: "Chưa gia hạn lần nào.",
            }) })}
          </div>
          <div class="stack">
            ${M.panel({ title: "Thông tin", body: M.kv([
              ["Tình trạng", ctStatus(c)],
              ["Bắt đầu", M.esc(c.start)],
              ["Kết thúc", M.esc(c.end)],
              ["Giá trị", priceCell(c.value)],
              ["Gia hạn", M.esc(c.renewal)],
              ["Nhà cung cấp", vendorLink(c.vendorId)],
            ]) })}
            ${M.panel({ title: "Cảnh báo trước hạn", body: `<div class="row">${marks}</div>` })}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== NV-5.2.1, NV-5.2.2: Bảo hành ===================== */
  const API_MAKERS = /^(dell|hp|lenovo)/i;
  const wtyRows = () => D.assets.filter((a) => a.warranty && a.warranty.end).map((a) => ({ a, d: daysLeft(a.warranty.end) }));
  const sourceCell = (w) => `${M.esc(w.source || "Chưa rõ")}${w.checked ? `<div class="cell-sub">Tra lúc ${M.esc(w.checked)}</div>` : ""}`;
  const wtyTable = (id, rows) => M.table({
    id,
    href: (r) => "#/assets/" + r.a.id,
    cols: [
      { h: "Mã tài sản", r: (r) => M.tape(r.a.tag, r.a.id) },
      { h: "Tài sản", r: (r) => `<div class="cell-name">${M.esc(r.a.name)}</div>${r.a.serial ? `<div class="cell-sub mono">${M.esc(r.a.serial)}</div>` : ""}` },
      { h: "Hết bảo hành", r: (r) => `${M.esc(r.a.warranty.end)}<div class="cell-sub">${M.esc(r.a.warranty.type || "")}</div>` },
      { h: "Còn lại", r: (r) => (r.a.status === "archived" ? M.pill("Đã thanh lý", "mute") : daysPill(r.d)) },
      { h: "Nguồn", r: (r) => sourceCell(r.a.warranty) },
      { h: "", cls: "right", r: (r) => (M.can("warranty.edit") && r.a.status !== "archived" ? `<span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${M.btn("Tra theo serial", { sm: true, modal: "wty-lookup", arg: r.a.id })}${M.btn("Nhập tay", { sm: true, ghost: true, modal: "wty-manual", arg: r.a.id })}</span>` : "") },
    ],
    rows,
    empty: "Không có tài sản nào trong nhóm này.",
  });

  M.defModal("wty-lookup", (id) => {
    const a = M.asset(id);
    const m = M.model(a.model) || {};
    const maker = m.maker || "";
    const head = M.kv([["Tài sản", `${M.tape(a.tag)} ${M.esc(a.name)}`], ["Serial", `<span class="mono">${M.esc(a.serial || "")}</span>`], ["Hãng", M.esc(maker)], ["Đang ghi", `${M.esc(a.warranty.end)} - ${M.esc(a.warranty.source)}`]]);
    if (!a.serial || !API_MAKERS.test(maker)) {
      return {
        title: "Tra bảo hành theo serial",
        body: head + M.note(`Không tra được: ${a.serial ? `hãng ${M.esc(maker)} chưa có tích hợp API bảo hành (xem CC-16)` : "tài sản chưa có serial"}. Thông tin bảo hành hiện tại giữ nguyên; nhập tay nếu cần.`, "bad"),
        submit: false, cancelLabel: "Đóng",
      };
    }
    const manual = a.warranty.source === "Nhập tay";
    const res = { end: manual ? plusYear(a.warranty.end, 1) : a.warranty.end, type: manual ? "Theo dữ liệu hãng: " + (a.warranty.type || "bảo hành tiêu chuẩn") : a.warranty.type };
    const differs = res.end !== a.warranty.end;
    return {
      title: "Tra bảo hành theo serial",
      body: head + M.panel({ title: `Kết quả từ API của ${M.esc(maker)} - ${NOW}`, body: M.kv([["Hết bảo hành", `<b>${M.esc(res.end)}</b>`], ["Gói bảo hành", M.esc(res.type)]]) })
        + (manual && differs
          ? M.note("Giá trị hiện tại do người nhập tay. Kết quả tra chỉ ghi đè khi bạn đánh dấu ô bên dưới.", "warn") + M.checkbox("overwrite", "Ghi đè giá trị nhập tay bằng kết quả tra", false)
          : ""),
      submit: "Áp dụng kết quả",
      onSubmit(data) {
        if (manual && differs && !data.overwrite) {
          a.warranty.checked = NOW;
          return `Đã tra: hãng trả về hết hạn ${res.end}. Giữ nguyên giá trị nhập tay vì bạn chưa đồng ý ghi đè.`;
        }
        Object.assign(a.warranty, { end: res.end, type: res.type, source: `Tra tự động (${maker})`, checked: NOW });
        return `Đã cập nhật bảo hành ${a.tag}: hết hạn ${res.end}, nguồn tra tự động.`;
      },
    };
  });
  M.defModal("wty-manual", (id) => {
    const a = M.asset(id);
    const toIso = (s) => { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s || ""); return m ? `${m[3]}-${m[2]}-${m[1]}` : ""; };
    return {
      title: `Nhập tay bảo hành ${a.tag}`,
      body: `<div class="form-grid">
        ${M.field("Ngày bắt đầu", M.input("start", { type: "date", value: toIso(a.purchase && a.purchase.date) }))}
        ${M.field("Ngày hết bảo hành", M.input("end", { type: "date", value: toIso(a.warranty.end) }), { req: true })}
        ${M.field("Loại bảo hành", M.input("type", { value: a.warranty.type }), { full: true })}
      </div>`,
      submit: "Lưu",
      onSubmit(data, form) {
        if (!data.end) return M.invalid(form, "end", "Nhập ngày hết bảo hành.");
        if (data.start && data.end < data.start) return M.invalid(form, "end", "Ngày hết bảo hành phải sau ngày bắt đầu.");
        Object.assign(a.warranty, { end: iso2vn(data.end), type: data.type.trim(), source: "Nhập tay", checked: null });
        return `Đã lưu bảo hành ${a.tag}: hết hạn ${iso2vn(data.end)}, nguồn nhập tay.`;
      },
    };
  });

  M.screen("warranty", {
    nav: "warranty", title: "Bảo hành", codes: ["NV-5.2.1", "NV-5.2.2"],
    render() {
      const rows = wtyRows();
      const live = rows.filter((r) => r.a.status !== "archived");
      const soon = live.filter((r) => r.d >= 0 && r.d <= 90).sort((x, y) => x.d - y.d);
      const expired = live.filter((r) => r.d < 0).sort((x, y) => y.d - x.d);
      const ok = live.filter((r) => r.d > 90);
      const all = rows.slice().sort((x, y) => x.d - y.d);
      return M.page({
        title: "Bảo hành",
        sub: "Cảnh báo gửi ở các mốc còn 90, 60 và 30 ngày.",
        codes: ["NV-5.2.1", "NV-5.2.2"],
        actions: M.btn("Tra hàng loạt theo serial", { icon: "refresh", perm: "warranty.edit", msg: "Đã xếp lịch tra 17 tài sản Dell, HP, Lenovo. Giá trị nhập tay không bị ghi đè nếu chưa đồng ý (mockup)." })
          + M.btn("Xuất danh sách", { icon: "download", msg: "Đã xuất danh sách bảo hành ra Excel (mockup)." }),
        body: M.stats([
          { label: "Còn bảo hành (> 90 ngày)", value: ok.length, tone: "ok" },
          { label: "Tra tự động / nhập tay", value: `${live.filter((r) => /^Tra/.test(r.a.warranty.source)).length} / ${live.filter((r) => r.a.warranty.source === "Nhập tay").length}`, tone: "info" },
        ])
          + M.cc("CC-16", "Công ty dùng thiết bị của hãng nào là chính? API bảo hành của mỗi hãng cần đăng ký riêng. Mockup đang giả định tra được Dell, HP, Lenovo; Apple, Cisco, Fortinet, APC chỉ nhập tay.")
          + M.panel({ flush: true, body: M.tabs("warranty", [
            { key: "soon", label: "Sắp hết hạn", n: soon.length, body: wtyTable("wty-soon", soon) },
            { key: "expired", label: "Đã hết bảo hành", n: expired.length, body: wtyTable("wty-expired", expired) },
            { key: "all", label: "Tất cả", n: all.length, body: M.toolbar(M.searchBox("wty-all", "Tìm theo mã, tên, serial")) + wtyTable("wty-all", all) },
          ], "soon") }),
      });
    },
  });

  /* ===================== NV-5.3.1, NV-5.3.2: Khấu hao ===================== */
  M.defModal("dep-rule", (catId) => {
    const c = M.cat(catId);
    return {
      title: `Quy tắc khấu hao: ${c.name}`,
      body: `${M.field("Số tháng khấu hao", M.input("months", { type: "number", value: c.depMonths, attrs: 'min="1" step="1"' }), { req: true })}
        ${M.field("Phương pháp", M.select("method", [["line", "Đường thẳng"], ["other", "Phương pháp khác (chờ CC-17)"]], "line"))}`,
      submit: "Lưu quy tắc",
      onSubmit(data, form) {
        const n = Number(data.months);
        if (!Number.isInteger(n) || n <= 0) return M.invalid(form, "months", "Số tháng khấu hao phải là số nguyên dương.");
        if (data.method !== "line") return M.invalid(form, "method", "Chưa chốt phương pháp khác đường thẳng (CC-17).");
        c.depMonths = n;
        return `Đã đổi quy tắc ${c.name} sang ${n} tháng; giá trị còn lại đã được tính lại.`;
      },
    };
  });

  M.screen("depreciation", {
    nav: "depreciation", title: "Khấu hao", codes: ["NV-5.3.1", "NV-5.3.2"],
    render() {
      const assets = D.assets.map((a) => ({ a, r: M.residual(a), cat: M.assetCat(a) }));
      const live = assets.filter((x) => x.a.status !== "archived");
      const missing = live.filter((x) => !x.r);
      const totCost = live.reduce((s, x) => s + (x.r ? x.r.cost : 0), 0);
      const totVal = live.reduce((s, x) => s + (x.r ? x.r.value : 0), 0);
      const byCat = D.categories.map((c) => {
        const xs = live.filter((x) => x.cat && x.cat.id === c.id && x.r);
        return { c, n: xs.length, cost: xs.reduce((s, x) => s + x.r.cost, 0), val: xs.reduce((s, x) => s + x.r.value, 0) };
      }).filter((g) => g.n);
      const rules = M.table({
        cols: [
          { h: "Danh mục", r: (c) => `<b>${M.esc(c.name)}</b>` },
          { h: "Số tháng khấu hao", cls: "right", r: (c) => (c.depMonths ? `<span class="mono">${c.depMonths}</span>` : '<span class="muted">Chưa gán</span>') },
          { h: "Tài sản áp dụng", cls: "right", r: (c) => `<span class="mono">${live.filter((x) => x.cat && x.cat.id === c.id).length}</span>` },
          { h: "", cls: "right", r: (c) => M.btn("Sửa", { sm: true, ghost: true, icon: "pen", modal: "dep-rule", arg: c.id, perm: "finance.manage" }) },
        ],
        rows: D.categories,
      });
      const perAsset = M.table({
        id: "dep-assets",
        href: (x) => "#/assets/" + x.a.id,
        cols: [
          { h: "Mã tài sản", r: (x) => M.tape(x.a.tag, x.a.id) },
          { h: "Tài sản", r: (x) => `<div class="cell-name">${M.esc(x.a.name)}</div><div class="cell-sub">${M.esc(x.cat ? x.cat.name : "Chưa phân loại")}</div>` },
          { h: "Ngày mua", r: (x) => M.esc((x.a.purchase && x.a.purchase.date) || "") },
          { h: "Giá mua", cls: "right", r: (x) => (x.r ? priceCell(x.r.cost) : dash) },
          { h: "Đã dùng", r: (x) => (x.r ? `<div class="row" style="flex-wrap:nowrap">${M.progress(Math.min(x.r.months, x.r.depMonths), x.r.depMonths, x.r.months >= x.r.depMonths ? "mute" : "info")}<span class="mono small">${x.r.months}/${x.r.depMonths} th</span></div>` : dash) },
          { h: "Giá trị còn lại", cls: "right", r: (x) => (x.r ? `${priceCell(x.r.value)}${x.r.frozen ? `<div class="cell-sub">Chốt ngày thanh lý ${M.esc(x.a.disposal.date)}</div>` : x.r.value === 0 ? '<div class="cell-sub">Hết khấu hao</div>' : ""}` : '<span class="muted">Thiếu ngày mua hoặc giá mua</span>') },
        ],
        rows: assets,
      });
      const report = M.table({
        cols: [
          { h: "Danh mục", r: (g) => `<b>${M.esc(g.c.name)}</b>` },
          { h: "Số tài sản", cls: "right", r: (g) => `<span class="mono">${g.n}</span>` },
          { h: "Tổng giá mua", cls: "right", r: (g) => priceCell(g.cost) },
          { h: "Tổng giá trị còn lại", cls: "right", r: (g) => priceCell(g.val) },
          { h: "Còn lại", r: (g) => `<div class="row" style="flex-wrap:nowrap">${M.progress(g.val, g.cost, "ok")}<span class="mono small">${g.cost ? Math.round((g.val / g.cost) * 100) : 0}%</span></div>` },
        ],
        rows: byCat,
      });
      return M.page({
        title: "Khấu hao",
        sub: "Tính theo đường thẳng tới ngày 27/11/2026.",
        codes: ["NV-5.3.1", "NV-5.3.2"],
        actions: M.btn("Xuất Excel", { icon: "download", msg: "Đã xuất báo cáo khấu hao theo danh mục ra Excel (mockup)." }) + M.btn("Xuất PDF", { msg: "Đã xuất báo cáo khấu hao ra PDF (mockup)." }),
        body: M.stats([
          { label: "Tổng giá mua (đang dùng)", value: M.money(totCost), tone: "info" },
          { label: "Tổng giá trị còn lại", value: M.money(totVal), tone: "ok", sub: totCost ? `${Math.round((totVal / totCost) * 100)}% giá mua` : "" },
          { label: "Đã hết khấu hao", value: live.filter((x) => x.r && x.r.value === 0).length, tone: "mute" },
          { label: "Thiếu ngày mua hoặc giá mua", value: missing.length, tone: missing.length ? "warn" : "mute" },
        ])
          + M.cc("CC-17", "Phương pháp khấu hao và có giá trị thu hồi cuối kỳ hay không. Mockup dùng đường thẳng, không có giá trị thu hồi (đề xuất mặc định).")
          + M.panel({ flush: true, body: M.tabs("dep", [
            { key: "report", label: "Báo cáo theo danh mục", body: `<div class="grid g2"><div>${report}</div><div class="panel-body">${M.bars(byCat.map((g) => ({ label: g.c.name, value: Math.round(g.val / 1e6), tone: "ok" })), { unit: " tr" })}</div></div>` },
            { key: "assets", label: "Giá trị còn lại từng tài sản", n: assets.length, body: M.toolbar(M.searchBox("dep-assets", "Tìm theo mã, tên tài sản")) + perAsset },
            { key: "rules", label: "Quy tắc khấu hao", n: D.categories.length, body: rules },
          ], "report") }),
      });
    },
  });
})();
