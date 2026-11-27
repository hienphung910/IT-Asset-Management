/* Mockup ITAM: màn hình chung.
   Đăng nhập, đăng ký, xác thực hai lớp (NT-1, NV-7.3.1), dashboard theo vai trò (NV-7.1.1),
   thông báo (NT-6), tìm kiếm toàn cục và cài đặt (NT-7), cùng hai trang riêng của mockup:
   Bản đồ màn hình (đối chiếu 93 nghiệp vụ) và Luồng nghiệp vụ (mục 9). */
(function () {
  const D = M.data;

  /* ---------- Ngày tháng: mọi dữ liệu mẫu dùng dd/mm/yyyy, "hôm nay" là 27/11/2026 ---------- */
  M.TODAY = new Date(2026, 10, 27);
  M.parseDate = (s) => {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/.exec(String(s || ""));
    return m ? new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0)) : null;
  };
  M.daysUntil = (s) => { const d = M.parseDate(s); return d ? Math.round((d - M.TODAY) / 86400000) : null; };
  const list = (name) => D[name] || [];

  /* =====================================================================
     Đăng nhập, đăng ký, xác thực hai lớp
     ===================================================================== */
  const authArt = () => `<div class="auth-art">
      <span class="tape tape-lg" style="align-self:flex-start">ITAM</span>
      <div class="stack-sm">
        <h1>Tài sản và dịch vụ CNTT, một chỗ.</h1>
        <p>Thiết bị ở đâu, ai giữ, còn bảo hành không, và yêu cầu hỗ trợ đang tới đâu.</p>
      </div>
      <p class="small mono">${M.esc(D.company)} - Phòng IT</p>
    </div>`;

  M.screen("login", {
    bare: true, title: "Đăng nhập", codes: ["NT-1", "NV-2.4.2", "NV-7.3.1"],
    render(p, q) {
      const next = q.next || "";
      const scanned = /^assets\/(\w+)/.exec(next);
      const a = scanned && M.asset(scanned[1]);
      return `<div class="auth">${authArt()}<div class="auth-form"><div class="auth-card">
        ${M.codeChips(["NT-1", "NV-2.4.2", "NV-7.3.1"])}
        <h1>Đăng nhập</h1>
        ${a ? M.note(`Đã quét tem <b>${M.esc(a.tag)}</b>. Đăng nhập để mở tài sản này.`) : ""}
        ${q.registered ? M.note(`Đã gửi yêu cầu đăng ký. Bạn đăng nhập được sau khi admin duyệt.`, "ok") : ""}
        ${M.form("login", `<div class="stack-sm">
          ${M.field("Tên đăng nhập", M.input("username", { value: q.u || "", attrs: 'autocomplete="username" maxlength="50"' }), { req: true })}
          ${M.field("Mật khẩu", M.input("password", { type: "password", attrs: 'autocomplete="current-password" maxlength="128"' }), { req: true })}
          <input type="hidden" name="next" value="${M.esc(next)}">
          ${M.btn("Đăng nhập", { primary: true, type: "submit" })}
        </div>`)}
        <div class="or">hoặc</div>
        ${M.btn("Đăng nhập bằng tài khoản công ty (SSO)", { href: "#/login/mfa?sso=1" + (next ? "&next=" + encodeURIComponent(next) : "") })}
        <p class="muted">Chưa có tài khoản? <a href="#/register">Đăng ký</a></p>
        ${M.anno("Gõ tên đăng nhập của một vai trò (quan.tm, nam.lh, ha.pt, anh.nd, huong.vt, linh.dm) với mật khẩu bất kỳ từ 8 ký tự để vào bằng vai trò đó. Thử <code>huy.bg</code> (chờ duyệt), <code>lan.vt</code> (bị khóa) hoặc mật khẩu <code>sai12345</code> để xem thông báo từ chối.")}
      </div></div></div>`;
    },
  });
  M.action("login", (form, d) => {
    const u = (d.username || "").trim().toLowerCase();
    if (!u) return M.invalid(form, "username", "Nhập tên đăng nhập.");
    if (!d.password) return M.invalid(form, "password", "Nhập mật khẩu.");
    const acc = D.users.find((x) => x.username === u);
    if (!acc || d.password === "sai12345" || d.password.length < 8) { M.toast("Sai tên đăng nhập hoặc mật khẩu.", "bad"); return; }
    if (acc.status === "pending") { M.toast("Tài khoản đang chờ admin duyệt. Bạn đăng nhập được sau khi được duyệt.", "bad"); return; }
    if (acc.status === "disabled") { M.toast("Tài khoản đã bị khóa. Liên hệ admin để mở lại.", "bad"); return; }
    M.role = acc.role;
    M.store.set("role", acc.role);
    if (acc.role === "admin") { M.go("login/mfa" + (d.next ? "?next=" + encodeURIComponent(d.next) : "")); return; }
    M.go(d.next || (acc.role === "employee" ? "portal" : "dashboard"));
  });

  M.screen("login/mfa", {
    bare: true, title: "Xác thực hai lớp", codes: ["NV-7.3.1"],
    render(p, q) {
      return `<div class="auth">${authArt()}<div class="auth-form"><div class="auth-card">
        ${M.codeChips(["NV-7.3.1"])}
        <h1>${q.sso ? "Đăng nhập qua SSO" : "Xác thực hai lớp"}</h1>
        <p class="muted">Nhập mã 6 số trong ứng dụng xác thực.</p>
        ${M.form("mfa", `<div class="stack-sm">
          <div class="otp">${[1, 2, 3, 4, 5, 6].map((i) => `<input name="d${i}" inputmode="numeric" maxlength="1" aria-label="Chữ số ${i}">`).join("")}</div>
          <input type="hidden" name="next" value="${M.esc(q.next || "")}">
          ${M.checkbox("trust", "Tin cậy trình duyệt này trong 30 ngày", false)}
          ${M.btn("Xác nhận", { primary: true, type: "submit" })}
          <a class="small" href="#/login" data-msg="Mockup: mở hộp nhập mã khôi phục dùng một lần.">Dùng mã khôi phục</a>
        </div>`)}
        ${M.cc("CC-20", "Công ty dùng nguồn danh bạ nào để SSO, và khi có SSO có giữ luồng tự đăng ký, chờ duyệt hiện nay không.")}
      </div></div></div>`;
    },
  });
  M.action("mfa", (form, d) => {
    const code = [1, 2, 3, 4, 5, 6].map((i) => d["d" + i] || "").join("");
    if (!/^\d{6}$/.test(code)) { M.toast("Mã gồm 6 chữ số.", "bad"); return; }
    M.go(d.next || (M.role === "employee" ? "portal" : "dashboard"));
  });

  M.screen("register", {
    bare: true, title: "Đăng ký tài khoản", codes: ["NT-1"],
    render() {
      return `<div class="auth">${authArt()}<div class="auth-form"><div class="auth-card">
        ${M.codeChips(["NT-1"])}
        <h1>Đăng ký tài khoản</h1>
        ${M.form("register", `<div class="stack-sm">
          ${M.field("Họ tên", M.input("name", { attrs: 'maxlength="150"' }), { req: true })}
          ${M.field("Tên đăng nhập", M.input("username", { attrs: 'maxlength="50"' }), { req: true, hint: "3-50 ký tự: chữ không dấu, số và các dấu . _ -" })}
          ${M.field("Mật khẩu", M.input("password", { type: "password" }), { req: true, hint: "Ít nhất 8 ký tự." })}
          ${M.field("Nhập lại mật khẩu", M.input("password2", { type: "password" }), { req: true })}
          ${M.field("Vai trò", M.select("role", M.ROLES.filter((r) => r.key !== "admin").map((r) => [r.key, r.label]), "employee"))}
          ${M.btn("Đăng ký", { primary: true, type: "submit" })}
        </div>`)}
        <p class="muted">Đã có tài khoản? <a href="#/login">Đăng nhập</a></p>
      </div></div></div>`;
    },
  });
  M.action("register", (form, d) => {
    if (!d.name.trim()) return M.invalid(form, "name", "Nhập họ tên.");
    if (/[^\p{L}\s'.-]/u.test(d.name)) return M.invalid(form, "name", "Họ tên không được chứa số hoặc ký tự đặc biệt.");
    const u = d.username.trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,50}$/.test(u)) return M.invalid(form, "username", "Tên đăng nhập dài 3-50 ký tự, chỉ gồm chữ không dấu, số và các dấu . _ -");
    if (D.users.some((x) => x.username === u)) return M.invalid(form, "username", "Tên đăng nhập này đã có người dùng. Chọn tên khác.");
    if (d.password.length < 8) return M.invalid(form, "password", "Mật khẩu cần ít nhất 8 ký tự.");
    if (d.password !== d.password2) return M.invalid(form, "password2", "Hai lần nhập mật khẩu chưa khớp.");
    D.users.push({ id: "us" + (D.users.length + 1), username: u, name: d.name.trim(), role: d.role, employeeId: null, status: "pending", created: "27/11/2026" });
    M.go("login?registered=1&u=" + encodeURIComponent(u));
  });

  /* =====================================================================
     Dashboard theo vai trò (NV-7.1.1)
     ===================================================================== */
  const sevTone = { Critical: "bad", High: "warn", Medium: "info", Low: "mute" };
  const statusCount = () => {
    const c = { ready: 0, deployed: 0, maintenance: 0, broken: 0, archived: 0 };
    D.assets.forEach((a) => c[a.status]++);
    return c;
  };
  const warrantySoon = () => D.assets
    .filter((a) => a.status !== "archived" && a.warranty && a.warranty.end)
    .map((a) => ({ a, days: M.daysUntil(a.warranty.end) }))
    .filter((x) => x.days != null && x.days >= -30 && x.days <= 90)
    .sort((x, y) => x.days - y.days);

  /* Mỗi ô: roles = vai trò được thấy (ô cần dữ liệu ngoài quyền thì không hiện). */
  const WIDGETS = {
    fleet: { title: "Tài sản theo trạng thái", roles: M.STAFF, wide: true, body() {
      const c = statusCount();
      const total = D.assets.length;
      return `<div class="row between"><div><span class="mono" style="font:700 40px/1 var(--font-display)">${total}</span> <span class="muted">tài sản</span></div>${M.btn("Mở danh sách", { href: "#/assets", sm: true })}</div>
        <div style="margin-top:14px">${M.stackbar(Object.keys(M.STATUS).map((k) => ({ label: M.STATUS[k], value: c[k], cls: "s-" + k })))}</div>`;
    } },
    todo: { title: "Việc cần xử lý", roles: M.STAFF, body() {
      const n = (fn) => { try { return fn(); } catch (e) { return 0; } };
      const items = {
        admin: [
          ["user", "Tài khoản chờ duyệt", n(() => D.users.filter((u) => u.status === "pending").length), "#/users"],
          ["radar", "Máy chờ xác nhận", n(() => D.agents.filter((x) => x.state === "pending").length), "#/agents"],
          ["play", "Lần chạy script chờ duyệt", n(() => D.scriptRuns.filter((x) => x.state === "approval").length), "#/script-runs"],
          ["archive", "Đề nghị thanh lý chờ duyệt", n(() => D.disposals.filter((x) => x.state === "pending").length), "#/disposals"],
        ],
        infra: [
          ["radar", "Máy chờ xác nhận", n(() => D.agents.filter((x) => x.state === "pending").length), "#/agents"],
          ["shield", "Lỗ hổng Critical chưa xử lý", n(() => D.cves.filter((x) => x.severity === "Critical").length), "#/vulns"],
          ["copy", "Cặp nghi trùng", n(() => D.duplicates.filter((x) => x.state === "open").length), "#/discovery/duplicates"],
          ["git", "Thay đổi chờ thực hiện", n(() => D.changes.filter((x) => x.status !== "closed").length), "#/changes"],
        ],
        asset: [
          ["file", "Biên bản quá hạn ký", D.handovers.filter((h) => h.status === "overdue").length, "#/handovers"],
          ["droplet", "Vật tư dưới ngưỡng", n(() => D.consumables.filter((x) => x.stock <= x.min).length), "#/consumables"],
          ["lifebuoy", "Ticket thu hồi khi nghỉ việc", 1, "#/tickets/T-1047"],
          ["scan", "Đợt kiểm kê đang chạy", n(() => D.stocktakes.filter((x) => x.state === "running").length), "#/stocktakes"],
          ["radar", "Máy chờ tạo tài sản", n(() => D.agents.filter((x) => x.state === "pending").length), "#/agents"],
        ],
        helpdesk: [
          ["lifebuoy", "Ticket mới chưa ai nhận", n(() => D.tickets.filter((t) => t.status === "new").length), "#/tickets"],
          ["timer", "Ticket sắp vi phạm SLA", n(() => D.tickets.filter((t) => t.slaState === "warn").length), "#/tickets"],
          ["alert", "Ticket đã vi phạm SLA", n(() => D.tickets.filter((t) => t.slaState === "breach").length), "#/tickets"],
          ["stamp", "Chờ tôi duyệt", n(() => D.approvals.filter((x) => x.state === "pending").length), "#/approvals"],
        ],
        audit: [
          ["scale", "Phần mềm thiếu bản quyền", 1, "#/licenses/compliance"],
          ["check", "Máy không tuân thủ", n(() => D.compliance.filter((x) => [x.av, x.enc, x.adm].some((c) => c && c[0] === "fail")).length), "#/compliance"],
          ["list", "Nhật ký kiểm toán hôm nay", n(() => D.auditLog.filter((x) => String(x.at).startsWith("27/11/2026")).length), "#/audit-log"],
        ],
      }[M.role] || [];
      return `<div class="stack-sm">${items.map(([ic, t, c, href]) => `<a class="row between" href="${href}" style="text-decoration:none;padding:8px 10px;border:1px solid var(--line);border-radius:var(--r-ctl)"><span class="row">${M.icon(ic)}<span>${M.esc(t)}</span></span><b class="mono">${M.esc(c)}</b></a>`).join("")}</div>`;
    } },
    sla: { title: "Tình trạng SLA ticket đang mở", roles: M.STAFF, body() {
      const open = list("tickets").filter((t) => !["resolved", "closed"].includes(t.status));
      if (!open.length) return M.empty("Chưa có ticket đang mở.");
      const by = (s) => open.filter((t) => t.slaState === s).length;
      const risky = open.filter((t) => t.slaState === "warn" || t.slaState === "breach").slice(0, 4);
      return `${M.stackbar([{ label: "Trong hạn", value: by("ok"), tone: "ok" }, { label: "Sắp vi phạm", value: by("warn"), tone: "warn" }, { label: "Đã vi phạm", value: by("breach"), tone: "bad" }, { label: "Tạm dừng", value: by("paused"), tone: "mute" }])}
        <div class="stack-sm" style="margin-top:12px">${risky.map((t) => `<a href="#/tickets/${M.esc(t.id)}" class="row between" style="text-decoration:none"><span><b class="mono">${M.esc(t.id)}</b> ${M.esc(t.title)}</span>${M.pill(t.slaState === "breach" ? "Vi phạm" : "Sắp vi phạm", t.slaState === "breach" ? "bad" : "warn")}</a>`).join("")}</div>`;
    } },
    vulns: { title: "Lỗ hổng bảo mật theo mức", roles: M.STAFF, link: ["#/vulns", "Xem bảng xếp hạng"], body() {
      const c = list("cves");
      if (!c.length) return M.empty("Chưa đồng bộ dữ liệu lỗ hổng.");
      return M.bars(["Critical", "High", "Medium", "Low"].map((s) => ({ label: s, value: c.filter((x) => x.severity === s).length, tone: sevTone[s] })));
    } },
    warranty: { title: "Sắp hết bảo hành (≤ 90 ngày)", roles: ["admin", "asset", "helpdesk", "audit"], body() {
      const rows = warrantySoon();
      if (!rows.length) return M.empty("Không có tài sản sắp hết bảo hành.");
      return `<div class="stack-sm">${rows.slice(0, 5).map(({ a, days }) => `<div class="row between">${M.tape(a.tag, a.id)}<span class="grow" style="flex:1">${M.esc(a.name)}</span>${M.pill(days < 0 ? "Đã hết " + -days + " ngày" : "Còn " + days + " ngày", days < 0 ? "mute" : days <= 30 ? "bad" : "warn")}</div>`).join("")}</div>`;
    } },
    ssl: { title: "Chứng chỉ SSL", roles: M.STAFF, body() {
      const s = list("ssl");
      if (!s.length) return M.empty("Chưa khai báo địa chỉ cần theo dõi.");
      const bad = s.filter((x) => x.state !== "ok").slice(0, 4);
      return `<div class="stack-sm">${bad.map((x) => `<div class="row between"><span class="mono small">${M.esc(x.host)}</span>${x.state === "error" ? M.pill("Lỗi kết nối", "mute") : M.pill(x.daysLeft < 0 ? "Đã hết hạn" : "Còn " + x.daysLeft + " ngày", x.state === "expired" ? "bad" : "warn")}</div>`).join("") || M.empty("Mọi chứng chỉ còn hạn trên 30 ngày.")}</div>`;
    } },
    stock: { title: "Vật tư dưới ngưỡng tồn", roles: M.STAFF, body() {
      const s = list("consumables").filter((c) => c.stock <= c.min);
      if (!s.length) return M.empty("Không có vật tư nào dưới ngưỡng.");
      return `<div class="stack-sm">${s.map((c) => `<div class="row between"><span>${M.esc(c.name)}</span><span class="mono">${c.stock} / ngưỡng ${c.min}</span></div>`).join("")}</div>`;
    } },
    license: { title: "Tuân thủ bản quyền", roles: M.STAFF, link: ["#/licenses/compliance", "Đối chiếu chi tiết"], body() {
      const l = list("licenses");
      if (!l.length) return M.empty("Chưa có bản quyền nào.");
      return M.bars(l.slice(0, 6).map((x) => ({ label: x.software, value: x.used, tone: x.used > x.seats ? "bad" : x.used < x.seats * 0.6 ? "mute" : "ok" })), { max: Math.max(...l.slice(0, 6).map((x) => Math.max(x.seats, x.used))) });
    } },
    agents: { title: "Agent và máy chờ", roles: M.STAFF, body() {
      const ag = list("agents");
      if (!ag.length) return M.empty("Chưa có agent nào.");
      return M.stats([
        { label: "Đang báo cáo", value: ag.filter((x) => x.state === "linked").length, tone: "ok", href: "#/agents" },
        { label: "Chờ xác nhận", value: ag.filter((x) => x.state === "pending").length, tone: "warn", href: "#/agents" },
        { label: "Lâu không thấy", value: D.assets.filter((a) => a.lastSeen).length, tone: "mute", href: "#/discovery/unseen" },
      ]);
    } },
    activity: { title: "Hoạt động gần đây", roles: M.STAFF, wide: true, body() {
      const rows = [];
      Object.entries(D.custody || {}).forEach(([id, logs]) => logs.forEach((l) => rows.push({ id, l })));
      rows.sort((x, y) => (M.parseDate(y.l.at) || 0) - (M.parseDate(x.l.at) || 0));
      if (!rows.length) return M.empty("Chưa có hoạt động.");
      return `<ul class="log">${rows.slice(0, 6).map(({ id, l }) => { const a = M.asset(id); return `<li><time>${M.esc(l.at)}</time><div><div class="log-title">${M.tape(a.tag, a.id)} ${M.esc(l.title)}</div><div class="log-meta">${M.esc(l.by)}${l.note ? " - " + M.esc(l.note) : ""}</div></div></li>`; }).join("")}</ul>`;
    } },
  };
  const DEFAULT_ORDER = {
    admin: ["fleet", "todo", "vulns", "sla", "warranty", "license", "agents", "ssl", "stock", "activity"],
    infra: ["todo", "vulns", "agents", "ssl", "fleet", "sla", "license", "activity"],
    asset: ["fleet", "todo", "warranty", "stock", "license", "agents", "sla", "activity"],
    helpdesk: ["todo", "sla", "fleet", "warranty", "vulns", "activity"],
    audit: ["license", "vulns", "fleet", "todo", "warranty", "ssl", "activity"],
  };
  const dashOrder = () => {
    const saved = M.store.get("dash-" + M.role, "");
    const def = DEFAULT_ORDER[M.role] || [];
    const order = saved ? saved.split(",").filter((k) => def.includes(k)) : def;
    def.forEach((k) => { if (!order.includes(k)) order.push(k); });
    return order.filter((k) => WIDGETS[k] && WIDGETS[k].roles.includes(M.role));
  };
  let dashEdit = false;
  M.screen("dashboard", {
    nav: "dashboard", title: "Dashboard", codes: ["NV-7.1.1", "NV-5.2.2", "NT-6"],
    render() {
      const order = dashOrder();
      const greet = M.me().user.split(" ").slice(-1)[0];
      const cards = order.map((k, i) => {
        const w = WIDGETS[k];
        let body;
        try { body = w.body(); } catch (e) { body = M.empty("Chưa có dữ liệu cho ô này."); }
        const ctl = dashEdit ? `<span class="row" style="gap:4px">${M.btn("↑", { sm: true, act: "dash-move", arg: k + ":-1", disabled: i === 0, title: "Đưa lên" })}${M.btn("↓", { sm: true, act: "dash-move", arg: k + ":1", disabled: i === order.length - 1, title: "Đưa xuống" })}</span>`
          : w.link ? M.btn(w.link[1], { sm: true, ghost: true, href: w.link[0] }) : "";
        return `<div style="${w.wide ? "grid-column:1/-1" : ""}">${M.panel({ title: w.title, actions: ctl, body })}</div>`;
      }).join("");
      return M.page({
        title: `Chào ${M.esc(greet)}`,
        codes: ["NV-7.1.1", "NV-5.2.2"],
        actions: dashEdit
          ? M.btn("Khôi phục mặc định", { act: "dash-reset" }) + M.btn("Xong", { primary: true, act: "dash-edit" })
          : M.btn("Sắp xếp lại", { act: "dash-edit", icon: "sliders" }),
        body: `${dashEdit ? M.anno("Bản thật dùng kéo thả. Bố cục lưu theo tài khoản.") : ""}
          <div class="grid g2">${cards}</div>`,
      });
    },
  });
  M.action("dash-edit", () => { dashEdit = !dashEdit; M.refresh(); });
  M.action("dash-reset", () => { M.store.set("dash-" + M.role, ""); M.refresh(); return "Đã khôi phục bố cục mặc định."; });
  M.action("dash-move", (el, arg) => {
    const [k, dir] = arg.split(":");
    const order = dashOrder();
    const i = order.indexOf(k), j = i + Number(dir);
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    M.store.set("dash-" + M.role, order.join(","));
    M.refresh();
  });

  /* =====================================================================
     Thông báo (NT-6)
     ===================================================================== */
  M.screen("notifications", {
    nav: "notifications", title: "Thông báo", codes: ["NT-6"],
    render(p, q) {
      const mine = M.myNotifications();
      const shown = q.f === "unread" ? mine.filter((n) => !n.read) : mine;
      const tone = { bad: "bad", warn: "warn", info: "info" };
      return M.page({
        title: "Thông báo", codes: ["NT-6"],
        actions: M.btn("Đánh dấu tất cả đã đọc", { act: "notif-all" }) + (M.can("system.config") ? M.btn("Cấu hình kênh và người nhận", { href: "#/notify-settings" }) : ""),
        body: M.panel({
          flush: true,
          actions: M.seg("notif", [["all", "Tất cả"], ["unread", "Chưa đọc"]], q.f === "unread" ? "unread" : "all"),
          title: `${mine.filter((n) => !n.read).length} chưa đọc`,
          body: shown.length ? `<div>${shown.map((n) => `<a href="${n.href}" data-act="notif-open" data-arg="${n.id}" class="row" style="align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--line);text-decoration:none;${n.read ? "" : "background:color-mix(in srgb, var(--tape) 8%, transparent)"}">
              <span class="pill t-${tone[n.kind] || "mute"}" style="margin-top:2px">${n.read ? "Đã đọc" : "Mới"}</span>
              <span style="flex:1"><b>${M.esc(n.title)}</b><span class="cell-sub">${M.esc(n.body)}</span></span>
              <time class="mono small muted">${M.esc(n.at)}</time></a>`).join("")}</div>` : M.empty("Không có thông báo nào."),
        }),
      });
    },
  });
  M.action("seg:notif", (v) => M.go("notifications" + (v === "unread" ? "?f=unread" : "")));
  M.action("notif-all", () => { M.myNotifications().forEach((n) => (n.read = true)); M.refresh(); return "Đã đánh dấu tất cả là đã đọc."; });
  M.action("notif-open", (el, id) => { const n = D.notifications.find((x) => x.id === id); n.read = true; location.hash = n.href; });

  /* =====================================================================
     Tìm kiếm toàn cục (NT-7)
     ===================================================================== */
  M.screen("search", {
    title: "Tìm kiếm", codes: ["NT-7"], roles: M.ALL,
    render(p, q) {
      const raw = (q.q || "").trim();
      const k = M.fold(raw);
      const has = (...vals) => vals.some((v) => v && M.fold(v).includes(k));
      const groups = [];
      if (k) {
        const assets = (M.role === "employee" ? D.assets.filter((a) => a.holder && ((a.holder.type === "employee" && a.holder.id === M.me().employeeId) || (a.holder.type === "asset" && M.asset(a.holder.id).holder && M.asset(a.holder.id).holder.id === M.me().employeeId))) : D.assets)
          .filter((a) => has(a.tag, a.name, a.serial, M.holderText(a), a.tech && a.tech.hostname, a.tech && a.tech.ip, a.ip, a.hostname));
        groups.push(["Tài sản", assets.map((a) => [`#/${M.role === "employee" ? "portal/assets" : "assets/" + a.id}`, `${M.tape(a.tag)} ${M.esc(a.name)}`, [a.serial && "S/N " + a.serial, (a.tech && a.tech.ip) || a.ip, M.holderText(a)].filter(Boolean).join(" - ")])]);
        if (M.role !== "employee") {
          groups.push(["Nhân viên", D.employees.filter((e) => has(e.name, e.code, e.email)).map((e) => [`#/employees/${e.id}`, M.esc(e.name), `${e.code} - ${e.email}`])]);
          groups.push(["Ticket", list("tickets").filter((t) => has(t.id, t.title)).map((t) => [`#/tickets/${t.id}`, `<b class="mono">${M.esc(t.id)}</b> ${M.esc(t.title)}`, ""])]);
          groups.push(["Bản quyền", list("licenses").filter((l) => has(l.software, l.id)).map((l) => [`#/licenses/${l.id}`, M.esc(l.software), l.id])]);
          groups.push(["Lỗ hổng", list("cves").filter((c) => has(c.id, c.product, c.title)).map((c) => [`#/vulns/${c.id}`, `<b class="mono">${M.esc(c.id)}</b> ${M.esc(c.product)}`, c.severity])]);
          groups.push(["Nhà cung cấp", D.vendors.filter((v) => has(v.name, v.taxCode)).map((v) => [`#/vendors/${v.id}`, M.esc(v.name), "MST " + v.taxCode])]);
        } else {
          groups.push(["Yêu cầu của tôi", list("tickets").filter((t) => t.requesterId === M.me().employeeId && has(t.id, t.title)).map((t) => ["#/portal/requests", `<b class="mono">${M.esc(t.id)}</b> ${M.esc(t.title)}`, ""])]);
        }
      }
      const total = groups.reduce((s, g) => s + g[1].length, 0);
      return M.page({
        title: raw ? `Kết quả cho "${M.esc(raw)}"` : "Tìm kiếm",
        codes: ["NT-7"],
        body: `${M.form("global-search", `<div class="row">${M.input("q", { value: raw, ph: "Mã tài sản, serial, IP, tên nhân viên, mã ticket", attrs: 'style="flex:1"' })}${M.btn("Tìm", { primary: true, type: "submit" })}</div>`)}
          ${!raw ? "" : total === 0 ? M.panel({ body: M.empty(`Không tìm thấy kết quả cho "${raw}".`) }) : groups.filter((g) => g[1].length).map(([name, rows]) => M.panel({
            title: `${name} - ${rows.length}`, flush: true,
            body: `<div>${rows.slice(0, 8).map(([href, main, sub]) => `<a href="${href}" class="row between" style="padding:11px 16px;border-bottom:1px solid var(--line);text-decoration:none"><span>${main}</span><span class="small muted">${M.esc(sub)}</span></a>`).join("")}</div>`,
          })).join("")}`,
      });
    },
  });

  /* =====================================================================
     Cài đặt tài khoản (MH-09, NT-7, NV-7.3.1)
     ===================================================================== */
  M.screen("settings", {
    title: "Cài đặt", codes: ["NT-1", "NT-7", "NV-7.3.1"], roles: M.ALL, narrow: true,
    render() {
      const me = M.me();
      const acc = D.users.find((u) => u.username === me.username) || {};
      const emp = acc.employeeId ? M.emp(acc.employeeId) : null;
      const theme = document.documentElement.dataset.theme || "system";
      return M.page({
        title: "Cài đặt", codes: ["NT-1", "NT-7", "NV-7.3.1"],
        body: `
        ${M.panel({ title: "Thông tin tài khoản", body: M.form("profile", `<div class="form-grid">
            ${M.field("Họ tên", M.input("name", { value: me.user }), { req: true })}
            ${M.field("Tên đăng nhập", M.input("username", { value: me.username, ro: true }))}
            ${M.field("Vai trò", M.input("role", { value: me.label, ro: true }))}
            ${M.field("Hồ sơ nhân viên", M.input("emp", { value: emp ? emp.code + " - " + emp.name : "Chưa nối", ro: true }))}
          </div>
          <div class="form-actions" style="margin-top:16px">${M.btn("Lưu thông tin", { primary: true, type: "submit" })}</div>`) })}
        ${M.panel({ title: "Đổi mật khẩu", body: M.form("password", `<div class="form-grid">
            ${M.field("Mật khẩu hiện tại", M.input("cur", { type: "password" }), { req: true })}
            ${M.field("Mật khẩu mới", M.input("pw", { type: "password" }), { req: true })}
            ${M.field("Nhập lại mật khẩu mới", M.input("pw2", { type: "password" }), { req: true })}
          </div>
          <div class="form-actions" style="margin-top:16px">${M.btn("Đổi mật khẩu", { primary: true, type: "submit" })}</div>`) })}
        ${M.panel({ title: "Xác thực hai lớp", body: `<div class="row between"><span>Ứng dụng xác thực (TOTP)</span>${me.key === "admin" ? M.pill("Đang bật", "ok") : M.btn("Bật xác thực hai lớp", { msg: "Mockup: hiện mã QR để quét bằng ứng dụng xác thực, rồi nhập mã 6 số để xác nhận." })}</div>` })}
        ${M.panel({ title: "Giao diện và ngôn ngữ", body: `<div class="stack-sm">
            <div class="row between"><span>Giao diện</span>${M.seg("theme", [["system", "Theo hệ thống"], ["light", "Sáng"], ["dark", "Tối"]], theme)}</div>
            <hr class="divider">
            <div class="row between"><span>Ngôn ngữ</span>${M.seg("lang", [["vi", "Tiếng Việt"], ["en", "English"]], "vi")}</div>
          </div>` })}
        ${M.panel({ title: "Nhận thông báo", body: `<div class="stack-sm">${M.checkbox("n_app", "Trong ứng dụng (chuông ở thanh trên)", true)}${M.checkbox("n_mail", "Email " + (emp ? emp.email : ""), true)}${M.checkbox("n_teams", "Microsoft Teams", false)}</div>` })}`,
      });
    },
  });
  M.action("seg:theme", (v) => M.setTheme(v));
  M.action("seg:lang", (v) => { if (v === "en") M.toast("Giao diện tiếng Anh chưa có (NT-7, phần chưa làm)."); });
  M.action("profile", (form, d) => {
    if (!d.name.trim()) return M.invalid(form, "name", "Nhập họ tên.");
    if (/[^\p{L}\s'.-]/u.test(d.name)) return M.invalid(form, "name", "Họ tên không được chứa số hoặc ký tự đặc biệt.");
    return "Đã lưu thông tin";
  });
  M.action("password", (form, d) => {
    if (!d.cur) return M.invalid(form, "cur", "Nhập mật khẩu hiện tại.");
    if (d.cur === "sai12345") return M.invalid(form, "cur", "Mật khẩu hiện tại không đúng.");
    if (d.pw.length < 8) return M.invalid(form, "pw", "Mật khẩu cần ít nhất 8 ký tự.");
    if (d.pw === d.cur) return M.invalid(form, "pw", "Mật khẩu mới phải khác mật khẩu hiện tại.");
    if (d.pw !== d.pw2) return M.invalid(form, "pw2", "Hai lần nhập mật khẩu mới chưa khớp.");
    form.reset();
    return "Đã đổi mật khẩu";
  });

  /* =====================================================================
     Bản đồ màn hình (trang riêng của mockup)
     ===================================================================== */
  M.screen("sitemap", {
    title: "Bản đồ màn hình", roles: M.ALL, codes: ["NT-2"],
    render(p, q) {
      const C = M.COVERAGE;
      const cnt = (st) => C.filter((r) => r.st === st).length;
      const modules = [...new Set(C.map((r) => r.module))];
      const hl = q.code || "";
      const byModule = modules.map((mod) => {
        const rows = C.filter((r) => r.module === mod);
        return M.panel({
          title: `${mod} - ${rows.length} nghiệp vụ`, flush: true,
          body: M.table({
            cols: [
              { h: "Mã", r: (r) => `<span class="code-chip st-${r.st}" ${r.code === hl ? 'style="outline:2px solid var(--ink)"' : ""}>${M.esc(r.code)}</span>` },
              { h: "Nghiệp vụ", cls: "wrap", r: (r) => `<b>${M.esc(r.name)}</b>` },
              { h: "So với code", r: (r) => M.pill(M.ST_LABEL[r.st], { done: "ok", partial: "warn", todo: "mute" }[r.st]) },
              { h: "Màn hình trong mockup", cls: "wrap", r: (r) => r.screens.map((s) => `<a class="mono small" href="#/${s}">#/${M.esc(s)}</a>`).join("<br>") },
            ],
            rows,
          }),
        });
      }).join("");
      const roleKeys = M.ROLES.map((r) => r.key);
      const navRows = [];
      M.NAV.forEach((g) => g.items.forEach((it) => navRows.push({ g: g.group, it })));
      const byRole = M.panel({
        title: "Menu mỗi vai trò thấy", flush: true,
        body: M.table({
          cols: [{ h: "Nhóm", r: (x) => `<span class="muted small">${M.esc(x.g)}</span>` }, { h: "Màn hình", r: (x) => `<a href="#/${x.it.path}">${M.esc(x.it.label)}</a>` }]
            .concat(roleKeys.map((k) => ({ h: M.esc(M.roleLabel(k)), cls: "center", r: (x) => (x.it.roles.includes(k) ? "●" : '<span class="muted">—</span>') }))),
          rows: navRows,
        }),
      });
      const screensAll = M.screens();
      return M.page({
        title: "Bản đồ màn hình",
        sub: "Bấm đường dẫn để mở màn hình. Bấm chip mã ở đầu mỗi màn để quay lại đây.",
        body: `${M.stats([
            { label: "Đã có trong code", value: cnt("done"), tone: "ok" },
            { label: "Một phần", value: cnt("partial"), tone: "warn" },
            { label: "Chưa có", value: cnt("todo"), tone: "mute" },
            { label: "Màn hình mockup", value: screensAll.length, tone: "info" },
          ])}
          ${M.anno(`Chấm trên chip mã: <span style="color:var(--ok)">xanh</span> là đã có code, <span style="color:var(--warn)">cam</span> là một phần, <span style="color:var(--mute)">xám</span> là chưa có. Khung tím nét đứt là điểm cần chốt (CC-x), khung vàng là ghi chú của mockup. Nút "Chú thích" trên dải vàng ẩn cả hai.`)}
          ${M.tabs("sitemap", [
            { key: "nv", label: "Theo nghiệp vụ", n: C.length, body: byModule },
            { key: "role", label: "Theo vai trò", n: navRows.length, body: byRole },
          ])}`,
      });
    },
    after() {
      const q = M.current().query;
      if (q.code) { M.tabState.sitemap = "nv"; }
    },
  });

  /* =====================================================================
     Luồng nghiệp vụ đi qua nhiều module (mục 9)
     ===================================================================== */
  M.screen("flows", {
    title: "Luồng nghiệp vụ", roles: M.ALL,
    render() {
      return M.page({
        title: "Luồng nghiệp vụ",
        sub: "Mỗi bước mở màn hình làm bước đó. Một số bước cần đổi vai trò ở dải vàng.",
        body: `<div class="grid g2">${M.FLOWS.map((f, fi) => M.panel({
          title: `${fi + 1}. ${M.esc(f.title)}`,
          body: `<ol class="stack-sm" style="padding-left:18px">${f.steps.map(([text, href, code]) => `<li><div class="row between"><a href="#/${href}">${M.esc(text)}</a>${M.codeChips([code])}</div></li>`).join("")}</ol>`,
        })).join("")}</div>`,
      });
    },
  });
})();
