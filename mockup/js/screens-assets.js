/* Mockup ITAM: Module 2, quản lý vòng đời và bàn giao tài sản.
   Danh sách, thêm/sửa, chi tiết tài sản (cấp phát, thu hồi, đổi trạng thái, điều chuyển, thanh lý,
   hồ sơ kỹ thuật, linh kiện, ticket, quan hệ, tài chính), phụ kiện, linh kiện, vật tư,
   biên bản bàn giao, điều khoản, kiểm kê, thanh lý, in tem hàng loạt, nhập từ tệp. */
(function () {
  const D = M.data;
  const list = (name) => D[name] || [];
  const NOW = "27/11/2026 " + "15:30";
  const actor = () => M.me().user;

  /* ===================== Dữ liệu mẫu của Module 2 ===================== */
  /* NV-2.1.4: linh kiện rời, điểm đến là một tài sản */
  D.components = [
    { id: "cp1", name: "RAM DDR5 16 GB 5600 SO-DIMM", kind: "RAM", stock: 6, min: 2, installed: [["a24", 1, "02/11/2026", "Lê Hoàng Nam"]] },
    { id: "cp2", name: "SSD Samsung PM9A1 1 TB NVMe", kind: "Ổ SSD", stock: 3, min: 2, installed: [["a2", 1, "15/10/2025", "Lê Hoàng Nam"]] },
    { id: "cp3", name: "Nguồn Dell 800 W cho PowerEdge R650", kind: "Nguồn máy chủ", stock: 2, min: 1, installed: [["a5", 2, "20/01/2024", "Lê Hoàng Nam"], ["a6", 2, "20/01/2024", "Lê Hoàng Nam"]] },
    { id: "cp4", name: "RAM DDR4 32 GB RDIMM 3200", kind: "RAM", stock: 4, min: 2, installed: [["a5", 8, "20/01/2024", "Lê Hoàng Nam"], ["a6", 16, "20/01/2024", "Lê Hoàng Nam"]] },
    { id: "cp5", name: "Bản lề Latitude 5440 (bộ trái + phải)", kind: "Linh kiện thay thế", stock: 0, min: 1, installed: [] },
  ];
  D.componentLog = [
    { at: "02/11/2026 10:15", assetId: "a24", text: "Lắp 1 × RAM DDR5 16 GB 5600 SO-DIMM (16 GB → 32 GB)", by: "Lê Hoàng Nam" },
    { at: "15/10/2025 14:00", assetId: "a2", text: "Thay ổ 512 GB bằng SSD Samsung PM9A1 1 TB; ổ cũ về kho", by: "Lê Hoàng Nam" },
  ];

  /* NV-2.1.5: vật tư tiêu hao, dùng là hết */
  D.consumables = [
    { id: "cs1", name: "Mực in HP 76A (CF276A)", kind: "Mực in", unit: "hộp", stock: 2, min: 5, location: "l7" },
    { id: "cs2", name: "Cáp mạng Cat6 đúc sẵn 3 m", kind: "Dây cáp", unit: "sợi", stock: 4, min: 10, location: "l7" },
    { id: "cs3", name: "Cáp HDMI 2.0 dài 2 m", kind: "Dây cáp", unit: "sợi", stock: 14, min: 5, location: "l7" },
    { id: "cs4", name: "Pin AA Panasonic Alkaline", kind: "Pin", unit: "viên", stock: 36, min: 20, location: "l7" },
    { id: "cs5", name: "Mực in Canon 337", kind: "Mực in", unit: "hộp", stock: 6, min: 2, location: "l12" },
  ];
  D.consumableLog = [
    { at: "27/11/2026 08:20", id: "cs1", qty: -1, to: "Phòng 301 - Kế toán", by: "Phạm Thu Hà" },
    { at: "26/11/2026 15:05", id: "cs2", qty: -6, to: "Bùi Gia Huy (đi dây phòng họp Sen)", by: "Phạm Thu Hà" },
    { at: "20/11/2026 09:00", id: "cs4", qty: 48, to: "Nhập kho - PO-2026-041", by: "Phạm Thu Hà" },
  ];
  D.accessoryLog = [
    { at: "27/11/2026 09:05", id: "ac1", text: "Cấp 1 cho Đỗ Mai Linh", by: "Phạm Thu Hà" },
    { at: "27/11/2026 09:05", id: "ac4", text: "Cấp 1 cho Đỗ Mai Linh", by: "Phạm Thu Hà" },
    { at: "21/11/2026 16:10", id: "ac3", text: "Thu hồi 1 từ Võ Thị Lan - Hỏng, không nhập lại kho", by: "Phạm Thu Hà" },
    { at: "18/11/2026 10:00", id: "ac2", text: "Điều chỉnh tồn 10 → 9 - Lý do: kiểm kê thiếu 1 chiếc", by: "Phạm Thu Hà" },
  ];

  /* NV-2.4.3, NV-2.4.4: đợt kiểm kê. result: found | pending | missing; discrepancy type theo bảng của NV-2.4.4 */
  D.stocktakes = [
    { id: "KK-2026-04", name: "Kiểm kê quý IV - Tầng 3 Tòa A", scope: "Vị trí: Tầng 3 (gồm các phòng con)", state: "running", opened: "25/11/2026", due: "30/11/2026", owner: "Phạm Thu Hà", counters: ["Đặng Văn Hùng", "Bùi Gia Huy"],
      items: [
        ["a4", "l3", "found", "25/11/2026 09:12", "Đặng Văn Hùng", "l3"], ["a5", "l5", "found", "25/11/2026 09:30", "Bùi Gia Huy", "l5"], ["a6", "l5", "found", "25/11/2026 09:31", "Bùi Gia Huy", "l5"],
        ["a7", "l6", "found", "25/11/2026 09:35", "Bùi Gia Huy", "l6"], ["a8", "l6", "found", "25/11/2026 09:36", "Bùi Gia Huy", "l6"], ["a9", "l3", "found", "25/11/2026 09:15", "Đặng Văn Hùng", "l8"],
        ["a10", "l7", "found", "26/11/2026 14:02", "Đặng Văn Hùng", "l7"], ["a11", "l7", "found", "26/11/2026 14:02", "Đặng Văn Hùng", "l7"], ["a12", "l7", "found", "26/11/2026 14:03", "Đặng Văn Hùng", "l7"],
        ["a14", "l7", "found", "26/11/2026 14:04", "Đặng Văn Hùng", "l7"], ["a16", "l5", "found", "25/11/2026 09:33", "Bùi Gia Huy", "l5"], ["a1", "l3", "found", "25/11/2026 09:20", "Đặng Văn Hùng", "l3"],
        ["a19", "l7", "pending", null, null, null], ["a23", "l7", "pending", null, null, null], ["a3", "l14", "pending", null, null, null],
      ],
      discrepancies: [
        { type: "location", assetId: "a9", detail: "Sổ sách: Phòng 301 - Kế toán. Thấy tại: Phòng họp Sen.", conclusion: null },
        { type: "holder", assetId: "a1", detail: "Cấp phát cho Nguyễn Văn Bình, nhưng người đang dùng thực tế là Lý Thanh Tâm.", conclusion: null },
        { type: "unregistered", assetId: null, detail: "Máy in Canon LBP2900 không có tem, đặt ở Phòng 301.", conclusion: null },
        { type: "outofscope", assetId: "a20", detail: "Quét được TS-000020 (thuộc Chi nhánh TP.HCM) tại Phòng 301.", conclusion: null },
      ] },
    { id: "KK-2026-03", name: "Kiểm kê chi nhánh TP.HCM", scope: "Đơn vị: Chi nhánh TP.HCM", state: "done", opened: "02/10/2026", due: "09/10/2026", owner: "Phạm Thu Hà", counters: ["Châu Ngọc Hân"],
      items: [["a20", "l11", "found", "03/10/2026 10:00", "Châu Ngọc Hân", "l11"], ["a21", "l11", "found", "03/10/2026 10:05", "Châu Ngọc Hân", "l11"]],
      discrepancies: [{ type: "missing", assetId: null, detail: "Sạc USB-C 65W × 1 không tìm thấy tại Kho chi nhánh.", conclusion: "Lập biên bản mất, điều chỉnh tồn phụ kiện." }] },
    { id: "KK-2026-05", name: "Kiểm kê laptop toàn công ty", scope: "Danh mục: Laptop", state: "draft", opened: null, due: "15/12/2026", owner: "Phạm Thu Hà", counters: [], items: [], discrepancies: [] },
  ];
  const DISC = {
    missing: ["Thất lạc", "bad", "Xác minh với người giữ; không tìm được thì lập biên bản mất", ["Đã tìm thấy, cập nhật kết quả quét", "Lập biên bản mất (chờ CC-12)"]],
    location: ["Sai vị trí", "warn", "Cập nhật vị trí hoặc đưa về chỗ cũ", ["Cập nhật vị trí theo thực tế", "Đưa thiết bị về vị trí cũ"]],
    holder: ["Sai người giữ", "warn", "Điều chuyển cho đúng (NV-2.2.6)", ["Điều chuyển cho người đang dùng", "Thu hồi về người được cấp"]],
    unregistered: ["Ngoài sổ", "info", "Thêm mới (NV-2.1.1)", ["Thêm thành tài sản mới", "Không phải tài sản công ty"]],
    outofscope: ["Ngoài phạm vi đợt", "info", "Ghi nhận thấy ở nơi không ngờ tới", ["Cập nhật vị trí theo thực tế", "Đưa về đơn vị quản lý"]],
  };

  /* NV-2.2.4: đề nghị thanh lý (bước duyệt chờ CC-8) */
  D.disposals = [
    { id: "TL-2026-007", assetId: "a14", state: "pending", at: "26/11/2026", by: "Phạm Thu Hà", date: "30/11/2026", reason: "Vào nước, mainboard hỏng, hãng từ chối bảo hành", method: "Tiêu hủy", value: 0, docs: ["bien-ban-giam-dinh-a14.pdf"] },
    { id: "TL-2026-006", assetId: "a15", state: "done", at: "15/10/2026", by: "Phạm Thu Hà", approvedBy: "Trần Minh Quân", date: "20/10/2026", reason: "Hết khấu hao, hỏng nguồn", method: "Bán thanh lý", value: 1200000, docs: ["hoa-don-ban-thanh-ly.pdf"] },
  ];

  /* NV-2.2.5: chuỗi lưu ký. Tài sản không khai riêng thì sinh từ ngày tạo và người giữ hiện tại. */
  D.custody = {
    a1: [
      { at: "20/11/2026 16:02", action: "update", title: "Cập nhật thông tin", note: "Serial: 7XK2H9 → 7XK2H93", by: "Phạm Thu Hà" },
      { at: "14/03/2025 08:30", action: "checkout", title: "Cấp phát cho Nguyễn Văn Bình", from: "ready", to: "deployed", note: "Laptop làm việc", by: "Trần Minh Quân", sign: "signed" },
      { at: "12/03/2025 15:00", action: "link", title: "Gắn với máy do agent báo cáo", note: "Tự khớp theo serial", by: "Hệ thống" },
      { at: "12/03/2025 14:20", action: "create", title: "Thêm tài sản", to: "ready", by: "Trần Minh Quân" },
    ],
    a12: [
      { at: "20/11/2026 09:40", action: "checkin", title: "Thu hồi từ Lý Thanh Tâm", from: "deployed", to: "maintenance", note: "Gãy bản lề - T-1039", by: "Phạm Thu Hà", ticket: "T-1039", sign: "signed" },
      { at: "15/03/2025 10:00", action: "checkout", title: "Cấp phát cho Lý Thanh Tâm", from: "ready", to: "deployed", by: "Trần Minh Quân", sign: "signed" },
      { at: "12/03/2025 14:21", action: "create", title: "Thêm tài sản", to: "ready", by: "Trần Minh Quân" },
    ],
    a15: [
      { at: "20/10/2026 11:00", action: "status", title: "Đổi trạng thái", from: "broken", to: "archived", note: "Thanh lý TL-2026-006 - Bán thanh lý 1.200.000 ₫", by: "Trần Minh Quân" },
      { at: "02/09/2026 09:00", action: "checkin", title: "Thu hồi từ Phòng 301 - Kế toán", from: "deployed", to: "broken", note: "Hỏng nguồn", by: "Phạm Thu Hà" },
      { at: "15/04/2021 10:00", action: "checkout", title: "Cấp phát cho Phòng 301 - Kế toán", from: "ready", to: "deployed", by: "Trần Minh Quân" },
      { at: "15/04/2021 09:00", action: "create", title: "Thêm tài sản", to: "ready", by: "Trần Minh Quân" },
    ],
    a2: [
      { at: "27/11/2026 09:05", action: "checkout", title: "Cấp phát cho Đỗ Mai Linh", from: "ready", to: "deployed", note: "Thay máy cũ - kèm màn hình TS-000003", by: "Phạm Thu Hà", sign: "pending" },
      { at: "15/10/2025 14:00", action: "update", title: "Cập nhật thông tin", note: "Nâng SSD 512 GB → 1 TB", by: "Lê Hoàng Nam" },
      { at: "02/10/2025 09:00", action: "create", title: "Thêm tài sản", to: "ready", by: "Phạm Thu Hà" },
    ],
  };
  const logs = (a) => {
    if (!D.custody[a.id]) {
      const rows = [{ at: a.created + " 09:00", action: "create", title: "Thêm tài sản", to: "ready", by: "Phạm Thu Hà" }];
      if (a.holder) rows.unshift({ at: a.created + " 10:30", action: "checkout", title: "Cấp phát cho " + M.holderText(a).replace(/^Gắn vào /, "tài sản "), from: "ready", to: "deployed", by: "Phạm Thu Hà", sign: a.holder.type === "employee" ? "signed" : null });
      else if (a.status !== "ready" && a.status !== "archived") rows.unshift({ at: a.created + " 11:00", action: "status", title: "Đổi trạng thái", from: "ready", to: a.status, note: a.note || "", by: "Phạm Thu Hà" });
      D.custody[a.id] = rows;
    }
    return D.custody[a.id];
  };
  const addLog = (a, row) => { logs(a).unshift(Object.assign({ at: NOW, by: actor() }, row)); };

  /* ===================== Tiện ích riêng ===================== */
  const makers = () => [...new Set(D.models.filter((m) => !m.dirty).map((m) => m.maker))].sort();
  const children = (a) => D.assets.filter((x) => x.holder && x.holder.type === "asset" && x.holder.id === a.id);
  const where = (a) => (a.holder ? M.holderText(a) : a.location ? M.find("locations", a.location).name : "");
  const nextHandoverId = () => "BB-2026-0" + (120 + D.handovers.filter((h) => +h.id.slice(-3) >= 120).length);
  const statusPill = (h) => M.pill(M.HANDOVER_ST[h.status][0], M.HANDOVER_ST[h.status][1]);
  const empOptions = (filterFn) => D.employees.filter(filterFn || ((e) => e.status === "active")).map((e) => [e.id, `${e.name} - ${e.code}`]);

  /* =====================================================================
     Danh sách tài sản (MH-03, NV-2.1.2, NT-7)
     ===================================================================== */
  const PAGE = 20;
  M.screen("assets", {
    nav: "assets", title: "Tài sản", codes: ["NV-2.1.2", "NV-7.1.1", "NT-7", "NV-2.4.1"],
    render(p, q) {
      const k = M.fold(q.q || "");
      const all = D.assets;
      const counts = {}; Object.keys(M.STATUS).forEach((s) => (counts[s] = all.filter((a) => a.status === s).length));
      let rows = all.filter((a) =>
        (!q.status || a.status === q.status) &&
        (!q.cat || (M.model(a.model) && M.model(a.model).cat === q.cat)) &&
        (!q.maker || (M.model(a.model) && M.model(a.model).maker === q.maker)) &&
        (!q.loc || (a.holder && a.holder.type === "location" && a.holder.id === q.loc) || a.location === q.loc) &&
        (!k || [a.tag, a.name, a.serial, M.holderText(a), a.tech && a.tech.hostname, (a.tech && a.tech.ip) || a.ip].some((v) => v && M.fold(v).includes(k))));
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / PAGE));
      const page = Math.min(pages, Math.max(1, +q.page || 1));
      const shown = rows.slice((page - 1) * PAGE, page * PAGE);
      const qs = (patch) => "#/assets?" + new URLSearchParams(Object.entries(Object.assign({}, q, patch)).filter(([, v]) => v)).toString();
      const filtering = q.status || q.cat || q.maker || q.loc || q.q;
      const legend = `<div class="grid g4" style="grid-template-columns:repeat(5,minmax(0,1fr))">${Object.keys(M.STATUS).map((s) => `<a href="${qs({ status: q.status === s ? "" : s, page: "" })}" class="stat" style="--c:var(--led-${s});${q.status === s ? "border-color:var(--ink);background:var(--surface-2)" : ""}"><span class="led s-${s}">${M.esc(M.STATUS[s])}</span><span class="val" style="font-size:26px">${counts[s]}</span></a>`).join("")}</div>`;
      const filters = `${M.searchBox("assets-table", "Tìm theo mã, tên, serial, người giữ, tên máy hoặc IP").replace('data-filter="assets-table"', `data-input="asset-q" value="${M.esc(q.q || "")}"`)}
        ${M.select("cat", D.categories.map((c) => [c.id, c.name]), q.cat, { blank: "Mọi danh mục", attrs: 'data-change="asset-filter" aria-label="Danh mục"' })}
        ${M.select("maker", makers(), q.maker, { blank: "Mọi hãng", attrs: 'data-change="asset-filter" aria-label="Hãng"' })}
        ${M.select("loc", D.locations.map((l) => [l.id, M.locPath(l.id)]), q.loc, { blank: "Mọi vị trí", attrs: 'data-change="asset-filter" aria-label="Vị trí"' })}
        ${filtering ? `<a class="linklike" href="#/assets">Bỏ lọc</a>` : ""}`;
      return M.page({
        title: "Tài sản", codes: ["NV-2.1.2", "NV-7.1.1", "NT-7"],
        actions: M.btn("Nhập từ tệp", { href: "#/import", icon: "upload", perm: "asset.import" }) + M.btn("Thêm tài sản", { href: "#/assets/new", primary: true, icon: "plus", perm: "asset.edit" }),
        body: `${legend}
          <section class="panel flush">
            ${M.toolbar(filters)}
            ${M.bulkbar("assets-table", M.btn("In tem đã chọn", { sm: true, act: "bulk-label", icon: "printer" }) + M.btn("Xuất Excel", { sm: true, msg: "Mockup: tải tệp tai-san.xlsx gồm các dòng đã chọn." }))}
            ${M.table({
              id: "assets-table", select: true,
              cols: [
                { h: "Mã tài sản", r: (a) => M.tape(a.tag) },
                { h: "Tài sản", cls: "cell-name", r: (a) => M.esc(a.name) },
                { h: "Serial", r: (a) => `<span class="mono">${M.esc(a.serial || "")}</span>` },
                { h: "Trạng thái", r: (a) => M.led(a.status) },
                { h: "Đang giao cho", r: (a) => M.holderHtml(a) },
                { h: "Thấy gần nhất", r: (a) => a.tech ? `<span class="small mono">${M.esc(a.tech.lastReport.split(" ")[0])}</span>` : a.lastSeen ? M.pill("Lâu không thấy", "warn") : '<span class="muted small">Chưa có agent</span>' },
              ],
              rows: shown, href: (a) => "#/assets/" + a.id,
              empty: filtering ? "Không có tài sản nào khớp bộ lọc." : 'Chưa có tài sản nào. Bấm "+ Thêm tài sản" để nhập thiết bị đầu tiên.',
            })}
            <div class="panel-foot"><span>Hiển thị ${total ? (page - 1) * PAGE + 1 : 0}-${Math.min(page * PAGE, total)} trong ${total}</span>
              <span class="row"><span>Trang ${page}/${pages}</span>${page > 1 ? M.btn("Trang trước", { sm: true, href: qs({ page: page - 1 }) }) : M.btn("Trang trước", { sm: true, disabled: true })}${page < pages ? M.btn("Trang sau", { sm: true, href: qs({ page: page + 1 }) }) : M.btn("Trang sau", { sm: true, disabled: true })}</span></div>
          </section>`,
      });
    },
    after(root, p, q) {
      if (q.q) { const i = root.querySelector('[data-input="asset-q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
    },
  });
  let qTimer;
  M.action("asset-q", (el) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => {
      const q = Object.assign({}, M.current().query, { q: el.value.trim(), page: "" });
      M.go("assets?" + new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString());
    }, 350);
  });
  M.action("asset-filter", (el) => {
    const q = Object.assign({}, M.current().query, { [el.name]: el.value, page: "" });
    M.go("assets?" + new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString());
  });
  M.action("bulk-label", () => { M.go("labels?ids=" + M.selected("assets-table").join(",")); });

  /* =====================================================================
     Thêm và sửa tài sản (MH-04, NV-2.1.1) + thông tin mua sắm và bảo hành (Module 5)
     ===================================================================== */
  const assetForm = (a) => {
    const m = a && M.model(a.model);
    const pu = (a && a.purchase) || {};
    const w = (a && a.warranty) || {};
    return M.form("asset-save", `<input type="hidden" name="id" value="${M.esc(a ? a.id : "")}">
      <div class="stack">
      ${M.panel({ title: "Thông tin tài sản", body: `<div class="form-grid">
        ${M.field("Tên tài sản", M.input("name", { value: a && a.name, attrs: 'maxlength="200"' }), { req: true, full: true })}
        ${M.field("Mã tài sản", M.input("tag", { value: a && a.tag, ph: a ? "" : "Để trống: hệ thống tự tạo TS-000025", attrs: 'maxlength="50"' }))}
        ${M.field("Serial", M.input("serial", { value: a && a.serial, attrs: 'maxlength="100"' }))}
        ${M.field("Hãng sản xuất", M.input("maker", { value: m && m.maker, list: "dl-makers", attrs: 'maxlength="100"' }))}
        ${M.field("Model", M.input("model", { value: m && m.name, list: "dl-models", attrs: 'maxlength="100"' }))}
        ${M.field("Danh mục", M.select("cat", D.categories.map((c) => [c.id, c.name]), m && m.cat, { blank: "Chọn danh mục" }))}
        ${M.field("Đơn vị", M.select("unit", D.orgUnits.filter((u) => u.level === 1).map((u) => [u.id, u.name]), a ? a.unit : "u1"))}
        ${M.field("Ghi chú", M.textarea("note", a && a.note), { full: true })}
      </div>
      <datalist id="dl-makers">${makers().map((x) => `<option value="${M.esc(x)}">`).join("")}</datalist>
      <datalist id="dl-models">${D.models.filter((x) => !x.dirty).map((x) => `<option value="${M.esc(x.name)}">${M.esc(x.maker)}</option>`).join("")}</datalist>` })}
      ${M.can("finance.view") ? M.panel({ title: "Mua sắm và bảo hành", body: `${M.codeChips(["NV-5.1.2", "NV-5.2.1"])}<div class="form-grid" style="margin-top:12px">
        ${M.field("Nhà cung cấp", M.select("vendor", D.vendors.filter((v) => v.active || v.id === pu.vendorId).map((v) => [v.id, v.name]), pu.vendorId, { blank: "Chưa có" }))}
        ${M.field("Số đơn mua (PO)", M.input("po", { value: pu.po, ph: "PO-2026-…" }))}
        ${M.field("Ngày mua", M.input("pdate", { value: pu.date, ph: "dd/mm/yyyy" }))}
        ${M.field("Giá mua (₫)", M.input("cost", { value: pu.cost, type: "number" }))}
        ${M.field("Hết bảo hành", M.input("wend", { value: w.end, ph: "dd/mm/yyyy" }))}
        ${M.field("Loại bảo hành", M.input("wtype", { value: w.type }))}
        <div class="full">${M.btn("Tra bảo hành theo serial", { sm: true, icon: "search", msg: "Đã tra theo serial qua API của hãng: hết hạn 12/03/2028 (ProSupport). Ô đang có giá trị nhập tay nên chưa ghi đè; bấm Áp dụng nếu đồng ý." })}</div>
      </div>` }) : ""}
      <div class="form-actions">${M.btn(a ? "Lưu thay đổi" : "Thêm tài sản", { primary: true, type: "submit" })}${M.btn("Hủy", { href: a ? "#/assets/" + a.id : "#/assets" })}</div>
      </div>`);
  };
  M.screen("assets/new", {
    nav: "assets", title: "Thêm tài sản", codes: ["NV-2.1.1"], roles: M.PERMS["asset.edit"], narrow: true,
    render() { return M.page({ title: "Thêm tài sản", codes: ["NV-2.1.1", "NT-3"], back: ["#/assets", "Tài sản"], body: assetForm(null) }); },
  });
  M.screen("assets/:id/edit", {
    nav: "assets", title: "Sửa tài sản", codes: ["NV-2.1.1"], roles: M.PERMS["asset.edit"], narrow: true,
    render(p) {
      const a = M.asset(p.id);
      if (!a) return M.page({ title: "Không tìm thấy tài sản này." });
      if (a.status === "archived") return M.page({ title: "Tài sản đã thanh lý", sub: "Không còn sửa được.", back: ["#/assets/" + a.id, a.tag] });
      return M.page({ title: `Sửa ${M.esc(a.tag)}`, codes: ["NV-2.1.1"], back: ["#/assets/" + a.id, a.tag], body: assetForm(a) });
    },
  });
  M.action("asset-save", (form, d) => {
    const a = d.id ? M.asset(d.id) : null;
    if (!d.name.trim()) return M.invalid(form, "name", "Nhập tên tài sản.");
    const tag = d.tag.trim();
    const dupTag = tag && D.assets.find((x) => x.tag.toLowerCase() === tag.toLowerCase() && x !== a);
    if (dupTag) return M.invalid(form, "tag", `Mã tài sản ${tag} đã có trong hệ thống.`);
    const serial = d.serial.trim();
    const dupSerial = serial && D.assets.find((x) => x.serial && x.serial.toLowerCase() === serial.toLowerCase() && x !== a);
    if (dupSerial) return M.invalid(form, "serial", `Serial ${serial} đã gắn với tài sản ${dupSerial.tag}.`);
    if (!!d.maker.trim() !== !!d.model.trim()) return M.invalid(form, d.maker.trim() ? "model" : "maker", "Hãng sản xuất và model đi cùng nhau: nhập cả hai hoặc để trống cả hai.");
    if (d.cat && !d.model.trim()) return M.invalid(form, "cat", "Danh mục đi theo model: nhập hãng sản xuất và model trước khi chọn danh mục.");
    let model = D.models.find((m) => m.maker.toLowerCase() === d.maker.trim().toLowerCase() && m.name.toLowerCase() === d.model.trim().toLowerCase());
    if (model && d.cat && model.cat && model.cat !== d.cat && !window.confirm(`Model ${model.name} đang thuộc danh mục ${M.cat(model.cat).name}. Đổi sang ${M.cat(d.cat).name} cho mọi tài sản cùng model?`)) return;
    if (!model && d.model.trim()) { model = { id: "m" + (D.models.length + 1), maker: d.maker.trim(), name: d.model.trim(), cat: d.cat || null }; D.models.push(model); }
    if (model && d.cat) model.cat = d.cat;
    if (a) {
      Object.assign(a, { name: d.name.trim(), tag: tag || a.tag, serial, model: model ? model.id : null, note: d.note, unit: d.unit });
      addLog(a, { action: "update", title: "Cập nhật thông tin", note: "Sửa: tên, serial, model, ghi chú" });
      M.go("assets/" + a.id);
      return "Đã lưu thay đổi";
    }
    const id = "a" + (D.assets.length + 1);
    const n = { id, tag: tag || "TS-" + String(D.assets.length + 1).padStart(6, "0"), name: d.name.trim(), model: model ? model.id : null, serial, status: "ready", holder: null, location: "l7", created: "27/11/2026", note: d.note, unit: d.unit, purchase: d.vendor ? { vendorId: d.vendor, po: d.po, date: d.pdate, cost: +d.cost || null } : null, warranty: d.wend ? { end: d.wend, type: d.wtype, source: "Nhập tay" } : null, tech: null };
    D.assets.push(n);
    addLog(n, { action: "create", title: "Thêm tài sản", to: "ready" });
    M.go("assets/" + id);
    return `Đã thêm ${n.tag}`;
  });

  /* =====================================================================
     Chi tiết tài sản (MH-05 mở rộng)
     ===================================================================== */
  const logTitle = { create: "Thêm tài sản", update: "Cập nhật thông tin", checkout: "", checkin: "", status: "Đổi trạng thái", link: "Gắn với máy do agent báo cáo", unlink: "Bỏ gắn agent", transfer: "" };
  const logList = (a) => {
    const rows = logs(a);
    if (!rows.length) return M.empty("Chưa có lịch sử.");
    return `<ul class="log">${rows.map((l) => `<li><time>${M.esc(l.at)}</time><div>
      <div class="log-title">${M.esc(l.title || logTitle[l.action])}</div>
      ${l.from || l.to ? `<div class="log-meta">${l.from ? M.led(l.from) + " →" : ""} ${l.to ? M.led(l.to) : ""}</div>` : ""}
      ${l.note ? `<div class="log-meta">${M.esc(l.note)}</div>` : ""}
      <div class="log-meta">${M.esc(l.by)}${l.ticket ? ` - <a href="#/tickets/${M.esc(l.ticket)}">${M.esc(l.ticket)}</a>` : ""}${l.sign ? " - " + M.pill(l.sign === "signed" ? "Đã ký biên bản" : "Biên bản chờ ký", l.sign === "signed" ? "ok" : "warn") : ""}</div>
    </div></li>`).join("")}</ul>`;
  };

  const actionsPanel = (a) => {
    const canCO = M.can("asset.checkout"), canST = M.can("asset.status");
    if (!canCO && !canST) return "";
    if (a.status === "archived") return M.panel({ title: "Thao tác", body: `<p class="muted">Tài sản đã thanh lý, không còn thao tác nào.</p>` });
    const btns = [];
    if (a.status === "ready" && canCO) btns.push(M.btn("Cấp phát", { primary: true, modal: "checkout", arg: a.id, icon: "user" }));
    if (a.status === "deployed" && canCO) {
      btns.push(M.btn("Thu hồi", { primary: true, modal: "checkin", arg: a.id }));
      if (a.holder && a.holder.type === "employee") btns.push(M.btn("Điều chuyển", { modal: "transfer", arg: a.id, icon: "swap" }));
    }
    if (a.status !== "deployed" && canST) btns.push(M.btn("Đổi trạng thái", { modal: "status", arg: a.id }));
    if (a.status !== "deployed" && canST) btns.push(M.btn("Đề nghị thanh lý", { modal: "dispose", arg: a.id, icon: "archive" }));
    return M.panel({ title: "Thao tác", body: `<div class="row">${btns.join("")}</div>` });
  };

  const techTab = (a) => {
    const t = a.tech;
    if (!t) return M.panel({ body: `${M.empty("Chưa có dữ liệu: chưa có agent nào báo cáo cho tài sản này.")}<div class="center">${M.btn("Cài agent lên máy này", { href: "#/agents", sm: true })}</div>` });
    const agent = list("agents").find((x) => x.id === t.agent);
    const reportedSerial = String(t.reported || "").split(" - ").pop();
    const mismatch = a.serial && reportedSerial && reportedSerial.toLowerCase() !== a.serial.toLowerCase();
    const holder = a.holder && a.holder.type === "employee" ? M.emp(a.holder.id) : null;
    const logonUser = String(t.lastLogon || "").split("\\").pop();
    const logonMismatch = holder && logonUser && holder.email.split("@")[0] !== logonUser;
    const revoked = agent && agent.state === "revoked";
    return `${M.codeChips(["NV-1.4.2", "NV-1.4.1", "NV-1.2.2"])}
      ${mismatch ? M.note(`Serial máy tự báo (<b class="mono">${M.esc(reportedSerial)}</b>) khác serial đang ghi cho tài sản (<b class="mono">${M.esc(a.serial)}</b>): có thể agent bị gắn nhầm máy hoặc serial nhập tay bị sai.`, "warn") : ""}
      ${logonMismatch ? M.note(`Người đăng nhập gần nhất là <b>${M.esc(t.lastLogon)}</b>, khác người đang được cấp phát (${M.esc(holder.name)}). Có thể máy đã được bàn giao miệng không qua hệ thống.`, "warn") : ""}
      <div class="grid g2">
        ${M.panel({ title: "Cấu hình", body: M.kv([
          ["Tên máy", `<span class="mono">${M.esc(t.hostname)}</span>`], ["Hệ điều hành", M.esc(t.os)], ["CPU", M.esc(t.cpu)], ["RAM", M.esc(t.ram)],
          ["Ổ đĩa", t.disks.map(M.esc).join("<br>")], ["Địa chỉ IP", `<span class="mono">${M.esc(t.ip)}</span>`], ["BIOS", M.esc(t.bios)],
          ["Máy tự báo", M.esc(t.reported)], ["Đăng nhập gần nhất", t.lastLogon ? `<span class="mono">${M.esc(t.lastLogon)}</span>` : null],
          ["Báo cáo gần nhất", `<span class="mono">${M.esc(t.lastReport)}</span>${revoked ? " " + M.pill("Không còn agent báo cáo", "mute") : ""}`],
          ["Cách gắn", t.linkVia ? M.esc(t.linkVia) : null],
        ]) })}
        ${M.panel({ title: "Card mạng", flush: true, body: M.table({ cols: [{ h: "Tên", cls: "wrap", r: (n) => M.esc(n[0]) }, { h: "MAC", r: (n) => `<span class="mono small">${M.esc(n[1])}</span>` }, { h: "IPv4", r: (n) => `<span class="mono small">${M.esc(n[2])}</span>` }], rows: t.nics }) })}
      </div>
      ${M.panel({ title: `Phần mềm đã cài (${t.software.length})`, flush: true, body: M.toolbar(M.searchBox("sw-" + a.id, "Lọc theo tên phần mềm")) + M.table({ id: "sw-" + a.id, cols: [{ h: "Tên", cls: "wrap", r: (s) => M.esc(s.name) }, { h: "Phiên bản", r: (s) => `<span class="mono small">${M.esc(s.version)}</span>` }], rows: t.software, empty: "Agent chưa gửi danh sách phần mềm." }) })}`;
  };

  const hwTab = (a) => {
    const rows = list("hwChanges").filter((h) => h.assetId === a.id);
    return `${M.codeChips(["NV-1.3.3"])}${M.panel({ title: "Lịch sử thay đổi phần cứng", flush: true, body: M.table({
      cols: [{ h: "Thời điểm", r: (h) => `<span class="mono small">${M.esc(h.at)}</span>` }, { h: "Hạng mục", r: (h) => M.esc(h.field) }, { h: "Trước", r: (h) => M.esc(h.from) }, { h: "Sau", r: (h) => `<b>${M.esc(h.to)}</b>` },
        { h: "Lý do", cls: "wrap", r: (h) => (h.reason ? M.esc(h.reason) : M.pill("Không rõ lý do", "warn")) }, { h: "Cảnh báo", r: (h) => (h.alerted ? M.pill("Đã gửi", "warn") : M.pill("Không cần", "mute")) }],
      rows, empty: "Chưa ghi nhận thay đổi nào. Lịch sử này tách riêng khỏi nhật ký lưu ký.",
    }) })}`;
  };

  const compTab = (a) => {
    const rows = [];
    D.components.forEach((c) => c.installed.forEach(([aid, qty, at, by]) => { if (aid === a.id) rows.push({ c, qty, at, by }); }));
    const hist = D.componentLog.filter((x) => x.assetId === a.id);
    return `${M.codeChips(["NV-2.1.4"])}${M.panel({ title: "Linh kiện đang lắp", flush: true,
      actions: a.status !== "archived" ? M.btn("Lắp linh kiện", { sm: true, modal: "cmp-install", arg: "asset:" + a.id, perm: "component.manage", icon: "plus" }) : "",
      body: M.table({ cols: [{ h: "Linh kiện", cls: "wrap", r: (x) => M.esc(x.c.name) }, { h: "Số lượng", r: (x) => x.qty }, { h: "Ngày lắp", r: (x) => M.esc(x.at) }, { h: "Người lắp", r: (x) => M.esc(x.by) },
        { h: "", r: (x) => M.btn("Tháo ra", { sm: true, modal: "cmp-remove", arg: x.c.id + ":" + a.id, perm: "component.manage" }) }], rows, empty: "Chưa ghi nhận linh kiện lắp thêm." }) })}
      ${M.panel({ title: "Lịch sử nâng cấp", body: hist.length ? `<ul class="log">${hist.map((h) => `<li><time>${M.esc(h.at)}</time><div><div class="log-title">${M.esc(h.text)}</div><div class="log-meta">${M.esc(h.by)}</div></div></li>`).join("")}</ul>` : M.empty("Chưa có lần nâng cấp nào.") })}`;
  };

  const riskTab = (a) => {
    const cves = list("cves").filter((c) => (c.assetIds || []).includes(a.id));
    const seats = [];
    list("licenses").forEach((l) => (l.assignments || []).forEach((s) => { if (s.assetId === a.id) seats.push({ l, s }); }));
    const sev = { Critical: "bad", High: "warn", Medium: "info", Low: "mute" };
    return `${M.codeChips(["NV-3.2.2", "NV-3.1.3"])}
      ${M.panel({ title: `Lỗ hổng ảnh hưởng (${cves.length})`, flush: true, body: M.table({ cols: [{ h: "CVE", r: (c) => `<a class="mono" href="#/vulns/${M.esc(c.id)}">${M.esc(c.id)}</a>` }, { h: "Mức", r: (c) => M.pill(c.severity, sev[c.severity], c.severity === "Critical") }, { h: "CVSS", r: (c) => `<span class="mono">${M.esc(c.cvss)}</span>` }, { h: "Sản phẩm", cls: "wrap", r: (c) => M.esc(c.product) }], rows: cves, empty: "Không có lỗ hổng đã biết theo phiên bản phần mềm hiện tại." }) })}
      ${M.panel({ title: `Ghế bản quyền gán cho máy này (${seats.length})`, flush: true, body: M.table({ cols: [{ h: "Phần mềm", r: (x) => `<a href="#/licenses/${M.esc(x.l.id)}">${M.esc(x.l.software)}</a>` }, { h: "Gán lúc", r: (x) => M.esc(x.s.at || "") }], rows: seats, empty: "Chưa gán ghế bản quyền nào cho máy này." }) })}`;
  };

  const ticketTab = (a) => {
    const rows = list("tickets").filter((t) => (t.assetIds || []).includes(a.id));
    const st = { new: "Mới", approval: "Chờ duyệt", owned: "Đã nhận", working: "Đang xử lý", waiting: "Chờ phản hồi", resolved: "Đã giải quyết", closed: "Đã đóng" };
    return `${M.codeChips(["NV-4.3.1"])}${M.panel({ title: `Ticket liên quan (${rows.length})`, flush: true, actions: M.btn("Tạo ticket cho máy này", { sm: true, href: "#/tickets/new?asset=" + a.id, perm: "ticket.work" }),
      body: M.table({ cols: [{ h: "Mã", r: (t) => `<b class="mono">${M.esc(t.id)}</b>` }, { h: "Tiêu đề", cls: "wrap", r: (t) => M.esc(t.title) }, { h: "Trạng thái", r: (t) => M.pill(st[t.status] || t.status, ["resolved", "closed"].includes(t.status) ? "mute" : "info") }, { h: "Tạo lúc", r: (t) => `<span class="small mono">${M.esc(t.created)}</span>` }],
        rows, href: (t) => "#/tickets/" + t.id, empty: "Chưa có ticket nào gắn với tài sản này." }) })}`;
  };

  const relTab = (a) => {
    const name = (id) => { const x = M.asset(id); if (x) return M.tape(x.tag, x.id) + " " + M.esc(x.name); const s = list("services").find((v) => v.id === id); return s ? `<b>${M.esc(s.name)}</b>` : M.esc(id); };
    const rels = list("relations").filter((r) => r.from === a.id || r.to === a.id);
    return `${M.codeChips(["NV-4.4.1", "NV-4.4.2"])}${M.panel({ title: `Quan hệ hạ tầng (${rels.length})`, flush: true, actions: M.btn("Mở sơ đồ CMDB", { sm: true, href: "#/cmdb?focus=" + a.id, icon: "share" }),
      body: M.table({ cols: [{ h: "Từ", cls: "wrap", r: (r) => name(r.from) }, { h: "Quan hệ", r: (r) => `<span class="mono small">${M.esc(r.type)}</span>` }, { h: "Tới", cls: "wrap", r: (r) => name(r.to) }, { h: "Nguồn", r: (r) => M.pill(r.source === "auto" ? "Tự sinh" : "Nhập tay", r.source === "auto" ? "info" : "mute") }], rows: rels, empty: "Chưa khai báo quan hệ nào." }) })}`;
  };

  const finTab = (a) => {
    const pu = a.purchase || {};
    const w = a.warranty || {};
    const v = pu.vendorId && M.vendor(pu.vendorId);
    const days = w.end ? M.daysUntil(w.end) : null;
    const res = typeof M.residual === "function" ? M.residual(a) : null;
    const contracts = list("contracts").filter((c) => (c.assetIds || []).includes(a.id));
    const showCost = M.can("finance.view");
    return `${M.codeChips(["NV-5.1.2", "NV-5.2.1", "NV-5.3.2", "NV-5.1.3", "NV-5.1.4"])}
      <div class="grid g2">
      ${M.panel({ title: "Mua sắm", body: M.kv([
        ["Nhà cung cấp", v ? `<a href="#/vendors/${v.id}">${M.esc(v.name)}</a>` : null],
        ["Đơn mua", pu.po ? `<a class="mono" href="#/purchases/${M.esc(pu.po)}">${M.esc(pu.po)}</a>` : null],
        ["Ngày mua", pu.date ? M.esc(pu.date) : null],
        ["Giá mua", showCost ? (pu.cost ? `<span class="mono">${M.money(pu.cost)}</span>` : null) : '<span class="muted">Ẩn</span>'],
        ["Giá trị còn lại", !showCost ? '<span class="muted">Ẩn</span>' : res ? `<span class="mono">${M.money(res.value)}</span> <span class="small muted">- đã dùng ${res.months}/${res.depMonths} tháng</span>` : '<span class="muted">Chưa đủ dữ liệu</span>'],
      ]) })}
      ${M.panel({ title: "Bảo hành", actions: M.btn("Tra theo serial", { sm: true, perm: "warranty.edit", msg: "Đã tra theo serial: kết quả trùng với giá trị đang lưu, không có gì thay đổi." }), body: M.kv([
        ["Hết bảo hành", w.end ? `${M.esc(w.end)} ${days != null ? M.pill(days < 0 ? "Đã hết hạn" : "Còn " + days + " ngày", days < 0 ? "mute" : days <= 30 ? "bad" : days <= 90 ? "warn" : "ok") : ""}` : null],
        ["Loại", w.type ? M.esc(w.type) : null], ["Nguồn", w.source ? M.esc(w.source) : null], ["Tra lúc", w.checked ? M.esc(w.checked) : null],
      ]) })}
      </div>
      ${M.panel({ title: `Hợp đồng bao trùm (${contracts.length})`, flush: true, body: M.table({ cols: [{ h: "Số hợp đồng", r: (c) => `<span class="mono">${M.esc(c.no || c.id)}</span>` }, { h: "Loại", r: (c) => M.esc(c.type) }, { h: "Hiệu lực", r: (c) => `${M.esc(c.start)} → ${M.esc(c.end)}` }], rows: contracts, href: () => "#/contracts", empty: "Tài sản chưa thuộc hợp đồng nào." }) })}
      ${M.panel({ title: "Chứng từ đính kèm", body: `<div class="row">${M.icon("paperclip")}<a href="#/assets/${a.id}" data-msg="Mockup: tải hoa-don-${M.esc((pu.po || "").toLowerCase())}.pdf">hoa-don-${M.esc((pu.po || "chua-co").toLowerCase())}.pdf</a><span class="muted small">PDF - 412 KB</span></div>` })}`;
  };

  M.screen("assets/:id", {
    nav: "assets", title: "Chi tiết tài sản", codes: ["NV-2.2.1", "NV-2.2.2", "NV-2.2.3", "NV-2.2.5", "NV-2.2.6", "NV-2.4.1", "NV-2.4.2"],
    render(p) {
      const a = M.asset(p.id);
      if (!a) return M.page({ title: "Không tìm thấy tài sản này.", back: ["#/assets", "Tài sản"] });
      const m = M.model(a.model);
      const c = M.assetCat(a);
      const kids = children(a);
      const hos = D.handovers.filter((h) => h.assetIds.includes(a.id));
      const disp = D.disposals.find((x) => x.assetId === a.id);
      const info = M.panel({ title: "Thông tin", body: M.kv([
        ["Đang giao cho", a.holder ? M.holderHtml(a) : a.location ? `<span class="muted">Trong kho - ${M.esc(M.locPath(a.location))}</span>` : '<span class="muted">—</span>'],
        ["Danh mục", c ? M.esc(c.name) : '<span class="muted">Chưa phân loại</span>'],
        ["Serial", a.serial ? `<span class="mono">${M.esc(a.serial)}</span>` : '<span class="muted">Chưa có</span>'],
        ["Hãng / Model", m ? M.esc(m.maker + " " + m.name) : '<span class="muted">Chưa có</span>'],
        ["Đơn vị", M.esc((M.find("orgUnits", a.unit) || {}).name || "")],
        ["Ghi chú", a.note ? M.esc(a.note) : '<span class="muted">Không có</span>'],
        ["Ngày thêm", M.esc(a.created)],
      ]) });
      const overview = `<div class="side-layout"><div class="stack">
          ${info}
          ${disp && a.status === "archived" ? M.panel({ title: "Thông tin thanh lý", body: M.kv([["Mã đề nghị", M.esc(disp.id)], ["Ngày", M.esc(disp.date)], ["Lý do", M.esc(disp.reason)], ["Hình thức", M.esc(disp.method)], ["Giá trị thu hồi", M.money(disp.value)], ["Người duyệt", M.esc(disp.approvedBy || "")], ["Chứng từ", (disp.docs || []).length ? disp.docs.map(M.esc).join("<br>") : null]]) }) : ""}
          ${actionsPanel(a)}
          ${kids.length ? M.panel({ title: `Tài sản gắn kèm (${kids.length})`, flush: true, body: M.table({ cols: [{ h: "Mã", r: (k) => M.tape(k.tag) }, { h: "Tài sản", cls: "wrap", r: (k) => M.esc(k.name) }, { h: "Trạng thái", r: (k) => M.led(k.status) }], rows: kids, href: (k) => "#/assets/" + k.id }) }) : ""}
          ${M.panel({ title: "Nhật ký lưu ký", body: logList(a) })}
        </div>
        <div class="stack">
          ${M.assetLabel(a)}
          <div class="row">${M.btn("In tem", { icon: "printer", msg: "Mockup: in riêng tem này, rộng 80 mm." })}${M.btn("In nhiều tem", { href: "#/labels?ids=" + a.id, ghost: true })}</div>
          ${hos.length ? M.panel({ title: "Biên bản", flush: true, body: M.table({ cols: [{ h: "Số", r: (h) => `<span class="mono small">${M.esc(h.id)}</span>` }, { h: "Loại", r: (h) => M.esc(M.HANDOVER_KIND[h.kind]) }, { h: "", r: (h) => statusPill(h) }], rows: hos, href: (h) => "#/handovers/" + h.id }) }) : ""}
        </div></div>`;
      const nT = list("tickets").filter((t) => (t.assetIds || []).includes(a.id)).length;
      const nC = list("cves").filter((x) => (x.assetIds || []).includes(a.id)).length;
      return M.page({
        back: ["#/assets", "Tài sản"],
        codes: ["NV-2.2.1", "NV-2.2.2", "NV-2.2.3", "NV-2.2.5", "NV-2.2.6", "NV-2.4.1", "NV-2.4.2"],
        title: `<span class="row" style="gap:14px">${M.tape(a.tag, null, "xl")}<span>${M.esc(a.name)}</span></span>`,
        sub: `${M.led(a.status)} ${a.holder ? " - " + M.esc(M.holderText(a)) : ""}`,
        actions: (a.status !== "archived" ? M.btn("Sửa thông tin", { href: `#/assets/${a.id}/edit`, perm: "asset.edit", icon: "pen" }) : "") + M.btn("Tạo ticket", { href: "#/tickets/new?asset=" + a.id, perm: "ticket.work" }),
        body: M.tabs("asset-" + a.id, [
          { key: "ov", label: "Tổng quan", body: overview },
          { key: "tech", label: "Hồ sơ kỹ thuật", body: techTab(a) },
          { key: "hw", label: "Thay đổi phần cứng", n: list("hwChanges").filter((h) => h.assetId === a.id).length || null, body: hwTab(a) },
          { key: "cmp", label: "Linh kiện", body: compTab(a) },
          { key: "risk", label: "Phần mềm & rủi ro", n: nC || null, body: riskTab(a) },
          { key: "tk", label: "Ticket", n: nT || null, body: ticketTab(a) },
          { key: "rel", label: "Quan hệ", body: relTab(a) },
          { key: "fin", label: "Tài chính & bảo hành", body: finTab(a) },
        ]),
      });
    },
  });

  /* ---------- Hộp thoại thao tác trên tài sản ---------- */
  M.defModal("checkout", (id) => {
    const a = M.asset(id);
    const parents = D.assets.filter((x) => x.id !== a.id && x.status === "deployed" && !(x.holder && x.holder.type === "asset"));
    return {
      title: `Cấp phát ${a.tag}`, submit: "Cấp phát",
      body: `${M.codeChips(["NV-2.2.1", "NV-2.3.1"])}
        ${M.field("Cấp phát cho", M.select("target", [
          { group: "Nhân viên", options: empOptions().map(([v, l]) => ["e:" + v, l]) },
          { group: "Vị trí", options: D.locations.map((l) => ["l:" + l.id, M.locPath(l.id)]) },
          { group: "Gắn vào tài sản khác", options: parents.map((x) => ["a:" + x.id, `${x.tag} - ${x.name}`]) },
        ], "", { blank: "Chọn một nơi nhận" }), { req: true })}
        ${M.field("Ngày dự kiến trả (nếu cho mượn)", M.input("due", { ph: "dd/mm/yyyy" }))}
        ${M.field("Ghi chú", M.textarea("note", "", { rows: 2 }))}
        ${M.cc("CC-10", "Tài sản chưa được ký nhận có được coi là đã cấp phát không, và quá hạn bao lâu thì xử lý thế nào.")}`,
      onSubmit(d, form) {
        if (!d.target) return M.invalid(form, "target", "Chọn đúng một nơi nhận: một nhân viên hoặc một vị trí.");
        if (a.status !== "ready") { M.toast(`Chỉ cấp phát được tài sản đang Sẵn sàng cấp phát. Tài sản này đang ở trạng thái ${M.STATUS[a.status]}.`, "bad"); return false; }
        const [type, tid] = d.target.split(":");
        a.holder = { type: { e: "employee", l: "location", a: "asset" }[type], id: tid };
        a.status = "deployed";
        let msg = `Đã cấp phát ${a.tag} cho ${M.holderText(a)}.`;
        let sign = null;
        if (type === "e") {
          const hid = nextHandoverId();
          D.handovers.unshift({ id: hid, kind: "issue", employeeId: tid, assetIds: [a.id], accessories: [], createdAt: NOW, createdBy: actor(), status: "pending", termsId: "tm2", termsVersion: 2, due: "04/12/2026" });
          msg += ` Biên bản ${hid} đã gửi email cho ${M.emp(tid).email}.`;
          sign = "pending";
        }
        addLog(a, { action: "checkout", title: "Cấp phát cho " + M.holderText(a).replace(/^Gắn vào /, "tài sản "), from: "ready", to: "deployed", note: d.note + (d.due ? ` - Dự kiến trả ${d.due}` : ""), sign });
        return msg;
      },
    };
  });
  M.defModal("checkin", (id) => {
    const a = M.asset(id);
    return {
      title: `Thu hồi ${a.tag}`, submit: "Thu hồi",
      body: `${M.codeChips(["NV-2.2.2"])}
        ${M.kv([["Đang giao cho", M.holderHtml(a)], children(a).length ? ["Thu hồi cùng", children(a).map((k) => M.tape(k.tag)).join(" ")] : null])}
        ${M.field("Trạng thái sau khi thu hồi", M.select("to", [["ready", M.STATUS.ready], ["maintenance", M.STATUS.maintenance], ["broken", M.STATUS.broken]], "ready"), { req: true })}
        ${M.field("Ghi chú", M.textarea("note", "", { rows: 2 }))}
        ${a.holder.type === "employee" ? M.checkbox("ho", "Sinh biên bản trả để nhân viên ký xác nhận", true) : ""}`,
      onSubmit(d) {
        const who = M.holderText(a);
        addLog(a, { action: "checkin", title: "Thu hồi từ " + who, from: "deployed", to: d.to, note: d.note, sign: d.ho ? "pending" : null });
        if (d.ho && a.holder.type === "employee") D.handovers.unshift({ id: nextHandoverId(), kind: "return", employeeId: a.holder.id, assetIds: [a.id], accessories: [], createdAt: NOW, createdBy: actor(), status: "pending", termsId: "tm2", termsVersion: 2, due: "04/12/2026" });
        children(a).forEach((k) => { k.holder = null; k.status = "ready"; k.location = "l7"; addLog(k, { action: "checkin", title: "Thu hồi cùng " + a.tag, from: "deployed", to: "ready" }); });
        a.holder = null; a.status = d.to; a.location = "l7";
        return `Đã thu hồi ${a.tag} từ ${who}.`;
      },
    };
  });
  M.defModal("status", (id) => {
    const a = M.asset(id);
    const opts = ["ready", "maintenance", "broken"].filter((s) => s !== a.status).map((s) => [s, M.STATUS[s]]);
    return {
      title: `Đổi trạng thái ${a.tag}`, submit: "Đổi trạng thái",
      body: `${M.codeChips(["NV-2.2.3"])}${M.kv([["Hiện tại", M.led(a.status)]])}
        ${M.field("Trạng thái mới", M.select("to", opts, opts[0][0]), { req: true })}
        ${M.field("Ghi chú", M.textarea("note", "", { rows: 2 }))}`,
      onSubmit(d) {
        if (d.to === a.status) { M.toast(`Tài sản đang ở trạng thái ${M.STATUS[a.status]} rồi.`, "bad"); return false; }
        addLog(a, { action: "status", title: "Đổi trạng thái", from: a.status, to: d.to, note: d.note });
        a.status = d.to;
        return `Đã đổi trạng thái ${a.tag} sang ${M.STATUS[d.to]}.`;
      },
    };
  });
  M.defModal("transfer", (id) => {
    const a = M.asset(id);
    return {
      title: `Điều chuyển ${a.tag}`, submit: "Điều chuyển",
      body: `${M.codeChips(["NV-2.2.6"])}${M.kv([["Bên giao", M.holderHtml(a)]])}
        ${M.field("Bên nhận", M.select("to", empOptions((e) => e.status === "active" && e.id !== a.holder.id), "", { blank: "Chọn nhân viên" }), { req: true })}
        ${M.field("Lý do", M.textarea("note", "", { rows: 2 }))}`,
      onSubmit(d, form) {
        if (!d.to) return M.invalid(form, "to", "Chọn người nhận.");
        const from = M.emp(a.holder.id), to = M.emp(d.to);
        addLog(a, { action: "checkin", title: "Thu hồi từ " + from.name, from: "deployed", to: "ready", note: "Điều chuyển - " + d.note });
        a.holder = { type: "employee", id: d.to };
        addLog(a, { action: "checkout", title: "Cấp phát cho " + to.name, from: "ready", to: "deployed", note: "Điều chuyển từ " + from.name, sign: "pending" });
        const hid = nextHandoverId();
        D.handovers.unshift({ id: hid, kind: "transfer", employeeId: d.to, fromEmployeeId: from.id, assetIds: [a.id], accessories: [], createdAt: NOW, createdBy: actor(), status: "pending", termsId: "tm2", termsVersion: 2, due: "04/12/2026" });
        return `Đã điều chuyển ${a.tag} từ ${from.name} sang ${to.name}. Biên bản ${hid} chờ hai bên ký.`;
      },
    };
  });
  M.defModal("dispose", (id) => {
    const a = M.asset(id);
    const res = typeof M.residual === "function" ? M.residual(a) : null;
    const hasComp = D.components.some((c) => c.installed.some(([aid]) => aid === a.id));
    return {
      title: `Đề nghị thanh lý ${a.tag}`, submit: "Gửi đề nghị", danger: true,
      body: `${M.codeChips(["NV-2.2.4", "NV-5.3.2", "NV-5.1.4"])}
        <div class="form-grid">
        ${M.field("Ngày thanh lý", M.input("date", { ph: "dd/mm/yyyy" }), { req: true })}
        ${M.field("Hình thức", M.select("method", ["Bán thanh lý", "Tiêu hủy", "Tặng, cho"], "", { blank: "Chọn hình thức" }), { req: true })}
        ${M.field("Lý do", M.textarea("reason", "", { rows: 2 }), { req: true, full: true })}
        ${M.field("Giá trị thu hồi (₫)", M.input("value", { type: "number", value: 0 }))}
        ${M.field("Giá trị còn lại trên sổ", M.input("res", { ro: true, value: res ? M.money(res.value) : "Chưa đủ dữ liệu" }))}
        ${M.field("Chứng từ", M.input("doc", { type: "file" }), { full: true, hint: "PDF hoặc ảnh, tối đa 10 MB." })}
        ${hasComp ? `<div class="full field">Linh kiện đang lắp${M.radio("cmp", "back", "Tháo về kho", true)}${M.radio("cmp", "with", "Thanh lý kèm", false)}</div>` : ""}
        </div>
        ${M.note("Thanh lý là thao tác không đảo ngược. Tài sản vẫn nằm trong hệ thống cùng toàn bộ lịch sử.", "warn")}
        ${M.cc("CC-8", "Thanh lý có cần người thứ hai duyệt không. Mockup đang vẽ theo hướng cần Quản trị hệ thống duyệt.")}`,
      onSubmit(d, form) {
        if (!d.date) return M.invalid(form, "date", "Nhập ngày thanh lý.");
        if (!d.method) return M.invalid(form, "method", "Chọn hình thức thanh lý.");
        if (!d.reason.trim()) return M.invalid(form, "reason", "Nhập lý do thanh lý.");
        const tid = "TL-2026-0" + (D.disposals.length + 6);
        D.disposals.unshift({ id: tid, assetId: a.id, state: "pending", at: "27/11/2026", by: actor(), date: d.date, reason: d.reason, method: d.method, value: +d.value || 0, docs: [] });
        return `Đã gửi đề nghị thanh lý ${tid}, chờ duyệt.`;
      },
    };
  });

  /* =====================================================================
     Phụ kiện (NV-2.1.3)
     ===================================================================== */
  M.screen("accessories", {
    nav: "accessories", title: "Phụ kiện", codes: ["NV-2.1.3"],
    render() {
      const issued = (x) => x.holdings.reduce((s, h) => s + h[1], 0);
      const holders = [];
      D.accessories.forEach((x) => x.holdings.forEach(([eid, q]) => holders.push({ x, e: M.emp(eid), q })));
      return M.page({
        title: "Phụ kiện", codes: ["NV-2.1.3"],
        actions: M.btn("Khai báo phụ kiện", { primary: true, icon: "plus", perm: "stock.manage", modal: "acc-new" }),
        body: M.tabs("acc", [
          { key: "list", label: "Danh sách", n: D.accessories.length, body: `<section class="panel flush">${M.toolbar(M.searchBox("acc-table", "Tìm phụ kiện"))}${M.table({
            id: "acc-table",
            cols: [
              { h: "Phụ kiện", cls: "cell-name", r: (x) => `${M.esc(x.name)}<div class="cell-sub">${M.esc(M.find("locations", x.location).name)}</div>` },
              { h: "Tổng", cls: "right", r: (x) => `<span class="mono">${x.total}</span>` },
              { h: "Đang cấp", cls: "right", r: (x) => `<span class="mono">${issued(x)}</span>` },
              { h: "Tồn kho", r: (x) => `<span class="mono">${x.stock}</span> ${x.stock <= x.min ? M.pill("Dưới ngưỡng " + x.min, "warn") : ""}` },
              { h: "", cls: "right", r: (x) => M.btn("Cấp", { sm: true, modal: "acc-issue", arg: x.id, perm: "stock.manage" }) + " " + M.btn("Thu hồi", { sm: true, modal: "acc-return", arg: x.id, perm: "stock.manage" }) + " " + M.btn("Nhập thêm", { sm: true, modal: "acc-restock", arg: x.id, perm: "stock.manage" }) + " " + M.btn("Điều chỉnh", { sm: true, ghost: true, modal: "acc-adjust", arg: x.id, perm: "stock.manage" }) },
            ], rows: D.accessories })}</section>` },
          { key: "holders", label: "Ai đang giữ", n: holders.length, body: `<section class="panel flush">${M.table({ cols: [{ h: "Nhân viên", r: (h) => M.person(h.e.name, "#/employees/" + h.e.id, h.e.status !== "active" ? M.EMP_STATUS[h.e.status][0] : "") }, { h: "Phụ kiện", r: (h) => M.esc(h.x.name) }, { h: "Số lượng", cls: "right", r: (h) => `<span class="mono">${h.q}</span>` }], rows: holders })}</section>` },
          { key: "log", label: "Nhật ký", body: `<section class="panel flush">${M.table({ cols: [{ h: "Thời điểm", r: (l) => `<span class="mono small">${M.esc(l.at)}</span>` }, { h: "Phụ kiện", r: (l) => M.esc(D.accessories.find((x) => x.id === l.id).name) }, { h: "Nội dung", cls: "wrap", r: (l) => M.esc(l.text) }, { h: "Người thao tác", r: (l) => M.esc(l.by) }], rows: D.accessoryLog })}</section>` },
        ]),
      });
    },
  });
  const acc = (id) => D.accessories.find((x) => x.id === id);
  M.defModal("acc-new", () => ({
    title: "Khai báo phụ kiện", submit: "Lưu",
    body: `<div class="form-grid">${M.field("Tên phụ kiện", M.input("name"), { req: true, full: true })}${M.field("Loại", M.input("kind", { ph: "Chuột, bàn phím, tai nghe…" }))}${M.field("Vị trí kho", M.select("loc", D.locations.filter((l) => l.kind === "Kho").map((l) => [l.id, M.locPath(l.id)]), "l7"))}${M.field("Số lượng nhập", M.input("qty", { type: "number", value: 1 }), { req: true })}${M.field("Ngưỡng tối thiểu", M.input("min", { type: "number", value: 2 }))}</div>`,
    onSubmit(d, form) {
      if (!d.name.trim()) return M.invalid(form, "name", "Nhập tên phụ kiện.");
      if (!(+d.qty > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
      D.accessories.push({ id: "ac" + (D.accessories.length + 1), name: d.name.trim(), kind: d.kind || "Khác", location: d.loc, total: +d.qty, stock: +d.qty, min: +d.min || 0, holdings: [] });
      return `Đã khai báo ${d.name.trim()}.`;
    },
  }));
  M.defModal("acc-issue", (id) => {
    const x = acc(id);
    return {
      title: `Cấp ${x.name}`, submit: "Cấp",
      body: `${M.kv([["Tồn kho", `<b class="mono">${x.stock}</b>`]])}${M.field("Người nhận", M.select("emp", empOptions(), "", { blank: "Chọn nhân viên" }), { req: true })}${M.field("Số lượng", M.input("qty", { type: "number", value: 1 }), { req: true })}`,
      onSubmit(d, form) {
        if (!d.emp) return M.invalid(form, "emp", "Chọn người nhận.");
        const q = +d.qty;
        if (!(q > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
        if (q > x.stock) return M.invalid(form, "qty", `Không đủ tồn kho: còn ${x.stock} chiếc.`);
        x.stock -= q;
        const h = x.holdings.find((r) => r[0] === d.emp);
        h ? (h[1] += q) : x.holdings.push([d.emp, q]);
        D.accessoryLog.unshift({ at: NOW, id, text: `Cấp ${q} cho ${M.emp(d.emp).name}`, by: actor() });
        return `Đã cấp ${q} ${x.name} cho ${M.emp(d.emp).name}. Tồn kho còn ${x.stock}.`;
      },
    };
  });
  M.defModal("acc-return", (id) => {
    const x = acc(id);
    return {
      title: `Thu hồi ${x.name}`, submit: "Thu hồi",
      body: `${M.field("Nhận lại từ", M.select("emp", x.holdings.map(([eid, q]) => [eid, `${M.emp(eid).name} - đang giữ ${q}`]), "", { blank: "Chọn nhân viên" }), { req: true })}${M.field("Số lượng", M.input("qty", { type: "number", value: 1 }), { req: true })}
        <div class="field">Tình trạng${M.radio("cond", "ok", "Còn dùng được, nhập lại kho", true)}${M.radio("cond", "broken", "Hỏng, không nhập lại kho", false)}${M.radio("cond", "lost", "Mất", false)}</div>`,
      onSubmit(d, form) {
        if (!d.emp) return M.invalid(form, "emp", "Chọn nhân viên.");
        const h = x.holdings.find((r) => r[0] === d.emp);
        const q = +d.qty;
        if (!(q > 0) || q > h[1]) return M.invalid(form, "qty", `Nhân viên này đang giữ ${h[1]} chiếc.`);
        h[1] -= q;
        if (!h[1]) x.holdings.splice(x.holdings.indexOf(h), 1);
        if (d.cond === "ok") x.stock += q; else x.total -= q;
        D.accessoryLog.unshift({ at: NOW, id, text: `Thu hồi ${q} từ ${M.emp(d.emp).name} - ${{ ok: "Nhập lại kho", broken: "Hỏng, không nhập lại kho", lost: "Mất" }[d.cond]}`, by: actor() });
        return `Đã thu hồi ${q} ${x.name}.`;
      },
    };
  });
  M.defModal("acc-restock", (id) => {
    const x = acc(id);
    return {
      title: `Nhập thêm ${x.name}`, submit: "Nhập kho",
      body: `${M.field("Số lượng", M.input("qty", { type: "number", value: 10 }), { req: true })}${M.field("Đơn mua (PO)", M.input("po", { ph: "PO-2026-…" }))}`,
      onSubmit(d, form) {
        const q = +d.qty;
        if (!(q > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
        x.stock += q; x.total += q;
        D.accessoryLog.unshift({ at: NOW, id, text: `Nhập thêm ${q}${d.po ? " - " + d.po : ""}`, by: actor() });
        return `Đã nhập thêm ${q}. Tồn kho ${x.stock}.`;
      },
    };
  });
  M.defModal("acc-adjust", (id) => {
    const x = acc(id);
    return {
      title: `Điều chỉnh tồn ${x.name}`, submit: "Lưu",
      body: `${M.field("Số tồn thực tế", M.input("stock", { type: "number", value: x.stock }), { req: true })}${M.field("Lý do", M.textarea("reason", "", { rows: 2, ph: "Ví dụ: đếm lại khi kiểm kê" }), { req: true })}`,
      onSubmit(d, form) {
        if (!d.reason.trim()) return M.invalid(form, "reason", "Sửa số tồn phải ghi lý do.");
        D.accessoryLog.unshift({ at: NOW, id, text: `Điều chỉnh tồn ${x.stock} → ${d.stock} - Lý do: ${d.reason}`, by: actor() });
        x.total += +d.stock - x.stock; x.stock = +d.stock;
        return "Đã điều chỉnh số tồn.";
      },
    };
  });

  /* =====================================================================
     Linh kiện (NV-2.1.4)
     ===================================================================== */
  M.screen("components", {
    nav: "components", title: "Linh kiện", codes: ["NV-2.1.4"],
    render() {
      const inst = [];
      D.components.forEach((c) => c.installed.forEach(([aid, qty, at, by]) => inst.push({ c, a: M.asset(aid), qty, at, by })));
      return M.page({
        title: "Linh kiện", codes: ["NV-2.1.4"],
        actions: M.btn("Khai báo linh kiện", { primary: true, icon: "plus", perm: "component.manage", msg: "Mockup: mở form tên, loại, số lượng tồn, ngưỡng." }),
        body: `${M.panel({ title: "Tồn kho linh kiện", flush: true, body: M.table({ cols: [
            { h: "Linh kiện", cls: "cell-name", r: (c) => M.esc(c.name) },
            { h: "Tồn kho", r: (c) => `<span class="mono">${c.stock}</span> ${c.stock <= c.min ? M.pill(c.stock ? "Dưới ngưỡng" : "Hết hàng", c.stock ? "warn" : "bad") : ""}` },
            { h: "Đang lắp", cls: "right", r: (c) => `<span class="mono">${c.installed.reduce((s, x) => s + x[1], 0)}</span>` },
            { h: "", cls: "right", r: (c) => M.btn("Lắp vào tài sản", { sm: true, modal: "cmp-install", arg: "cmp:" + c.id, perm: "component.manage" }) },
          ], rows: D.components }) })}
          ${M.panel({ title: "Đang lắp trong tài sản", flush: true, body: M.table({ cols: [
            { h: "Tài sản", r: (x) => M.tape(x.a.tag, x.a.id) + " " + M.esc(x.a.name) }, { h: "Linh kiện", cls: "wrap", r: (x) => M.esc(x.c.name) }, { h: "SL", r: (x) => x.qty }, { h: "Ngày lắp", r: (x) => M.esc(x.at) },
            { h: "", r: (x) => M.btn("Tháo ra", { sm: true, modal: "cmp-remove", arg: x.c.id + ":" + x.a.id, perm: "component.manage" }) },
          ], rows: inst }) })}`,
      });
    },
  });
  M.defModal("cmp-install", (arg) => {
    const [kind, id] = arg.split(":");
    const fixedAsset = kind === "asset" ? M.asset(id) : null;
    const fixedComp = kind === "cmp" ? D.components.find((c) => c.id === id) : null;
    return {
      title: "Lắp linh kiện vào tài sản", submit: "Lắp",
      body: `${fixedComp ? M.kv([["Linh kiện", M.esc(fixedComp.name)], ["Tồn kho", String(fixedComp.stock)]]) : M.field("Linh kiện", M.select("cmp", D.components.map((c) => [c.id, `${c.name} - tồn ${c.stock}`]), "", { blank: "Chọn linh kiện" }), { req: true })}
        ${fixedAsset ? M.kv([["Tài sản", M.tape(fixedAsset.tag) + " " + M.esc(fixedAsset.name)]]) : M.field("Mã tài sản nhận", M.input("tag", { ph: "TS-000005" }), { req: true })}
        ${M.field("Số lượng", M.input("qty", { type: "number", value: 1 }), { req: true })}`,
      onSubmit(d, form) {
        const c = fixedComp || D.components.find((x) => x.id === d.cmp);
        if (!c) return M.invalid(form, "cmp", "Chọn linh kiện.");
        const a = fixedAsset || M.assetByTag(d.tag || "");
        if (!a) return M.invalid(form, "tag", `Không có tài sản nào mang mã ${d.tag}.`);
        if (a.status === "archived") return fixedAsset ? (M.toast("Không lắp linh kiện vào tài sản đã thanh lý.", "bad"), false) : M.invalid(form, "tag", "Không lắp linh kiện vào tài sản đã thanh lý.");
        const q = +d.qty;
        if (!(q > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
        if (q > c.stock) return M.invalid(form, "qty", `Không đủ tồn kho: còn ${c.stock}.`);
        c.stock -= q;
        c.installed.push([a.id, q, "27/11/2026", actor()]);
        D.componentLog.unshift({ at: NOW, assetId: a.id, text: `Lắp ${q} × ${c.name}`, by: actor() });
        return `Đã lắp ${q} × ${c.name} vào ${a.tag}.`;
      },
    };
  });
  M.defModal("cmp-remove", (arg) => {
    const [cid, aid] = arg.split(":");
    const c = D.components.find((x) => x.id === cid), a = M.asset(aid);
    return {
      title: "Tháo linh kiện", submit: "Tháo ra",
      body: `${M.kv([["Linh kiện", M.esc(c.name)], ["Từ tài sản", M.tape(a.tag) + " " + M.esc(a.name)]])}<div class="field">Sau khi tháo${M.radio("to", "stock", "Trả về kho", true)}${M.radio("to", "broken", "Ghi nhận hỏng", false)}</div>`,
      onSubmit(d) {
        const i = c.installed.findIndex((x) => x[0] === aid);
        const q = c.installed[i][1];
        c.installed.splice(i, 1);
        if (d.to === "stock") c.stock += q;
        D.componentLog.unshift({ at: NOW, assetId: aid, text: `Tháo ${q} × ${c.name} - ${d.to === "stock" ? "về kho" : "hỏng"}`, by: actor() });
        return `Đã tháo ${c.name} khỏi ${a.tag}.`;
      },
    };
  });

  /* =====================================================================
     Vật tư tiêu hao (NV-2.1.5)
     ===================================================================== */
  M.screen("consumables", {
    nav: "consumables", title: "Vật tư tiêu hao", codes: ["NV-2.1.5", "NT-6"],
    render() {
      const low = D.consumables.filter((c) => c.stock <= c.min);
      const table = (rows) => M.table({ cols: [
        { h: "Vật tư", cls: "cell-name", r: (c) => `${M.esc(c.name)}<div class="cell-sub">${M.esc(M.find("locations", c.location).name)}</div>` },
        { h: "Tồn kho", r: (c) => `<span class="mono">${c.stock} ${M.esc(c.unit)}</span> ${c.stock <= c.min ? M.pill("Dưới ngưỡng", "bad") : ""}` },
        { h: "Ngưỡng tối thiểu", r: (c) => `<span class="mono">${c.min}</span>` },
        { h: "", cls: "right", r: (c) => M.btn("Xuất", { sm: true, modal: "cs-issue", arg: c.id, perm: "stock.manage" }) + " " + M.btn("Nhập thêm", { sm: true, modal: "cs-restock", arg: c.id, perm: "stock.manage" }) },
      ], rows });
      return M.page({
        title: "Vật tư tiêu hao", codes: ["NV-2.1.5", "NT-6"],
        actions: M.btn("Khai báo vật tư", { primary: true, icon: "plus", perm: "stock.manage", msg: "Mockup: mở form tên, đơn vị, số tồn, ngưỡng tối thiểu." }),
        body: `${M.tabs("cs", [
            { key: "all", label: "Tất cả", n: D.consumables.length, body: `<section class="panel flush">${table(D.consumables)}</section>` },
            { key: "low", label: "Dưới ngưỡng", n: low.length, body: `<section class="panel flush">${table(low)}</section>` },
            { key: "log", label: "Lịch sử xuất nhập", body: `<section class="panel flush">${M.table({ cols: [{ h: "Thời điểm", r: (l) => `<span class="mono small">${M.esc(l.at)}</span>` }, { h: "Vật tư", r: (l) => M.esc(D.consumables.find((c) => c.id === l.id).name) }, { h: "Số lượng", r: (l) => `<span class="mono" style="color:var(--${l.qty < 0 ? "bad" : "ok"})">${l.qty > 0 ? "+" : ""}${l.qty}</span>` }, { h: "Cho / nguồn", cls: "wrap", r: (l) => M.esc(l.to) }, { h: "Người thao tác", r: (l) => M.esc(l.by) }], rows: D.consumableLog })}</section>` },
          ])}`,
      });
    },
  });
  M.defModal("cs-issue", (id) => {
    const c = D.consumables.find((x) => x.id === id);
    return {
      title: `Xuất ${c.name}`, submit: "Xuất kho",
      body: `${M.kv([["Tồn kho", `<b class="mono">${c.stock} ${M.esc(c.unit)}</b>`]])}${M.field("Xuất cho", M.select("to", [{ group: "Nhân viên", options: empOptions().map(([v, l]) => ["e:" + v, l]) }, { group: "Vị trí", options: D.locations.map((l) => ["l:" + l.id, M.locPath(l.id)]) }], "", { blank: "Chọn người hoặc vị trí" }), { req: true })}${M.field("Số lượng", M.input("qty", { type: "number", value: 1 }), { req: true })}`,
      onSubmit(d, form) {
        if (!d.to) return M.invalid(form, "to", "Chọn người hoặc vị trí nhận.");
        const q = +d.qty;
        if (!(q > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
        if (q > c.stock) return M.invalid(form, "qty", `Không đủ tồn kho: còn ${c.stock} ${c.unit}.`);
        c.stock -= q;
        const [t, tid] = d.to.split(":");
        D.consumableLog.unshift({ at: NOW, id, qty: -q, to: t === "e" ? M.emp(tid).name : M.find("locations", tid).name, by: actor() });
        return c.stock <= c.min ? `Đã xuất ${q} ${c.unit}. Tồn kho ${c.stock}, đã chạm ngưỡng: đã gửi cảnh báo cho Quản lý tài sản.` : `Đã xuất ${q} ${c.unit}. Tồn kho còn ${c.stock}.`;
      },
    };
  });
  M.defModal("cs-restock", (id) => {
    const c = D.consumables.find((x) => x.id === id);
    return {
      title: `Nhập thêm ${c.name}`, submit: "Nhập kho",
      body: `${M.field("Số lượng", M.input("qty", { type: "number", value: 10 }), { req: true })}${M.field("Đơn mua (PO)", M.input("po", { ph: "PO-2026-…" }))}`,
      onSubmit(d, form) {
        const q = +d.qty;
        if (!(q > 0)) return M.invalid(form, "qty", "Số lượng phải lớn hơn 0.");
        c.stock += q;
        D.consumableLog.unshift({ at: NOW, id, qty: q, to: "Nhập kho" + (d.po ? " - " + d.po : ""), by: actor() });
        return `Đã nhập ${q} ${c.unit}. Tồn kho ${c.stock}.`;
      },
    };
  });

  /* =====================================================================
     Biên bản bàn giao (NV-2.3.1) và điều khoản (NV-2.3.3)
     ===================================================================== */
  M.screen("handovers", {
    nav: "handovers", title: "Biên bản bàn giao", codes: ["NV-2.3.1", "NV-2.3.2"],
    render(p, q) {
      const by = (s) => D.handovers.filter((h) => h.status === s).length;
      const rows = q.st ? D.handovers.filter((h) => h.status === q.st) : D.handovers;
      return M.page({
        title: "Biên bản bàn giao", codes: ["NV-2.3.1", "NV-2.3.2"],
        body: `${M.stats([
            { label: "Chờ ký", value: by("pending"), tone: "warn", href: "#/handovers?st=pending" },
            { label: "Quá hạn ký", value: by("overdue"), tone: "bad", href: "#/handovers?st=overdue" },
            { label: "Bị từ chối", value: by("rejected"), tone: "bad", href: "#/handovers?st=rejected" },
            { label: "Đã ký", value: by("signed"), tone: "ok", href: "#/handovers?st=signed" },
          ])}
          ${M.cc("CC-9", "Bấm xác nhận sau khi đăng nhập là đủ, hay cần chữ ký số có giá trị pháp lý.")}
          <section class="panel flush">${M.toolbar(M.searchBox("ho-table", "Tìm theo số biên bản, nhân viên, mã tài sản") + (q.st ? `<a class="linklike" href="#/handovers">Bỏ lọc</a>` : ""))}${M.table({
            id: "ho-table",
            cols: [
              { h: "Số biên bản", r: (h) => `<span class="mono">${M.esc(h.id)}</span>` },
              { h: "Loại", r: (h) => M.esc(M.HANDOVER_KIND[h.kind]) },
              { h: "Nhân viên", r: (h) => M.person(M.emp(h.employeeId).name) },
              { h: "Tài sản", cls: "wrap", r: (h) => h.assetIds.map((id) => M.tape(M.asset(id).tag)).join(" ") },
              { h: "Trạng thái ký", r: (h) => statusPill(h) + (h.status === "overdue" ? `<div class="cell-sub">Đã nhắc ${h.reminded} lần</div>` : "") },
              { h: "", cls: "right", r: (h) => ["pending", "overdue"].includes(h.status) ? M.btn("Nhắc ký", { sm: true, act: "ho-remind", arg: h.id, roles: ["admin", "asset"] }) : "" },
            ], rows, href: (h) => "#/handovers/" + h.id,
          })}</section>`,
      });
    },
  });
  M.action("ho-remind", (el, id) => { const h = D.handovers.find((x) => x.id === id); h.reminded = (h.reminded || 0) + 1; return `Đã gửi lại email nhắc ${M.emp(h.employeeId).name} ký ${id}.`; });

  /* Bản biên bản dạng giấy, dùng chung cho màn quản lý và cổng nhân viên. */
  M.handoverDoc = (h) => {
    const e = M.emp(h.employeeId);
    const fromE = h.fromEmployeeId ? M.emp(h.fromEmployeeId) : null;
    const t = D.terms.find((x) => x.id === h.termsId);
    return `<div style="background:#fff;color:#111;border:1px solid var(--line-strong);border-radius:4px;padding:32px 36px;font-size:13.5px;line-height:1.6">
      <div style="display:flex;justify-content:space-between;gap:16px;font-size:12px"><div><b>${M.esc(D.company.toUpperCase())}</b><br>Phòng IT</div><div style="text-align:right"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br>Độc lập - Tự do - Hạnh phúc</div></div>
      <h2 style="text-align:center;color:#111;font:700 20px/1.3 var(--font-body);letter-spacing:.02em;text-transform:uppercase;margin:24px 0 4px">Biên bản ${M.esc(M.HANDOVER_KIND[h.kind].toLowerCase())} tài sản</h2>
      <p style="text-align:center;font-family:var(--font-mono);font-size:12px">Số ${M.esc(h.id)} - lập lúc ${M.esc(h.createdAt)}</p>
      <p style="margin-top:18px"><b>Bên giao:</b> ${fromE ? M.esc(fromE.name) + " (" + M.esc(fromE.code) + ")" : h.kind === "return" ? M.esc(e.name) + " (" + M.esc(e.code) + ")" : "Phòng IT, đại diện " + M.esc(h.createdBy)}</p>
      <p><b>Bên nhận:</b> ${h.kind === "return" ? "Phòng IT, đại diện " + M.esc(h.createdBy) : M.esc(e.name) + " (" + M.esc(e.code) + "), " + M.esc(M.dept(e.dept).name)}</p>
      <table style="margin-top:14px;border:1px solid #999"><thead><tr>${["Mã tài sản", "Tên", "Serial", "Tình trạng"].map((x) => `<th style="background:#eee;color:#111;border:1px solid #999">${x}</th>`).join("")}</tr></thead>
      <tbody>${h.assetIds.map((id) => { const a = M.asset(id); return `<tr>${[a.tag, a.name, a.serial || "", "Hoạt động tốt"].map((x) => `<td style="border:1px solid #999;white-space:normal">${M.esc(x)}</td>`).join("")}</tr>`; }).join("")}
      ${(h.accessories || []).map(([n, q]) => `<tr><td style="border:1px solid #999">Phụ kiện</td><td style="border:1px solid #999" colspan="2">${M.esc(n)}</td><td style="border:1px solid #999">Số lượng ${q}</td></tr>`).join("")}</tbody></table>
      ${t ? `<p style="margin-top:16px"><b>Điều khoản sử dụng</b> (${M.esc(t.name)}, phiên bản ${h.termsVersion}):</p><ol style="margin:4px 0 0">${t.body.map((x) => `<li>${M.esc(x)}</li>`).join("")}</ol>` : ""}
      <div style="display:flex;justify-content:space-around;margin-top:28px;text-align:center"><div><b>Bên giao</b><br><i style="font-size:12px">${M.esc(h.createdBy)}</i></div><div><b>Bên nhận</b><br>${h.status === "signed" ? `<i style="font-size:12px">Đã xác nhận điện tử lúc ${M.esc(h.signedAt)}<br>IP ${M.esc(h.ip)}</i>` : `<i style="font-size:12px;color:#888">Chưa ký</i>`}</div></div>
    </div>`;
  };
  M.screen("handovers/:id", {
    nav: "handovers", title: "Biên bản", codes: ["NV-2.3.1"],
    render(p) {
      const h = D.handovers.find((x) => x.id === p.id);
      if (!h) return M.page({ title: "Không tìm thấy biên bản", back: ["#/handovers", "Biên bản"] });
      const e = M.emp(h.employeeId);
      const steps = h.status === "signed" ? 3 : h.status === "rejected" ? 2 : 1;
      return M.page({
        back: ["#/handovers", "Biên bản bàn giao"], codes: ["NV-2.3.1", "NV-2.3.3"],
        title: `Biên bản ${M.esc(h.id)}`, sub: `${M.esc(M.HANDOVER_KIND[h.kind])} - ${M.esc(e.name)} - ${statusPill(h)}`,
        actions: M.btn("Tải PDF", { icon: "download", msg: `Mockup: tải ${h.id}.pdf (bản đã sinh, không đổi theo dữ liệu mới).` }) + (["pending", "overdue"].includes(h.status) ? M.btn("Nhắc ký", { act: "ho-remind", arg: h.id, roles: ["admin", "asset"] }) : ""),
        body: `<div class="side-layout"><div>${M.handoverDoc(h)}</div><div class="stack">
          ${M.panel({ title: "Tiến trình", body: M.steps(["Sinh biên bản", "Gửi email", "Nhân viên xem", "Ký xác nhận"], steps) })}
          ${M.panel({ title: "Thông tin ký", body: M.kv([["Trạng thái", statusPill(h)], ["Hạn ký", h.due ? M.esc(h.due) : null], ["Ký lúc", h.signedAt ? M.esc(h.signedAt) : null], ["Địa chỉ IP", h.ip ? `<span class="mono">${M.esc(h.ip)}</span>` : null], ["Lý do từ chối", h.reason ? M.esc(h.reason) : null]]) })}
          ${h.status === "rejected" ? M.note("Nhân viên từ chối ký. Thu hồi rồi cấp lại nếu cần.", "bad") : ""}
          ${h.status === "overdue" ? M.cc("CC-10", "Quá hạn ký bao lâu thì xử lý thế nào; trong lúc chờ, tài sản có được coi là đã cấp phát không.") : ""}
        </div></div>`,
      });
    },
  });

  M.screen("terms", {
    nav: "terms", title: "Điều khoản sử dụng", codes: ["NV-2.3.3"],
    render() {
      return M.page({
        title: "Điều khoản sử dụng", codes: ["NV-2.3.3"],
        actions: M.btn("Soạn điều khoản mới", { primary: true, icon: "plus", perm: "terms.edit", msg: "Mockup: mở trình soạn điều khoản mới." }),
        body: `<div class="grid g2">${D.terms.map((t) => M.panel({
          title: `${M.esc(t.name)} - v${t.version}`,
          actions: M.btn("Sửa thành phiên bản mới", { sm: true, modal: "terms-edit", arg: t.id, perm: "terms.edit" }),
          body: `<div class="stack-sm">
            <div class="row">${t.cats.map((c) => M.pill(M.cat(c).name, "info")).join("")}<span class="small muted">Cập nhật ${M.esc(t.updated)} bởi ${M.esc(t.by)}</span></div>
            <ol>${t.body.map((x) => `<li>${M.esc(x)}</li>`).join("")}</ol>
            <hr class="divider"><h2>Các phiên bản</h2>
            <ul class="log">${t.history.map(([v, at, n]) => `<li><time>${M.esc(at)}</time><div><div class="log-title">Phiên bản ${v}</div><div class="log-meta">${M.esc(n)}</div></div></li>`).join("")}</ul>
          </div>`,
        })).join("")}</div>`,
      });
    },
  });
  M.defModal("terms-edit", (id) => {
    const t = D.terms.find((x) => x.id === id);
    return {
      title: `Sửa ${t.name}`, submit: `Lưu thành phiên bản ${t.version + 1}`, wide: true,
      body: `${M.field("Nội dung (mỗi dòng một điều)", M.textarea("body", t.body.join("\n"), { rows: 8 }), { req: true })}${M.field("Ghi chú thay đổi", M.input("note"), { req: true })}${M.field("Áp dụng cho danh mục", `<div class="row">${D.categories.map((c) => M.checkbox("cat_" + c.id, c.name, t.cats.includes(c.id))).join("")}</div>`)}`,
      onSubmit(d, form) {
        if (!d.note.trim()) return M.invalid(form, "note", "Ghi ngắn gọn đã thay đổi gì.");
        t.version += 1; t.body = d.body.split("\n").filter((x) => x.trim()); t.updated = "27/11/2026"; t.by = actor();
        t.cats = D.categories.filter((c) => d["cat_" + c.id]).map((c) => c.id);
        t.history.unshift([t.version, "27/11/2026", d.note]);
        return `Đã lưu phiên bản ${t.version}.`;
      },
    };
  });

  /* =====================================================================
     Kiểm kê (NV-2.4.3, NV-2.4.4)
     ===================================================================== */
  const stState = { draft: ["Nháp", "mute"], running: ["Đang kiểm", "info"], closed: ["Đã đóng, chờ kết luận", "warn"], done: ["Hoàn tất", "ok"] };
  M.screen("stocktakes", {
    nav: "stocktakes", title: "Kiểm kê", codes: ["NV-2.4.3"],
    render() {
      return M.page({
        title: "Kiểm kê", codes: ["NV-2.4.3", "NV-2.4.4"],
        actions: M.btn("Mở đợt kiểm kê", { primary: true, icon: "plus", modal: "st-open", perm: "stocktake.manage" }),
        body: `${M.cc("CC-11", "Kiểm kê có cần chạy được khi mất mạng rồi đồng bộ sau không (phần tốn công nhất của PWA).")}
          <section class="panel flush">${M.table({
          cols: [
            { h: "Mã đợt", r: (s) => `<span class="mono">${M.esc(s.id)}</span>` },
            { h: "Tên đợt", cls: "cell-name", r: (s) => M.esc(s.name) },
            { h: "Tiến độ", r: (s) => { const done = s.items.filter((i) => i[2] !== "pending").length; return s.items.length ? `<div class="row nowrap">${M.progress(done, s.items.length)}<span class="mono small">${done}/${s.items.length}</span></div>` : '<span class="muted small">Chưa chốt danh sách</span>'; } },
            { h: "Chênh lệch", r: (s) => (s.discrepancies.length ? `<span class="mono">${s.discrepancies.length}</span>` : "") },
            { h: "Thời hạn", r: (s) => M.esc(s.due) },
            { h: "Trạng thái", r: (s) => M.pill(stState[s.state][0], stState[s.state][1]) },
          ], rows: D.stocktakes, href: (s) => "#/stocktakes/" + s.id,
        })}</section>`,
      });
    },
  });
  M.defModal("st-open", () => ({
    title: "Mở đợt kiểm kê", submit: "Mở đợt",
    body: `<div class="form-grid">${M.field("Tên đợt", M.input("name", { ph: "Kiểm kê quý IV - …" }), { req: true, full: true })}
      ${M.field("Phạm vi theo", M.select("by", [["loc", "Vị trí"], ["cat", "Danh mục"], ["unit", "Đơn vị"]], "loc"))}
      ${M.field("Giá trị", M.select("scope", D.locations.map((l) => [l.id, M.locPath(l.id)]), "l2"))}
      ${M.field("Thời hạn", M.input("due", { ph: "dd/mm/yyyy" }), { req: true })}
      ${M.field("Người thực hiện", M.select("who", empOptions(), "e6"))}</div>`,
    onSubmit(d, form) {
      if (!d.name.trim()) return M.invalid(form, "name", "Nhập tên đợt.");
      if (!d.due) return M.invalid(form, "due", "Nhập thời hạn.");
      return "Đã mở đợt kiểm kê và chốt danh sách 15 tài sản.";
    },
  }));
  M.screen("stocktakes/:id", {
    nav: "stocktakes", title: "Đợt kiểm kê", codes: ["NV-2.4.3", "NV-2.4.4"],
    render(p) {
      const s = D.stocktakes.find((x) => x.id === p.id);
      if (!s) return M.page({ title: "Không tìm thấy đợt kiểm kê", back: ["#/stocktakes", "Kiểm kê"] });
      const found = s.items.filter((i) => i[2] === "found").length;
      const pending = s.items.filter((i) => i[2] === "pending");
      const open = s.discrepancies.filter((x) => !x.conclusion).length;
      const res = { found: ["Đã thấy", "ok"], pending: ["Chưa quét", "mute"], missing: ["Không thấy", "bad"] };
      const itemTable = M.table({ id: "st-items", cols: [
        { h: "Tài sản", r: (i) => { const a = M.asset(i[0]); return `${M.tape(a.tag, a.id)} <span class="small">${M.esc(a.name)}</span>`; } },
        { h: "Theo sổ sách", cls: "wrap", r: (i) => M.esc(M.find("locations", i[1]).name) },
        { h: "Kết quả", r: (i) => M.pill(res[i[2]][0], res[i[2]][1]) },
        { h: "Thấy tại", r: (i) => (i[5] ? M.esc(M.find("locations", i[5]).name) + (i[5] !== i[1] ? " " + M.pill("Khác sổ", "warn") : "") : "") },
        { h: "Quét lúc", r: (i) => (i[3] ? `<span class="mono small">${M.esc(i[3])}</span>` : "") },
      ], rows: s.items, empty: "Đợt nháp chưa chốt danh sách." });
      const discTable = M.table({ cols: [
        { h: "Loại", r: (x) => M.pill(DISC[x.type][0], DISC[x.type][1]) },
        { h: "Chi tiết", cls: "wrap", r: (x) => `${x.assetId ? M.tape(M.asset(x.assetId).tag, x.assetId) + " " : ""}${M.esc(x.detail)}` },
        { h: "Kết luận", cls: "wrap", r: (x, i) => x.conclusion ? `<b>${M.esc(x.conclusion)}</b>` : M.btn("Kết luận", { sm: true, modal: "st-conclude", arg: s.id + ":" + i, perm: "stocktake.manage" }) },
      ], rows: s.discrepancies, empty: "Không có chênh lệch." });
      const actions = s.state === "running"
        ? M.btn("Mở màn quét trên điện thoại", { href: `#/stocktakes/${s.id}/scan`, icon: "phone" }) + M.btn("Đóng đợt", { act: "st-close", arg: s.id, perm: "stocktake.manage", confirm: `Đóng đợt ${s.id}? ${pending.length} tài sản chưa quét sẽ thành chênh lệch "Thất lạc" và không quét thêm được.` })
        : s.state === "closed" ? M.btn("Hoàn tất đợt", { primary: true, act: "st-finish", arg: s.id, perm: "stocktake.manage" }) : s.state === "done" ? M.btn("Xuất báo cáo kiểm kê", { href: "#/reports", icon: "download" }) : "";
      return M.page({
        back: ["#/stocktakes", "Kiểm kê"], codes: ["NV-2.4.3", "NV-2.4.4"],
        title: M.esc(s.name), sub: `<span class="mono">${M.esc(s.id)}</span> - ${M.esc(s.scope)} - ${M.pill(stState[s.state][0], stState[s.state][1])}`,
        actions,
        body: `${M.stats([
            { label: "Đã thấy", value: found, tone: "ok", sub: s.items.length ? Math.round((found / s.items.length) * 100) + "%" : "" },
            { label: "Chưa quét", value: pending.length, tone: "mute" },
            { label: "Chênh lệch chưa kết luận", value: open, tone: open ? "warn" : "ok" },
          ])}
          ${M.kv([["Người mở đợt", M.esc(s.owner)], ["Người kiểm", M.esc(s.counters.join(", ") || "Chưa phân công")], ["Mở lúc", M.esc(s.opened || "Chưa mở")], ["Thời hạn", M.esc(s.due)]])}
          ${M.tabs("st-" + s.id, [
            { key: "items", label: "Danh sách cần kiểm", n: s.items.length, body: `<section class="panel flush">${M.toolbar(M.searchBox("st-items", "Lọc theo mã, tên, vị trí"))}${itemTable}</section>` },
            { key: "disc", label: "Chênh lệch", n: s.discrepancies.length, body: `${M.cc("CC-12", "Có thêm trạng thái \"Thất lạc\" vào vòng đời tài sản không. Hiện năm trạng thái chưa có chỗ cho thiết bị không tìm thấy.")}<section class="panel flush">${discTable}</section>` },
          ], s.state === "closed" || s.state === "done" ? "disc" : "items")}`,
      });
    },
  });
  M.defModal("st-conclude", (arg) => {
    const [sid, i] = arg.split(":");
    const x = D.stocktakes.find((s) => s.id === sid).discrepancies[+i];
    return {
      title: `Kết luận: ${DISC[x.type][0]}`, submit: "Lưu kết luận",
      body: `<p>${M.esc(x.detail)}</p><div class="field">Cách xử lý${DISC[x.type][3].map((o, k) => M.radio("c", o, o, k === 0)).join("")}</div>${M.field("Ghi chú", M.textarea("note", "", { rows: 2 }))}`,
      onSubmit(d) { x.conclusion = d.c + (d.note ? " - " + d.note : ""); return "Đã lưu kết luận. Thao tác tương ứng được ghi vào nhật ký lưu ký của tài sản."; },
    };
  });
  M.action("st-close", (el, id) => {
    const s = D.stocktakes.find((x) => x.id === id);
    s.items.filter((i) => i[2] === "pending").forEach((i) => { i[2] = "missing"; s.discrepancies.push({ type: "missing", assetId: i[0], detail: `Có trong danh sách nhưng không quét thấy. Theo sổ sách ở ${M.find("locations", i[1]).name}.`, conclusion: null }); });
    s.state = "closed";
    M.tabState["st-" + id] = "disc";
    M.refresh();
    return `Đã đóng đợt ${id}. Lập xong danh sách chênh lệch.`;
  });
  M.action("st-finish", (el, id) => {
    const s = D.stocktakes.find((x) => x.id === id);
    const open = s.discrepancies.filter((x) => !x.conclusion).length;
    if (open) { M.toast(`Còn ${open} chênh lệch chưa có kết luận nên chưa hoàn tất được.`, "bad"); return; }
    s.state = "done"; M.refresh();
    return `Đợt ${id} đã hoàn tất. Kết quả được lưu để đối chiếu với các đợt sau.`;
  });

  /* Màn quét trên điện thoại */
  M.screen("stocktakes/:id/scan", {
    nav: "stocktakes", title: "Quét kiểm kê", codes: ["NV-2.4.3", "NV-2.4.2"],
    render(p, q) {
      const s = D.stocktakes.find((x) => x.id === p.id);
      if (!s) return M.page({ title: "Không tìm thấy đợt kiểm kê" });
      const done = s.items.filter((i) => i[2] === "found").length;
      const last = q.last ? M.assetByTag(q.last) : null;
      const inScope = last && s.items.find((i) => i[0] === last.id);
      return M.page({
        back: ["#/stocktakes/" + s.id, s.id], codes: ["NV-2.4.3", "NV-2.4.2"],
        title: "Quét kiểm kê trên điện thoại",
        body: `<div class="phone"><div class="phone-bar"><span>09:41</span><span>ITAM - ${M.esc(s.id)}</span><span>4G ▮▮▮</span></div><div class="phone-body">
          <div class="row between"><b>${M.esc(s.name)}</b></div>
          <div class="row">${M.progress(done, s.items.length)}<span class="mono small">${done}/${s.items.length}</span></div>
          <div class="viewfinder"><span style="position:absolute;bottom:10px">Đưa tem QR vào khung</span></div>
          ${last ? (inScope ? M.note(`<b>${M.esc(last.tag)}</b> - ${M.esc(last.name)}<br>Đã ghi nhận tại ${M.esc(M.find("locations", inScope[5] || inScope[1]).name)}.`, "ok") : M.note(`<b>${M.esc(last.tag)}</b> không thuộc phạm vi đợt. Đã ghi thành chênh lệch "ngoài phạm vi".`, "warn")) : ""}
          ${M.form("scan-tag", `<input type="hidden" name="sid" value="${M.esc(s.id)}"><div class="stack-sm">
            ${M.field("Thấy ở vị trí", M.select("loc", D.locations.filter((l) => ["Phòng", "Kho", "Tủ rack"].includes(l.kind)).map((l) => [l.id, l.name]), "l3"))}
            ${M.field("Tình trạng", M.select("cond", ["Hoạt động tốt", "Trầy xước", "Hỏng"], "Hoạt động tốt"))}
            ${M.field("Nhập mã thủ công", M.input("tag", { ph: "TS-000019" }))}
            ${M.btn("Ghi nhận", { primary: true, type: "submit" })}</div>`)}
          <h2>Còn lại</h2>
          <div class="stack-sm">${s.items.filter((i) => i[2] === "pending").map((i) => { const a = M.asset(i[0]); return `<div class="row between small">${M.tape(a.tag)}<span class="muted">${M.esc(M.find("locations", i[1]).name)}</span></div>`; }).join("") || '<p class="muted small">Đã quét hết danh sách.</p>'}</div>
        </div></div>`,
      });
    },
  });
  M.action("scan-tag", (form, d) => {
    const s = D.stocktakes.find((x) => x.id === d.sid);
    const a = M.assetByTag(d.tag || "TS-000019");
    if (!a) { M.toast(`Không có tài sản nào mang mã ${d.tag}.`, "bad"); return; }
    const it = s.items.find((i) => i[0] === a.id);
    if (it) { it[2] = "found"; it[3] = NOW; it[4] = actor(); it[5] = d.loc; }
    else s.discrepancies.push({ type: "outofscope", assetId: a.id, detail: `Quét được ${a.tag} tại ${M.find("locations", d.loc).name}, ngoài phạm vi đợt.`, conclusion: null });
    M.go(`stocktakes/${s.id}/scan?last=${a.tag}`);
  });

  /* =====================================================================
     Thanh lý (NV-2.2.4)
     ===================================================================== */
  M.screen("disposals", {
    nav: "disposals", title: "Thanh lý", codes: ["NV-2.2.4", "NV-5.3.2"],
    render() {
      const st = { pending: ["Chờ duyệt", "warn"], done: ["Đã thanh lý", "mute"], rejected: ["Từ chối", "bad"] };
      return M.page({
        title: "Thanh lý", codes: ["NV-2.2.4", "NV-5.3.2", "NV-5.1.4"],
        sub: "Lập đề nghị thanh lý từ trang chi tiết tài sản.",
        body: `${M.cc("CC-8", "Thanh lý có cần người thứ hai duyệt không. Mockup vẽ theo hướng Quản lý tài sản đề nghị, Quản trị hệ thống duyệt.")}
          <section class="panel flush">${M.table({ cols: [
            { h: "Mã", r: (x) => `<span class="mono">${M.esc(x.id)}</span>` },
            { h: "Tài sản", r: (x) => { const a = M.asset(x.assetId); return M.tape(a.tag, a.id) + " " + M.esc(a.name); } },
            { h: "Lý do", cls: "wrap", r: (x) => M.esc(x.reason) + (x.state === "pending" ? x.docs.map((f) => `<span class="row small">${M.icon("paperclip")}${M.esc(f)}</span>`).join("") : "") },
            { h: "Hình thức", r: (x) => M.esc(x.method) + (x.value ? ` - <span class="mono">${M.money(x.value)}</span>` : "") },
            { h: "Trạng thái", r: (x) => M.pill(st[x.state][0], st[x.state][1]) },
            { h: "", r: (x) => (x.state === "pending" ? M.btn("Duyệt", { sm: true, primary: true, act: "disp-approve", arg: x.id, roles: ["admin"] }) + " " + M.btn("Từ chối", { sm: true, act: "disp-reject", arg: x.id, roles: ["admin"] }) : "") },
          ], rows: D.disposals })}</section>`,
      });
    },
  });
  M.action("disp-approve", (el, id) => {
    const x = D.disposals.find((d) => d.id === id);
    const a = M.asset(x.assetId);
    if (x.by === actor()) { M.toast("Người đề nghị không tự duyệt đề nghị của mình.", "bad"); return; }
    addLog(a, { action: "status", title: "Đổi trạng thái", from: a.status, to: "archived", note: `Thanh lý ${x.id} - ${x.method}` });
    a.status = "archived"; a.disposal = x; x.state = "done"; x.approvedBy = actor();
    M.refresh();
    return `Đã duyệt ${x.id}. ${a.tag} chuyển sang Đã thanh lý.`;
  });
  M.action("disp-reject", (el, id) => { const x = D.disposals.find((d) => d.id === id); x.state = "rejected"; M.refresh(); return `Đã từ chối ${x.id}.`; });

  /* =====================================================================
     In tem hàng loạt (NV-2.4.1)
     ===================================================================== */
  M.screen("labels", {
    nav: "labels", title: "In tem hàng loạt", codes: ["NV-2.4.1"],
    render(p, q) {
      const ids = (q.ids || "a10,a11,a19,a23").split(",").filter(Boolean);
      const chosen = ids.map((id) => M.asset(id)).filter(Boolean);
      return M.page({
        title: "In tem hàng loạt", codes: ["NV-2.4.1", "NV-2.4.2"],
        actions: M.btn(`In ${chosen.length} tem`, { primary: true, icon: "printer", msg: `Mockup: gửi ${chosen.length} tem tới máy in.` }),
        body: `<div class="side-layout left">
          <div class="stack">
            ${M.panel({ title: "Mẫu tem", body: `<div class="stack-sm">
              ${M.field("Khổ giấy", M.select("paper", ["Cuộn tem 80 × 40 mm", "Cuộn tem 50 × 30 mm", "A4, 21 tem / tờ (Tomy 145)"], "A4, 21 tem / tờ (Tomy 145)"))}
              <div class="field">Nội dung trên tem${M.checkbox("f_tag", "Mã tài sản", true)}${M.checkbox("f_name", "Tên tài sản", true)}${M.checkbox("f_serial", "Serial", true)}${M.checkbox("f_co", "Tên công ty", true)}${M.checkbox("f_bar", "Mã vạch Code 128 cạnh QR", false)}</div>
              ${M.anno("Đường dẫn trong QR giữ định dạng <code>/#/assets/{id}</code>. Đổi định dạng này làm hỏng mọi tem đã dán.")}
            </div>` })}
            ${M.panel({ title: `Đã chọn ${chosen.length} tài sản`, flush: true, body: M.table({ cols: [{ h: "Mã", r: (a) => M.tape(a.tag) }, { h: "Tên", cls: "wrap", r: (a) => `<span class="small">${M.esc(a.name)}</span>` }], rows: chosen }), foot: `<a href="#/assets">Chọn thêm ở danh sách tài sản</a>` })}
          </div>
          ${M.panel({ title: "Xem trước", body: `<div class="label-sheet">${chosen.map((a) => M.assetLabel(a)).join("")}</div>` })}
        </div>`,
      });
    },
  });

  /* =====================================================================
     Nhập tài sản từ tệp (NV-2.1.6)
     ===================================================================== */
  const IMPORT_ROWS = [
    [2, "Laptop Dell Latitude 5440", "", "4KD8N12", "Dell", "Latitude 5440", "ok", ""],
    [3, "Laptop Dell Latitude 5440", "", "4KD8N13", "Dell", "Latitude 5440", "ok", ""],
    [4, "Màn hình Dell P2422H", "", "CN0F2T4G7501", "Dell", "P2422H", "ok", ""],
    [5, "Màn hình Dell P2422H", "", "CN0F2T4G7502", "Dell", "P2422H", "ok", ""],
    [6, "Laptop HP EliteBook 840 G10", "", "5CG3471JKW", "HP", "EliteBook 840 G10", "err", "Serial 5CG3471JKW đã gắn với tài sản TS-000010."],
    [7, "Máy in HP LaserJet Pro M404dn", "", "PHBBK88231", "HP", "", "err", "Hãng sản xuất và model đi cùng nhau: nhập cả hai hoặc để trống cả hai."],
    [8, "Switch Cisco Catalyst 9200-24P", "TS-000007", "JAE24151Y01", "Cisco", "Catalyst 9200-24P", "err", "Mã tài sản TS-000007 đã có trong hệ thống."],
    [9, "Laptop Lenovo ThinkPad T14 Gen 4", "", "PF4C11AA", "Lenovo", "ThinkPad T14 Gen 4", "ok", ""],
    [10, "Laptop Lenovo ThinkPad T14 Gen 4", "", "PF4C11AA", "Lenovo", "ThinkPad T14 Gen 4", "err", "Trùng serial với dòng 9 trong cùng tệp."],
    [11, "", "", "8XZ00P1", "Dell", "OptiPlex 7010", "err", "Thiếu tên tài sản."],
    [12, "Bộ lưu điện APC Smart-UPS 1500", "", "AS2214129988", "APC", "Smart-UPS 1500", "ok", ""],
  ];
  M.screen("import", {
    nav: "import", title: "Nhập từ tệp", codes: ["NV-2.1.6"],
    render(p, q) {
      const step = +(q.step || 2);
      const ok = IMPORT_ROWS.filter((r) => r[6] === "ok").length;
      const bad = IMPORT_ROWS.length - ok;
      const preview = M.panel({ title: `Xem trước: ${IMPORT_ROWS.length} dòng - ${ok} hợp lệ - ${bad} lỗi`, flush: true,
        actions: M.seg("imp", [["all", "Tất cả"], ["err", "Chỉ dòng lỗi"]], "all"),
        body: M.table({ id: "imp-table", cols: [
          { h: "Dòng", r: (r) => `<span class="mono">${r[0]}</span>` },
          { h: "Tên tài sản", cls: "wrap", r: (r) => (r[1] ? M.esc(r[1]) : '<span class="muted">(trống)</span>') },
          { h: "Mã", r: (r) => `<span class="mono small">${M.esc(r[2] || "Tự sinh")}</span>` },
          { h: "Serial", r: (r) => `<span class="mono small">${M.esc(r[3])}</span>` },
          { h: "Hãng / Model", r: (r) => M.esc([r[4], r[5]].filter(Boolean).join(" - ")) },
          { h: "Kết quả kiểm tra", cls: "wrap", r: (r) => (r[6] === "ok" ? M.pill("Hợp lệ", "ok") : `${M.pill("Lỗi", "bad")} <span class="small">${M.esc(r[7])}</span>`) },
        ], rows: IMPORT_ROWS }) });
      return M.page({
        title: "Nhập tài sản từ tệp", codes: ["NV-2.1.6", "NV-2.1.1"],
        body: `${M.steps(["Tải tệp mẫu", "Tải tệp lên", "Xem trước và kiểm tra", "Xác nhận nhập"], step)}
          <div class="grid g2">
            ${M.panel({ title: "1. Tệp mẫu", body: M.btn("Tải tệp mẫu .xlsx", { icon: "download", msg: "Mockup: tải mau-nhap-tai-san.xlsx" }) })}
            ${M.panel({ title: "2. Tải tệp lên", body: `${M.field("Tệp Excel hoặc CSV", M.input("file", { type: "file", attrs: 'accept=".xlsx,.csv"' }))}<p class="small muted" style="margin-top:8px">Đã chọn: <b>tai-san-phong-ke-toan.xlsx</b> - 11 dòng dữ liệu</p>` })}
          </div>
          ${preview}
          <div class="row">${M.btn(`Nhập ${ok} dòng hợp lệ`, { primary: true, perm: "asset.import", msg: `Đã nhập ${ok} tài sản (TS-000025 đến TS-0000${24 + ok}). Mỗi tài sản có dòng "Thêm tài sản" trong nhật ký lưu ký. ${bad} dòng lỗi được giữ lại để sửa.` })}${M.btn("Tải danh sách dòng lỗi", { icon: "download", msg: "Mockup: tải dong-loi.xlsx có cột lý do." })}</div>`,
      });
    },
  });
  M.action("seg:imp", (v) => {
    document.querySelectorAll("#imp-table tbody tr").forEach((tr) => { tr.style.display = v === "err" && tr.textContent.includes("Hợp lệ") ? "none" : ""; });
  });
})();
