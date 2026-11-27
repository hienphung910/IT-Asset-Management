/* Mockup ITAM - Module 7 (phần báo cáo): báo cáo dựng sẵn, trình tạo báo cáo,
   truy vấn SQL chỉ đọc, đặt lịch gửi báo cáo.
   Mọi báo cáo chạy với quyền của người chạy: cột giá chỉ hiện khi có quyền tài chính. */
(function () {
  "use strict";
  const D = M.data;
  const NOW = "27/11/2026 15:20";
  const dash = '<span class="muted">—</span>';
  const TODAY = new Date(2026, 10, 27);
  const pd = (s) => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(s || "")); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
  const iso = (s) => { const d = pd(s); return d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : ""; };
  const iso2vn = (s) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || "")); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
  const daysLeft = (s) => { const d = pd(s); return d ? Math.round((d - TODAY) / 86400000) : null; };
  const unitName = (id) => (M.find("orgUnits", id) || {}).name || "";
  const n = (x) => (x == null || Number.isNaN(Number(x)) ? "—" : M.num(x));
  const STATUS_TONE = { ready: "ok", deployed: "info", maintenance: "warn", broken: "bad", archived: "mute" };

  /* ===================== Dữ liệu mẫu ===================== */
  D.savedReports = [
    { id: "SR-01", name: "Laptop đang dùng theo đơn vị", source: "assets", owner: "Phạm Thu Hà", shared: ["Quản lý tài sản", "Kiểm toán"], updated: "20/11/2026",
      cfg: { cols: ["tag", "name", "holder", "unit"], filter: { f: "cat", op: "eq", v: "Laptop" }, group: "unit", agg: "count" } },
    { id: "SR-02", name: "Tài sản hết bảo hành nhưng còn dùng", source: "assets", owner: "Phạm Thu Hà", shared: ["Helpdesk"], updated: "12/11/2026",
      cfg: { cols: ["tag", "name", "holder", "warrantyEnd"], filter: { f: "status", op: "eq", v: "Đang sử dụng" }, group: "", agg: "count" } },
    { id: "SR-03", name: "Nhân viên sắp nghỉ còn giữ tài sản", source: "employees", owner: "Phạm Thu Hà", shared: ["Quản trị hệ thống", "Helpdesk"], updated: "26/11/2026",
      cfg: { cols: ["code", "name", "dept", "status", "assets"], filter: { f: "status", op: "neq", v: "Đang làm" }, group: "", agg: "count" } },
    { id: "SR-04", name: "Chi mua sắm theo nhà cung cấp", source: "vendors", owner: "Phạm Thu Hà", shared: [], updated: "15/11/2026",
      cfg: { cols: ["name", "assets", "spend"], filter: { f: "", op: "eq", v: "" }, group: "", agg: "count" } },
  ];
  D.schedules = [
    { id: "SC-01", report: "R1", cycle: "Hàng tuần - Thứ Hai 08:00", recipients: ["ha.pt@anphat.vn", "minh.dq@anphat.vn"], format: "PDF", owner: "Phạm Thu Hà", ownerUser: "ha.pt", enabled: true, lastSent: "24/11/2026 08:00", next: "01/12/2026 08:00" },
    { id: "SC-02", report: "R6", cycle: "Hàng tháng - ngày 1, 07:30", recipients: ["ha.pt@anphat.vn", "anh.nd@anphat.vn"], format: "Excel", owner: "Phạm Thu Hà", ownerUser: "ha.pt", enabled: true, lastSent: "01/11/2026 07:30", next: "01/12/2026 07:30" },
    { id: "SC-03", report: "SR-01", cycle: "Hàng tuần - Thứ Sáu 17:00", recipients: ["mai.ht@anphat.vn"], format: "CSV", owner: "Phạm Thu Hà", ownerUser: "ha.pt", enabled: true, lastSent: "21/11/2026 17:00", next: "28/11/2026 17:00" },
    { id: "SC-04", report: "SR-03", cycle: "Hàng tuần - Thứ Hai 09:00", recipients: ["mai.ht@anphat.vn", "lan.vt@anphat.vn"], format: "Excel", owner: "Võ Thị Lan", ownerUser: "lan.vt", enabled: true, lastSent: "29/09/2026 09:00", next: "" },
    { id: "SC-05", report: "R8", cycle: "Hàng tháng - ngày 5, 08:00", recipients: ["huong.vt@anphat.vn"], format: "Excel", owner: "Vũ Thanh Hương", ownerUser: "huong.vt", enabled: false, lastSent: "05/11/2026 08:00", next: "" },
  ];
  D.scheduleRuns = [
    { at: "24/11/2026 08:00", sched: "SC-01", to: 2, ok: true, note: "Đã gửi PDF 2 trang" },
    { at: "21/11/2026 17:00", sched: "SC-03", to: 1, ok: true, note: "Đã gửi CSV 6 dòng" },
    { at: "17/11/2026 08:00", sched: "SC-01", to: 2, ok: false, note: "Lỗi kênh email: máy chủ SMTP từ chối đăng nhập. Đã thử lại 3 lần." },
    { at: "01/11/2026 07:30", sched: "SC-02", to: 2, ok: true, note: "Đã gửi Excel 4 dòng" },
  ];
  D.sqlLog = [
    { at: "27/11/2026 09:12", who: "Lê Hoàng Nam", sql: "SELECT os_name, COUNT(*) FROM asset GROUP BY os_name;", result: "OK - 6 dòng - 0,04 giây", ok: true },
    { at: "26/11/2026 16:40", who: "Lê Hoàng Nam", sql: "SELECT * FROM scan_credential;", result: "Bị từ chối: chạm bảng nhạy cảm scan_credential", ok: false },
    { at: "25/11/2026 10:05", who: "Trần Minh Quân", sql: "UPDATE asset SET status = 'ready' WHERE id = 12;", result: "Bị từ chối: chỉ chạy được câu SELECT", ok: false },
  ];

  /* ===================== Báo cáo dựng sẵn (NV-7.2.1) ===================== */
  const inRange = (dateStr, f) => { const d = iso(dateStr); return d && (!f.from || d >= f.from) && (!f.to || d <= f.to); };
  const assetsIn = (f) => D.assets.filter((a) => (f.unit === "u0" || !f.unit || a.unit === f.unit) && inRange(a.created, f));
  const rootLoc = (id) => { let l = M.find("locations", id); while (l && l.parent) l = M.find("locations", l.parent); return l; };
  const DISC_LABEL = { location: ["Sai vị trí", "warn"], holder: ["Sai người giữ", "warn"], unregistered: ["Ngoài sổ", "info"], outofscope: ["Ngoài phạm vi đợt", "info"], missing: ["Thất lạc", "bad"] };
  const RESULT_LABEL = { found: ["Đã thấy", "ok"], pending: ["Chưa quét", "mute"], missing: ["Không thấy", "bad"] };

  const REPORTS = [
    { id: "R1", group: "Tài sản", name: "Tài sản theo trạng thái", desc: "Số tài sản ở từng trạng thái.", run(f) {
      const as = assetsIn(f);
      const rows = Object.keys(M.STATUS).map((k) => ({ k, c: as.filter((a) => a.status === k).length }));
      return { chart: M.bars(rows.map((r) => ({ label: M.STATUS[r.k], value: r.c, tone: STATUS_TONE[r.k] }))),
        cols: [{ h: "Trạng thái", r: (r) => M.led(r.k) }, { h: "Số tài sản", cls: "right", r: (r) => `<span class="mono">${r.c}</span>` }, { h: "Tỷ lệ", cls: "right", r: (r) => `<span class="mono">${as.length ? Math.round((r.c / as.length) * 100) : 0}%</span>` }],
        rows, foot: `Tổng ${as.length} tài sản` };
    } },
    { id: "R2", group: "Tài sản", name: "Tài sản theo danh mục", desc: "Số tài sản của từng danh mục, chia theo trạng thái.", run(f) {
      const as = assetsIn(f);
      const rows = D.categories.map((c) => { const xs = as.filter((a) => (M.assetCat(a) || {}).id === c.id); return { c, xs }; }).filter((r) => r.xs.length);
      const cols = [
        { h: "Danh mục", r: (r) => `<b>${M.esc(r.c.name)}</b>` },
        { h: "Tổng", cls: "right", r: (r) => `<span class="mono">${r.xs.length}</span>` },
        { h: "Đang sử dụng", cls: "right", r: (r) => `<span class="mono">${r.xs.filter((a) => a.status === "deployed").length}</span>` },
        { h: "Sẵn sàng", cls: "right", r: (r) => `<span class="mono">${r.xs.filter((a) => a.status === "ready").length}</span>` },
        { h: "Sửa chữa / hỏng / thanh lý", cls: "right", r: (r) => `<span class="mono">${r.xs.filter((a) => !["deployed", "ready"].includes(a.status)).length}</span>` },
      ];
      if (M.can("finance.view")) cols.push({ h: "Tổng giá mua", cls: "right", r: (r) => `<span class="mono">${M.esc(M.money(r.xs.reduce((s, a) => s + ((a.purchase && a.purchase.cost) || 0), 0)))}</span>` });
      return { chart: M.bars(rows.map((r) => ({ label: r.c.name, value: r.xs.length, tone: "info" }))), cols, rows, foot: `${rows.length} danh mục - ${as.length} tài sản` };
    } },
    { id: "R3", group: "Tài sản", name: "Tài sản theo vị trí", desc: "Tài sản theo tòa nhà. Tài sản đang giao cho nhân viên tính riêng.", run(f) {
      const as = assetsIn(f);
      const map = new Map();
      as.forEach((a) => {
        let key;
        if (a.holder && a.holder.type === "employee") key = "Đang giao cho nhân viên";
        else if (a.holder && a.holder.type === "asset") key = "Gắn vào tài sản khác";
        else { const id = a.holder && a.holder.type === "location" ? a.holder.id : a.location; const r = id ? rootLoc(id) : null; key = r ? r.name : "Chưa ghi vị trí"; }
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(a);
      });
      const rows = [...map.entries()].map(([k, xs]) => ({ k, xs })).sort((x, y) => y.xs.length - x.xs.length);
      return { chart: M.bars(rows.map((r) => ({ label: r.k, value: r.xs.length, tone: "accent" }))),
        cols: [{ h: "Vị trí", r: (r) => `<b>${M.esc(r.k)}</b>` }, { h: "Số tài sản", cls: "right", r: (r) => `<span class="mono">${r.xs.length}</span>` }, { h: "Mã tài sản", cls: "wrap", r: (r) => `<span class="row">${r.xs.slice(0, 8).map((a) => M.tape(a.tag, a.id)).join("")}${r.xs.length > 8 ? `<span class="muted small">+${r.xs.length - 8}</span>` : ""}</span>` }],
        rows, foot: `${as.length} tài sản` };
    } },
    { id: "R4", group: "Tài sản", name: "Tài sản theo người giữ", desc: "Mỗi nhân viên đang giữ những tài sản nào.", run(f) {
      const as = assetsIn(f).filter((a) => a.holder && a.holder.type === "employee");
      const rows = D.employees.map((e) => ({ e, xs: as.filter((a) => a.holder.id === e.id) })).filter((r) => r.xs.length).sort((x, y) => y.xs.length - x.xs.length);
      return { cols: [
        { h: "Nhân viên", r: (r) => M.person(r.e.name, "#/employees/" + r.e.id, r.e.code) },
        { h: "Phòng ban", r: (r) => M.esc((M.dept(r.e.dept) || {}).name || "") },
        { h: "Tình trạng", r: (r) => M.pill(...M.EMP_STATUS[r.e.status]) },
        { h: "Số tài sản", cls: "right", r: (r) => `<span class="mono">${r.xs.length}</span>` },
        { h: "Tài sản", cls: "wrap", r: (r) => `<span class="row">${r.xs.map((a) => M.tape(a.tag, a.id)).join("")}</span>` },
      ], rows, foot: `${rows.length} nhân viên - ${as.length} tài sản` };
    } },
    { id: "R5", group: "Tài sản", name: "Lịch sử cấp phát trong khoảng thời gian", desc: "Các lần cấp phát, thu hồi, điều chuyển và trạng thái ký biên bản.", time: true, run(f) {
      const rows = D.handovers.filter((h) => inRange(h.createdAt, f)).sort((x, y) => iso(y.createdAt).localeCompare(iso(x.createdAt)));
      return { stats: [{ label: "Số lần bàn giao", value: rows.length, tone: "info" }, { label: "Chưa ký hoặc quá hạn", value: rows.filter((h) => h.status === "pending" || h.status === "overdue").length, tone: "warn" }],
        cols: [
          { h: "Thời điểm", r: (h) => `<span class="mono small">${M.esc(h.createdAt)}</span>` },
          { h: "Biên bản", r: (h) => `<a class="mono" href="#/handovers/${M.esc(h.id)}">${M.esc(h.id)}</a>` },
          { h: "Loại", r: (h) => M.esc(M.HANDOVER_KIND[h.kind]) },
          { h: "Nhân viên", r: (h) => M.esc((M.emp(h.employeeId) || {}).name || "") },
          { h: "Tài sản", cls: "wrap", r: (h) => `<span class="row">${h.assetIds.map((id) => { const a = M.asset(id); return a ? M.tape(a.tag, a.id) : ""; }).join("")}</span>` },
          { h: "Ký nhận", r: (h) => M.pill(...M.HANDOVER_ST[h.status]) },
        ], rows };
    } },
    { id: "R6", group: "Tài sản", name: "Tài sản sắp hết bảo hành", desc: "Tài sản còn dùng có bảo hành hết trong 90 ngày tới hoặc đã hết.", run(f) {
      const rows = assetsIn(f).filter((a) => a.status !== "archived" && a.warranty && a.warranty.end).map((a) => ({ a, d: daysLeft(a.warranty.end) })).filter((r) => r.d != null && r.d <= 90).sort((x, y) => x.d - y.d);
      return { stats: [{ label: "Sắp hết (≤ 90 ngày)", value: rows.filter((r) => r.d >= 0).length, tone: "warn" }, { label: "Đã hết, vẫn dùng", value: rows.filter((r) => r.d < 0).length, tone: "bad" }],
        cols: [
          { h: "Mã tài sản", r: (r) => M.tape(r.a.tag, r.a.id) },
          { h: "Tài sản", r: (r) => `<div class="cell-name">${M.esc(r.a.name)}</div><div class="cell-sub">${M.esc(M.holderText(r.a) || "Trong kho")}</div>` },
          { h: "Hết bảo hành", r: (r) => M.esc(r.a.warranty.end) },
          { h: "Còn lại", r: (r) => (r.d < 0 ? M.pill(`Đã hết ${-r.d} ngày`, "mute") : M.pill(`Còn ${r.d} ngày`, r.d <= 30 ? "bad" : "warn")) },
          { h: "Nguồn", r: (r) => M.esc(r.a.warranty.source || "") },
        ], rows };
    } },
    { id: "R7", group: "Kho", name: "Tồn kho vật tư", desc: "Số tồn và ngưỡng tối thiểu của vật tư tiêu hao.", run() {
      const rows = D.consumables || [];
      return { stats: [{ label: "Loại vật tư", value: rows.length, tone: "info" }, { label: "Dưới ngưỡng", value: rows.filter((c) => c.stock <= c.min).length, tone: "bad" }],
        cols: [
          { h: "Vật tư", r: (c) => M.esc(c.name) },
          { h: "Tồn kho", cls: "right", r: (c) => `<span class="mono">${n(c.stock)}</span> <span class="small muted">${M.esc(c.unit || "")}</span>` },
          { h: "Ngưỡng tối thiểu", cls: "right", r: (c) => `<span class="mono">${n(c.min)}</span>` },
          { h: "Kho", r: (c) => M.esc(c.location ? M.locPath(c.location) : "") },
          { h: "Tình trạng", r: (c) => (c.stock <= c.min ? M.pill("Dưới ngưỡng", "bad") : M.pill("Đủ", "ok")) },
        ], rows, empty: "Chưa có dữ liệu vật tư." };
    } },
    { id: "R8", group: "Phần mềm", name: "Tuân thủ bản quyền", desc: "Số ghế đã mua so với số bản cài thực tế.", run() {
      const rows = (D.licenses || []).map((l) => {
        const seats = Number(l.seats) || 0;
        const comp = (D.licCompliance || []).find((c) => c.lic === l.id);
        const inst = Number(comp ? comp.installs : l.installed != null ? l.installed : l.used) || 0;
        return { l, seats, inst, st: inst > seats ? ["Thiếu " + (inst - seats), "bad"] : seats > inst ? ["Thừa " + (seats - inst), "warn"] : ["Đủ", "ok"] };
      });
      return { stats: [{ label: "Phần mềm theo dõi", value: rows.length, tone: "info" }, { label: "Thiếu bản quyền", value: rows.filter((r) => r.inst > r.seats).length, tone: "bad" }, { label: "Thừa ghế", value: rows.filter((r) => r.seats > r.inst).length, tone: "warn" }],
        cols: [
          { h: "Phần mềm", r: (r) => `<a href="#/licenses/${M.esc(r.l.id)}">${M.esc(r.l.software || r.l.name || r.l.id)}</a>` },
          { h: "Ghế đã mua", cls: "right", r: (r) => `<span class="mono">${r.seats}</span>` },
          { h: "Bản cài thực tế", cls: "right", r: (r) => `<span class="mono">${r.inst}</span>` },
          { h: "Tình trạng", r: (r) => M.pill(r.st[0], r.st[1]) },
        ], rows, empty: "Chưa có dữ liệu bản quyền." };
    } },
    { id: "R9", group: "Kiểm kê", name: "Kết quả kiểm kê", desc: "Kết quả từng tài sản và danh sách chênh lệch của một đợt kiểm kê.", pick: true, run(f) {
      const list = (D.stocktakes || []).filter((s) => s.items && s.items.length);
      const st = list.find((s) => s.id === f.st) || list.find((s) => s.id === "KK-2026-04") || list[0];
      if (!st) return { cols: [{ h: "Thông báo", r: (r) => r }], rows: [], empty: "Chưa có đợt kiểm kê nào." };
      const items = st.items.map(([assetId, expected, result, at, by, foundAt]) => ({ a: M.asset(assetId), expected, result, at, by, foundAt }));
      const disc = st.discrepancies || [];
      const cnt = (k) => items.filter((x) => x.result === k).length;
      return { st, stats: [
          { label: "Cần kiểm", value: items.length, tone: "mute" }, { label: "Đã thấy", value: cnt("found"), tone: "ok" },
          { label: "Chưa quét / không thấy", value: cnt("pending") + cnt("missing"), tone: "warn" },
        ],
        extra: M.panel({ title: `Chênh lệch (${disc.length})`, flush: true, body: M.table({
          cols: [
            { h: "Loại", r: (d) => M.pill(...(DISC_LABEL[d.type] || [d.type, "mute"])) },
            { h: "Chi tiết", cls: "wrap", r: (d) => `${d.assetId && M.asset(d.assetId) ? M.tape(M.asset(d.assetId).tag, d.assetId) + " " : ""}${M.esc(d.detail)}` },
            { h: "Kết luận", cls: "wrap", r: (d) => (d.conclusion ? M.esc(d.conclusion) : M.pill("Chưa có kết luận", "warn")) },
          ], rows: disc, empty: "Không có chênh lệch." }) }),
        cols: [
          { h: "Mã tài sản", r: (x) => (x.a ? M.tape(x.a.tag, x.a.id) : dash) },
          { h: "Tài sản", r: (x) => (x.a ? `<span class="small">${M.esc(x.a.name)}</span>` : dash) },
          { h: "Vị trí sổ sách", r: (x) => `<span class="small">${M.esc((M.find("locations", x.expected) || {}).name || "")}</span>` },
          { h: "Kết quả", r: (x) => M.pill(...(RESULT_LABEL[x.result] || [x.result, "mute"])) },
          { h: "Thấy tại", r: (x) => (x.foundAt ? `<span class="small">${M.esc((M.find("locations", x.foundAt) || {}).name || "")}</span>${x.foundAt !== x.expected ? " " + M.pill("Khác sổ", "warn") : ""}` : dash) },
          { h: "Người quét", r: (x) => (x.by ? `${M.esc(x.by)}<div class="cell-sub">${M.esc(x.at)}</div>` : dash) },
        ], rows: items, foot: `Đợt ${M.esc(st.id)} - ${M.esc(st.name)}` };
    } },
  ];

  const DEFAULT_FILTER = { from: "2020-01-01", to: "2026-11-27", unit: "u0" };
  M.action("report-run", (form, data) => {
    const q = new URLSearchParams({ r: data.r, from: data.from || "", to: data.to || "", unit: data.unit || "u0" });
    if (data.st) q.set("st", data.st);
    if (data.from && data.to && data.to < data.from) return M.invalid(form, "to", "Ngày kết thúc phải sau ngày bắt đầu.");
    M.go("reports?" + q.toString());
    return "Đã chạy báo cáo với bộ lọc mới.";
  });
  /* Gộp ba nút Excel, CSV, PDF thành một nút Xuất file */
  M.defModal("report-export", (id) => {
    const rep = REPORTS.find((r) => r.id === id) || REPORTS[0];
    return {
      title: `Xuất "${rep.name}"`,
      body: `<div class="field">Định dạng<div class="row">${["Excel", "CSV", "PDF"].map((f, i) => M.radio("fmt", f, f, i === 0)).join("")}</div></div>`,
      submit: "Xuất",
      refresh: false,
      onSubmit(data) { return `Đã xuất "${rep.name}" ra ${data.fmt || "Excel"} (mockup).`; },
    };
  });

  M.screen("reports", {
    nav: "reports", title: "Báo cáo dựng sẵn", codes: ["NV-7.2.1"],
    render(params, query) {
      const rep = REPORTS.find((r) => r.id === query.r) || REPORTS[0];
      const f = { from: query.from || DEFAULT_FILTER.from, to: query.to || DEFAULT_FILTER.to, unit: query.unit || DEFAULT_FILTER.unit, st: query.st || "" };
      const out = rep.run(f);
      const groups = [...new Set(REPORTS.map((r) => r.group))];
      const list = groups.map((g) => `<div class="stack-sm"><h2>${M.esc(g)}</h2>${REPORTS.filter((r) => r.group === g).map((r) => `<a class="nav-item ${r.id === rep.id ? "active" : ""}" href="#/reports?r=${r.id}" title="${M.esc(r.desc)}">${M.icon("chart")}<span>${M.esc(r.name)}</span></a>`).join("")}</div>`).join('<hr class="divider">');
      const stList = (D.stocktakes || []).filter((s) => s.items && s.items.length);
      const filterForm = M.form("report-run", `<input type="hidden" name="r" value="${rep.id}"><div class="row" style="align-items:flex-end">
        ${M.field(rep.time ? "Lập từ ngày" : "Từ ngày", M.input("from", { type: "date", value: f.from }))}
        ${M.field("Đến ngày", M.input("to", { type: "date", value: f.to }))}
        ${M.field("Đơn vị", M.select("unit", (D.orgUnits || []).map((u) => [u.id, u.name]), f.unit))}
        ${rep.pick && stList.length ? M.field("Đợt kiểm kê", M.select("st", stList.map((s) => [s.id, `${s.id} - ${s.name}`]), out.st ? out.st.id : "")) : ""}
        ${M.btn("Chạy báo cáo", { primary: true, type: "submit", icon: "play" })}
      </div>`);
      return M.page({
        title: "Báo cáo dựng sẵn",
        codes: ["NV-7.2.1"],
        body: `<div class="side-layout left">
          ${M.panel({ title: "Danh sách báo cáo", body: `<div class="stack">${list}</div>` })}
          <div class="stack">
            ${M.panel({ title: `<span title="${M.esc(rep.desc)}">${M.esc(rep.name)}</span>`, actions: `<span class="row">${M.btn("Xuất file", { sm: true, icon: "download", modal: "report-export", arg: rep.id })}${M.btn("Đặt lịch gửi", { sm: true, icon: "mail", href: "#/reports/schedules?r=" + rep.id })}</span>`, body: filterForm })}
            ${out.stats ? M.stats(out.stats) : ""}
            ${out.chart ? M.panel({ title: "Biểu đồ", body: out.chart }) : ""}
            ${M.panel({ title: "Kết quả", flush: true, body: M.table({ cols: out.cols, rows: out.rows, empty: out.empty || "Không có dòng nào khớp bộ lọc." }), foot: `<span>${out.foot || ""}</span><span>Chạy lúc ${NOW}</span>` })}
            ${out.extra || ""}
            ${rep.id === "R1" ? M.anno(`Tổng các trạng thái bằng tổng số tài sản (${D.assets.length}) và khớp với thẻ thống kê ở <a href="#/assets">trang Tài sản</a> khi chạy với bộ lọc mặc định (NV-7.2.1).`) : ""}
          </div>
        </div>`,
      });
    },
  });

  /* ===================== Trình tạo báo cáo (NV-7.2.2) ===================== */
  const empAssets = (e) => D.assets.filter((a) => a.holder && a.holder.type === "employee" && a.holder.id === e.id).length;
  const SOURCES = {
    assets: { label: "Tài sản", rows: () => D.assets, fields: [
      { k: "tag", l: "Mã tài sản", v: (a) => a.tag },
      { k: "name", l: "Tên tài sản", v: (a) => a.name },
      { k: "cat", l: "Danh mục", v: (a) => (M.assetCat(a) || {}).name || "Chưa phân loại", cat: true },
      { k: "maker", l: "Hãng", v: (a) => (M.model(a.model) || {}).maker || "Chưa có", cat: true },
      { k: "status", l: "Trạng thái", v: (a) => M.STATUS[a.status], cat: true },
      { k: "holder", l: "Người / nơi giữ", v: (a) => M.holderText(a) || "Trong kho" },
      { k: "unit", l: "Đơn vị", v: (a) => unitName(a.unit), cat: true },
      { k: "purchaseDate", l: "Ngày mua", v: (a) => (a.purchase && a.purchase.date) || "" },
      { k: "cost", l: "Giá mua", v: (a) => (a.purchase && a.purchase.cost) || 0, money: true, finance: true },
      { k: "warrantyEnd", l: "Hết bảo hành", v: (a) => (a.warranty && a.warranty.end) || "" },
    ] },
    employees: { label: "Nhân viên", rows: () => D.employees, fields: [
      { k: "code", l: "Mã NV", v: (e) => e.code },
      { k: "name", l: "Họ tên", v: (e) => e.name },
      { k: "dept", l: "Phòng ban", v: (e) => (M.dept(e.dept) || {}).name || "", cat: true },
      { k: "email", l: "Email", v: (e) => e.email },
      { k: "status", l: "Tình trạng", v: (e) => M.EMP_STATUS[e.status][0], cat: true },
      { k: "unit", l: "Đơn vị", v: (e) => unitName(e.unit), cat: true },
      { k: "assets", l: "Số tài sản đang giữ", v: (e) => empAssets(e), num: true },
    ] },
    vendors: { label: "Nhà cung cấp", rows: () => D.vendors, fields: [
      { k: "name", l: "Tên nhà cung cấp", v: (v) => v.name },
      { k: "taxCode", l: "Mã số thuế", v: (v) => v.taxCode },
      { k: "contact", l: "Người liên hệ", v: (v) => v.contact },
      { k: "active", l: "Trạng thái", v: (v) => (v.active ? "Đang dùng" : "Ngừng dùng"), cat: true },
      { k: "assets", l: "Số tài sản đã mua", v: (v) => D.assets.filter((a) => a.purchase && a.purchase.vendorId === v.id).length, num: true },
      { k: "spend", l: "Tổng giá mua", v: (v) => D.assets.filter((a) => a.purchase && a.purchase.vendorId === v.id).reduce((s, a) => s + (a.purchase.cost || 0), 0), money: true, finance: true },
    ] },
  };
  const bld = { id: null, name: "", source: "assets", cols: ["tag", "name", "cat", "status", "holder"], filter: { f: "status", op: "eq", v: "Đang sử dụng" }, group: "", agg: "count" };
  const visibleFields = (src) => SOURCES[src].fields.filter((x) => !x.finance || M.can("finance.view"));
  const hiddenFields = (src) => SOURCES[src].fields.filter((x) => x.finance && !M.can("finance.view"));
  const fld = (src, k) => SOURCES[src].fields.find((x) => x.k === k);
  const fmtVal = (x, v) => (x.money ? M.money(v) : x.num ? M.num(v) : String(v));
  function runBuilder() {
    const src = SOURCES[bld.source];
    let rows = src.rows();
    const ff = bld.filter.f && fld(bld.source, bld.filter.f);
    if (ff && bld.filter.v !== "") {
      rows = rows.filter((r) => {
        const val = M.fold(ff.v(r));
        const want = M.fold(bld.filter.v);
        return bld.filter.op === "eq" ? val === want : bld.filter.op === "neq" ? val !== want : val.includes(want);
      });
    }
    return rows;
  }
  M.action("bld-source", (el, val) => {
    bld.source = val; bld.id = null;
    bld.cols = SOURCES[val].fields.slice(0, 4).map((x) => x.k);
    bld.filter = { f: "", op: "eq", v: "" }; bld.group = ""; bld.agg = "count";
    M.refresh();
  });
  M.action("bld-col", (el, k) => {
    bld.cols = bld.cols.includes(k) ? bld.cols.filter((x) => x !== k) : bld.cols.concat(k);
    M.refresh();
  });
  M.action("bld-ff", (el, val) => { bld.filter = { f: val, op: "eq", v: "" }; M.refresh(); });
  M.action("bld-op", (el, val) => { bld.filter.op = val; M.refresh(); });
  M.action("bld-fv", (el, val) => { bld.filter.v = val; M.refresh(); });
  M.action("bld-group", (el, val) => { bld.group = val; M.refresh(); });
  M.action("bld-agg", (el, val) => { bld.agg = val; M.refresh(); });
  M.action("bld-open", (el, id) => {
    const s = M.find("savedReports", id);
    Object.assign(bld, { id: s.id, name: s.name, source: s.source, cols: s.cfg.cols.slice(), filter: Object.assign({}, s.cfg.filter), group: s.cfg.group, agg: s.cfg.agg });
    M.refresh();
    return `Đã mở báo cáo "${s.name}". Kết quả chạy theo quyền của bạn.`;
  });
  M.defModal("bld-save", () => {
    const cur = bld.id ? M.find("savedReports", bld.id) : null;
    return {
      title: cur ? "Lưu báo cáo" : "Lưu báo cáo mới",
      body: `${M.field("Tên báo cáo", M.input("name", { value: cur ? cur.name : "" , ph: "Ví dụ: Laptop đang dùng theo đơn vị" }), { req: true })}
        <div class="field">Chia sẻ cho vai trò<div class="row">${M.ROLES.filter((r) => r.key !== "employee").map((r) => M.checkbox("share_" + r.key, r.label, cur ? cur.shared.includes(r.label) : false)).join("")}</div></div>`,
      submit: "Lưu",
      onSubmit(data, form) {
        if (!data.name.trim()) return M.invalid(form, "name", "Đặt tên cho báo cáo.");
        const shared = M.ROLES.filter((r) => data["share_" + r.key]).map((r) => r.label);
        const cfg = { cols: bld.cols.slice(), filter: Object.assign({}, bld.filter), group: bld.group, agg: bld.agg };
        if (cur && M.fold(cur.name) === M.fold(data.name.trim())) { Object.assign(cur, { cfg, shared, source: bld.source, updated: NOW.slice(0, 10) }); return `Đã lưu "${cur.name}".`; }
        const id = "SR-0" + (D.savedReports.length + 1);
        D.savedReports.unshift({ id, name: data.name.trim(), source: bld.source, owner: M.me().user, shared, updated: NOW.slice(0, 10), cfg });
        bld.id = id;
        return `Đã lưu báo cáo "${data.name.trim()}"${shared.length ? `, chia sẻ cho ${shared.join(", ")}` : ""}.`;
      },
    };
  });

  M.screen("reports/builder", {
    nav: "reports/builder", title: "Trình tạo báo cáo", codes: ["NV-7.2.2"],
    render() {
      const src = SOURCES[bld.source];
      const fields = visibleFields(bld.source);
      bld.cols = bld.cols.filter((k) => fields.some((x) => x.k === k));
      const hidden = hiddenFields(bld.source);
      const rows = runBuilder();
      const catFields = fields.filter((x) => x.cat);
      const ff = bld.filter.f && fld(bld.source, bld.filter.f);
      const valueOpts = ff ? [...new Set(src.rows().map((r) => String(ff.v(r))))].sort((a, b) => a.localeCompare(b, "vi")) : [];
      const numFields = fields.filter((x) => x.money || x.num);
      let preview;
      if (bld.group && fld(bld.source, bld.group)) {
        const g = fld(bld.source, bld.group);
        const agg = bld.agg !== "count" && fld(bld.source, bld.agg) && (!fld(bld.source, bld.agg).finance || M.can("finance.view")) ? fld(bld.source, bld.agg) : null;
        const map = new Map();
        rows.forEach((r) => { const k = String(g.v(r)); if (!map.has(k)) map.set(k, []); map.get(k).push(r); });
        const gr = [...map.entries()].map(([k, xs]) => ({ k, c: xs.length, s: agg ? xs.reduce((t, r) => t + Number(agg.v(r) || 0), 0) : 0 }));
        preview = M.table({ cols: [
          { h: M.esc(g.l), r: (x) => `<b>${M.esc(x.k)}</b>` },
          { h: "Số dòng", cls: "right", r: (x) => `<span class="mono">${x.c}</span>` },
          ...(agg ? [{ h: "Tổng " + M.esc(agg.l.toLowerCase()), cls: "right", r: (x) => `<span class="mono">${M.esc(fmtVal(agg, x.s))}</span>` }] : []),
        ], rows: gr, empty: "Không có dòng nào khớp điều kiện." }) + `<div class="panel-body">${M.bars(gr.map((x) => ({ label: x.k, value: agg ? Math.round(agg.money ? x.s / 1e6 : x.s) : x.c, tone: "info" })), { unit: agg && agg.money ? " tr" : "" })}</div>`;
      } else {
        const cols = bld.cols.map((k) => fld(bld.source, k)).filter(Boolean);
        preview = cols.length ? M.table({ cols: cols.map((x) => ({ h: M.esc(x.l), cls: x.money || x.num ? "right" : "", r: (r) => (x.money || x.num ? `<span class="mono">${M.esc(fmtVal(x, x.v(r)))}</span>` : M.esc(x.v(r))) })), rows: rows.slice(0, 15), empty: "Không có dòng nào khớp điều kiện." })
          : M.empty("Chọn ít nhất một trường làm cột.");
      }
      const chip = (x) => `<button type="button" class="chip ${bld.cols.includes(x.k) ? "on" : ""}" data-act="bld-col" data-arg="${x.k}">${M.esc(x.l)}</button>`;
      const left = M.panel({ title: "Cấu hình", body: `<div class="stack">
        ${M.field("Nguồn dữ liệu", M.select("source", Object.entries(SOURCES).map(([k, s]) => [k, s.label]), bld.source, { attrs: 'data-change="bld-source"' }))}
        <div class="field">Trường có sẵn<div class="chips">${fields.map(chip).join("")}</div></div>
        <div class="field">Cột của báo cáo<div class="dropzone">${bld.cols.length ? bld.cols.map((k) => { const x = fld(bld.source, k); return `<button type="button" class="chip on" data-act="bld-col" data-arg="${k}" title="Bỏ cột">${M.esc(x.l)} ×</button>`; }).join("") : '<span class="muted small">Kéo trường vào đây</span>'}</div></div>
        <div class="field">Điều kiện lọc<div class="row" style="flex-wrap:nowrap">
          ${M.select("ff", catFields.map((x) => [x.k, x.l]), bld.filter.f, { blank: "Không lọc", attrs: 'data-change="bld-ff" aria-label="Trường lọc"' })}
          ${ff ? M.select("op", [["eq", "bằng"], ["neq", "khác"], ["has", "chứa"]], bld.filter.op, { attrs: 'data-change="bld-op" aria-label="Phép so sánh" style="width:auto"' }) : ""}
          ${ff ? M.select("fv", valueOpts, bld.filter.v, { blank: "Chọn giá trị", attrs: 'data-change="bld-fv" aria-label="Giá trị"' }) : ""}
        </div></div>
        <div class="grid g2">
          ${M.field("Nhóm theo", M.select("group", catFields.map((x) => [x.k, x.l]), bld.group, { blank: "Không nhóm", attrs: 'data-change="bld-group"' }))}
          ${M.field("Tính", M.select("agg", [["count", "Đếm số dòng"], ...numFields.map((x) => [x.k, "Tổng " + x.l.toLowerCase()])], bld.agg, { attrs: 'data-change="bld-agg"' }))}
        </div>
        ${hidden.length ? M.anno(`Trường ${hidden.map((x) => M.esc(x.l)).join(", ")} bị ẩn vì vai trò ${M.esc(M.me().label)} không có quyền tài chính.`) : ""}
      </div>` });
      const saved = M.panel({ title: `Báo cáo đã lưu (${D.savedReports.length})`, flush: true, body: M.table({
        cols: [
          { h: "Tên", r: (s) => `<b>${M.esc(s.name)}</b>${s.id === bld.id ? " " + M.pill("Đang mở", "info") : ""}` },
          { h: "Nguồn", r: (s) => M.esc(SOURCES[s.source].label) },
          { h: "Người tạo", r: (s) => M.esc(s.owner) },
          { h: "Chia sẻ", cls: "wrap", r: (s) => (s.shared.length ? `<span class="small">${M.esc(s.shared.join(", "))}</span>` : '<span class="muted small">Chỉ người tạo</span>') },
          { h: "Cập nhật", r: (s) => M.esc(s.updated) },
          { h: "", cls: "right", r: (s) => `<span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${M.btn("Mở", { sm: true, act: "bld-open", arg: s.id })}${M.btn("Đặt lịch", { sm: true, ghost: true, href: "#/reports/schedules?r=" + s.id })}</span>` },
        ], rows: D.savedReports,
      }) });
      return M.page({
        title: "Trình tạo báo cáo",
        codes: ["NV-7.2.2"],
        actions: M.btn("Xuất Excel", { icon: "download", msg: "Đã xuất bản xem trước ra Excel (mockup)." }) + M.btn(bld.id ? "Lưu báo cáo" : "Lưu báo cáo mới", { primary: true, icon: "check", modal: "bld-save" }),
        body: `<div class="side-layout left">${left}<div class="stack">
          ${M.panel({ title: `Xem trước - ${M.esc(src.label)}${bld.id ? " - " + M.esc((M.find("savedReports", bld.id) || {}).name || "") : ""}`, flush: true, body: preview, foot: `<span>${rows.length} dòng khớp${!bld.group && rows.length > 15 ? ", hiện 15 dòng đầu" : ""}</span>` })}
          ${saved}
          ${M.anno("Bản thật cho kéo thả trường vào vùng Cột, mockup dùng bấm để chọn. Báo cáo chia sẻ chạy theo quyền của người mở.")}
        </div></div>`,
      });
    },
  });

  /* ===================== Truy vấn SQL chỉ đọc (NV-7.2.3) ===================== */
  const SENSITIVE = ["user_password", "user_session", "session", "scan_credential", "license_key"];
  const SCHEMA = [
    ["asset", "id, tag, name, serial, status, model_id, employee_id, location_id, unit_id, hostname, ip_address, os_name, last_seen"],
    ["employee", "id, code, full_name, email, department_id, status"],
    ["location", "id, name, kind, parent_id"],
    ["category", "id, name, dep_months"],
    ["model", "id, manufacturer, name, category_id"],
    ["custody_log", "id, asset_id, action, from_status, to_status, employee_id, user_id, created_at"],
    ["vendor", "id, name, tax_code, active"],
    ["purchase_order", "id, vendor_id, po_date, cost_center, status"],
    ["license", "id, software, type, seats, expires_at (không gồm khóa bản quyền)"],
  ];
  const sqlState = { text: "SELECT a.tag, a.name, a.status, e.full_name\nFROM asset a\nLEFT JOIN employee e ON e.id = a.employee_id\nWHERE a.status = 'deployed'\nORDER BY a.tag\nLIMIT 50;", result: null };
  M.action("sql-run", (form, data) => {
    const text = data.sql || "";
    sqlState.text = text;
    const clean = text.replace(/--.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const low = clean.toLowerCase();
    const log = (ok, result) => D.sqlLog.unshift({ at: NOW, who: M.me().user, sql: clean.replace(/\s+/g, " ").slice(0, 160), result, ok });
    if (!clean) { sqlState.result = { ok: false, msg: "Nhập câu truy vấn." }; M.refresh(); return; }
    const write = low.match(/\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|replace|merge|call|lock)\b/);
    if (write || !/^(select|with)\b/.test(low)) {
      const msg = `Bị từ chối: chỉ chạy được câu SELECT trên tài khoản cơ sở dữ liệu chỉ đọc. Câu lệnh ${write ? write[1].toUpperCase() : "này"} thay đổi dữ liệu hoặc không phải truy vấn đọc.`;
      sqlState.result = { ok: false, msg }; log(false, "Bị từ chối: chỉ chạy được câu SELECT"); M.refresh(); return msg;
    }
    const hit = SENSITIVE.find((t) => new RegExp("\\b" + t + "\\b").test(low));
    if (hit) {
      const msg = `Bị từ chối: truy vấn chạm bảng nhạy cảm ${hit}. Không đọc được mật khẩu, phiên đăng nhập, thông tin xác thực quét và khóa bản quyền.`;
      sqlState.result = { ok: false, msg }; log(false, "Bị từ chối: chạm bảng nhạy cảm " + hit); M.refresh(); return msg;
    }
    if (/\b(sleep|benchmark|pg_sleep)\s*\(/.test(low)) {
      const msg = "Truy vấn chạy quá giới hạn 30 giây nên đã bị dừng.";
      sqlState.result = { ok: false, msg }; log(false, "Dừng: quá 30 giây"); M.refresh(); return msg;
    }
    const tbl = (low.match(/\bfrom\s+([a-z_]+)/) || [])[1] || "";
    const lim = parseInt((low.match(/\blimit\s+(\d+)/) || [])[1] || "5000", 10);
    const cap = Math.min(lim, 5000);
    let cols = [], rows = [];
    if (/count\s*\(/.test(low) && tbl === "asset") {
      cols = ["status", "count"];
      rows = Object.keys(M.STATUS).map((k) => [k, String(D.assets.filter((a) => a.status === k).length)]);
    } else if (tbl === "asset") {
      const where = (low.match(/status\s*=\s*'([a-z]+)'/) || [])[1];
      cols = ["tag", "name", "status", "full_name"];
      rows = D.assets.filter((a) => !where || a.status === where).sort((x, y) => x.tag.localeCompare(y.tag)).map((a) => [a.tag, a.name, a.status, a.holder && a.holder.type === "employee" ? M.emp(a.holder.id).name : ""]);
    } else if (tbl === "employee") {
      cols = ["code", "full_name", "email", "status"];
      rows = D.employees.map((e) => [e.code, e.name, e.email, e.status]);
    } else if (tbl === "vendor") {
      cols = ["name", "tax_code", "active"];
      rows = D.vendors.map((v) => [v.name, v.taxCode, v.active ? "1" : "0"]);
    } else if (SCHEMA.some((s) => s[0] === tbl)) {
      cols = ["thông báo"];
      rows = [[`Truy vấn hợp lệ trên bảng ${tbl}. Mockup chỉ dựng dữ liệu mẫu cho asset, employee, vendor.`]];
    } else {
      const msg = `Không có bảng ${tbl || "nào"} trong lược đồ chỉ đọc.`;
      sqlState.result = { ok: false, msg }; log(false, "Lỗi: " + msg); M.refresh(); return msg;
    }
    const truncated = rows.length > cap;
    rows = rows.slice(0, cap);
    const secs = (0.02 + (rows.length % 7) / 100).toFixed(2).replace(".", ",");
    sqlState.result = { ok: true, cols, rows, secs, truncated, cap, over: lim > 5000 };
    log(true, `OK - ${rows.length} dòng - ${secs} giây`);
    M.refresh();
    return `Truy vấn trả về ${rows.length} dòng.`;
  });

  M.screen("reports/sql", {
    nav: "reports/sql", title: "Truy vấn SQL", codes: ["NV-7.2.3"],
    render() {
      const r = sqlState.result;
      let result = M.empty("Chưa chạy truy vấn nào trong phiên này.");
      if (r && !r.ok) result = `<div class="panel-body">${M.note(M.esc(r.msg), "bad")}</div>`;
      if (r && r.ok) result = (r.over ? `<div class="panel-body">${M.note("LIMIT vượt 5.000 dòng; hệ thống chỉ trả tối đa 5.000 dòng.", "warn")}</div>` : "")
        + M.table({ cols: r.cols.map((c, i) => ({ h: M.esc(c), r: (row) => `<span class="mono small">${M.esc(row[i])}</span>` })), rows: r.rows, empty: "Truy vấn không trả về dòng nào." });
      return M.page({
        title: "Truy vấn SQL",
        codes: ["NV-7.2.3"],
        body: M.cc("CC-19", "Ai được cấp quyền truy vấn SQL trực tiếp? Truy vấn SQL bỏ qua giới hạn theo đơn vị (NT-3). Mockup tạm cho Quản trị hệ thống và Quản trị hạ tầng, đúng bảng quyền đang áp dụng; tài liệu còn nêu cả Kiểm toán.")
          + `<div class="side-layout"><div class="stack">
          ${M.panel({ title: "Câu truy vấn", body: M.form("sql-run", `<div class="stack-sm"><textarea name="sql" rows="9" spellcheck="false" style="font-family:var(--font-mono);font-size:13px" aria-label="Câu truy vấn SQL">${M.esc(sqlState.text)}</textarea>
            <div class="row">${M.btn("Chạy", { primary: true, type: "submit", icon: "play" })}${M.btn("Lưu thành báo cáo", { msg: "Đã lưu câu truy vấn thành báo cáo \"Truy vấn SQL của tôi\" (mockup)." })}</div></div>`) })}
          ${M.panel({ title: "Kết quả", flush: true, body: result, foot: r && r.ok ? `<span>${r.rows.length} dòng${r.truncated ? `, đã cắt ở ${r.cap} dòng` : ""}</span><span>${r.secs} giây</span>` : "" })}
          ${M.panel({ title: `Nhật ký truy vấn (${D.sqlLog.length})`, flush: true, body: M.table({ cols: [
            { h: "Thời điểm", r: (x) => `<span class="mono small">${M.esc(x.at)}</span>` },
            { h: "Người chạy", r: (x) => M.esc(x.who) },
            { h: "Câu truy vấn", cls: "wrap", r: (x) => `<code>${M.esc(x.sql)}</code>` },
            { h: "Kết quả", r: (x) => M.pill(x.result, x.ok ? "ok" : "bad") },
          ], rows: D.sqlLog }) })}
        </div><div class="stack">
          ${M.panel({ title: "Giới hạn", body: M.kv([
            ["Tài khoản CSDL", '<span class="mono">itam_readonly</span> - chỉ đọc'],
            ["Nguồn", "Bản sao đọc (replica)"],
            ["Thời gian tối đa", "30 giây"],
            ["Số dòng tối đa", "5.000"],
            ["Bảng bị chặn", SENSITIVE.map((t) => `<code>${t}</code>`).join(" ")],
          ]) })}
          ${M.panel({ title: "Lược đồ được phép", body: `<div class="stack-sm">${SCHEMA.map(([t, c]) => `<div><b class="mono">${t}</b><div class="small muted mono">${M.esc(c)}</div></div>`).join("")}</div>` })}
        </div></div>`,
      });
    },
  });

  /* ===================== Đặt lịch gửi báo cáo (NV-7.2.4) ===================== */
  const reportName = (id) => { const r = REPORTS.find((x) => x.id === id) || M.find("savedReports", id); return r ? r.name : id; };
  const ownerLocked = (s) => { const u = (D.users || []).find((x) => x.username === s.ownerUser); return !!u && u.status === "disabled"; };
  const schedState = (s) => (ownerLocked(s) ? M.pill("Dừng: tài khoản người đặt lịch đã bị khóa", "bad") : s.enabled ? M.pill("Đang chạy", "ok") : M.pill("Tạm dừng", "mute"));
  M.action("sched-toggle", (el, id) => {
    const s = M.find("schedules", id);
    if (ownerLocked(s)) return "Không bật lại được: tài khoản người đặt lịch đã bị khóa. Người khác cần tự đặt lịch mới với quyền của mình.";
    s.enabled = !s.enabled;
    M.refresh();
    return s.enabled ? `Đã bật lại lịch ${s.id}.` : `Đã tạm dừng lịch ${s.id}.`;
  });
  M.defModal("sched-new", (pre) => ({
    title: "Đặt lịch gửi báo cáo",
    wide: true,
    body: `<div class="form-grid">
      ${M.field("Báo cáo", M.select("report", [{ group: "Báo cáo dựng sẵn", options: REPORTS.map((r) => [r.id, r.name]) }, { group: "Báo cáo đã lưu", options: D.savedReports.map((r) => [r.id, r.name]) }], pre || "R1"), { req: true, full: true })}
      ${M.field("Chu kỳ", M.select("cycle", ["Hàng ngày", "Hàng tuần", "Hàng tháng"], "Hàng tuần"))}
      ${M.field("Ngày gửi", M.select("day", ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Ngày 1 hàng tháng"], "Thứ Hai"))}
      ${M.field("Giờ gửi", M.input("time", { type: "time", value: "08:00" }))}
      ${M.field("Định dạng", M.select("format", ["PDF", "Excel", "CSV"], "PDF"))}
      ${M.field("Người nhận", M.input("to", { value: (D.employees.find((e) => e.name === M.me().user) || {}).email || "", ph: "ha.pt@anphat.vn, minh.dq@anphat.vn" }), { req: true, full: true, hint: "Chỉ địa chỉ @anphat.vn (đề xuất), cách nhau bởi dấu phẩy." })}
    </div>`,
    submit: "Đặt lịch",
    onSubmit(data, form) {
      const list = data.to.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!list.length) return M.invalid(form, "to", "Nhập ít nhất một người nhận.");
      const bad = list.find((e) => !/^[a-z0-9._-]+@anphat\.vn$/.test(e));
      if (bad) return M.invalid(form, "to", `Chỉ gửi tới địa chỉ nội bộ @anphat.vn. Địa chỉ không hợp lệ: ${bad}`);
      const me = M.me();
      const id = "SC-0" + (D.schedules.length + 1);
      D.schedules.unshift({ id, report: data.report, cycle: `${data.cycle} - ${data.day} ${data.time}`, recipients: list, format: data.format, owner: me.user, ownerUser: me.username, enabled: true, lastSent: "", next: "Lần gửi kế tiếp theo lịch" });
      return `Đã đặt lịch ${id} gửi "${reportName(data.report)}" (${data.format}) cho ${list.length} người.`;
    },
  }));

  M.screen("reports/schedules", {
    nav: "reports/schedules", title: "Lịch gửi báo cáo", codes: ["NV-7.2.4"],
    render(params, query) {
      const pre = query.r && (REPORTS.some((r) => r.id === query.r) || M.find("savedReports", query.r)) ? query.r : "";
      return M.page({
        title: "Lịch gửi báo cáo",
        codes: ["NV-7.2.4"],
        actions: M.btn("Đặt lịch mới", { primary: true, icon: "plus", modal: "sched-new", arg: pre || "R1", perm: "report.run" }),
        above: pre ? M.note(`Bấm <b>Đặt lịch mới</b> để đặt lịch gửi "${M.esc(reportName(pre))}".`) : "",
        body: M.stats([
          { label: "Lịch đang chạy", value: D.schedules.filter((s) => s.enabled && !ownerLocked(s)).length, tone: "ok" },
          { label: "Tạm dừng", value: D.schedules.filter((s) => !s.enabled && !ownerLocked(s)).length, tone: "mute" },
          { label: "Dừng do tài khoản bị khóa", value: D.schedules.filter(ownerLocked).length, tone: "bad" },
          { label: "Lần gửi lỗi (30 ngày)", value: D.scheduleRuns.filter((r) => !r.ok).length, tone: "warn" },
        ]) + M.panel({ flush: true, body: M.table({
          cols: [
            { h: "Báo cáo", r: (s) => `<div class="cell-name">${M.esc(reportName(s.report))}</div><div class="cell-sub">${M.esc(s.id)} - ${M.esc(s.cycle)} - ${M.esc(s.format)}</div>` },
            { h: "Người nhận", cls: "wrap", r: (s) => `<span class="small mono">${M.esc(s.recipients.join(", "))}</span>` },
            { h: "Người đặt lịch", r: (s) => M.esc(s.owner) },
            { h: "Kế tiếp", r: (s) => `<span class="mono small">${ownerLocked(s) || !s.enabled ? "—" : M.esc(s.next || "")}</span>` },
            { h: "Trạng thái", r: (s) => schedState(s) },
            { h: "", cls: "right", r: (s) => `<span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${M.btn("Gửi thử", { sm: true, ghost: true, msg: `Đã gửi thử "${reportName(s.report)}" tới ${s.recipients[0]} (mockup).` })}${ownerLocked(s) ? "" : M.btn(s.enabled ? "Tạm dừng" : "Bật lại", { sm: true, act: "sched-toggle", arg: s.id })}</span>` },
          ],
          rows: D.schedules,
        }) })
          + M.panel({ title: "Lịch sử gửi", flush: true, body: M.table({
            cols: [
              { h: "Lúc", r: (x) => `<span class="mono small">${M.esc(x.at)}</span>` },
              { h: "Lịch", r: (x) => `<span class="mono">${M.esc(x.sched)}</span> - ${M.esc(reportName((M.find("schedules", x.sched) || {}).report))}` },
              { h: "Số người nhận", cls: "right", r: (x) => `<span class="mono">${x.to}</span>` },
              { h: "Kết quả", r: (x) => M.pill(x.ok ? "Đã gửi" : "Lỗi gửi", x.ok ? "ok" : "bad") },
              { h: "Ghi chú", cls: "wrap", r: (x) => `<span class="small">${M.esc(x.note)}</span>` },
            ],
            rows: D.scheduleRuns,
          }) }),
      });
    },
  });
})();
