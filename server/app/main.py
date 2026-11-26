"""Điểm khởi động server.

Chạy (trong thư mục server):  .venv\\Scripts\\python -m uvicorn app.main:app --reload --port 8000
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from .config import SERVER_DIR
from .database import init_db
from .routes import assets, catalog
from .services.custody import BusinessError


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()  # tự tạo database + bảng nếu chưa có
    except OperationalError as exc:
        raise RuntimeError(
            "Không kết nối được MySQL. Kiểm tra: (1) đã bật service MySQL80 chưa, "
            "(2) DB_USER / DB_PASSWORD trong server/.env đã đúng chưa."
        ) from exc
    yield


app = FastAPI(title="ITAM · Quản lý tài sản CNTT", lifespan=lifespan)


@app.exception_handler(BusinessError)
async def business_error_handler(request: Request, exc: BusinessError):
    return JSONResponse({"detail": exc.message}, status_code=exc.status_code)


app.include_router(catalog.router)
app.include_router(assets.router)

# Web UI (đặt cuối cùng để không che các đường dẫn /api và /docs)
app.mount("/", StaticFiles(directory=SERVER_DIR / "static", html=True), name="static")
