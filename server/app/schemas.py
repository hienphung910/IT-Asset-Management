"""Kiểm tra dữ liệu gửi lên (In) và định dạng dữ liệu trả về (Out)."""
import re
import unicodedata
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class InModel(BaseModel):
    """Bỏ khoảng trắng thừa; chuỗi rỗng coi như không nhập (None)."""

    @field_validator("*", mode="before")
    @classmethod
    def _blank_to_none(cls, v):
        if isinstance(v, str):
            v = v.strip()
            return v or None
        return v


class OutModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Danh mục, vị trí, nhân viên ----------

class CategoryIn(InModel):
    name: str = Field(max_length=100)


class CategoryOut(OutModel):
    id: int
    name: str


class LocationIn(InModel):
    name: str = Field(max_length=150)


class LocationOut(OutModel):
    id: int
    name: str


EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]{2,}")


def clean_full_name(v: str) -> str:
    """Gộp khoảng trắng thừa; chỉ cho chữ cái (có dấu), khoảng trắng và ' - ."""
    v = re.sub(r"\s+", " ", unicodedata.normalize("NFC", v)).strip()
    if not all(ch.isalpha() or ch in " '-." for ch in v):
        raise ValueError("Họ tên không được chứa số hoặc ký tự đặc biệt.")
    return v


class EmployeeIn(InModel):
    code: str = Field(max_length=50)
    full_name: str = Field(max_length=150)
    email: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=100)

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, v: str) -> str:
        return clean_full_name(v)

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.lower()
        if not EMAIL_RE.fullmatch(v):
            raise ValueError("Email không hợp lệ. Nhập theo dạng ten@congty.vn.")
        return v


class EmployeeOut(OutModel):
    id: int
    code: str
    full_name: str
    email: str | None
    department: str | None


# ---------- Tài khoản đăng nhập ----------

USERNAME_RE = re.compile(r"[a-z0-9._-]{3,50}")
MIN_PASSWORD_LENGTH = 8


class RegisterIn(InModel):
    username: str = Field(max_length=50)
    full_name: str = Field(max_length=150)
    password: str = Field(max_length=128)
    # Không có "admin": admin chỉ do admin khác cấp. Trạng thái luôn là chờ duyệt, do server đặt.
    role: Literal["staff", "manager"] = "staff"

    @field_validator("username")
    @classmethod
    def _check_username(cls, v: str) -> str:
        v = v.lower()
        if not USERNAME_RE.fullmatch(v):
            raise ValueError("Tên đăng nhập dài 3-50 ký tự, chỉ gồm chữ không dấu, số và các dấu . _ -")
        return v

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, v: str) -> str:
        return clean_full_name(v)

    @field_validator("password")
    @classmethod
    def _check_password(cls, v: str) -> str:
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"Mật khẩu cần ít nhất {MIN_PASSWORD_LENGTH} ký tự.")
        return v


class LoginIn(InModel):
    username: str = Field(max_length=50)
    password: str = Field(max_length=128)

    @field_validator("username")
    @classmethod
    def _lower_username(cls, v: str) -> str:
        return v.lower()


class ProfileIn(InModel):
    """Người dùng tự sửa thông tin của mình. Tên đăng nhập và vai trò không đổi qua đây."""
    full_name: str = Field(max_length=150)

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, v: str) -> str:
        return clean_full_name(v)


class PasswordChangeIn(InModel):
    current_password: str = Field(max_length=128)
    new_password: str = Field(max_length=128)

    @field_validator("new_password")
    @classmethod
    def _check_new_password(cls, v: str) -> str:
        if len(v) < MIN_PASSWORD_LENGTH:
            raise ValueError(f"Mật khẩu cần ít nhất {MIN_PASSWORD_LENGTH} ký tự.")
        return v


class UserUpdateIn(InModel):
    """Admin sửa tài khoản: chỉ gửi trường muốn đổi. Duyệt tài khoản = đặt status thành active."""
    role: Literal["staff", "manager", "admin"] | None = None
    status: Literal["active", "disabled"] | None = None


class UserOut(OutModel):
    id: int
    username: str
    full_name: str
    role: str
    status: str
    created_at: datetime | None


class ActorOut(OutModel):
    id: int
    username: str
    full_name: str


# ---------- Tài sản ----------

class AssetIn(InModel):
    asset_tag: str | None = Field(default=None, max_length=50)  # để trống → tự sinh
    name: str = Field(max_length=200)
    category_id: int | None = None  # danh mục của model; áp dụng cho mọi tài sản cùng model
    serial_number: str | None = Field(default=None, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class ManufacturerOut(OutModel):
    id: int
    name: str


class AssetModelOut(OutModel):
    id: int
    name: str
    manufacturer: ManufacturerOut
    category_id: int | None
    category: CategoryOut | None


class AssetOut(OutModel):
    id: int
    asset_tag: str
    name: str
    status: str
    category_id: int | None
    category: CategoryOut | None
    serial_number: str | None
    manufacturer: str | None
    model: str | None
    notes: str | None
    assigned_employee: EmployeeOut | None
    assigned_location: LocationOut | None
    created_at: datetime | None
    updated_at: datetime | None


class AssetPage(BaseModel):
    items: list[AssetOut]
    total: int
    page: int
    size: int


class CheckoutIn(InModel):
    employee_id: int | None = None
    location_id: int | None = None
    note: str | None = None

    @model_validator(mode="after")
    def _exactly_one_target(self):
        if (self.employee_id is None) == (self.location_id is None):
            raise ValueError("Chọn đúng một nơi nhận: một nhân viên hoặc một vị trí.")
        return self


class CheckinIn(InModel):
    status: Literal["ready", "maintenance", "broken"] = "ready"
    note: str | None = None


class StatusIn(InModel):
    status: Literal["ready", "maintenance", "broken", "archived"]
    note: str | None = None


class LogOut(OutModel):
    id: int
    action: str
    from_status: str | None
    to_status: str | None
    employee: EmployeeOut | None
    location: LocationOut | None
    actor: ActorOut | None
    note: str | None
    created_at: datetime | None
