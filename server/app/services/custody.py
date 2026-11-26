"""Quy tắc cấp phát / thu hồi / đổi trạng thái.

Mỗi hàm đổi tài sản + ghi custody_log rồi commit một lần (cùng 1 transaction).
"""
from sqlalchemy.orm import Session

from ..models import (
    ARCHIVED, DEPLOYED, READY, Asset, CustodyLog, Employee, Location,
)

STATUS_LABELS = {
    "ready": "Sẵn sàng cấp phát",
    "deployed": "Đang sử dụng",
    "maintenance": "Đang sửa chữa",
    "broken": "Hỏng / Chờ thanh lý",
    "archived": "Đã thanh lý",
}


class BusinessError(Exception):
    """Lỗi vi phạm quy tắc nghiệp vụ → trả về cho client kèm thông báo."""

    def __init__(self, message: str, status_code: int = 409):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def add_log(db: Session, asset: Asset, action: str, from_status: str | None,
            to_status: str | None, employee_id: int | None = None,
            location_id: int | None = None, note: str | None = None) -> None:
    db.add(CustodyLog(
        asset_id=asset.id, action=action, from_status=from_status, to_status=to_status,
        employee_id=employee_id, location_id=location_id, note=note,
    ))


def checkout(db: Session, asset: Asset, employee_id: int | None,
             location_id: int | None, note: str | None) -> Asset:
    if asset.status != READY:
        raise BusinessError(
            "Chỉ cấp phát được tài sản đang Sẵn sàng cấp phát. "
            f"Tài sản này đang ở trạng thái {STATUS_LABELS[asset.status]}."
        )
    if employee_id is not None and db.get(Employee, employee_id) is None:
        raise BusinessError("Không tìm thấy nhân viên đã chọn.", 404)
    if location_id is not None and db.get(Location, location_id) is None:
        raise BusinessError("Không tìm thấy vị trí đã chọn.", 404)

    asset.status = DEPLOYED
    asset.assigned_employee_id = employee_id
    asset.assigned_location_id = location_id
    add_log(db, asset, "checkout", READY, DEPLOYED, employee_id, location_id, note)
    db.commit()
    db.refresh(asset)
    return asset


def checkin(db: Session, asset: Asset, new_status: str, note: str | None) -> Asset:
    if asset.status != DEPLOYED:
        raise BusinessError("Tài sản này chưa được cấp phát nên không thu hồi được.")

    # Lưu lại ai/vị trí nào vừa trả tài sản
    prev_employee, prev_location = asset.assigned_employee_id, asset.assigned_location_id
    asset.status = new_status
    asset.assigned_employee_id = None
    asset.assigned_location_id = None
    add_log(db, asset, "checkin", DEPLOYED, new_status, prev_employee, prev_location, note)
    db.commit()
    db.refresh(asset)
    return asset


def change_status(db: Session, asset: Asset, new_status: str, note: str | None) -> Asset:
    if asset.status == DEPLOYED:
        raise BusinessError("Tài sản đang được cấp phát. Thu hồi trước rồi mới đổi trạng thái.")
    if asset.status == ARCHIVED:
        raise BusinessError("Tài sản đã thanh lý nên không đổi được trạng thái nữa.")
    if new_status == asset.status:
        raise BusinessError(f"Tài sản đang ở trạng thái {STATUS_LABELS[new_status]} rồi.")

    old_status = asset.status
    asset.status = new_status
    add_log(db, asset, "status", old_status, new_status, note=note)
    db.commit()
    db.refresh(asset)
    return asset
