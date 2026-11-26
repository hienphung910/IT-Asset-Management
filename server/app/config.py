"""Đọc cấu hình từ file server/.env."""
import os
from pathlib import Path

from dotenv import load_dotenv

SERVER_DIR = Path(__file__).resolve().parent.parent  # thư mục server/
load_dotenv(SERVER_DIR / ".env")

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "itam")

# Tùy chọn: ghi đè toàn bộ chuỗi kết nối (VD: sqlite:///test.db để chạy thử không cần MySQL)
DATABASE_URL = os.getenv("DATABASE_URL")
