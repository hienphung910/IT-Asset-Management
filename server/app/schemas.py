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


class EmployeeIn(InModel):
    code: str = Field(max_length=50)
    full_name: str = Field(max_length=150)
    email: str | None = Field(default=None, max_length=150)
    department: str | None = Field(default=None, max_length=100)

    @field_validator("full_name")
    @classmethod
    def _check_full_name(cls, v: str) -> str:
        """Gộp khoảng trắng thừa; chỉ cho chữ cái (có dấu), khoảng trắng và ' - ."""
        v = re.sub(r"\s+", " ", unicodedata.normalize("NFC", v)).strip()
        if not all(ch.isalpha() or ch in " '-." for ch in v):
            raise ValueError("Họ tên không được chứa số hoặc ký tự đặc biệt.")
        return v

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


# ---------- Tài sản ----------

class AssetIn(InModel):
    asset_tag: str | None = Field(default=None, max_length=50)  # để trống → tự sinh
    name: str = Field(max_length=200)
    category_id: int | None = None
    serial_number: str | None = Field(default=None, max_length=100)
    manufacturer: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    notes: str | None = None


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
    note: str | None
    created_at: datetime | None
