// Strings for features added in the pre-launch round (follow-up tracking, AI skills,
// lead capture, offer responses…). Kept separate from translations.ts; same 4 languages.
import { useI18n } from "./I18nContext";

const en = {
  common: {
    save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", close: "Close", loading: "Loading…",
    optional: "optional", none: "None", copy: "Copy", copied: "Copied", saved: "Saved", error: "Something went wrong",
    confirmDelete: "Delete this item? This cannot be undone.",
  },
  crm: {
    needsFollowUp: "Needs follow-up", allPriorities: "All priorities", priority: "Priority",
    HOT: "Hot", WARM: "Warm", COLD: "Cold",
    source: "Lead source", sourcePlaceholder: "e.g. Zillow, Referral, Open House", tags: "Tags", tagsPlaceholder: "comma separated",
    lastContact: "Last contact", never: "Never", daysAgo: "{n}d ago", today: "Today",
    duplicateConfirm: "{msg}\n\nCreate a separate record anyway?",
    typeRenter: "Renter", typeInvestor: "Investor", archive: "Archive client",
    archiveConfirm: "Archive this client? They will be hidden from lists but their history is kept.",
    archived: "Client archived", notes: "Notes", preferredContact: "Preferred contact",
  },
  detail: {
    EMAIL: "Email", TEXT: "Text", NOTE: "Note", CALL: "Call", MEETING: "Meeting", SHOWING: "Showing",
    followUpDate: "Remind me to follow up on", aiFollowUp: "Draft follow-up with AI", logged: "Activity logged",
  },
  dashboard: {
    today: "Today", todaysAppointments: "Today's appointments", noAppointments: "No appointments today",
    overdueTasks: "Overdue tasks", noOverdue: "Nothing overdue", needsFollowUp: "Leads needing follow-up",
    allCaughtUp: "All caught up", hotLeads: "Hot leads", viewAll: "View all", myView: "My numbers", teamView: "Team numbers",
  },
  offers: {
    accept: "Accept", reject: "Reject", counter: "Counter", withdraw: "Withdraw", counterPrompt: "Counter amount ($):",
    dealOpened: "Offer accepted — a deal and closing checklist were created.", updated: "Offer updated",
    status: { PENDING: "Pending", ACCEPTED: "Accepted", REJECTED: "Rejected", COUNTER: "Countered", WITHDRAWN: "Withdrawn", EXPIRED: "Expired" },
  },
  deals: {
    checklist: "Closing checklist", commissionRate: "Commission rate (%)", commissionRateHint: "Leave blank to use the brokerage default",
    deleteDeal: "Delete deal", deleteConfirm: "Delete this deal? Use this only for deals entered by mistake.", deleted: "Deal deleted",
    noChecklist: "No checklist items", openDeal: "Open",
  },
  appts: {
    type: "Type", location: "Location", markComplete: "Mark complete", markCancelled: "Cancel appointment", confirm: "Confirm",
    updated: "Appointment updated", deleted: "Appointment deleted",
    types: { SHOWING: "Showing", MEETING: "Meeting", CALL: "Call", OPEN_HOUSE: "Open house", INSPECTION: "Inspection", CLOSING: "Closing", FOLLOW_UP: "Follow-up" },
  },
  services: {
    chooseClient: "Choose a client", chooseAgent: "Choose a colleague", giftItem: "Gift", giftPlaceholder: "e.g. Closing anniversary champagne",
    sendGift: "Order gift", referTo: "Refer to", referralNotes: "Notes for your colleague", sendReferral: "Send referral",
    myGifts: "Gift orders", myReferrals: "Referrals", empty: "Nothing yet", giftOrdered: "Gift order created", referralSent: "Referral sent",
    amount: "Budget ($)", markDelivered: "Mark delivered", accept: "Accept", decline: "Decline",
  },
  ai: {
    title: "AI Assistant", subtitle: "Run real-estate skills against your listings and clients.", skill: "Skill",
    property: "Listing", client: "Client", input: "Your input", run: "Generate", running: "Writing…",
    locked: "Requires {tier} plan", inDevelopment: "In development", inDevelopmentNote: "The AI assistant is still in development and will be available in a later release. Below is a preview of the planned skills.", notConfigured: "The AI assistant isn't configured on the server yet (ANTHROPIC_API_KEY). Listing copy uses basic templates until then.",
    result: "Result", saveToLibrary: "Save to library", language: "Language",
  },
  publicListing: {
    contactAgent: "Ask about this home", yourName: "Your name", email: "Email", phone: "Phone", message: "Message",
    messagePlaceholder: "I'd like to schedule a showing…", send: "Send", sending: "Sending…",
    sent: "Thanks! The listing agent will reach out shortly.", back: "All listings", viewDetails: "View details",
    listedBy: "Listed by", notFound: "This listing is no longer available.", openHouseSignIn: "Open house sign-in",
    beds: "beds", baths: "baths", sqft: "sq ft",
    virtualTour: "Virtual tour", built: "Built", inContract: "In contract", agent: "Agent", referralFee: "Referral fee ($)",
  },
  listings: { publicPage: "Public page", openHouseLink: "Copy open-house sign-in link", linkCopied: "Link copied — print it as a QR code at the door", aiDescribe: "AI description", },
  settings: {
    commissionDefaults: "Commission defaults", publicPage: "Public listings page", publicPageHelp: "Share this link or put it on your website — it shows only your brokerage's active listings.", defaultCommissionRate: "Default commission rate (%)", defaultFirmSplit: "Firm split (%)",
    commissionHelp: "Used to create the agent's commission automatically when a deal is marked Closed.",
  },
};

type Dict = typeof en;

const zhCN: Dict = {
  common: {
    save: "保存", cancel: "取消", delete: "删除", edit: "编辑", close: "关闭", loading: "加载中…",
    optional: "可选", none: "无", copy: "复制", copied: "已复制", saved: "已保存", error: "出错了",
    confirmDelete: "确定删除？此操作无法撤销。",
  },
  crm: {
    needsFollowUp: "待跟进", allPriorities: "全部优先级", priority: "优先级",
    HOT: "热", WARM: "温", COLD: "冷",
    source: "客户来源", sourcePlaceholder: "如 Zillow、转介绍、开放日", tags: "标签", tagsPlaceholder: "用逗号分隔",
    lastContact: "最近联系", never: "从未", daysAgo: "{n}天前", today: "今天",
    duplicateConfirm: "{msg}\n\n仍然创建一条新记录？",
    typeRenter: "租客", typeInvestor: "投资者", archive: "归档客户",
    archiveConfirm: "归档该客户？客户将从列表中隐藏，但历史记录会保留。",
    archived: "客户已归档", notes: "备注", preferredContact: "首选联系方式",
  },
  detail: {
    EMAIL: "邮件", TEXT: "短信", NOTE: "备注", CALL: "电话", MEETING: "会面", SHOWING: "带看",
    followUpDate: "提醒我跟进的日期", aiFollowUp: "用 AI 起草跟进消息", logged: "活动已记录",
  },
  dashboard: {
    today: "今天", todaysAppointments: "今日预约", noAppointments: "今天没有预约",
    overdueTasks: "逾期任务", noOverdue: "没有逾期任务", needsFollowUp: "待跟进客户",
    allCaughtUp: "全部已跟进", hotLeads: "热门客户", viewAll: "查看全部", myView: "我的数据", teamView: "团队数据",
  },
  offers: {
    accept: "接受", reject: "拒绝", counter: "还价", withdraw: "撤回", counterPrompt: "还价金额（美元）：",
    dealOpened: "报价已接受——已自动创建交易和成交清单。", updated: "报价已更新",
    status: { PENDING: "待处理", ACCEPTED: "已接受", REJECTED: "已拒绝", COUNTER: "已还价", WITHDRAWN: "已撤回", EXPIRED: "已过期" },
  },
  deals: {
    checklist: "成交清单", commissionRate: "佣金比例（%）", commissionRateHint: "留空则使用公司默认值",
    deleteDeal: "删除交易", deleteConfirm: "删除该交易？仅用于误录入的交易。", deleted: "交易已删除",
    noChecklist: "暂无清单事项", openDeal: "打开",
  },
  appts: {
    type: "类型", location: "地点", markComplete: "标记完成", markCancelled: "取消预约", confirm: "确认",
    updated: "预约已更新", deleted: "预约已删除",
    types: { SHOWING: "带看", MEETING: "会面", CALL: "电话", OPEN_HOUSE: "开放日", INSPECTION: "验房", CLOSING: "过户", FOLLOW_UP: "跟进" },
  },
  services: {
    chooseClient: "选择客户", chooseAgent: "选择同事", giftItem: "礼品", giftPlaceholder: "如：成交周年香槟",
    sendGift: "下单礼品", referTo: "转介给", referralNotes: "给同事的备注", sendReferral: "发送转介",
    myGifts: "礼品订单", myReferrals: "转介记录", empty: "暂无记录", giftOrdered: "礼品订单已创建", referralSent: "转介已发送",
    amount: "预算（美元）", markDelivered: "标记已送达", accept: "接受", decline: "拒绝",
  },
  ai: {
    title: "AI 助手", subtitle: "基于你的房源和客户运行房产专用技能。", skill: "技能",
    property: "房源", client: "客户", input: "补充说明", run: "生成", running: "生成中…",
    locked: "需要 {tier} 套餐", inDevelopment: "正在开发", inDevelopmentNote: "AI 助手正在开发中，将在后续版本开放。下面是计划提供的技能预览。", notConfigured: "服务器尚未配置 AI 助手（ANTHROPIC_API_KEY）。在此之前房源文案使用基础模板。",
    result: "结果", saveToLibrary: "保存到素材库", language: "语言",
  },
  publicListing: {
    contactAgent: "咨询这套房源", yourName: "您的姓名", email: "邮箱", phone: "电话", message: "留言",
    messagePlaceholder: "我想预约看房…", send: "发送", sending: "发送中…",
    sent: "感谢！经纪人会尽快与您联系。", back: "全部房源", viewDetails: "查看详情",
    listedBy: "挂牌经纪人", notFound: "该房源已下架。", openHouseSignIn: "开放日签到",
    beds: "卧", baths: "卫", sqft: "平方英尺",
    virtualTour: "虚拟看房", built: "建于", inContract: "已签约", agent: "经纪人", referralFee: "转介费（美元）",
  },
  listings: { publicPage: "公开页面", openHouseLink: "复制开放日签到链接", linkCopied: "链接已复制——可打印成二维码放在门口", aiDescribe: "AI 写文案", },
  settings: {
    commissionDefaults: "佣金默认设置", publicPage: "公开房源页面", publicPageHelp: "分享此链接或放到公司网站上——只展示本公司的在售房源。", defaultCommissionRate: "默认佣金比例（%）", defaultFirmSplit: "公司分成（%）",
    commissionHelp: "交易标记为“已成交”时，用于自动生成经纪人的佣金记录。",
  },
};

const zhTW: Dict = {
  common: {
    save: "儲存", cancel: "取消", delete: "刪除", edit: "編輯", close: "關閉", loading: "載入中…",
    optional: "選填", none: "無", copy: "複製", copied: "已複製", saved: "已儲存", error: "發生錯誤",
    confirmDelete: "確定刪除？此操作無法復原。",
  },
  crm: {
    needsFollowUp: "待跟進", allPriorities: "全部優先級", priority: "優先級",
    HOT: "熱", WARM: "溫", COLD: "冷",
    source: "客戶來源", sourcePlaceholder: "如 Zillow、轉介紹、開放參觀", tags: "標籤", tagsPlaceholder: "以逗號分隔",
    lastContact: "最近聯絡", never: "從未", daysAgo: "{n}天前", today: "今天",
    duplicateConfirm: "{msg}\n\n仍要建立一筆新紀錄？",
    typeRenter: "租客", typeInvestor: "投資者", archive: "封存客戶",
    archiveConfirm: "封存此客戶？客戶將從列表隱藏，但歷史紀錄會保留。",
    archived: "客戶已封存", notes: "備註", preferredContact: "偏好聯絡方式",
  },
  detail: {
    EMAIL: "郵件", TEXT: "簡訊", NOTE: "備註", CALL: "電話", MEETING: "會面", SHOWING: "帶看",
    followUpDate: "提醒我跟進的日期", aiFollowUp: "用 AI 草擬跟進訊息", logged: "活動已記錄",
  },
  dashboard: {
    today: "今天", todaysAppointments: "今日預約", noAppointments: "今天沒有預約",
    overdueTasks: "逾期任務", noOverdue: "沒有逾期任務", needsFollowUp: "待跟進客戶",
    allCaughtUp: "全部已跟進", hotLeads: "熱門客戶", viewAll: "查看全部", myView: "我的數據", teamView: "團隊數據",
  },
  offers: {
    accept: "接受", reject: "拒絕", counter: "還價", withdraw: "撤回", counterPrompt: "還價金額（美元）：",
    dealOpened: "出價已接受——已自動建立交易與成交清單。", updated: "出價已更新",
    status: { PENDING: "待處理", ACCEPTED: "已接受", REJECTED: "已拒絕", COUNTER: "已還價", WITHDRAWN: "已撤回", EXPIRED: "已過期" },
  },
  deals: {
    checklist: "成交清單", commissionRate: "佣金比例（%）", commissionRateHint: "留空則使用公司預設值",
    deleteDeal: "刪除交易", deleteConfirm: "刪除此交易？僅用於誤輸入的交易。", deleted: "交易已刪除",
    noChecklist: "暫無清單項目", openDeal: "開啟",
  },
  appts: {
    type: "類型", location: "地點", markComplete: "標記完成", markCancelled: "取消預約", confirm: "確認",
    updated: "預約已更新", deleted: "預約已刪除",
    types: { SHOWING: "帶看", MEETING: "會面", CALL: "電話", OPEN_HOUSE: "開放參觀", INSPECTION: "驗屋", CLOSING: "過戶", FOLLOW_UP: "跟進" },
  },
  services: {
    chooseClient: "選擇客戶", chooseAgent: "選擇同事", giftItem: "禮品", giftPlaceholder: "如：成交週年香檳",
    sendGift: "訂購禮品", referTo: "轉介給", referralNotes: "給同事的備註", sendReferral: "送出轉介",
    myGifts: "禮品訂單", myReferrals: "轉介紀錄", empty: "暫無紀錄", giftOrdered: "禮品訂單已建立", referralSent: "轉介已送出",
    amount: "預算（美元）", markDelivered: "標記已送達", accept: "接受", decline: "拒絕",
  },
  ai: {
    title: "AI 助理", subtitle: "以你的物件與客戶執行房產專用技能。", skill: "技能",
    property: "物件", client: "客戶", input: "補充說明", run: "產生", running: "撰寫中…",
    locked: "需要 {tier} 方案", inDevelopment: "開發中", inDevelopmentNote: "AI 助理仍在開發中，將於後續版本開放。以下為規劃中的技能預覽。", notConfigured: "伺服器尚未設定 AI 助理（ANTHROPIC_API_KEY）。在此之前物件文案使用基本範本。",
    result: "結果", saveToLibrary: "儲存到素材庫", language: "語言",
  },
  publicListing: {
    contactAgent: "詢問此物件", yourName: "您的姓名", email: "電子郵件", phone: "電話", message: "留言",
    messagePlaceholder: "我想預約看屋…", send: "送出", sending: "送出中…",
    sent: "感謝！經紀人將盡快與您聯絡。", back: "全部物件", viewDetails: "查看詳情",
    listedBy: "刊登經紀人", notFound: "此物件已下架。", openHouseSignIn: "開放參觀簽到",
    beds: "房", baths: "衛", sqft: "平方英尺",
    virtualTour: "虛擬看屋", built: "建於", inContract: "已簽約", agent: "經紀人", referralFee: "轉介費（美元）",
  },
  listings: { publicPage: "公開頁面", openHouseLink: "複製開放參觀簽到連結", linkCopied: "連結已複製——可列印成 QR code 放在門口", aiDescribe: "AI 撰寫文案", },
  settings: {
    commissionDefaults: "佣金預設", publicPage: "公開物件頁面", publicPageHelp: "分享此連結或放到公司網站——只顯示本公司的在售物件。", defaultCommissionRate: "預設佣金比例（%）", defaultFirmSplit: "公司分成（%）",
    commissionHelp: "交易標記為「已成交」時，用於自動建立經紀人的佣金紀錄。",
  },
};

const es: Dict = {
  common: {
    save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", close: "Cerrar", loading: "Cargando…",
    optional: "opcional", none: "Ninguno", copy: "Copiar", copied: "Copiado", saved: "Guardado", error: "Algo salió mal",
    confirmDelete: "¿Eliminar este elemento? No se puede deshacer.",
  },
  crm: {
    needsFollowUp: "Requiere seguimiento", allPriorities: "Todas las prioridades", priority: "Prioridad",
    HOT: "Caliente", WARM: "Templado", COLD: "Frío",
    source: "Origen del contacto", sourcePlaceholder: "p. ej. Zillow, Referido, Open House", tags: "Etiquetas", tagsPlaceholder: "separadas por comas",
    lastContact: "Último contacto", never: "Nunca", daysAgo: "hace {n}d", today: "Hoy",
    duplicateConfirm: "{msg}\n\n¿Crear un registro separado de todos modos?",
    typeRenter: "Inquilino", typeInvestor: "Inversionista", archive: "Archivar cliente",
    archiveConfirm: "¿Archivar este cliente? Se ocultará de las listas, pero su historial se conserva.",
    archived: "Cliente archivado", notes: "Notas", preferredContact: "Contacto preferido",
  },
  detail: {
    EMAIL: "Correo", TEXT: "Mensaje", NOTE: "Nota", CALL: "Llamada", MEETING: "Reunión", SHOWING: "Visita",
    followUpDate: "Recordarme hacer seguimiento el", aiFollowUp: "Redactar seguimiento con IA", logged: "Actividad registrada",
  },
  dashboard: {
    today: "Hoy", todaysAppointments: "Citas de hoy", noAppointments: "No hay citas hoy",
    overdueTasks: "Tareas vencidas", noOverdue: "Nada vencido", needsFollowUp: "Contactos que requieren seguimiento",
    allCaughtUp: "Todo al día", hotLeads: "Contactos calientes", viewAll: "Ver todo", myView: "Mis números", teamView: "Equipo",
  },
  offers: {
    accept: "Aceptar", reject: "Rechazar", counter: "Contraofertar", withdraw: "Retirar", counterPrompt: "Monto de la contraoferta ($):",
    dealOpened: "Oferta aceptada: se creó la operación y la lista de cierre.", updated: "Oferta actualizada",
    status: { PENDING: "Pendiente", ACCEPTED: "Aceptada", REJECTED: "Rechazada", COUNTER: "Contraoferta", WITHDRAWN: "Retirada", EXPIRED: "Vencida" },
  },
  deals: {
    checklist: "Lista de cierre", commissionRate: "Comisión (%)", commissionRateHint: "Déjalo vacío para usar el valor de la agencia",
    deleteDeal: "Eliminar operación", deleteConfirm: "¿Eliminar esta operación? Úsalo solo para operaciones creadas por error.", deleted: "Operación eliminada",
    noChecklist: "Sin elementos", openDeal: "Abrir",
  },
  appts: {
    type: "Tipo", location: "Ubicación", markComplete: "Marcar completada", markCancelled: "Cancelar cita", confirm: "Confirmar",
    updated: "Cita actualizada", deleted: "Cita eliminada",
    types: { SHOWING: "Visita", MEETING: "Reunión", CALL: "Llamada", OPEN_HOUSE: "Open house", INSPECTION: "Inspección", CLOSING: "Cierre", FOLLOW_UP: "Seguimiento" },
  },
  services: {
    chooseClient: "Elige un cliente", chooseAgent: "Elige un colega", giftItem: "Regalo", giftPlaceholder: "p. ej. Champán de aniversario",
    sendGift: "Pedir regalo", referTo: "Referir a", referralNotes: "Notas para tu colega", sendReferral: "Enviar referido",
    myGifts: "Pedidos de regalos", myReferrals: "Referidos", empty: "Nada todavía", giftOrdered: "Pedido de regalo creado", referralSent: "Referido enviado",
    amount: "Presupuesto ($)", markDelivered: "Marcar entregado", accept: "Aceptar", decline: "Rechazar",
  },
  ai: {
    title: "Asistente IA", subtitle: "Ejecuta habilidades inmobiliarias sobre tus propiedades y clientes.", skill: "Habilidad",
    property: "Propiedad", client: "Cliente", input: "Tus indicaciones", run: "Generar", running: "Escribiendo…",
    locked: "Requiere el plan {tier}", inDevelopment: "En desarrollo", inDevelopmentNote: "El asistente de IA aún está en desarrollo y estará disponible en una versión posterior. Abajo hay una vista previa de las habilidades previstas.", notConfigured: "El asistente IA aún no está configurado en el servidor (ANTHROPIC_API_KEY). Mientras tanto se usan plantillas básicas.",
    result: "Resultado", saveToLibrary: "Guardar en la biblioteca", language: "Idioma",
  },
  publicListing: {
    contactAgent: "Pregunta por esta casa", yourName: "Tu nombre", email: "Correo", phone: "Teléfono", message: "Mensaje",
    messagePlaceholder: "Me gustaría agendar una visita…", send: "Enviar", sending: "Enviando…",
    sent: "¡Gracias! El agente te contactará pronto.", back: "Todas las propiedades", viewDetails: "Ver detalles",
    listedBy: "Publicado por", notFound: "Esta propiedad ya no está disponible.", openHouseSignIn: "Registro de open house",
    beds: "hab.", baths: "baños", sqft: "pies²",
    virtualTour: "Recorrido virtual", built: "Construida en", inContract: "En contrato", agent: "Agente", referralFee: "Comisión por referido ($)",
  },
  listings: { publicPage: "Página pública", openHouseLink: "Copiar enlace de registro del open house", linkCopied: "Enlace copiado: imprímelo como código QR en la entrada", aiDescribe: "Descripción con IA", },
  settings: {
    commissionDefaults: "Comisiones predeterminadas", publicPage: "Página pública de propiedades", publicPageHelp: "Comparte este enlace o ponlo en tu sitio web: solo muestra las propiedades activas de tu agencia.", defaultCommissionRate: "Comisión predeterminada (%)", defaultFirmSplit: "Parte de la agencia (%)",
    commissionHelp: "Se usa para crear automáticamente la comisión del agente cuando una operación se marca como cerrada.",
  },
};

const DICTS: Record<string, Dict> = { en, "zh-CN": zhCN, "zh-TW": zhTW, es };

export function useExtra(): Dict {
  const { language } = useI18n();
  return DICTS[language] || en;
}

export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
}

// Map the UI language to the code the AI endpoint expects
export function aiLanguage(language: string) {
  return language === "zh-CN" ? "zh" : language;
}
