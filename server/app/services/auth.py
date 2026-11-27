"""Mật khẩu, phiên đăng nhập và kiểm tra quyền theo vai trò."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import USER_ACTIVE, User, UserSession
from ..permissions import has_permission
from ..schemas import MIN_PASSWORD_LENGTH  # noqa: F401  (database.py dùng lại)

COOKIE_NAME = "itam_session"
SESSION_DAYS = 7

_hasher = PasswordHasher()  # Argon2id, tự sinh salt
# Dùng khi tên đăng nhập không tồn tại, để thời gian trả lời không lộ tài khoản nào có thật
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    try:
        return _hasher.verify(password_hash or _DUMMY_HASH, password) and password_hash is not None
    except (VerificationError, InvalidHashError):
        return False


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, user: User) -> str:
    """Tạo phiên mới và trả về token để đặt vào cookie. Tiện thể dọn các phiên đã hết hạn."""
    db.execute(delete(UserSession).where(UserSession.expires_at < _now()))
    token = secrets.token_urlsafe(32)
    db.add(UserSession(
        token_hash=hash_token(token), user_id=user.id,
        expires_at=_now() + timedelta(days=SESSION_DAYS),
    ))
    db.commit()
    return token


def delete_session(db: Session, token: str) -> None:
    db.execute(delete(UserSession).where(UserSession.token_hash == hash_token(token)))
    db.commit()


def delete_user_sessions(db: Session, user_id: int, keep_token: str | None = None) -> None:
    """Đăng xuất tài khoản khỏi mọi thiết bị, trừ phiên keep_token nếu có
    (chưa commit, để gộp vào transaction của người gọi)."""
    stmt = delete(UserSession).where(UserSession.user_id == user_id)
    if keep_token:
        stmt = stmt.where(UserSession.token_hash != hash_token(keep_token))
    db.execute(stmt)


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Tài khoản đang đăng nhập. Vai trò và trạng thái đọc lại từ database ở mỗi request,
    nên khóa tài khoản hay đổi vai trò có hiệu lực ngay."""
    token = request.cookies.get(COOKIE_NAME)
    if token:
        session = db.scalar(select(UserSession).where(UserSession.token_hash == hash_token(token)))
        if session and session.expires_at > _now() and session.user.status == USER_ACTIVE:
            return session.user
    raise HTTPException(401, "Bạn cần đăng nhập để tiếp tục.")


def require_perm(permission: str):
    """Dependency cho route: tài khoản đang đăng nhập phải có quyền này (xem permissions.py)."""
    def checker(user: User = Depends(current_user)) -> User:
        if not has_permission(user.role, permission):
            raise HTTPException(403, "Tài khoản của bạn không có quyền làm thao tác này.")
        return user
    return checker
