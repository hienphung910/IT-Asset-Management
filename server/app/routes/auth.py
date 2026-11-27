"""API tài khoản: đăng ký, đăng nhập, đăng xuất và quản lý tài khoản (chỉ admin)."""
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import USER_DISABLED, USER_PENDING, CustodyLog, Employee, EnrollmentCode, User
from ..permissions import PERMISSIONS, ROLE_LABELS, ROLE_PERMISSIONS, USER_MANAGE
from ..schemas import LoginIn, PasswordChangeIn, ProfileIn, RegisterIn, UserOut, UserUpdateIn
from ..services import auth

router = APIRouter(prefix="/api/auth", tags=["auth"])
users_router = APIRouter(prefix="/api/users", tags=["users"])

USERNAME_TAKEN = {"message": "Tên đăng nhập này đã có người dùng. Chọn tên khác.", "field": "username"}


# ---------- Đăng ký / đăng nhập (không cần đăng nhập trước) ----------

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    """Tài khoản mới luôn ở trạng thái chờ duyệt, bất kể vai trò; admin duyệt rồi mới đăng nhập được.
    Vai trò người đăng ký chọn chỉ là đề nghị: admin đổi được khi duyệt."""
    if db.scalar(select(User.id).where(User.username == data.username)):
        raise HTTPException(409, USERNAME_TAKEN)
    user = User(
        username=data.username, full_name=data.full_name,
        password_hash=auth.hash_password(data.password), role=data.role,
        status=USER_PENDING,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:  # hai người đăng ký cùng tên cùng lúc
        db.rollback()
        raise HTTPException(409, USERNAME_TAKEN)
    db.refresh(user)
    return user


@router.post("/login", response_model=UserOut)
def login(data: LoginIn, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.username == data.username))
    if not auth.verify_password(user.password_hash if user else None, data.password):
        # Không nói rõ sai tên hay sai mật khẩu, tránh lộ tài khoản nào có thật
        raise HTTPException(400, {"message": "Sai tên đăng nhập hoặc mật khẩu.", "field": "password"})
    # Chỉ báo trạng thái tài khoản sau khi mật khẩu đã đúng
    if user.status == USER_PENDING:
        raise HTTPException(403, "Tài khoản đang chờ admin duyệt. Bạn đăng nhập được sau khi được duyệt.")
    if user.status == USER_DISABLED:
        raise HTTPException(403, "Tài khoản đã bị khóa. Liên hệ admin để mở lại.")

    token = auth.create_session(db, user)
    response.set_cookie(
        auth.COOKIE_NAME, token, max_age=auth.SESSION_DAYS * 86400, path="/",
        httponly=True,   # JavaScript không đọc được cookie
        samesite="lax",  # trang web khác không gửi kèm được cookie khi POST
        secure=request.url.scheme == "https",
    )
    return user


@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(auth.COOKIE_NAME)
    if token:
        auth.delete_session(db, token)
    response.delete_cookie(auth.COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(auth.current_user)):
    return user


# ---------- Tự sửa tài khoản của mình (mọi vai trò) ----------

@router.patch("/me", response_model=UserOut)
def update_me(data: ProfileIn, db: Session = Depends(get_db), user: User = Depends(auth.current_user)):
    user.full_name = data.full_name
    db.commit()
    db.refresh(user)
    return user


@router.post("/password")
def change_password(data: PasswordChangeIn, request: Request, db: Session = Depends(get_db),
                    user: User = Depends(auth.current_user)):
    if not auth.verify_password(user.password_hash, data.current_password):
        raise HTTPException(400, {"message": "Mật khẩu hiện tại không đúng.", "field": "current_password"})
    if data.new_password == data.current_password:
        raise HTTPException(400, {"message": "Mật khẩu mới phải khác mật khẩu hiện tại.", "field": "new_password"})
    user.password_hash = auth.hash_password(data.new_password)
    # Đăng xuất các thiết bị khác, giữ lại phiên đang dùng
    auth.delete_user_sessions(db, user.id, keep_token=request.cookies.get(auth.COOKIE_NAME))
    db.commit()
    return {"ok": True}


# ---------- Quản lý tài khoản (quyền user.manage) ----------

can_manage_users = auth.require_perm(USER_MANAGE)


@router.get("/roles", dependencies=[Depends(can_manage_users)])
def role_matrix():
    """Bảng quyền theo vai trò, để trang Tài khoản hiển thị đúng những gì server đang áp dụng."""
    return {
        "roles": [{"code": code, "label": label} for code, label in ROLE_LABELS.items()],
        "permissions": [
            {"code": code, "label": label,
             "roles": [r for r in ROLE_LABELS if code in ROLE_PERMISSIONS.get(r, set())]}
            for code, label in PERMISSIONS.items()
        ],
    }


def _get_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "Không tìm thấy tài khoản.")
    return user


@users_router.get("", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), admin: User = Depends(can_manage_users)):
    return db.scalars(select(User).order_by(User.id)).all()


@users_router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdateIn, db: Session = Depends(get_db),
                admin: User = Depends(can_manage_users)):
    """Duyệt (status=active), khóa/mở khóa, đổi vai trò hoặc nối với hồ sơ nhân viên."""
    user = _get_user(db, user_id)
    if user.id == admin.id and (data.role is not None or data.status is not None):
        # Nhờ vậy hệ thống luôn còn ít nhất một admin đang hoạt động
        raise HTTPException(409, "Bạn không tự đổi vai trò hay khóa tài khoản của chính mình được.")
    if "employee_id" in data.model_fields_set:  # có gửi: số = nối, null = bỏ nối
        if data.employee_id is not None:
            if db.get(Employee, data.employee_id) is None:
                raise HTTPException(404, "Không tìm thấy nhân viên đã chọn.")
            other = db.scalar(select(User).where(User.employee_id == data.employee_id))
            if other and other.id != user.id:
                raise HTTPException(409, {
                    "message": f"Nhân viên này đã được nối với tài khoản {other.username}.",
                    "field": "employee_id",
                })
        user.employee_id = data.employee_id
    if data.role is not None:
        user.role = data.role
    if data.status is not None:
        user.status = data.status
        if data.status == USER_DISABLED:
            auth.delete_user_sessions(db, user.id)  # đăng xuất ngay khỏi mọi thiết bị
    db.commit()
    db.refresh(user)
    return user


@users_router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db),
                admin: User = Depends(can_manage_users)):
    """Xóa tài khoản (ví dụ từ chối yêu cầu đăng ký). Tài khoản đã có thao tác thì chỉ khóa được."""
    user = _get_user(db, user_id)
    if user.id == admin.id:
        raise HTTPException(409, "Bạn không tự xóa tài khoản của chính mình được.")
    if db.scalar(select(CustodyLog.id).where(CustodyLog.actor_id == user.id).limit(1)):
        raise HTTPException(
            409, "Tài khoản này đã có thao tác trong nhật ký nên không xóa được. Hãy khóa tài khoản thay cho xóa."
        )
    if db.scalar(select(EnrollmentCode.id).where(EnrollmentCode.created_by_id == user.id).limit(1)):
        raise HTTPException(
            409, "Tài khoản này đã tạo mã kết nạp agent nên không xóa được. Hãy khóa tài khoản thay cho xóa."
        )
    auth.delete_user_sessions(db, user.id)
    db.delete(user)
    db.commit()
