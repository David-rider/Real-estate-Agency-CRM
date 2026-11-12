// Server-side message catalog: the wording of emails and notifications in the four interface languages.
// The language comes from the recipient's saved preference (User.preferredLanguage); English is the fallback.

export type Lang = 'en' | 'zh-CN' | 'zh-TW' | 'es';
export const LANGS: Lang[] = ['en', 'zh-CN', 'zh-TW', 'es'];

export function isLang(v: unknown): v is Lang {
    return typeof v === 'string' && (LANGS as string[]).includes(v);
}

export function normalizeLang(v: unknown): Lang {
    return isLang(v) ? v : 'en';
}

const LOCALES: Record<Lang, string> = { en: 'en-US', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', es: 'es-US' };

function fmtWhen(lang: Lang, d: Date): string {
    return d.toLocaleString(LOCALES[lang], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function fmtUtc(d: Date | null | undefined): string {
    return d ? d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '';
}

function money(n: number): string {
    return `$${n.toLocaleString('en-US')}`;
}

// ── Labels ───────────────────────────────────────────────────────────────────

const DEAL_STATUS: Record<string, Record<Lang, string>> = {
    IN_CONTRACT: { en: 'in contract', 'zh-CN': '合同中', 'zh-TW': '合約中', es: 'en contrato' },
    BOARD_PACKAGE: { en: 'board package', 'zh-CN': '董事会资料包', 'zh-TW': '董事會資料包', es: 'paquete para la junta' },
    CLEARED_TO_CLOSE: { en: 'cleared to close', 'zh-CN': '可以过户', 'zh-TW': '可以過戶', es: 'listo para cerrar' },
    CLOSED: { en: 'closed', 'zh-CN': '已成交', 'zh-TW': '已成交', es: 'cerrado' },
    FALLEN_THROUGH: { en: 'fallen through', 'zh-CN': '已告吹', 'zh-TW': '已告吹', es: 'cancelado' },
};

const OFFER_STATUS: Record<string, Record<Lang, string>> = {
    ACCEPTED: { en: 'accepted', 'zh-CN': '已接受', 'zh-TW': '已接受', es: 'aceptada' },
    REJECTED: { en: 'rejected', 'zh-CN': '已拒绝', 'zh-TW': '已拒絕', es: 'rechazada' },
    COUNTER: { en: 'countered', 'zh-CN': '已还价', 'zh-TW': '已還價', es: 'con contraoferta' },
    WITHDRAWN: { en: 'withdrawn', 'zh-CN': '已撤回', 'zh-TW': '已撤回', es: 'retirada' },
    EXPIRED: { en: 'expired', 'zh-CN': '已过期', 'zh-TW': '已過期', es: 'vencida' },
    PENDING: { en: 'pending', 'zh-CN': '待处理', 'zh-TW': '待處理', es: 'pendiente' },
};

const ROLE_LABEL: Record<string, Record<Lang, string>> = {
    AGENT: { en: 'Agent', 'zh-CN': '经纪人', 'zh-TW': '經紀人', es: 'Agente' },
    MANAGER: { en: 'Manager', 'zh-CN': '经理', 'zh-TW': '經理', es: 'Gerente' },
    ATTORNEY: { en: 'Attorney', 'zh-CN': '律师', 'zh-TW': '律師', es: 'Abogado' },
    LENDER: { en: 'Lender', 'zh-CN': '贷款方', 'zh-TW': '貸款方', es: 'Prestamista' },
    TITLECO: { en: 'Title company', 'zh-CN': '产权公司', 'zh-TW': '產權公司', es: 'Compañía de títulos' },
    MARKETING: { en: 'Marketing', 'zh-CN': '市场推广', 'zh-TW': '市場推廣', es: 'Marketing' },
    OFFICE_SUPPORT: { en: 'Office support', 'zh-CN': '行政支持', 'zh-TW': '行政支援', es: 'Apoyo de oficina' },
};

function label(table: Record<string, Record<Lang, string>>, key: string, lang: Lang): string {
    return table[key]?.[lang] ?? key.replace(/_/g, ' ').toLowerCase();
}

// ── Notifications (in-app text and the matching email body) ─────────────────

export interface NotificationText { title: string; message: string }
type Tpl = (p: any) => NotificationText;

const N: Record<string, Record<Lang, Tpl>> = {
    dealStatus: {
        en: (p) => ({ title: 'Deal status updated', message: `Deal moved to ${label(DEAL_STATUS, p.status, 'en')}.` }),
        'zh-CN': (p) => ({ title: '交易状态已更新', message: `交易已进入“${label(DEAL_STATUS, p.status, 'zh-CN')}”状态。` }),
        'zh-TW': (p) => ({ title: '交易狀態已更新', message: `交易已進入「${label(DEAL_STATUS, p.status, 'zh-TW')}」狀態。` }),
        es: (p) => ({ title: 'Estado de la operación actualizado', message: `La operación pasó a «${label(DEAL_STATUS, p.status, 'es')}».` }),
    },
    appointmentUpcoming: {
        en: (p) => ({ title: 'Upcoming appointment', message: `"${p.title}"${p.who ? ` with ${p.who}` : ''}${p.where ? ` at ${p.where}` : ''} — ${fmtUtc(p.date)}` }),
        'zh-CN': (p) => ({ title: '即将到来的预约', message: `“${p.title}”${p.who ? `，客户：${p.who}` : ''}${p.where ? `，地点：${p.where}` : ''}，时间：${fmtUtc(p.date)}` }),
        'zh-TW': (p) => ({ title: '即將到來的預約', message: `「${p.title}」${p.who ? `，客戶：${p.who}` : ''}${p.where ? `，地點：${p.where}` : ''}，時間：${fmtUtc(p.date)}` }),
        es: (p) => ({ title: 'Próxima cita', message: `«${p.title}»${p.who ? ` con ${p.who}` : ''}${p.where ? ` en ${p.where}` : ''} — ${fmtUtc(p.date)}` }),
    },
    taskOverdue: {
        en: (p) => ({ title: `Task overdue: ${p.title}`, message: `"${p.title}" is past its due time (${fmtUtc(p.date)}).` }),
        'zh-CN': (p) => ({ title: `任务已逾期：${p.title}`, message: `“${p.title}”已超过截止时间（${fmtUtc(p.date)}）。` }),
        'zh-TW': (p) => ({ title: `任務已逾期：${p.title}`, message: `「${p.title}」已超過截止時間（${fmtUtc(p.date)}）。` }),
        es: (p) => ({ title: `Tarea vencida: ${p.title}`, message: `«${p.title}» pasó su fecha límite (${fmtUtc(p.date)}).` }),
    },
    appointmentScheduled: {
        en: (p) => ({ title: 'Appointment scheduled', message: `"${p.title}" is scheduled for ${fmtWhen('en', p.date)}.` }),
        'zh-CN': (p) => ({ title: '预约已创建', message: `“${p.title}”已安排在 ${fmtWhen('zh-CN', p.date)}。` }),
        'zh-TW': (p) => ({ title: '預約已建立', message: `「${p.title}」已安排在 ${fmtWhen('zh-TW', p.date)}。` }),
        es: (p) => ({ title: 'Cita programada', message: `«${p.title}» está programada para ${fmtWhen('es', p.date)}.` }),
    },
    clientAssigned: {
        en: (p) => ({ title: p.isNew ? 'New client assigned to you' : 'Client assigned to you', message: `${p.name} was assigned to you.` }),
        'zh-CN': (p) => ({ title: p.isNew ? '分配给你一位新客户' : '有客户分配给你', message: `${p.name} 已分配给你。` }),
        'zh-TW': (p) => ({ title: p.isNew ? '分配給你一位新客戶' : '有客戶分配給你', message: `${p.name} 已分配給你。` }),
        es: (p) => ({ title: p.isNew ? 'Nuevo cliente asignado' : 'Cliente asignado', message: `${p.name} fue asignado a usted.` }),
    },
    payoutApproved: {
        en: (p) => ({ title: 'Payout approved', message: `Your commission payout of ${money(p.amount)} was approved.` }),
        'zh-CN': (p) => ({ title: '佣金发放已批准', message: `你的佣金发放 ${money(p.amount)} 已获批准。` }),
        'zh-TW': (p) => ({ title: '佣金發放已核准', message: `你的佣金發放 ${money(p.amount)} 已獲核准。` }),
        es: (p) => ({ title: 'Pago aprobado', message: `Su pago de comisión de ${money(p.amount)} fue aprobado.` }),
    },
    payoutReturned: {
        en: () => ({ title: 'Payout request returned', message: 'Your payout request was not approved. Check with your manager.' }),
        'zh-CN': () => ({ title: '发放申请被退回', message: '你的发放申请未获批准，请联系你的经理。' }),
        'zh-TW': () => ({ title: '發放申請被退回', message: '你的發放申請未獲核准，請聯絡你的經理。' }),
        es: () => ({ title: 'Solicitud de pago devuelta', message: 'Su solicitud de pago no fue aprobada. Consulte con su gerente.' }),
    },
    offerReceived: {
        en: (p) => ({ title: 'New offer received', message: `An offer of ${money(p.amount)} was submitted for ${p.address}.` }),
        'zh-CN': (p) => ({ title: '收到新报价', message: `${p.address} 收到一份 ${money(p.amount)} 的报价。` }),
        'zh-TW': (p) => ({ title: '收到新報價', message: `${p.address} 收到一份 ${money(p.amount)} 的報價。` }),
        es: (p) => ({ title: 'Nueva oferta recibida', message: `Se presentó una oferta de ${money(p.amount)} por ${p.address}.` }),
    },
    offerStatus: {
        en: (p) => ({ title: `Offer ${label(OFFER_STATUS, p.status, 'en')}`, message: `Your offer of ${money(p.amount)} on ${p.address} was ${label(OFFER_STATUS, p.status, 'en')}.` }),
        'zh-CN': (p) => ({ title: `报价${label(OFFER_STATUS, p.status, 'zh-CN')}`, message: `你对 ${p.address} 的 ${money(p.amount)} 报价${label(OFFER_STATUS, p.status, 'zh-CN')}。` }),
        'zh-TW': (p) => ({ title: `報價${label(OFFER_STATUS, p.status, 'zh-TW')}`, message: `你對 ${p.address} 的 ${money(p.amount)} 報價${label(OFFER_STATUS, p.status, 'zh-TW')}。` }),
        es: (p) => ({ title: `Oferta ${label(OFFER_STATUS, p.status, 'es')}`, message: `Su oferta de ${money(p.amount)} por ${p.address} fue ${label(OFFER_STATUS, p.status, 'es')}.` }),
    },
    leadInquiry: {
        en: (p) => ({ title: p.isNew ? `New ${p.openHouse ? 'open house' : 'website'} lead` : `Returning lead: ${p.name}`, message: p.openHouse ? `${p.name} signed in at the open house for ${p.address}. Follow up within 24 hours.` : `${p.name} asked about ${p.address}. Reach out within 5 minutes.` }),
        'zh-CN': (p) => ({ title: p.isNew ? `新的${p.openHouse ? '开放日' : '网站'}线索` : `回访线索：${p.name}`, message: p.openHouse ? `${p.name} 在 ${p.address} 的开放日签到，请在 24 小时内跟进。` : `${p.name} 咨询了 ${p.address}，请在 5 分钟内联系。` }),
        'zh-TW': (p) => ({ title: p.isNew ? `新的${p.openHouse ? '開放日' : '網站'}線索` : `回訪線索：${p.name}`, message: p.openHouse ? `${p.name} 在 ${p.address} 的開放日簽到，請在 24 小時內跟進。` : `${p.name} 詢問了 ${p.address}，請在 5 分鐘內聯絡。` }),
        es: (p) => ({ title: p.isNew ? `Nuevo contacto (${p.openHouse ? 'jornada de puertas abiertas' : 'sitio web'})` : `Contacto recurrente: ${p.name}`, message: p.openHouse ? `${p.name} se registró en la jornada de puertas abiertas de ${p.address}. Dé seguimiento en las próximas 24 horas.` : `${p.name} preguntó por ${p.address}. Comuníquese en los próximos 5 minutos.` }),
    },
    referralReceived: {
        en: () => ({ title: 'New referral', message: 'A colleague sent you a referral.' }),
        'zh-CN': () => ({ title: '收到新的转介', message: '一位同事向你转介了客户。' }),
        'zh-TW': () => ({ title: '收到新的轉介', message: '一位同事向你轉介了客戶。' }),
        es: () => ({ title: 'Nueva recomendación', message: 'Un colega le envió una recomendación.' }),
    },
};

export type NotificationKey = keyof typeof N;

export function notificationText(lang: Lang, key: NotificationKey, params: Record<string, unknown> = {}): NotificationText {
    return N[key][lang](params);
}

// ── Emails ───────────────────────────────────────────────────────────────────

export interface EmailStrings {
    footerNote: string;
    reset: { subject: string; title: string; body: (name: string) => string; button: string; ignore: string };
    verify: { subject: string; title: (name: string) => string; body: string; button: string; expires: string };
    invite: { subject: (org: string) => string; title: string; body: (inviter: string, org: string, role: string) => string; instruction: string; button: string; expires: string };
    notification: { greeting: (name: string) => string; button: string; footer: string; subject: (title: string) => string };
}

export const EMAIL: Record<Lang, EmailStrings> = {
    en: {
        footerNote: 'Real Estate Brokerage CRM · New York',
        reset: {
            subject: 'Reset your password', title: 'Reset your password',
            body: (n) => `Hi ${n}, we received a request to reset your password. Click the button below. This link expires in 1 hour.`,
            button: 'Reset Password', ignore: "If you didn't request this, ignore this email. Your password won't change.",
        },
        verify: {
            subject: 'Verify your email', title: (n) => `Welcome, ${n}!`,
            body: 'Your account has been created. Please verify your email address to activate it.',
            button: 'Verify Email', expires: 'This link expires in 24 hours.',
        },
        invite: {
            subject: (o) => `You've been invited to join ${o} on Real Estate CRM`, title: "You're invited!",
            body: (i, o, r) => `<strong>${i}</strong> has invited you to join <strong>${o}</strong> as a <strong>${r}</strong>.`,
            instruction: 'Click below to accept the invitation and set up your account:', button: 'Accept Invitation', expires: 'This invitation expires in 7 days.',
        },
        notification: {
            greeting: (n) => `Hi ${n},`, button: 'Open in CRM',
            footer: 'You can manage your email alert preferences in CRM Settings → Notifications.', subject: (t) => `[CRM] ${t}`,
        },
    },
    'zh-CN': {
        footerNote: '房产经纪 CRM · 纽约',
        reset: {
            subject: '重置你的密码', title: '重置你的密码',
            body: (n) => `${n}，你好！我们收到了重置密码的请求。请点击下面的按钮，链接 1 小时内有效。`,
            button: '重置密码', ignore: '如果这不是你本人的操作，请忽略这封邮件，你的密码不会改变。',
        },
        verify: {
            subject: '验证你的邮箱', title: (n) => `欢迎，${n}！`,
            body: '你的账号已创建。请验证邮箱地址以激活账号。',
            button: '验证邮箱', expires: '此链接 24 小时内有效。',
        },
        invite: {
            subject: (o) => `${o} 邀请你加入 Real Estate CRM`, title: '你收到了邀请！',
            body: (i, o, r) => `<strong>${i}</strong> 邀请你以<strong>${r}</strong>身份加入 <strong>${o}</strong>。`,
            instruction: '请点击下面的按钮接受邀请并设置你的账号：', button: '接受邀请', expires: '此邀请 7 天内有效。',
        },
        notification: {
            greeting: (n) => `${n}，你好！`, button: '在 CRM 中打开',
            footer: '你可以在 CRM 的“设置 → 通知”中管理邮件提醒。', subject: (t) => `[CRM] ${t}`,
        },
    },
    'zh-TW': {
        footerNote: '房產經紀 CRM · 紐約',
        reset: {
            subject: '重設你的密碼', title: '重設你的密碼',
            body: (n) => `${n}，你好！我們收到了重設密碼的請求。請點擊下面的按鈕，連結 1 小時內有效。`,
            button: '重設密碼', ignore: '如果這不是你本人的操作，請忽略這封郵件，你的密碼不會改變。',
        },
        verify: {
            subject: '驗證你的信箱', title: (n) => `歡迎，${n}！`,
            body: '你的帳號已建立。請驗證信箱地址以啟用帳號。',
            button: '驗證信箱', expires: '此連結 24 小時內有效。',
        },
        invite: {
            subject: (o) => `${o} 邀請你加入 Real Estate CRM`, title: '你收到了邀請！',
            body: (i, o, r) => `<strong>${i}</strong> 邀請你以<strong>${r}</strong>身分加入 <strong>${o}</strong>。`,
            instruction: '請點擊下面的按鈕接受邀請並設定你的帳號：', button: '接受邀請', expires: '此邀請 7 天內有效。',
        },
        notification: {
            greeting: (n) => `${n}，你好！`, button: '在 CRM 中開啟',
            footer: '你可以在 CRM 的「設定 → 通知」中管理郵件提醒。', subject: (t) => `[CRM] ${t}`,
        },
    },
    es: {
        footerNote: 'CRM para corredurías inmobiliarias · Nueva York',
        reset: {
            subject: 'Restablezca su contraseña', title: 'Restablezca su contraseña',
            body: (n) => `Hola ${n}, recibimos una solicitud para restablecer su contraseña. Haga clic en el botón de abajo. Este enlace vence en 1 hora.`,
            button: 'Restablecer contraseña', ignore: 'Si usted no lo solicitó, ignore este correo. Su contraseña no cambiará.',
        },
        verify: {
            subject: 'Verifique su correo electrónico', title: (n) => `¡Bienvenido/a, ${n}!`,
            body: 'Su cuenta fue creada. Verifique su correo electrónico para activarla.',
            button: 'Verificar correo', expires: 'Este enlace vence en 24 horas.',
        },
        invite: {
            subject: (o) => `${o} lo/la invitó a unirse a Real Estate CRM`, title: '¡Tiene una invitación!',
            body: (i, o, r) => `<strong>${i}</strong> lo/la invitó a unirse a <strong>${o}</strong> como <strong>${r}</strong>.`,
            instruction: 'Haga clic abajo para aceptar la invitación y configurar su cuenta:', button: 'Aceptar invitación', expires: 'Esta invitación vence en 7 días.',
        },
        notification: {
            greeting: (n) => `Hola ${n},`, button: 'Abrir en el CRM',
            footer: 'Puede administrar sus alertas por correo en Configuración → Notificaciones del CRM.', subject: (t) => `[CRM] ${t}`,
        },
    },
};

export function roleLabel(role: string, lang: Lang): string {
    return label(ROLE_LABEL, role, lang);
}
