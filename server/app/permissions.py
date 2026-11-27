"""Vai trò và bảng quyền (NT-2). Đây là nơi duy nhất quyết định vai trò nào được làm gì.

Route kiểm tra theo TÊN QUYỀN (require_perm trong services/auth.py), không theo vai trò,
nên đổi phân quyền chỉ cần sửa bảng ROLE_PERMISSIONS ở đây. Giao diện không giữ bản sao:
server trả danh sách quyền của tài khoản qua /api/auth/me.
"""

# ---------- Vai trò (theo mục 2 của SRS) ----------
ROLE_ADMIN = "admin"        # Quản trị hệ thống (Super Admin)
ROLE_INFRA = "infra"        # Quản trị hạ tầng (IT Infrastructure / System Admin)
ROLE_MANAGER = "manager"    # Quản lý tài sản (Asset / Procurement Manager)
ROLE_HELPDESK = "helpdesk"  # Helpdesk / Service Desk Agent
ROLE_AUDITOR = "auditor"    # Kiểm toán: xem được mọi thứ, không sửa gì
ROLE_ENDUSER = "enduser"    # Nhân viên: chỉ thấy tài sản mình đang giữ

ROLE_LABELS = {
    ROLE_ADMIN: "Quản trị hệ thống",
    ROLE_INFRA: "Quản trị hạ tầng",
    ROLE_MANAGER: "Quản lý tài sản",
    ROLE_HELPDESK: "Helpdesk",
    ROLE_AUDITOR: "Kiểm toán",
    ROLE_ENDUSER: "Nhân viên",
}
ROLES = list(ROLE_LABELS)
# Vai trò được chọn khi tự đăng ký. Admin chỉ do admin khác cấp.
SELF_REGISTER_ROLES = [r for r in ROLES if r != ROLE_ADMIN]

# ---------- Quyền ----------
VIEW_ALL = "asset.view_all"
ASSET_WRITE = "asset.write"
ASSET_STATUS = "asset.status"
ASSET_CUSTODY = "asset.custody"
EMPLOYEE_MANAGE = "employee.manage"
CATALOG_MANAGE = "catalog.manage"
USER_MANAGE = "user.manage"
# Ba quyền nhạy cảm của các module sau. Khai báo sẵn để tách riêng ngay từ đầu;
# chưa có chức năng nào dùng tới.
SCAN_CREDENTIAL_VIEW = "scan.credential.view"
REMOTE_SCRIPT_RUN = "remote.script.run"
REPORT_SQL_QUERY = "report.sql.query"

PERMISSIONS = {
    VIEW_ALL: "Xem mọi tài sản, lịch sử, nhân viên, vị trí, danh mục",
    ASSET_WRITE: "Thêm và sửa tài sản",
    ASSET_STATUS: "Đổi trạng thái tài sản, kể cả thanh lý",
    ASSET_CUSTODY: "Cấp phát và thu hồi tài sản",
    EMPLOYEE_MANAGE: "Thêm và sửa nhân viên",
    CATALOG_MANAGE: "Thêm và sửa danh mục, vị trí",
    USER_MANAGE: "Duyệt, khóa, đổi vai trò và nối tài khoản với nhân viên",
    SCAN_CREDENTIAL_VIEW: "Xem thông tin xác thực dùng để quét mạng (Module 1, chưa có)",
    REMOTE_SCRIPT_RUN: "Chạy script từ xa (Module 6, chưa có)",
    REPORT_SQL_QUERY: "Viết truy vấn SQL trực tiếp (Module 7, chưa có)",
}

# Vai trò không có trong bảng (hoặc giá trị lạ trong database) thì không có quyền nào.
# Tài khoản không có VIEW_ALL chỉ thấy tài sản đang giao cho hồ sơ nhân viên của mình.
ROLE_PERMISSIONS = {
    ROLE_ADMIN: set(PERMISSIONS),
    ROLE_INFRA: {VIEW_ALL, SCAN_CREDENTIAL_VIEW, REMOTE_SCRIPT_RUN, REPORT_SQL_QUERY},
    # SRS giao việc nhập kho và thanh lý cho Quản lý tài sản (CC-7 đã chốt)
    ROLE_MANAGER: {VIEW_ALL, ASSET_WRITE, ASSET_STATUS, ASSET_CUSTODY, EMPLOYEE_MANAGE},
    ROLE_HELPDESK: {VIEW_ALL},
    ROLE_AUDITOR: {VIEW_ALL},
    ROLE_ENDUSER: set(),
}


def permissions_of(role: str) -> list[str]:
    """Danh sách quyền của một vai trò, theo đúng thứ tự khai báo trong PERMISSIONS."""
    granted = ROLE_PERMISSIONS.get(role, set())
    return [p for p in PERMISSIONS if p in granted]


def has_permission(role: str, permission: str) -> bool:
    return permission in ROLE_PERMISSIONS.get(role, set())
