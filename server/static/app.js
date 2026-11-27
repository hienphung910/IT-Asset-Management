// Web UI Module 2: HTML + JavaScript thuần, gọi API của FastAPI.
// Ngôn ngữ hình ảnh: mã tài sản = băng nhãn vàng, trạng thái = đèn LED, tem in = nhãn thật.

// ===================== Hằng số =====================
const STATUS = {
  ready: "Sẵn sàng cấp phát",
  deployed: "Đang sử dụng",
  maintenance: "Đang sửa chữa",
  broken: "Hỏng / Chờ thanh lý",
  archived: "Đã thanh lý",
};
const $app = document.getElementById("app");

// ===================== Tài khoản & quyền =====================
// Nhãn vai trò, cùng thứ tự và nội dung với ROLE_LABELS trong app/permissions.py
const ROLES = {
  admin: "Quản trị hệ thống", infra: "Quản trị hạ tầng", manager: "Quản lý tài sản",
  helpdesk: "Helpdesk", auditor: "Kiểm toán", enduser: "Nhân viên",
};
// Vai trò chọn được khi tự đăng ký (không có admin), mặc định là ít quyền nhất
const SIGNUP_ROLES = ["enduser", "auditor", "manager", "infra", "helpdesk"];
// Trạng thái tài khoản: [màu đèn, nhãn]
const USER_STATUS = {
  active: ["ready", "Đang hoạt động"],
  pending: ["maintenance", "Chờ duyệt"],
  disabled: ["archived", "Đã khóa"],
};
let me = null;  // tài khoản đang đăng nhập, kèm danh sách quyền do server trả về
// Tên quyền lấy từ app/permissions.py (ví dụ "asset.write"). Giao diện không giữ bảng quyền
// riêng: chỉ hỏi server đã cấp quyền nào, để ẩn/hiện nút. Server mới là nơi chặn thật.
const can = perm => !!me && me.permissions.includes(perm);
const seesAll = () => can("asset.view_all");  // false = vai trò Nhân viên, chỉ thấy máy của mình

// Chỉ giữ vài icon thật sự giúp nhận biết (tìm kiếm, vị trí)
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pin: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
};
function icon(name) {
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

// ===================== Giao diện sáng / tối =====================
const THEME_KEY = "itam-theme";
function getTheme() {
  try { return localStorage.getItem(THEME_KEY) || "system"; } catch { return "system"; }
}
function applyTheme(pref) {
  const root = document.documentElement;
  if (pref === "light" || pref === "dark") root.dataset.theme = pref;
  else delete root.dataset.theme;
  document.querySelectorAll("[data-theme-btn]").forEach(b => {
    const on = b.dataset.themeBtn === pref;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", on);
  });
}
function setTheme(pref) {
  try { localStorage.setItem(THEME_KEY, pref); } catch {}
  applyTheme(pref);
}

// ===================== Tiện ích =====================
function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

const pad2 = n => String(n).padStart(2, "0");
function fmtDate(s) {
  if (!s) return "Chưa rõ";
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString("vi-VN");
}
function fmtLogTime(s) {
  const d = new Date(s);
  if (isNaN(d)) return esc(s ?? "");
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}<br>${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function led(status) {
  return `<span class="led s-${esc(status)}">${esc(STATUS[status] || status)}</span>`;
}

function initials(name) {
  const words = String(name || "").trim().split(/\s+/);
  if (!words[0]) return "?";
  return (words[0][0] + (words.length > 1 ? words[words.length - 1][0] : "")).toUpperCase();
}

function holder(a) {
  if (a.assigned_employee) {
    const e = a.assigned_employee;
    const inner = `<span class="tile">${esc(initials(e.full_name))}</span><span class="holder-name">${esc(e.full_name)}</span>`;
    return seesAll() ? `<a class="holder" href="#/employees/${e.id}">${inner}</a>` : `<span class="holder">${inner}</span>`;
  }
  if (a.assigned_location) {
    return `<span class="holder"><span class="tile">${icon("pin")}</span>${esc(a.assigned_location.name)}</span>`;
  }
  return `<span class="muted">Chưa giao</span>`;
}

function subline(a) {
  return [a.category?.name, [a.manufacturer, a.model].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
}

function statusOptions(list, selected) {
  return list
    .map(s => `<option value="${s}" ${s === selected ? "selected" : ""}>${STATUS[s]}</option>`)
    .join("");
}

function emptyRow(colspan, text) {
  return `<tr><td colspan="${colspan}" class="wrap"><div class="empty">${esc(text)}</div></td></tr>`;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function bindRowLinks(scope) {
  scope.onclick = e => {
    const tr = e.target.closest("tr[data-href]");
    if (tr && !e.target.closest("a, button")) location.hash = tr.dataset.href;
  };
}

let toastTimer;
function toast(message, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.className = "toast" + (isError ? " error" : "");
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), isError ? 5000 : 2500);
}
// Lỗi "chưa đăng nhập" đã được xử lý bằng cách hiện màn đăng nhập, không cần báo thêm
const showError = err => { if (!err.authRequired) toast(err.message, true); };

// Lỗi kiểm tra dữ liệu từ server (tiếng Anh) → câu tiếng Việt dễ hiểu
const FIELD_LABELS = {
  name: "Tên", asset_tag: "Mã tài sản", serial_number: "Serial", manufacturer: "Hãng sản xuất",
  model: "Model", category_id: "Danh mục", code: "Mã NV", full_name: "Họ tên", email: "Email",
  department: "Phòng ban", status: "Trạng thái", note: "Ghi chú", notes: "Ghi chú",
  employee_id: "Hồ sơ nhân viên",
  username: "Tên đăng nhập", password: "Mật khẩu", role: "Vai trò",
  current_password: "Mật khẩu hiện tại", new_password: "Mật khẩu mới",
};
// Agent (Module 1). MATCHED_BY: máy được gắn với tài sản nhờ đâu (Agent.matched_by phía server)
const MATCHED_BY = {
  serial: "Tự khớp theo serial", bios_uuid: "Tự khớp theo BIOS UUID", mac: "Tự khớp theo địa chỉ MAC",
  hostname: "Tự khớp theo tên máy", manual: "Gắn bằng tay", created: "Tài sản tạo từ máy này",
};
const PLATFORMS = { linux: "Linux", windows: "Windows", macos: "macOS" };
function validationMessage(e) {
  const field = FIELD_LABELS[e.loc?.[e.loc.length - 1]] || "";
  switch (e.type) {
    case "missing":
    case "string_type": return field ? `Chưa nhập ${field}.` : "Còn thiếu thông tin bắt buộc.";
    case "string_too_long": return `${field} dài quá ${e.ctx?.max_length} ký tự.`;
    case "literal_error": return `${field || "Giá trị"} không hợp lệ.`;
    case "value_error": return e.msg.replace(/^Value error, /, "");
    default: return field ? `${field} không hợp lệ.` : "Dữ liệu gửi lên không hợp lệ.";
  }
}

async function api(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch("/api" + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Không kết nối được máy chủ. Kiểm tra server còn chạy rồi thử lại.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = `Máy chủ báo lỗi ${res.status}. Thử lại sau ít phút.`;
    let fieldErrors = [];
    const d = data?.detail;
    if (typeof d === "string") message = d;
    else if (Array.isArray(d)) {
      fieldErrors = d.map(e => ({ field: e.loc?.[e.loc.length - 1], message: validationMessage(e) }));
      message = [...new Set(fieldErrors.map(f => f.message))].join(" ");
    } else if (d && d.message) {
      message = d.message;
      if (d.field) fieldErrors = [{ field: d.field, message: d.message }];
    }
    const err = new Error(message);
    err.fieldErrors = fieldErrors;
    if (res.status === 401) {  // chưa đăng nhập, phiên hết hạn hoặc tài khoản vừa bị khóa
      err.authRequired = true;
      requireLogin();
    }
    throw err;
  }
  return data;
}

// ===================== Báo lỗi ngay tại ô nhập =====================
// Cùng quy tắc với server (app/schemas.py)
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
const emailRule = v => EMAIL_RE.test(v) ? null : "Email không hợp lệ. Nhập theo dạng ten@congty.vn.";
// Họ tên: chỉ chữ cái (có dấu), khoảng trắng và ' - . (server tự gộp khoảng trắng thừa)
const fullNameRule = v => /^[\p{L}\p{M} '.-]+$/u.test(v.normalize("NFC")) ? null : "Họ tên không được chứa số hoặc ký tự đặc biệt.";
const usernameRule = v => /^[a-z0-9._-]{3,50}$/.test(v.toLowerCase()) ? null : "Tên đăng nhập dài 3-50 ký tự, chỉ gồm chữ không dấu, số và các dấu . _ -";
const passwordRule = v => v.length >= 8 ? null : "Mật khẩu cần ít nhất 8 ký tự.";

function markInvalid(input, message, focus) {
  input.setAttribute("aria-invalid", "true");
  let hint = input.parentElement.querySelector(".field-error");
  if (!hint) {
    hint = document.createElement("small");
    hint.className = "field-error";
    hint.id = `${input.id}-error`;
    input.after(hint);
    input.setAttribute("aria-describedby", hint.id);
  }
  hint.textContent = message;
  if (focus) {
    input.focus();
    input.select?.();
  }
}

function clearFieldError(input) {
  input.removeAttribute("aria-invalid");
  input.removeAttribute("aria-describedby");
  input.parentElement.querySelector(".field-error")?.remove();
}

// Gắn vào form: gõ lại vào ô nào thì bỏ báo lỗi của ô đó
function watchFieldErrors(form) {
  form.addEventListener("input", e => {
    if (e.target.getAttribute?.("aria-invalid")) clearFieldError(e.target);
  });
}

// Kiểm tra trước khi gửi: ô bắt buộc + hàm validate riêng của từng ô
function checkFields(form, rules) {
  form.querySelectorAll("[aria-invalid]").forEach(clearFieldError);
  let ok = true;
  for (const r of rules) {
    const input = form.elements[r.name];
    const value = (input?.value || "").trim();
    const message = (r.required && !value) ? `Chưa nhập ${r.label}.` : (value && r.validate ? r.validate(value) : null);
    if (message) {
      markInvalid(input, message, ok);
      ok = false;
    }
  }
  return ok;
}

// Lỗi từ server có tên ô thì đánh dấu ô đó, không có thì hiện thông báo góc màn hình
function showFormError(form, err) {
  let shown = false;
  for (const fe of err.fieldErrors || []) {
    const input = form.elements[fe.field];
    if (!input || !input.tagName) continue;
    markInvalid(input, fe.message, !shown);
    shown = true;
  }
  if (!shown) showError(err);
}

// ===================== Tài sản: danh sách =====================
const listState = { q: "", status: "", page: 1 };
const PAGE_SIZE = 20;
let listRequest = 0;

async function viewAssetList() {
  $app.innerHTML = `
    <div class="page-head">
      <h1>${seesAll() ? "Tài sản" : "Tài sản của tôi"}</h1>
      ${can("asset.write") ? `<a class="btn btn-primary" href="#/assets/new">+ Thêm tài sản</a>` : ""}
    </div>
    <section class="panel fleet" id="fleet" aria-label="Tổng quan theo trạng thái" ${seesAll() ? "" : "hidden"}></section>
    <section class="panel table-panel">
      <form id="filter" class="toolbar" role="search">
        <label class="search">${icon("search")}
          <input name="q" id="asset-q" placeholder="Tìm theo mã, tên, serial hoặc người giữ" value="${esc(listState.q)}" aria-label="Tìm tài sản">
        </label>
      </form>
      <div class="table-scroll"><table>
        <thead><tr>
          <th>Mã tài sản</th><th>Tài sản</th><th>Serial</th><th>Trạng thái</th><th>Đang giao cho</th>
        </tr></thead>
        <tbody id="asset-rows"></tbody>
      </table></div>
      <div class="table-foot" id="asset-foot"></div>
    </section>`;

  const form = $app.querySelector("#filter");
  let timer;
  const apply = () => {
    listState.q = form.q.value.trim();
    listState.page = 1;
    refreshAssets().catch(showError);
  };
  form.onsubmit = e => { e.preventDefault(); apply(); };
  form.q.oninput = () => { clearTimeout(timer); timer = setTimeout(apply, 300); };
  bindRowLinks($app.querySelector("#asset-rows"));
  $app.querySelector("#fleet").onclick = e => {
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    const s = btn.dataset.status;
    listState.status = listState.status === s ? "" : s;
    listState.page = 1;
    refreshAssets().catch(showError);
  };
  await refreshAssets();
}

function renderFleet(s) {
  const keys = Object.keys(STATUS);
  const filtered = listState.status;
  return `
    <div class="fleet-top">
      <div class="fleet-total mono">${s.total}<small>tài sản đang quản lý</small></div>
      ${filtered ? `<button type="button" class="linklike" data-status="${filtered}">Bỏ lọc, xem tất cả</button>` : ""}
    </div>
    <div class="bar" role="img" aria-label="Tỉ lệ tài sản theo trạng thái">
      ${keys.filter(k => s[k] > 0).map(k => `<span class="s-${k}" style="flex-grow:${s[k]}" title="${STATUS[k]}: ${s[k]}"></span>`).join("")}
    </div>
    <div class="legend">
      ${keys.map(k => `
        <button type="button" data-status="${k}" class="${filtered === k ? "active" : ""}" aria-pressed="${filtered === k}">
          ${led(k)}<span class="num">${s[k]}</span>
        </button>`).join("")}
    </div>`;
}

async function refreshAssets() {
  const req = ++listRequest;
  const params = new URLSearchParams({ page: listState.page, size: PAGE_SIZE });
  if (listState.q) params.set("q", listState.q);
  if (listState.status) params.set("status", listState.status);
  const [data, s] = await Promise.all([api("/assets?" + params), api("/assets/stats")]);
  if (req !== listRequest || !document.getElementById("asset-rows")) return; // đã có yêu cầu mới hơn

  if (seesAll()) document.getElementById("fleet").innerHTML = renderFleet(s);

  const hasFilter = listState.q || listState.status;
  document.getElementById("asset-rows").innerHTML = data.items.map(a => `
    <tr class="clickable" data-href="#/assets/${a.id}">
      <td><a class="tape" href="#/assets/${a.id}">${esc(a.asset_tag)}</a></td>
      <td class="wrap"><div class="cell-name">${esc(a.name)}</div>${subline(a) ? `<div class="cell-sub">${esc(subline(a))}</div>` : ""}</td>
      <td class="mono muted">${a.serial_number ? esc(a.serial_number) : "Chưa có"}</td>
      <td>${led(a.status)}</td>
      <td>${holder(a)}</td>
    </tr>`).join("") ||
    emptyRow(5, hasFilter ? "Không có tài sản nào khớp bộ lọc."
      : can("asset.write") ? 'Chưa có tài sản nào. Bấm "+ Thêm tài sản" để nhập thiết bị đầu tiên.'
      : seesAll() ? "Chưa có tài sản nào."
      : me.employee ? "Bạn chưa được giao tài sản nào."
      : "Tài khoản của bạn chưa được nối với hồ sơ nhân viên nên chưa có tài sản để hiện. Hãy nhờ quản trị hệ thống nối giúp.");

  const pages = Math.max(1, Math.ceil(data.total / data.size));
  const from = data.total ? (data.page - 1) * data.size + 1 : 0;
  const to = (data.page - 1) * data.size + data.items.length;
  const foot = document.getElementById("asset-foot");
  foot.innerHTML = `
    <span>Hiển thị ${from}-${to} trong ${data.total}</span>
    <div class="pager">
      <button class="btn btn-sm" id="prev" ${data.page <= 1 ? "disabled" : ""}>Trang trước</button>
      <span>Trang ${data.page}/${pages}</span>
      <button class="btn btn-sm" id="next" ${data.page >= pages ? "disabled" : ""}>Trang sau</button>
    </div>`;
  foot.querySelector("#prev").onclick = () => { listState.page--; refreshAssets().catch(showError); };
  foot.querySelector("#next").onclick = () => { listState.page++; refreshAssets().catch(showError); };
}

// ===================== Tài sản: thêm / sửa =====================
async function viewAssetForm(id) {
  const [categories, models, asset] = await Promise.all([
    api("/categories"),
    api("/asset-models"),  // các model đã có kèm hãng, dùng để gợi ý
    id ? api(`/assets/${id}`) : null,
  ]);
  const makers = [...new Set(models.map(m => m.manufacturer.name))];
  const sameText = (x, y) => x.trim().toLowerCase() === y.trim().toLowerCase();
  const a = asset || {};
  const field = (name, label, attrs = "") =>
    `<label for="f-${name}"><span>${label}</span><input id="f-${name}" name="${name}" value="${esc(a[name] ?? "")}" ${attrs}></label>`;
  const backHref = id ? `#/assets/${id}` : "#/assets";

  $app.innerHTML = `
    <div>
      <a class="back" href="${backHref}">← ${id ? esc(a.asset_tag) : "Tài sản"}</a>
      <h1>${id ? "Sửa thông tin tài sản" : "Thêm tài sản"}</h1>
    </div>
    <form id="asset-form" class="panel" novalidate>
      <div class="form-grid">
        ${field("name", 'Tên tài sản <span class="req">*</span>', 'required maxlength="200" placeholder="VD: Laptop Dell Latitude 5420"')}
        ${field("asset_tag", "Mã tài sản", `maxlength="50" placeholder="${id ? "Để trống thì giữ mã hiện tại" : "Để trống thì hệ thống tự tạo, ví dụ TS-000001"}"`)}
        ${field("manufacturer", "Hãng sản xuất", 'maxlength="100" placeholder="VD: Dell" list="dl-makers" autocomplete="off"')}
        ${field("model", "Model", 'maxlength="100" placeholder="VD: Latitude 5420" list="dl-models" autocomplete="off"')}
        <datalist id="dl-makers">${makers.map(n => `<option value="${esc(n)}"></option>`).join("")}</datalist>
        <datalist id="dl-models"></datalist>
        <label for="f-category"><span>Danh mục</span>
          <select id="f-category" name="category_id">
            <option value="">Chọn danh mục</option>
            ${categories.map(c => `<option value="${c.id}" ${c.id === a.category_id ? "selected" : ""}>${esc(c.name)}</option>`).join("")}
          </select>
          <small class="field-hint" id="category-hint"></small>
        </label>
        ${field("serial_number", "Serial", 'maxlength="100"')}
        <label class="full" for="f-notes"><span>Ghi chú</span><textarea id="f-notes" name="notes">${esc(a.notes ?? "")}</textarea></label>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary">${id ? "Lưu thay đổi" : "Thêm tài sản"}</button>
        <a class="btn" href="${backHref}">Hủy</a>
      </div>
    </form>`;

  const form = $app.querySelector("#asset-form");
  watchFieldErrors(form);

  // Gợi ý model: đã gõ một hãng có sẵn thì chỉ gợi ý model của hãng đó
  const fillModelHints = () => {
    const maker = form.manufacturer.value;
    const ofMaker = models.filter(m => sameText(m.manufacturer.name, maker));
    $app.querySelector("#dl-models").innerHTML = (ofMaker.length ? ofMaker : models)
      .map(m => `<option value="${esc(m.name)}">${esc(m.manufacturer.name)}</option>`).join("");
  };
  fillModelHints();

  // Danh mục thuộc về model, không thuộc từng tài sản: ô Danh mục đi theo hãng + model đang nhập
  const knownModel = () => models.find(m =>
    sameText(m.manufacturer.name, form.manufacturer.value) && sameText(m.name, form.model.value));
  const categorySelect = form.category_id;
  const categoryHint = $app.querySelector("#category-hint");
  let lastKnownId;  // undefined = lần chạy đầu, giữ giá trị form đã điền sẵn
  const syncCategory = () => {
    const maker = form.manufacturer.value.trim(), model = form.model.value.trim();
    const known = knownModel();
    const knownId = known?.id ?? null;
    categorySelect.disabled = !(maker && model);
    if (categorySelect.disabled) categorySelect.value = "";
    // Vừa khớp sang một model đã có (hoặc rời khỏi nó) thì lấy danh mục của model đó;
    // đang gõ một model mới thì giữ lựa chọn của người dùng
    else if (lastKnownId !== undefined && knownId !== lastKnownId) categorySelect.value = known?.category_id ?? "";
    lastKnownId = knownId;
    clearFieldError(categorySelect);
    categoryHint.textContent = categorySelect.disabled ? "Danh mục đi theo model. Nhập hãng và model trước."
      : known?.category ? `Model này đang thuộc danh mục ${known.category.name}. Đổi ở đây là đổi cho mọi tài sản cùng model.`
      : "Danh mục chọn ở đây áp dụng cho mọi tài sản cùng model.";
  };
  syncCategory();

  form.manufacturer.addEventListener("input", () => { fillModelHints(); syncCategory(); });
  form.model.addEventListener("input", syncCategory);
  // Chọn một model đã có mà chưa nhập hãng thì điền hãng giúp (khi model đó chỉ thuộc một hãng)
  form.model.addEventListener("change", () => {
    const found = models.filter(m => sameText(m.name, form.model.value));
    if (found.length === 1 && !form.manufacturer.value.trim()) {
      form.manufacturer.value = found[0].manufacturer.name;
      clearFieldError(form.manufacturer);
      fillModelHints();
    }
    syncCategory();
  });

  form.onsubmit = async e => {
    e.preventDefault();
    if (!checkFields(form, [{ name: "name", label: "Tên tài sản", required: true }])) return;
    // Cùng quy tắc với server (_resolve_model): hãng chỉ lưu được thông qua model
    const maker = form.manufacturer.value.trim(), model = form.model.value.trim();
    if (!maker !== !model) {
      markInvalid(maker ? form.model : form.manufacturer,
        "Hãng sản xuất và model đi cùng nhau: nhập cả hai hoặc để trống cả hai.", true);
      return;
    }
    const body = formData(form);
    body.category_id = body.category_id ? Number(body.category_id) : null;
    // Đổi danh mục của một model đã có là đổi cho mọi tài sản cùng model, nên hỏi lại
    const known = knownModel();
    if (known?.category_id && body.category_id && body.category_id !== known.category_id) {
      const next = categories.find(c => c.id === body.category_id);
      if (!confirm(`Đổi danh mục của model ${known.manufacturer.name} ${known.name} từ "${known.category.name}" sang "${next.name}"? Thay đổi áp dụng cho mọi tài sản cùng model.`)) return;
    }
    try {
      const saved = await api(id ? `/assets/${id}` : "/assets", { method: id ? "PUT" : "POST", body });
      toast(id ? "Đã lưu thay đổi" : `Đã thêm ${saved.asset_tag}`);
      location.hash = `#/assets/${saved.id}`;
    } catch (err) {
      showFormError(form, err);
    }
  };
}

// ===================== Tài sản: chi tiết + cấp phát / thu hồi =====================
function statusChangeForm(a) {
  const options = ["ready", "maintenance", "broken", "archived"].filter(s => s !== a.status);
  return `
    <form data-action="status" class="inline-form">
      <label for="act-status"><span>Đổi trạng thái</span><select id="act-status" name="status">${statusOptions(options)}</select></label>
      <label for="act-status-note"><span>Ghi chú</span><input id="act-status-note" name="note" placeholder="Không bắt buộc"></label>
      <button class="btn">Đổi trạng thái</button>
    </form>`;
}

// Chỉ hiện thao tác mà vai trò đang đăng nhập được làm. Trả về "" nếu không có gì để hiện.
function actionPanel(a, employees, locations) {
  const canCustody = can("asset.custody");  // cấp phát, thu hồi
  const canStatus = can("asset.status");    // đổi trạng thái, thanh lý
  if (!canCustody && !canStatus) return "";
  if (a.status === "archived") {
    return `<p class="note-hint">Tài sản đã thanh lý, không còn thao tác nào.</p>`;
  }
  if (a.status === "deployed") {
    if (!canCustody) return "";
    return `
      <form data-action="checkin" class="inline-form">
        <label for="act-checkin"><span>Trạng thái sau khi thu hồi</span>
          <select id="act-checkin" name="status">${statusOptions(["ready", "maintenance", "broken"])}</select>
        </label>
        <label for="act-checkin-note"><span>Ghi chú</span><input id="act-checkin-note" name="note" placeholder="VD: Nhân viên nghỉ việc"></label>
        <button class="btn btn-primary">Thu hồi</button>
      </form>`;
  }
  if (a.status !== "ready") {
    return canStatus ? statusChangeForm(a)
      : `<p class="note-hint">Tài sản đang ở trạng thái ${esc(STATUS[a.status])} nên chưa cấp phát được. Tài khoản của bạn không có quyền đổi trạng thái.</p>`;
  }

  let checkout = "";
  if (canCustody) {
    checkout = (!employees.length && !locations.length)
      ? `<p class="note-hint">Chưa có nhân viên hay vị trí nào để cấp phát.
           <a href="#/employees">Thêm nhân viên</a>${can("catalog.manage") ? ` hoặc <a href="#/locations">thêm vị trí</a>` : ""} trước.</p>`
      : `
      <form data-action="checkout" class="inline-form">
        <label for="act-target"><span>Cấp phát cho</span>
          <select id="act-target" name="target" required>
            <option value="">Chọn nhân viên hoặc vị trí</option>
            ${employees.length ? `<optgroup label="Nhân viên">
              ${employees.map(e => `<option value="e:${e.id}">${esc(e.full_name)} (${esc(e.code)})</option>`).join("")}
            </optgroup>` : ""}
            ${locations.length ? `<optgroup label="Vị trí">
              ${locations.map(l => `<option value="l:${l.id}">${esc(l.name)}</option>`).join("")}
            </optgroup>` : ""}
          </select>
        </label>
        <label for="act-target-note"><span>Ghi chú</span><input id="act-target-note" name="note" placeholder="Không bắt buộc"></label>
        <button class="btn btn-primary">Cấp phát</button>
      </form>`;
  }
  return [checkout, canStatus ? statusChangeForm(a) : ""].filter(Boolean).join(`<hr class="divider">`);
}

function logItem(h) {
  const who = h.employee ? h.employee.full_name : h.location ? h.location.name : "";
  const title = {
    create: "Thêm tài sản",
    update: "Cập nhật thông tin",
    checkout: who ? `Cấp phát cho ${who}` : "Cấp phát",
    checkin: who ? `Thu hồi từ ${who}` : "Thu hồi",
    status: "Đổi trạng thái",
    agent_link: "Gắn với máy do agent báo cáo",
    agent_unlink: "Bỏ gắn agent",
  }[h.action] || h.action;
  const statuses = h.to_status
    ? `<div class="log-status">${h.from_status ? `${led(h.from_status)}<span aria-hidden="true">→</span>` : ""}${led(h.to_status)}</div>`
    : "";
  return `
    <li>
      <time datetime="${esc(h.created_at)}">${fmtLogTime(h.created_at)}</time>
      <div>
        <div class="log-title">${esc(title)}</div>
        ${statuses}
        ${h.note && h.action !== "update" ? `<div class="log-note">${esc(h.note)}</div>` : ""}
        <div class="log-actor">Thực hiện bởi ${h.actor ? `${esc(h.actor.full_name)} (${esc(h.actor.username)})` : "không rõ"}</div>
      </div>
    </li>`;
}

// Hồ sơ kỹ thuật do agent báo cáo (CPU, RAM, ổ đĩa, mạng, phần mềm).
// inv = null: tài khoản không được xem (vai trò Nhân viên) nên không vẽ gì.
function inventoryPanel(a, inv) {
  if (!inv) return "";
  if (!inv.last_seen) {
    return `<section class="panel"><h2>Hồ sơ kỹ thuật</h2>
      <p class="note-hint">Chưa có dữ liệu: chưa có agent nào báo cáo cho tài sản này.</p></section>`;
  }
  const hw = inv.hardware || {};
  const row = (label, html) => html ? `<dt>${label}</dt><dd>${html}</dd>` : "";
  const list = items => items.length ? `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>` : "";
  const gb = mb => `${Math.round(mb / 102.4) / 10} GB`;
  const cpu = [hw.cpu_model, hw.cpu_cores ? `${hw.cpu_cores} nhân` : "", hw.cpu_threads ? `${hw.cpu_threads} luồng` : ""].filter(Boolean);
  const disks = (hw.disks || []).map(d => esc([
    d.model || d.name, d.size_gb ? `${d.size_gb} GB` : "", (d.kind || "").toUpperCase(),
  ].filter(Boolean).join(" · ")));
  const nics = (hw.nics || []).map(n =>
    `${esc(n.name || "Card mạng")} <span class="mono muted">${esc(n.mac || "")}</span>${n.ipv4?.length ? ` · <span class="mono">${esc(n.ipv4.join(", "))}</span>` : ""}`);
  const reported = [hw.manufacturer, hw.model].filter(Boolean).join(" ");
  const source = inv.agent
    ? `Agent trên máy ${esc(inv.agent.hostname || "số " + inv.agent.id)} báo cáo lúc ${esc(fmtDate(inv.last_seen))}${MATCHED_BY[inv.agent.matched_by] ? ` · ${MATCHED_BY[inv.agent.matched_by]}` : ""}`
    : `Báo cáo cuối lúc ${esc(fmtDate(inv.last_seen))}. Hiện không còn agent nào báo cáo cho tài sản này.`;
  return `
    <section class="panel panel-gap">
      <div>
        <h2>Hồ sơ kỹ thuật</h2>
        <p class="note-hint">${source}</p>
      </div>
      <dl class="info">
        ${row("Tên máy", inv.hostname ? `<span class="mono">${esc(inv.hostname)}</span>` : "")}
        ${row("Hệ điều hành", esc([inv.os_name, inv.os_version].filter(Boolean).join(" ")))}
        ${row("CPU", esc(cpu.join(" · ")))}
        ${row("RAM", hw.memory_mb ? gb(hw.memory_mb) : "")}
        ${row("Ổ đĩa", list(disks))}
        ${row("Card mạng", list(nics))}
        ${row("Địa chỉ IP", inv.ip_address ? `<span class="mono">${esc(inv.ip_address)}</span>` : "")}
        ${row("BIOS", esc(hw.bios_version || ""))}
        ${row("Máy tự báo", esc(reported) + (hw.serial_number ? `${reported ? " · " : ""}<span class="mono">S/N ${esc(hw.serial_number)}</span>` : ""))}
      </dl>
      ${inv.serial_differs ? `<p class="warn">Serial máy tự báo (${esc(hw.serial_number)}) khác serial đang ghi cho tài sản (${esc(a.serial_number)}). Kiểm tra lại: có thể agent đã được gắn nhầm máy, hoặc serial nhập tay bị sai.</p>` : ""}
      ${inv.software.length ? `
      <details class="software">
        <summary>Phần mềm đã cài (${inv.software.length})</summary>
        <input type="search" id="sw-filter" placeholder="Lọc theo tên phần mềm" aria-label="Lọc phần mềm">
        <div class="table-scroll"><table>
          <thead><tr><th>Tên</th><th>Phiên bản</th></tr></thead>
          <tbody id="sw-rows">${inv.software.map(s =>
            `<tr><td>${esc(s.name)}</td><td class="mono muted">${esc(s.version || "Không rõ")}</td></tr>`).join("")}</tbody>
        </table></div>
      </details>` : `<p class="note-hint">Agent chưa báo phần mềm nào.</p>`}
    </section>`;
}

async function viewAssetDetail(id) {
  // Chỉ gọi những API mà tài khoản được phép: vai trò Nhân viên không xem được lịch sử và
  // hồ sơ kỹ thuật, và danh sách nhân viên / vị trí chỉ cần khi được cấp phát
  const [a, inv, history, employees, locations] = await Promise.all([
    api(`/assets/${id}`),
    seesAll() ? api(`/assets/${id}/inventory`) : null,
    seesAll() ? api(`/assets/${id}/history`) : null,
    can("asset.custody") ? api("/employees") : [],
    can("asset.custody") ? api("/locations") : [],
  ]);
  const actions = actionPanel(a, employees, locations);

  $app.innerHTML = `
    <div>
      <a class="back" href="#/assets">← ${seesAll() ? "Tài sản" : "Tài sản của tôi"}</a>
      <div class="asset-head">
        <div class="asset-title">
          <span class="tape tape-xl">${esc(a.asset_tag)}</span>
          <h1>${esc(a.name)}</h1>
          ${led(a.status)}
        </div>
        ${a.status !== "archived" && can("asset.write") ? `<a class="btn" href="#/assets/${a.id}/edit">Sửa thông tin</a>` : ""}
      </div>
    </div>
    <div class="detail-grid">
      <div class="stack">
        <section class="panel">
          <h2>Thông tin</h2>
          <dl class="info">
            <dt>Đang giao cho</dt><dd>${holder(a)}</dd>
            <dt>Danh mục</dt><dd>${a.category ? esc(a.category.name) : "Chưa phân loại"}</dd>
            <dt>Serial</dt><dd class="mono">${a.serial_number ? esc(a.serial_number) : "Chưa có"}</dd>
            <dt>Hãng / Model</dt><dd>${esc([a.manufacturer, a.model].filter(Boolean).join(" / ") || "Chưa có")}</dd>
            <dt>Ghi chú</dt><dd>${a.notes ? esc(a.notes) : "Không có"}</dd>
            <dt>Ngày thêm</dt><dd class="mono">${fmtDate(a.created_at)}</dd>
          </dl>
        </section>
        ${actions ? `<section class="panel"><h2>Thao tác</h2>${actions}</section>` : ""}
        ${inventoryPanel(a, inv)}
        ${history ? `<section class="panel">
          <h2>Nhật ký lưu ký</h2>
          ${history.length ? `<ol class="log">${history.map(logItem).join("")}</ol>`
                           : `<p class="note-hint">Chưa có lịch sử.</p>`}
        </section>` : ""}
      </div>
      <aside class="label-side">
        <h2>Tem tài sản</h2>
        <section class="asset-label" aria-label="Xem trước tem tài sản">
          <div class="label-band">Tài sản công ty · Phòng IT</div>
          <div class="label-body">
            <img src="/api/assets/${a.id}/qr" alt="Mã QR mở trang ${esc(a.asset_tag)}">
            <div>
              <div class="label-tag">${esc(a.asset_tag)}</div>
              <div class="label-name">${esc(a.name)}</div>
              ${a.serial_number ? `<div class="label-serial">S/N ${esc(a.serial_number)}</div>` : ""}
            </div>
          </div>
          <div class="label-foot">Không bóc tem · Mất tem báo Phòng IT</div>
        </section>
        <button class="btn" id="print">In tem</button>
        <p class="label-hint">Quét QR bằng điện thoại để mở trang này.</p>
      </aside>
    </div>`;

  $app.querySelector("#print").onclick = () => window.print();
  const swFilter = $app.querySelector("#sw-filter");
  if (swFilter) swFilter.oninput = () => {
    const q = swFilter.value.trim().toLowerCase();
    $app.querySelectorAll("#sw-rows tr").forEach(tr => (tr.hidden = !!q && !tr.textContent.toLowerCase().includes(q)));
  };
  $app.querySelectorAll("form[data-action]").forEach(form => {
    form.onsubmit = async e => {
      e.preventDefault();
      const action = form.dataset.action;
      const f = formData(form);
      let body;
      if (action === "checkout") {
        const [kind, targetId] = f.target.split(":");
        body = { note: f.note, [kind === "e" ? "employee_id" : "location_id"]: Number(targetId) };
      } else {
        body = { status: f.status, note: f.note };
        if (action === "status" && f.status === "archived" &&
            !confirm(`Chuyển ${a.asset_tag} sang "Đã thanh lý"? Sau bước này không đổi lại được trạng thái.`)) return;
      }
      try {
        const u = await api(`/assets/${id}/${action}`, { method: "POST", body });
        const receiver = u.assigned_employee?.full_name || u.assigned_location?.name;
        toast({
          checkout: `Đã cấp phát ${u.asset_tag} cho ${receiver}`,
          checkin: `Đã thu hồi ${u.asset_tag}. Trạng thái mới: ${STATUS[u.status]}`,
          status: `Đã chuyển ${u.asset_tag} sang ${STATUS[u.status]}`,
        }[action]);
        viewAssetDetail(id).catch(showError);
      } catch (err) {
        showError(err);
      }
    };
  });
}

// ===================== Danh mục / Vị trí / Nhân viên (danh sách + thêm/sửa) =====================
const SIMPLE = {
  categories: {
    title: "Danh mục", path: "/categories", perm: "catalog.manage",
    noun: "danh mục", labelField: "name",
    fields: [{ name: "name", label: "Tên danh mục", required: true, max: 100 }],
  },
  locations: {
    title: "Vị trí", path: "/locations", perm: "catalog.manage",
    noun: "vị trí", labelField: "name",
    fields: [{ name: "name", label: "Tên vị trí / phòng ban", required: true, max: 150 }],
  },
  employees: {
    title: "Nhân viên", path: "/employees", perm: "employee.manage",
    noun: "nhân viên", labelField: "full_name",
    link: "#/employees/", linkField: "full_name",
    fields: [
      { name: "code", label: "Mã NV", required: true, max: 50, mono: true },
      { name: "full_name", label: "Họ tên", required: true, max: 150, validate: fullNameRule },
      { name: "email", label: "Email", max: 150, inputmode: "email", validate: emailRule },
      { name: "department", label: "Phòng ban", max: 100 },
    ],
  },
};

async function viewSimple(cfg) {
  const items = await api(cfg.path);
  const editable = can(cfg.perm);  // không có quyền sửa thì chỉ hiện bảng
  let editingId = null;

  $app.innerHTML = `
    <div class="page-head">
      <h1>${cfg.title}</h1>
    </div>
    ${editable ? `<form id="sform" class="panel inline-form" novalidate>
      ${cfg.fields.map(f => `
        <label for="s-${f.name}"><span>${f.label}${f.required ? ' <span class="req">*</span>' : ""}</span>
          <input id="s-${f.name}" name="${f.name}" maxlength="${f.max}" ${f.required ? "required" : ""} ${f.inputmode ? `inputmode="${f.inputmode}" autocomplete="off"` : ""}>
        </label>`).join("")}
      <button class="btn btn-primary" id="ssave">Thêm</button>
      <button type="button" class="btn" id="scancel" hidden>Hủy</button>
    </form>` : ""}
    <section class="panel table-panel">
      <div class="table-scroll"><table>
        <thead><tr>${cfg.fields.map(f => `<th>${f.label}</th>`).join("")}${editable ? "<th></th>" : ""}</tr></thead>
        <tbody>
          ${items.map(it => `
            <tr>
              ${cfg.fields.map(f => `<td>${f.name === cfg.linkField
                ? `<a class="holder" href="${cfg.link}${it.id}"><span class="tile">${esc(initials(it[f.name]))}</span><span class="holder-name">${esc(it[f.name])}</span></a>`
                : `<span class="${f.mono ? "mono" : f.name === "name" ? "" : "muted"}">${it[f.name] ? esc(it[f.name]) : "Chưa có"}</span>`}</td>`).join("")}
              ${editable ? `<td class="right"><button class="btn btn-sm" data-edit="${it.id}">Sửa</button></td>` : ""}
            </tr>`).join("") || emptyRow(cfg.fields.length + (editable ? 1 : 0), `Chưa có ${cfg.noun} nào.`)}
        </tbody>
      </table></div>
    </section>`;

  if (!editable) return;
  const form = $app.querySelector("#sform");
  const saveBtn = $app.querySelector("#ssave");
  const cancelBtn = $app.querySelector("#scancel");
  const resetForm = () => {
    editingId = null;
    form.reset();
    form.querySelectorAll("[aria-invalid]").forEach(clearFieldError);
    saveBtn.textContent = "Thêm";
    cancelBtn.hidden = true;
  };
  watchFieldErrors(form);

  cancelBtn.onclick = resetForm;
  $app.querySelector("tbody").onclick = e => {
    const btn = e.target.closest("[data-edit]");
    if (!btn) return;
    const it = items.find(x => x.id === Number(btn.dataset.edit));
    editingId = it.id;
    cfg.fields.forEach(f => (form.elements[f.name].value = it[f.name] ?? ""));
    saveBtn.textContent = "Lưu";
    cancelBtn.hidden = false;
    form.elements[cfg.fields[0].name].focus();
  };
  form.onsubmit = async e => {
    e.preventDefault();
    if (!checkFields(form, cfg.fields)) return;
    const body = formData(form);
    const label = (body[cfg.labelField] || "").trim();
    try {
      await api(editingId ? `${cfg.path}/${editingId}` : cfg.path, {
        method: editingId ? "PUT" : "POST",
        body,
      });
      toast(`${editingId ? "Đã lưu" : "Đã thêm"} ${cfg.noun} ${label}`);
      viewSimple(cfg).catch(showError);
    } catch (err) {
      showFormError(form, err);
    }
  };
}

// ===================== Nhân viên: tài sản đang giữ =====================
async function viewEmployee(id) {
  const [emp, assets] = await Promise.all([
    api(`/employees/${id}`), api(`/employees/${id}/assets`),
  ]);
  $app.innerHTML = `
    <div>
      <a class="back" href="#/employees">← Nhân viên</a>
      <div class="profile">
        <span class="tile tile-lg">${esc(initials(emp.full_name))}</span>
        <div>
          <h1>${esc(emp.full_name)}</h1>
          <p class="subtitle muted">${esc([emp.code, emp.department, emp.email].filter(Boolean).join(" · "))}</p>
        </div>
      </div>
    </div>
    <section class="panel table-panel">
      <div class="toolbar"><h2>Đang giữ ${assets.length} tài sản</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Mã tài sản</th><th>Tài sản</th><th>Serial</th><th>Trạng thái</th></tr></thead>
        <tbody>
          ${assets.map(a => `
            <tr class="clickable" data-href="#/assets/${a.id}">
              <td><a class="tape" href="#/assets/${a.id}">${esc(a.asset_tag)}</a></td>
              <td class="wrap"><div class="cell-name">${esc(a.name)}</div>${subline(a) ? `<div class="cell-sub">${esc(subline(a))}</div>` : ""}</td>
              <td class="mono muted">${a.serial_number ? esc(a.serial_number) : "Chưa có"}</td>
              <td>${led(a.status)}</td>
            </tr>`).join("") || emptyRow(4, "Nhân viên này chưa giữ tài sản nào.")}
        </tbody>
      </table></div>
    </section>`;
  bindRowLinks($app.querySelector("tbody"));
}

// ===================== Đăng nhập / đăng ký =====================
let authScreen = false;  // đang hiện màn đăng nhập hoặc đăng ký

// Thanh trên: ẩn menu khi chưa đăng nhập, ẩn mục không có quyền, hiện tài khoản đang dùng
function renderChrome() {
  document.querySelector(".nav").hidden = !me;
  document.querySelectorAll("[data-perm]").forEach(el => (el.hidden = !can(el.dataset.perm)));
  const box = document.getElementById("userbox");
  box.hidden = !me;
  box.open = false;
  box.innerHTML = me ? `
    <summary aria-label="Menu tài khoản" title="${esc(me.full_name)} · ${ROLES[me.role]}">
      <span class="tile">${esc(initials(me.full_name))}</span>
      <span class="userbox-text">
        <span class="userbox-name">${esc(me.full_name)}</span>
        <span class="role">${ROLES[me.role]}</span>
      </span>
    </summary>
    <div class="usermenu-list">
      <a href="#/settings">Cài đặt</a>
      <hr>
      <button type="button" id="logout">Đăng xuất</button>
    </div>` : "";
  if (me) box.querySelector("#logout").onclick = logout;
}

async function logout() {
  try { await api("/auth/logout", { method: "POST" }); } catch (err) { showError(err); return; }
  requireLogin();
}

// Gọi khi server trả 401. Không đổi location.hash, nên đăng nhập xong sẽ quay lại đúng
// trang đang mở dở (ví dụ trang tài sản vừa quét từ tem QR).
function requireLogin() {
  if (authScreen) return;
  me = null;
  renderChrome();
  viewAuth("login");
}

function viewAuth(mode, username = "", notice = "") {
  authScreen = true;
  const isLogin = mode === "login";
  const req = ' <span class="req">*</span>';
  $app.innerHTML = `
    <div class="auth">
      <div>
        <h1>${isLogin ? "Đăng nhập" : "Đăng ký tài khoản"}</h1>
        ${isLogin ? "" : `<p class="subtitle">Tài khoản mới cần admin duyệt rồi mới đăng nhập được.</p>`}
      </div>
      <form id="auth-form" class="panel auth-form" novalidate>
        ${notice ? `<p class="note-hint">${esc(notice)}</p>` : ""}
        ${isLogin ? "" : `<label for="a-full_name"><span>Họ tên${req}</span><input id="a-full_name" name="full_name" maxlength="150" autocomplete="name"></label>`}
        <label for="a-username"><span>Tên đăng nhập${isLogin ? "" : req}</span>
          <input id="a-username" name="username" maxlength="50" autocomplete="username" autocapitalize="none" spellcheck="false" value="${esc(username)}">
        </label>
        <label for="a-password"><span>Mật khẩu${isLogin ? "" : req}</span>
          <input id="a-password" name="password" type="password" maxlength="128" autocomplete="${isLogin ? "current-password" : "new-password"}">
        </label>
        ${isLogin ? "" : `
        <label for="a-password2"><span>Nhập lại mật khẩu${req}</span>
          <input id="a-password2" name="password2" type="password" maxlength="128" autocomplete="new-password">
        </label>
        <label for="a-role"><span>Vai trò</span>
          <select id="a-role" name="role">
            ${SIGNUP_ROLES.map(r => `<option value="${r}">${ROLES[r]}</option>`).join("")}
          </select>
        </label>`}
        <button class="btn btn-primary">${isLogin ? "Đăng nhập" : "Đăng ký"}</button>
      </form>
      <p class="muted">${isLogin ? "Chưa có tài khoản?" : "Đã có tài khoản?"}
        <button type="button" class="linklike" id="auth-switch">${isLogin ? "Đăng ký" : "Đăng nhập"}</button></p>
    </div>`;

  const form = $app.querySelector("#auth-form");
  watchFieldErrors(form);
  $app.querySelector("#auth-switch").onclick = () => viewAuth(isLogin ? "register" : "login");
  form.elements[isLogin ? (username ? "password" : "username") : "full_name"].focus();

  form.onsubmit = async e => {
    e.preventDefault();
    const rules = isLogin
      ? [{ name: "username", label: "Tên đăng nhập", required: true },
         { name: "password", label: "Mật khẩu", required: true }]
      : [{ name: "full_name", label: "Họ tên", required: true, validate: fullNameRule },
         { name: "username", label: "Tên đăng nhập", required: true, validate: usernameRule },
         { name: "password", label: "Mật khẩu", required: true, validate: passwordRule },
         { name: "password2", label: "lại mật khẩu", required: true,
           validate: v => v === form.password.value.trim() ? null : "Hai lần nhập mật khẩu chưa khớp." }];
    if (!checkFields(form, rules)) return;
    const f = formData(form);
    try {
      if (isLogin) {
        me = await api("/auth/login", { method: "POST", body: { username: f.username, password: f.password } });
        authScreen = false;
        document.getElementById("toast").hidden = true;  // bỏ thông báo lỗi đăng nhập còn sót
        renderChrome();
        refreshPendingCount();
        router();
      } else {
        const u = await api("/auth/register", {
          method: "POST",
          body: { full_name: f.full_name, username: f.username, password: f.password, role: f.role },
        });
        viewAuth("login", u.username, "Đã gửi yêu cầu đăng ký. Bạn đăng nhập được sau khi admin duyệt.");
      }
    } catch (err) {
      showFormError(form, err);
    }
  };
}

// ===================== Cài đặt: thông tin, mật khẩu, giao diện =====================
function viewSettings() {
  $app.innerHTML = `
    <div class="page-head">
      <h1>Cài đặt</h1>
    </div>
    <div class="settings">
      <form id="profile-form" class="panel" novalidate>
        <h2>Thông tin tài khoản</h2>
        <div class="form-grid">
          <label for="p-full_name"><span>Họ tên <span class="req">*</span></span>
            <input id="p-full_name" name="full_name" maxlength="150" autocomplete="name" value="${esc(me.full_name)}">
          </label>
          <label for="p-username"><span>Tên đăng nhập</span>
            <input id="p-username" class="mono" value="${esc(me.username)}" disabled>
          </label>
          <label for="p-role"><span>Vai trò</span>
            <input id="p-role" value="${esc(ROLES[me.role] || me.role)}" disabled>
          </label>
          <label for="p-employee"><span>Hồ sơ nhân viên</span>
            <input id="p-employee" value="${me.employee ? esc(`${me.employee.code} · ${me.employee.full_name}`) : "Chưa nối"}" disabled>
          </label>
        </div>
        <small class="field-hint">Tên đăng nhập không đổi được. Vai trò và hồ sơ nhân viên do quản trị hệ thống đặt.</small>
        <div class="form-actions"><button class="btn btn-primary">Lưu thông tin</button></div>
      </form>

      <form id="password-form" class="panel" novalidate>
        <h2>Đổi mật khẩu</h2>
        <div class="form-grid">
          <label class="full" for="p-current"><span>Mật khẩu hiện tại <span class="req">*</span></span>
            <input id="p-current" name="current_password" type="password" maxlength="128" autocomplete="current-password">
          </label>
          <label for="p-new"><span>Mật khẩu mới <span class="req">*</span></span>
            <input id="p-new" name="new_password" type="password" maxlength="128" autocomplete="new-password">
          </label>
          <label for="p-new2"><span>Nhập lại mật khẩu mới <span class="req">*</span></span>
            <input id="p-new2" name="new_password2" type="password" maxlength="128" autocomplete="new-password">
          </label>
        </div>
        <small class="field-hint">Đổi xong, các thiết bị khác đang đăng nhập tài khoản này sẽ bị đăng xuất.</small>
        <div class="form-actions"><button class="btn btn-primary">Đổi mật khẩu</button></div>
      </form>

      <section class="panel">
        <h2>Giao diện</h2>
        <div class="theme-switch" role="group" aria-label="Giao diện">
          <button type="button" data-theme-btn="system">Theo hệ thống</button>
          <button type="button" data-theme-btn="light">Sáng</button>
          <button type="button" data-theme-btn="dark">Tối</button>
        </div>
        <small class="field-hint">Mặc định theo cài đặt sáng/tối của máy. Lựa chọn được lưu trên trình duyệt này.</small>
      </section>
    </div>`;
  applyTheme(getTheme());  // đánh dấu nút đang chọn

  const profile = $app.querySelector("#profile-form");
  watchFieldErrors(profile);
  profile.onsubmit = async e => {
    e.preventDefault();
    if (!checkFields(profile, [{ name: "full_name", label: "Họ tên", required: true, validate: fullNameRule }])) return;
    try {
      me = await api("/auth/me", { method: "PATCH", body: { full_name: profile.full_name.value } });
      profile.full_name.value = me.full_name;
      renderChrome();
      toast("Đã lưu thông tin");
    } catch (err) {
      showFormError(profile, err);
    }
  };

  const pw = $app.querySelector("#password-form");
  watchFieldErrors(pw);
  pw.onsubmit = async e => {
    e.preventDefault();
    if (!checkFields(pw, [
      { name: "current_password", label: "mật khẩu hiện tại", required: true },
      { name: "new_password", label: "mật khẩu mới", required: true, validate: passwordRule },
      { name: "new_password2", label: "lại mật khẩu mới", required: true,
        validate: v => v === pw.new_password.value.trim() ? null : "Hai lần nhập mật khẩu mới chưa khớp." },
    ])) return;
    try {
      await api("/auth/password", {
        method: "POST",
        body: { current_password: pw.current_password.value, new_password: pw.new_password.value },
      });
      pw.reset();
      toast("Đã đổi mật khẩu");
    } catch (err) {
      showFormError(pw, err);
    }
  };
}

// ===================== Tài khoản (chỉ admin) =====================
// Số yêu cầu chờ duyệt, hiện cạnh mục "Tài khoản" trên thanh trên
async function refreshPendingCount(users) {
  const el = document.getElementById("pending-count");
  if (!can("user.manage")) { el.hidden = true; return; }
  try { users = users || await api("/users"); } catch { return; }
  const n = users.filter(u => u.status === "pending").length;
  el.textContent = n;
  el.title = `${n} tài khoản chờ duyệt`;
  el.hidden = !n;
}

async function viewUsers() {
  const [users, employees, matrix] = await Promise.all([api("/users"), api("/employees"), api("/auth/roles")]);
  refreshPendingCount(users);
  const linked = new Map(users.filter(u => u.employee_id).map(u => [u.employee_id, u.id]));  // nhân viên → tài khoản đã nối
  const order = { pending: 0, active: 1, disabled: 2 };
  users.sort((a, b) => order[a.status] - order[b.status] || a.username.localeCompare(b.username));

  const actionsFor = u => {
    if (u.id === me.id) return "";
    const btn = (act, label, primary) => `<button class="btn btn-sm ${primary ? "btn-primary" : ""}" data-act="${act}" data-id="${u.id}">${label}</button>`;
    if (u.status === "pending") return btn("approve", "Duyệt", true) + btn("reject", "Từ chối");
    if (u.status === "active") return btn("lock", "Khóa");
    return btn("unlock", "Mở khóa") + btn("delete", "Xóa");
  };

  $app.innerHTML = `
    <div class="page-head">
      <h1>Tài khoản</h1>
    </div>
    <section class="panel table-panel">
      <div class="table-scroll"><table>
        <thead><tr><th>Họ tên</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Hồ sơ nhân viên</th><th>Trạng thái</th><th>Ngày đăng ký</th><th></th></tr></thead>
        <tbody>
          ${users.map(u => `
            <tr>
              <td><span class="holder"><span class="tile">${esc(initials(u.full_name))}</span>${esc(u.full_name)}${u.id === me.id ? '<span class="you">(bạn)</span>' : ""}</span></td>
              <td class="mono">${esc(u.username)}</td>
              <td>${u.id === me.id
                ? `<span class="role role-chip">${ROLES[u.role] || esc(u.role)}</span>`
                : `<select data-role-for="${u.id}" aria-label="Vai trò của ${esc(u.username)}">
                     ${ROLES[u.role] ? "" : `<option value="" selected disabled>Không hợp lệ: ${esc(u.role)}</option>`}
                     ${Object.keys(ROLES).map(r => `<option value="${r}" ${r === u.role ? "selected" : ""}>${ROLES[r]}</option>`).join("")}
                   </select>`}</td>
              <td><select data-employee-for="${u.id}" aria-label="Hồ sơ nhân viên của ${esc(u.username)}">
                    <option value="">Chưa nối</option>
                    ${employees.filter(e => !linked.has(e.id) || linked.get(e.id) === u.id).map(e =>
                      `<option value="${e.id}" ${e.id === u.employee_id ? "selected" : ""}>${esc(e.code)} · ${esc(e.full_name)}</option>`).join("")}
                  </select></td>
              <td><span class="led s-${USER_STATUS[u.status]?.[0] || "archived"}">${esc(USER_STATUS[u.status]?.[1] || u.status)}</span></td>
              <td class="mono muted">${esc(fmtDate(u.created_at))}</td>
              <td><div class="row-actions">${actionsFor(u)}</div></td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    </section>
    <section class="panel table-panel">
      <div class="toolbar"><h2>Bảng quyền theo vai trò</h2></div>
      <div class="table-scroll"><table class="matrix">
        <thead><tr><th>Quyền</th>${matrix.roles.map(r => `<th>${esc(r.label)}</th>`).join("")}</tr></thead>
        <tbody>
          ${matrix.permissions.map(p => `
            <tr>
              <td class="wrap">${esc(p.label)}</td>
              ${matrix.roles.map(r => p.roles.includes(r.code)
                ? `<td class="yes" aria-label="Có">●</td>` : `<td class="no" aria-label="Không">–</td>`).join("")}
            </tr>`).join("")}
        </tbody>
      </table></div>
      <p class="table-foot">Vai trò Nhân viên không có quyền nào ở trên: chỉ xem được tài sản đang giao cho hồ sơ nhân viên đã nối với tài khoản.</p>
    </section>`;

  const byId = id => users.find(u => u.id === Number(id));
  const reload = () => viewUsers().catch(showError);
  const tbody = $app.querySelector("tbody");

  tbody.onchange = async e => {
    const link = e.target.closest("[data-employee-for]");
    if (link) {  // nối hoặc bỏ nối tài khoản với hồ sơ nhân viên
      const u = byId(link.dataset.employeeFor);
      try {
        await api(`/users/${u.id}`, { method: "PATCH", body: { employee_id: link.value ? Number(link.value) : null } });
        toast(link.value ? `Đã nối ${u.username} với ${link.selectedOptions[0].textContent}` : `Đã bỏ nối hồ sơ nhân viên của ${u.username}`);
        if (u.id === me.id) { me = await api("/auth/me"); renderChrome(); }
      } catch (err) {
        showError(err);
      }
      reload();
      return;
    }
    const sel = e.target.closest("[data-role-for]");
    if (!sel) return;
    const u = byId(sel.dataset.roleFor);
    if (sel.value === "admin" &&
        !confirm(`Cấp vai trò Quản trị hệ thống cho ${u.username}? Vai trò này có toàn quyền, kể cả quản lý tài khoản.`)) {
      sel.value = u.role;
      return;
    }
    try {
      await api(`/users/${u.id}`, { method: "PATCH", body: { role: sel.value } });
      toast(`Đã đổi vai trò của ${u.username} thành ${ROLES[sel.value]}`);
    } catch (err) {
      showError(err);
    }
    reload();
  };

  tbody.onclick = async e => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const u = byId(btn.dataset.id);
    const act = btn.dataset.act;
    const ask = {
      reject: `Từ chối và xóa yêu cầu đăng ký của ${u.username}?`,
      lock: `Khóa tài khoản ${u.username}? Người này sẽ bị đăng xuất ngay.`,
      delete: `Xóa hẳn tài khoản ${u.username}? Không khôi phục lại được.`,
    }[act];
    if (ask && !confirm(ask)) return;
    try {
      if (act === "reject" || act === "delete") {
        await api(`/users/${u.id}`, { method: "DELETE" });
      } else {
        await api(`/users/${u.id}`, { method: "PATCH", body: { status: act === "lock" ? "disabled" : "active" } });
      }
      toast({
        approve: `Đã duyệt tài khoản ${u.username}`,
        reject: `Đã từ chối yêu cầu của ${u.username}`,
        lock: `Đã khóa tài khoản ${u.username}`,
        unlock: `Đã mở khóa tài khoản ${u.username}`,
        delete: `Đã xóa tài khoản ${u.username}`,
      }[act]);
    } catch (err) {
      showError(err);
    }
    reload();
  };
}

// ===================== Agent (Module 1: quét qua agent) =====================
// newCode: mã kết nạp vừa tạo. Server chỉ trả mã thật đúng một lần nên chỉ hiện ở lần vẽ này.
async function viewAgents(newCode = null) {
  const canManage = can("agent.manage"), canLink = can("agent.link"), canCreate = can("asset.write");
  const [agents, codes] = await Promise.all([api("/agents"), canManage ? api("/enrollment-codes") : []]);
  const pending = agents.filter(g => g.status === "active" && !g.asset);
  const linked = agents.filter(g => g.status === "active" && g.asset);
  const revoked = agents.filter(g => g.status === "revoked");
  const origin = location.origin;

  const machine = g => `
    <div class="cell-name mono">${esc(g.hostname || `Agent số ${g.id}`)}</div>
    <div class="cell-sub">${esc([[g.manufacturer, g.model].filter(Boolean).join(" "), g.os_name || PLATFORMS[g.platform] || g.platform].filter(Boolean).join(" · "))}</div>`;
  const seen = g => g.last_seen ? esc(fmtDate(g.last_seen)) : "Chưa báo cáo";
  const btn = (act, g, label, primary) =>
    `<button class="btn btn-sm ${primary ? "btn-primary" : ""}" data-act="${act}" data-id="${g.id}">${label}</button>`;
  const installSteps = code => `<pre class="codebox"><span class="c"># Linux, macOS (cần Python 3.8 trở lên; chạy bằng sudo để đọc được serial của máy)</span>
curl -fsSLo itam_agent.py ${esc(origin)}/api/agent/script
sudo python3 itam_agent.py enroll --server ${esc(origin)} --code ${esc(code)}
sudo python3 itam_agent.py run

<span class="c"># Windows (PowerShell mở bằng quyền Administrator, máy đã cài Python)</span>
Invoke-WebRequest ${esc(origin)}/api/agent/script -OutFile itam_agent.py
python itam_agent.py enroll --server ${esc(origin)} --code ${esc(code)}
python itam_agent.py run</pre>`;

  $app.innerHTML = `
    <div class="page-head">
      <h1>Agent</h1>
    </div>

    <section class="panel table-panel">
      <div class="toolbar"><h2>Máy chờ xác nhận (${pending.length})</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Máy</th><th>Serial</th><th>Địa chỉ IP</th><th>Báo cáo gần nhất</th><th>Vì sao chưa gắn</th><th></th></tr></thead>
        <tbody>
          ${pending.map(g => `
            <tr>
              <td class="wrap">${machine(g)}</td>
              <td class="mono muted">${g.serial_number ? esc(g.serial_number) : "Không đọc được"}</td>
              <td class="mono muted">${esc(g.ip_address || g.remote_ip || "")}</td>
              <td class="mono muted">${seen(g)}</td>
              <td class="reason">${esc(g.pending_reason || "")}</td>
              <td><div class="row-actions">
                ${canCreate && g.last_seen ? btn("create", g, "Tạo tài sản", true) : ""}
                ${canLink ? btn("link", g, "Gắn vào tài sản có sẵn") : ""}
                ${canManage ? btn("revoke", g, "Thu hồi") : ""}
              </div></td>
            </tr>`).join("") || emptyRow(6, "Không có máy nào đang chờ. Máy do agent báo cáo mà chưa khớp được với tài sản nào sẽ hiện ở đây.")}
        </tbody>
      </table></div>
    </section>

    <section class="panel table-panel">
      <div class="toolbar"><h2>Agent đang báo cáo cho tài sản (${linked.length})</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Máy</th><th>Tài sản</th><th>Gắn nhờ</th><th>Địa chỉ IP</th><th>Bản agent</th><th>Báo cáo gần nhất</th><th></th></tr></thead>
        <tbody>
          ${linked.map(g => `
            <tr>
              <td class="wrap">${machine(g)}</td>
              <td><a class="tape" href="#/assets/${g.asset.id}">${esc(g.asset.asset_tag)}</a></td>
              <td class="muted">${esc(MATCHED_BY[g.matched_by] || "")}</td>
              <td class="mono muted">${esc(g.ip_address || g.remote_ip || "")}</td>
              <td class="mono muted">${esc(g.agent_version || "")}</td>
              <td class="mono muted">${seen(g)}</td>
              <td><div class="row-actions">
                ${canLink ? btn("unlink", g, "Bỏ gắn") : ""}
                ${canManage ? btn("revoke", g, "Thu hồi") : ""}
              </div></td>
            </tr>`).join("") || emptyRow(7, "Chưa có agent nào gắn với tài sản.")}
        </tbody>
      </table></div>
    </section>

    ${canManage ? `
    <section class="panel">
      <h2>Cài agent lên máy mới</h2>
      <form id="code-form" class="inline-form" novalidate>
        <label for="c-name"><span>Tên gợi nhớ cho mã kết nạp <span class="req">*</span></span>
          <input id="c-name" name="name" maxlength="150" placeholder="VD: Đợt cài phòng Kế toán tháng 12">
        </label>
        <button class="btn btn-primary">Tạo mã kết nạp</button>
      </form>
      ${newCode ? `
      <div class="secret" id="new-code">
        <div>Mã kết nạp "${esc(newCode.name)}". <strong>Mã chỉ hiện một lần này</strong>, hãy chép lại trước khi rời trang:</div>
        <div class="secret-code">${esc(newCode.code)}</div>
        ${installSteps(newCode.code)}
        <small class="field-hint">Một mã dùng được cho nhiều máy cho tới khi bị thu hồi. Lệnh run chạy mãi và tự gửi báo cáo theo chu kỳ; muốn gửi một lần rồi thoát thì thêm --once.</small>
      </div>` : `
      <details class="install field-hint" style="margin-top:14px">
        <summary>Các lệnh cài agent</summary>
        ${installSteps("MÃ_KẾT_NẠP")}
        <p style="margin-top:10px">Thay MÃ_KẾT_NẠP bằng mã vừa tạo, dán nguyên mã, không thêm dấu ngoặc hay dấu nháy.</p>
      </details>`}
    </section>

    <section class="panel table-panel">
      <div class="toolbar"><h2>Mã kết nạp</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Tên</th><th>Mã</th><th>Người tạo</th><th>Ngày tạo</th><th>Số agent đã kết nạp</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          ${codes.map(c => `
            <tr>
              <td class="wrap">${esc(c.name)}</td>
              <td class="mono muted">${esc(c.hint)}…</td>
              <td>${esc(c.created_by.full_name)}</td>
              <td class="mono muted">${esc(fmtDate(c.created_at))}</td>
              <td class="mono">${c.agent_count}</td>
              <td>${c.revoked_at ? `<span class="led s-archived">Đã thu hồi</span>` : `<span class="led s-ready">Đang dùng được</span>`}</td>
              <td class="right">${c.revoked_at ? "" : `<button class="btn btn-sm" data-act="revoke-code" data-id="${c.id}">Thu hồi</button>`}</td>
            </tr>`).join("") || emptyRow(7, "Chưa có mã kết nạp nào.")}
        </tbody>
      </table></div>
    </section>` : ""}

    ${revoked.length ? `
    <section class="panel table-panel">
      <div class="toolbar"><h2>Agent đã thu hồi (${revoked.length})</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>Máy</th><th>Ngày kết nạp</th><th>Báo cáo cuối</th><th></th></tr></thead>
        <tbody>
          ${revoked.map(g => `
            <tr>
              <td class="wrap">${machine(g)}</td>
              <td class="mono muted">${esc(fmtDate(g.enrolled_at))}</td>
              <td class="mono muted">${seen(g)}</td>
              <td class="right">${canManage ? btn("delete", g, "Xóa khỏi danh sách") : ""}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>
    </section>` : ""}`;

  const reload = () => viewAgents().catch(showError);
  const codeForm = $app.querySelector("#code-form");
  if (codeForm) {
    watchFieldErrors(codeForm);
    codeForm.onsubmit = async e => {
      e.preventDefault();
      if (!checkFields(codeForm, [{ name: "name", label: "tên gợi nhớ", required: true }])) return;
      try {
        const created = await api("/enrollment-codes", { method: "POST", body: formData(codeForm) });
        await viewAgents(created);
        document.getElementById("new-code")?.scrollIntoView({ block: "center" });
      } catch (err) {
        showFormError(codeForm, err);
      }
    };
  }

  $app.querySelectorAll("[data-act]").forEach(el => (el.onclick = async () => {
    const act = el.dataset.act, id = Number(el.dataset.id);
    const g = agents.find(x => x.id === id);
    const name = g ? (g.hostname || `agent số ${g.id}`) : "";
    try {
      if (act === "create") {
        if (!confirm(`Tạo một tài sản mới từ máy ${name}? Serial, hãng và model lấy theo báo cáo của máy; sau đó sửa lại được như mọi tài sản.`)) return;
        const done = await api(`/agents/${id}/asset`, { method: "POST" });
        toast(`Đã tạo tài sản ${done.asset.asset_tag} từ máy ${name}`);
        location.hash = `#/assets/${done.asset.id}`;
        return;
      }
      if (act === "link") {
        const tag = prompt(`Máy ${name} là tài sản nào? Nhập mã tài sản (ví dụ TS-000001):`);
        if (!tag || !tag.trim()) return;
        const done = await api(`/agents/${id}/link`, { method: "POST", body: { asset_tag: tag.trim() } });
        toast(`Đã gắn máy ${name} vào tài sản ${done.asset.asset_tag}`);
      } else if (act === "unlink") {
        if (!confirm(`Bỏ gắn máy ${name} khỏi tài sản ${g.asset.asset_tag}? Hồ sơ kỹ thuật agent đã ghi cho tài sản này sẽ bị xóa; máy quay về danh sách chờ xác nhận.`)) return;
        await api(`/agents/${id}/unlink`, { method: "POST" });
        toast(`Đã bỏ gắn máy ${name}`);
      } else if (act === "revoke") {
        if (!confirm(`Thu hồi agent trên máy ${name}? Từ giờ báo cáo của nó bị từ chối; muốn dùng lại phải kết nạp lại bằng một mã kết nạp.`)) return;
        await api(`/agents/${id}/revoke`, { method: "POST" });
        toast(`Đã thu hồi agent trên máy ${name}`);
      } else if (act === "delete") {
        await api(`/agents/${id}`, { method: "DELETE" });
        toast(`Đã xóa agent ${name} khỏi danh sách`);
      } else if (act === "revoke-code") {
        const c = codes.find(x => x.id === id);
        if (!confirm(`Thu hồi mã kết nạp "${c.name}"? Không kết nạp thêm được máy nào bằng mã này. ${c.agent_count} agent đã kết nạp vẫn hoạt động bình thường.`)) return;
        await api(`/enrollment-codes/${id}/revoke`, { method: "POST" });
        toast(`Đã thu hồi mã kết nạp "${c.name}"`);
      }
    } catch (err) {
      showError(err);
    }
    reload();
  }));
}

// ===================== Điều hướng (hash router) =====================
// Phần tử thứ ba (nếu có) là quyền cần có để mở trang
const routes = [
  [/^#\/assets$/, () => viewAssetList()],
  [/^#\/assets\/new$/, () => viewAssetForm(null), "asset.write"],
  [/^#\/assets\/(\d+)\/edit$/, m => viewAssetForm(Number(m[1])), "asset.write"],
  [/^#\/assets\/(\d+)$/, m => viewAssetDetail(Number(m[1]))],
  [/^#\/employees$/, () => viewSimple(SIMPLE.employees), "asset.view_all"],
  [/^#\/employees\/(\d+)$/, m => viewEmployee(Number(m[1])), "asset.view_all"],
  [/^#\/locations$/, () => viewSimple(SIMPLE.locations), "asset.view_all"],
  [/^#\/categories$/, () => viewSimple(SIMPLE.categories), "asset.view_all"],
  [/^#\/agents$/, () => viewAgents(), "asset.view_all"],
  [/^#\/users$/, () => viewUsers(), "user.manage"],
  [/^#\/settings$/, () => viewSettings()],
];

async function router() {
  if (!me) { requireLogin(); return; }
  document.getElementById("userbox").open = false;  // đổi trang thì đóng menu tài khoản
  const hash = location.hash || "#/assets";
  const section = hash.split("/")[1];
  document.querySelectorAll("[data-nav]").forEach(a => {
    const on = a.dataset.nav === section;
    a.classList.toggle("active", on);
    if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });

  for (const [pattern, view, perm] of routes) {
    const m = hash.match(pattern);
    if (m) {
      if (perm && !can(perm)) {
        toast("Tài khoản của bạn không có quyền mở trang này.", true);
        location.hash = "#/assets";
        return;
      }
      try {
        await view(m);
        window.scrollTo(0, 0);
      } catch (err) {
        if (!err.authRequired) $app.innerHTML = `<p class="error">${esc(err.message)}</p>`;
      }
      return;
    }
  }
  location.hash = "#/assets";
}

// ===================== Khởi động =====================
async function start() {
  try {
    me = await api("/auth/me");  // 401 thì api() tự hiện màn đăng nhập
  } catch (err) {
    if (!err.authRequired) $app.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    return;
  }
  renderChrome();
  refreshPendingCount();
  router();
}

applyTheme(getTheme());
document.addEventListener("click", e => {
  // Nút chọn giao diện nằm trong trang Cài đặt (vẽ lại mỗi lần mở) nên bắt sự kiện ở document
  const themeBtn = e.target.closest("[data-theme-btn]");
  if (themeBtn) setTheme(themeBtn.dataset.themeBtn);
  // Bấm ra ngoài thì đóng menu tài khoản
  const menu = document.getElementById("userbox");
  if (menu.open && !menu.contains(e.target)) menu.open = false;
});
window.addEventListener("hashchange", router);
start();
