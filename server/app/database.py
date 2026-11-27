"""Kết nối database, tự tạo database + bảng khi khởi động."""
import re

from sqlalchemy import create_engine, select, text
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from . import config


class Base(DeclarativeBase):
    pass


def _mysql_url(database: str | None) -> URL:
    # URL.create tự xử lý ký tự đặc biệt trong mật khẩu (@, #, /...)
    return URL.create(
        "mysql+pymysql",
        username=config.DB_USER,
        password=config.DB_PASSWORD or None,
        host=config.DB_HOST,
        port=config.DB_PORT,
        database=database,
        query={"charset": "utf8mb4"},
    )


if config.DATABASE_URL:
    _url = config.DATABASE_URL
    _connect_args = {"check_same_thread": False} if _url.startswith("sqlite") else {}
else:
    _url = _mysql_url(config.DB_NAME)
    _connect_args = {}

engine = create_engine(_url, pool_pre_ping=True, connect_args=_connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_mysql_database() -> None:
    if not re.fullmatch(r"[A-Za-z0-9_]+", config.DB_NAME):
        raise ValueError("DB_NAME chỉ được chứa chữ, số và dấu gạch dưới")
    server_engine = create_engine(_mysql_url(None))
    try:
        with server_engine.connect() as conn:
            conn.execute(text(
                f"CREATE DATABASE IF NOT EXISTS `{config.DB_NAME}` "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            ))
    finally:
        server_engine.dispose()


DEFAULT_CATEGORIES = ["Laptop", "PC", "Màn hình", "Điện thoại", "Thiết bị mạng"]


def init_db() -> None:
    from . import models  # noqa: F401  (đăng ký các bảng vào Base.metadata)

    if not config.DATABASE_URL:
        _ensure_mysql_database()
    Base.metadata.create_all(engine)

    with SessionLocal() as db:
        if db.scalar(select(models.Category.id).limit(1)) is None:
            db.add_all(models.Category(name=n) for n in DEFAULT_CATEGORIES)
            db.commit()
        _ensure_admin(db)


def _ensure_admin(db) -> None:
    """Tạo tài khoản admin đầu tiên từ .env. Không có admin thì không ai duyệt được tài khoản."""
    from . import models
    from .schemas import USERNAME_RE
    from .services.auth import MIN_PASSWORD_LENGTH, hash_password

    if db.scalar(select(models.User.id).where(models.User.role == models.ROLE_ADMIN).limit(1)):
        return
    if len(config.ADMIN_PASSWORD) < MIN_PASSWORD_LENGTH:
        raise RuntimeError(
            "Hệ thống chưa có tài khoản admin. Thêm ADMIN_PASSWORD "
            f"(ít nhất {MIN_PASSWORD_LENGTH} ký tự) vào server/.env rồi chạy lại server."
        )
    if not USERNAME_RE.fullmatch(config.ADMIN_USERNAME):
        raise RuntimeError("ADMIN_USERNAME trong server/.env không hợp lệ (3-50 ký tự: chữ thường, số, . _ -).")
    if db.scalar(select(models.User.id).where(models.User.username == config.ADMIN_USERNAME)):
        raise RuntimeError(
            f'Tên đăng nhập "{config.ADMIN_USERNAME}" đã thuộc về một tài khoản không phải admin. '
            "Đổi ADMIN_USERNAME trong server/.env rồi chạy lại server."
        )
    db.add(models.User(
        username=config.ADMIN_USERNAME, full_name="Quản trị viên",
        password_hash=hash_password(config.ADMIN_PASSWORD),
        role=models.ROLE_ADMIN, status=models.USER_ACTIVE,
    ))
    db.commit()
