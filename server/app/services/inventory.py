"""Hợp nhất báo cáo của agent vào tài sản (NV-1.3.1).

Ba việc: tìm tài sản khớp với một máy vừa báo cáo, chép dữ liệu kỹ thuật của báo cáo vào tài
sản, và gắn / bỏ gắn một agent với một tài sản. Không hàm nào ở đây commit: người gọi commit
một lần để mọi thay đổi nằm cùng transaction.

Báo cáo KHÔNG BAO GIỜ ghi vào các trường do người quản lý: mã tài sản, tên, serial_number,
model_id (hãng, model, danh mục), người giữ, vị trí, trạng thái, ghi chú. Serial, hãng và model
mà máy tự báo nằm trong asset.hardware, để đối chiếu với phần người nhập.
"""
from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Agent, Asset, AssetSoftware

# Thứ tự ưu tiên khi so khớp, theo FR-1.3 của SRS: (khóa, nhãn để ghép vào câu thông báo)
MATCH_LABELS = {
    "serial": "serial",
    "bios_uuid": "BIOS UUID",
    "mac": "địa chỉ MAC",
    "hostname": "tên máy",
}

# Các cột của asset lấy thẳng từ báo cáo
_COLUMNS = ["hostname", "bios_uuid", "mac_address", "ip_address", "os_name", "os_version"]
# Phần còn lại của báo cáo gom vào asset.hardware
_HARDWARE_KEYS = [
    "platform", "serial_number", "manufacturer", "model", "bios_version", "kernel",
    "cpu_model", "cpu_cores", "cpu_threads", "memory_mb", "disks", "nics",
]

# Giá trị nhà sản xuất để mặc định khi không ghi serial / tên máy thật. Coi như không có,
# nếu không hàng loạt máy lắp ráp sẽ "trùng serial" với nhau.
_JUNK = {
    "0", "none", "null", "n/a", "na", "unknown", "default", "default string", "not specified",
    "not available", "not applicable", "to be filled by o.e.m.", "to be filled by oem",
    "system serial number", "system product name", "system manufacturer", "system version",
    "chassis serial number", "base board serial number", "oem", "o.e.m.", "empty", "invalid",
    "123456789", "0123456789", "1234567890", "serial", "xxxxxxxx",
    "localhost", "localhost.localdomain",
    # UUID mẫu của một số bo mạch chủ
    "03000200-0400-0500-0006-000700080009",
}


def now() -> datetime:
    """Giờ của máy chủ, không kèm múi giờ: cùng kiểu với CURRENT_TIMESTAMP mà MySQL ghi vào
    các cột created_at, để hai loại thời điểm hiện cạnh nhau không lệch múi giờ."""
    return datetime.now().replace(microsecond=0)


def meaningful(value: str | None) -> str | None:
    """Trả về giá trị nếu nó dùng được để nhận ra một máy, ngược lại trả None."""
    if not value:
        return None
    value = value.strip()
    low = value.lower()
    if not value or low in _JUNK:
        return None
    # Toàn một ký tự lặp lại (000000, FFFFFFFF, 00000000-0000-...) cũng là giá trị mặc định
    if len(set(low.replace("-", "").replace(":", "").replace(" ", ""))) <= 1:
        return None
    return value


def _macs(report: dict) -> list[str]:
    """Mọi địa chỉ MAC của máy. Laptop đổi giữa Wi-Fi và dây mạng nên không chỉ so card đang dùng."""
    found = [report.get("mac_address")] + [n.get("mac") for n in report.get("nics") or []]
    return list(dict.fromkeys(m for m in found if m))


def find_match(db: Session, agent: Agent) -> tuple[Asset | None, str | None, str | None]:
    """Tìm tài sản ứng với máy của agent theo thứ tự serial > BIOS UUID > MAC > tên máy.

    Trả về (tài sản, khớp theo khóa nào, None) khi chắc chắn; còn không thì
    (None, None, lý do) và máy nằm lại ở danh sách chờ người xác nhận."""
    report = agent.report or {}
    serial = meaningful(report.get("serial_number"))
    uuid = meaningful(report.get("bios_uuid"))
    hostname = meaningful(report.get("hostname"))
    # So bằng lower() ở cả hai vế: MySQL so không phân biệt hoa thường, SQLite thì có
    checks = [
        ("serial", serial, func.lower(Asset.serial_number) == (serial or "").lower()),
        ("bios_uuid", uuid, func.lower(Asset.bios_uuid) == (uuid or "").lower()),
        ("mac", ", ".join(_macs(report)), Asset.mac_address.in_(_macs(report))),
        ("hostname", hostname, func.lower(Asset.hostname) == (hostname or "").lower()),
    ]
    for key, value, condition in checks:
        if not value:
            continue
        found = db.scalars(select(Asset).where(condition).order_by(Asset.id).limit(4)).all()
        if not found:
            continue
        label = MATCH_LABELS[key]
        if len(found) > 1:
            tags = ", ".join(a.asset_tag for a in found[:3]) + ("…" if len(found) > 3 else "")
            return None, None, (
                f"Có nhiều tài sản cùng {label} với máy này ({tags}). "
                "Kiểm tra rồi gắn bằng tay vào đúng tài sản."
            )
        asset = found[0]
        other = db.scalar(select(Agent).where(Agent.asset_id == asset.id, Agent.id != agent.id))
        if other is not None:
            return None, None, (
                f"Khớp tài sản {asset.asset_tag} theo {label}, nhưng tài sản này đang gắn với agent "
                f"khác ({other.hostname or f'số {other.id}'}). Nếu đây là cùng một máy vừa cài lại "
                "agent thì thu hồi agent cũ."
            )
        if key != "serial" and serial and asset.serial_number \
                and asset.serial_number.strip().lower() != serial.lower():
            return None, None, (
                f"Trùng {label} với tài sản {asset.asset_tag} nhưng serial khác nhau (máy báo "
                f"{serial}, tài sản ghi {asset.serial_number}). Kiểm tra rồi gắn bằng tay nếu "
                "đúng là một máy."
            )
        return asset, key, None
    return None, None, "Không khớp tài sản nào đã có."


def _sync_software(db: Session, asset: Asset, software: list[dict]) -> None:
    """Đưa bảng asset_software về đúng danh sách vừa báo: chỉ thêm dòng mới và xóa dòng không
    còn, để một báo cáo không đổi gì thì không ghi gì."""
    def key(name: str, version: str) -> tuple[str, str]:
        return name.casefold(), version.casefold()

    wanted: dict[tuple[str, str], tuple[str, str]] = {}
    for item in software:
        name, version = item["name"], item.get("version") or ""
        wanted.setdefault(key(name, version), (name, version))

    rows = db.scalars(select(AssetSoftware).where(AssetSoftware.asset_id == asset.id)).all()
    have = set()
    for row in rows:
        k = key(row.name, row.version)
        if k in wanted and k not in have:
            have.add(k)
        else:
            db.delete(row)
    db.add_all(
        AssetSoftware(asset_id=asset.id, name=name, version=version)
        for k, (name, version) in wanted.items() if k not in have
    )


def apply_report(db: Session, asset: Asset, agent: Agent) -> None:
    """Chép báo cáo gần nhất của agent vào phần dữ liệu kỹ thuật của tài sản."""
    report = agent.report
    if not report:  # agent vừa kết nạp, chưa báo cáo lần nào
        return
    for column in _COLUMNS:
        setattr(asset, column, report.get(column))
    asset.hardware = {k: report.get(k) for k in _HARDWARE_KEYS}
    seen = agent.last_seen or now()
    asset.first_seen = asset.first_seen or seen
    asset.last_seen = seen
    _sync_software(db, asset, agent.software or [])


def link(db: Session, agent: Agent, asset: Asset, matched_by: str) -> None:
    """Gắn agent với tài sản và chép ngay báo cáo gần nhất sang."""
    agent.asset = asset
    agent.matched_by = matched_by
    agent.pending_reason = None
    apply_report(db, asset, agent)


def unlink(db: Session, agent: Agent, reason: str) -> Asset | None:
    """Bỏ gắn vì gắn nhầm: dữ liệu kỹ thuật đang ghi trên tài sản là của máy khác nên xóa đi.
    Agent quay về danh sách chờ xác nhận."""
    asset = agent.asset
    if asset is not None:
        for column in _COLUMNS:
            setattr(asset, column, None)
        asset.hardware = None
        asset.first_seen = asset.last_seen = None
        _sync_software(db, asset, [])
    agent.asset = None
    agent.matched_by = None
    agent.pending_reason = reason
    return asset
