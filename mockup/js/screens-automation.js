/* Mockup ITAM - Module 6: Triển khai phần mềm và tự động hóa từ xa.
   Màn hình: gói cài đặt, đợt triển khai (wizard 4 bước, theo dõi từng máy),
   thư viện script (phiên bản), lần chạy script và hàng chờ phê duyệt.
   Đây là module rủi ro cao nhất: mọi lần chạy đều ghi nhật ký kiểm toán. */
(function () {
  "use strict";
  const D = M.data;
  const NOW = "27/11/2026 15:20";
  const dash = '<span class="muted">—</span>';

  /* ===================== Tiện ích ===================== */
  const fakeHash = (s) => {
    let h1 = 0x811c9dc5, out = "";
    for (let r = 0; r < 8; r++) {
      for (const ch of String(s) + r) { h1 ^= ch.charCodeAt(0); h1 = Math.imul(h1, 16777619) >>> 0; }
      out += (h1 >>> 0).toString(16).padStart(8, "0");
    }
    return out;
  };
  const shortHash = (h) => h.slice(0, 8) + "…" + h.slice(-6);
  const managed = () => D.assets.filter((a) => a.tech && a.status !== "archived");
  const osFamily = (a) => (!a.tech ? "" : /windows/i.test(a.tech.os) ? "Windows" : /mac/i.test(a.tech.os) ? "macOS" : /esxi/i.test(a.tech.os) ? "ESXi" : "Linux");
  const host = (a) => (a.tech && a.tech.hostname) || a.hostname || a.tag;
  const isServer = (a) => { const c = M.assetCat(a); return !!c && c.id === "c4"; };
  const machine = (id) => { const a = M.asset(id); return a ? `<span class="row" style="flex-wrap:nowrap">${M.tape(a.tag, a.id)}<span class="mono small">${M.esc(host(a))}</span></span>` : M.esc(id); };
  const pre = (txt) => `<pre>${M.esc(txt)}</pre>`;

  /* ===================== Dữ liệu mẫu ===================== */
  D.packages = [
    { id: "PK-01", name: "OpenSSH Server (bản vá CVE-2026-21410)", version: "1:9.6p1-3ubuntu13.6", os: "Ubuntu 22.04 / 24.04", file: "openssh-server_9.6p1-3ubuntu13.6_amd64.deb", size: "1,2 MB", silent: "dpkg -i --force-confold {file}", detect: "dpkg-query: openssh-server ≥ 1:9.6p1-3ubuntu13.6", uploadedBy: "Lê Hoàng Nam", uploadedAt: "27/11/2026 14:38", license: false, prev: [] },
    { id: "PK-02", name: "Google Chrome Enterprise", version: "131.0.6778.86", os: "Windows 10 / 11", file: "googlechromestandaloneenterprise64.msi", size: "118 MB", silent: "msiexec /i {file} /qn /norestart", detect: "Registry HKLM\\SOFTWARE\\Google\\Chrome\\BLBeacon version ≥ 131", uploadedBy: "Lê Hoàng Nam", uploadedAt: "19/11/2026 16:05", license: false, prev: [["130.0.6723.117", "05/11/2026", "Lê Hoàng Nam"]] },
    { id: "PK-03", name: "7-Zip", version: "24.08", os: "Windows 10 / 11", file: "7z2408-x64.msi", size: "1,9 MB", silent: "msiexec /i {file} /qn", detect: "Danh sách phần mềm có 7-Zip ≥ 24.08", uploadedBy: "Trần Minh Quân", uploadedAt: "11/11/2026 09:40", license: false, prev: [] },
    { id: "PK-04", name: "Microsoft Teams (bản mới)", version: "24295.605", os: "Windows 10 / 11", file: "teamsbootstrapper.exe", size: "4,6 MB", silent: "{file} -p", detect: "Danh sách phần mềm có Microsoft Teams ≥ 24295", uploadedBy: "Lê Hoàng Nam", uploadedAt: "25/11/2026 10:12", license: false, prev: [] },
    { id: "PK-05", name: "Kaspersky Endpoint Security", version: "12.7.0.533", os: "Windows 10 / 11", file: "kes_win_12.7.0.533_full.msi", size: "412 MB", silent: "msiexec /i {file} /qn EULA=1 PRIVACYPOLICY=1", detect: "Dịch vụ AVP đang chạy và phiên bản ≥ 12.7", uploadedBy: "Lê Hoàng Nam", uploadedAt: "26/11/2026 17:30", license: true, prev: [["12.6.0.438", "02/06/2026", "Lê Hoàng Nam"]] },
    { id: "PK-07", name: "Adobe Acrobat Pro", version: "24.004.20220", os: "Windows 10 / 11", file: "AcroPro_24_004_20220_x64.msi", size: "785 MB", silent: "msiexec /i {file} /qn EULA_ACCEPT=YES", detect: "Danh sách phần mềm có Adobe Acrobat Pro ≥ 24.004", uploadedBy: "Lê Hoàng Nam", uploadedAt: "26/11/2026 10:20", license: true, prev: [] },
    { id: "PK-06", name: "Zoom Workplace", version: "6.2.11", os: "macOS 13+", file: "zoomusInstallerFull.pkg", size: "96 MB", silent: "installer -pkg {file} -target /", detect: "Ứng dụng zoom.us ≥ 6.2.11 trong /Applications", uploadedBy: "Lê Hoàng Nam", uploadedAt: "08/10/2026 14:00", license: false, prev: [] },
  ];
  D.packages.forEach((p) => (p.hash = fakeHash(p.file)));

  D.deployments = [
    { id: "DP-007", name: "Vá OpenSSH theo CVE-2026-21410", packageId: "PK-01", target: "Điều kiện: máy bị ảnh hưởng bởi CVE-2026-21410 (Linux)", schedule: "Chạy ngay - 27/11/2026 14:45", deadline: "04/12/2026", createdBy: "Lê Hoàng Nam", state: "running", cve: "CVE-2026-21410", change: "CHG-031", pilot: false, results: null },
    { id: "DP-008", name: "Thử nghiệm Kaspersky Endpoint Security 12.7", packageId: "PK-05", target: "Danh sách: nhóm thử nghiệm 3 máy", schedule: "Khung giờ 19:00 - 28/11/2026", deadline: "05/12/2026", createdBy: "Lê Hoàng Nam", state: "scheduled", pilot: true,
      results: [{ assetId: "a1", state: "pending" }, { assetId: "a4", state: "pending" }, { assetId: "a17", state: "pending" }] },
    { id: "DP-006", name: "Cập nhật Google Chrome 131 cho máy Windows", packageId: "PK-02", target: "Điều kiện: HĐH Windows và Chrome < 131", schedule: "Khung giờ 19:00-22:00 - 20/11/2026", deadline: "27/11/2026", createdBy: "Lê Hoàng Nam", state: "done", pilot: false,
      results: [
        { assetId: "a1", state: "success", at: "20/11/2026 19:04", verified: true },
        { assetId: "a2", state: "success", at: "20/11/2026 19:06", verified: true },
        { assetId: "a4", state: "success", at: "20/11/2026 19:02", verified: true },
        { assetId: "a17", state: "timeout", code: "TIMEOUT", at: "27/11/2026 00:00" },
        { assetId: "a20", state: "success", at: "21/11/2026 08:31", verified: true },
      ] },
    { id: "DP-005", name: "Cài 7-Zip 24.08 cho Phòng Kế toán", packageId: "PK-03", target: "Đơn vị: Phòng Kế toán", schedule: "Chạy ngay - 12/11/2026 10:00", deadline: "19/11/2026", createdBy: "Trần Minh Quân", state: "done", pilot: false,
      results: [{ assetId: "a1", state: "success", at: "12/11/2026 10:03", verified: true }, { assetId: "a4", state: "success", at: "12/11/2026 10:02", verified: true }] },
  ];
  M.DP_STATE = { scheduled: ["Đã lên lịch", "info"], running: ["Đang chạy", "warn"], done: ["Hoàn tất", "ok"], stopped: ["Đã dừng", "mute"] };
  M.DP_RESULT = { pending: ["Chờ", "mute"], installing: ["Đang cài", "info"], success: ["Thành công", "ok"], failed: ["Lỗi", "bad"], timeout: ["Quá hạn", "warn"], cancelled: ["Đã hủy", "mute"] };

  /* DP-007 lấy danh sách máy theo CVE (dữ liệu của Module 3), lập kết quả mẫu một lần */
  function results(dp) {
    if (dp.results) return dp.results;
    const cve = (D.cves || []).find((c) => c.id === dp.cve);
    let ids = (cve && cve.assetIds ? cve.assetIds : []).filter((id) => M.asset(id));
    const linux = ids.filter((id) => osFamily(M.asset(id)) === "Linux");
    ids = linux.length ? linux.concat(ids.filter((id) => !linux.includes(id))) : ids;
    if (!ids.length) ids = ["a5", "a24"];
    const plan = [
      { state: "success", at: "27/11/2026 14:52", verified: false },
      { state: "failed", at: "27/11/2026 14:49", code: "E100" },
      { state: "pending" },
    ];
    dp.results = ids.map((id, i) => Object.assign({ assetId: id }, plan[i] || { state: "pending" }));
    return dp.results;
  }
  function logText(dp, r) {
    const p = M.find("packages", dp.packageId) || {};
    const a = M.asset(r.assetId) || {};
    switch (r.state) {
      case "success": return `[${(r.at || "").slice(11) || "--:--"}] Agent trên ${host(a)} nhận lệnh cài\nTải ${p.file} (${p.size})\nKiểm tra mã băm SHA-256: khớp ${shortHash(p.hash || "")}\nChạy: ${String(p.silent || "").replace("{file}", p.file)}\nKiểm tra: ${p.detect}\nThành công, mã thoát 0`;
      case "failed": return `Agent trên ${host(a)} nhận lệnh cài\nTải ${p.file}: xong, mã băm khớp\nChạy: ${String(p.silent || "").replace("{file}", p.file)}\nLỗi: không lấy được khóa /var/lib/dpkg/lock-frontend, một tiến trình apt khác đang chạy\nMã thoát 2 - mã lỗi ${r.code || "E100"}`;
      case "timeout": return `Máy ${host(a)} không kết nối trong suốt thời hạn của đợt (tới ${dp.deadline}).\nĐã đánh dấu quá hạn, không cài.`;
      case "installing": return `Agent trên ${host(a)} đã nhận lệnh, đang cài…`;
      case "cancelled": return "Đợt đã dừng trước khi máy này bắt đầu, máy không nhận lệnh.";
      default: return `Máy ${host(a)} chưa nhận lệnh. Máy đang tắt hoặc ngoài mạng sẽ nhận lệnh khi agent kết nối lại, trước hạn ${dp.deadline}.`;
    }
  }
  const tally = (rs) => {
    const t = { total: rs.length, success: 0, failed: 0, pending: 0, installing: 0, timeout: 0, cancelled: 0 };
    rs.forEach((r) => (t[r.state] = (t[r.state] || 0) + 1));
    return t;
  };

  D.scripts = [
    { id: "S-04", name: "Gỡ phần mềm bị cấm: uTorrent", purpose: "Gỡ uTorrent khỏi máy Windows bị phát hiện vi phạm danh sách phần mềm bị cấm (NV-3.1.5).", lang: "PowerShell", os: "Windows", version: 2, timeout: 300, needsApproval: false, updatedBy: "Lê Hoàng Nam", updatedAt: "27/11/2026 09:40",
      history: [[2, "27/11/2026 09:40", "Lê Hoàng Nam", "Dừng tiến trình uTorrent trước khi gỡ"], [1, "20/11/2026 15:10", "Lê Hoàng Nam", "Bản đầu"]],
      versions: {
        1: '# Gỡ uTorrent khỏi máy (phần mềm bị cấm)\n$paths = @("$env:APPDATA\\uTorrent\\uTorrent.exe", "${env:ProgramFiles(x86)}\\uTorrent\\uTorrent.exe")\nforeach ($p in $paths) {\n  if (Test-Path $p) {\n    Start-Process -FilePath $p -ArgumentList "/UNINSTALL /S" -Wait\n    Write-Output "Đã gỡ: $p"\n  }\n}\nexit 0',
        2: '# Gỡ uTorrent khỏi máy (phần mềm bị cấm theo danh sách NV-3.1.5)\n$ErrorActionPreference = "Stop"\n$proc = Get-Process -Name "uTorrent" -ErrorAction SilentlyContinue\nif ($proc) {\n  Stop-Process -Name "uTorrent" -Force\n  Write-Output "Đã dừng tiến trình uTorrent"\n}\n$paths = @("$env:APPDATA\\uTorrent\\uTorrent.exe", "${env:ProgramFiles(x86)}\\uTorrent\\uTorrent.exe")\n$found = $false\nforeach ($p in $paths) {\n  if (Test-Path $p) {\n    Start-Process -FilePath $p -ArgumentList "/UNINSTALL /S" -Wait\n    $found = $true\n    Write-Output "Đã gỡ: $p"\n  }\n}\nif (-not $found) { Write-Output "Không tìm thấy uTorrent trên máy" }\nexit 0',
      } },
    { id: "S-01", name: "Xóa bộ nhớ đệm Windows Update", purpose: "Sửa lỗi Windows Update kẹt ở 0%.", lang: "PowerShell", os: "Windows", version: 2, timeout: 600, needsApproval: false, updatedBy: "Lê Hoàng Nam", updatedAt: "02/10/2026 11:00",
      history: [[2, "02/10/2026 11:00", "Lê Hoàng Nam", "Thêm bước khởi động lại dịch vụ BITS"], [1, "15/09/2026 09:20", "Lê Hoàng Nam", "Bản đầu"]],
      versions: { 2: 'Stop-Service -Name wuauserv, bits -Force\nRemove-Item "$env:SystemRoot\\SoftwareDistribution\\Download\\*" -Recurse -Force\nStart-Service -Name wuauserv, bits\nWrite-Output "Đã xóa bộ nhớ đệm Windows Update"' } },
    { id: "S-02", name: "Thu thập nhật ký sự kiện 24 giờ", purpose: "Gom nhật ký System và Application 24 giờ gần nhất để Helpdesk xem.", lang: "PowerShell", os: "Windows", version: 1, timeout: 300, needsApproval: false, updatedBy: "Lê Hoàng Nam", updatedAt: "18/09/2026 14:30",
      history: [[1, "18/09/2026 14:30", "Lê Hoàng Nam", "Bản đầu"]],
      versions: { 1: '$since = (Get-Date).AddHours(-24)\nGet-WinEvent -FilterHashtable @{LogName="System","Application"; StartTime=$since; Level=1,2} |\n  Select-Object TimeCreated, Id, ProviderName, Message |\n  Format-Table -AutoSize' } },
    { id: "S-03", name: "Khởi động lại dịch vụ in (Print Spooler)", purpose: "Xử lý lệnh in bị kẹt trên máy dùng chung.", lang: "PowerShell", os: "Windows", version: 3, timeout: 120, needsApproval: false, updatedBy: "Trần Minh Quân", updatedAt: "05/11/2026 08:50",
      history: [[3, "05/11/2026 08:50", "Trần Minh Quân", "Xóa hàng đợi in trước khi khởi động"], [2, "01/10/2026 10:00", "Lê Hoàng Nam", "Thêm kiểm tra trạng thái"], [1, "12/09/2026 16:00", "Lê Hoàng Nam", "Bản đầu"]],
      versions: { 3: 'Stop-Service -Name Spooler -Force\nRemove-Item "$env:SystemRoot\\System32\\spool\\PRINTERS\\*" -Force\nStart-Service -Name Spooler\n(Get-Service -Name Spooler).Status' } },
    { id: "S-05", name: "Kiểm tra dung lượng ổ đĩa", purpose: "Báo các phân vùng dùng quá 80%.", lang: "Bash", os: "Linux, macOS", version: 1, timeout: 60, needsApproval: false, updatedBy: "Lê Hoàng Nam", updatedAt: "10/10/2026 09:00",
      history: [[1, "10/10/2026 09:00", "Lê Hoàng Nam", "Bản đầu"]],
      versions: { 1: '#!/usr/bin/env bash\ndf -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs\ndf --output=pcent,target -x tmpfs -x devtmpfs | awk \'NR>1 && $1+0 > 80 {print "CẢNH BÁO: " $2 " đã dùng " $1}\'' } },
    { id: "S-06", name: "Bật BitLocker cho ổ hệ thống", purpose: "Đưa máy về trạng thái tuân thủ mã hóa ổ đĩa (NV-3.3.2).", lang: "PowerShell", os: "Windows", version: 1, timeout: 900, needsApproval: true, updatedBy: "Lê Hoàng Nam", updatedAt: "24/11/2026 16:20",
      history: [[1, "24/11/2026 16:20", "Lê Hoàng Nam", "Bản đầu"]],
      versions: { 1: '$vol = Get-BitLockerVolume -MountPoint "C:"\nif ($vol.ProtectionStatus -eq "On") { Write-Output "BitLocker đã bật"; exit 0 }\nEnable-BitLocker -MountPoint "C:" -EncryptionMethod XtsAes256 -UsedSpaceOnly -TpmProtector\nBackup-BitLockerKeyProtector -MountPoint "C:" -KeyProtectorId $vol.KeyProtector[0].KeyProtectorId\nWrite-Output "Đã bật BitLocker, khóa khôi phục lưu lên AD"' } },
  ];
  D.scripts.forEach((s) => (s.body = s.versions[s.version]));

  D.scriptRuns = [
    { id: "RUN-0232", scriptId: "S-06", version: 1, targets: ["a1", "a2", "a4", "a17", "a20"], requestedBy: "Trần Minh Quân", requestedAt: "27/11/2026 11:05", ip: "10.10.2.10", state: "approval", reason: "5 máy không đạt hạng mục mã hóa ổ đĩa ở báo cáo tuân thủ tuần này." },
    { id: "RUN-0231", scriptId: "S-04", version: 2, targets: ["a20"], requestedBy: "Lê Hoàng Nam", requestedAt: "27/11/2026 10:12", ip: "10.10.2.15", state: "approval", reason: "HCM-KHOA-LT cài uTorrent, phần mềm bị cấm. Chạy ngoài giờ làm việc." },
    { id: "RUN-0230", scriptId: "S-04", version: 1, targets: ["a20", "a2"], requestedBy: "Lê Hoàng Nam", requestedAt: "26/11/2026 17:40", ip: "10.10.2.15", state: "approval", reason: "Gỡ uTorrent trên hai máy kinh doanh.", needsReapproval: true, staleWhy: "Script đã sửa từ v1 lên v2 sau khi gửi yêu cầu." },
    { id: "RUN-0229", scriptId: "S-03", version: 3, targets: ["a4"], requestedBy: "Trần Minh Quân", requestedAt: "26/11/2026 09:18", ip: "10.10.2.10", state: "done", approvedBy: "Không cần duyệt", decidedAt: "26/11/2026 09:18",
      results: [{ assetId: "a4", state: "success", exit: 0, duration: "6 giây", output: "Status\n------\nRunning" }] },
    { id: "RUN-0228", scriptId: "S-05", version: 1, targets: ["a5", "a24"], requestedBy: "Lê Hoàng Nam", requestedAt: "25/11/2026 08:00", ip: "10.10.2.15", state: "done", approvedBy: "Không cần duyệt", decidedAt: "25/11/2026 08:00",
      results: [
        { assetId: "a5", state: "success", exit: 0, duration: "1 giây", output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2       3.5T  1.9T  1.4T  58% /\n/dev/sda1       511M  6.1M  505M   2% /boot/efi" },
        { assetId: "a24", state: "success", exit: 0, duration: "1 giây", output: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/nvme0n1p2  468G  401G   43G  91% /\nCẢNH BÁO: / đã dùng 91%" },
      ] },
    { id: "RUN-0225", scriptId: "S-02", version: 1, targets: ["a17"], requestedBy: "Lê Hoàng Nam", requestedAt: "24/11/2026 14:02", ip: "10.10.2.15", state: "failed", approvedBy: "Không cần duyệt", decidedAt: "24/11/2026 14:02",
      results: [{ assetId: "a17", state: "timeout", exit: -1, duration: "300 giây", output: "Quá giới hạn 300 giây, hệ thống đã dừng script và ghi là lỗi quá hạn." }] },
    { id: "RUN-0220", scriptId: "S-01", version: 2, targets: ["a2"], requestedBy: "Lê Hoàng Nam", requestedAt: "21/11/2026 10:30", ip: "10.10.2.15", state: "rejected", approvedBy: "Trần Minh Quân", decidedAt: "21/11/2026 10:41", rejectReason: "Máy đang dùng trình chiếu cho khách hàng, chạy lại sau 18:00." },
  ];
  M.RUN_STATE = { approval: ["Chờ duyệt", "warn"], running: ["Đang chạy", "info"], done: ["Hoàn tất", "ok"], failed: ["Lỗi", "bad"], rejected: ["Bị từ chối", "mute"] };
  const RES_LABEL = { success: ["Thành công", "ok"], failed: ["Lỗi", "bad"], timeout: ["Quá hạn", "warn"] };
  const scriptOf = (r) => M.find("scripts", r.scriptId) || { name: r.scriptId, version: r.version };
  const nextRunId = () => "RUN-0" + (D.scriptRuns.reduce((m, r) => Math.max(m, parseInt(r.id.replace(/\D/g, ""), 10)), 0) + 1);

  /* ===================== NV-6.1.1: Gói cài đặt ===================== */
  const used = (p) => D.deployments.filter((d) => d.packageId === p.id);
  const PKG_EXT = ["msi", "exe", "deb", "rpm", "pkg"];
  M.defModal("pkg-upload", (fromId) => {
    const base = fromId ? M.find("packages", fromId) : null;
    return {
      title: base ? "Tạo phiên bản mới của gói" : "Tải lên gói cài đặt",
      wide: true,
      body: `${base ? M.kv([["Bản đang có", `${M.esc(base.name)} <span class="mono">${M.esc(base.version)}</span>, giữ nguyên`]]) : ""}
        <div class="form-grid">
          ${M.field("Tệp bộ cài", `<input type="file" name="file" accept=".msi,.exe,.deb,.rpm,.pkg">`, { req: true, full: true, hint: ".msi, .exe, .deb, .rpm, .pkg" })}
          ${M.field("Tên gói", M.input("name", { value: base ? base.name : "", ph: "Google Chrome Enterprise" }), { req: true })}
          ${M.field("Phiên bản", M.input("version", { ph: base ? "Khác " + base.version : "131.0.6778.86" }), { req: true })}
          ${M.field("Hệ điều hành áp dụng", M.select("os", ["Windows 10 / 11", "Ubuntu 22.04 / 24.04", "RHEL 8 / 9", "macOS 13+"], base ? base.os : "Windows 10 / 11"))}
          ${M.field("Tham số cài âm thầm", M.input("silent", { value: base ? base.silent : "msiexec /i {file} /qn /norestart" }), { full: true })}
          ${M.field("Cách nhận biết cài thành công", M.input("detect", { value: base ? base.detect : "", ph: "Danh sách phần mềm có … ≥ phiên bản …" }), { full: true })}
          ${M.checkbox("license", "Kiểm tra số ghế bản quyền trước khi triển khai", base ? base.license : false)}
        </div>`,
      submit: "Tải lên",
      onSubmit(data, form) {
        const f = data.file;
        if (!f || !f.name) return M.invalid(form, "file", "Chọn tệp bộ cài.");
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        if (!PKG_EXT.includes(ext)) return M.invalid(form, "file", `Tệp .${ext} không đúng định dạng bộ cài. Chỉ nhận .msi, .exe, .deb, .rpm hoặc .pkg.`);
        if (!data.name.trim()) return M.invalid(form, "name", "Nhập tên gói.");
        if (!data.version.trim()) return M.invalid(form, "version", "Nhập phiên bản.");
        if (base && data.version.trim() === base.version) return M.invalid(form, "version", "Phiên bản mới phải khác phiên bản đang có.");
        const hash = fakeHash(f.name + f.size + Date.now());
        if (base) {
          base.prev.unshift([base.version, NOW.slice(0, 10), base.uploadedBy]);
          const id = "PK-" + String(D.packages.length + 1).padStart(2, "0");
          D.packages.unshift({ id, name: data.name.trim(), version: data.version.trim(), os: data.os, file: f.name, size: (f.size / 1048576).toFixed(1).replace(".", ",") + " MB", silent: data.silent, detect: data.detect, uploadedBy: M.me().user, uploadedAt: NOW, license: !!data.license, prev: base.prev.slice(), hash });
          return `Đã tạo phiên bản ${data.version.trim()} (${id}); gói cũ ${base.version} giữ nguyên. Mã băm ${shortHash(hash)}.`;
        }
        const id = "PK-" + String(D.packages.length + 1).padStart(2, "0");
        D.packages.unshift({ id, name: data.name.trim(), version: data.version.trim(), os: data.os, file: f.name, size: (f.size / 1048576).toFixed(1).replace(".", ",") + " MB", silent: data.silent, detect: data.detect, uploadedBy: M.me().user, uploadedAt: NOW, license: !!data.license, prev: [], hash });
        return `Đã tải lên gói ${data.name.trim()} kèm mã băm ${shortHash(hash)}.`;
      },
    };
  });
  M.defModal("pkg-edit", (id) => {
    const p = M.find("packages", id);
    return {
      title: "Sửa gói cài đặt",
      body: `${M.field("Tham số cài âm thầm", M.input("silent", { value: p.silent }))}
        ${M.field("Cách nhận biết cài thành công", M.input("detect", { value: p.detect }))}`,
      submit: "Lưu",
      onSubmit(data) { p.silent = data.silent; p.detect = data.detect; return `Đã lưu gói ${p.name}.`; },
    };
  });

  M.screen("packages", {
    nav: "packages", title: "Gói cài đặt", codes: ["NV-6.1.1"],
    render() {
      const can = M.can("deploy.manage");
      return M.page({
        title: "Gói cài đặt",
        sub: "Gói đã dùng trong đợt triển khai bị khóa nội dung, chỉ tạo được phiên bản mới.",
        codes: ["NV-6.1.1"],
        actions: M.btn("Tải lên gói", { primary: true, icon: "upload", modal: "pkg-upload", perm: "deploy.manage" }),
        body: M.panel({
          flush: true,
          body: M.toolbar(M.searchBox("pkg-table", "Tìm theo tên gói, tệp, hệ điều hành")) + M.table({
            id: "pkg-table",
            cols: [
              { h: "Gói", r: (p) => `<div class="cell-name">${M.esc(p.name)}</div><div class="cell-sub mono">${M.esc(p.file)} - ${M.esc(p.size)}</div>` },
              { h: "Phiên bản", r: (p) => `<span class="mono">${M.esc(p.version)}</span>` },
              { h: "Hệ điều hành", r: (p) => M.esc(p.os) },
              { h: "SHA-256", r: (p) => `<span class="mono small" title="${M.esc(p.hash)}">${M.esc(shortHash(p.hash))}</span>` },
              { h: "Dùng trong đợt", r: (p) => { const u = used(p); return u.length ? `<span class="row" style="gap:4px;flex-wrap:nowrap" title="Đã khóa nội dung">${M.icon("lock")}${u.map((d) => `<a class="mono small" href="#/deployments/${M.esc(d.id)}">${M.esc(d.id)}</a>`).join(", ")}</span>` : '<span class="muted small">Chưa dùng</span>'; } },
              { h: "", cls: "right", r: (p) => (!can ? "" : used(p).length ? M.btn("Tạo phiên bản mới", { sm: true, modal: "pkg-upload", arg: p.id }) : `<span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${M.btn("Sửa", { sm: true, ghost: true, modal: "pkg-edit", arg: p.id })}${M.btn("Triển khai", { sm: true, href: "#/deployments/new?step=1&pkg=" + p.id })}</span>`) },
            ],
            rows: D.packages,
          }),
        }),
      });
    },
  });

  /* ===================== NV-6.1.2: Tạo đợt triển khai (wizard) ===================== */
  const wiz = { pkg: "PK-07", mode: "cond", list: ["a1", "a4", "a17"], cat: "c1", unit: "u1", condOs: "Windows", condSw: "Adobe Acrobat Pro", condVer: "24", when: "at", at: "2026-11-28T19:00", days: 7, pilot: true };
  const wizTargets = () => {
    const ms = managed();
    if (wiz.mode === "list") return ms.filter((a) => wiz.list.includes(a.id));
    if (wiz.mode === "cat") return ms.filter((a) => { const c = M.assetCat(a); return c && c.id === wiz.cat; });
    if (wiz.mode === "unit") return ms.filter((a) => a.unit === wiz.unit);
    return ms.filter((a) => osFamily(a) === wiz.condOs && !(a.tech.software || []).some((s) => M.fold(s.name).includes(M.fold(wiz.condSw)) && String(s.version) >= wiz.condVer));
  };
  const licenseCheck = (pkg, n) => {
    if (!pkg || !pkg.license) return null;
    /* Tìm bản quyền qua danh mục phần mềm chuẩn hóa (Module 3), lấy số bản cài thực tế từ kết quả đối chiếu */
    const sw = (D.software || []).find((x) => x.licenseId && M.fold(pkg.name).includes(M.fold(x.name)));
    const lic = sw ? (D.licenses || []).find((l) => l.id === sw.licenseId) : (D.licenses || []).find((l) => M.fold(l.software || l.name || "").includes(M.fold(pkg.name.split(" ")[0])));
    const comp = lic && (D.licCompliance || []).find((c) => c.lic === lic.id);
    const seats = lic && lic.seats != null ? lic.seats : 40;
    const usedSeats = comp ? comp.installs : lic && lic.used != null ? lic.used : 38;
    const free = Math.max(0, seats - usedSeats);
    return { lic, seats, used: usedSeats, free, short: Math.max(0, n - free) };
  };
  const targetTable = (rows) => M.table({
    cols: [
      { h: "Máy", r: (a) => machine(a.id) },
      { h: "Tài sản", r: (a) => `<span class="small">${M.esc(a.name)}</span>` },
      { h: "Hệ điều hành", r: (a) => `<span class="small">${M.esc(a.tech.os)}</span>` },
      { h: "Đơn vị", r: (a) => M.esc((M.find("orgUnits", a.unit) || {}).name || "") },
      { h: "Báo cáo gần nhất", r: (a) => `<span class="mono small">${M.esc(a.tech.lastReport || "")}</span>` },
    ],
    rows,
    empty: "Không máy nào khớp nhóm mục tiêu.",
  });
  M.action("seg:dp-mode", (val) => { wiz.mode = val; M.refresh(); });
  M.action("dp-set", (el, val) => { wiz[el.name] = el.type === "checkbox" ? el.checked : val; M.refresh(); });
  M.action("dp-list", (el) => {
    wiz.list = el.checked ? wiz.list.concat(el.value) : wiz.list.filter((x) => x !== el.value);
    M.refresh();
  });
  const pickPkg = (id) => {
    const p = M.find("packages", id);
    if (!p || wiz.pkg === id) return;
    wiz.pkg = id;
    wiz.condSw = p.name.replace(/\s*\(.*\)\s*$/, "");
    wiz.condVer = String(p.version).replace(/^\d+:/, "").split(".")[0];
    wiz.condOs = /ubuntu|rhel|linux/i.test(p.os) ? "Linux" : /mac/i.test(p.os) ? "macOS" : "Windows";
  };
  M.action("dp-s1", (form, data) => { if (!data.pkg) { M.toast("Chọn một gói cài đặt.", "bad"); return; } pickPkg(data.pkg); M.go("deployments/new?step=2"); });
  M.action("dp-s2", () => { if (!wizTargets().length) { M.toast("Nhóm máy mục tiêu chưa khớp máy nào.", "bad"); return; } M.go("deployments/new?step=3"); });
  M.action("dp-s3", (form, data) => {
    wiz.when = data.when; wiz.at = data.at; wiz.days = parseInt(data.days, 10) || 7; wiz.pilot = !!data.pilot;
    if (wiz.when === "at" && !wiz.at) return M.invalid(form, "at", "Chọn khung giờ chạy.");
    M.go("deployments/new?step=4");
  });
  M.action("dp-s4", (form, data) => {
    const pkg = M.find("packages", wiz.pkg);
    const ts = wizTargets();
    const lc = licenseCheck(pkg, ts.length);
    if (!data.name.trim()) return M.invalid(form, "name", "Đặt tên cho đợt triển khai.");
    if (lc && lc.short && !data.ack) { M.toast("Xác nhận đã xem cảnh báo thiếu ghế bản quyền trước khi tạo đợt.", "bad"); return; }
    const id = "DP-0" + String(D.deployments.reduce((m, d) => Math.max(m, parseInt(d.id.replace(/\D/g, ""), 10)), 0) + 1).padStart(2, "0");
    const at = wiz.at ? wiz.at.replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/, "$3/$2/$1 $4") : "";
    D.deployments.unshift({ id, name: data.name.trim(), packageId: pkg.id, target: modeText(), schedule: wiz.when === "now" ? "Chạy ngay - " + NOW : "Khung giờ " + at, deadline: `${wiz.days} ngày kể từ lúc chạy`, createdBy: M.me().user, state: wiz.when === "now" ? "running" : "scheduled", pilot: wiz.pilot,
      results: ts.map((a) => ({ assetId: a.id, state: wiz.when === "now" ? "installing" : "pending" })) });
    M.go("deployments/" + id);
    return `Đã tạo đợt ${id} cho ${ts.length} máy.`;
  });
  const modeText = () => wiz.mode === "list" ? `Danh sách: ${wiz.list.length} máy chọn tay`
    : wiz.mode === "cat" ? `Danh mục: ${(M.cat(wiz.cat) || {}).name || ""}`
    : wiz.mode === "unit" ? `Đơn vị: ${(M.find("orgUnits", wiz.unit) || {}).name || ""}`
    : `Điều kiện: HĐH ${wiz.condOs} và chưa có ${wiz.condSw} ≥ ${wiz.condVer}`;

  M.screen("deployments/new", {
    nav: "deployments", roles: ["admin", "infra"], title: "Tạo đợt triển khai", codes: ["NV-6.1.2"],
    render(params, query) {
      const step = Math.min(4, Math.max(1, parseInt(query.step, 10) || 1));
      if (query.pkg) pickPkg(query.pkg);
      const pkg = M.find("packages", wiz.pkg);
      const ts = wizTargets();
      let body = "";
      if (step === 1) {
        body = M.form("dp-s1", M.panel({ title: "Bước 1 - Chọn gói cài", body: `<div class="stack-sm">${D.packages.map((p) => `<label class="check" style="padding:10px 12px;border:1px solid var(--line);border-radius:var(--r-ctl)"><input type="radio" name="pkg" value="${M.esc(p.id)}" ${p.id === wiz.pkg ? "checked" : ""}> <span><b>${M.esc(p.name)}</b> <span class="mono small">${M.esc(p.version)}</span><span class="cell-sub">${M.esc(p.os)} - ${M.esc(p.file)}${p.license ? " - có theo dõi bản quyền" : ""}</span></span></label>`).join("")}</div>`,
          foot: `<span></span><span class="row">${M.btn("Hủy", { href: "#/deployments" })}${M.btn("Tiếp tục", { primary: true, type: "submit" })}</span>` }));
      } else if (step === 2) {
        const ms = managed();
        let ctrl = "";
        if (wiz.mode === "list") ctrl = `<div class="stack-sm">${ms.map((a) => `<label class="check"><input type="checkbox" value="${M.esc(a.id)}" data-change="dp-list" ${wiz.list.includes(a.id) ? "checked" : ""}> ${M.esc(a.tag)} - ${M.esc(host(a))} <span class="muted small">${M.esc(osFamily(a))}</span></label>`).join("")}</div>`;
        else if (wiz.mode === "cat") ctrl = M.field("Danh mục tài sản", M.select("cat", D.categories.map((c) => [c.id, c.name]), wiz.cat, { attrs: 'data-change="dp-set"' }));
        else if (wiz.mode === "unit") ctrl = M.field("Đơn vị", M.select("unit", (D.orgUnits || []).filter((u) => u.level > 0).map((u) => [u.id, u.name]), wiz.unit, { attrs: 'data-change="dp-set"' }));
        else ctrl = `<div class="form-grid">
          ${M.field("Hệ điều hành là", M.select("condOs", ["Windows", "Linux", "macOS"], wiz.condOs, { attrs: 'data-change="dp-set"' }))}
          ${M.field("Và chưa có phần mềm", M.input("condSw", { value: wiz.condSw, attrs: 'data-change="dp-set"' }))}
          ${M.field("Phiên bản tối thiểu", M.input("condVer", { value: wiz.condVer, attrs: 'data-change="dp-set"' }))}
        </div>`;
        body = M.form("dp-s2", M.panel({ title: "Bước 2 - Nhóm máy mục tiêu", body: `<div class="stack">${M.seg("dp-mode", [["list", "Danh sách máy"], ["cat", "Theo danh mục"], ["unit", "Theo đơn vị"], ["cond", "Theo điều kiện"]], wiz.mode)}${ctrl}</div>`,
          foot: `<span></span><span class="row">${M.btn("Quay lại", { href: "#/deployments/new?step=1" })}${M.btn("Tiếp tục", { primary: true, type: "submit" })}</span>` }))
          + M.panel({ title: `Máy khớp (${ts.length})`, flush: true, body: targetTable(ts) });
      } else if (step === 3) {
        body = M.form("dp-s3", M.panel({ title: "Bước 3 - Lịch chạy", body: `<div class="stack">
          <div class="row">${M.radio("when", "now", "Chạy ngay", wiz.when === "now")}${M.radio("when", "at", "Vào khung giờ định trước", wiz.when === "at")}</div>
          <div class="form-grid">
            ${M.field("Khung giờ bắt đầu", M.input("at", { type: "datetime-local", value: wiz.at }))}
            ${M.field("Thời hạn của đợt (ngày)", M.input("days", { type: "number", value: wiz.days, attrs: 'min="1" max="30"' }))}
          </div>
          ${M.checkbox("pilot", "Thử trên nhóm nhỏ trước khi mở rộng", wiz.pilot)}
        </div>`, foot: `<span></span><span class="row">${M.btn("Quay lại", { href: "#/deployments/new?step=2" })}${M.btn("Tiếp tục", { primary: true, type: "submit" })}</span>` }));
      } else {
        const lc = licenseCheck(pkg, ts.length);
        body = M.form("dp-s4", `<div class="side-layout"><div class="stack">${M.panel({ title: "Bước 4 - Xác nhận", body: `<div class="stack">
          ${M.field("Tên đợt", M.input("name", { value: `Cài ${pkg.name} ${pkg.version}` }), { req: true })}
          ${M.kv([
            ["Gói", `<b>${M.esc(pkg.name)}</b> <span class="mono">${M.esc(pkg.version)}</span>`],
            ["Mã băm", `<span class="mono small">${M.esc(shortHash(pkg.hash))}</span>`],
            ["Nhóm máy", M.esc(modeText())],
            ["Lịch", M.esc(wiz.when === "now" ? "Chạy ngay khi xác nhận" : "Khung giờ " + wiz.at.replace("T", " "))],
            ["Thời hạn", `${wiz.days} ngày`],
            ["Thử nhóm nhỏ trước", wiz.pilot ? "Có" : "Không"],
            lc && !lc.short ? ["Bản quyền", `Đủ, còn ${lc.free} ghế trống`] : null,
          ])}
          ${lc && lc.short
            ? M.note(`Đợt này cần ${ts.length} ghế nhưng ${M.esc(pkg.name)} chỉ còn ${lc.free} ghế trống (${lc.used} bản cài trên ${lc.seats} ghế${lc.lic ? `, <a href="#/licenses/${M.esc(lc.lic.id)}">${M.esc(lc.lic.id)}</a>` : ""}), thiếu <b>${lc.short} ghế</b>. Mua thêm hoặc thu hồi ghế trước khi cài.`, "bad") + M.checkbox("ack", "Tôi đã xem cảnh báo thiếu ghế và vẫn tạo đợt", false)
            : ""}
        </div>`, foot: `<span></span><span class="row">${M.btn("Quay lại", { href: "#/deployments/new?step=3" })}${M.btn("Tạo đợt triển khai", { primary: true, type: "submit", icon: "rocket" })}</span>` })}
          ${M.panel({ title: "Danh sách máy bị tác động", flush: true, body: targetTable(ts) })}</div>
          <div class="stack">${M.stats([{ label: "Sẽ tác động tới", value: `${ts.length} máy`, tone: ts.length > 20 ? "bad" : "warn" }])}
          ${M.anno("Màn xác nhận luôn hiện đúng số máy sẽ bị tác động, tính lại từ điều kiện ở bước 2 ngay lúc bấm.")}</div></div>`);
      }
      return M.page({
        back: ["#/deployments", "Đợt triển khai"],
        title: "Tạo đợt triển khai",
        codes: ["NV-6.1.2"],
        above: M.panel({ body: M.steps(["Chọn gói", "Nhóm máy mục tiêu", "Lịch chạy", "Xác nhận"], step - 1) }),
        body,
      });
    },
  });

  /* ===================== NV-6.1.3: Theo dõi đợt triển khai ===================== */
  M.screen("deployments", {
    nav: "deployments", title: "Đợt triển khai", codes: ["NV-6.1.3", "NV-6.1.2"],
    render() {
      const rows = D.deployments;
      return M.page({
        title: "Đợt triển khai",
        codes: ["NV-6.1.3", "NV-6.1.2"],
        actions: M.btn("Tạo đợt triển khai", { primary: true, icon: "plus", href: "#/deployments/new?step=1", perm: "deploy.manage" }),
        body: M.stats([
          { label: "Đang chạy", value: rows.filter((d) => d.state === "running").length, tone: "warn" },
          { label: "Đã lên lịch", value: rows.filter((d) => d.state === "scheduled").length, tone: "info" },
          { label: "Máy lỗi cần xử lý", value: rows.reduce((s, d) => s + results(d).filter((r) => r.state === "failed").length, 0), tone: "bad" },
          { label: "Hoàn tất 30 ngày qua", value: rows.filter((d) => d.state === "done").length, tone: "ok" },
        ]) + M.panel({
          flush: true,
          body: M.table({
            href: (d) => "#/deployments/" + d.id,
            cols: [
              { h: "Mã", r: (d) => `<b class="mono">${M.esc(d.id)}</b>` },
              { h: "Đợt", r: (d) => `<div class="cell-name">${M.esc(d.name)}</div><div class="cell-sub">${M.esc(d.target)}</div>` },
              { h: "Gói", r: (d) => { const p = M.find("packages", d.packageId) || {}; return `${M.esc(p.name || "")}<div class="cell-sub mono">${M.esc(p.version || "")}</div>`; } },
              { h: "Lịch", r: (d) => `<span class="small">${M.esc(d.schedule)}</span>` },
              { h: "Tiến độ", r: (d) => { const t = tally(results(d)); return `<div class="row" style="flex-wrap:nowrap">${M.progress(t.success, t.total, "ok")}<span class="mono small">${t.success}/${t.total}</span>${t.failed ? M.pill(t.failed + " lỗi", "bad") : ""}</div>`; } },
              { h: "Trạng thái", r: (d) => M.pill(...M.DP_STATE[d.state]) },
            ],
            rows,
          }),
        }),
      });
    },
  });

  M.action("dp-retry", (el, id) => {
    const dp = M.find("deployments", id);
    const failed = results(dp).filter((r) => r.state === "failed" || r.state === "timeout");
    failed.forEach((r) => { r.state = "installing"; delete r.code; });
    if (dp.state === "done") dp.state = "running";
    M.refresh();
    return `Đã chạy lại cho ${failed.length} máy lỗi. Máy đã thành công không bị chạy lại.`;
  });
  M.action("dp-stop", (el, id) => {
    const dp = M.find("deployments", id);
    let n = 0;
    results(dp).forEach((r) => { if (r.state === "pending") { r.state = "cancelled"; n++; } });
    dp.state = "stopped";
    M.refresh();
    return `Đã dừng ${dp.id}. ${n} máy chưa bắt đầu sẽ không nhận lệnh nữa.`;
  });
  M.action("dp-finish", (el, id) => {
    const dp = M.find("deployments", id);
    results(dp).forEach((r) => { if (r.state === "installing") { r.state = "success"; r.at = NOW; r.verified = false; } });
    M.refresh();
    return "Agent báo cài xong. Kết quả cuối cùng chờ lần quét kế tiếp xác nhận.";
  });
  M.defModal("dp-log", (key) => {
    const [id, aid] = String(key).split("|");
    const dp = M.find("deployments", id);
    const r = results(dp).find((x) => x.assetId === aid);
    return { title: `Nhật ký cài - ${host(M.asset(aid) || {})}`, wide: true, body: `${M.kv([["Đợt", `${M.esc(dp.id)} - ${M.esc(dp.name)}`], ["Trạng thái", M.pill(...M.DP_RESULT[r.state])], ["Mã lỗi", r.code ? `<span class="mono">${M.esc(r.code)}</span>` : dash]])}${pre(logText(dp, r))}`, submit: false, cancelLabel: "Đóng" };
  });

  M.screen("deployments/:id", {
    nav: "deployments", title: "Đợt triển khai", codes: ["NV-6.1.3"],
    render({ id }) {
      const dp = M.find("deployments", id);
      if (!dp) return M.page({ title: "Không tìm thấy đợt triển khai", back: ["#/deployments", "Đợt triển khai"] });
      const pkg = M.find("packages", dp.packageId) || {};
      const rs = results(dp);
      const t = tally(rs);
      const can = M.can("deploy.manage");
      const active = dp.state === "running" || dp.state === "scheduled";
      return M.page({
        back: ["#/deployments", "Đợt triển khai"],
        title: `${M.esc(dp.name)}`,
        sub: `<span class="mono">${M.esc(dp.id)}</span> - ${M.esc(dp.target)}`,
        codes: ["NV-6.1.3"],
        actions: can ? ((t.failed + t.timeout) ? M.btn(`Chạy lại máy lỗi (${t.failed + t.timeout})`, { primary: true, icon: "refresh", act: "dp-retry", arg: dp.id }) : "")
          + (t.installing ? M.btn("Giả lập: agent báo xong", { act: "dp-finish", arg: dp.id, title: "Chỉ có trong mockup" }) : "")
          + (active ? M.btn("Dừng đợt", { danger: true, act: "dp-stop", arg: dp.id, confirm: `Dừng đợt ${dp.id}? Các máy chưa bắt đầu sẽ không nhận lệnh nữa.` }) : "") : "",
        body: `<div class="side-layout"><div class="stack">
          ${M.panel({ title: `Kết quả ${t.total} máy`, body: M.stackbar([
            { label: "Thành công", value: t.success, tone: "ok" }, { label: "Lỗi", value: t.failed, tone: "bad" },
            { label: "Đang cài", value: t.installing, tone: "info" }, { label: "Chờ", value: t.pending, tone: "mute" },
            { label: "Quá hạn", value: t.timeout, tone: "warn" }, { label: "Đã hủy", value: t.cancelled, tone: "mute" },
          ].filter((p) => p.value || p.label === "Thành công" || p.label === "Lỗi")) })}
          ${M.panel({ flush: true, body: M.table({
            cols: [
              { h: "Máy", r: (r) => machine(r.assetId) },
              { h: "Trạng thái", r: (r) => `${M.pill(...M.DP_RESULT[r.state])}${r.code ? ` <span class="mono small">${M.esc(r.code)}</span>` : ""}` },
              { h: "Thời điểm", r: (r) => `<span class="mono small">${M.esc(r.at || "")}</span>` },
              { h: "Xác nhận bằng lần quét", r: (r) => (r.state !== "success" ? dash : r.verified ? `<span class="small">${M.icon("check")} Đã xác nhận</span>` : '<span class="small muted">Chờ lần quét sau</span>') },
              { h: "", cls: "right", r: (r) => M.btn("Xem nhật ký", { sm: true, ghost: true, modal: "dp-log", arg: `${dp.id}|${r.assetId}` }) },
            ],
            rows: rs,
          }) })}
          </div><div class="stack">
          ${M.panel({ title: "Thông tin đợt", body: M.kv([
            ["Trạng thái", M.pill(...M.DP_STATE[dp.state])],
            ["Gói", `${M.esc(pkg.name || "")} <span class="mono small">${M.esc(pkg.version || "")}</span>`],
            ["SHA-256", `<span class="mono small">${M.esc(shortHash(pkg.hash || "0000000000000000"))}</span>`],
            ["Lịch", M.esc(dp.schedule)],
            ["Thời hạn", M.esc(dp.deadline)],
            ["Người tạo", M.esc(dp.createdBy)],
            ["Thử nhóm nhỏ", dp.pilot ? "Có" : "Không"],
            dp.cve ? ["Lỗ hổng", `<a href="#/vulns/${M.esc(dp.cve)}">${M.esc(dp.cve)}</a>`] : null,
            dp.change ? ["Yêu cầu thay đổi", `<a href="#/changes/${M.esc(dp.change)}">${M.esc(dp.change)}</a>`] : null,
          ]) })}
          </div></div>`,
      });
    },
  });

  /* ===================== NV-6.2.1: Thư viện script ===================== */
  M.defModal("script-form", (id) => {
    const s = id ? M.find("scripts", id) : null;
    const waiting = s ? D.scriptRuns.filter((r) => r.scriptId === s.id && r.state === "approval").length : 0;
    return {
      title: s ? `Sửa script ${s.id}` : "Thêm script",
      wide: true,
      body: `${waiting ? M.note(`<b>${waiting} yêu cầu chạy</b> đang chờ duyệt với script này sẽ phải duyệt lại sau khi lưu.`, "warn") : ""}
        <div class="form-grid">
          ${s ? "" : M.field("Tên script", M.input("name", { ph: "Gỡ phần mềm …" }), { req: true, full: true })}
          ${s ? "" : M.field("Mục đích", M.input("purpose"), { full: true })}
          ${s ? "" : M.field("Ngôn ngữ", M.select("lang", ["PowerShell", "CMD", "Bash"], "PowerShell"))}
          ${s ? "" : M.field("Hệ điều hành áp dụng", M.select("os", ["Windows", "Linux", "macOS", "Linux, macOS"], "Windows"))}
          ${s ? "" : M.field("Giới hạn thời gian (giây)", M.input("timeout", { type: "number", value: 300, attrs: 'min="10" max="3600"' }))}
          ${s ? "" : M.checkbox("needsApproval", "Luôn bắt buộc duyệt trước khi chạy", false)}
          <label class="field full">Nội dung script <span class="req">*</span><textarea name="body" rows="14" style="font-family:var(--font-mono);font-size:12.5px">${M.esc(s ? s.body : "")}</textarea></label>
          ${s ? M.field("Ghi chú thay đổi", M.input("note", { ph: "Sửa gì, vì sao" }), { req: true, full: true }) : ""}
        </div>`,
      submit: s ? `Lưu thành v${s.version + 1}` : "Thêm script",
      onSubmit(data, form) {
        if (!data.body.trim()) return M.invalid(form, "body", "Nhập nội dung script.");
        if (s) {
          if (data.body === s.body) return M.invalid(form, "body", "Nội dung chưa thay đổi.");
          if (!data.note.trim()) return M.invalid(form, "note", "Ghi chú thay đổi để người duyệt biết đã sửa gì.");
          s.version += 1;
          s.versions[s.version] = data.body;
          s.body = data.body;
          s.history.unshift([s.version, NOW, M.me().user, data.note.trim()]);
          s.updatedBy = M.me().user; s.updatedAt = NOW;
          let n = 0;
          D.scriptRuns.forEach((r) => { if (r.scriptId === s.id && r.state === "approval" && r.version < s.version) { r.needsReapproval = true; r.staleWhy = `Script đã sửa lên v${s.version} sau khi gửi yêu cầu.`; n++; } });
          return `Đã lưu ${s.id} phiên bản v${s.version}; phiên bản cũ vẫn xem được.${n ? ` ${n} yêu cầu đang chờ phải duyệt lại.` : ""}`;
        }
        if (!data.name.trim()) return M.invalid(form, "name", "Nhập tên script.");
        const id = "S-0" + (D.scripts.length + 1);
        D.scripts.push({ id, name: data.name.trim(), purpose: data.purpose.trim(), lang: data.lang, os: data.os, version: 1, timeout: parseInt(data.timeout, 10) || 300, needsApproval: !!data.needsApproval, updatedBy: M.me().user, updatedAt: NOW, history: [[1, NOW, M.me().user, "Bản đầu"]], versions: { 1: data.body }, body: data.body });
        return `Đã thêm script ${id}.`;
      },
    };
  });

  M.defModal("script-run", (id) => {
    const s = M.find("scripts", id);
    const fam = /bash/i.test(s.lang) ? ["Linux", "macOS"] : ["Windows"];
    const ms = managed().filter((a) => fam.includes(osFamily(a)));
    return {
      title: `Chạy ${s.id} trên máy mục tiêu`,
      wide: true,
      body: `${M.kv([["Script", `${M.esc(s.name)} <span class="mono">v${s.version}</span>`], ["Giới hạn thời gian", `${s.timeout} giây`], ["Áp dụng", M.esc(s.os)]])}
        <div class="field">Chọn máy (${ms.length} máy ${M.esc(fam.join("/"))} có agent)
          <div class="stack-sm" style="max-height:220px;overflow:auto;padding:8px;border:1px solid var(--line);border-radius:var(--r-ctl)">${ms.map((a) => `<label class="check"><input type="checkbox" name="targets" value="${M.esc(a.id)}"> ${M.esc(a.tag)} - <span class="mono">${M.esc(host(a))}</span> <span class="muted small">${M.esc(M.holderText(a) || "")}${isServer(a) ? " - máy chủ" : ""}</span></label>`).join("") || '<span class="muted">Không có máy phù hợp.</span>'}</div>
        </div>
        ${M.field("Lý do chạy", M.textarea("reason", "", { rows: 2, ph: "Ví dụ: máy vi phạm danh sách phần mềm bị cấm" }), { req: true })}
        ${M.note(s.needsApproval ? "Script này luôn cần duyệt trước khi chạy." : "Chọn máy chủ hoặc quá 3 máy thì lệnh phải chờ duyệt mới chạy.", "warn")}`,
      submit: "Gửi lệnh chạy",
      onSubmit(data, form) {
        const targets = new FormData(form).getAll("targets");
        if (!targets.length) { M.toast("Chọn ít nhất một máy mục tiêu.", "bad"); return false; }
        if (!data.reason.trim()) return M.invalid(form, "reason", "Ghi lý do chạy script.");
        const need = s.needsApproval || targets.length > 3 || targets.some((t) => isServer(M.asset(t)));
        const run = { id: nextRunId(), scriptId: s.id, version: s.version, targets, requestedBy: M.me().user, requestedAt: NOW, ip: "10.10.2.15", reason: data.reason.trim() };
        if (need) Object.assign(run, { state: "approval" });
        else Object.assign(run, { state: "done", approvedBy: "Không cần duyệt", decidedAt: NOW, results: targets.map((t) => ({ assetId: t, state: "success", exit: 0, duration: "4 giây", output: `Đã chạy ${s.name} v${s.version} trên ${host(M.asset(t))}. Mã thoát 0.` })) });
        D.scriptRuns.unshift(run);
        return need ? `Đã gửi yêu cầu ${run.id}: chạy ${s.id} v${s.version} trên ${targets.length} máy. Yêu cầu thuộc diện cần duyệt nên chưa thực thi.` : `Đã chạy ${run.id} trên ${targets.length} máy. Kết quả ở trang Lần chạy & phê duyệt.`;
      },
    };
  });

  M.screen("scripts", {
    nav: "scripts", title: "Thư viện script", codes: ["NV-6.2.1"],
    render() {
      return M.page({
        title: "Thư viện script",
        sub: "Mỗi lần sửa tạo phiên bản mới và ghi nhật ký kiểm toán.",
        codes: ["NV-6.2.1", "NV-6.2.2"],
        actions: M.btn("Thêm script", { primary: true, icon: "plus", modal: "script-form", perm: "script.run" }),
        body: M.anno("Đề xuất tách quyền soạn script và quyền chạy script. Tài khoản chỉ có quyền chạy sẽ không thấy nút Thêm và Sửa.")
          + M.panel({
            flush: true,
            body: M.toolbar(M.searchBox("script-table", "Tìm theo tên, mục đích")) + M.table({
              id: "script-table",
              href: (s) => "#/scripts/" + s.id,
              cols: [
                { h: "Mã", r: (s) => `<b class="mono">${M.esc(s.id)}</b>` },
                { h: "Script", r: (s) => `<div class="cell-name">${M.esc(s.name)}</div><div class="cell-sub">${M.esc(s.purpose)}</div>` },
                { h: "Nền tảng", r: (s) => `${M.esc(s.lang)} - ${M.esc(s.os)}` },
                { h: "Phiên bản", r: (s) => `<span class="mono">v${s.version}</span>` },
                { h: "Duyệt", r: (s) => (s.needsApproval ? M.pill("Bắt buộc duyệt", "warn") : M.pill("Theo quy tắc", "mute")) },
                { h: "Sửa lần cuối", r: (s) => `${M.esc(s.updatedBy)}<div class="cell-sub">${M.esc(s.updatedAt)}</div>` },
              ],
              rows: D.scripts,
            }),
          }),
      });
    },
  });

  M.screen("scripts/:id", {
    nav: "scripts", title: "Script", codes: ["NV-6.2.1", "NV-6.2.2"],
    render({ id }, query) {
      const s = M.find("scripts", id);
      if (!s) return M.page({ title: "Không tìm thấy script", back: ["#/scripts", "Thư viện script"] });
      const v = query.v && s.versions[query.v] ? parseInt(query.v, 10) : s.version;
      const runs = D.scriptRuns.filter((r) => r.scriptId === s.id);
      return M.page({
        back: ["#/scripts", "Thư viện script"],
        title: M.esc(s.name),
        sub: `<span class="mono">${M.esc(s.id)}</span> - ${M.esc(s.lang)} - ${M.esc(s.os)}`,
        codes: ["NV-6.2.1", "NV-6.2.2"],
        actions: M.btn("Sửa script", { icon: "pen", modal: "script-form", arg: s.id, perm: "script.run" }) + M.btn("Chạy trên máy…", { primary: true, icon: "play", modal: "script-run", arg: s.id, perm: "script.run" }),
        body: `<div class="side-layout"><div class="stack">
          ${M.panel({ title: `Nội dung v${v}${v !== s.version ? " (bản cũ)" : ""}`, actions: v !== s.version ? `<a class="small" href="#/scripts/${M.esc(s.id)}">Xem bản hiện hành v${s.version}</a>` : "", body: pre(s.versions[v]) })}
          ${M.panel({ title: `Lần chạy (${runs.length})`, flush: true, body: M.table({
            href: () => "#/script-runs",
            cols: [
              { h: "Mã", r: (r) => `<span class="mono">${M.esc(r.id)}</span>` },
              { h: "Phiên bản", r: (r) => `<span class="mono">v${r.version}</span>` },
              { h: "Máy", r: (r) => `<span class="small">${r.targets.map((t) => M.esc(host(M.asset(t) || {}))).join(", ")}</span>` },
              { h: "Người yêu cầu", r: (r) => `${M.esc(r.requestedBy)}<div class="cell-sub">${M.esc(r.requestedAt)}</div>` },
              { h: "Trạng thái", r: (r) => M.pill(...M.RUN_STATE[r.state]) },
            ],
            rows: runs,
            empty: "Script này chưa chạy lần nào.",
          }) })}
        </div><div class="stack">
          ${M.panel({ title: "Thông tin", body: M.kv([
            ["Mục đích", M.esc(s.purpose)],
            ["Phiên bản hiện hành", `<span class="mono">v${s.version}</span>`],
            ["Giới hạn thời gian", `${s.timeout} giây`],
            ["Phê duyệt", s.needsApproval ? M.pill("Luôn bắt buộc duyệt", "warn") : "Theo quy tắc chung (CC-18)"],
            ["Sửa lần cuối", `${M.esc(s.updatedBy)} - ${M.esc(s.updatedAt)}`],
          ]) })}
          ${M.panel({ title: "Lịch sử phiên bản", flush: true, body: M.table({
            cols: [
              { h: "Bản", r: (h) => `<a class="mono" href="#/scripts/${M.esc(s.id)}?v=${h[0]}">v${h[0]}</a>` },
              { h: "Người sửa", r: (h) => `${M.esc(h[2])}<div class="cell-sub">${M.esc(h[1])}</div>` },
              { h: "Ghi chú", cls: "wrap", r: (h) => M.esc(h[3]) },
            ],
            rows: s.history,
          }) })}
        </div></div>`,
      });
    },
  });

  /* ===================== NV-6.2.2, NV-6.2.3: Lần chạy và phê duyệt ===================== */
  M.action("run-approve", (el, id) => {
    const r = M.find("scriptRuns", id);
    const s = scriptOf(r);
    if (r.requestedBy === M.me().user) return "Người yêu cầu không tự duyệt được.";
    if (r.needsReapproval) { r.version = s.version; r.needsReapproval = false; }
    Object.assign(r, { state: "done", approvedBy: M.me().user, decidedAt: NOW, results: r.targets.map((t) => ({ assetId: t, state: "success", exit: 0, duration: "12 giây", output: `Đã chạy ${s.name} v${r.version} trên ${host(M.asset(t) || {})}. Mã thoát 0.` })) });
    M.refresh();
    return `Đã duyệt ${r.id}; script v${r.version} chạy trên ${r.targets.length} máy.`;
  });
  M.defModal("run-reject", (id) => {
    const r = M.find("scriptRuns", id);
    return {
      title: `Từ chối ${r.id}`,
      body: `${M.kv([["Script", `${M.esc(scriptOf(r).name)} <span class="mono">v${r.version}</span>`], ["Người yêu cầu", M.esc(r.requestedBy)]])}${M.field("Lý do từ chối", M.textarea("reason", "", { rows: 3 }), { req: true })}`,
      submit: "Từ chối", danger: true,
      onSubmit(data, form) {
        if (!data.reason.trim()) return M.invalid(form, "reason", "Ghi lý do từ chối để người yêu cầu biết.");
        Object.assign(r, { state: "rejected", approvedBy: M.me().user, decidedAt: NOW, rejectReason: data.reason.trim() });
        return `Đã từ chối ${r.id}. Người yêu cầu nhận thông báo kèm lý do.`;
      },
    };
  });
  M.defModal("run-result", (id) => {
    const r = M.find("scriptRuns", id);
    const s = scriptOf(r);
    return {
      title: `Kết quả ${r.id}`, wide: true, submit: false, cancelLabel: "Đóng",
      body: `${M.kv([["Script", `${M.esc(s.name)} <span class="mono">v${r.version}</span>`], ["Người chạy", `${M.esc(r.requestedBy)} - IP <span class="mono">${M.esc(r.ip)}</span>`], ["Duyệt", M.esc(r.approvedBy || "")], ["Lúc", M.esc(r.decidedAt || r.requestedAt)]])}
        ${r.state === "rejected" ? M.note("Bị từ chối: " + M.esc(r.rejectReason), "bad") : (r.results || []).map((x) => `<div class="stack-sm"><div class="row">${machine(x.assetId)}${M.pill(...(RES_LABEL[x.state] || ["Chờ", "mute"]))}<span class="mono small muted">mã thoát ${M.esc(x.exit)} - ${M.esc(x.duration)}</span></div>${pre(x.output)}</div>`).join("")}`,
    };
  });

  M.screen("script-runs", {
    nav: "script-runs", title: "Lần chạy & phê duyệt", codes: ["NV-6.2.2", "NV-6.2.3"],
    render() {
      const me = M.me().user;
      const pending = D.scriptRuns.filter((r) => r.state === "approval");
      const history = D.scriptRuns.filter((r) => r.state !== "approval");
      const approvalTable = M.table({
        cols: [
          { h: "Yêu cầu", r: (r) => `<b class="mono">${M.esc(r.id)}</b><div class="cell-sub">${M.esc(r.requestedAt)}</div>` },
          { h: "Script", r: (r) => { const s = scriptOf(r); return `<a href="#/scripts/${M.esc(r.scriptId)}">${M.esc(s.name)}</a> <span class="mono">v${r.version}</span>${r.needsReapproval ? `<div>${M.pill("Phải duyệt lại", "bad")} <span class="small muted">${M.esc(r.staleWhy || "")}</span></div>` : ""}`; } },
          { h: "Máy mục tiêu", cls: "wrap", r: (r) => `<span class="small">${r.targets.map((t) => M.esc(host(M.asset(t) || {}))).join(", ")}</span><div class="cell-sub">${r.targets.length} máy</div>` },
          { h: "Người yêu cầu", r: (r) => `${M.esc(r.requestedBy)}<div class="cell-sub mono">IP ${M.esc(r.ip)}</div>` },
          { h: "Lý do", cls: "wrap", r: (r) => `<span class="small">${M.esc(r.reason)}</span>` },
          { h: "", cls: "right", r: (r) => {
            if (!M.can("script.approve")) return '<span class="small muted">Chờ Quản trị hệ thống duyệt</span>';
            if (r.requestedBy === me) return '<span class="small muted">Không tự duyệt yêu cầu của mình</span>';
            const s = scriptOf(r);
            return `<span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${M.btn(r.needsReapproval ? `Duyệt lại với v${s.version}` : "Duyệt", { sm: true, act: "run-approve", arg: r.id, confirm: `Duyệt chạy ${s.name} v${r.needsReapproval ? s.version : r.version} trên ${r.targets.length} máy?` })}${M.btn("Từ chối", { sm: true, ghost: true, modal: "run-reject", arg: r.id })}</span>`;
          } },
        ],
        rows: pending,
        empty: "Không có yêu cầu nào chờ duyệt.",
      });
      const histTable = M.table({
        id: "run-hist",
        cols: [
          { h: "Mã", r: (r) => `<b class="mono">${M.esc(r.id)}</b>` },
          { h: "Script", r: (r) => `${M.esc(scriptOf(r).name)} <span class="mono">v${r.version}</span>` },
          { h: "Máy", r: (r) => `<span class="small">${r.targets.map((t) => M.esc(host(M.asset(t) || {}))).join(", ")}</span>` },
          { h: "Người chạy", r: (r) => `${M.esc(r.requestedBy)}<div class="cell-sub">${M.esc(r.requestedAt)}</div>` },
          { h: "Trạng thái", r: (r) => M.pill(...M.RUN_STATE[r.state]) },
          { h: "", cls: "right", r: (r) => M.btn("Xem kết quả", { sm: true, ghost: true, modal: "run-result", arg: r.id }) },
        ],
        rows: history,
      });
      /* Nhật ký kiểm toán: ai chạy, phiên bản nào, trên máy nào, từ IP nào, lúc nào */
      const audit = [];
      D.scriptRuns.forEach((r) => {
        const s = scriptOf(r);
        audit.push({ at: r.requestedAt, who: r.requestedBy, act: r.state === "approval" || r.approvedBy !== "Không cần duyệt" ? "Yêu cầu chạy" : "Chạy script", script: `${r.scriptId} v${r.version}`, name: s.name, machines: r.targets, ip: r.ip });
        if (r.approvedBy && r.approvedBy !== "Không cần duyệt") audit.push({ at: r.decidedAt, who: r.approvedBy, act: r.state === "rejected" ? "Từ chối" : "Duyệt và chạy", script: `${r.scriptId} v${r.version}`, name: s.name, machines: r.targets, ip: "10.10.2.10" });
      });
      D.scripts.forEach((s) => s.history.forEach((h) => audit.push({ at: h[1], who: h[2], act: h[0] === 1 ? "Tạo script" : "Sửa script", script: `${s.id} v${h[0]}`, name: s.name, machines: [], ip: "10.10.2.15" })));
      const key = (x) => { const m = /^(\d{2})\/(\d{2})\/(\d{4}) ?(\d{2}:\d{2})?/.exec(x.at || ""); return m ? `${m[3]}${m[2]}${m[1]}${m[4] || ""}` : ""; };
      audit.sort((a, b) => key(b).localeCompare(key(a)));
      const auditTable = M.table({
        cols: [
          { h: "Thời điểm", r: (x) => `<span class="mono small">${M.esc(x.at)}</span>` },
          { h: "Người", r: (x) => M.esc(x.who) },
          { h: "Hành động", r: (x) => M.esc(x.act) },
          { h: "Script - phiên bản", r: (x) => `<span class="mono small">${M.esc(x.script)}</span><div class="cell-sub">${M.esc(x.name)}</div>` },
          { h: "Máy", cls: "wrap", r: (x) => (x.machines.length ? `<span class="small">${x.machines.map((t) => M.esc(host(M.asset(t) || {}))).join(", ")}</span>` : dash) },
          { h: "IP", r: (x) => `<span class="mono small">${M.esc(x.ip)}</span>` },
        ],
        rows: audit,
      });
      return M.page({
        title: "Lần chạy & phê duyệt",
        sub: "Người yêu cầu không tự duyệt yêu cầu của mình.",
        codes: ["NV-6.2.2", "NV-6.2.3"],
        body: M.stats([
          { label: "Phải duyệt lại", value: pending.filter((r) => r.needsReapproval).length, tone: "bad" },
          { label: "Chạy thành công 7 ngày", value: history.filter((r) => r.state === "done").length, tone: "ok" },
          { label: "Lỗi hoặc quá hạn", value: history.filter((r) => r.state === "failed").length, tone: "bad" },
        ])
          + M.cc("CC-18", "SRS để ngỏ việc phê duyệt (tùy chọn). Mockup giả định cần duyệt khi script đánh dấu bắt buộc, khi chạy trên máy chủ hoặc trên quá 3 máy; các trường hợp còn lại chạy ngay.")
          + M.panel({ flush: true, body: M.tabs("script-runs", [
            { key: "approval", label: "Chờ duyệt", n: pending.length, body: approvalTable },
            { key: "history", label: "Lịch sử chạy", n: history.length, body: M.toolbar(M.searchBox("run-hist", "Tìm theo mã, script, máy, người chạy")) + histTable },
            { key: "audit", label: "Nhật ký kiểm toán", n: audit.length, body: auditTable },
          ], "approval") }),
      });
    },
  });
})();
