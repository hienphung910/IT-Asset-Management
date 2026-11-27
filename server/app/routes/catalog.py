"""API danh mục, vị trí, nhân viên."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Asset, Category, Employee, Location
from ..schemas import (
    AssetOut, CategoryIn, CategoryOut, EmployeeIn, EmployeeOut, LocationIn, LocationOut,
)
from ..services.auth import current_user, require_admin, require_manager

# Mọi route ở đây đều cần đăng nhập. Xem: mọi vai trò; sửa nhân viên: quản lý trở lên;
# sửa danh mục và vị trí: chỉ admin.
router = APIRouter(prefix="/api", tags=["catalog"], dependencies=[Depends(current_user)])
ADMIN_ONLY = [Depends(require_admin)]
MANAGER_UP = [Depends(require_manager)]


def _get_or_404(db: Session, model, obj_id: int, message: str):
    obj = db.get(model, obj_id)
    if obj is None:
        raise HTTPException(404, message)
    return obj


def _save(db: Session, obj, duplicate_message: str, field: str):
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Kèm tên ô bị trùng để giao diện đánh dấu đúng ô cần nhập lại
        raise HTTPException(409, {"message": duplicate_message, "field": field})
    db.refresh(obj)
    return obj


# ---------- Danh mục ----------

@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.post("/categories", response_model=CategoryOut, status_code=201, dependencies=ADMIN_ONLY)
def create_category(data: CategoryIn, db: Session = Depends(get_db)):
    obj = Category(**data.model_dump())
    db.add(obj)
    return _save(db, obj, f'Đã có danh mục "{data.name}".', "name")


@router.put("/categories/{category_id}", response_model=CategoryOut, dependencies=ADMIN_ONLY)
def update_category(category_id: int, data: CategoryIn, db: Session = Depends(get_db)):
    obj = _get_or_404(db, Category, category_id, "Không tìm thấy danh mục.")
    obj.name = data.name
    return _save(db, obj, f'Đã có danh mục "{data.name}".', "name")


# ---------- Vị trí ----------

@router.get("/locations", response_model=list[LocationOut])
def list_locations(db: Session = Depends(get_db)):
    return db.scalars(select(Location).order_by(Location.name)).all()


@router.post("/locations", response_model=LocationOut, status_code=201, dependencies=ADMIN_ONLY)
def create_location(data: LocationIn, db: Session = Depends(get_db)):
    obj = Location(**data.model_dump())
    db.add(obj)
    return _save(db, obj, f'Đã có vị trí "{data.name}".', "name")


@router.put("/locations/{location_id}", response_model=LocationOut, dependencies=ADMIN_ONLY)
def update_location(location_id: int, data: LocationIn, db: Session = Depends(get_db)):
    obj = _get_or_404(db, Location, location_id, "Không tìm thấy vị trí.")
    obj.name = data.name
    return _save(db, obj, f'Đã có vị trí "{data.name}".', "name")


# ---------- Nhân viên ----------

@router.get("/employees", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    return db.scalars(select(Employee).order_by(Employee.full_name)).all()


def _check_email_unique(db: Session, email: str | None, exclude_id: int | None = None) -> None:
    """Hai nhân viên không được dùng chung một email."""
    if not email:
        return
    other = db.scalar(select(Employee).where(func.lower(Employee.email) == email.lower()))
    if other and other.id != exclude_id:
        raise HTTPException(409, {
            "message": f"Email này đã gắn với nhân viên {other.code} ({other.full_name}).",
            "field": "email",
        })


@router.post("/employees", response_model=EmployeeOut, status_code=201, dependencies=MANAGER_UP)
def create_employee(data: EmployeeIn, db: Session = Depends(get_db)):
    _check_email_unique(db, data.email)
    obj = Employee(**data.model_dump())
    db.add(obj)
    return _save(db, obj, f"Mã nhân viên {data.code} đã được dùng cho người khác.", "code")


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, Employee, employee_id, "Không tìm thấy nhân viên.")


@router.put("/employees/{employee_id}", response_model=EmployeeOut, dependencies=MANAGER_UP)
def update_employee(employee_id: int, data: EmployeeIn, db: Session = Depends(get_db)):
    obj = _get_or_404(db, Employee, employee_id, "Không tìm thấy nhân viên.")
    _check_email_unique(db, data.email, exclude_id=obj.id)
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    return _save(db, obj, f"Mã nhân viên {data.code} đã được dùng cho người khác.", "code")


@router.get("/employees/{employee_id}/assets", response_model=list[AssetOut])
def employee_assets(employee_id: int, db: Session = Depends(get_db)):
    """Tài sản nhân viên đang giữ."""
    _get_or_404(db, Employee, employee_id, "Không tìm thấy nhân viên.")
    stmt = select(Asset).where(Asset.assigned_employee_id == employee_id).order_by(Asset.id)
    return db.scalars(stmt).all()
