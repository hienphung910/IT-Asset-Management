#!/usr/bin/env python3
"""ITAM agent: đọc cấu hình của máy này và gửi về máy chủ ITAM.

Chỉ cần Python 3.8 trở lên, không cài thêm thư viện nào. Chạy được trên Linux, Windows, macOS.

Agent chỉ đọc cấu hình phần cứng, hệ điều hành, card mạng và TÊN + PHIÊN BẢN phần mềm đã cài.
Không đọc nội dung tệp, lịch sử duyệt web hay dữ liệu cá nhân nào.

Nên chạy bằng quyền quản trị (root / Administrator): thiếu quyền thì vẫn chạy, nhưng trên Linux
sẽ không đọc được serial và BIOS UUID của máy.
"""
import argparse
import json
import os
import platform
import re
import socket
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

AGENT_VERSION = "1.0.0"
RETRY_SECONDS = 300        # gửi lỗi (mất mạng...) thì thử lại sau 5 phút
DEFAULT_INTERVAL = 6 * 3600
MAX_SOFTWARE = 10000       # các giới hạn dưới đây khớp với AgentReportIn phía máy chủ


# ============================== Tiện ích ==============================

def log(message):
    print(time.strftime("%Y-%m-%d %H:%M:%S"), message, flush=True)


def read_text(path):
    """Đọc một tệp nhỏ; không đọc được (không có, thiếu quyền) thì trả None."""
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read().strip() or None
    except OSError:
        return None


def run(cmd, timeout=60):
    """Chạy một lệnh và trả stdout; lệnh không có hoặc lỗi thì trả None."""
    try:
        out = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                             timeout=timeout, check=False)
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    return out.stdout.decode("utf-8", errors="replace")


def cut(value, limit):
    """Đưa về chuỗi gọn, cắt cho vừa giới hạn của máy chủ; rỗng thì trả None."""
    if value is None:
        return None
    value = re.sub(r"\s+", " ", str(value)).strip()
    return value[:limit] or None


def to_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def as_list(value):
    """PowerShell và system_profiler trả một đối tượng thay vì mảng khi chỉ có một phần tử."""
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def section(report, name, func):
    """Chạy một phần thu thập. Phần nào lỗi thì bỏ qua phần đó, các phần khác vẫn được gửi."""
    try:
        func(report)
    except Exception as exc:  # noqa: BLE001 - agent không được chết vì một máy có cấu hình lạ
        log("Bỏ qua phần %s: %s" % (name, exc))


def primary_ip(server_url):
    """Địa chỉ IP máy này dùng để đi tới máy chủ (không gửi gói tin nào, chỉ hỏi bảng định tuyến).
    Máy chủ nằm ngay trên máy này (chạy thử) thì lấy địa chỉ dùng để ra mạng ngoài."""
    server = urllib.parse.urlparse(server_url or "").hostname
    for target in (server, "8.8.8.8"):
        if not target:
            continue
        for family in (socket.AF_INET, socket.AF_INET6):
            try:
                s = socket.socket(family, socket.SOCK_DGRAM)
                try:
                    s.connect((target, 9))
                    ip = s.getsockname()[0]
                finally:
                    s.close()
            except OSError:
                continue
            if not ip.startswith("127.") and ip != "::1":
                return ip
    return None


def fallback_mac():
    node = uuid.getnode()
    if (node >> 40) & 1:  # bit multicast bật = Python không tìm được MAC thật nên sinh số ngẫu nhiên
        return None
    return ":".join("%02x" % ((node >> shift) & 0xFF) for shift in range(40, -1, -8))


# ============================== Linux ==============================

def linux_identity(r):
    dmi = "/sys/class/dmi/id/"
    r["manufacturer"] = read_text(dmi + "sys_vendor")
    r["model"] = read_text(dmi + "product_name")
    r["serial_number"] = read_text(dmi + "product_serial")  # chỉ root đọc được
    r["bios_uuid"] = read_text(dmi + "product_uuid")        # chỉ root đọc được
    r["bios_version"] = " ".join(filter(None, [read_text(dmi + "bios_version"), read_text(dmi + "bios_date")])) or None


def linux_os(r):
    info = {}
    for line in (read_text("/etc/os-release") or "").splitlines():
        key, sep, value = line.partition("=")
        if sep:
            info[key] = value.strip().strip('"')
    r["os_name"] = info.get("NAME") or platform.system()
    r["os_version"] = info.get("VERSION") or info.get("VERSION_ID")
    r["kernel"] = platform.release()


def linux_cpu_memory(r):
    cores, physical, core = set(), None, None
    for line in (read_text("/proc/cpuinfo") or "").splitlines():
        key, _, value = line.partition(":")
        key, value = key.strip(), value.strip()
        if key in ("model name", "Model", "Hardware") and not r.get("cpu_model"):
            r["cpu_model"] = value
        elif key == "physical id":
            physical = value
        elif key == "core id":
            core = value
            cores.add((physical, core))
    r["cpu_threads"] = os.cpu_count()
    r["cpu_cores"] = len(cores) or os.cpu_count()
    for line in (read_text("/proc/meminfo") or "").splitlines():
        if line.startswith("MemTotal:"):
            r["memory_mb"] = to_int(line.split()[1]) // 1024


def linux_disks(r):
    disks = []
    for name in sorted(os.listdir("/sys/block")):
        if name.startswith(("loop", "ram", "zram", "dm-", "md", "sr", "fd", "nbd")):
            continue
        base = "/sys/block/%s/" % name
        sectors = to_int(read_text(base + "size")) or 0
        if not sectors:  # khe đọc thẻ đang trống
            continue
        rotational = read_text(base + "queue/rotational")
        disks.append({
            "name": name,
            "model": read_text(base + "device/model"),
            "serial": read_text(base + "device/serial"),
            "size_gb": round(sectors * 512 / 1e9, 1),
            "kind": "hdd" if rotational == "1" else "ssd" if rotational == "0" else None,
        })
    r["disks"] = disks


def linux_nics(r):
    addresses = {}
    try:
        for item in json.loads(run(["ip", "-j", "-4", "addr"]) or "[]"):
            addresses[item.get("ifname")] = [a.get("local") for a in item.get("addr_info", []) if a.get("local")]
    except ValueError:
        pass
    nics = []
    for name in sorted(os.listdir("/sys/class/net")):
        base = "/sys/class/net/%s/" % name
        # Chỉ lấy card thật: card ảo (lo, docker0, veth, tun...) không có thư mục device
        if not os.path.exists(base + "device"):
            continue
        nics.append({"name": name, "mac": read_text(base + "address"), "ipv4": addresses.get(name, [])})
    r["nics"] = nics


def linux_software(r):
    items = []
    out = run(["dpkg-query", "-W", "-f", "${Package}\t${Version}\t${db:Status-Abbrev}\n"])
    if out:
        for line in out.splitlines():
            parts = line.split("\t")
            if len(parts) >= 3 and parts[2].startswith("ii"):  # chỉ gói đang cài đủ
                items.append({"name": parts[0], "version": parts[1]})
    out = run(["rpm", "-qa", "--qf", "%{NAME}\t%{VERSION}-%{RELEASE}\n"]) if not items else None
    if out:
        for line in out.splitlines():
            name, _, version = line.partition("\t")
            items.append({"name": name, "version": version})
    out = run(["pacman", "-Q"]) if not items else None
    if out:
        for line in out.splitlines():
            name, _, version = line.partition(" ")
            items.append({"name": name, "version": version})
    for cmd, source in ((["snap", "list"], "snap"), (["flatpak", "list", "--app", "--columns=application,version"], "flatpak")):
        out = run(cmd)
        for line in (out or "").splitlines()[1 if source == "snap" else 0:]:
            parts = line.split()
            if parts:
                items.append({"name": "%s (%s)" % (parts[0], source), "version": parts[1] if len(parts) > 1 else None})
    r["software"] = items


def collect_linux(r):
    section(r, "định danh máy", linux_identity)
    section(r, "hệ điều hành", linux_os)
    section(r, "CPU và RAM", linux_cpu_memory)
    section(r, "ổ đĩa", linux_disks)
    section(r, "card mạng", linux_nics)
    section(r, "phần mềm", linux_software)


# ============================== Windows ==============================

# Một lệnh PowerShell duy nhất, trả JSON. Dùng Get-CimInstance vì wmic đã bị gỡ khỏi Windows 11.
WINDOWS_SCRIPT = r"""
$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$media = @{}
Get-PhysicalDisk | ForEach-Object { $media[[string]$_.DeviceId] = [string]$_.MediaType }
@{
  system = Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer, Model, TotalPhysicalMemory
  product = Get-CimInstance Win32_ComputerSystemProduct | Select-Object UUID, IdentifyingNumber
  bios = Get-CimInstance Win32_BIOS | Select-Object SerialNumber, SMBIOSBIOSVersion
  os = Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber
  cpu = @(Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors)
  disks = @(Get-CimInstance Win32_DiskDrive | Select-Object Index, Model, SerialNumber, Size)
  media = $media
  nics = @(Get-CimInstance Win32_NetworkAdapter -Filter 'PhysicalAdapter=True' | Select-Object Name, MACAddress, InterfaceIndex)
  ips = @(Get-CimInstance Win32_NetworkAdapterConfiguration -Filter 'IPEnabled=True' | Select-Object InterfaceIndex, IPAddress)
} | ConvertTo-Json -Depth 4 -Compress
"""


def windows_hardware(r):
    out = run(["powershell.exe", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass",
               "-Command", WINDOWS_SCRIPT], timeout=180)
    data = json.loads(out) if out else {}
    system, product, bios, osinfo = (data.get(k) or {} for k in ("system", "product", "bios", "os"))

    r["manufacturer"] = system.get("Manufacturer")
    r["model"] = system.get("Model")
    r["memory_mb"] = (to_int(system.get("TotalPhysicalMemory")) or 0) // (1024 * 1024) or None
    r["serial_number"] = bios.get("SerialNumber") or product.get("IdentifyingNumber")
    r["bios_uuid"] = product.get("UUID")
    r["bios_version"] = bios.get("SMBIOSBIOSVersion")
    r["os_name"] = osinfo.get("Caption")
    r["os_version"] = osinfo.get("Version")
    r["kernel"] = osinfo.get("BuildNumber")

    cpus = as_list(data.get("cpu"))
    if cpus:
        r["cpu_model"] = cpus[0].get("Name")
        r["cpu_cores"] = sum(to_int(c.get("NumberOfCores")) or 0 for c in cpus) or None
        r["cpu_threads"] = sum(to_int(c.get("NumberOfLogicalProcessors")) or 0 for c in cpus) or None

    media = data.get("media") or {}
    kinds = {"SSD": "ssd", "HDD": "hdd", "4": "ssd", "3": "hdd"}
    r["disks"] = [{
        "name": "Disk %s" % d.get("Index"),
        "model": d.get("Model"),
        "serial": d.get("SerialNumber"),
        "size_gb": round((to_int(d.get("Size")) or 0) / 1e9, 1) or None,
        "kind": kinds.get(str(media.get(str(d.get("Index"))))),
    } for d in as_list(data.get("disks"))]

    ips = {}
    for cfg in as_list(data.get("ips")):
        ips[cfg.get("InterfaceIndex")] = [a for a in as_list(cfg.get("IPAddress")) if a and ":" not in a]
    r["nics"] = [{
        "name": n.get("Name"),
        "mac": n.get("MACAddress"),
        "ipv4": ips.get(n.get("InterfaceIndex"), []),
    } for n in as_list(data.get("nics")) if n.get("MACAddress")]


def windows_software(r):
    """Đọc danh sách ở Apps & Features từ registry (nhanh và đủ hơn Win32_Product)."""
    import winreg  # chỉ có trên Windows

    items = []
    path = r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"
    views = [
        (winreg.HKEY_LOCAL_MACHINE, winreg.KEY_WOW64_64KEY),
        (winreg.HKEY_LOCAL_MACHINE, winreg.KEY_WOW64_32KEY),
        (winreg.HKEY_CURRENT_USER, 0),
    ]
    for hive, view in views:
        try:
            root = winreg.OpenKey(hive, path, 0, winreg.KEY_READ | view)
        except OSError:
            continue
        with root:
            for index in range(winreg.QueryInfoKey(root)[0]):
                try:
                    with winreg.OpenKey(root, winreg.EnumKey(root, index)) as key:
                        def value(name):
                            try:
                                return winreg.QueryValueEx(key, name)[0]
                            except OSError:
                                return None
                        name = value("DisplayName")
                        # Bỏ bản vá và thành phần hệ thống: không hiện ở Apps & Features
                        if not name or value("SystemComponent") == 1 or value("ParentKeyName"):
                            continue
                        items.append({"name": name, "version": value("DisplayVersion")})
                except OSError:
                    continue
    r["software"] = items


def collect_windows(r):
    section(r, "phần cứng và hệ điều hành", windows_hardware)
    section(r, "phần mềm", windows_software)


# ============================== macOS ==============================

def profiler(*types):
    out = run(["system_profiler", "-json"] + list(types), timeout=300)
    return json.loads(out) if out else {}


def macos_hardware(r):
    data = profiler("SPHardwareDataType", "SPStorageDataType", "SPNetworkDataType")
    hw = (data.get("SPHardwareDataType") or [{}])[0]
    r["manufacturer"] = "Apple"
    r["model"] = hw.get("machine_model") or hw.get("machine_name")
    r["serial_number"] = hw.get("serial_number")
    r["bios_uuid"] = hw.get("platform_UUID")
    r["bios_version"] = hw.get("boot_rom_version")
    r["cpu_model"] = hw.get("chip_type") or hw.get("cpu_type")
    r["cpu_cores"] = to_int(str(hw.get("number_processors") or "").replace("proc", "").split(":")[0].strip())
    r["cpu_threads"] = os.cpu_count()
    r["cpu_cores"] = r["cpu_cores"] or to_int(run(["sysctl", "-n", "hw.physicalcpu"]))
    r["memory_mb"] = (to_int(run(["sysctl", "-n", "hw.memsize"])) or 0) // (1024 * 1024) or None

    seen, disks = set(), []
    for volume in data.get("SPStorageDataType") or []:
        drive = volume.get("physical_drive") or {}
        name = drive.get("device_name")
        if not name or name in seen:  # nhiều phân vùng nằm trên cùng một ổ
            continue
        seen.add(name)
        medium = str(drive.get("medium_type") or "").lower()
        disks.append({
            "name": name, "model": name, "serial": None,
            "size_gb": round((to_int(volume.get("size_in_bytes")) or 0) / 1e9, 1) or None,
            "kind": "ssd" if "ssd" in medium else "hdd" if "rotational" in medium else None,
        })
    r["disks"] = disks

    nics = []
    for nic in data.get("SPNetworkDataType") or []:
        mac = (nic.get("Ethernet") or {}).get("MAC Address")
        if mac:
            nics.append({"name": nic.get("_name"), "mac": mac,
                         "ipv4": as_list((nic.get("IPv4") or {}).get("Addresses"))})
    r["nics"] = nics


def macos_os(r):
    r["os_name"] = "macOS"
    r["os_version"] = (run(["sw_vers", "-productVersion"]) or "").strip() or platform.mac_ver()[0]
    r["kernel"] = platform.release()


def macos_software(r):
    data = profiler("SPApplicationsDataType")
    r["software"] = [{"name": app.get("_name"), "version": app.get("version")}
                     for app in data.get("SPApplicationsDataType") or [] if app.get("_name")]


def collect_macos(r):
    section(r, "phần cứng", macos_hardware)
    section(r, "hệ điều hành", macos_os)
    section(r, "phần mềm", macos_software)


# ============================== Gom báo cáo ==============================

def collect(server_url=None):
    system = platform.system()
    r = {
        "agent_version": AGENT_VERSION,
        "platform": {"Linux": "linux", "Windows": "windows", "Darwin": "macos"}.get(system, system.lower()),
        "hostname": socket.gethostname(),
        "disks": [], "nics": [], "software": [],
    }
    if system == "Linux":
        collect_linux(r)
    elif system == "Windows":
        collect_windows(r)
    elif system == "Darwin":
        collect_macos(r)
    else:
        log("Chưa hỗ trợ thu thập trên hệ điều hành %s; chỉ gửi tên máy." % system)

    # Card đang dùng để ra mạng: lấy theo địa chỉ IP dẫn tới máy chủ
    ip = primary_ip(server_url)
    r["ip_address"] = ip
    for nic in r.get("nics") or []:
        if ip and ip in (nic.get("ipv4") or []):
            r["mac_address"] = nic.get("mac")
    if not r.get("mac_address"):  # không xác định được: ưu tiên card đang có địa chỉ IP
        nics = [n for n in r.get("nics") or [] if n.get("mac")]
        nics.sort(key=lambda n: not n.get("ipv4"))
        r["mac_address"] = nics[0]["mac"] if nics else fallback_mac()
    return tidy(r)


def tidy(r):
    """Cắt mọi giá trị cho vừa giới hạn của máy chủ, để một dòng quá dài không làm hỏng cả báo cáo."""
    limits = {
        "agent_version": 20, "platform": 50, "hostname": 255, "serial_number": 100, "bios_uuid": 100,
        "manufacturer": 100, "model": 100, "bios_version": 100, "os_name": 150, "os_version": 100,
        "kernel": 100, "cpu_model": 200, "mac_address": 50, "ip_address": 50,
    }
    out = {key: cut(r.get(key), limit) for key, limit in limits.items()}
    for key in ("cpu_cores", "cpu_threads", "memory_mb"):
        out[key] = to_int(r.get(key))
    out["disks"] = [{
        "name": cut(d.get("name"), 100), "model": cut(d.get("model"), 200),
        "serial": cut(d.get("serial"), 100), "size_gb": d.get("size_gb"), "kind": cut(d.get("kind"), 20),
    } for d in (r.get("disks") or [])[:64]]
    out["nics"] = [{
        "name": cut(n.get("name"), 100), "mac": cut(n.get("mac"), 50),
        "ipv4": [cut(a, 50) for a in (n.get("ipv4") or [])[:16] if a],
    } for n in (r.get("nics") or [])[:64]]
    software, seen = [], set()
    for item in r.get("software") or []:
        name, version = cut(item.get("name"), 255), cut(item.get("version"), 100)
        if name and (name.lower(), version) not in seen:
            seen.add((name.lower(), version))
            software.append({"name": name, "version": version})
    software.sort(key=lambda s: s["name"].lower())
    out["software"] = software[:MAX_SOFTWARE]
    return out


# ============================== Cấu hình và gọi máy chủ ==============================

def default_config_path():
    if platform.system() == "Windows":
        return os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), "ITAM-Agent", "config.json")
    if hasattr(os, "geteuid") and os.geteuid() == 0:
        return "/etc/itam-agent/config.json"
    return os.path.join(os.path.expanduser("~"), ".config", "itam-agent", "config.json")


def load_config(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        sys.exit("Chưa có cấu hình ở %s. Chạy lệnh enroll trước (xem --help)." % path)


def save_config(path, config):
    """Tệp cấu hình chứa token của agent nên chỉ chủ tệp đọc được (trên Windows dựa vào quyền của thư mục)."""
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass


class ServerError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def post(config, path, body, token=None):
    """Gửi JSON tới máy chủ. Ném ServerError khi máy chủ từ chối, OSError khi không kết nối được."""
    headers = {"Content-Type": "application/json", "User-Agent": "itam-agent/" + AGENT_VERSION}
    if token:
        headers["Authorization"] = "Bearer " + token
    request = urllib.request.Request(config["server"].rstrip("/") + path, method="POST",
                                     data=json.dumps(body).encode("utf-8"), headers=headers)
    context = None
    if config["server"].lower().startswith("https"):
        context = ssl.create_default_context(cafile=config.get("ca_file") or None)
    try:
        with urllib.request.urlopen(request, timeout=60, context=context) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        try:
            detail = json.loads(err.read().decode("utf-8")).get("detail")
        except ValueError:
            detail = None
        if not isinstance(detail, str):
            detail = "Máy chủ từ chối (HTTP %s): %s" % (err.code, json.dumps(detail, ensure_ascii=False))
        raise ServerError(err.code, detail)
    except urllib.error.URLError as err:
        raise OSError(str(err.reason))


def warn_if_plain_http(server):
    host = urllib.parse.urlparse(server).hostname or ""
    if server.lower().startswith("http://") and host not in ("localhost", "127.0.0.1", "::1"):
        log("CẢNH BÁO: đang dùng http://. Token và dữ liệu đi qua mạng không mã hóa; nên dùng https://.")


def send_report(config):
    answer = post(config, "/api/agent/report", collect(config["server"]), token=config["token"])
    if answer.get("asset_tag"):
        log("Đã gửi báo cáo. Máy này là tài sản %s." % answer["asset_tag"])
    else:
        log("Đã gửi báo cáo. Máy đang chờ được xác nhận ở trang Agent trên máy chủ.")
    return answer


# ============================== Lệnh ==============================

def cmd_enroll(args):
    server = args.server.rstrip("/")
    if not re.match(r"^https?://", server, re.I):
        sys.exit("--server phải bắt đầu bằng https:// (hoặc http:// khi chạy thử).")
    warn_if_plain_http(server)
    config = {"server": server, "ca_file": args.ca_file}
    try:
        answer = post(config, "/api/agent/enroll", {
            "code": args.code.strip(), "hostname": cut(socket.gethostname(), 255),
            "platform": platform.system().lower(), "agent_version": AGENT_VERSION,
        })
    except ServerError as err:
        sys.exit("Kết nạp không thành công: %s" % err)
    except OSError as err:
        sys.exit("Không kết nối được máy chủ %s: %s" % (server, err))
    config.update(token=answer["token"], agent_id=answer["agent_id"],
                  interval_seconds=answer.get("interval_seconds") or DEFAULT_INTERVAL)
    save_config(args.config, config)
    log("Đã kết nạp (agent số %s). Cấu hình lưu ở %s" % (answer["agent_id"], args.config))
    try:
        send_report(config)
    except (ServerError, OSError) as err:
        log("Chưa gửi được báo cáo đầu tiên: %s. Lệnh run sẽ gửi lại." % err)


def cmd_run(args):
    config = load_config(args.config)
    warn_if_plain_http(config["server"])
    while True:
        wait = config.get("interval_seconds") or DEFAULT_INTERVAL
        try:
            answer = send_report(config)
            if answer.get("interval_seconds") and answer["interval_seconds"] != config.get("interval_seconds"):
                config["interval_seconds"] = wait = answer["interval_seconds"]
                save_config(args.config, config)
        except ServerError as err:
            log("Máy chủ từ chối báo cáo: %s" % err)
            if err.status == 401:  # agent đã bị thu hồi: thử lại cũng vô ích
                sys.exit(2)
            if args.once:
                sys.exit(1)
            wait = min(wait, RETRY_SECONDS)
        except OSError as err:
            # Mỗi báo cáo là ảnh chụp đầy đủ của máy, nên "gửi bù" chỉ cần gửi lại bản mới nhất
            log("Chưa gửi được (%s). Thử lại sau %s giây." % (err, min(wait, RETRY_SECONDS)))
            if args.once:
                sys.exit(1)
            wait = min(wait, RETRY_SECONDS)
        if args.once:
            return
        time.sleep(wait)


def cmd_show(args):
    print(json.dumps(collect(args.server), ensure_ascii=False, indent=2))


def main():
    for stream in (sys.stdout, sys.stderr):  # console Windows mặc định không in được tiếng Việt
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    parser = argparse.ArgumentParser(description="ITAM agent: gửi cấu hình máy này về máy chủ ITAM.")
    parser.add_argument("--config", default=default_config_path(),
                        help="tệp cấu hình của agent (mặc định: %(default)s)")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("enroll", help="kết nạp agent bằng mã kết nạp rồi gửi báo cáo đầu tiên")
    p.add_argument("--server", required=True, help="địa chỉ máy chủ ITAM, ví dụ https://itam.congty.vn")
    p.add_argument("--code", required=True, help="mã kết nạp lấy ở trang Agent")
    p.add_argument("--ca-file", help="tệp chứng chỉ CA nội bộ, nếu máy chủ dùng chứng chỉ tự ký")
    p.set_defaults(func=cmd_enroll)

    p = sub.add_parser("run", help="gửi báo cáo định kỳ")
    p.add_argument("--once", action="store_true", help="gửi một lần rồi thoát")
    p.set_defaults(func=cmd_run)

    p = sub.add_parser("show", help="in ra dữ liệu sẽ gửi, không gửi đi")
    p.add_argument("--server", help="địa chỉ máy chủ, chỉ để xác định card mạng đang dùng")
    p.set_defaults(func=cmd_show)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
