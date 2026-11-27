"""API quét qua agent (Module 1, FR-1.2): mã kết nạp, kết nạp, nhận báo cáo, xử lý máy chờ xác nhận.

Có hai nhóm route, xác thực theo hai cách khác nhau:
- machine_router (/api/agent/...): do AGENT trên máy trạm gọi. Không dùng phiên đăng nhập;
  kết nạp bằng mã kết nạp, báo cáo bằng token riêng của agent (header Authorization: Bearer).
- router (/api/agents, /api/enrollment-codes): do NGƯỜI dùng giao diện gọi, cần đăng nhập
  và đúng quyền như mọi route khác.
"""
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import config
from ..database import get_db
from ..models import AGENT_ACTIVE, AGENT_REVOKED, Agent, Asset, EnrollmentCode, User
from ..permissions import AGENT_LINK, AGENT_MANAGE, ASSET_WRITE, VIEW_ALL
from ..schemas import (
    AgentEnrollIn, AgentLinkIn, AgentOut, AgentReportIn, AssetIn, EnrollmentCodeCreated,
    EnrollmentCodeIn, EnrollmentCodeOut,
)
from ..services import custody, inventory
from ..services.auth import hash_token, require_perm
from .assets import add_asset

AGENT_SCRIPT = config.SERVER_DIR / "agent" / "itam_agent.py"


# =====================================================================================
# Phía máy trạm: agent gọi
# =====================================================================================
# Mã lỗi: 403 = mã kết nạp sai hoặc đã thu hồi; 401 = token agent sai hoặc agent đã bị thu hồi.
machine_router = APIRouter(prefix="/api/agent", tags=["agent (máy trạm gọi)"])


def _interval_seconds() -> int:
    return config.AGENT_REPORT_INTERVAL_MINUTES * 60


def _remote_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def current_agent(request: Request, db: Session = Depends(get_db)) -> Agent:
    """Agent đang gọi, nhận ra bằng token trong header Authorization. Trạng thái đọc lại từ
    database ở mỗi lần gọi, nên thu hồi agent có hiệu lực ngay."""
    scheme, _, token = request.headers.get("Authorization", "").partition(" ")
    if scheme.lower() == "bearer" and token.strip():
        agent = db.scalar(select(Agent).where(Agent.token_hash == hash_token(token.strip())))
        if agent is not None and agent.status == AGENT_ACTIVE:
            return agent
    raise HTTPException(401, "Token của agent không hợp lệ hoặc agent đã bị thu hồi. Kết nạp lại bằng một mã kết nạp mới.")


@machine_router.get("/script", include_in_schema=False)
def download_script():
    """Tệp agent để tải về máy trạm. Công khai như file static: trong tệp không có bí mật nào."""
    if not AGENT_SCRIPT.is_file():
        raise HTTPException(404, "Máy chủ này không có tệp agent.")
    return FileResponse(AGENT_SCRIPT, media_type="text/x-python", filename=AGENT_SCRIPT.name)


@machine_router.post("/enroll", status_code=201)
def enroll(data: AgentEnrollIn, request: Request, db: Session = Depends(get_db)):
    """Đổi mã kết nạp lấy một token riêng cho agent này. Token chỉ trả về đúng một lần."""
    code = db.scalar(select(EnrollmentCode).where(EnrollmentCode.code_hash == hash_token(data.code)))
    if code is None:
        raise HTTPException(403, "Mã kết nạp không đúng.")
    if code.revoked_at is not None:
        raise HTTPException(403, "Mã kết nạp này đã bị thu hồi.")

    token = secrets.token_urlsafe(32)
    agent = Agent(
        token_hash=hash_token(token), status=AGENT_ACTIVE, enrollment_code_id=code.id,
        hostname=data.hostname, platform=data.platform, agent_version=data.agent_version,
        remote_ip=_remote_ip(request), enrolled_at=inventory.now(),
        pending_reason="Vừa kết nạp, chưa gửi báo cáo nào.",
    )
    db.add(agent)
    db.commit()
    return {"agent_id": agent.id, "token": token, "interval_seconds": _interval_seconds()}


@machine_router.post("/report")
def report(data: AgentReportIn, request: Request, db: Session = Depends(get_db),
           agent: Agent = Depends(current_agent)):
    """Nhận một báo cáo cấu hình. Agent chưa gắn với tài sản nào thì thử so khớp lại ở mỗi lần
    báo cáo; khớp chắc chắn thì tự gắn, không thì máy nằm ở danh sách chờ xác nhận."""
    payload = data.model_dump()  # chỉ lưu dữ liệu đã qua kiểm tra, không lưu nguyên body
    agent.software = payload.pop("software")
    agent.report = payload
    agent.hostname = data.hostname or agent.hostname
    agent.platform = data.platform or agent.platform
    agent.agent_version = data.agent_version or agent.agent_version
    agent.remote_ip = _remote_ip(request)
    agent.last_seen = inventory.now()

    if agent.asset is None:
        asset, matched_by, reason = inventory.find_match(db, agent)
        if asset is not None:
            inventory.link(db, agent, asset, matched_by)
        else:
            agent.pending_reason = reason
    else:
        inventory.apply_report(db, agent.asset, agent)
    try:
        db.commit()
    except IntegrityError:  # một agent khác vừa được gắn vào cùng tài sản
        db.rollback()
        raise HTTPException(409, "Tài sản vừa được gắn với một agent khác. Báo cáo sẽ được nhận ở lần gửi sau.")
    return {
        "ok": True,
        "interval_seconds": _interval_seconds(),
        "asset_tag": agent.asset.asset_tag if agent.asset else None,
    }


# =====================================================================================
# Phía giao diện: người dùng gọi
# =====================================================================================
# Danh sách agent có tên máy, IP, serial của cả công ty nên cần quyền xem toàn bộ.
# Route ghi cần thêm quyền riêng (xem permissions.py).
router = APIRouter(prefix="/api", tags=["agents"], dependencies=[Depends(require_perm(VIEW_ALL))])
CAN_MANAGE = Depends(require_perm(AGENT_MANAGE))


def _get_agent(db: Session, agent_id: int) -> Agent:
    agent = db.get(Agent, agent_id)
    if agent is None:
        raise HTTPException(404, "Không tìm thấy agent này.")
    return agent


def _get_pending_agent(db: Session, agent_id: int) -> Agent:
    """Agent đang chờ xác nhận: còn hoạt động và chưa gắn với tài sản nào."""
    agent = _get_agent(db, agent_id)
    if agent.status != AGENT_ACTIVE:
        raise HTTPException(409, "Agent này đã bị thu hồi.")
    if agent.asset is not None:
        raise HTTPException(409, f"Agent này đã gắn với tài sản {agent.asset.asset_tag}.")
    return agent


def _machine_name(agent: Agent) -> str:
    return agent.hostname or f"agent số {agent.id}"


# ---------- Mã kết nạp ----------

def _code_out(code: EnrollmentCode, agent_count: int = 0, plain: str | None = None) -> dict:
    out = {
        "id": code.id, "name": code.name, "hint": code.hint, "created_by": code.created_by,
        "created_at": code.created_at, "revoked_at": code.revoked_at, "agent_count": agent_count,
    }
    if plain is not None:
        out["code"] = plain
    return out


@router.get("/enrollment-codes", response_model=list[EnrollmentCodeOut], dependencies=[CAN_MANAGE])
def list_codes(db: Session = Depends(get_db)):
    counts = dict(db.execute(
        select(Agent.enrollment_code_id, func.count()).group_by(Agent.enrollment_code_id)
    ).all())
    codes = db.scalars(select(EnrollmentCode).order_by(EnrollmentCode.id.desc())).all()
    return [_code_out(c, counts.get(c.id, 0)) for c in codes]


@router.post("/enrollment-codes", response_model=EnrollmentCodeCreated, status_code=201)
def create_code(data: EnrollmentCodeIn, db: Session = Depends(get_db),
                actor: User = Depends(require_perm(AGENT_MANAGE))):
    """Tạo mã kết nạp. Mã thật chỉ có trong câu trả lời này; database chỉ giữ mã băm."""
    plain = "ITAM-" + secrets.token_urlsafe(24)
    code = EnrollmentCode(name=data.name, code_hash=hash_token(plain), hint=plain[:9],
                          created_by_id=actor.id)
    db.add(code)
    db.commit()
    db.refresh(code)
    return _code_out(code, plain=plain)


@router.post("/enrollment-codes/{code_id}/revoke", response_model=EnrollmentCodeOut,
             dependencies=[CAN_MANAGE])
def revoke_code(code_id: int, db: Session = Depends(get_db)):
    """Thu hồi mã: không kết nạp thêm được bằng mã này. Agent đã kết nạp không bị ảnh hưởng,
    vì mỗi agent có token riêng."""
    code = db.get(EnrollmentCode, code_id)
    if code is None:
        raise HTTPException(404, "Không tìm thấy mã kết nạp này.")
    if code.revoked_at is None:
        code.revoked_at = inventory.now()
        db.commit()
    count = db.scalar(select(func.count()).select_from(Agent).where(Agent.enrollment_code_id == code.id))
    return _code_out(code, count)


# ---------- Agent ----------

@router.get("/agents", response_model=list[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    return db.scalars(select(Agent).order_by(Agent.id.desc())).all()


@router.post("/agents/{agent_id}/link", response_model=AgentOut)
def link_agent(agent_id: int, data: AgentLinkIn, db: Session = Depends(get_db),
               actor: User = Depends(require_perm(AGENT_LINK))):
    """Người xử lý xác nhận máy của agent chính là một tài sản đã có."""
    agent = _get_pending_agent(db, agent_id)
    asset = db.scalar(select(Asset).where(func.lower(Asset.asset_tag) == data.asset_tag.lower()))
    if asset is None:
        raise HTTPException(404, {"message": f"Không có tài sản nào mang mã {data.asset_tag}.", "field": "asset_tag"})
    other = db.scalar(select(Agent).where(Agent.asset_id == asset.id))
    if other is not None:
        raise HTTPException(409, {
            "message": f"Tài sản {asset.asset_tag} đang gắn với agent khác ({_machine_name(other)}). "
                       "Thu hồi hoặc bỏ gắn agent đó trước.",
            "field": "asset_tag",
        })
    inventory.link(db, agent, asset, "manual")
    custody.add_log(db, asset, actor, "agent_link", None, None,
                    note=f"Gắn với máy {_machine_name(agent)} do agent báo cáo")
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Tài sản này vừa được gắn với một agent khác. Tải lại trang rồi thử lại.")
    return agent


@router.post("/agents/{agent_id}/unlink", response_model=AgentOut)
def unlink_agent(agent_id: int, db: Session = Depends(get_db),
                 actor: User = Depends(require_perm(AGENT_LINK))):
    """Sửa một lần gắn nhầm: xóa dữ liệu kỹ thuật agent đã ghi lên tài sản, đưa agent về chờ xác nhận."""
    agent = _get_agent(db, agent_id)
    if agent.asset is None:
        raise HTTPException(409, "Agent này chưa gắn với tài sản nào.")
    asset = inventory.unlink(db, agent, f"{actor.full_name} đã bỏ gắn khỏi tài sản {agent.asset.asset_tag}.")
    custody.add_log(db, asset, actor, "agent_unlink", None, None,
                    note=f"Bỏ gắn máy {_machine_name(agent)}, xóa dữ liệu kỹ thuật do agent báo cáo")
    db.commit()
    return agent


@router.post("/agents/{agent_id}/asset", response_model=AgentOut, status_code=201)
def create_asset_from_agent(agent_id: int, db: Session = Depends(get_db),
                            actor: User = Depends(require_perm(ASSET_WRITE))):
    """Tạo tài sản mới từ một máy đang chờ xác nhận rồi gắn agent vào đó. Đây là "thêm tài sản"
    nên cần quyền asset.write; serial, hãng và model lấy từ báo cáo, sửa lại được như mọi tài sản."""
    agent = _get_pending_agent(db, agent_id)
    if not agent.report:
        raise HTTPException(409, "Agent này chưa gửi báo cáo nào nên chưa có dữ liệu để tạo tài sản.")

    serial = inventory.meaningful(agent.serial_number)
    if serial:
        same = db.scalar(select(Asset).where(func.lower(Asset.serial_number) == serial.lower()))
        if same is not None:
            raise HTTPException(409, f"Serial {serial} đã thuộc về tài sản {same.asset_tag}. "
                                     "Gắn agent vào tài sản đó thay vì tạo tài sản mới.")
    # Hãng và model chỉ lưu được khi có cả hai và không phải giá trị mặc định của nhà sản xuất
    # (như "System Product Name"): chưa có màn nào để xóa một dòng hãng/model tạo nhầm.
    maker, model = inventory.meaningful(agent.manufacturer), inventory.meaningful(agent.model)
    if not (maker and model):
        maker = model = None
    name = " ".join(filter(None, [maker, model])) or agent.hostname or f"Máy do agent số {agent.id} báo cáo"
    values = AssetIn(name=name[:200], serial_number=serial, manufacturer=maker, model=model).model_dump()
    try:
        asset = add_asset(db, actor, values,
                          log_note=f"Tạo từ máy {_machine_name(agent)} do agent báo cáo")
        inventory.link(db, agent, asset, "created")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Serial của máy này vừa được dùng cho một tài sản khác. Tải lại trang rồi thử lại.")
    return agent


@router.post("/agents/{agent_id}/revoke", response_model=AgentOut, dependencies=[CAN_MANAGE])
def revoke_agent(agent_id: int, db: Session = Depends(get_db)):
    """Thu hồi agent: từ lần gọi kế tiếp, báo cáo của nó bị từ chối. Tài sản đang gắn được nhả
    ra (để gắn agent khác) nhưng giữ lại dữ liệu kỹ thuật của lần báo cáo cuối."""
    agent = _get_agent(db, agent_id)
    agent.status = AGENT_REVOKED
    agent.asset = None
    agent.pending_reason = None
    db.commit()
    return agent


@router.delete("/agents/{agent_id}", status_code=204, dependencies=[CAN_MANAGE])
def delete_agent(agent_id: int, db: Session = Depends(get_db)):
    """Dọn một agent đã thu hồi khỏi danh sách."""
    agent = _get_agent(db, agent_id)
    if agent.status != AGENT_REVOKED:
        raise HTTPException(409, "Chỉ xóa được agent đã thu hồi. Thu hồi agent này trước.")
    db.delete(agent)
    db.commit()
