"""API tài sản: thêm/sửa/xem, cấp phát, thu hồi, đổi trạng thái, lịch sử, QR."""
import io
from uuid import uuid4

import qrcode
from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    READY, STATUSES, Asset, AssetModel, Category, CustodyLog, Employee, Manufacturer, User,
)
from ..schemas import AssetIn, AssetOut, AssetPage, CheckinIn, CheckoutIn, LogOut, StatusIn
from ..services import custody
from ..services.auth import current_user, require_admin, require_manager

# Mọi route ở đây đều cần đăng nhập. Xem: mọi vai trò; cấp phát/thu hồi: quản lý trở lên;
# thêm/sửa tài sản và đổi trạng thái: chỉ admin.
router = APIRouter(prefix="/api/assets", tags=["assets"], dependencies=[Depends(current_user)])

DUPLICATE_MESSAGE = "Mã tài sản hoặc serial bị trùng với một tài sản khác."


def _get_asset(db: Session, asset_id: int, lock: bool = False) -> Asset:
    # lock=True: khóa dòng (SELECT ... FOR UPDATE) để 2 người không cấp phát cùng lúc
    asset = db.get(Asset, asset_id, with_for_update=lock)
    if asset is None:
        raise HTTPException(404, "Không tìm thấy tài sản này.")
    return asset


def _check_category(db: Session, category_id: int | None) -> None:
    if category_id is not None and db.get(Category, category_id) is None:
        raise HTTPException(404, "Không tìm thấy danh mục đã chọn.")


def _get_or_create(db: Session, model, where: list, **values):
    """Tìm một dòng theo điều kiện, chưa có thì tạo. Dùng SAVEPOINT để nếu request khác
    vừa tạo trùng thì chỉ hủy bước chèn này rồi đọc lại, không hỏng phần còn lại của transaction."""
    obj = db.scalar(select(model).where(*where))
    if obj is None:
        try:
            with db.begin_nested():
                obj = model(**values)
                db.add(obj)
                db.flush()
        except IntegrityError:
            obj = db.scalar(select(model).where(*where))
    return obj


def _resolve_model(db: Session, manufacturer: str | None, model: str | None,
                   category_id: int | None) -> AssetModel | None:
    """Đổi hãng + model người dùng nhập thành một dòng asset_model, kèm danh mục của model.
    So tên không phân biệt hoa thường, để "dell" và "Dell" là cùng một hãng.

    Danh mục thuộc về model: gửi category_id khác với danh mục hiện tại của model thì đổi
    danh mục của model đó (tức là của mọi tài sản cùng model); không gửi thì giữ nguyên."""
    if not manufacturer and not model:
        if category_id is not None:
            raise HTTPException(422, {
                "message": "Danh mục đi theo model: nhập hãng sản xuất và model trước khi chọn danh mục.",
                "field": "category_id",
            })
        return None
    if not manufacturer or not model:
        # Hãng chỉ được lưu thông qua model, nên không lưu được một trong hai
        raise HTTPException(422, {
            "message": "Hãng sản xuất và model đi cùng nhau: nhập cả hai hoặc để trống cả hai.",
            "field": "manufacturer" if not manufacturer else "model",
        })
    maker = _get_or_create(
        db, Manufacturer, [func.lower(Manufacturer.name) == manufacturer.lower()], name=manufacturer,
    )
    row = _get_or_create(
        db, AssetModel,
        [AssetModel.manufacturer_id == maker.id, func.lower(AssetModel.name) == model.lower()],
        manufacturer_id=maker.id, name=model, category_id=category_id,
    )
    if category_id is not None and row.category_id != category_id:
        # Gán qua quan hệ (không chỉ category_id) để dữ liệu trả về ngay sau đó đã là danh mục mới
        row.category = db.get(Category, category_id)
    return row


def _check_unique(db: Session, tag: str | None, serial: str | None, exclude_id: int | None = None) -> None:
    """Báo rõ trường nào bị trùng thay vì một câu lỗi chung."""
    if tag:
        other = db.scalar(select(Asset).where(Asset.asset_tag == tag))
        if other and other.id != exclude_id:
            raise HTTPException(409, {"message": f"Mã tài sản {tag} đã có trong hệ thống.", "field": "asset_tag"})
    if serial:
        other = db.scalar(select(Asset).where(Asset.serial_number == serial))
        if other and other.id != exclude_id:
            raise HTTPException(409, {"message": f"Serial {serial} đã gắn với tài sản {other.asset_tag}.", "field": "serial_number"})


@router.get("", response_model=AssetPage)
def list_assets(
    q: str | None = None,
    status: str | None = None,
    category_id: int | None = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    stmt = (select(Asset)
            .outerjoin(Employee, Asset.assigned_employee_id == Employee.id)
            .outerjoin(AssetModel, Asset.model_id == AssetModel.id))
    if q and q.strip():
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(
            Asset.asset_tag.like(like),
            Asset.name.like(like),
            Asset.serial_number.like(like),
            Employee.full_name.like(like),
        ))
    if status:
        stmt = stmt.where(Asset.status == status)
    if category_id:
        stmt = stmt.where(AssetModel.category_id == category_id)

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.scalars(stmt.order_by(Asset.id.desc()).offset((page - 1) * size).limit(size)).all()
    return AssetPage(
        items=[AssetOut.model_validate(a) for a in rows], total=total, page=page, size=size
    )


@router.get("/stats")
def asset_stats(db: Session = Depends(get_db)):
    """Đếm số tài sản theo trạng thái (cho các thẻ thống kê)."""
    counts = {s: 0 for s in STATUSES}
    for status, n in db.execute(select(Asset.status, func.count()).group_by(Asset.status)):
        counts[status] = n
    return {"total": sum(counts.values()), **counts}


@router.post("", response_model=AssetOut, status_code=201)
def create_asset(data: AssetIn, db: Session = Depends(get_db), actor: User = Depends(require_admin)):
    _check_category(db, data.category_id)
    values = data.model_dump()
    tag = values.pop("asset_tag")
    manufacturer, model = values.pop("manufacturer"), values.pop("model")
    category_id = values.pop("category_id")
    _check_unique(db, tag, data.serial_number)
    asset_model = _resolve_model(db, manufacturer, model, category_id)

    # Chưa có id thì chưa sinh được mã TS-xxxxxx → dùng mã tạm rồi đổi sau khi flush
    asset = Asset(**values, status=READY, asset_tag=tag or f"TMP-{uuid4().hex[:20]}",
                  asset_model=asset_model)
    db.add(asset)
    try:
        db.flush()
        if not tag:
            asset.asset_tag = f"TS-{asset.id:06d}"
        custody.add_log(db, asset, actor, "create", None, READY)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, DUPLICATE_MESSAGE)
    db.refresh(asset)
    return asset


@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(asset_id: int, db: Session = Depends(get_db)):
    return _get_asset(db, asset_id)


@router.put("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: int, data: AssetIn, db: Session = Depends(get_db),
                 actor: User = Depends(require_admin)):
    """Sửa thông tin. Không đổi trạng thái / người giữ qua đây."""
    asset = _get_asset(db, asset_id)
    _check_category(db, data.category_id)
    values = data.model_dump()
    if not values["asset_tag"]:
        values.pop("asset_tag")  # để trống thì giữ mã cũ
    manufacturer, model = values.pop("manufacturer"), values.pop("model")
    category_id = values.pop("category_id")
    _check_unique(db, values.get("asset_tag"), data.serial_number, exclude_id=asset.id)
    asset.asset_model = _resolve_model(db, manufacturer, model, category_id)
    for key, value in values.items():
        setattr(asset, key, value)
    custody.add_log(db, asset, actor, "update", None, None, note="Cập nhật thông tin")
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, DUPLICATE_MESSAGE)
    db.refresh(asset)
    return asset


@router.post("/{asset_id}/checkout", response_model=AssetOut)
def checkout_asset(asset_id: int, data: CheckoutIn, db: Session = Depends(get_db),
                   actor: User = Depends(require_manager)):
    asset = _get_asset(db, asset_id, lock=True)
    return custody.checkout(db, asset, actor, data.employee_id, data.location_id, data.note)


@router.post("/{asset_id}/checkin", response_model=AssetOut)
def checkin_asset(asset_id: int, data: CheckinIn, db: Session = Depends(get_db),
                  actor: User = Depends(require_manager)):
    asset = _get_asset(db, asset_id, lock=True)
    return custody.checkin(db, asset, actor, data.status, data.note)


@router.post("/{asset_id}/status", response_model=AssetOut)
def change_asset_status(asset_id: int, data: StatusIn, db: Session = Depends(get_db),
                        actor: User = Depends(require_admin)):
    asset = _get_asset(db, asset_id, lock=True)
    return custody.change_status(db, asset, actor, data.status, data.note)


@router.get("/{asset_id}/history", response_model=list[LogOut])
def asset_history(asset_id: int, db: Session = Depends(get_db)):
    _get_asset(db, asset_id)
    stmt = (select(CustodyLog).where(CustodyLog.asset_id == asset_id)
            .order_by(CustodyLog.id.desc()))
    return db.scalars(stmt).all()


@router.get("/{asset_id}/qr")
def asset_qr(asset_id: int, request: Request, db: Session = Depends(get_db)):
    """Ảnh QR chứa link tới trang chi tiết tài sản."""
    asset = _get_asset(db, asset_id)
    url = f"{str(request.base_url).rstrip('/')}/#/assets/{asset.id}"
    img = qrcode.make(url, box_size=8, border=2)
    buf = io.BytesIO()
    img.save(buf)
    return Response(buf.getvalue(), media_type="image/png")
