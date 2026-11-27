/* Mockup ITAM: Module 4 - Quản lý dịch vụ CNTT và CMDB (NV-4.1.1 → NV-4.5.2).
   Gồm: hàng chờ ticket, tạo ticket, chi tiết ticket (SLA, trao đổi, thao tác tài sản từ ticket),
   phê duyệt, vấn đề gốc, thay đổi, sơ đồ CMDB và phân tích tác động, cơ sở tri thức, SLA và định tuyến.
   Cổng nhân viên (screens-portal.js) dùng lại dữ liệu và hàm ở đây qua M.svc. */
(function () {
  "use strict";
  const D = M.data;
  const esc = M.esc;
  const TODAY = new Date(2026, 10, 27);

  /* ===================== Hằng số ===================== */
  const TK_ST = {
    new: ["Mới", "info"], approval: ["Chờ duyệt", "warn"], owned: ["Đã nhận", "info"], working: ["Đang xử lý", "info"],
    waiting: ["Chờ phản hồi", "mute"], resolved: ["Đã giải quyết", "ok"], closed: ["Đã đóng", "mute"],
  };
  const PRIO = { urgent: ["Khẩn cấp", "bad"], high: ["Cao", "warn"], medium: ["Trung bình", "info"], low: ["Thấp", "mute"] };
  const TYPE = { incident: "Sự cố", request: "Yêu cầu dịch vụ" };
  /* Ví dụ minh họa của tài liệu (NV-4.2.1), con số thật chờ CC-14 */
  const SLA_TARGET = { urgent: ["15 phút", "4 giờ"], high: ["1 giờ", "8 giờ"], medium: ["4 giờ", "3 ngày làm việc"], low: ["1 ngày làm việc", "5 ngày làm việc"] };
  const IMPACT = [["1", "Một người"], ["2", "Một nhóm hoặc phòng ban"], ["3", "Toàn công ty hoặc cả chi nhánh"]];
  const URGENCY = [["1", "Thấp: chờ được"], ["2", "Trung bình: ảnh hưởng công việc"], ["3", "Cao: ngừng việc"]];
  const CATEGORIES = ["Phần cứng máy tính", "Phần mềm & tài khoản", "Mạng & Wi-Fi", "In ấn", "Xin cấp thiết bị", "Thu hồi / nghỉ việc", "Khác"];
  const FLOW_LABEL = { new: "Mới", approval: "Chờ duyệt", owned: "Đã nhận", working: "Đang xử lý", waiting: "Chờ phản hồi", resolved: "Đã giải quyết", closed: "Đã đóng" };

  /* Nhóm xử lý; trưởng nhóm nhận leo thang khi vi phạm SLA */
  D.ticketGroups = [
    { id: "g1", name: "Helpdesk tuyến 1", lead: "e15", members: ["e18", "e6"] },
    { id: "g2", name: "Hạ tầng", lead: "e15", members: ["e16", "e10"] },
    { id: "g3", name: "Quản lý tài sản", lead: "e17", members: ["e17"] },
  ];

  /* NV-4.1.2: quy tắc định tuyến, xét theo thứ tự; không khớp thì vào hàng chờ chung Helpdesk */
  D.routingRules = [
    { order: 1, cond: "Danh mục = Mạng & Wi-Fi", target: "Nhóm Hạ tầng", group: "Hạ tầng", test: (c) => c.category === "Mạng & Wi-Fi", active: true },
    { order: 2, cond: "Danh mục = Xin cấp thiết bị hoặc Thu hồi / nghỉ việc", target: "Nhóm Quản lý tài sản", group: "Quản lý tài sản", test: (c) => ["Xin cấp thiết bị", "Thu hồi / nghỉ việc"].includes(c.category), active: true },
    { order: 3, cond: "Tài sản gắn kèm thuộc danh mục Máy chủ hoặc Thiết bị mạng", target: "Nhóm Hạ tầng", group: "Hạ tầng", test: (c) => c.assetIds.some((id) => { const k = M.assetCat(M.asset(id)); return k && ["c4", "c5"].includes(k.id); }), active: true },
    { order: 4, cond: "Đơn vị người yêu cầu = Chi nhánh TP.HCM", target: "Helpdesk tuyến 1 - Đặng Văn Hùng (phụ trách chi nhánh)", group: "Helpdesk tuyến 1", assignee: "e6", test: (c) => { const e = M.emp(c.requesterId); return !!e && e.unit === "u2"; }, active: true },
    { order: 5, cond: "Danh mục = Phần cứng máy tính, Phần mềm & tài khoản hoặc In ấn", target: "Helpdesk tuyến 1", group: "Helpdesk tuyến 1", test: (c) => ["Phần cứng máy tính", "Phần mềm & tài khoản", "In ấn"].includes(c.category), active: true },
    { order: 6, cond: "Tiêu đề chứa \"VIP\" hoặc người yêu cầu thuộc Ban Giám đốc", target: "Helpdesk tuyến 1 - Nguyễn Đức Anh", group: "Helpdesk tuyến 1", assignee: "e18", test: (c) => { const e = M.emp(c.requesterId); return !!e && e.dept === "d1"; }, active: false },
  ];
  const route = (c) => {
    const r = D.routingRules.find((x) => x.active && x.test(c));
    return r ? { group: r.group, assignee: r.assignee || null, text: `Khớp quy tắc ${r.order} (${r.cond}) → ${r.target}` }
      : { group: "Helpdesk tuyến 1", assignee: null, text: "Không khớp quy tắc nào → hàng chờ chung của Helpdesk" };
  };

  /* ===================== Dữ liệu ticket ===================== */
  D.tickets = [
    { id: "T-1052", title: "Xin cài Adobe Photoshop để thiết kế banner", type: "request", category: "Phần mềm & tài khoản", priority: "low", impact: 1, urgency: 1, status: "approval", requesterId: "e9", assigneeId: null, group: "Helpdesk tuyến 1", assetIds: ["a22"], created: "27/11/2026 11:20", channel: "Cổng tự phục vụ", slaDue: "—", slaState: "paused", slaLeft: "Dừng khi chờ duyệt", hadApproval: true,
      desc: "Em cần Photoshop để làm banner cho chiến dịch tháng 12. Bản dùng thử trên máy đã hết hạn." },
    { id: "T-1051", title: "Cấp quyền VPN cho đối tác triển khai ERP", type: "request", category: "Mạng & Wi-Fi", priority: "medium", impact: 2, urgency: 2, status: "approval", requesterId: "e15", assigneeId: null, group: "Hạ tầng", assetIds: [], created: "27/11/2026 10:02", channel: "Email", slaDue: "—", slaState: "paused", slaLeft: "Dừng khi chờ duyệt", hadApproval: true,
      desc: "Đối tác triển khai ERP cần truy cập VPN từ 01/12 đến 31/12/2026, 2 tài khoản, chỉ vào được dải 10.10.0.0/24." },
    { id: "T-1050", title: "Cấp laptop cho nhân viên thử việc Phòng IT", type: "request", category: "Xin cấp thiết bị", priority: "medium", impact: 1, urgency: 2, status: "approval", requesterId: "e16", assigneeId: null, group: "Quản lý tài sản", assetIds: [], created: "26/11/2026 16:10", channel: "Cổng tự phục vụ", slaDue: "—", slaState: "paused", slaLeft: "Dừng khi chờ duyệt", hadApproval: true,
      desc: "Nhân viên thử việc vào làm ngày 02/12/2026, cần một laptop cấu hình lập trình (RAM 32 GB)." },
    { id: "T-1049", title: "Dock WD19S không nhận màn hình thứ hai", type: "incident", category: "Phần cứng máy tính", priority: "medium", impact: 1, urgency: 2, status: "new", requesterId: "e5", assigneeId: null, group: "Helpdesk tuyến 1", assetIds: ["a2", "a3"], created: "27/11/2026 13:40", channel: "Cổng tự phục vụ", slaDue: "27/11/2026 17:40", slaState: "ok", slaLeft: "còn 3 giờ 05 phút để nhận", slaPct: 22,
      desc: "Cắm dock vào laptop thì màn hình Dell P2422H báo No signal, sạc vẫn vào. Hôm qua vẫn dùng bình thường.", attachments: ["man-hinh-no-signal.jpg"] },
    { id: "T-1048", title: "Xin cấp màn hình thứ hai", type: "request", category: "Xin cấp thiết bị", priority: "low", impact: 1, urgency: 1, status: "approval", requesterId: "e10", assigneeId: null, group: "Quản lý tài sản", assetIds: [], created: "26/11/2026 09:30", channel: "Cổng tự phục vụ", slaDue: "—", slaState: "paused", slaLeft: "Dừng khi chờ duyệt", hadApproval: true,
      desc: "Em làm giám sát hệ thống, cần thêm một màn hình để theo dõi dashboard." },
    { id: "T-1047", title: "Thu hồi tài sản do nghỉ việc: Lê Văn Tùng (NV0041)", type: "request", category: "Thu hồi / nghỉ việc", priority: "medium", impact: 1, urgency: 2, status: "working", requesterId: "e2", assigneeId: "e17", group: "Quản lý tài sản", assetIds: ["a18"], created: "26/11/2026 16:40", channel: "Tự động từ HRM", slaDue: "05/12/2026 17:30", slaState: "ok", slaLeft: "còn 6 ngày làm việc", slaPct: 15, respondedAt: "27/11/2026 08:30",
      desc: "HRM báo nhân viên Lê Văn Tùng (NV0041, Phòng Kinh doanh) nghỉ việc từ ngày 05/12/2026. Thu hồi toàn bộ tài sản, phụ kiện và ghế bản quyền trước ngày nghỉ.",
      offboard: { employeeId: "e7", leaveDate: "05/12/2026", hrRef: "HR-2026-311", assetIds: ["a18"], accessoryIds: ["ac1", "ac2", "ac4"], seats: [{ key: "L-03", name: "Microsoft 365 Business Standard", via: "theo người dùng", done: false }, { key: "L-07", name: "Salesforce Sales Cloud", via: "theo người dùng", done: false }], doneSeats: [] },
      comments: [
        { by: "system", at: "26/11/2026 16:40", text: "Tạo tự động từ HRM (sự kiện nghỉ việc HR-2026-311). Danh sách cần thu hồi được lập theo dữ liệu tại thời điểm tạo." },
        { by: "e17", at: "27/11/2026 08:30", internal: true, text: "Đã hẹn anh Tùng mang laptop, chuột, bàn phím và dock lên phòng IT chiều 04/12." },
      ],
      history: [["26/11/2026 16:40", "Hệ thống tạo ticket từ HRM"], ["26/11/2026 16:40", "Định tuyến theo quy tắc 2 → Nhóm Quản lý tài sản"], ["27/11/2026 08:30", "Phạm Thu Hà nhận xử lý - Mới → Đã nhận"], ["27/11/2026 08:31", "Đã nhận → Đang xử lý"]] },
    { id: "T-1046", title: "Mất Wi-Fi toàn bộ tầng 5 chi nhánh TP.HCM", type: "incident", category: "Mạng & Wi-Fi", priority: "urgent", impact: 3, urgency: 3, status: "working", requesterId: "e8", assigneeId: "e16", group: "Hạ tầng", assetIds: ["a20"], created: "27/11/2026 07:50", channel: "Điện thoại", slaDue: "27/11/2026 11:50", slaState: "breach", slaLeft: "vi phạm 2 giờ 10 phút", slaPct: 100, respondedAt: "27/11/2026 08:05", breached: true,
      desc: "Toàn bộ tầng 5 không bắt được Wi-Fi ANPHAT-STAFF, khách hàng đang chờ demo lúc 9 giờ.",
      comments: [
        { by: "e8", at: "27/11/2026 07:50", text: "Toàn bộ tầng 5 không bắt được Wi-Fi ANPHAT-STAFF, khách hàng đang chờ demo lúc 9 giờ." },
        { by: "e16", at: "27/11/2026 08:05", text: "Đã nhận, đang kiểm tra controller từ xa. Anh dùng tạm mạng dây ở phòng họp nhỏ giúp em." },
        { by: "e16", at: "27/11/2026 09:30", internal: true, text: "Các AP tầng 5 mất PoE sau khi switch chi nhánh tự khởi động lại lúc 07:40. Chờ kỹ thuật viên tại chỗ kiểm tra nguồn." },
      ],
      escalations: [["27/11/2026 11:02", "Mức 1: còn dưới 20% thời gian giải quyết, đã báo Lê Hoàng Nam"], ["27/11/2026 11:50", "Mức 2: vi phạm hạn giải quyết, đã báo trưởng nhóm Trần Minh Quân"]] },
    { id: "T-1045", title: "Máy tự tắt khi chạy MISA", type: "incident", category: "Phần cứng máy tính", priority: "high", impact: 1, urgency: 3, status: "working", requesterId: "e1", assigneeId: "e18", group: "Helpdesk tuyến 1", assetIds: ["a1"], created: "26/11/2026 13:48", channel: "Cổng tự phục vụ", slaDue: "27/11/2026 13:18", slaState: "warn", slaLeft: "còn 45 phút", slaPct: 91, respondedAt: "26/11/2026 14:05",
      desc: "Từ sáng nay máy tự tắt mỗi khi mở báo cáo tổng hợp trên MISA, không có thông báo lỗi. Phía dưới máy rất nóng.", attachments: ["event-viewer-kernel-power.png"],
      comments: [
        { by: "e1", at: "26/11/2026 13:48", text: "Từ sáng nay máy tự tắt mỗi khi mở báo cáo tổng hợp trên MISA, không có thông báo lỗi. Phía dưới máy rất nóng." },
        { by: "e18", at: "26/11/2026 14:05", text: "Chào anh Bình, em đã nhận yêu cầu. Máy tắt hẳn hay khởi động lại ạ?" },
        { by: "e1", at: "26/11/2026 14:20", text: "Tắt hẳn, bấm nút nguồn lại mới lên." },
        { by: "e18", at: "26/11/2026 15:10", internal: true, text: "Event log có Kernel-Power 41, nhiệt CPU chạm 100°C khi chạy MISA. Nghi quạt tản nhiệt. Máy còn bảo hành ProSupport tới 12/03/2028." },
        { by: "e18", at: "27/11/2026 09:10", text: "Anh mang máy lên phòng IT lúc nào tiện ạ? Em gửi hãng thay quạt và cấp máy tạm cho anh." },
        { by: "e1", at: "27/11/2026 09:40", text: "10 giờ anh mang lên nhé." },
        { by: "e18", at: "27/11/2026 10:05", internal: true, text: "Máy này đã có 2 ticket phần cứng trước đó (T-1031 sạc, T-1019 bàn phím). Đề xuất thu hồi để hãng thay quạt, cấp máy tạm TS-000011." },
      ],
      work: [["26/11/2026 15:10", "e18", 25, "Kiểm tra Event Viewer và nhiệt độ bằng HWiNFO qua điều khiển từ xa"], ["27/11/2026 10:00", "e18", 15, "Gọi tổng đài Dell ProSupport, mở case 17384920"]],
      history: [["26/11/2026 13:48", "Nguyễn Văn Bình tạo yêu cầu từ Cổng tự phục vụ, gắn TS-000001"], ["26/11/2026 13:48", "Định tuyến theo quy tắc 5 → Helpdesk tuyến 1"], ["26/11/2026 14:05", "Nguyễn Đức Anh nhận xử lý - Mới → Đã nhận - nhận sau 17 phút (mục tiêu 1 giờ)"], ["26/11/2026 14:10", "Đã nhận → Đang xử lý"], ["27/11/2026 09:10", "Đang xử lý → Chờ phản hồi - đồng hồ SLA dừng"], ["27/11/2026 09:40", "Người yêu cầu trả lời - Chờ phản hồi → Đang xử lý - đồng hồ SLA chạy tiếp (đã dừng 30 phút)"]],
      escalations: [["27/11/2026 12:33", "Mức 1: thời gian giải quyết còn dưới 1 giờ, đã báo Nguyễn Đức Anh"]] },
    { id: "T-1044", title: "Mất mạng Phòng 301 lúc 16 giờ thứ Sáu", type: "incident", category: "Mạng & Wi-Fi", priority: "high", impact: 2, urgency: 3, status: "closed", requesterId: "e4", assigneeId: "e16", group: "Hạ tầng", assetIds: ["a7", "a4"], created: "21/11/2026 16:05", channel: "Điện thoại", slaDue: "22/11/2026 08:05", slaState: "ok", slaLeft: "Đạt", respondedAt: "21/11/2026 16:12",
      desc: "Cả phòng Kế toán mất mạng khoảng 15 phút, sau đó tự có lại.", resolution: "Switch lõi khởi động lại theo lịch sau khi nâng firmware (CHG-030). Đã gắn vào vấn đề gốc P-012 để theo dõi." },
    { id: "T-1043", title: "Không in được ra máy in phòng 301", type: "incident", category: "In ấn", priority: "medium", impact: 1, urgency: 2, status: "resolved", requesterId: "e5", assigneeId: "e18", group: "Helpdesk tuyến 1", assetIds: ["a9"], created: "26/11/2026 09:15", channel: "Cổng tự phục vụ", slaDue: "01/12/2026 09:15", slaState: "ok", slaLeft: "Đạt", respondedAt: "26/11/2026 09:40", resolvedAt: "26/11/2026 17:05", kbId: "KB-001",
      desc: "Từ sáng nay em in ra máy in phòng 301 thì lệnh in bị kẹt trong hàng đợi, các bạn kế toán vẫn in được.",
      resolution: "Cài lại driver HP Universal PCL 6 và thêm lại máy in theo địa chỉ 10.10.3.50 trên máy KD-LINH-LT.",
      comments: [
        { by: "e5", at: "26/11/2026 09:15", text: "Từ sáng nay em in ra máy in phòng 301 thì lệnh in bị kẹt trong hàng đợi, các bạn kế toán vẫn in được." },
        { by: "e18", at: "26/11/2026 09:40", text: "Chào chị Linh, em kiểm tra từ xa máy chị nhé." },
        { by: "e18", at: "26/11/2026 10:10", internal: true, text: "Driver PCL6 bị gỡ sau bản cập nhật Windows, giống vấn đề P-009." },
        { by: "e18", at: "26/11/2026 17:05", text: "Em đã cài lại driver và thêm lại máy in theo IP 10.10.3.50. Chị in thử giúp em, nếu ổn chị bấm Xác nhận đã giải quyết nhé." },
      ],
      work: [["26/11/2026 17:00", "e18", 20, "Cài lại driver HP Universal PCL 6 qua điều khiển từ xa"]] },
    { id: "T-1042", title: "Cài MISA SME 2025 cho kế toán mới", type: "request", category: "Phần mềm & tài khoản", priority: "medium", impact: 1, urgency: 2, status: "closed", requesterId: "e11", assigneeId: "e6", group: "Helpdesk tuyến 1", assetIds: ["a4"], created: "20/11/2026 08:40", channel: "Email", slaDue: "25/11/2026 08:40", slaState: "ok", slaLeft: "Đạt", respondedAt: "20/11/2026 09:02",
      desc: "Kế toán mới Lý Thanh Tâm dùng máy KT-PC-301, cần cài MISA và cấp quyền dữ liệu năm 2026.", resolution: "Đã cài MISA SME 2025 R12 và tạo tài khoản dữ liệu." },
    { id: "T-1041", title: "Xin cấp chuột không dây", type: "request", category: "Xin cấp thiết bị", priority: "low", impact: 1, urgency: 1, status: "closed", requesterId: "e5", assigneeId: "e17", group: "Quản lý tài sản", assetIds: [], created: "18/11/2026 10:00", channel: "Cổng tự phục vụ", slaDue: "25/11/2026 10:00", slaState: "ok", slaLeft: "Đạt", hadApproval: true, respondedAt: "18/11/2026 11:10",
      desc: "Chuột có dây hay bị vướng khi đi họp, em xin một chuột không dây.", resolution: "Đã cấp 1 chuột Logitech M331 Silent." },
    { id: "T-1040", title: "Xin nâng RAM laptop lên 32 GB", type: "request", category: "Xin cấp thiết bị", priority: "low", impact: 1, urgency: 1, status: "closed", requesterId: "e3", assigneeId: null, group: "Quản lý tài sản", assetIds: ["a13"], created: "16/11/2026 15:00", channel: "Cổng tự phục vụ", slaDue: "—", slaState: "ok", slaLeft: "Đạt", hadApproval: true,
      desc: "Máy hay chậm khi dựng video.", rejectReason: "Cấu hình hiện tại đủ cho công việc; xem lại khi thay máy theo kế hoạch 2027." },
    { id: "T-1039", title: "Outlook không đồng bộ lịch họp", type: "incident", category: "Phần mềm & tài khoản", priority: "medium", impact: 1, urgency: 2, status: "waiting", requesterId: "e2", assigneeId: "e18", group: "Helpdesk tuyến 1", assetIds: ["a17"], created: "25/11/2026 14:30", channel: "Email", slaDue: "28/11/2026 14:30", slaState: "paused", slaLeft: "Dừng ở Chờ phản hồi", slaPct: 45, respondedAt: "25/11/2026 15:02",
      desc: "Lịch họp mới tạo trên điện thoại không hiện trong Outlook trên laptop.",
      comments: [
        { by: "e2", at: "25/11/2026 14:30", text: "Lịch họp mới tạo trên điện thoại không hiện trong Outlook trên laptop." },
        { by: "e18", at: "25/11/2026 15:02", text: "Chị gửi giúp em ảnh chụp màn hình lỗi khi mở lịch nhé." },
      ] },
    { id: "T-1038", title: "Cài Salesforce for Outlook", type: "request", category: "Phần mềm & tài khoản", priority: "low", impact: 1, urgency: 1, status: "closed", requesterId: "e5", assigneeId: "e6", group: "Helpdesk tuyến 1", assetIds: ["a2"], created: "10/11/2026 09:00", channel: "Cổng tự phục vụ", slaDue: "17/11/2026 09:00", slaState: "ok", slaLeft: "Đạt", hadApproval: true,
      desc: "Cần đồng bộ email khách hàng vào Salesforce.", resolution: "Đã cài Salesforce for Outlook 4.2.0." },
    { id: "T-1036", title: "Rớt Wi-Fi tầng 3 chiều thứ Sáu", type: "incident", category: "Mạng & Wi-Fi", priority: "high", impact: 2, urgency: 2, status: "closed", requesterId: "e3", assigneeId: "e16", group: "Hạ tầng", assetIds: [], created: "14/11/2026 16:10", channel: "Chat Teams", slaDue: "15/11/2026 08:10", slaState: "ok", slaLeft: "Đạt",
      desc: "Wi-Fi tầng 3 mất khoảng 10 phút lúc 16 giờ.", resolution: "Khởi động lại nhóm AP tầng 3. Gắn vào P-012." },
    { id: "T-1031", title: "Laptop không nhận sạc", type: "incident", category: "Phần cứng máy tính", priority: "medium", impact: 1, urgency: 2, status: "closed", requesterId: "e1", assigneeId: "e18", group: "Helpdesk tuyến 1", assetIds: ["a1"], created: "02/10/2026 09:20", channel: "Cổng tự phục vụ", slaDue: "07/10/2026 09:20", slaState: "ok", slaLeft: "Đạt",
      desc: "Cắm sạc đèn không sáng.", resolution: "Thay sạc 65W theo bảo hành." },
    { id: "T-1029", title: "Không vào được mạng phòng họp Sen", type: "incident", category: "Mạng & Wi-Fi", priority: "high", impact: 2, urgency: 2, status: "closed", requesterId: "e12", assigneeId: "e16", group: "Hạ tầng", assetIds: [], created: "07/11/2026 16:20", channel: "Điện thoại", slaDue: "08/11/2026 08:20", slaState: "ok", slaLeft: "Đạt",
      desc: "Đang họp với khách thì mất Wi-Fi.", resolution: "Wi-Fi có lại sau 12 phút. Gắn vào P-012." },
    { id: "T-1019", title: "Bàn phím laptop liệt một số phím", type: "incident", category: "Phần cứng máy tính", priority: "low", impact: 1, urgency: 1, status: "closed", requesterId: "e1", assigneeId: "e18", group: "Helpdesk tuyến 1", assetIds: ["a1"], created: "12/06/2026 10:40", channel: "Cổng tự phục vụ", slaDue: "19/06/2026 10:40", slaState: "breach", slaLeft: "Vi phạm 1 ngày", breached: true,
      desc: "Phím E, R, T không gõ được.", resolution: "Hãng thay bàn phím theo bảo hành; chờ linh kiện quá hạn SLA." },
  ];

  /* Email gửi tới hộp thư hỗ trợ mà địa chỉ không khớp nhân viên nào (đề xuất) */
  D.ticketEmailQueue = [
    { id: "em1", from: "nguyen.hoang.long88@gmail.com", subject: "Máy tính văn phòng không lên mạng", at: "27/11/2026 08:02" },
    { id: "em2", from: "ketoan@anphat-hn.vn", subject: "Re: Hóa đơn in ra bị lỗi phông chữ", at: "26/11/2026 17:45" },
  ];

  /* NV-4.1.4: phiếu phê duyệt */
  D.approvals = [
    { id: "AP-021", ticketId: "T-1048", approverId: "e15", level: 1, levels: 1, state: "pending", requested: "26/11/2026 09:31" },
    { id: "AP-022", ticketId: "T-1050", approverId: "e15", level: 1, levels: 2, nextApproverId: "e20", state: "pending", requested: "26/11/2026 16:11" },
    { id: "AP-023", ticketId: "T-1051", approverId: "e15", level: 1, levels: 1, state: "pending", requested: "27/11/2026 10:03" },
    { id: "AP-024", ticketId: "T-1052", approverId: "e3", level: 1, levels: 1, state: "pending", requested: "27/11/2026 11:21" },
    { id: "AP-018", ticketId: "T-1041", approverId: "e12", level: 1, levels: 1, state: "approved", requested: "18/11/2026 10:01", decided: "18/11/2026 11:02" },
    { id: "AP-016", ticketId: "T-1038", approverId: "e12", level: 1, levels: 1, state: "approved", requested: "10/11/2026 09:01", decided: "10/11/2026 09:30" },
    { id: "AP-017", ticketId: "T-1040", approverId: "e20", level: 1, levels: 1, state: "rejected", requested: "16/11/2026 15:01", decided: "17/11/2026 08:45", reason: "Cấu hình hiện tại đủ cho công việc; xem lại khi thay máy theo kế hoạch 2027." },
  ];

  /* NV-4.1.5: vấn đề gốc */
  D.problems = [
    { id: "P-012", title: "Rớt mạng Wi-Fi tầng 3 vào chiều thứ Sáu", status: "known", priority: "high", owner: "e16", created: "15/11/2026", incidents: ["T-1029", "T-1036", "T-1044"], assets: ["a7"],
      rootCause: "Wi-Fi controller chạy tác vụ sao lưu cấu hình lúc 16:00 thứ Sáu hằng tuần; trong lúc sao lưu, các điểm phát tầng 3 mất kết nối với controller và khởi động lại.",
      workaround: "Khi xảy ra: vào trang quản trị controller, tắt rồi bật lại nhóm AP-T3 (khoảng 2 phút). Tạm thời đã tắt lịch sao lưu tự động, sao lưu tay sau 18:00.",
      fix: "Dời lịch sao lưu sang 23:00, theo yêu cầu thay đổi CHG-032.", changeId: "CHG-032", kbId: "KB-006" },
    { id: "P-011", title: "Outlook không đồng bộ lịch sau bản cập nhật Microsoft 365 tháng 11", status: "investigating", priority: "medium", owner: "e18", created: "24/11/2026", incidents: ["T-1039"], assets: [],
      rootCause: "", workaround: "Xóa hồ sơ Outlook rồi tạo lại; hoặc dùng Outlook trên web trong lúc chờ bản vá của hãng.", fix: "", kbId: "KB-005" },
    { id: "P-009", title: "Máy in phòng 301 mất hàng đợi in sau khi Windows cập nhật", status: "resolved", priority: "medium", owner: "e18", created: "05/11/2026", incidents: ["T-1043"], assets: ["a9"],
      rootCause: "Bản cập nhật Windows tháng 11 gỡ driver PCL6 cũ của HP M404dn trên một số máy.", workaround: "Cài lại driver HP Universal PCL 6 và thêm lại máy in theo IP 10.10.3.50.", fix: "Đẩy driver mới cho các máy dùng máy in này qua đợt triển khai phần mềm.", kbId: "KB-001" },
  ];
  const PB_ST = { new: ["Mới", "info"], investigating: ["Đang điều tra", "warn"], known: ["Lỗi đã biết", "warn"], resolved: ["Đã có giải pháp", "ok"], closed: ["Đã đóng", "mute"] };

  /* NV-4.1.6: yêu cầu thay đổi */
  D.changes = [
    { id: "CHG-031", title: "Vá OpenSSH trên máy chủ Linux theo CVE-2026-21410", status: "pending", risk: "Trung bình", requesterId: "e16", approverId: "e15", created: "27/11/2026 14:30", window: "28/11/2026 22:00 - 23:30", assets: ["a5", "a24"],
      reason: "CVE-2026-21410 mức Critical (CVSS 9.8) ảnh hưởng gói openssh-server trên các máy Ubuntu, cho phép thực thi mã từ xa trước khi xác thực.",
      plan: ["Gửi thông báo bảo trì tới người dùng ERP lúc 17:00 ngày 28/11.", "Chụp snapshot ổ đĩa SRV-ERP-01.", "Triển khai bản vá openssh-server qua đợt DP-007, chạy thử trên IT-HUY-LT trước.", "Kiểm tra đăng nhập SSH và dịch vụ ERP, theo dõi 30 phút."],
      rollback: "Gỡ bản vá, cài lại openssh-server 1:8.9p1-3ubuntu0.10 từ kho nội bộ; nếu ERP lỗi thì khôi phục snapshot.", deployment: "DP-007", cve: "CVE-2026-21410", impactAttached: true, impactFocus: "a5", incidentsAfter: [] },
    { id: "CHG-032", title: "Dời lịch sao lưu cấu hình Wi-Fi controller sang 23:00", status: "draft", risk: "Thấp", requesterId: "e16", approverId: "e15", created: "26/11/2026 10:15", window: "", assets: [],
      reason: "Khắc phục triệt để vấn đề P-012.", plan: ["Sửa lịch sao lưu trên controller từ 16:00 thứ Sáu sang 23:00 hằng ngày."], rollback: "", incidentsAfter: [], problemId: "P-012" },
    { id: "CHG-030", title: "Nâng firmware switch lõi SW-CORE-01 lên IOS-XE 17.9.5", status: "done", risk: "Cao", requesterId: "e16", approverId: "e15", approvedAt: "18/11/2026 09:20", created: "17/11/2026 14:00", window: "21/11/2026 12:00 - 13:00", assets: ["a7"],
      reason: "Bản firmware cũ có lỗi rò bộ nhớ, switch phải khởi động lại định kỳ.", plan: ["Sao lưu cấu hình đang chạy.", "Nạp image mới lên flash.", "Khởi động lại trong giờ nghỉ trưa."],
      rollback: "Chọn lại image cũ còn trên flash và khởi động lại.", result: "Hoàn tất lúc 12:42, switch khởi động lại bình thường.", incidentsAfter: ["T-1044"], impactAttached: true, impactFocus: "a7" },
    { id: "CHG-029", title: "Thay pin bộ lưu điện UPS phòng máy chủ", status: "approved", risk: "Trung bình", requesterId: "e10", approverId: "e15", approvedAt: "25/11/2026 15:00", created: "24/11/2026 09:00", window: "30/11/2026 07:00 - 08:00", assets: ["a16"],
      reason: "UPS báo Replace battery, thời gian lưu điện còn dưới 5 phút.", plan: ["Chuyển UPS sang chế độ bypass.", "Thay khối pin RBC7.", "Chạy kiểm tra pin."],
      rollback: "Lắp lại khối pin cũ, chạy lại kiểm tra.", incidentsAfter: [], impactAttached: false, impactFocus: "a16" },
  ];
  const CH_ST = { draft: ["Nháp", "mute"], pending: ["Chờ duyệt", "warn"], approved: ["Đã duyệt, chờ thực hiện", "info"], doing: ["Đang thực hiện", "info"], done: ["Đã thực hiện", "ok"], rejected: ["Bị từ chối", "bad"] };

  /* NV-4.4.1: đối tượng không phải thiết bị (CC-15) và quan hệ CMDB */
  D.services = [
    { id: "svc-erp", name: "Ứng dụng ERP", kind: "Ứng dụng nghiệp vụ", owner: "e11", users: ["e1", "e4", "e11", "e12", "e5", "e7", "e17", "e20"] },
    { id: "svc-mail", name: "Dịch vụ email", kind: "Dịch vụ", owner: "e15", users: "all" },
    { id: "svc-vpn", name: "Dịch vụ VPN", kind: "Dịch vụ", owner: "e16", users: ["e5", "e7", "e8", "e12", "e13", "e15", "e16", "e10"] },
    { id: "svc-print", name: "In ấn phòng Kế toán", kind: "Dịch vụ", owner: "e11", users: ["e1", "e4", "e11"] },
    { id: "vm-erp-app", name: "VM-ERP-APP", kind: "Máy ảo - vCenter", owner: "e16", users: [] },
    { id: "vm-mail", name: "VM-MAIL-01", kind: "Máy ảo - vCenter", owner: "e16", users: [] },
  ];
  D.relations = [
    { from: "svc-erp", to: "vm-erp-app", type: "depends", source: "manual" },
    { from: "svc-erp", to: "a5", type: "depends", source: "manual" },
    { from: "svc-mail", to: "vm-mail", type: "depends", source: "manual" },
    { from: "svc-print", to: "a9", type: "depends", source: "manual" },
    { from: "svc-vpn", to: "a8", type: "depends", source: "manual" },
    { from: "vm-erp-app", to: "a6", type: "runs_on", source: "auto", origin: "Quét vCenter" },
    { from: "vm-mail", to: "a6", type: "runs_on", source: "auto", origin: "Quét vCenter" },
    { from: "a5", to: "a7", type: "connects", source: "auto", origin: "Cổng Gi1/0/1 (LLDP)" },
    { from: "a6", to: "a7", type: "connects", source: "auto", origin: "Cổng Gi1/0/2 (LLDP)" },
    { from: "a4", to: "a7", type: "connects", source: "auto", origin: "Cổng Gi1/0/14 (LLDP)" },
    { from: "a9", to: "a7", type: "connects", source: "auto", origin: "Cổng Gi1/0/20 (LLDP)" },
    { from: "a7", to: "a8", type: "connects", source: "manual" },
    { from: "a5", to: "a16", type: "depends", source: "manual" },
    { from: "a6", to: "a16", type: "depends", source: "manual" },
    { from: "a7", to: "a16", type: "depends", source: "manual" },
    { from: "a3", to: "a2", type: "part_of", source: "manual" },
  ];
  const REL = { runs_on: "chạy trên", connects: "kết nối tới", depends: "phụ thuộc vào", part_of: "là thành phần của" };

  /* NV-4.5.1, NV-4.5.2: cơ sở tri thức */
  D.kb = [
    { id: "KB-001", title: "Kết nối máy in mạng phòng Kế toán (HP LaserJet M404dn)", category: "In ấn", public: true, state: "published", author: "Nguyễn Đức Anh", updated: "26/11/2026", tags: ["máy in", "driver", "in ấn", "phòng 301"], views: 48,
      body: ["Áp dụng khi lệnh in bị kẹt trong hàng đợi hoặc máy báo không tìm thấy máy in phòng 301.", "Mở Cài đặt → Bluetooth & thiết bị → Máy in & máy quét, xóa máy in HP M404dn cũ.", "Chọn Thêm thiết bị → Thêm thủ công → Thêm bằng địa chỉ IP, nhập 10.10.3.50.", "Chọn driver HP Universal Printing PCL 6 rồi in trang thử.", "Vẫn lỗi thì gửi yêu cầu hỗ trợ, ghi rõ tên máy của bạn."] },
    { id: "KB-002", title: "Kết nối VPN khi làm việc từ xa", category: "Mạng & Wi-Fi", public: true, state: "published", author: "Lê Hoàng Nam", updated: "12/11/2026", tags: ["vpn", "làm việc từ xa", "forticlient"], views: 131,
      body: ["Mở FortiClient VPN đã cài sẵn trên máy công ty.", "Chọn kết nối ANPHAT-VPN, đăng nhập bằng tài khoản email công ty.", "Nhập mã xác thực hai lớp trên ứng dụng điện thoại.", "Không kết nối được thì kiểm tra mạng Internet trước, sau đó gửi yêu cầu hỗ trợ."] },
    { id: "KB-003", title: "Đặt lại mật khẩu email và tài khoản Windows", category: "Phần mềm & tài khoản", public: true, state: "published", author: "Nguyễn Đức Anh", updated: "03/11/2026", tags: ["mật khẩu", "email", "tài khoản", "quên mật khẩu"], views: 210,
      body: ["Vào trang đổi mật khẩu của công ty từ điện thoại đã đăng ký.", "Xác thực bằng mã gửi về điện thoại.", "Đặt mật khẩu mới ít nhất 12 ký tự, không trùng 5 mật khẩu gần nhất.", "Khóa màn hình rồi mở lại laptop bằng mật khẩu mới khi đang nối mạng công ty."] },
    { id: "KB-004", title: "Laptop Dell tự tắt khi chạy nặng: kiểm tra nhiệt và cập nhật BIOS", category: "Phần cứng máy tính", public: false, state: "published", author: "Nguyễn Đức Anh", updated: "20/10/2026", tags: ["laptop", "tự tắt", "nhiệt", "dell", "bios", "misa"], views: 17,
      body: ["Xem Event Viewer: Kernel-Power 41 không kèm lỗi BSOD thường do quá nhiệt hoặc nguồn.", "Đo nhiệt CPU bằng HWiNFO khi chạy tải; trên 95°C là nghi quạt hoặc keo tản nhiệt.", "Cập nhật BIOS và Dell Power Manager lên bản mới nhất.", "Còn bảo hành ProSupport thì mở case với hãng, thu hồi máy và cấp máy tạm cho người dùng."] },
    { id: "KB-005", title: "Outlook không đồng bộ lịch sau bản cập nhật Microsoft 365", category: "Phần mềm & tài khoản", public: false, state: "published", author: "Nguyễn Đức Anh", updated: "25/11/2026", tags: ["outlook", "lịch", "đồng bộ"], views: 9,
      body: ["Đóng Outlook, mở Control Panel → Mail → Show Profiles.", "Tạo hồ sơ mới, đặt làm mặc định, mở lại Outlook.", "Trong lúc chờ bản vá có thể dùng Outlook trên web."] },
    { id: "KB-006", title: "Wi-Fi tầng 3 rớt vào chiều thứ Sáu: cách xử lý tạm thời", category: "Mạng & Wi-Fi", public: false, state: "draft", author: "Lê Hoàng Nam", updated: "16/11/2026", tags: ["wifi", "tầng 3", "controller"], views: 0,
      body: ["Đăng nhập trang quản trị Wi-Fi controller.", "Vào nhóm AP-T3, chọn Disable rồi Enable.", "Chờ khoảng 2 phút để các điểm phát kết nối lại."] },
    { id: "KB-007", title: "Dock Dell WD19S không nhận màn hình thứ hai", category: "Phần cứng máy tính", public: true, state: "published", author: "Đặng Văn Hùng", updated: "08/11/2026", tags: ["dock", "màn hình", "wd19s", "màn hình thứ hai", "no signal"], views: 36,
      body: ["Rút cáp dock khỏi laptop, chờ 10 giây rồi cắm lại.", "Kiểm tra cáp màn hình cắm vào cổng DisplayPort hoặc HDMI của dock, không cắm vào laptop.", "Nhấn Windows + P, chọn Mở rộng.", "Vẫn báo No signal thì gửi yêu cầu hỗ trợ, chọn thiết bị là dock hoặc màn hình."] },
    { id: "KB-008", title: "Quy trình cấp phát laptop cho nhân viên mới", category: "Tài sản", public: false, state: "published", author: "Phạm Thu Hà", updated: "01/10/2026", tags: ["cấp phát", "nhân viên mới", "laptop"], views: 22,
      body: ["Chọn laptop Sẵn sàng cấp phát trong kho, kiểm tra agent đã báo cáo.", "Cấp phát cho nhân viên trên trang tài sản; hệ thống sinh biên bản bàn giao.", "Nhắc nhân viên ký biên bản trên cổng tự phục vụ trong 7 ngày."] },
    { id: "KB-009", title: "Tự cài phần mềm được phép từ Company Portal", category: "Phần mềm & tài khoản", public: true, state: "draft", author: "Đặng Văn Hùng", updated: "26/11/2026", tags: ["cài phần mềm", "company portal"], views: 0,
      body: ["Mở ứng dụng Company Portal.", "Chọn phần mềm trong danh sách được phép, bấm Cài đặt."] },
  ];

  /* ===================== Hàm dùng chung ===================== */
  const myEmp = () => {
    const u = (D.users || []).find((x) => x.username === M.me().username);
    return (u && u.employeeId) || M.me().employeeId || null;
  };
  const ename = (id) => {
    if (id === "system") return "Hệ thống";
    const e = id && M.emp(id);
    return e ? e.name : "—";
  };
  const pad = (n) => String(n).padStart(2, "0");
  /* Đoạn chữ dài đặt trong M.kv (ô dd mặc định đậm vừa) */
  const plain = (html) => `<span style="font-weight:400">${html}</span>`;
  const nowStr = () => { const d = new Date(); return `27/11/2026 ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const ticket = (id) => M.find("tickets", id);
  const nextTicketId = () => "T-" + (Math.max(...D.tickets.map((t) => +t.id.slice(2))) + 1);
  const toDate = (s) => { const [d, m, y] = String(s).split(" ")[0].split("/").map(Number); return new Date(y, m - 1, d); };
  const stPill = (t) => M.pill(...TK_ST[t.status]);
  const prPill = (t) => M.pill(...PRIO[t.priority]);
  const prioFrom = (impact, urgency) => { const s = Number(impact) + Number(urgency); return s >= 6 ? "urgent" : s === 5 ? "high" : s === 4 ? "medium" : "low"; };
  const isOpen = (t) => !["resolved", "closed"].includes(t.status);
  const group = (name) => D.ticketGroups.find((g) => g.name === name);
  const problemOf = (t) => D.problems.find((p) => p.incidents.includes(t.id));
  const changeOf = (t) => D.changes.find((c) => (c.incidentsAfter || []).includes(t.id));

  function slaPill(t) {
    if (!isOpen(t)) return t.breached || t.slaState === "breach" ? M.pill("Vi phạm", "bad") : M.pill("Đạt", "ok");
    if (t.status === "approval") return M.pill("Dừng - chờ duyệt", "mute");
    const tone = { ok: "ok", warn: "warn", breach: "bad", paused: "mute" }[t.slaState] || "mute";
    return M.pill(t.slaState === "breach" ? "Vi phạm - " + t.slaLeft.replace(/^vi phạm /, "") : t.slaLeft, tone, t.slaState === "breach");
  }
  function warrantyPill(a) {
    if (!a.warranty || !a.warranty.end) return M.pill("Chưa có thông tin bảo hành", "mute");
    const end = toDate(a.warranty.end);
    const days = Math.round((end - TODAY) / 86400000);
    if (days < 0) return M.pill("Hết bảo hành từ " + a.warranty.end, "bad");
    if (days <= 90) return M.pill(`Còn ${days} ngày (tới ${a.warranty.end})`, "warn");
    return M.pill("Còn bảo hành tới " + a.warranty.end, "ok");
  }
  function threadHtml(t, publicOnly) {
    const list = t.comments && t.comments.length ? t.comments : [{ by: t.requesterId, at: t.created, text: t.desc || t.title }];
    const items = list.filter((c) => !publicOnly || !c.internal);
    if (!items.length) return M.empty("Chưa có trao đổi nào.");
    return `<div class="thread">${items.map((c) => `<div class="msg ${c.internal ? "internal" : ""}">${M.avatar(ename(c.by))}<div class="bubble"><div class="meta"><b>${esc(ename(c.by))}</b><span>${esc(c.at)}</span>${c.internal ? M.pill("Ghi chú nội bộ", "accent") : ""}</div><div>${esc(c.text)}</div></div></div>`).join("")}</div>`;
  }
  const STOP = new Set(["may", "cua", "cho", "khong", "duoc", "toi", "the", "nao", "khi", "voi", "tren", "mot", "cac", "nhung", "bao", "giup", "xin", "can", "lam", "hay", "con", "roi", "vao", "len", "bi", "em", "anh", "chi"]);
  /* Gợi ý bài tri thức theo từ khóa trong tiêu đề (chỉ bài đã xuất bản; publicOnly cho cổng nhân viên) */
  function kbSuggest(text, publicOnly) {
    const words = M.fold(text).split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w));
    if (!words.length) return [];
    return D.kb
      .filter((k) => k.state === "published" && (!publicOnly || k.public))
      .map((k) => { const hay = M.fold(k.title + " " + k.tags.join(" ")); return { k, s: words.filter((w) => hay.includes(w)).length }; })
      .filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map((x) => x.k);
  }
  const logList = (rows) => rows.length
    ? `<ul class="log">${rows.map(([at, text]) => `<li><time>${esc(at)}</time><div><div class="log-title">${esc(text)}</div></div></li>`).join("")}</ul>`
    : M.empty("Chưa có lịch sử.");
  const empOptions = (filter) => D.departments.map((d) => ({ group: d.name, options: D.employees.filter((e) => e.dept === d.id && (!filter || filter(e))).map((e) => [e.id, `${e.name} - ${e.code}`]) })).filter((g) => g.options.length);
  const assetsOf = (empId) => {
    const direct = D.assets.filter((a) => a.holder && a.holder.type === "employee" && a.holder.id === empId);
    const ids = direct.map((a) => a.id);
    return direct.concat(D.assets.filter((a) => a.holder && a.holder.type === "asset" && ids.includes(a.holder.id)));
  };

  M.svc = { TK_ST, PRIO, TYPE, SLA_TARGET, slaPill, stPill, prPill, threadHtml, kbSuggest, nextTicketId, nowStr, myEmp, ename, warrantyPill, assetsOf, route, logList };

  /* ===================== Hàng chờ ticket ===================== */
  const ticketCols = [
    { h: "Mã", r: (t) => `<b class="mono">${esc(t.id)}</b>` },
    { h: "Yêu cầu", cls: "wrap", r: (t) => `<div class="cell-name">${esc(t.title)}</div><div class="cell-sub">${esc(ename(t.requesterId))}</div>` },
    { h: "Ưu tiên", r: prPill },
    { h: "Trạng thái", r: stPill },
    { h: "Người xử lý", r: (t) => (t.assigneeId ? esc(ename(t.assigneeId)) : `<span class="muted">Chưa giao - ${esc(t.group)}</span>`) },
    { h: "SLA", r: slaPill },
  ];
  /* Cột thời điểm tạo, chỉ dùng ở bảng ticket con (vấn đề gốc, thay đổi) */
  const createdCol = { h: "Tạo lúc", r: (t) => `<span class="mono small">${esc(t.created)}</span>` };
  const subTicketCols = (...names) => ticketCols.filter((c) => names.includes(c.h)).concat(createdCol);

  M.action("tk-filter", (el) => {
    const box = el.closest("[data-filters]");
    const qs = new URLSearchParams();
    box.querySelectorAll("select").forEach((s) => { if (s.value) qs.set(s.name, s.value); });
    const s = qs.toString();
    M.go("tickets" + (s ? "?" + s : ""));
  });

  M.screen("tickets", {
    nav: "tickets", title: "Ticket", codes: ["NV-4.1.1", "NV-4.1.2", "NV-4.2.2"],
    render(p, q) {
      const me = myEmp();
      const pass = (t) => (!q.status || t.status === q.status) && (!q.prio || t.priority === q.prio) && (!q.group || t.group === q.group) && (!q.who || (q.who === "none" ? !t.assigneeId : t.assigneeId === q.who));
      const open = D.tickets.filter(isOpen);
      const tbl = (id, list, empty) => M.panel({ flush: true, body: M.toolbar(M.searchBox(id, "Tìm theo mã, tiêu đề, người yêu cầu…")) + M.table({ id, cols: ticketCols, rows: list.filter(pass), href: (t) => "#/tickets/" + t.id, empty }) });
      const queue = open.filter((t) => !t.assigneeId && t.status !== "approval");
      const techs = [...new Set(D.ticketGroups.flatMap((g) => g.members))];
      const filters = `<div class="row" data-filters>
        ${M.select("status", Object.entries(TK_ST).map(([k, v]) => [k, v[0]]), q.status, { blank: "Mọi trạng thái", attrs: 'data-change="tk-filter" aria-label="Trạng thái" style="width:auto"' })}
        ${M.select("prio", Object.entries(PRIO).map(([k, v]) => [k, v[0]]), q.prio, { blank: "Mọi mức ưu tiên", attrs: 'data-change="tk-filter" aria-label="Ưu tiên" style="width:auto"' })}
        ${M.select("group", D.ticketGroups.map((g) => [g.name, g.name]), q.group, { blank: "Mọi nhóm", attrs: 'data-change="tk-filter" aria-label="Nhóm xử lý" style="width:auto"' })}
        ${M.select("who", [["none", "Chưa giao"]].concat(techs.map((id) => [id, ename(id)])), q.who, { blank: "Mọi người xử lý", attrs: 'data-change="tk-filter" aria-label="Người xử lý" style="width:auto"' })}
        ${Object.keys(q).length ? `<a class="linklike" href="#/tickets">Bỏ lọc</a>` : ""}
      </div>`;
      const emailTbl = M.panel({ flush: true, body: M.table({
        id: "tk-email", rows: D.ticketEmailQueue, empty: "Không có email nào chờ xem xét.",
        cols: [
          { h: "Gửi từ", r: (m) => `<span class="mono">${esc(m.from)}</span>` },
          { h: "Tiêu đề thư", cls: "wrap", r: (m) => esc(m.subject) },
          { h: "Nhận lúc", r: (m) => `<span class="mono small">${esc(m.at)}</span>` },
          { h: "", cls: "right", r: (m) => M.btn("Tạo ticket", { sm: true, modal: "tk-email", arg: m.id, perm: "ticket.work" }) + " " + M.btn("Bỏ qua", { sm: true, ghost: true, act: "tk-email-skip", arg: m.id, perm: "ticket.work" }) },
        ] }) });
      const tabs = [
        { key: "open", label: "Đang mở", n: open.length, body: tbl("tk-open", open, "Không có ticket nào khớp bộ lọc.") },
        { key: "incident", label: "Sự cố", n: open.filter((t) => t.type === "incident").length, body: tbl("tk-inc", open.filter((t) => t.type === "incident"), "Không có sự cố nào khớp bộ lọc.") },
        { key: "request", label: "Yêu cầu dịch vụ", n: open.filter((t) => t.type === "request").length, body: tbl("tk-req", open.filter((t) => t.type === "request"), "Không có yêu cầu nào khớp bộ lọc.") },
        { key: "queue", label: "Hàng chờ chung", n: queue.length, body: tbl("tk-queue", queue, "Hàng chờ chung đang trống.") },
        { key: "mine", label: "Của tôi", n: open.filter((t) => t.assigneeId === me).length, body: tbl("tk-mine", open.filter((t) => t.assigneeId === me), "Bạn chưa được giao ticket nào đang mở.") },
        { key: "done", label: "Đã giải quyết / đóng", n: D.tickets.length - open.length, body: tbl("tk-done", D.tickets.filter((t) => !isOpen(t)), "Chưa có ticket nào đã đóng.") },
        { key: "email", label: "Email chờ xem xét", n: D.ticketEmailQueue.length, body: emailTbl },
      ];
      return M.page({
        title: "Ticket",
        sub: "Yêu cầu hỗ trợ từ cổng tự phục vụ, email, chat và hệ thống khác.",
        codes: this.codes,
        actions: M.btn("Tạo ticket", { href: "#/tickets/new", primary: true, icon: "plus", perm: "ticket.work" }) + M.btn("SLA & định tuyến", { href: "#/sla", icon: "timer", roles: ["admin", "helpdesk", "audit"] }),
        body: M.stats([
          { label: "Sắp vi phạm SLA", value: open.filter((t) => t.slaState === "warn").length, tone: "warn" },
          { label: "Đã vi phạm SLA", value: open.filter((t) => t.slaState === "breach").length, tone: "bad" },
          { label: "Chờ duyệt", value: open.filter((t) => t.status === "approval").length, tone: "warn", href: "#/approvals" },
        ]) + filters + M.tabs("tickets", tabs),
      });
    },
  });

  M.defModal("tk-email", (id) => {
    const m = D.ticketEmailQueue.find((x) => x.id === id) || D.ticketEmailQueue[0];
    return {
      title: "Tạo ticket từ email",
      body: M.kv([["Gửi từ", `<span class="mono">${esc(m.from)}</span>`], ["Tiêu đề", esc(m.subject)]]) +
        M.field("Người yêu cầu", M.select("requester", empOptions((e) => e.status !== "left"), "", { blank: "Chọn nhân viên…" }), { req: true }) +
        M.checkbox("remember", "Ghi nhớ địa chỉ này là email phụ của nhân viên", true),
      submit: "Tạo ticket",
      onSubmit(data, form) {
        if (!data.requester) return M.invalid(form, "requester", "Chọn người yêu cầu.");
        const id2 = nextTicketId();
        D.tickets.unshift({ id: id2, title: m.subject.replace(/^Re:\s*/i, ""), type: "incident", category: "Khác", priority: "medium", impact: 1, urgency: 2, status: "new", requesterId: data.requester, assigneeId: null, group: "Helpdesk tuyến 1", assetIds: [], created: nowStr(), channel: "Email", slaDue: "02/12/2026 17:30", slaState: "ok", slaLeft: "còn 4 giờ để nhận", slaPct: 0, desc: m.subject });
        D.ticketEmailQueue = D.ticketEmailQueue.filter((x) => x.id !== m.id);
        return `Đã tạo ${id2} cho ${ename(data.requester)} từ email.`;
      },
    };
  });
  M.action("tk-email-skip", (el, id) => { D.ticketEmailQueue = D.ticketEmailQueue.filter((x) => x.id !== id); M.refresh(); return "Đã bỏ qua email này."; });

  /* ===================== Tạo ticket (Helpdesk tạo hộ) ===================== */
  const prioMatrix = () => `<div class="table-scroll"><table><thead><tr><th>Ảnh hưởng \\ Khẩn cấp</th>${URGENCY.map(([, l]) => `<th>${esc(l.split(":")[0])}</th>`).join("")}</tr></thead><tbody>${IMPACT.map(([iv, il]) => `<tr><td class="wrap">${esc(il)}</td>${URGENCY.map(([uv]) => `<td>${M.pill(...PRIO[prioFrom(iv, uv)])}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const assetOptions = (empId) => {
    const mine = assetsOf(empId);
    const opts = [["", "Không gắn tài sản"]];
    if (mine.length) opts.push({ group: "Đang giao cho người yêu cầu", options: mine.map((a) => [a.id, `${a.tag} - ${a.name}`]) });
    opts.push({ group: "Tài sản khác (thiết bị dùng chung, hạ tầng)", options: D.assets.filter((a) => !mine.includes(a) && a.status !== "archived" && (!a.holder || a.holder.type === "location")).map((a) => [a.id, `${a.tag} - ${a.name}`]) });
    return opts;
  };
  function newTicketPreview() {
    const f = document.querySelector('form[data-form="tk-create"]');
    if (!f) return;
    const v = (n) => (f.querySelector(`[name="${n}"]`) || {}).value || "";
    const pr = prioFrom(v("impact"), v("urgency"));
    const pe = document.getElementById("tk-prio");
    if (pe) pe.innerHTML = M.pill(...PRIO[pr]) + ` <span class="muted small">mục tiêu nhận ${esc(SLA_TARGET[pr][0])}, giải quyết ${esc(SLA_TARGET[pr][1])}</span>`;
    const re = document.getElementById("tk-route");
    if (re) re.textContent = route({ category: v("category"), requesterId: v("requester"), assetIds: v("asset") ? [v("asset")] : [] }).text;
  }
  M.action("tk-new-change", newTicketPreview);
  M.action("tk-new-requester", (el) => {
    const sel = document.querySelector('form[data-form="tk-create"] [name="asset"]');
    if (sel) sel.outerHTML = M.select("asset", assetOptions(el.value), "", { attrs: 'data-change="tk-new-change"' });
    const e = M.emp(el.value);
    const warn = document.getElementById("tk-req-warn");
    if (warn) warn.innerHTML = e && e.status === "leaving" ? M.note(`${esc(e.name)} đã có ngày nghỉ ${esc(e.leaveDate)}: không cấp phát mới cho người này.`, "warn") : "";
    newTicketPreview();
  });

  M.screen("tickets/new", {
    nav: "tickets", title: "Tạo ticket", codes: ["NV-4.1.1", "NV-4.1.2", "NV-4.3.1"],
    render(p, q) {
      const req = q.requester || "";
      const form = M.form("tk-create", `<div class="form-grid">
          ${M.field("Người yêu cầu", M.select("requester", empOptions((e) => e.status !== "left"), req, { blank: "Chọn nhân viên…", attrs: 'data-change="tk-new-requester"' }), { req: true })}
          ${M.field("Loại", M.select("type", Object.entries(TYPE), "incident"))}
          ${M.field("Danh mục dịch vụ", M.select("category", CATEGORIES, "Phần cứng máy tính", { attrs: 'data-change="tk-new-change"' }))}
          ${M.field("Kênh tiếp nhận", M.select("channel", ["Điện thoại", "Gặp trực tiếp", "Email", "Chat Teams"], "Điện thoại"))}
          <div class="full" id="tk-req-warn"></div>
          ${M.field("Tiêu đề", M.input("title", { ph: "Ví dụ: Laptop không lên nguồn" }), { req: true, full: true })}
          ${M.field("Mô tả", M.textarea("desc", "", { ph: "Hiện tượng, thời điểm bắt đầu, đã thử những gì…" }), { full: true })}
          ${M.field("Mức ảnh hưởng", M.select("impact", IMPACT, "1", { attrs: 'data-change="tk-new-change"' }))}
          ${M.field("Mức khẩn cấp", M.select("urgency", URGENCY, "2", { attrs: 'data-change="tk-new-change"' }))}
          <div class="field">Ưu tiên (tự tính)<div id="tk-prio">${M.pill(...PRIO.low)}</div></div>
          ${M.field("Tài sản liên quan", M.select("asset", assetOptions(req), "", { attrs: 'data-change="tk-new-change"' }))}
          ${M.field("Đính kèm ảnh", '<input type="file" name="files" multiple accept="image/*,.pdf">', { full: true })}
        </div>
        <hr class="divider">
        <div class="form-actions">${M.btn("Tạo ticket", { type: "submit", primary: true })}${M.btn("Hủy", { href: "#/tickets" })}</div>`);
      return M.page({
        title: "Tạo ticket hộ người dùng",
        back: ["#/tickets", "Ticket"], codes: this.codes,
        body: `<div class="side-layout"><div class="panel"><div class="panel-body">${form}</div></div><div class="stack">
          ${M.panel({ title: "Định tuyến dự kiến", actions: M.can("sla.config") ? '<a class="small" href="#/sla">Sửa quy tắc</a>' : "", body: `<p id="tk-route">${esc(route({ category: "Phần cứng máy tính", requesterId: req, assetIds: [] }).text)}</p>` })}
          ${M.panel({ title: "Ma trận ưu tiên (đề xuất)", flush: true, body: prioMatrix() })}
        </div></div>`,
      });
    },
    after() { newTicketPreview(); },
  });

  M.action("tk-create", (form, data) => {
    if (!data.requester) return M.invalid(form, "requester", "Chọn người yêu cầu.");
    if (!String(data.title || "").trim()) return M.invalid(form, "title", "Nhập tiêu đề yêu cầu.");
    const id = nextTicketId();
    const assetIds = data.asset ? [data.asset] : [];
    const r = route({ category: data.category, requesterId: data.requester, assetIds });
    const pr = prioFrom(data.impact, data.urgency);
    D.tickets.unshift({
      id, title: data.title.trim(), type: data.type, category: data.category, priority: pr, impact: +data.impact, urgency: +data.urgency,
      status: "new", requesterId: data.requester, assigneeId: r.assignee, group: r.group, assetIds, created: nowStr(), channel: data.channel,
      slaDue: "28/11/2026 17:30", slaState: "ok", slaLeft: "còn " + SLA_TARGET[pr][0] + " để nhận", slaPct: 0, desc: data.desc || "",
      history: [[nowStr(), `${ename(myEmp())} tạo hộ qua kênh ${data.channel}`], [nowStr(), r.text]],
    });
    M.go("tickets/" + id);
    return `Đã tạo ${id}. ${ename(data.requester)} nhận email xác nhận kèm mã ticket.`;
  });

  /* ===================== Chi tiết ticket ===================== */
  function offItems(t) {
    const o = t.offboard;
    const items = [];
    o.assetIds.forEach((id) => {
      const a = M.asset(id);
      const held = a.holder && a.holder.type === "employee" && a.holder.id === o.employeeId;
      items.push({ kind: "Tài sản", label: `${a.tag} - ${a.name}`, link: "#/assets/" + a.id, done: !held, act: held ? M.btn("Thu hồi", { sm: true, modal: "tk-asset-return", arg: t.id + "|" + a.id, perm: "asset.checkout" }) : "" });
    });
    o.accessoryIds.forEach((id) => {
      const ac = M.find("accessories", id);
      const h = ac.holdings.find(([e]) => e === o.employeeId);
      items.push({ kind: "Phụ kiện", label: `${ac.name}${h ? " × " + h[1] : ""}`, link: "#/accessories", done: !h, act: h ? M.btn("Thu hồi", { sm: true, modal: "tk-acc-return", arg: t.id + "|" + ac.id, perm: "stock.manage" }) : "" });
    });
    const licIds = new Set((D.licenses || []).map((l) => l.id));
    o.seats.forEach((s, i) => {
      items.push({ kind: "Ghế bản quyền", label: `${s.name} - ${s.via}`, link: licIds.has(s.key) ? "#/licenses/" + s.key : "#/licenses", done: s.done, act: s.done ? "" : M.btn("Thu hồi ghế", { sm: true, act: "tk-seat-return", arg: t.id + "|" + i, perm: "license.manage" }) });
    });
    return items;
  }
  const offRemaining = (t) => (t.offboard ? offItems(t).filter((x) => !x.done).length : 0);

  function offboardPanel(t) {
    const o = t.offboard;
    const e = M.emp(o.employeeId);
    const items = offItems(t);
    const left = items.filter((x) => !x.done).length;
    return M.panel({
      title: `Thu hồi khi nghỉ việc (${items.length - left}/${items.length})`,
      actions: M.btn("Đóng ticket", { sm: true, primary: true, act: "tk-off-close", arg: t.id, perm: "ticket.work" }),
      flush: true,
      body: `<div class="panel-body" style="padding:14px 16px">${M.kv([["Nhân viên", M.person(e.name, "#/employees/" + e.id, `${e.code} - ${M.EMP_STATUS[e.status][0]}`)], ["Ngày nghỉ", esc(o.leaveDate)], ["Nguồn", `HRM - sự kiện ${esc(o.hrRef)}`]])}<div style="margin-top:12px">${M.progress(items.length - left, items.length, left ? "warn" : "ok")}</div></div>` +
        M.table({ id: "tk-off", rows: items, cols: [
          { h: "Loại", r: (x) => esc(x.kind) },
          { h: "Món cần thu hồi", cls: "wrap", r: (x) => `<a href="${x.link}">${esc(x.label)}</a>` },
          { h: "Trạng thái", r: (x) => (x.done ? M.pill("Đã thu", "ok") : M.pill("Chưa thu", "warn")) },
          { h: "", cls: "right", r: (x) => x.act },
        ] }),
      foot: left ? "" : "<span>Đóng ticket sẽ chuyển nhân viên sang Đã nghỉ.</span>",
    });
  }

  function slaPanel(t) {
    const [rt, st] = SLA_TARGET[t.priority];
    const pct = t.slaPct != null ? t.slaPct : ({ ok: 40, warn: 90, breach: 100, paused: 55 }[t.slaState] || 0);
    const tone = { ok: "ok", warn: "warn", breach: "bad", paused: "mute" }[t.slaState] || "ok";
    const body = `
      <div class="stack-sm">
        <div class="row between"><span class="muted">Nhận trong ${esc(rt)}</span>${t.respondedAt ? M.pill("Đạt lúc " + t.respondedAt.split(" ")[1], "ok") : t.status === "approval" ? M.pill("Chưa tính", "mute") : M.pill(t.slaLeft, tone)}</div>
        <div class="row between"><span class="muted">Giải quyết trong ${esc(st)}</span>${slaPill(t)}</div>
        ${isOpen(t) && t.status !== "approval" ? `${M.progress(pct, 100, tone)}<div class="row between small"><span class="muted">Hạn</span><b class="mono">${esc(t.slaDue)}</b></div>` : ""}
        ${(t.escalations || []).length ? `<div><div class="muted small" style="margin-bottom:6px">Leo thang</div>${logList(t.escalations)}</div>` : ""}
      </div>`;
    return M.panel({ title: "Cam kết dịch vụ (SLA)", body });
  }

  function assetPanel(t) {
    const work = M.can("ticket.work") && t.status !== "closed";
    const list = t.assetIds.map((id) => M.asset(id)).filter(Boolean);
    const blocks = list.map((a) => {
      const prev = D.tickets.filter((x) => x.id !== t.id && x.assetIds.includes(a.id));
      const tech = a.tech;
      const cfg = tech ? `<span class="mono small">${esc(tech.hostname)} - IP ${esc(tech.ip)}</span><br>${esc(tech.os)}<br>${esc(tech.cpu)} - RAM ${esc(tech.ram)}` : '<span class="muted">Chưa có dữ liệu agent</span>';
      const canAct = M.can("asset.checkout");
      const acts = !work ? "" : canAct
        ? [a.status !== "maintenance" && a.status !== "archived" ? M.btn("Chuyển sang Đang sửa chữa", { sm: true, act: "tk-asset-repair", arg: t.id + "|" + a.id, confirm: a.status === "deployed" ? `Thu hồi ${a.tag} từ ${M.holderText(a)} rồi chuyển sang Đang sửa chữa? Dòng lưu ký ghi mã ${t.id} làm lý do.` : "" }) : "",
           M.btn("Gỡ khỏi ticket", { sm: true, ghost: true, act: "tk-unlink", arg: t.id + "|" + a.id })].join(" ")
        : M.btn("Gỡ khỏi ticket", { sm: true, ghost: true, act: "tk-unlink", arg: t.id + "|" + a.id });
      return `<div class="stack-sm" style="padding-bottom:14px;border-bottom:1px dashed var(--line)">
        <div class="row">${M.tape(a.tag, a.id)}${M.led(a.status)}</div>
        <div class="strong">${esc(a.name)}</div>
        ${M.kv([["Người giữ", M.holderHtml(a)], ["Cấu hình", cfg], ["Bảo hành", warrantyPill(a)], ["Ticket trước đây", prev.length ? prev.map((x) => `<a href="#/tickets/${esc(x.id)}" class="mono" title="${esc(x.title)}">${esc(x.id)}</a>`).join(", ") + (prev.length >= 2 ? " " + M.pill("Hỏng lặp lại, cân nhắc thay máy", "warn") : "") : '<span class="muted">Chưa có</span>']])}
        ${acts ? `<div class="row">${acts}</div>` : ""}
      </div>`;
    }).join("");
    const actions = work ? M.btn("Gắn tài sản", { sm: true, icon: "link", modal: "tk-link", arg: t.id }) : "";
    const extra = work && M.can("asset.checkout") && t.status !== "approval"
      ? `<div class="row" style="margin-top:12px">${M.btn(t.type === "incident" ? "Cấp máy thay thế tạm" : "Cấp phát từ ticket", { sm: true, icon: "box", modal: "tk-checkout", arg: t.id })}</div>`
      : "";
    return M.panel({ title: `Tài sản gắn kèm (${list.length})`, actions, body: (blocks || M.empty("Chưa gắn tài sản nào.")) + extra });
  }

  /* Gợi ý bài tri thức khi ticket chưa gắn bài nào; bài đã gắn hiện ở panel Thông tin */
  function kbPanel(t) {
    if (t.kbId || !M.can("ticket.work") || !isOpen(t)) return "";
    const sug = kbSuggest(t.title + " " + (t.category || ""), false);
    if (!sug.length) return "";
    return M.panel({
      title: "Bài tri thức gợi ý",
      body: sug.map((k) => `<div class="row between" style="padding:6px 0"><span><a href="#/kb/${esc(k.id)}">${esc(k.title)}</a> ${k.public ? M.pill("Công khai", "info") : M.pill("Nội bộ", "mute")}</span>${M.btn("Gắn", { sm: true, act: "tk-kb", arg: t.id + "|" + k.id })}</div>`).join(""),
    });
  }

  function headActions(t) {
    if (!M.can("ticket.work")) return "";
    const S = (label, to, primary) => M.btn(label, { act: "tk-status", arg: t.id + "|" + to, primary });
    const b = [];
    if (!["closed", "approval"].includes(t.status)) b.push(M.btn("Chuyển người xử lý", { modal: "tk-assign", arg: t.id, icon: "swap" }));
    if (t.status === "new") b.push(S("Nhận xử lý", "owned", true));
    if (t.status === "owned") b.push(S("Bắt đầu xử lý", "working", true));
    if (t.status === "working") b.push(S("Hỏi lại người yêu cầu", "waiting"), M.btn("Đánh dấu đã giải quyết", { modal: "tk-resolve", arg: t.id, primary: true }));
    if (t.status === "waiting") b.push(S("Ghi nhận trả lời", "working", true));
    if (t.status === "resolved") b.push(S("Mở lại", "working"), S("Đóng ticket", "closed", true));
    if (t.status === "approval") b.push(M.btn("Xem phê duyệt", { href: "#/approvals" }));
    return b.join("");
  }

  M.screen("tickets/:id", {
    nav: "tickets", title: "Ticket", codes: ["NV-4.1.3", "NV-4.2.2", "NV-4.2.3", "NV-4.3.1", "NV-4.3.2"],
    render(p) {
      const t = ticket(p.id);
      if (!t) return M.page({ title: "Không tìm thấy ticket", back: ["#/tickets", "Ticket"], sub: `Không có ticket mã <code>${esc(p.id)}</code>.` });
      const work = M.can("ticket.work") && t.status !== "closed";
      const flow = t.hadApproval || t.status === "approval" ? ["new", "approval", "owned", "working", "waiting", "resolved", "closed"] : ["new", "owned", "working", "waiting", "resolved", "closed"];
      const codes = this.codes.concat(t.offboard ? ["NV-7.3.4"] : [], t.hadApproval ? ["NV-4.1.4"] : []);
      const req = M.emp(t.requesterId);
      const pb = problemOf(t);
      const ch = changeOf(t);
      const kb = t.kbId && M.find("kb", t.kbId);
      const work2 = (t.work || []);
      const totalMin = work2.reduce((s, w) => s + w[2], 0);
      const history = (t.history && t.history.length ? t.history : [[t.created, `Tạo từ ${t.channel} bởi ${ename(t.requesterId)}`]]).slice().reverse();

      /* Mô tả thường trùng tin nhắn đầu của trao đổi; chỉ hiện riêng khi khác */
      const descDup = !(t.comments && t.comments.length) || t.comments[0].text === t.desc;
      const files = (t.attachments || []).length ? `<div class="row" style="margin-bottom:12px">${t.attachments.map((f) => `<span class="pill t-mute">${M.icon("paperclip")}${esc(f)}</span>`).join("")}</div>` : "";
      const descHtml = (!descDup && t.desc ? `<p style="margin-bottom:12px">${esc(t.desc)}</p>` : "") + files;
      const pbNote = pb && pb.workaround && isOpen(t) ? M.note(`Thuộc vấn đề gốc <a href="#/problems/${esc(pb.id)}">${esc(pb.id)}</a>. Cách xử lý tạm thời: ${esc(pb.workaround)}`, "info") : "";
      const resPanel = t.resolution || t.rejectReason ? M.panel({ title: t.rejectReason ? "Bị từ chối khi duyệt" : "Cách khắc phục", body: `<p>${esc(t.rejectReason || t.resolution)}</p>` }) : "";
      const commentForm = work ? M.form("tk-comment", `<input type="hidden" name="id" value="${esc(t.id)}">
          ${M.field("Trả lời", M.textarea("text", "", { ph: "Nội dung trao đổi…", rows: 3 }))}
          <div class="row between" style="margin-top:10px">${M.checkbox("internal", "Ghi chú nội bộ (người yêu cầu không thấy)", false)}${M.btn("Gửi", { type: "submit", primary: true, sm: true })}</div>`) : "";
      const thread = M.panel({ title: "Trao đổi", body: descHtml + threadHtml(t, false) + (commentForm ? `<hr class="divider">${commentForm}` : "") });
      const workPanel = M.panel({
        flush: true,
        actions: work ? M.btn("Ghi công việc", { sm: true, icon: "plus", modal: "tk-work", arg: t.id }) : "",
        body: M.table({ id: "tk-work-" + t.id, rows: work2, empty: "Chưa ghi công việc nào.", cols: [
          { h: "Thời điểm", r: (w) => `<span class="mono small">${esc(w[0])}</span>` },
          { h: "Người làm", r: (w) => esc(ename(w[1])) },
          { h: "Nội dung", cls: "wrap", r: (w) => esc(w[3]) },
          { h: "Thời gian", cls: "right", r: (w) => `<span class="mono">${esc(w[2])} phút</span>` },
        ] }),
        foot: work2.length ? `<span>Tổng thời gian</span><b>${esc(totalMin)} phút</b>` : "",
      });
      const logTabs = M.tabs("tk-log", [
        { key: "work", label: "Công việc đã làm", n: work2.length, body: workPanel },
        { key: "hist", label: "Lịch sử", n: history.length, body: M.panel({ body: logList(history) }) },
      ]);
      const info = M.panel({
        title: "Thông tin",
        actions: work ? M.btn("Đổi ưu tiên", { sm: true, ghost: true, modal: "tk-prio", arg: t.id }) : "",
        body: M.kv([
          ["Người yêu cầu", req ? M.person(req.name, "#/employees/" + req.id, (M.dept(req.dept) || {}).name) : esc(ename(t.requesterId))],
          ["Danh mục", esc(t.category || "Khác")],
          ["Người xử lý", t.assigneeId ? esc(`${ename(t.assigneeId)} - ${t.group}`) : `<span class="muted">Chưa giao - ${esc(t.group)}</span>`],
          ["Tiếp nhận", `${esc(t.channel)} - <span class="mono">${esc(t.created)}</span>`],
          t.resolvedAt ? ["Giải quyết lúc", `<span class="mono">${esc(t.resolvedAt)}</span>`] : null,
          pb ? ["Vấn đề gốc", `<a href="#/problems/${esc(pb.id)}" class="mono">${esc(pb.id)}</a>`] : null,
          ch ? ["Phát sinh sau thay đổi", `<a href="#/changes/${esc(ch.id)}" class="mono">${esc(ch.id)}</a>`] : null,
          kb ? ["Bài tri thức", `<a href="#/kb/${esc(kb.id)}" class="mono" title="${esc(kb.title)}">${esc(kb.id)}</a>`] : null,
        ]),
      });
      return M.page({
        title: `<span class="mono">${esc(t.id)}</span> - ${esc(t.title)}`,
        back: ["#/tickets", "Hàng chờ ticket"], codes,
        sub: `${stPill(t)} ${prPill(t)} ${M.pill(TYPE[t.type], "mute")}`,
        actions: headActions(t),
        above: `<div class="panel"><div class="panel-body" style="padding:10px 16px">${M.steps(flow.map((s) => FLOW_LABEL[s]), t.status === "closed" ? flow.length : flow.indexOf(t.status))}</div></div>`,
        body: `<div class="side-layout"><div class="stack">${pbNote}${t.offboard ? offboardPanel(t) : ""}${resPanel}${thread}${logTabs}</div>
          <div class="stack">${slaPanel(t)}${info}${assetPanel(t)}${kbPanel(t)}</div></div>`,
      });
    },
  });

  /* ----- Hành động trên ticket ----- */
  const hist = (t, text) => { (t.history = t.history || [[t.created, `Tạo từ ${t.channel} bởi ${ename(t.requesterId)}`]]).push([nowStr(), text]); };
  M.action("tk-status", (el, arg) => {
    const [id, to] = arg.split("|");
    const t = ticket(id);
    const from = t.status;
    if (to === "closed" && offRemaining(t)) { M.toast(`Còn ${offRemaining(t)} món chưa thu hồi nên chưa đóng được ticket.`, "bad"); return; }
    t.status = to;
    let msg = `${t.id}: ${FLOW_LABEL[from]} → ${FLOW_LABEL[to]}.`;
    if (to === "owned") {
      if (!t.assigneeId) t.assigneeId = myEmp();
      t.respondedAt = t.respondedAt || nowStr();
      hist(t, `${ename(myEmp())} nhận xử lý - Mới → Đã nhận`);
      msg = `Đã nhận xử lý ${t.id}.`;
    } else if (to === "waiting") {
      t.slaBefore = t.slaState; t.slaLeftBefore = t.slaLeft;
      t.slaState = "paused"; t.slaLeft = "Dừng ở Chờ phản hồi";
      hist(t, "Đang xử lý → Chờ phản hồi - đồng hồ SLA dừng");
      msg = `Đã chuyển ${t.id} sang Chờ phản hồi. Đồng hồ SLA tạm dừng.`;
    } else if (from === "waiting" && to === "working") {
      t.slaState = t.slaBefore || "ok"; t.slaLeft = t.slaLeftBefore || "đang chạy lại";
      hist(t, "Người yêu cầu trả lời - Chờ phản hồi → Đang xử lý - đồng hồ SLA chạy tiếp");
      msg = "Người yêu cầu đã trả lời. Đồng hồ SLA chạy tiếp.";
    } else if (from === "resolved" && to === "working") {
      hist(t, "Mở lại - Đã giải quyết → Đang xử lý");
      msg = `Đã mở lại ${t.id}.`;
    } else if (to === "closed") {
      t.closedAt = nowStr();
      hist(t, "Đã giải quyết → Đã đóng");
      msg = `Đã đóng ${t.id}. Ticket đã đóng không sửa được nội dung.`;
    } else hist(t, `${FLOW_LABEL[from]} → ${FLOW_LABEL[to]}`);
    M.refresh();
    return msg;
  });

  M.action("tk-comment", (form, data) => {
    const t = ticket(data.id);
    if (!String(data.text || "").trim()) return M.invalid(form, "text", "Nhập nội dung trao đổi.");
    (t.comments = t.comments && t.comments.length ? t.comments : [{ by: t.requesterId, at: t.created, text: t.desc || t.title }]).push({ by: myEmp(), at: nowStr(), internal: !!data.internal, text: data.text.trim() });
    M.refresh();
    return data.internal ? "Đã thêm ghi chú nội bộ. Người yêu cầu không thấy ghi chú này." : "Đã gửi bình luận. Người yêu cầu được thông báo qua email.";
  });

  M.defModal("tk-resolve", (id) => {
    const t = ticket(id);
    const kbs = D.kb.filter((k) => k.state === "published");
    return {
      title: `Đánh dấu đã giải quyết ${t.id}`,
      body: M.field("Cách khắc phục", M.textarea("resolution", "", { ph: "Đã làm gì để khắc phục…", rows: 4 }), { req: true }) +
        M.field("Bài tri thức", M.select("kb", kbs.map((k) => [k.id, `${k.id} - ${k.title}`]), t.kbId || "", { blank: "Không gắn bài nào" })) +
        M.field("Thời gian bỏ ra thêm (phút)", M.input("minutes", { type: "number", value: "15", attrs: 'min="0"' })),
      submit: "Đã giải quyết",
      onSubmit(data, form) {
        if (offRemaining(t)) { M.toast(`Còn ${offRemaining(t)} món chưa thu hồi nên chưa giải quyết được ticket này.`, "bad"); return false; }
        if (!String(data.resolution || "").trim()) return M.invalid(form, "resolution", "Nhập cách khắc phục trước khi đánh dấu đã giải quyết.");
        t.resolution = data.resolution.trim();
        t.kbId = data.kb || t.kbId;
        t.status = "resolved"; t.resolvedAt = nowStr();
        if (+data.minutes > 0) (t.work = t.work || []).push([nowStr(), myEmp(), +data.minutes, "Khắc phục và kiểm tra lại"]);
        hist(t, "Đang xử lý → Đã giải quyết");
        return `Đã đánh dấu ${t.id} đã giải quyết. Người yêu cầu được mời xác nhận.`;
      },
    };
  });

  M.defModal("tk-assign", (id) => {
    const t = ticket(id);
    const opts = D.ticketGroups.map((g) => ({ group: g.name, options: g.members.map((m) => [g.name + "|" + m, ename(m)]) }));
    return {
      title: `Chuyển người xử lý ${t.id}`,
      body: M.kv([["Đang giao", t.assigneeId ? esc(`${ename(t.assigneeId)} - ${t.group}`) : esc(`Hàng chờ chung - ${t.group}`)]]) +
        M.field("Chuyển cho", M.select("to", [["queue|", "Trả về hàng chờ chung Helpdesk"]].concat(opts), "", { blank: "Chọn nhóm và người…" }), { req: true }) +
        M.field("Lý do", M.textarea("reason", "", { rows: 2, ph: "Ví dụ: cần quyền quản trị hạ tầng" })),
      submit: "Chuyển",
      onSubmit(data, form) {
        if (!data.to) return M.invalid(form, "to", "Chọn người nhận.");
        const [g, m] = data.to.split("|");
        const before = t.assigneeId ? ename(t.assigneeId) : "hàng chờ chung";
        if (g === "queue") { t.assigneeId = null; t.group = "Helpdesk tuyến 1"; } else { t.group = g; t.assigneeId = m; }
        const after = t.assigneeId ? ename(t.assigneeId) : "hàng chờ chung";
        hist(t, `Chuyển người xử lý: ${before} → ${after} (bởi ${ename(myEmp())})${data.reason ? " - " + data.reason : ""}`);
        return `Đã chuyển ${t.id} cho ${after}. Lịch sử ticket ghi người chuyển, người nhận và thời điểm.`;
      },
    };
  });

  M.defModal("tk-prio", (id) => {
    const t = ticket(id);
    return {
      title: `Đổi mức ưu tiên ${t.id}`,
      body: M.field("Ưu tiên mới", M.select("priority", Object.entries(PRIO).map(([k, v]) => [k, `${v[0]} - nhận ${SLA_TARGET[k][0]}, giải quyết ${SLA_TARGET[k][1]}`]), t.priority)),
      submit: "Đổi ưu tiên",
      onSubmit(data) {
        if (data.priority === t.priority) return "Mức ưu tiên không đổi.";
        hist(t, `Đổi ưu tiên ${PRIO[t.priority][0]} → ${PRIO[data.priority][0]}; hạn SLA tính lại theo mức mới`);
        t.priority = data.priority;
        return `Đã đổi ưu tiên ${t.id} thành ${PRIO[data.priority][0]}. Hạn SLA đã tính lại.`;
      },
    };
  });

  M.defModal("tk-work", (id) => ({
    title: "Ghi công việc đã làm",
    body: M.field("Nội dung", M.textarea("text", "", { rows: 3 }), { req: true }) + M.field("Thời gian bỏ ra (phút)", M.input("minutes", { type: "number", value: "15", attrs: 'min="1"' }), { req: true }),
    submit: "Ghi",
    onSubmit(data, form) {
      if (!String(data.text || "").trim()) return M.invalid(form, "text", "Nhập nội dung công việc.");
      if (!(+data.minutes > 0)) return M.invalid(form, "minutes", "Thời gian phải lớn hơn 0.");
      (ticket(id).work = ticket(id).work || []).push([nowStr(), myEmp(), +data.minutes, data.text.trim()]);
      return "Đã ghi công việc.";
    },
  }));

  M.defModal("tk-link", (id) => {
    const t = ticket(id);
    const opts = D.assets.filter((a) => !t.assetIds.includes(a.id)).map((a) => [a.id, `${a.tag} - ${a.name}`]);
    return {
      title: `Gắn tài sản vào ${t.id}`,
      body: M.field("Tài sản", M.select("asset", opts, "", { blank: "Chọn tài sản…" }), { req: true }),
      submit: "Gắn",
      onSubmit(data, form) {
        if (!data.asset) return M.invalid(form, "asset", "Chọn tài sản.");
        t.assetIds.push(data.asset);
        hist(t, `Gắn tài sản ${M.asset(data.asset).tag}`);
        return `Đã gắn ${M.asset(data.asset).tag} vào ${t.id}.`;
      },
    };
  });
  M.action("tk-unlink", (el, arg) => {
    const [id, aid] = arg.split("|");
    const t = ticket(id);
    t.assetIds = t.assetIds.filter((x) => x !== aid);
    hist(t, `Gỡ tài sản ${M.asset(aid).tag}`);
    M.refresh();
    return `Đã gỡ ${M.asset(aid).tag} khỏi ${t.id}. Liên kết mất ở cả hai phía.`;
  });
  M.action("tk-kb", (el, arg) => {
    const [id, kid] = arg.split("|");
    const t = ticket(id);
    t.kbId = kid;
    hist(t, `Gắn bài tri thức ${kid} làm cách giải quyết`);
    M.refresh();
    return `Đã gắn ${kid} vào ${t.id} làm cách giải quyết.`;
  });

  /* NV-4.3.2: thao tác tài sản từ ticket, đi qua đúng quy tắc của Module 2 */
  M.action("tk-asset-repair", (el, arg) => {
    const [id, aid] = arg.split("|");
    const t = ticket(id);
    const a = M.asset(aid);
    if (!M.can("asset.checkout")) return "Bạn không có quyền thu hồi tài sản.";
    let msg;
    if (a.status === "deployed") {
      const prev = M.holderText(a);
      a.holder = null; a.location = "l7"; a.status = "maintenance";
      hist(t, `Thu hồi ${a.tag} từ ${prev}, chuyển Đang sửa chữa (lý do: ${t.id})`);
      msg = `Đã thu hồi ${a.tag} từ ${prev} và chuyển sang Đang sửa chữa. Dòng lưu ký ghi lý do ${t.id}.`;
    } else {
      const before = M.STATUS[a.status];
      a.status = "maintenance";
      hist(t, `Đổi trạng thái ${a.tag}: ${before} → Đang sửa chữa (lý do: ${t.id})`);
      msg = `Đã chuyển ${a.tag} sang Đang sửa chữa. Dòng lưu ký ghi lý do ${t.id}.`;
    }
    M.refresh();
    return msg;
  });

  M.defModal("tk-checkout", (id) => {
    const t = ticket(id);
    const target = M.emp(t.requesterId);
    const ready = D.assets.filter((a) => a.status === "ready");
    return {
      title: t.type === "incident" ? "Cấp máy thay thế tạm" : "Cấp phát từ ticket",
      body: M.kv([["Cấp cho", esc(`${target.name} - ${target.code}`)], ["Lý do", `<span class="mono">${esc(t.id)}</span>`]]) +
        M.field("Tài sản Sẵn sàng cấp phát", M.select("asset", ready.map((a) => [a.id, `${a.tag} - ${a.name}`]), "", { blank: "Chọn tài sản…" }), { req: true }) +
        (t.type === "incident" ? M.field("Ngày dự kiến trả", M.input("due", { type: "date" })) : ""),
      submit: "Cấp phát",
      onSubmit(data, form) {
        if (!data.asset) return M.invalid(form, "asset", "Chọn tài sản cần cấp.");
        if (target.status !== "active") return M.invalid(form, "asset", `${target.name} đã có ngày nghỉ, không cấp phát mới được.`);
        const a = M.asset(data.asset);
        if (a.status !== "ready") return M.invalid(form, "asset", `Chỉ cấp phát được tài sản đang Sẵn sàng cấp phát. Tài sản này đang ở trạng thái ${M.STATUS[a.status]}.`);
        a.status = "deployed"; a.holder = { type: "employee", id: target.id }; a.location = null;
        if (!t.assetIds.includes(a.id)) t.assetIds.push(a.id);
        hist(t, `Cấp phát ${a.tag} cho ${target.name} (lý do: ${t.id})`);
        return `Đã cấp ${a.tag} cho ${target.name} từ ${t.id}. Hệ thống sinh biên bản bàn giao chờ ký.`;
      },
    };
  });

  /* Thu hồi khi nghỉ việc (T-1047) */
  M.defModal("tk-asset-return", (arg) => {
    const [id, aid] = arg.split("|");
    const a = M.asset(aid);
    return {
      title: `Thu hồi ${a.tag}`,
      body: M.kv([["Tài sản", esc(a.name)], ["Đang giao cho", M.holderHtml(a)]]) +
        M.field("Trạng thái sau khi thu hồi", M.select("status", [["ready", M.STATUS.ready], ["maintenance", M.STATUS.maintenance], ["broken", M.STATUS.broken]], "ready")) +
        M.field("Ghi chú", M.textarea("note", "", { rows: 2 })),
      submit: "Thu hồi",
      onSubmit(data) {
        const t = ticket(id);
        const prev = M.holderText(a);
        a.holder = null; a.location = "l7"; a.status = data.status;
        hist(t, `Thu hồi ${a.tag} từ ${prev} → ${M.STATUS[data.status]} (lý do: ${t.id})`);
        return `Đã thu hồi ${a.tag} từ ${prev}. Đã sinh biên bản trả.`;
      },
    };
  });
  M.defModal("tk-acc-return", (arg) => {
    const [id, acid] = arg.split("|");
    const ac = M.find("accessories", acid);
    const t = ticket(id);
    const emp = t.offboard.employeeId;
    const h = ac.holdings.find(([e]) => e === emp);
    return {
      title: `Thu hồi ${ac.name}`,
      body: M.kv([["Đang giữ", esc(`${ename(emp)} - ${h ? h[1] : 0} chiếc`)], ["Tồn kho hiện tại", esc(ac.stock)]]) +
        M.field("Tình trạng khi nhận lại", M.select("cond", [["ok", "Tốt, nhập lại kho"], ["broken", "Hỏng, không cộng lại kho"], ["lost", "Mất, không cộng lại kho"]], "ok")),
      submit: "Thu hồi",
      onSubmit(data) {
        const qty = h ? h[1] : 0;
        ac.holdings = ac.holdings.filter(([e]) => e !== emp);
        if (data.cond === "ok") ac.stock += qty;
        hist(t, `Thu hồi ${qty} ${ac.name} từ ${ename(emp)}${data.cond === "ok" ? ", nhập lại kho" : data.cond === "broken" ? ", ghi hỏng" : ", ghi mất"}`);
        return data.cond === "ok" ? `Đã thu hồi ${ac.name}. Tồn kho tăng lên ${ac.stock}.` : `Đã ghi nhận ${ac.name} ${data.cond === "broken" ? "hỏng" : "mất"}; tồn kho không tăng.`;
      },
    };
  });
  M.action("tk-seat-return", (el, arg) => {
    const [id, i] = arg.split("|");
    const t = ticket(id);
    const s = t.offboard.seats[+i];
    s.done = true;
    hist(t, `Thu hồi ghế bản quyền ${s.name}`);
    M.refresh();
    return `Đã thu hồi ghế ${s.name}. Ghế trống tăng một, gán được cho người khác.`;
  });
  M.action("tk-off-close", (el, id) => {
    const t = ticket(id);
    const left = offRemaining(t);
    if (left) { M.toast(`Còn ${left} món chưa thu hồi nên chưa đóng được ticket.`, "bad"); return; }
    t.status = "closed"; t.closedAt = nowStr(); t.resolution = t.resolution || "Đã thu hồi đủ tài sản, phụ kiện và ghế bản quyền.";
    const e = M.emp(t.offboard.employeeId);
    e.status = "left";
    hist(t, `Đóng ticket; ${e.name} chuyển sang Đã nghỉ`);
    M.refresh();
    return `Đã đóng ${t.id}. ${e.name} chuyển sang Đã nghỉ.`;
  });

  /* ===================== Phê duyệt (NV-4.1.4) ===================== */
  M.screen("approvals", {
    nav: "approvals", title: "Chờ tôi duyệt", codes: ["NV-4.1.4"],
    render() {
      const me = myEmp();
      const cols = [
        { h: "Phiếu", r: (a) => `<b class="mono">${esc(a.id)}</b>` },
        { h: "Yêu cầu", cls: "wrap", r: (a) => { const t = ticket(a.ticketId); return `<a href="#/tickets/${esc(t.id)}" class="mono">${esc(t.id)}</a> <span class="strong">${esc(t.title)}</span>`; } },
        { h: "Người yêu cầu", r: (a) => esc(ename(ticket(a.ticketId).requesterId)) },
        { h: "Người duyệt", r: (a) => `${esc(ename(a.approverId))}${a.levels > 1 ? `<div class="cell-sub">Cấp ${esc(a.level)}/${esc(a.levels)}${a.nextApproverId && a.state === "pending" ? " - tiếp theo: " + esc(ename(a.nextApproverId)) : ""}</div>` : ""}` },
        { h: "Gửi lúc", r: (a) => `<span class="mono small">${esc(a.requested)}</span>` },
        { h: "Kết quả / thao tác", cls: "right", r: (a) => {
          const t = ticket(a.ticketId);
          if (a.state === "approved") return M.pill("Đã đồng ý - " + a.decided, "ok");
          if (a.state === "rejected") return `${M.pill("Đã từ chối - " + a.decided, "bad")}<div class="cell-sub">${esc(a.reason)}</div>`;
          if (a.approverId !== me) return M.pill("Chờ " + ename(a.approverId), "warn");
          if (t.requesterId === me) return `${M.pill("Bạn là người yêu cầu, không tự duyệt", "bad")} ${M.btn("Chuyển cho cấp trên", { sm: true, act: "ap-escalate", arg: a.id })}`;
          return M.btn("Đồng ý", { sm: true, primary: true, act: "ap-approve", arg: a.id }) + " " + M.btn("Từ chối", { sm: true, modal: "ap-reject", arg: a.id });
        } },
      ];
      const mine = D.approvals.filter((a) => a.state === "pending" && a.approverId === me);
      const pending = D.approvals.filter((a) => a.state === "pending");
      const done = D.approvals.filter((a) => a.state !== "pending");
      const tbl = (id, rows, empty) => M.panel({ flush: true, body: M.table({ id, cols, rows, empty }) });
      return M.page({
        title: "Phê duyệt yêu cầu",
        sub: "Yêu cầu cần duyệt trước khi giao xử lý.",
        codes: this.codes,
        body: M.tabs("approvals", [
          { key: "mine", label: "Chờ tôi duyệt", n: mine.length, body: tbl("ap-mine", mine, "Không có yêu cầu nào đang chờ bạn duyệt.") },
          { key: "all", label: "Tất cả đang chờ", n: pending.length, body: tbl("ap-all", pending, "Không có phiếu nào đang chờ.") },
          { key: "done", label: "Đã xử lý", n: done.length, body: tbl("ap-done", done, "Chưa có phiếu nào đã xử lý.") },
        ]),
      });
    },
  });
  M.action("ap-approve", (el, id) => {
    const a = M.find("approvals", id);
    const t = ticket(a.ticketId);
    if (t.requesterId === myEmp()) return "Người yêu cầu không tự duyệt được.";
    if (a.level < a.levels) {
      hist(t, `Cấp ${a.level} đồng ý (${ename(a.approverId)}), chuyển cấp ${a.level + 1}: ${ename(a.nextApproverId)}`);
      a.level += 1; a.approverId = a.nextApproverId; a.nextApproverId = null;
      M.refresh();
      return `Đã đồng ý cấp ${a.level - 1}. ${t.id} chuyển cho ${ename(a.approverId)} duyệt cấp ${a.level}.`;
    }
    a.state = "approved"; a.decided = nowStr();
    const g = group(t.group);
    t.status = "owned"; t.assigneeId = g ? g.members[0] : null; t.slaState = "ok"; t.slaLeft = "còn 1 ngày làm việc"; t.respondedAt = nowStr();
    hist(t, `Được duyệt bởi ${ename(myEmp())} - Chờ duyệt → Đã nhận, giao ${ename(t.assigneeId)}`);
    M.refresh();
    return `Đã đồng ý ${a.id}. ${t.id} chuyển sang Đã nhận, giao cho ${ename(t.assigneeId)}.`;
  });
  M.action("ap-escalate", (el, id) => {
    const a = M.find("approvals", id);
    const t = ticket(a.ticketId);
    const mgr = M.emp(t.requesterId).managerId;
    a.approverId = mgr;
    hist(t, `Người duyệt trùng người yêu cầu; chuyển phiếu ${a.id} cho ${ename(mgr)}`);
    M.refresh();
    return `Đã chuyển ${a.id} cho ${ename(mgr)} duyệt.`;
  });
  M.defModal("ap-reject", (id) => {
    const a = M.find("approvals", id);
    const t = ticket(a.ticketId);
    return {
      title: `Từ chối ${t.id}`,
      body: M.kv([["Yêu cầu", esc(t.title)], ["Người yêu cầu", esc(ename(t.requesterId))]]) + M.field("Lý do từ chối", M.textarea("reason", "", { rows: 3 }), { req: true, hint: "Ticket đóng sau khi từ chối. Người yêu cầu thấy lý do này." }),
      submit: "Từ chối", danger: true,
      onSubmit(data, form) {
        if (!String(data.reason || "").trim()) return M.invalid(form, "reason", "Nhập lý do từ chối.");
        a.state = "rejected"; a.decided = nowStr(); a.reason = data.reason.trim();
        t.status = "closed"; t.rejectReason = a.reason; t.closedAt = nowStr();
        (t.comments = t.comments || [{ by: t.requesterId, at: t.created, text: t.desc || t.title }]).push({ by: myEmp(), at: nowStr(), text: "Từ chối: " + a.reason });
        hist(t, `Bị từ chối bởi ${ename(myEmp())} - Chờ duyệt → Đã đóng`);
        return `Đã từ chối ${a.id}. ${t.id} đóng và người yêu cầu thấy lý do.`;
      },
    };
  });

  /* ===================== Vấn đề gốc (NV-4.1.5) ===================== */
  M.screen("problems", {
    nav: "problems", title: "Vấn đề gốc", codes: ["NV-4.1.5"],
    render() {
      return M.page({
        title: "Vấn đề gốc",
        sub: "Gom các sự cố cùng nguyên nhân để xử lý tận gốc.",
        codes: this.codes,
        actions: M.btn("Tạo vấn đề", { modal: "pb-new", primary: true, icon: "plus", perm: "ticket.work" }),
        body: M.panel({ flush: true, body: M.toolbar(M.searchBox("pb-list", "Tìm vấn đề…")) + M.table({
          id: "pb-list", rows: D.problems, href: (x) => "#/problems/" + x.id, empty: "Chưa có vấn đề nào.",
          cols: [
            { h: "Mã", r: (x) => `<b class="mono">${esc(x.id)}</b>` },
            { h: "Vấn đề", cls: "wrap", r: (x) => `<div class="cell-name">${esc(x.title)}</div>` },
            { h: "Trạng thái", r: (x) => M.pill(...PB_ST[x.status]) },
            { h: "Ưu tiên", r: (x) => M.pill(...PRIO[x.priority]) },
            { h: "Sự cố gắn kèm", cls: "right", r: (x) => `<span class="mono">${x.incidents.length}</span>` },
            { h: "Phụ trách", r: (x) => esc(ename(x.owner)) },
          ] }) }),
      });
    },
  });
  M.defModal("pb-new", () => ({
    title: "Tạo vấn đề gốc",
    body: M.field("Tiêu đề", M.input("title", { ph: "Ví dụ: Cả tầng 3 rớt mạng mỗi chiều thứ Sáu" }), { req: true }) +
      M.field("Ưu tiên", M.select("priority", Object.entries(PRIO).map(([k, v]) => [k, v[0]]), "medium")) +
      M.field("Phụ trách", M.select("owner", D.ticketGroups.flatMap((g) => g.members).map((m) => [m, ename(m)]), myEmp() || "e16")) +
      M.field("Sự cố gắn kèm", M.select("incident", D.tickets.filter((t) => t.type === "incident" && !problemOf(t)).map((t) => [t.id, `${t.id} - ${t.title}`]), "", { blank: "Gắn sau" })),
    submit: "Tạo",
    onSubmit(data, form) {
      if (!String(data.title || "").trim()) return M.invalid(form, "title", "Nhập tiêu đề vấn đề.");
      const id = "P-" + String(Math.max(...D.problems.map((x) => +x.id.slice(2))) + 1).padStart(3, "0");
      D.problems.unshift({ id, title: data.title.trim(), status: "new", priority: data.priority, owner: data.owner, created: "27/11/2026", incidents: data.incident ? [data.incident] : [], assets: [], rootCause: "", workaround: "", fix: "" });
      setTimeout(() => M.go("problems/" + id), 0);
      return `Đã tạo vấn đề ${id}.`;
    },
  }));

  M.screen("problems/:id", {
    nav: "problems", title: "Vấn đề gốc", codes: ["NV-4.1.5", "NV-4.5.1"],
    render(p) {
      const x = M.find("problems", p.id);
      if (!x) return M.page({ title: "Không tìm thấy vấn đề", back: ["#/problems", "Vấn đề gốc"] });
      const work = M.can("ticket.work") && x.status !== "closed";
      const kb = x.kbId && M.find("kb", x.kbId);
      const ch = x.changeId && M.find("changes", x.changeId);
      const incs = x.incidents.map(ticket).filter(Boolean);
      return M.page({
        title: `<span class="mono">${esc(x.id)}</span> - ${esc(x.title)}`, back: ["#/problems", "Vấn đề gốc"], codes: this.codes,
        sub: `${M.pill(...PB_ST[x.status])} ${M.pill(...PRIO[x.priority])}`,
        actions: work ? M.btn("Cập nhật phân tích", { modal: "pb-edit", arg: x.id, icon: "pen" }) + M.btn("Đóng vấn đề", { act: "pb-close", arg: x.id, primary: true, confirm: `Đóng ${x.id}? Người xử lý của ${incs.length} sự cố gắn kèm sẽ được thông báo.` }) : "",
        body: `<div class="side-layout"><div class="stack">
          ${M.panel({ title: "Phân tích", body: M.kv([
            ["Nguyên nhân gốc", x.rootCause ? plain(esc(x.rootCause)) : '<span class="muted">Chưa xác định</span>'],
            ["Cách xử lý tạm thời", (x.workaround ? plain(esc(x.workaround)) : '<span class="muted">Chưa có</span>') +
              (kb ? `<div style="margin-top:8px"><a href="#/kb/${esc(kb.id)}">${esc(kb.id)} - ${esc(kb.title)}</a> ${kb.state === "draft" ? M.pill("Nháp", "mute") : M.pill("Đã xuất bản", "ok")}</div>` : x.workaround ? `<div style="margin-top:8px">${M.btn("Chuyển thành bài tri thức", { sm: true, act: "pb-to-kb", arg: x.id, perm: "kb.write" })}</div>` : "")],
            ["Giải pháp triệt để", (x.fix ? plain(esc(x.fix)) : '<span class="muted">Chưa có</span>') + (ch ? `<div style="margin-top:8px"><a href="#/changes/${esc(ch.id)}">${esc(ch.id)} - ${esc(ch.title)}</a> ${M.pill(...CH_ST[ch.status])}</div>` : "")],
          ]) })}
          ${M.panel({ title: `Sự cố gắn kèm (${incs.length})`, flush: true, actions: work ? M.btn("Gắn thêm sự cố", { sm: true, icon: "link", modal: "pb-link", arg: x.id }) : "", body: M.table({ id: "pb-inc", rows: incs, href: (t) => "#/tickets/" + t.id, empty: "Chưa gắn sự cố nào.", cols: subTicketCols("Mã", "Yêu cầu", "Trạng thái", "Người xử lý") }) })}
        </div><div class="stack">
          ${M.panel({ title: "Thông tin", body: M.kv([["Phụ trách", esc(ename(x.owner))], ["Tài sản liên quan", x.assets.length ? x.assets.map((id) => M.tape(M.asset(id).tag, id)).join(" ") : '<span class="muted">Chưa có</span>'], ["Tạo ngày", `<span class="mono">${esc(x.created)}</span>`]]) })}
        </div></div>`,
      });
    },
  });
  M.defModal("pb-edit", (id) => {
    const x = M.find("problems", id);
    return {
      title: `Cập nhật ${x.id}`,
      body: M.field("Trạng thái", M.select("status", Object.entries(PB_ST).filter(([k]) => k !== "closed").map(([k, v]) => [k, v[0]]), x.status)) +
        M.field("Nguyên nhân gốc", M.textarea("rootCause", x.rootCause, { rows: 3 })) +
        M.field("Cách xử lý tạm thời", M.textarea("workaround", x.workaround, { rows: 3 })) +
        M.field("Giải pháp triệt để", M.textarea("fix", x.fix, { rows: 2 })),
      onSubmit(data) { Object.assign(x, { status: data.status, rootCause: data.rootCause.trim(), workaround: data.workaround.trim(), fix: data.fix.trim() }); return `Đã cập nhật ${x.id}.`; },
    };
  });
  M.defModal("pb-link", (id) => {
    const x = M.find("problems", id);
    return {
      title: `Gắn sự cố vào ${x.id}`,
      body: M.field("Sự cố", M.select("t", D.tickets.filter((t) => t.type === "incident" && !problemOf(t)).map((t) => [t.id, `${t.id} - ${t.title}`]), "", { blank: "Chọn sự cố…" }), { req: true }),
      submit: "Gắn",
      onSubmit(data, form) { if (!data.t) return M.invalid(form, "t", "Chọn sự cố."); x.incidents.push(data.t); return `Đã gắn ${data.t} vào ${x.id}.`; },
    };
  });
  M.action("pb-close", (el, id) => {
    const x = M.find("problems", id);
    x.status = "closed";
    M.refresh();
    return `Đã đóng ${x.id}. Người xử lý của ${x.incidents.length} sự cố gắn kèm đã được thông báo.`;
  });
  M.action("pb-to-kb", (el, id) => {
    const x = M.find("problems", id);
    const kid = "KB-" + String(Math.max(...D.kb.map((k) => +k.id.slice(3))) + 1).padStart(3, "0");
    D.kb.unshift({ id: kid, title: `${x.title}: cách xử lý tạm thời`, category: "Khác", public: false, state: "draft", author: ename(myEmp()), updated: "27/11/2026", tags: [], views: 0, body: [x.workaround] });
    x.kbId = kid;
    M.refresh();
    return `Đã tạo bài nháp ${kid} từ cách xử lý tạm thời của ${x.id}.`;
  });

  /* ===================== CMDB (NV-4.4.1 → NV-4.4.3) ===================== */
  const POS = {
    "svc-erp": [230, 50], "svc-mail": [600, 50], "svc-print": [840, 50], "svc-vpn": [1060, 50],
    "vm-erp-app": [380, 150], "vm-mail": [600, 150],
    a5: [110, 260], a6: [490, 260], a4: [700, 260], a9: [870, 260], a2: [1060, 260],
    a7: [560, 380], a8: [900, 380], a3: [1060, 380],
    a16: [300, 470],
  };
  const NW = 150, NH = 44;
  const svc = (id) => (D.services || []).find((s) => s.id === id);
  function node(id) {
    const a = M.asset(id);
    if (a) { const c = M.assetCat(a); return { id, kind: "asset", name: (a.tech && a.tech.hostname) || a.hostname || a.tag, sub: `${a.tag} - ${c ? c.name : "Tài sản"}`, href: "#/assets/" + id }; }
    const s = svc(id);
    return s ? { id, kind: "service", name: s.name, sub: s.kind, href: "#/cmdb?focus=" + id } : { id, kind: "?", name: id, sub: "", href: "#/cmdb" };
  }
  const svcUsers = (s) => (s.users === "all" ? D.employees.filter((e) => e.status !== "left").map((e) => e.id) : s.users);
  /* Lần ngược các quan hệ: ai chạy trên / kết nối tới / phụ thuộc vào / là thành phần của X thì bị ảnh hưởng khi X hỏng */
  function impactOf(id) {
    const seen = new Map();
    const queue = [[id, 0]];
    while (queue.length) {
      const [cur, d] = queue.shift();
      D.relations.forEach((r) => {
        if (r.to === cur && r.from !== id && !seen.has(r.from)) { seen.set(r.from, { depth: d + 1, via: cur, type: r.type }); queue.push([r.from, d + 1]); }
      });
    }
    const edges = new Set();
    D.relations.forEach((r, i) => { if (seen.has(r.from) && (r.to === id || seen.has(r.to))) edges.add(i); });
    const users = new Set();
    const addHolder = (a) => { if (a && a.holder && a.holder.type === "employee") users.add(a.holder.id); };
    addHolder(M.asset(id));
    seen.forEach((v, nid) => { addHolder(M.asset(nid)); const s = svc(nid); if (s) svcUsers(s).forEach((u) => users.add(u)); });
    return { nodes: seen, edges, users: [...users] };
  }
  function neighborhood(focus, depth) {
    const vis = new Set([focus]);
    let frontier = [focus];
    for (let d = 0; d < depth; d++) {
      const next = [];
      frontier.forEach((n) => D.relations.forEach((r) => {
        if (r.from === n && !vis.has(r.to)) { vis.add(r.to); next.push(r.to); }
        if (r.to === n && !vis.has(r.from)) { vis.add(r.from); next.push(r.from); }
      }));
      frontier = next;
    }
    return vis;
  }
  const anchor = (p, q) => {
    const dx = q[0] - p[0], dy = q[1] - p[1];
    if (Math.abs(dy) * (NW / 2) > Math.abs(dx) * (NH / 2)) return [p[0] + (dx * (NH / 2)) / Math.abs(dy), p[1] + Math.sign(dy) * (NH / 2)];
    return [p[0] + Math.sign(dx) * (NW / 2), p[1] + (dy * (NW / 2)) / Math.abs(dx || 1)];
  };
  const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
  function graphSvg(vis, focus, imp) {
    const ids = [...vis].filter((id) => POS[id]);
    const edges = D.relations.map((r, i) => ({ ...r, i })).filter((r) => vis.has(r.from) && vis.has(r.to) && POS[r.from] && POS[r.to]);
    const eh = edges.map((r) => {
      const a = anchor(POS[r.from], POS[r.to]);
      const b = anchor(POS[r.to], POS[r.from]);
      const hot = imp && imp.edges.has(r.i);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      return `<path class="edge ${hot ? "hot" : ""}" d="M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}" marker-end="url(#${hot ? "cmdb-arr-hot" : "cmdb-arr"})" ${r.source === "auto" ? 'stroke-dasharray="6 4"' : ""}/>
        <text class="elabel" x="${mx.toFixed(1)}" y="${(my - 5).toFixed(1)}" text-anchor="middle">${esc(REL[r.type])}</text>`;
    }).join("");
    const nh = ids.map((id) => {
      const n = node(id);
      const [x, y] = POS[id];
      const isFocus = id === focus;
      const hit = imp && imp.nodes.has(id);
      return `<g class="node ${isFocus ? "focus" : ""} ${hit ? "hit" : ""}" data-href="${n.href}" transform="translate(${x - NW / 2},${y - NH / 2})"><title>${esc(n.name)} - ${esc(n.sub)}</title><rect width="${NW}" height="${NH}" rx="6"></rect>
        <text x="10" y="18" ${isFocus ? 'style="fill:#16191A"' : ""}>${esc(trunc(n.name, 19))}</text><text class="k" x="10" y="34" ${isFocus ? 'style="fill:#3a3a2a"' : ""}>${esc(trunc(n.sub, 24))}</text></g>`;
    }).join("");
    return `<svg class="graph" viewBox="0 0 1160 520" role="img" aria-label="Sơ đồ quan hệ CMDB">
      <defs>
        <marker id="cmdb-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" style="fill:var(--line-strong)"></path></marker>
        <marker id="cmdb-arr-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" style="fill:var(--bad)"></path></marker>
      </defs>${eh}${nh}</svg>`;
  }
  const nodeOptions = () => Object.keys(POS).map((id) => { const n = node(id); return [id, `${n.name} - ${n.sub}`]; });

  M.action("cmdb-focus", (el, v) => { M.go("cmdb?focus=" + v); });

  M.screen("cmdb", {
    nav: "cmdb", title: "Sơ đồ CMDB", codes: ["NV-4.4.1", "NV-4.4.2", "NV-4.4.3"],
    render(p, q) {
      const focus = q.focus && POS[q.focus] ? q.focus : "a5";
      const depth = q.depth === "all" ? 99 : Math.max(1, +q.depth || 2);
      const impactOn = q.impact === "1";
      const imp = impactOn ? impactOf(focus) : null;
      const vis = depth >= 99 ? new Set(Object.keys(POS)) : neighborhood(focus, depth);
      if (imp) { imp.nodes.forEach((v, k) => vis.add(k)); }
      const n = node(focus);
      const base = `cmdb?focus=${focus}`;
      const out = D.relations.filter((r) => r.from === focus);
      const inc = D.relations.filter((r) => r.to === focus);
      const relRow = (r, other, dir) => {
        const link = `<a class="strong" href="#/cmdb?focus=${esc(other)}">${esc(node(other).name)}</a>`;
        return `<div class="row between" style="padding:6px 0;border-top:1px dashed var(--line)"><span>${dir === "out" ? `<span class="muted">${esc(REL[r.type])}</span> ${link}` : `${link} <span class="muted">${esc(REL[r.type])} nút này</span>`}</span>${r.source === "auto" ? M.pill("Tự sinh", "info") : M.pill("Nhập tay", "mute")}</div>`;
      };
      const impactPanel = imp ? (() => {
        const list = [...imp.nodes.entries()].sort((a, b) => a[1].depth - b[1].depth);
        return M.panel({
          title: `Phân tích tác động: ${n.name}`,
          actions: M.btn("Gắn vào yêu cầu thay đổi", { sm: true, modal: "cmdb-attach", arg: focus, perm: "change.manage" }),
          body: `${list.length ? list.map(([id, v]) => `<div class="row between" style="padding:5px 0"><span><a href="${node(id).href}">${esc(node(id).name)}</a> <span class="muted small">${esc(REL[v.type])} ${esc(node(v.via).name)}</span></span>${v.depth === 1 ? M.pill("Trực tiếp", "bad") : M.pill("Gián tiếp - mức " + v.depth, "warn")}</div>`).join("") : '<p class="muted">Không có đối tượng nào phụ thuộc vào nút này.</p>'}
            <hr class="divider"><div class="muted small" style="margin-bottom:6px">Người dùng bị ảnh hưởng (${imp.users.length})</div>
            <div class="chips">${imp.users.map((u) => `<span class="chip">${esc(ename(u))}</span>`).join("") || '<span class="muted">Không có</span>'}</div>`,
        });
      })() : "";
      const relTable = M.table({
        id: "cmdb-rel", rows: D.relations.map((r, i) => ({ ...r, i })),
        cols: [
          { h: "Đối tượng", cls: "wrap", r: (r) => `<a href="#/cmdb?focus=${esc(r.from)}">${esc(node(r.from).name)}</a>` },
          { h: "Quan hệ", r: (r) => `<span class="mono small">${esc(REL[r.type])} →</span>` },
          { h: "Tới", cls: "wrap", r: (r) => `<a href="#/cmdb?focus=${esc(r.to)}">${esc(node(r.to).name)}</a>` },
          { h: "Nguồn", r: (r) => (r.source === "auto" ? `${M.pill("Tự sinh", "info")} <span class="muted small">${esc(r.origin || "")}</span>` : M.pill("Nhập tay", "mute")) },
          { h: "", cls: "right", r: (r) => (r.source === "manual" && M.can("cmdb.edit") ? M.btn("Xóa", { sm: true, ghost: true, act: "cmdb-del", arg: r.i, confirm: "Xóa quan hệ này?" }) : "") },
        ],
      });
      return M.page({
        title: "Sơ đồ quan hệ hạ tầng (CMDB)",
        sub: "Quan hệ giữa thiết bị, máy ảo, ứng dụng và dịch vụ.",
        codes: this.codes,
        actions: M.btn("Khai báo quan hệ", { modal: "cmdb-rel", primary: true, icon: "plus", perm: "cmdb.edit" }),
        body: `<div class="row">
            <label class="field" style="flex-direction:row;align-items:center;gap:8px">Nút trung tâm ${M.select("focus", nodeOptions(), focus, { attrs: 'data-change="cmdb-focus" style="width:auto"' })}</label>
            <span class="seg">${[["1", "Mức 1"], ["2", "Mức 2"], ["all", "Toàn bộ"]].map(([v, l]) => `<a class="btn btn-sm ${String(q.depth || "2") === v ? "btn-primary" : "btn-ghost"}" href="#/${base}&depth=${v}${impactOn ? "&impact=1" : ""}">${l}</a>`).join("")}</span>
            ${impactOn ? M.btn("Tắt phân tích tác động", { href: `#/${base}&depth=${q.depth || "2"}` }) : M.btn("Phân tích tác động", { href: `#/${base}&depth=${q.depth || "2"}&impact=1`, icon: "alert" })}
          </div>
          ${M.tabs("cmdb", [
            { key: "graph", label: "Sơ đồ", body: `<div class="stack">
              ${M.panel({ flush: true, body: graphSvg(vis, focus, imp), foot: "<span>Nét liền: nhập tay - Nét đứt: tự sinh từ quét</span>" })}
              ${M.cc("CC-15", "Ứng dụng và dịch vụ nghiệp vụ (Ứng dụng ERP, Dịch vụ email…) là một loại tài sản mới, hay một loại đối tượng riêng? Mockup đang vẽ chúng là đối tượng riêng, không có mã tài sản.")}
            <div class="grid g2">
              ${M.panel({ title: "Nút đang chọn", body: `${M.kv([["Tên", `<a href="${n.href}" class="strong">${esc(n.name)}</a>`], ["Loại", esc(n.sub)]])}<hr class="divider"><div class="muted small">Quan hệ trực tiếp (${out.length + inc.length})</div>${out.map((r) => relRow(r, r.to, "out")).join("")}${inc.map((r) => relRow(r, r.from, "in")).join("")}` })}
              ${impactPanel}
            </div></div>` },
            { key: "list", label: "Bảng quan hệ", n: D.relations.length, body: M.panel({ flush: true, body: relTable }) },
          ])}`,
      });
    },
  });
  M.defModal("cmdb-rel", () => ({
    title: "Khai báo quan hệ",
    body: M.field("Đối tượng", M.select("from", nodeOptions(), "", { blank: "Chọn…" }), { req: true }) +
      M.field("Loại quan hệ", M.select("type", Object.entries(REL), "depends")) +
      M.field("Tới", M.select("to", nodeOptions(), "", { blank: "Chọn…" }), { req: true }),
    submit: "Lưu quan hệ",
    onSubmit(data, form) {
      if (!data.from) return M.invalid(form, "from", "Chọn đối tượng.");
      if (!data.to) return M.invalid(form, "to", "Chọn đối tượng đích.");
      if (data.from === data.to) return M.invalid(form, "to", "Chọn hai đối tượng khác nhau.");
      if (D.relations.some((r) => r.from === data.from && r.to === data.to && r.type === data.type)) return M.invalid(form, "to", "Quan hệ này đã có.");
      D.relations.push({ from: data.from, to: data.to, type: data.type, source: "manual" });
      return `Đã khai báo: ${node(data.from).name} ${REL[data.type]} ${node(data.to).name}.`;
    },
  }));
  M.action("cmdb-del", (el, i) => { D.relations.splice(+i, 1); M.refresh(); return "Đã xóa quan hệ nhập tay."; });
  M.defModal("cmdb-attach", (focus) => ({
    title: "Gắn kết quả phân tích tác động",
    body: M.field("Yêu cầu thay đổi", M.select("chg", D.changes.filter((c) => !["done", "rejected"].includes(c.status)).map((c) => [c.id, `${c.id} - ${c.title}`]), "", { blank: "Chọn…" }), { req: true }),
    submit: "Gắn",
    onSubmit(data, form) {
      if (!data.chg) return M.invalid(form, "chg", "Chọn yêu cầu thay đổi.");
      const c = M.find("changes", data.chg);
      c.impactAttached = true; c.impactFocus = focus;
      return `Đã gắn kết quả phân tích tác động vào ${c.id}.`;
    },
  }));

  /* ===================== Thay đổi (NV-4.1.6) ===================== */
  const changeSteps = (c) => {
    const cur = { draft: c.impactAttached ? 1 : 0, pending: 2, approved: 3, doing: 3, done: 5, rejected: 2 }[c.status];
    return M.steps(["Lập yêu cầu", "Phân tích tác động", "Duyệt", "Thực hiện", "Ghi kết quả, đóng"], cur);
  };
  M.screen("changes", {
    nav: "changes", title: "Thay đổi", codes: ["NV-4.1.6"],
    render() {
      return M.page({
        title: "Quản lý thay đổi",
        sub: "Thay đổi hạ tầng cần duyệt trước khi thực hiện.",
        codes: this.codes,
        actions: M.btn("Lập yêu cầu thay đổi", { modal: "ch-new", primary: true, icon: "plus", perm: "change.manage" }),
        body: M.stats([
          { label: "Chờ duyệt", value: D.changes.filter((c) => c.status === "pending").length, tone: "warn" },
          { label: "Đã duyệt, chờ thực hiện", value: D.changes.filter((c) => c.status === "approved").length, tone: "info" },
          { label: "Có sự cố phát sinh", value: D.changes.filter((c) => (c.incidentsAfter || []).length).length, tone: "bad" },
        ]) + M.panel({ flush: true, body: M.table({
          id: "ch-list", rows: D.changes, href: (c) => "#/changes/" + c.id,
          cols: [
            { h: "Mã", r: (c) => `<b class="mono">${esc(c.id)}</b>` },
            { h: "Thay đổi", cls: "wrap", r: (c) => `<div class="cell-name">${esc(c.title)}</div>` },
            { h: "Trạng thái", r: (c) => M.pill(...CH_ST[c.status]) },
            { h: "Rủi ro", r: (c) => esc(c.risk) },
            { h: "Khung giờ", r: (c) => (c.window ? `<span class="mono small">${esc(c.window)}</span>` : '<span class="muted">Chưa đặt</span>') },
            { h: "Người lập", r: (c) => esc(ename(c.requesterId)) },
          ] }) }),
      });
    },
  });
  M.defModal("ch-new", () => ({
    title: "Lập yêu cầu thay đổi",
    wide: true,
    body: `<div class="form-grid">
      ${M.field("Tiêu đề", M.input("title"), { req: true, full: true })}
      ${M.field("Lý do", M.textarea("reason", "", { rows: 2 }), { full: true })}
      ${M.field("Tài sản bị tác động", M.select("asset", D.assets.filter((a) => a.status !== "archived").map((a) => [a.id, `${a.tag} - ${a.name}`]), "", { blank: "Chọn…" }))}
      ${M.field("Mức rủi ro", M.select("risk", ["Thấp", "Trung bình", "Cao"], "Trung bình"))}
      ${M.field("Khung giờ thực hiện", M.input("window", { ph: "30/11/2026 22:00 - 23:00" }))}
      ${M.field("Kế hoạch lùi lại", M.textarea("rollback", "", { rows: 2 }), { full: true })}
    </div>`,
    submit: "Lưu nháp",
    onSubmit(data, form) {
      if (!String(data.title || "").trim()) return M.invalid(form, "title", "Nhập tiêu đề thay đổi.");
      const id = "CHG-" + String(Math.max(...D.changes.map((c) => +c.id.slice(4))) + 1).padStart(3, "0");
      D.changes.unshift({ id, title: data.title.trim(), status: "draft", risk: data.risk, requesterId: myEmp() || "e16", approverId: "e15", created: nowStr(), window: data.window, assets: data.asset ? [data.asset] : [], reason: data.reason, plan: [], rollback: data.rollback.trim(), incidentsAfter: [], impactAttached: false, impactFocus: data.asset || null });
      setTimeout(() => M.go("changes/" + id), 0);
      return `Đã lưu nháp ${id}.`;
    },
  }));

  M.screen("changes/:id", {
    nav: "changes", title: "Thay đổi", codes: ["NV-4.1.6", "NV-4.4.3"],
    render(p) {
      const c = M.find("changes", p.id);
      if (!c) return M.page({ title: "Không tìm thấy thay đổi", back: ["#/changes", "Thay đổi"] });
      const can = M.can("change.manage");
      const me = myEmp();
      const imp = c.impactAttached && c.impactFocus ? impactOf(c.impactFocus) : null;
      const acts = [];
      if (can && c.status === "draft") acts.push(M.btn("Gửi duyệt", { act: "ch-submit", arg: c.id, primary: true }));
      if (c.status === "pending" && me === c.approverId && me !== c.requesterId) acts.push(M.btn("Từ chối", { modal: "ch-reject", arg: c.id }), M.btn("Duyệt", { act: "ch-approve", arg: c.id, primary: true }));
      if (can && ["pending", "approved"].includes(c.status)) acts.push(M.btn("Bắt đầu thực hiện", { act: "ch-start", arg: c.id, primary: c.status === "approved" }));
      if (can && c.status === "doing") acts.push(M.btn("Ghi kết quả và đóng", { modal: "ch-finish", arg: c.id, primary: true }));
      if (can && c.status === "done") acts.push(M.btn("Gắn sự cố phát sinh", { modal: "ch-incident", arg: c.id, icon: "link" }));
      const incs = (c.incidentsAfter || []).map(ticket).filter(Boolean);
      const dep = c.deployment;
      return M.page({
        title: `<span class="mono">${esc(c.id)}</span> - ${esc(c.title)}`, back: ["#/changes", "Thay đổi"], codes: this.codes,
        sub: M.pill(...CH_ST[c.status]),
        actions: acts.join(""),
        above: `<div class="panel"><div class="panel-body" style="padding:10px 16px">${changeSteps(c)}</div></div>`,
        body: `<div class="side-layout"><div class="stack">
          ${c.rollback ? "" : M.note("Chưa có kế hoạch lùi lại: chưa gửi duyệt được.", "warn")}
          ${M.panel({ title: "Nội dung", body: M.kv([
            ["Lý do", c.reason ? plain(esc(c.reason)) : '<span class="muted">Chưa có</span>'],
            ["Các bước", c.plan && c.plan.length ? `<ol style="margin:0;padding-left:18px;font-weight:400">${c.plan.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : '<span class="muted">Chưa có</span>'],
            ["Lùi lại", c.rollback ? plain(esc(c.rollback)) : '<span class="muted">Chưa có</span>'],
          ]) })}
          ${M.panel({ title: `Tài sản bị tác động (${c.assets.length})`, flush: true, body: M.table({ id: "ch-assets", rows: c.assets.map((id) => M.asset(id)), empty: "Chưa khai báo tài sản bị tác động: chưa gửi duyệt được.", cols: [
            { h: "Mã", r: (a) => M.tape(a.tag, a.id) }, { h: "Tài sản", cls: "wrap", r: (a) => esc(a.name) }, { h: "Trạng thái", r: (a) => M.led(a.status) }, { h: "Người giữ / vị trí", r: (a) => M.holderHtml(a) }] }) })}
          ${M.panel({ title: imp ? `Phân tích tác động: ${esc(node(c.impactFocus).name)}` : "Phân tích tác động", actions: !c.impactAttached && can && c.assets.length ? M.btn("Gắn kết quả phân tích", { sm: true, act: "ch-impact", arg: c.id }) : c.impactFocus ? `<a class="small" href="#/cmdb?focus=${esc(c.impactFocus)}&impact=1">Xem trên sơ đồ</a>` : "",
            body: imp ? `${[...imp.nodes.entries()].map(([id, v]) => `<div class="row between" style="padding:4px 0"><a href="${node(id).href}">${esc(node(id).name)}</a>${v.depth === 1 ? M.pill("Trực tiếp", "bad") : M.pill("Gián tiếp", "warn")}</div>`).join("") || '<p class="muted">Không có đối tượng phụ thuộc.</p>'}<hr class="divider"><div class="muted small" style="margin-bottom:6px">Người dùng nhận thông báo bảo trì (${imp.users.length})</div><div class="chips">${imp.users.map((u) => `<span class="chip">${esc(ename(u))}</span>`).join("") || '<span class="muted">Không có</span>'}</div>` : '<p class="muted">Chưa gắn kết quả phân tích tác động.</p>' })}
          ${c.status === "done" || incs.length ? M.panel({ title: `Sự cố phát sinh sau thay đổi (${incs.length})`, flush: true, body: M.table({ id: "ch-inc", rows: incs, href: (t) => "#/tickets/" + t.id, empty: "Chưa có sự cố nào gắn với thay đổi này.", cols: subTicketCols("Mã", "Yêu cầu", "Trạng thái") }) }) : ""}
        </div><div class="stack">
          ${M.panel({ title: "Thông tin", body: M.kv([
            ["Rủi ro", esc(c.risk)],
            ["Khung giờ", c.window ? `<span class="mono">${esc(c.window)}</span>` : '<span class="muted">Chưa đặt</span>'],
            ["Người lập", `${esc(ename(c.requesterId))} - <span class="mono">${esc(c.created)}</span>`],
            ["Người duyệt", esc(ename(c.approverId)) + (c.approvedAt ? ` - <span class="mono">${esc(c.approvedAt)}</span>` : "")],
            c.cve ? ["Lỗ hổng", `<a href="#/vulns/${esc(c.cve)}" class="mono">${esc(c.cve)}</a>`] : null,
            c.problemId ? ["Vấn đề gốc", `<a href="#/problems/${esc(c.problemId)}" class="mono">${esc(c.problemId)}</a>`] : null,
            dep ? ["Đợt triển khai", `<a href="#/deployments/${esc(dep)}" class="mono">${esc(dep)}</a>`] : null,
            c.result ? ["Kết quả", esc(c.result)] : null,
            c.rejectReason ? ["Lý do từ chối", esc(c.rejectReason)] : null,
          ]) })}
        </div></div>`,
      });
    },
  });
  M.action("ch-submit", (el, id) => {
    const c = M.find("changes", id);
    if (!c.rollback || !c.assets.length) { M.toast("Thiếu kế hoạch lùi lại hoặc danh sách tài sản bị tác động nên chưa gửi duyệt được.", "bad"); return; }
    c.status = "pending"; M.refresh();
    return `Đã gửi ${c.id} cho ${ename(c.approverId)} duyệt.`;
  });
  M.action("ch-approve", (el, id) => { const c = M.find("changes", id); c.status = "approved"; c.approvedAt = nowStr(); M.refresh(); return `Đã duyệt ${c.id}.`; });
  M.action("ch-start", (el, id) => {
    const c = M.find("changes", id);
    if (c.status !== "approved") { M.toast("Thay đổi chưa duyệt thì không chuyển sang thực hiện được.", "bad"); return; }
    c.status = "doing"; M.refresh();
    return `${c.id} chuyển sang Đang thực hiện.`;
  });
  M.action("ch-impact", (el, id) => { const c = M.find("changes", id); c.impactAttached = true; c.impactFocus = c.impactFocus || c.assets[0]; M.refresh(); return `Đã gắn kết quả phân tích tác động vào ${c.id}.`; });
  M.defModal("ch-reject", (id) => ({
    title: "Từ chối thay đổi",
    body: M.field("Lý do", M.textarea("reason", "", { rows: 3 }), { req: true }),
    submit: "Từ chối", danger: true,
    onSubmit(data, form) { if (!String(data.reason || "").trim()) return M.invalid(form, "reason", "Nhập lý do từ chối."); const c = M.find("changes", id); c.status = "rejected"; c.rejectReason = data.reason.trim(); return `Đã từ chối ${c.id}.`; },
  }));
  M.defModal("ch-finish", (id) => ({
    title: "Ghi kết quả thực hiện",
    body: M.field("Kết quả", M.textarea("result", "", { rows: 3, ph: "Đã làm gì, có lỗi gì, đã kiểm tra những gì…" }), { req: true }) + M.field("Kết luận", M.select("ok", [["1", "Thành công"], ["0", "Không thành công, đã lùi lại"]], "1")),
    submit: "Đóng thay đổi",
    onSubmit(data, form) { if (!String(data.result || "").trim()) return M.invalid(form, "result", "Nhập kết quả thực hiện."); const c = M.find("changes", id); c.status = "done"; c.result = data.result.trim() + (data.ok === "0" ? " (đã lùi lại)" : ""); return `Đã ghi kết quả và đóng ${c.id}.`; },
  }));
  M.defModal("ch-incident", (id) => {
    const c = M.find("changes", id);
    return {
      title: `Gắn sự cố phát sinh vào ${c.id}`,
      body: M.field("Sự cố", M.select("t", D.tickets.filter((t) => t.type === "incident" && !(c.incidentsAfter || []).includes(t.id)).map((t) => [t.id, `${t.id} - ${t.title}`]), "", { blank: "Chọn…" }), { req: true }),
      submit: "Gắn",
      onSubmit(data, form) { if (!data.t) return M.invalid(form, "t", "Chọn sự cố."); c.incidentsAfter.push(data.t); return `Đã gắn ${data.t} vào ${c.id}.`; },
    };
  });

  /* ===================== Cơ sở tri thức (NV-4.5.1, NV-4.5.2) ===================== */
  M.screen("kb", {
    nav: "kb", title: "Cơ sở tri thức", codes: ["NV-4.5.1", "NV-4.5.2"],
    render() {
      const cols = [
        { h: "Mã", r: (k) => `<b class="mono">${esc(k.id)}</b>` },
        { h: "Bài viết", cls: "wrap", r: (k) => `<div class="cell-name">${esc(k.title)}</div><div class="cell-sub">${esc(k.category)} - ${k.tags.map((x) => "#" + esc(x)).join(" ")}</div>` },
        { h: "Phạm vi", r: (k) => (k.public ? M.pill("Công khai", "info") : M.pill("Nội bộ", "mute")) },
        { h: "Trạng thái", r: (k) => (k.state === "published" ? M.pill("Đã xuất bản", "ok") : M.pill("Nháp", "warn")) },
        { h: "Cập nhật", r: (k) => `<span class="mono small">${esc(k.updated)}</span>` },
        { h: "Lượt xem", cls: "right", r: (k) => `<span class="mono">${esc(k.views)}</span>` },
      ];
      const tbl = (id, rows) => M.panel({ flush: true, body: M.toolbar(M.searchBox(id, "Tìm theo tiêu đề, từ khóa…")) + M.table({ id, cols, rows, href: (k) => "#/kb/" + k.id, empty: "Không có bài viết nào." }) });
      return M.page({
        title: "Cơ sở tri thức",
        sub: "Bài hướng dẫn cho kỹ thuật viên và hỏi đáp trên cổng tự phục vụ.",
        codes: this.codes,
        actions: M.btn("Viết bài", { modal: "kb-edit", primary: true, icon: "plus", perm: "kb.write" }),
        body: M.tabs("kb", [
          { key: "all", label: "Tất cả", n: D.kb.length, body: tbl("kb-all", D.kb) },
          { key: "public", label: "Công khai cho nhân viên", n: D.kb.filter((k) => k.public).length, body: tbl("kb-pub", D.kb.filter((k) => k.public)) },
          { key: "internal", label: "Nội bộ kỹ thuật", n: D.kb.filter((k) => !k.public).length, body: tbl("kb-int", D.kb.filter((k) => !k.public)) },
          { key: "draft", label: "Nháp", n: D.kb.filter((k) => k.state === "draft").length, body: tbl("kb-draft", D.kb.filter((k) => k.state === "draft")) },
        ]),
      });
    },
  });
  M.defModal("kb-edit", (id) => {
    const k = id ? M.find("kb", id) : null;
    return {
      title: k ? `Sửa ${k.id}` : "Viết bài tri thức",
      wide: true,
      body: `<div class="form-grid">
        ${M.field("Tiêu đề", M.input("title", { value: k ? k.title : "" }), { req: true, full: true })}
        ${M.field("Danh mục", M.select("category", CATEGORIES.concat(["Tài sản"]), k ? k.category : "Phần cứng máy tính"))}
        ${M.field("Từ khóa", M.input("tags", { value: k ? k.tags.join(", ") : "", ph: "máy in, driver" }), { hint: "Cách nhau bằng dấu phẩy" })}
        ${M.field("Nội dung (mỗi dòng một bước)", M.textarea("body", k ? k.body.join("\n") : "", { rows: 6 }), { req: true, full: true })}
        <div class="full row">${M.checkbox("public", "Công khai cho nhân viên trên cổng tự phục vụ", k ? k.public : false)}</div>
        ${M.field("Trạng thái", M.select("state", [["draft", "Nháp"], ["published", "Xuất bản"]], k ? k.state : "draft"))}
      </div>`,
      submit: k ? "Lưu bài" : "Lưu",
      onSubmit(data, form) {
        if (!String(data.title || "").trim()) return M.invalid(form, "title", "Nhập tiêu đề bài viết.");
        if (!String(data.body || "").trim()) return M.invalid(form, "body", "Nhập nội dung bài viết.");
        const fields = { title: data.title.trim(), category: data.category, tags: data.tags.split(",").map((s) => s.trim()).filter(Boolean), body: data.body.split("\n").map((s) => s.trim()).filter(Boolean), public: !!data.public, state: data.state, author: k ? k.author : ename(myEmp()), updated: "27/11/2026" };
        if (k) { Object.assign(k, fields); return `Đã lưu ${k.id}.`; }
        const nid = "KB-" + String(Math.max(...D.kb.map((x) => +x.id.slice(3))) + 1).padStart(3, "0");
        D.kb.unshift(Object.assign({ id: nid, views: 0 }, fields));
        return `Đã lưu bài ${nid}${data.state === "draft" ? " ở trạng thái nháp" : ""}.`;
      },
    };
  });
  M.screen("kb/:id", {
    nav: "kb", title: "Bài tri thức", codes: ["NV-4.5.1"],
    render(p) {
      const k = M.find("kb", p.id);
      if (!k) return M.page({ title: "Không tìm thấy bài viết", back: ["#/kb", "Cơ sở tri thức"] });
      const used = D.tickets.filter((t) => t.kbId === k.id);
      const pbs = D.problems.filter((x) => x.kbId === k.id);
      return M.page({
        title: esc(k.title), back: ["#/kb", "Cơ sở tri thức"], codes: this.codes.concat(k.public ? ["NV-4.5.2"] : []),
        sub: `${k.public ? M.pill("Công khai cho nhân viên", "info") : M.pill("Nội bộ kỹ thuật", "mute")} ${k.state === "published" ? M.pill("Đã xuất bản", "ok") : M.pill("Nháp", "warn")}`,
        actions: M.btn("Sửa", { modal: "kb-edit", arg: k.id, icon: "pen", perm: "kb.write" }) + (M.can("kb.write") ? M.btn(k.state === "draft" ? "Xuất bản" : "Chuyển về nháp", { act: "kb-toggle", arg: k.id, primary: k.state === "draft" }) : ""),
        body: `<div class="side-layout"><div class="stack">${M.panel({ title: "Nội dung", body: `<ol>${k.body.map((s) => `<li style="margin-bottom:6px">${esc(s)}</li>`).join("")}</ol>` })}</div><div class="stack">
          ${M.panel({ title: "Thông tin", body: M.kv([["Mã", `<span class="mono">${esc(k.id)}</span>`], ["Danh mục", esc(k.category)], ["Từ khóa", k.tags.map((x) => `<span class="chip">${esc(x)}</span>`).join(" ") || "—"], ["Người viết", esc(k.author)], ["Cập nhật", esc(k.updated)], ["Lượt xem", esc(k.views)]]) })}
          ${M.panel({ title: `Dùng làm cách giải quyết (${used.length + pbs.length})`, body: used.concat(pbs).map((x) => `<div><a class="mono" href="#/${x.incidents ? "problems" : "tickets"}/${esc(x.id)}">${esc(x.id)}</a> <span class="muted small">${esc(x.title)}</span></div>`).join("") || '<p class="muted">Chưa gắn vào ticket nào.</p>' })}
          ${k.state === "draft" ? M.note("Bài nháp chưa hiện khi tìm kiếm và trên cổng tự phục vụ.", "warn") : ""}
        </div></div>`,
      });
    },
  });
  M.action("kb-toggle", (el, id) => { const k = M.find("kb", id); k.state = k.state === "draft" ? "published" : "draft"; k.updated = "27/11/2026"; M.refresh(); return k.state === "published" ? `Đã xuất bản ${k.id}.` : `Đã chuyển ${k.id} về nháp.`; });

  /* ===================== SLA, lịch làm việc, định tuyến, leo thang ===================== */
  D.slaCalendar = {
    days: [["Thứ Hai", "08:00", "17:30"], ["Thứ Ba", "08:00", "17:30"], ["Thứ Tư", "08:00", "17:30"], ["Thứ Năm", "08:00", "17:30"], ["Thứ Sáu", "08:00", "17:30"], ["Thứ Bảy", "", ""], ["Chủ nhật", "", ""]],
    lunch: ["12:00", "13:00"],
    holidays: [["01/01/2027", "Tết Dương lịch"], ["05/02/2027 - 10/02/2027", "Tết Nguyên đán"], ["16/04/2027", "Giỗ Tổ Hùng Vương"], ["30/04/2027 - 01/05/2027", "Giải phóng miền Nam, Quốc tế Lao động"], ["02/09/2027 - 03/09/2027", "Quốc khánh"]],
  };
  D.slaPolicies = [
    { name: "Tiêu chuẩn", scope: "Mọi ticket không khớp chính sách khác", factor: "Theo bảng mục tiêu" },
    { name: "Ban Giám đốc", scope: "Người yêu cầu thuộc phòng Ban Giám đốc", factor: "Rút còn một nửa thời gian" },
    { name: "Hạ tầng lõi", scope: "Tài sản gắn kèm thuộc danh mục Máy chủ hoặc Thiết bị mạng", factor: "Giải quyết tối đa 4 giờ mọi mức ưu tiên" },
    { name: "Chi nhánh TP.HCM", scope: "Đơn vị Chi nhánh TP.HCM", factor: "Theo bảng mục tiêu, lịch làm việc của chi nhánh" },
  ];
  D.escalations = [
    { level: "Mức 1", when: "Thời gian còn lại dưới 20% (hoặc dưới 1 giờ)", action: "Báo người đang xử lý" },
    { level: "Mức 2", when: "Vi phạm hạn giải quyết", action: "Báo trưởng nhóm; nâng ưu tiên lên một mức" },
    { level: "Mức 3", when: "Vi phạm quá 4 giờ làm việc", action: "Chuyển ticket cho trưởng nhóm" },
  ];

  M.screen("sla", {
    nav: "sla", title: "SLA & định tuyến", codes: ["NV-4.2.1", "NV-4.2.3", "NV-4.1.2"],
    render() {
      const can = M.can("sla.config");
      const cal = D.slaCalendar;
      const hours = M.form("sla-hours", `<div class="table-scroll"><table><thead><tr><th>Ngày</th><th>Bắt đầu</th><th>Kết thúc</th><th>Làm việc</th></tr></thead><tbody>${cal.days.map(([d, s, e], i) => `<tr><td>${esc(d)}</td><td>${M.input("s" + i, { type: "time", value: s, attrs: can ? "" : "disabled" })}</td><td>${M.input("e" + i, { type: "time", value: e, attrs: can ? "" : "disabled" })}</td><td>${s ? M.pill("Có", "ok") : M.pill("Nghỉ", "mute")}</td></tr>`).join("")}</tbody></table></div>
        <div class="form-grid" style="margin-top:14px">${M.field("Nghỉ trưa từ", M.input("l1", { type: "time", value: cal.lunch[0], attrs: can ? "" : "disabled" }))}${M.field("Đến", M.input("l2", { type: "time", value: cal.lunch[1], attrs: can ? "" : "disabled" }))}</div>
        ${can ? `<div class="form-actions" style="margin-top:14px">${M.btn("Lưu lịch làm việc", { type: "submit", primary: true })}</div>` : ""}`, { msg: "Đã lưu lịch làm việc. Hạn SLA của ticket mới tính theo lịch này." });
      const holidays = M.panel({ title: "Ngày nghỉ lễ", flush: true, actions: can ? M.btn("Thêm ngày nghỉ", { sm: true, icon: "plus", modal: "sla-holiday" }) : "", body: M.table({ id: "sla-hol", rows: cal.holidays, cols: [{ h: "Ngày", r: (x) => `<span class="mono">${esc(x[0])}</span>` }, { h: "Tên", r: (x) => esc(x[1]) }] }) });
      const targets = M.panel({ title: "Mục tiêu theo mức ưu tiên", flush: true, actions: can ? M.btn("Sửa mục tiêu", { sm: true, msg: "Mockup: mở form sửa mục tiêu, áp cho ticket tạo sau khi lưu." }) : "",
        body: M.table({ id: "sla-tg", rows: Object.keys(PRIO), cols: [
          { h: "Ưu tiên", r: (k) => M.pill(...PRIO[k]) },
          { h: "Nhận xử lý trong", r: (k) => esc(SLA_TARGET[k][0]) },
          { h: "Giải quyết trong", r: (k) => esc(SLA_TARGET[k][1]) },
          { h: "Ticket đang mở", cls: "right", r: (k) => `<span class="mono">${D.tickets.filter((t) => t.priority === k && isOpen(t)).length}</span>` },
        ] }) });
      const policies = M.panel({ title: "Gán chính sách", flush: true, body: M.table({ id: "sla-pol", rows: D.slaPolicies, cols: [{ h: "Chính sách", r: (x) => `<b>${esc(x.name)}</b>` }, { h: "Áp cho", cls: "wrap", r: (x) => esc(x.scope) }, { h: "Mục tiêu", cls: "wrap", r: (x) => esc(x.factor) }] }) });
      const rules = M.panel({ title: "Quy tắc định tuyến", flush: true, actions: can ? M.btn("Thêm quy tắc", { sm: true, icon: "plus", msg: "Mockup: thêm quy tắc định tuyến theo danh mục, đơn vị hoặc loại thiết bị." }) : "",
        body: M.table({ id: "sla-route", rows: D.routingRules, cols: [
          { h: "Thứ tự", r: (r) => `<span class="mono">${esc(r.order)}</span>` },
          { h: "Điều kiện", cls: "wrap", r: (r) => esc(r.cond) },
          { h: "Giao cho", cls: "wrap", r: (r) => esc(r.target) },
          { h: "Bật", r: (r) => (r.active ? M.pill("Đang dùng", "ok") : M.pill("Tắt", "mute")) },
        ] }) });
      const esc2 = M.panel({ title: "Leo thang", flush: true, body: M.table({ id: "sla-esc", rows: D.escalations, cols: [{ h: "Mức", r: (x) => esc(x.level) }, { h: "Khi nào", cls: "wrap", r: (x) => esc(x.when) }, { h: "Hành động", cls: "wrap", r: (x) => esc(x.action) }] }) });
      const groups = M.panel({ title: "Nhóm xử lý và OLA", flush: true, body: M.table({ id: "sla-grp", rows: D.ticketGroups, cols: [{ h: "Nhóm", r: (g) => `<b>${esc(g.name)}</b>` }, { h: "Trưởng nhóm", r: (g) => esc(ename(g.lead)) }, { h: "Thành viên", cls: "wrap", r: (g) => esc(g.members.map(ename).join(", ")) }, { h: "OLA nội bộ", r: (g) => esc(g.name === "Hạ tầng" ? "Nhận trong 30 phút khi được chuyển tới" : "Nhận trong 1 giờ khi được chuyển tới") }] }) });
      return M.page({
        title: "SLA, lịch làm việc và định tuyến",
        sub: can ? "" : M.pill("Chỉ xem", "mute"),
        codes: this.codes,
        body: M.cc("CC-14", "Con số SLA thật và giờ làm việc của công ty? Bảng dưới là ví dụ minh họa của tài liệu nghiệp vụ.") + M.tabs("sla", [
          { key: "targets", label: "Mục tiêu SLA", body: `<div class="grid g2">${targets}${policies}</div>` },
          { key: "hours", label: "Lịch làm việc & ngày nghỉ", body: `<div class="grid g2">${M.panel({ title: "Giờ làm việc", body: hours })}${holidays}</div>` },
          { key: "routing", label: "Định tuyến", body: rules + groups },
          { key: "escalation", label: "Cảnh báo & leo thang", body: esc2 },
        ]),
      });
    },
  });
  M.defModal("sla-holiday", () => ({
    title: "Thêm ngày nghỉ lễ",
    body: M.field("Ngày", M.input("date", { ph: "01/01/2028" }), { req: true }) + M.field("Tên ngày nghỉ", M.input("name"), { req: true }),
    submit: "Thêm",
    onSubmit(data, form) {
      if (!/^\d{2}\/\d{2}\/\d{4}/.test(data.date || "")) return M.invalid(form, "date", "Nhập ngày theo dạng dd/mm/yyyy.");
      if (!String(data.name || "").trim()) return M.invalid(form, "name", "Nhập tên ngày nghỉ.");
      D.slaCalendar.holidays.push([data.date, data.name.trim()]);
      return "Đã thêm ngày nghỉ. Ticket đi qua ngày này không bị tính giờ.";
    },
  }));
})();
