/* Mockup ITAM: NT-8 - Cổng tự phục vụ cho vai trò Nhân viên.
   Người đăng nhập là hồ sơ nhân viên đã nối với tài khoản (M.me().employeeId).
   Nhân viên chỉ thấy tài sản, biên bản và yêu cầu của chính mình; không thấy nhật ký lưu ký,
   hồ sơ kỹ thuật, thao tác trên tài sản, ghi chú nội bộ và bài tri thức nội bộ.
   Dùng lại dữ liệu ticket và cơ sở tri thức của screens-service.js qua M.svc. */
(function () {
  "use strict";
  const D = M.data;
  const esc = M.esc;
  const S = () => M.svc;
  const me = () => M.me().employeeId;

  /* Thêm một biên bản trả máy cũ của chính nhân viên này để lịch sử biên bản có nhiều dòng */
  if (!D.handovers.some((h) => h.id === "BB-2026-0109")) {
    D.handovers.push({ id: "BB-2026-0109", kind: "return", employeeId: "e5", assetIds: ["a14"], accessories: [], createdAt: "20/11/2026 15:10", createdBy: "Phạm Thu Hà", status: "signed", signedAt: "20/11/2026 15:22", ip: "10.10.5.44", termsId: "tm2", termsVersion: 2, note: "Trả máy hỏng do vào nước, chờ thanh lý." });
  }

  const ST_EMP = { new: "Đã tiếp nhận", approval: "Chờ quản lý duyệt", owned: "Đã có người nhận", working: "Đang xử lý", waiting: "Chờ bạn phản hồi", resolved: "Đã giải quyết, chờ bạn xác nhận", closed: "Đã đóng" };
  const stPill = (t) => M.pill(ST_EMP[t.status], { new: "info", approval: "warn", owned: "info", working: "info", waiting: "warn", resolved: "ok", closed: "mute" }[t.status]);
  const myTickets = () => D.tickets.filter((t) => t.requesterId === me());
  const myHandovers = () => D.handovers.filter((h) => h.employeeId === me());
  const myAccessories = () => D.accessories.map((ac) => { const h = ac.holdings.find(([e]) => e === me()); return h ? { ac, qty: h[1] } : null; }).filter(Boolean);
  const mine = () => S().assetsOf(me());
  const hist = (t, text) => { (t.history = t.history || [[t.created, `Tạo từ ${t.channel}`]]).push([S().nowStr(), text]); };
  const tagLink = (a) => `<a class="tape" href="#/portal/assets/${esc(a.id)}">${esc(a.tag)}</a>`;
  const attachNote = (a) => (a.holder && a.holder.type === "asset" ? `<div class="cell-sub">Gắn vào ${esc(M.asset(a.holder.id).tag)}</div>` : "");

  const deviceTable = (id) => M.table({
    id, rows: mine(), href: (a) => "#/portal/assets/" + a.id, empty: "Bạn chưa được giao thiết bị nào.",
    cols: [
      { h: "Mã tài sản", r: (a) => tagLink(a) },
      { h: "Thiết bị", cls: "wrap", r: (a) => `<div class="cell-name">${esc(a.name)}</div>${attachNote(a)}` },
      { h: "Bảo hành", r: (a) => S().warrantyPill(a) },
    ],
  });
  const accTable = (id) => M.table({
    id, rows: myAccessories(), empty: "Bạn không giữ phụ kiện nào.",
    cols: [
      { h: "Phụ kiện", cls: "wrap", r: (x) => esc(x.ac.name) },
      { h: "Số lượng", cls: "right", r: (x) => `<span class="mono">${esc(x.qty)}</span>` },
    ],
  });
  const reqTable = (id, rows) => M.table({
    id, rows, href: (t) => "#/portal/requests/" + t.id, empty: "Bạn chưa gửi yêu cầu nào.",
    cols: [
      { h: "Mã", r: (t) => `<b class="mono">${esc(t.id)}</b>` },
      { h: "Yêu cầu", cls: "wrap", r: (t) => `<div class="cell-name">${esc(t.title)}</div><div class="cell-sub">Gửi ${esc(t.created)}</div>` },
      { h: "Trạng thái", r: stPill },
    ],
  });

  /* ===================== Trang đầu ===================== */
  M.screen("portal", {
    nav: "portal", title: "Trang của tôi", codes: ["NT-8"],
    render() {
      const e = M.emp(me());
      const pend = myHandovers().filter((h) => ["pending", "overdue"].includes(h.status));
      const open = myTickets().filter((t) => t.status !== "closed");
      const pendNote = pend.length ? M.note(pend.map((h) => `Biên bản <b>${esc(h.id)}</b> ${h.status === "overdue" ? "đã quá hạn ký" : "đang chờ bạn ký, hạn " + esc(h.due || "")}. <a href="#/portal/handovers/${esc(h.id)}">Xem và ký</a>`).join("<br>"), "warn") : "";
      return M.page({
        title: `Xin chào, ${esc(e.name)}`,
        codes: this.codes,
        actions: M.btn("Gửi yêu cầu hỗ trợ", { href: "#/portal/requests/new", primary: true, icon: "plus" }),
        body: `${pendNote}
          <div class="grid g2">
            <div class="stack">
              ${M.panel({ title: `Thiết bị đang giữ (${mine().length})`, flush: true, body: deviceTable("pt-home-dev") })}
              ${M.panel({ title: `Phụ kiện đang giữ (${myAccessories().length})`, flush: true, body: accTable("pt-home-acc") })}
            </div>
            ${M.panel({ title: `Yêu cầu đang mở (${open.length})`, flush: true, body: reqTable("pt-home-req", open), foot: '<span></span><a href="#/portal/requests">Tất cả yêu cầu</a>' })}
          </div>`,
      });
    },
  });

  /* ===================== Thiết bị và phụ kiện ===================== */
  M.screen("portal/assets", {
    nav: "portal/assets", title: "Tài sản của tôi", codes: ["NT-8"],
    render() {
      return M.page({
        title: "Tài sản của tôi",
        codes: this.codes,
        body: M.panel({ title: "Thiết bị", flush: true, body: deviceTable("pt-dev") }) + M.panel({ title: "Phụ kiện", flush: true, body: accTable("pt-acc") }),
      });
    },
  });
  M.screen("portal/assets/:id", {
    nav: "portal/assets", title: "Thiết bị của tôi", codes: ["NT-8"],
    render(p) {
      const a = mine().find((x) => x.id === p.id);
      if (!a) return M.page({ title: "Không tìm thấy tài sản này", back: ["#/portal/assets", "Tài sản của tôi"], sub: "Tài sản không tồn tại hoặc không giao cho bạn." });
      const m = M.model(a.model);
      const c = M.assetCat(a);
      const h = myHandovers().filter((x) => x.assetIds.includes(a.id) && x.kind === "issue").pop();
      return M.page({
        title: esc(a.name), back: ["#/portal/assets", "Tài sản của tôi"], codes: this.codes,
        sub: `${M.tape(a.tag, null, "lg")}`,
        actions: M.btn("Báo hỏng", { href: "#/portal/requests/new?asset=" + a.id, primary: true, icon: "lifebuoy" }),
        body: `<div class="side-layout"><div class="stack">
          ${M.panel({ title: "Thông tin", body: M.kv([
            ["Danh mục", esc(c ? c.name : "Chưa phân loại")],
            ["Hãng / Model", m ? esc(`${m.maker} ${m.name}`) : "Chưa có"],
            ["Serial", a.serial ? `<span class="mono">${esc(a.serial)}</span>` : "Chưa có"],
            a.holder.type === "asset" ? ["Gắn vào", tagLink(M.asset(a.holder.id))] : null,
            ["Bảo hành", S().warrantyPill(a)],
            ["Biên bản nhận", h ? `<a href="#/portal/handovers/${esc(h.id)}">${esc(h.id)}</a> ${M.pill(...M.HANDOVER_ST[h.status])}` : '<span class="muted">Chưa có</span>'],
          ]) })}
          ${M.anno("Trang này cố ý không có nhật ký lưu ký (có tên người giữ trước), không có hồ sơ kỹ thuật và không có mục Thao tác (NT-8, NV-1.4.2).")}
        </div><div class="stack">${M.assetLabel(a)}</div></div>`,
      });
    },
  });

  /* ===================== Biên bản bàn giao (NV-2.3.2) ===================== */
  M.screen("portal/handovers", {
    nav: "portal/handovers", title: "Biên bản cần ký", codes: ["NV-2.3.2", "NT-8"],
    render() {
      const order = { overdue: 0, pending: 1, rejected: 2, signed: 3 };
      const rows = myHandovers().slice().sort((a, b) => order[a.status] - order[b.status]);
      return M.page({
        title: "Biên bản của tôi",
        codes: this.codes,
        body: M.panel({ flush: true, body: M.table({
          id: "pt-ho", rows, href: (h) => "#/portal/handovers/" + h.id, empty: "Bạn chưa có biên bản nào.",
          cols: [
            { h: "Mã", r: (h) => `<b class="mono">${esc(h.id)}</b>` },
            { h: "Loại", r: (h) => esc(M.HANDOVER_KIND[h.kind]) },
            { h: "Tài sản", cls: "wrap", r: (h) => h.assetIds.map((id) => `${esc(M.asset(id).tag)} <span class="muted small">${esc(M.asset(id).name)}</span>`).join("<br>") },
            { h: "Ngày lập", r: (h) => `<span class="mono small">${esc(h.createdAt)}</span>` },
            { h: "Trạng thái", r: (h) => M.pill(...M.HANDOVER_ST[h.status]) },
          ] }) }),
      });
    },
  });

  function handoverDoc(h) {
    const e = M.emp(h.employeeId);
    const terms = M.find("terms", h.termsId);
    const assets = h.assetIds.map((id) => M.asset(id)).filter(Boolean);
    const isReturn = h.kind === "return";
    const it = "Phòng IT - " + h.createdBy;
    const emp = `${e.name} - ${e.code} - ${(M.dept(e.dept) || {}).name || ""}`;
    return M.panel({ body: `<div class="stack-sm">
      <div class="row between"><div><div class="muted small mono">${esc(D.company)}</div><h3 style="font:700 24px/1.15 var(--font-display);margin-top:4px">BIÊN BẢN ${isReturn ? "THU HỒI" : "BÀN GIAO"} TÀI SẢN</h3></div><span class="mono strong">${esc(h.id)}</span></div>
      ${M.kv([["Bên giao", esc(isReturn ? emp : it)], ["Bên nhận", esc(isReturn ? it : emp)], ["Ngày lập", `<span class="mono">${esc(h.createdAt)}</span>`], h.note ? ["Ghi chú", esc(h.note)] : null])}
      <h2 style="margin-top:12px">Tài sản</h2>
      ${M.table({ id: "pt-ho-assets", rows: assets, cols: [
        { h: "Mã", r: (a) => `<span class="mono">${esc(a.tag)}</span>` },
        { h: "Tên", cls: "wrap", r: (a) => esc(a.name) },
        { h: "Serial", r: (a) => (a.serial ? `<span class="mono">${esc(a.serial)}</span>` : "—") },
        { h: "Tình trạng", cls: "wrap", r: (a) => esc(isReturn ? a.note || "Đã kiểm tra khi nhận lại" : "Tốt, đủ sạc") },
      ] })}
      ${h.accessories && h.accessories.length ? `<h2 style="margin-top:12px">Phụ kiện kèm theo</h2>${M.table({ id: "pt-ho-acc", rows: h.accessories, cols: [{ h: "Phụ kiện", r: (x) => esc(x[0]) }, { h: "Số lượng", cls: "right", r: (x) => `<span class="mono">${esc(x[1])}</span>` }] })}` : ""}
      ${terms ? `<h2 style="margin-top:12px">Điều khoản sử dụng - ${esc(terms.name)} - phiên bản ${esc(h.termsVersion)}</h2>
        <ol>${terms.body.map((s) => `<li style="margin-bottom:4px">${esc(s)}</li>`).join("")}</ol>` : ""}
    </div>` });
  }

  M.screen("portal/handovers/:id", {
    nav: "portal/handovers", title: "Biên bản bàn giao", codes: ["NV-2.3.2", "NV-2.3.3", "NT-8"],
    render(p) {
      const h = D.handovers.find((x) => x.id === p.id);
      if (!h || h.employeeId !== me()) {
        return M.page({ title: "Không xem được biên bản này", back: ["#/portal/handovers", "Biên bản của tôi"], codes: this.codes, sub: "Biên bản không tồn tại hoặc không đứng tên bạn." });
      }
      const open = ["pending", "overdue"].includes(h.status);
      let side;
      if (open) {
        side = M.panel({ title: "Xác nhận", body: `<div class="stack-sm">
            ${h.status === "overdue" ? M.note(`Đã quá hạn ký (hạn ${esc(h.due || "")}).`, "bad") : M.note(`Hạn ký: <b>${esc(h.due || "")}</b>`, "warn")}
            ${M.checkbox("agree", "Tôi đã nhận đủ tài sản, phụ kiện như trên và đồng ý điều khoản sử dụng", false, { attrs: 'id="pt-agree"' })}
            ${M.btn("Xác nhận đã nhận", { primary: true, act: "pt-sign", arg: h.id, icon: "check" })}
            ${M.btn("Từ chối", { modal: "pt-reject", arg: h.id })}
            <p class="muted small">Biên bản đã ký không sửa, không ký lại.</p>
          </div>` });
      } else if (h.status === "signed") {
        side = M.panel({ title: "Đã ký xác nhận", body: `${M.kv([["Người ký", esc(M.emp(h.employeeId).name)], ["Thời điểm", `<span class="mono">${esc(h.signedAt)}</span>`]])}<div style="margin-top:12px">${M.btn("Tải PDF", { icon: "download", msg: `Mockup: tải ${h.id}.pdf (bản đã ký, không đổi sau khi tạo).` })}</div>` });
      } else {
        side = M.panel({ title: "Đã từ chối", body: M.kv([["Lý do", esc(h.reason || "")]]) });
      }
      return M.page({
        title: `Biên bản ${esc(h.id)}`, back: ["#/portal/handovers", "Biên bản của tôi"], codes: this.codes,
        sub: `${M.pill(...M.HANDOVER_ST[h.status])} <span class="muted">- ${esc(M.HANDOVER_KIND[h.kind])} - lập bởi ${esc(h.createdBy)}</span>`,
        body: `<div class="side-layout"><div class="stack">${handoverDoc(h)}</div><div class="stack">${side}
          ${M.cc("CC-9", "Bấm xác nhận sau khi đăng nhập là đủ, hay cần chữ ký số có giá trị pháp lý?")}
          ${M.cc("CC-10", "Tài sản chưa được ký nhận có được coi là đã cấp phát không? Quá hạn bao lâu thì xử lý thế nào?")}
        </div></div>`,
      });
    },
  });
  M.action("pt-sign", (el, id) => {
    const h = D.handovers.find((x) => x.id === id);
    const box = document.getElementById("pt-agree");
    if (box && !box.checked) { M.toast("Đánh dấu đã đọc và đồng ý điều khoản trước khi xác nhận.", "bad"); return; }
    const ip = (mine().find((a) => a.tech) || { tech: { ip: "10.10.5.44" } }).tech.ip;
    h.status = "signed"; h.signedAt = S().nowStr(); h.ip = ip;
    (D.notifications || []).forEach((n) => { if (n.href === "#/portal/handovers/" + id) n.read = true; });
    M.refresh();
    return `Đã ký xác nhận biên bản ${h.id}. Thời điểm, người ký và địa chỉ IP đã được lưu.`;
  });
  M.defModal("pt-reject", (id) => ({
    title: `Từ chối biên bản ${id}`,
    body: M.field("Lý do từ chối", M.textarea("reason", "", { rows: 3, ph: "Ví dụ: thiếu sạc, serial trên máy khác với biên bản…" }), { req: true }),
    submit: "Từ chối", danger: true,
    onSubmit(data, form) {
      if (!String(data.reason || "").trim()) return M.invalid(form, "reason", "Nhập lý do từ chối.");
      const h = D.handovers.find((x) => x.id === id);
      h.status = "rejected"; h.reason = data.reason.trim();
      return `Đã từ chối biên bản. ${h.createdBy} nhận thông báo kèm lý do.`;
    },
  }));

  /* ===================== Yêu cầu của tôi (NV-4.1.1, NV-4.1.3) ===================== */
  M.screen("portal/requests", {
    nav: "portal/requests", title: "Yêu cầu của tôi", codes: ["NV-4.1.1", "NV-4.1.3", "NT-8"],
    render() {
      const rows = myTickets();
      const open = rows.filter((t) => t.status !== "closed");
      return M.page({
        title: "Yêu cầu của tôi",
        codes: this.codes,
        actions: M.btn("Gửi yêu cầu hỗ trợ", { href: "#/portal/requests/new", primary: true, icon: "plus" }),
        body: M.tabs("pt-req", [
          { key: "open", label: "Đang mở", n: open.length, body: M.panel({ flush: true, body: reqTable("pt-req-open", open) }) },
          { key: "all", label: "Tất cả", n: rows.length, body: M.panel({ flush: true, body: reqTable("pt-req-all", rows) }) },
        ]),
      });
    },
  });

  /* Gửi yêu cầu mới; gợi ý bài hỏi đáp công khai trước khi gửi (NV-4.5.2) */
  const suggestHtml = (text) => {
    const list = S().kbSuggest(text || "", true);
    if (!list.length) return '<p class="muted">Gõ tiêu đề để xem các bài hỏi đáp liên quan.</p>';
    return list.map((k, i) => `<div style="padding:6px 0;${i ? "border-top:1px dashed var(--line)" : ""}"><a href="#/portal/faq/${esc(k.id)}" target="_blank" rel="noopener">${esc(k.title)}</a></div>`).join("");
  };
  M.action("pt-suggest", (el, v) => { const box = document.getElementById("pt-suggest"); if (box) box.innerHTML = suggestHtml(v); });

  M.screen("portal/requests/new", {
    nav: "portal/requests", title: "Gửi yêu cầu hỗ trợ", codes: ["NV-4.1.1", "NV-4.5.2"],
    render(p, q) {
      const devices = mine();
      const pre = devices.find((a) => a.id === q.asset);
      const form = M.form("pt-new", `<div class="form-grid">
          <div class="field full">Loại yêu cầu<div class="row">${M.radio("type", "incident", "Báo hỏng", true)}${M.radio("type", "request", "Xin cấp, cài đặt hoặc quyền truy cập", false)}</div></div>
          ${M.field("Tiêu đề", M.input("title", { ph: "Ví dụ: Dock không nhận màn hình thứ hai", value: pre ? `${pre.name} bị lỗi` : "", attrs: 'data-input="pt-suggest" autocomplete="off"' }), { req: true, full: true })}
          ${M.field("Mô tả", M.textarea("desc", "", { ph: "Lỗi thế nào, từ khi nào, bạn đã thử gì", rows: 4 }), { full: true })}
          ${M.field("Nhóm vấn đề", M.select("category", ["Phần cứng máy tính", "Phần mềm & tài khoản", "Mạng & Wi-Fi", "In ấn", "Xin cấp thiết bị", "Khác"], pre ? "Phần cứng máy tính" : "Khác"))}
          ${M.field("Thiết bị liên quan", M.select("asset", [["", "Không liên quan thiết bị nào"]].concat(devices.map((a) => [a.id, `${a.tag} - ${a.name}`])), pre ? pre.id : ""))}
          ${M.field("Ai bị ảnh hưởng", M.select("impact", [["1", "Chỉ mình tôi"], ["2", "Cả nhóm hoặc phòng ban"]], "1"))}
          ${M.field("Còn làm việc được không", M.select("urgency", [["2", "Vẫn làm việc được"], ["3", "Không làm việc được"]], "2"))}
          ${M.field("Ảnh đính kèm", '<input type="file" name="photo" accept="image/*">', { full: true })}
        </div>
        <hr class="divider">
        <div class="form-actions">${M.btn("Gửi yêu cầu", { type: "submit", primary: true })}${M.btn("Hủy", { href: "#/portal/requests" })}</div>`);
      return M.page({
        title: "Gửi yêu cầu hỗ trợ", back: ["#/portal/requests", "Yêu cầu của tôi"], codes: this.codes,
        body: `<div class="side-layout"><div class="panel"><div class="panel-body">${form}</div></div><div class="stack">
          ${M.panel({ title: "Hỏi đáp liên quan", body: `<div id="pt-suggest">${suggestHtml(pre ? pre.name : "")}</div>` })}
          ${M.note("Gấp ngoài giờ làm việc? Gọi Phòng IT: 024 3795 0000, máy lẻ 1234.", "info")}
        </div></div>`,
      });
    },
  });
  M.action("pt-new", (form, data) => {
    if (!String(data.title || "").trim()) return M.invalid(form, "title", "Nhập tiêu đề yêu cầu.");
    const e = M.emp(me());
    const id = S().nextTicketId();
    const assetIds = data.asset ? [data.asset] : [];
    const r = S().route({ category: data.category, requesterId: e.id, assetIds });
    const s = Number(data.impact) + Number(data.urgency);
    const priority = s >= 5 ? "high" : s === 4 ? "medium" : "low";
    const now = S().nowStr();
    const file = data.photo && data.photo.name ? [data.photo.name] : [];
    D.tickets.unshift({
      id, title: data.title.trim(), type: data.type || "incident", category: data.category, priority, impact: +data.impact, urgency: +data.urgency,
      status: "new", requesterId: e.id, assigneeId: r.assignee, group: r.group, assetIds, created: now, channel: "Cổng tự phục vụ",
      slaDue: "28/11/2026 17:30", slaState: "ok", slaLeft: "còn " + S().SLA_TARGET[priority][0] + " để nhận", slaPct: 0, desc: (data.desc || "").trim(), attachments: file,
      history: [[now, `${e.name} tạo yêu cầu từ Cổng tự phục vụ`], [now, r.text]],
    });
    M.go("portal/requests");
    return `Đã gửi yêu cầu ${id}. Bạn sẽ nhận email xác nhận kèm mã này.`;
  });

  M.screen("portal/requests/:id", {
    nav: "portal/requests", title: "Yêu cầu của tôi", codes: ["NV-4.1.3", "NT-8"],
    render(p) {
      const t = myTickets().find((x) => x.id === p.id);
      if (!t) return M.page({ title: "Không tìm thấy yêu cầu này", back: ["#/portal/requests", "Yêu cầu của tôi"] });
      const flow = ["new", "owned", "working", "resolved", "closed"];
      const cur = { new: 0, approval: 0, owned: 1, working: 2, waiting: 2, resolved: 3, closed: 5 }[t.status];
      const reply = t.status !== "closed" ? `<hr class="divider">${M.form("pt-reply", `<input type="hidden" name="id" value="${esc(t.id)}">${M.field(t.status === "waiting" ? "Kỹ thuật viên đang chờ bạn trả lời" : "Trả lời", M.textarea("text", "", { rows: 3 }))}<div class="form-actions" style="margin-top:10px">${M.btn("Gửi", { type: "submit", primary: true, sm: true })}</div>`)}` : "";
      const assets = t.assetIds.map((id) => M.asset(id)).filter(Boolean);
      return M.page({
        title: `<span class="mono">${esc(t.id)}</span> - ${esc(t.title)}`, back: ["#/portal/requests", "Yêu cầu của tôi"], codes: this.codes,
        sub: `${stPill(t)} <span class="muted">- ${esc(S().TYPE[t.type])} - gửi ${esc(t.created)}</span>`,
        actions: t.status === "resolved" ? M.btn("Mở lại", { modal: "pt-reopen", arg: t.id }) + M.btn("Xác nhận đã giải quyết", { primary: true, act: "pt-confirm", arg: t.id }) : "",
        above: `<div class="panel"><div class="panel-body" style="padding:10px 16px">${M.steps(flow.map((s) => ST_EMP[s].split(",")[0]), cur)}</div></div>`,
        body: `<div class="side-layout"><div class="stack">
          ${t.rejectReason ? M.note(`Yêu cầu không được duyệt. Lý do: ${esc(t.rejectReason)}`, "bad") : ""}
          ${t.resolution && t.status !== "closed" ? M.panel({ title: "Cách khắc phục", body: `<p>${esc(t.resolution)}</p>${t.status === "resolved" ? '<p class="muted small" style="margin-top:8px">Không phản hồi sau 3 ngày làm việc thì yêu cầu tự đóng.</p>' : ""}` }) : ""}
          ${M.panel({ title: "Trao đổi", body: S().threadHtml(t, true) + reply })}
        </div><div class="stack">
          ${M.panel({ title: "Thông tin", body: M.kv([["Người xử lý", t.assigneeId ? esc(S().ename(t.assigneeId)) : '<span class="muted">Chưa có người nhận</span>'], ["Thiết bị", assets.length ? assets.map((a) => mine().includes(a) ? tagLink(a) : `<span class="mono">${esc(a.tag)}</span>`).join(" ") : '<span class="muted">Không có</span>']]) })}
        </div></div>`,
      });
    },
  });
  M.action("pt-reply", (form, data) => {
    const t = myTickets().find((x) => x.id === data.id);
    if (!String(data.text || "").trim()) return M.invalid(form, "text", "Nhập nội dung trả lời.");
    (t.comments = t.comments && t.comments.length ? t.comments : [{ by: t.requesterId, at: t.created, text: t.desc || t.title }]).push({ by: me(), at: S().nowStr(), text: data.text.trim() });
    if (t.status === "waiting") {
      t.status = "working"; t.slaState = t.slaBefore || "ok"; t.slaLeft = t.slaLeftBefore || "đang chạy lại";
      hist(t, "Người yêu cầu trả lời - Chờ phản hồi → Đang xử lý - đồng hồ SLA chạy tiếp");
    }
    M.refresh();
    return "Đã gửi trả lời. Kỹ thuật viên được thông báo.";
  });
  M.action("pt-confirm", (el, id) => {
    const t = myTickets().find((x) => x.id === id);
    t.status = "closed"; t.closedAt = S().nowStr();
    hist(t, "Người yêu cầu xác nhận đã giải quyết - Đã giải quyết → Đã đóng");
    (D.notifications || []).forEach((n) => { if (n.roles && n.roles.includes("employee") && n.title.includes(id)) n.read = true; });
    M.refresh();
    return `Cảm ơn bạn đã xác nhận. Yêu cầu ${t.id} đã đóng.`;
  });
  M.defModal("pt-reopen", (id) => ({
    title: `Mở lại ${id}`,
    body: M.field("Vì sao vấn đề chưa được giải quyết?", M.textarea("reason", "", { rows: 3 }), { req: true }),
    submit: "Mở lại",
    onSubmit(data, form) {
      if (!String(data.reason || "").trim()) return M.invalid(form, "reason", "Ghi rõ vấn đề còn gặp để kỹ thuật viên xử lý tiếp.");
      const t = myTickets().find((x) => x.id === id);
      (t.comments = t.comments && t.comments.length ? t.comments : [{ by: t.requesterId, at: t.created, text: t.desc || t.title }]).push({ by: me(), at: S().nowStr(), text: "Mở lại: " + data.reason.trim() });
      t.status = "working";
      hist(t, "Người yêu cầu mở lại - Đã giải quyết → Đang xử lý");
      return `Đã mở lại ${t.id}. Kỹ thuật viên được thông báo.`;
    },
  }));

  /* ===================== Hỏi đáp công khai (NV-4.5.2) ===================== */
  const faqList = () => D.kb.filter((k) => k.public && k.state === "published");
  M.screen("portal/faq", {
    nav: "portal/faq", title: "Hỏi đáp", codes: ["NV-4.5.2"],
    render() {
      const list = faqList();
      return M.page({
        title: "Hỏi đáp",
        codes: this.codes,
        actions: M.btn("Gửi yêu cầu hỗ trợ", { href: "#/portal/requests/new", icon: "plus" }),
        body: M.panel({ flush: true, body: M.toolbar(M.searchBox("pt-faq", "Tìm câu hỏi, ví dụ: máy in, VPN, mật khẩu…")) + M.table({
          id: "pt-faq", rows: list, href: (k) => "#/portal/faq/" + k.id, empty: "Chưa có bài hỏi đáp nào.",
          cols: [
            { h: "Câu hỏi", cls: "wrap", r: (k) => `<div class="cell-name">${esc(k.title)}</div>` },
            { h: "Chủ đề", r: (k) => esc(k.category) },
          ] }) }),
      });
    },
  });
  M.screen("portal/faq/:id", {
    nav: "portal/faq", title: "Hỏi đáp", codes: ["NV-4.5.2"],
    render(p) {
      const k = faqList().find((x) => x.id === p.id);
      if (!k) return M.page({ title: "Không tìm thấy bài viết này", back: ["#/portal/faq", "Hỏi đáp"], sub: "Bài viết không tồn tại hoặc không công khai cho nhân viên." });
      return M.page({
        title: esc(k.title), back: ["#/portal/faq", "Hỏi đáp"], codes: this.codes,
        sub: `<span class="muted">${esc(k.category)} - cập nhật ${esc(k.updated)}</span>`,
        body: M.panel({ body: `<ol>${k.body.map((s) => `<li style="margin-bottom:6px">${esc(s)}</li>`).join("")}</ol>` }) +
          M.panel({ title: "Bài viết có giúp được bạn không?", body: `<div class="row">${M.btn("Có, đã xử lý được", { msg: "Cảm ơn bạn đã phản hồi." })}${M.btn("Chưa, gửi yêu cầu hỗ trợ", { href: "#/portal/requests/new", primary: true })}</div>` }),
      });
    },
  });
})();
