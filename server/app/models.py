"""Các bảng dữ liệu."""
from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base
from .permissions import ROLE_ENDUSER, permissions_of

# Trạng thái vòng đời tài sản
READY = "ready"              # Sẵn sàng cấp phát
DEPLOYED = "deployed"        # Đang sử dụng
MAINTENANCE = "maintenance"  # Đang sửa chữa
BROKEN = "broken"            # Hỏng / Chờ thanh lý
ARCHIVED = "archived"        # Đã thanh lý
STATUSES = [READY, DEPLOYED, MAINTENANCE, BROKEN, ARCHIVED]

# Vai trò và quyền của tài khoản nằm ở app/permissions.py

# Trạng thái tài khoản
USER_ACTIVE = "active"      # Đăng nhập được
USER_PENDING = "pending"    # Mới đăng ký, chờ admin duyệt
USER_DISABLED = "disabled"  # Bị admin khóa


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


class User(Base):
    """Tài khoản đăng nhập. Tách khỏi Employee: nhân viên giữ tài sản chưa chắc có tài khoản."""

    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True)  # luôn lưu chữ thường
    full_name: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default=ROLE_ENDUSER)
    status: Mapped[str] = mapped_column(String(20), default=USER_ACTIVE)
    # Hồ sơ nhân viên của người dùng tài khoản này (do admin nối). Vai trò Nhân viên
    # dựa vào đây để biết "tài sản của tôi" là tài sản nào. Mỗi nhân viên nối tối đa một tài khoản.
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employee.id"), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    employee: Mapped[Employee | None] = relationship(lazy="joined")

    @property
    def permissions(self) -> list[str]:
        """Các quyền của tài khoản theo vai trò; giao diện dùng để ẩn/hiện nút."""
        return permissions_of(self.role)


class UserSession(Base):
    """Phiên đăng nhập. Chỉ lưu mã băm của token; token thật nằm trong cookie của trình duyệt."""

    __tablename__ = "user_session"

    id: Mapped[int] = mapped_column(primary_key=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)

    user: Mapped[User] = relationship(lazy="joined")


class Manufacturer(Base):
    """Hãng sản xuất."""

    __tablename__ = "manufacturer"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)


class AssetModel(Base):
    """Dòng máy (model) của một hãng, xác định bằng cặp (hãng, tên model): hai hãng có thể
    đặt trùng tên model.

    Danh mục nằm ở đây chứ không nằm ở asset: biết model là biết danh mục (Latitude 5420
    luôn là Laptop), nên nếu ghi danh mục trên từng tài sản thì model_id sẽ quyết định một
    cột không khóa và bảng asset không còn đạt chuẩn BCNF."""

    __tablename__ = "asset_model"
    __table_args__ = (UniqueConstraint("manufacturer_id", "name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    manufacturer_id: Mapped[int] = mapped_column(ForeignKey("manufacturer.id"))
    name: Mapped[str] = mapped_column(String(100))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("category.id"))

    manufacturer: Mapped[Manufacturer] = relationship(lazy="joined")
    category: Mapped[Category | None] = relationship(lazy="joined")


class Asset(Base):
    __tablename__ = "asset"

    id: Mapped[int] = mapped_column(primary_key=True)
    asset_tag: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default=READY, index=True)
    serial_number: Mapped[str | None] = mapped_column(String(100), unique=True)
    # Hãng, model và danh mục không lưu ở đây, chỉ trỏ tới asset_model (xem AssetModel)
    model_id: Mapped[int | None] = mapped_column(ForeignKey("asset_model.id"))
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

    asset_model: Mapped[AssetModel | None] = relationship(lazy="selectin")
    assigned_employee: Mapped[Employee | None] = relationship(lazy="selectin")
    assigned_location: Mapped[Location | None] = relationship(lazy="selectin")

    # API vẫn trả hãng, model và danh mục như trước; các giá trị này đọc qua asset_model
    @property
    def manufacturer(self) -> str | None:
        return self.asset_model.manufacturer.name if self.asset_model else None

    @property
    def model(self) -> str | None:
        return self.asset_model.name if self.asset_model else None

    @property
    def category_id(self) -> int | None:
        return self.asset_model.category_id if self.asset_model else None

    @property
    def category(self) -> Category | None:
        return self.asset_model.category if self.asset_model else None


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
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("user.id"))  # tài khoản đã thao tác
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    employee: Mapped[Employee | None] = relationship(lazy="selectin")
    location: Mapped[Location | None] = relationship(lazy="selectin")
    actor: Mapped[User | None] = relationship(lazy="selectin")
