"""Các bảng dữ liệu."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# Trạng thái vòng đời tài sản
READY = "ready"              # Sẵn sàng cấp phát
DEPLOYED = "deployed"        # Đang sử dụng
MAINTENANCE = "maintenance"  # Đang sửa chữa
BROKEN = "broken"            # Hỏng / Chờ thanh lý
ARCHIVED = "archived"        # Đã thanh lý
STATUSES = [READY, DEPLOYED, MAINTENANCE, BROKEN, ARCHIVED]


class Category(Base):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)


class Location(Base):
    __tablename__ = "location"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True)


class Employee(Base):
    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    full_name: Mapped[str] = mapped_column(String(150))
    email: Mapped[str | None] = mapped_column(String(150))
    department: Mapped[str | None] = mapped_column(String(100))


class Asset(Base):
    __tablename__ = "asset"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("category.id"))
    status: Mapped[str] = mapped_column(String(20), default=READY, index=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    manufacturer: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    assigned_employee_id: Mapped[int | None] = mapped_column(ForeignKey("employee.id"))
    assigned_location_id: Mapped[int | None] = mapped_column(ForeignKey("location.id"))
    notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("CURRENT_TIMESTAMP"), onupdate=func.now()
    )

    # --- Module 1 (Discovery & Inventory): tạo sẵn, chưa dùng ---
    hostname: Mapped[str | None] = mapped_column(String(255))
    bios_uuid: Mapped[str | None] = mapped_column(String(100))
    mac_address: Mapped[str | None] = mapped_column(String(50))
    ip_address: Mapped[str | None] = mapped_column(String(50))
    os_name: Mapped[str | None] = mapped_column(String(150))
    os_version: Mapped[str | None] = mapped_column(String(100))
    hardware: Mapped[dict | None] = mapped_column(JSON)
    first_seen: Mapped[datetime | None] = mapped_column(DateTime)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime)

    category: Mapped[Category | None] = relationship(lazy="selectin")
    assigned_employee: Mapped[Employee | None] = relationship(lazy="selectin")
    assigned_location: Mapped[Location | None] = relationship(lazy="selectin")


class CustodyLog(Base):
    """Chuỗi lưu ký: mỗi thao tác trên tài sản ghi 1 dòng."""

    __tablename__ = "custody_log"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("asset.id"), index=True)
    action: Mapped[str] = mapped_column(String(20))  # create / update / checkout / checkin / status
    from_status: Mapped[str | None] = mapped_column(String(20))
    to_status: Mapped[str | None] = mapped_column(String(20))
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employee.id"))
    location_id: Mapped[int | None] = mapped_column(ForeignKey("location.id"))
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    employee: Mapped[Employee | None] = relationship(lazy="selectin")
    location: Mapped[Location | None] = relationship(lazy="selectin")
