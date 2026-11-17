import { Lang } from './messages';

// Text of the client activity history (GET /api/clients/:id/timeline) in the viewer's language.
// Enum values are never shown raw: each has a label per language, with a readable fallback.

type Table = Record<string, Record<Lang, string>>;

const CLIENT_TYPE: Table = {
    BUYER: { en: 'buyer', 'zh-CN': '买家', 'zh-TW': '買家', es: 'comprador' },
    SELLER: { en: 'seller', 'zh-CN': '卖家', 'zh-TW': '賣家', es: 'vendedor' },
    REFERRAL: { en: 'referral', 'zh-CN': '转介', 'zh-TW': '轉介', es: 'referido' },
    RENTER: { en: 'renter', 'zh-CN': '租客', 'zh-TW': '租客', es: 'inquilino' },
    INVESTOR: { en: 'investor', 'zh-CN': '投资者', 'zh-TW': '投資者', es: 'inversionista' },
};

const DEAL_STATUS: Table = {
    OFFER_REVIEW: { en: 'offer review', 'zh-CN': '报价审核', 'zh-TW': '報價審核', es: 'revisión de oferta' },
    IN_CONTRACT: { en: 'in contract', 'zh-CN': '合同中', 'zh-TW': '合約中', es: 'en contrato' },
    BOARD_PACKAGE: { en: 'board package', 'zh-CN': '董事会资料包', 'zh-TW': '董事會資料包', es: 'paquete para la junta' },
    CLEARED_TO_CLOSE: { en: 'cleared to close', 'zh-CN': '可以过户', 'zh-TW': '可以過戶', es: 'listo para cerrar' },
    CLOSED: { en: 'closed', 'zh-CN': '已成交', 'zh-TW': '已成交', es: 'cerrado' },
    FALLEN_THROUGH: { en: 'fallen through', 'zh-CN': '已告吹', 'zh-TW': '已告吹', es: 'cancelado' },
};

const OFFER_STATUS: Table = {
    PENDING: { en: 'pending', 'zh-CN': '待处理', 'zh-TW': '待處理', es: 'pendiente' },
    ACCEPTED: { en: 'accepted', 'zh-CN': '已接受', 'zh-TW': '已接受', es: 'aceptada' },
    REJECTED: { en: 'rejected', 'zh-CN': '已拒绝', 'zh-TW': '已拒絕', es: 'rechazada' },
    COUNTER: { en: 'countered', 'zh-CN': '已还价', 'zh-TW': '已還價', es: 'con contraoferta' },
    WITHDRAWN: { en: 'withdrawn', 'zh-CN': '已撤回', 'zh-TW': '已撤回', es: 'retirada' },
    EXPIRED: { en: 'expired', 'zh-CN': '已过期', 'zh-TW': '已過期', es: 'vencida' },
};

const APPT_TYPE: Table = {
    SHOWING: { en: 'Showing', 'zh-CN': '带看', 'zh-TW': '帶看', es: 'Visita' },
    MEETING: { en: 'Meeting', 'zh-CN': '会面', 'zh-TW': '會面', es: 'Reunión' },
    CALL: { en: 'Call', 'zh-CN': '电话', 'zh-TW': '電話', es: 'Llamada' },
    OPEN_HOUSE: { en: 'Open house', 'zh-CN': '开放参观', 'zh-TW': '開放參觀', es: 'Casa abierta' },
    INSPECTION: { en: 'Inspection', 'zh-CN': '验房', 'zh-TW': '驗屋', es: 'Inspección' },
    CLOSING: { en: 'Closing', 'zh-CN': '过户', 'zh-TW': '過戶', es: 'Cierre' },
    FOLLOW_UP: { en: 'Follow-up', 'zh-CN': '跟进', 'zh-TW': '跟進', es: 'Seguimiento' },
};

const APPT_STATUS: Table = {
    SCHEDULED: { en: 'scheduled', 'zh-CN': '已安排', 'zh-TW': '已安排', es: 'programada' },
    CONFIRMED: { en: 'confirmed', 'zh-CN': '已确认', 'zh-TW': '已確認', es: 'confirmada' },
    COMPLETED: { en: 'completed', 'zh-CN': '已完成', 'zh-TW': '已完成', es: 'completada' },
    CANCELLED: { en: 'cancelled', 'zh-CN': '已取消', 'zh-TW': '已取消', es: 'cancelada' },
    NO_SHOW: { en: 'no-show', 'zh-CN': '未到场', 'zh-TW': '未到場', es: 'no se presentó' },
    RESCHEDULED: { en: 'rescheduled', 'zh-CN': '已改期', 'zh-TW': '已改期', es: 'reprogramada' },
};

const TASK_STATUS: Table = {
    PENDING: { en: 'to do', 'zh-CN': '待办', 'zh-TW': '待辦', es: 'pendiente' },
    IN_PROGRESS: { en: 'in progress', 'zh-CN': '进行中', 'zh-TW': '進行中', es: 'en curso' },
    COMPLETED: { en: 'completed', 'zh-CN': '已完成', 'zh-TW': '已完成', es: 'completada' },
    CANCELLED: { en: 'cancelled', 'zh-CN': '已取消', 'zh-TW': '已取消', es: 'cancelada' },
};

const GIFT_STATUS: Table = {
    ORDERED: { en: 'ordered', 'zh-CN': '已下单', 'zh-TW': '已下單', es: 'pedido' },
    SHIPPED: { en: 'shipped', 'zh-CN': '已发货', 'zh-TW': '已出貨', es: 'enviado' },
    DELIVERED: { en: 'delivered', 'zh-CN': '已送达', 'zh-TW': '已送達', es: 'entregado' },
    CANCELLED: { en: 'cancelled', 'zh-CN': '已取消', 'zh-TW': '已取消', es: 'cancelado' },
};

const NOTE_TYPE: Table = {
    NOTE: { en: 'Note', 'zh-CN': '备注', 'zh-TW': '備註', es: 'Nota' },
    CALL: { en: 'Call', 'zh-CN': '电话', 'zh-TW': '電話', es: 'Llamada' },
    EMAIL: { en: 'Email', 'zh-CN': '邮件', 'zh-TW': '郵件', es: 'Correo' },
    MEETING: { en: 'Meeting', 'zh-CN': '会面', 'zh-TW': '會面', es: 'Reunión' },
    SHOWING: { en: 'Showing', 'zh-CN': '带看', 'zh-TW': '帶看', es: 'Visita' },
    SYSTEM: { en: 'System note', 'zh-CN': '系统记录', 'zh-TW': '系統記錄', es: 'Nota del sistema' },
};

// The kind of event, shown as a small tag next to its status
const EVENT_TYPE: Table = {
    NOTE: { en: 'Note', 'zh-CN': '备注', 'zh-TW': '備註', es: 'Nota' },
    OFFER: { en: 'Offer', 'zh-CN': '报价', 'zh-TW': '報價', es: 'Oferta' },
    APPOINTMENT: { en: 'Appointment', 'zh-CN': '日程', 'zh-TW': '行程', es: 'Cita' },
    GIFT: { en: 'Gift', 'zh-CN': '礼品', 'zh-TW': '禮品', es: 'Regalo' },
    TRANSACTION: { en: 'Deal', 'zh-CN': '交易', 'zh-TW': '交易', es: 'Operación' },
    TASK: { en: 'Task', 'zh-CN': '任务', 'zh-TW': '任務', es: 'Tarea' },
    MODIFICATION: { en: 'Record', 'zh-CN': '记录', 'zh-TW': '記錄', es: 'Registro' },
};

const label = (t: Table, key: string, lang: Lang) => t[key]?.[lang] ?? key.replace(/_/g, ' ').toLowerCase();
const LOCALES: Record<Lang, string> = { en: 'en-US', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', es: 'es-US' };
const day = (d: Date, lang: Lang) => d.toLocaleDateString(LOCALES[lang], { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
const usd = (n: number) => `$${n.toLocaleString('en-US')}`;

type Sentences = {
    note: (type: string, author: string) => string;
    offerFor: (address: string) => string;
    offerDesc: (amount: number, status: string) => string;
    at: (address: string) => string;
    gift: (item: string) => string;
    giftDesc: (status: string) => string;
    deal: (status: string) => string;
    property: (address: string) => string;
    task: (title: string) => string;
    due: (date: Date) => string;
    created: string;
    addedAs: (type: string, source: string | null) => string;
};

const S: Record<Lang, Sentences> = {
    en: {
        note: (t, a) => `${label(NOTE_TYPE, t, 'en')} logged by ${a}`,
        offerFor: (a) => `Offer for ${a}`,
        offerDesc: (n, s) => `${usd(n)} — ${label(OFFER_STATUS, s, 'en')}`,
        at: (a) => `At ${a}`,
        gift: (i) => `Gift: ${i}`,
        giftDesc: (s) => `Status: ${label(GIFT_STATUS, s, 'en')}`,
        deal: (s) => `Deal ${label(DEAL_STATUS, s, 'en')}`,
        property: (a) => `Property: ${a}`,
        task: (t) => `Task: ${t}`,
        due: (d) => `Due ${day(d, 'en')}`,
        created: 'Client record created',
        addedAs: (t, src) => `Added as ${label(CLIENT_TYPE, t, 'en')}${src ? ` via ${src}` : ''}`,
    },
    'zh-CN': {
        note: (t, a) => `${a} 记录了${label(NOTE_TYPE, t, 'zh-CN')}`,
        offerFor: (a) => `${a} 的报价`,
        offerDesc: (n, s) => `${usd(n)} — ${label(OFFER_STATUS, s, 'zh-CN')}`,
        at: (a) => `地点：${a}`,
        gift: (i) => `礼品：${i}`,
        giftDesc: (s) => `状态：${label(GIFT_STATUS, s, 'zh-CN')}`,
        deal: (s) => `交易：${label(DEAL_STATUS, s, 'zh-CN')}`,
        property: (a) => `房源：${a}`,
        task: (t) => `任务：${t}`,
        due: (d) => `截止 ${day(d, 'zh-CN')}`,
        created: '创建客户记录',
        addedAs: (t, src) => `添加为${label(CLIENT_TYPE, t, 'zh-CN')}${src ? `，来源：${src}` : ''}`,
    },
    'zh-TW': {
        note: (t, a) => `${a} 記錄了${label(NOTE_TYPE, t, 'zh-TW')}`,
        offerFor: (a) => `${a} 的報價`,
        offerDesc: (n, s) => `${usd(n)} — ${label(OFFER_STATUS, s, 'zh-TW')}`,
        at: (a) => `地點：${a}`,
        gift: (i) => `禮品：${i}`,
        giftDesc: (s) => `狀態：${label(GIFT_STATUS, s, 'zh-TW')}`,
        deal: (s) => `交易：${label(DEAL_STATUS, s, 'zh-TW')}`,
        property: (a) => `物件：${a}`,
        task: (t) => `任務：${t}`,
        due: (d) => `截止 ${day(d, 'zh-TW')}`,
        created: '建立客戶記錄',
        addedAs: (t, src) => `新增為${label(CLIENT_TYPE, t, 'zh-TW')}${src ? `，來源：${src}` : ''}`,
    },
    es: {
        note: (t, a) => `${label(NOTE_TYPE, t, 'es')} registrada por ${a}`,
        offerFor: (a) => `Oferta por ${a}`,
        offerDesc: (n, s) => `${usd(n)} — ${label(OFFER_STATUS, s, 'es')}`,
        at: (a) => `En ${a}`,
        gift: (i) => `Regalo: ${i}`,
        giftDesc: (s) => `Estado: ${label(GIFT_STATUS, s, 'es')}`,
        deal: (s) => `Operación: ${label(DEAL_STATUS, s, 'es')}`,
        property: (a) => `Propiedad: ${a}`,
        task: (t) => `Tarea: ${t}`,
        due: (d) => `Vence el ${day(d, 'es')}`,
        created: 'Ficha de cliente creada',
        addedAs: (t, src) => `Agregado como ${label(CLIENT_TYPE, t, 'es')}${src ? ` vía ${src}` : ''}`,
    },
};

export const timelineText = (lang: Lang) => S[lang];

// Labels for the type tag and status tag shown under an event
export function timelineLabels(lang: Lang, type: string, status?: string | null): { typeLabel: string; statusLabel?: string } {
    const typeLabel = label(EVENT_TYPE, type, lang);
    if (!status) return { typeLabel };
    const table = type === 'OFFER' ? OFFER_STATUS : type === 'APPOINTMENT' ? APPT_STATUS : type === 'TASK' ? TASK_STATUS
        : type === 'GIFT' ? GIFT_STATUS : type === 'TRANSACTION' ? DEAL_STATUS : {};
    return { typeLabel, statusLabel: label(table, status, lang) };
}

export const apptTypeLabel = (type: string, lang: Lang) => label(APPT_TYPE, type, lang);
