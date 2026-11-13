// Privacy policy and terms of service text, in all four UI languages.
// Kept apart from extra.ts because it is long-form copy, not UI strings.
import type { Language } from "./translations";

export type LegalDoc = { title: string; updated: string; intro: string; sections: { h: string; p: string[] }[] };
type LegalSet = { privacy: LegalDoc; terms: LegalDoc; back: string; privacyLink: string; termsLink: string };

const CONTACT = "support@apexzone.xyz";
const DATE = "2026-11-13";

const en: LegalSet = {
  back: "Back to home",
  privacyLink: "Privacy Policy",
  termsLink: "Terms of Service",
  privacy: {
    title: "Privacy Policy",
    updated: `Last updated: ${DATE}`,
    intro: "This policy explains what information Real Estate CRM (\"the service\", \"we\") collects, how we use it, and the choices you have. The service is a customer relationship management tool for real estate brokerages and agents.",
    sections: [
      { h: "1. Information we collect", p: [
        "Account information: your name, email address, password (stored only as a secure hash), role, language and time-zone preferences.",
        "Business data your brokerage enters: clients, properties, listings, appointments, transactions, documents, photos and notes. Your brokerage controls this data; we process it on its behalf.",
        "Technical information: sign-in times, IP address and browser type, used for security alerts, audit logs and preventing abuse.",
      ] },
      { h: "2. Sign in with Google", p: [
        "If you choose Sign in with Google, we receive from Google only your name, email address, whether Google has verified that email, and your Google account ID.",
        "We use this information solely to create your account or sign you in, and to link your Google account to an existing account with the same verified email. We do not request access to your Gmail, contacts, files or any other Google data.",
        "Our use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. You can unlink Google at any time in Settings → Security.",
      ] },
      { h: "3. How we use information", p: [
        "To provide and secure the service: signing you in, showing your brokerage's data to authorized team members, sending service emails (such as password resets and sign-in alerts), and keeping audit records.",
        "We do not sell personal information, and we do not use your data or your clients' data for advertising.",
      ] },
      { h: "4. Sharing and service providers", p: [
        "Data is visible only to members of your own brokerage, according to their roles. Public listing pages show only the listing details your brokerage chooses to publish.",
        "We use infrastructure providers to run the service, including hosting, database, file storage and content delivery (for example Render, Neon, Cloudflare and Vercel). They process data only to provide those services to us.",
        "We may disclose information if required by law or to protect the rights and safety of users.",
      ] },
      { h: "5. Security and retention", p: [
        "Connections are encrypted (HTTPS). Passwords are hashed, private documents are served through short-lived signed links, and two-step verification is available.",
        "We keep data while your brokerage's account is active. A brokerage administrator can export or delete its data; deleted data is removed from active systems within a reasonable period.",
      ] },
      { h: "6. Your choices and rights", p: [
        "You can view and update your profile, change your password, unlink Google, and ask your brokerage administrator to export or delete data. Depending on where you live, you may have rights to access, correct or delete your personal information; contact us to exercise them.",
      ] },
      { h: "7. Changes and contact", p: [
        "We may update this policy and will change the date above when we do.",
        `Questions: ${CONTACT}`,
      ] },
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: `Last updated: ${DATE}`,
    intro: "These terms govern your use of Real Estate CRM (\"the service\"). By creating an account or using the service, you agree to them.",
    sections: [
      { h: "1. Accounts", p: [
        "You must provide accurate information and keep your sign-in credentials secure. You are responsible for activity under your account.",
        "A brokerage administrator manages the brokerage's members, roles and subscription, and may deactivate member accounts.",
      ] },
      { h: "2. Your data", p: [
        "Your brokerage owns the data it enters. You grant us permission to store and process it only to provide the service. You are responsible for having the right to enter your clients' information and for complying with applicable real estate, privacy and anti-spam laws.",
      ] },
      { h: "3. Acceptable use", p: [
        "Do not use the service for unlawful purposes, to send unsolicited messages, to infringe others' rights, or to probe, disrupt or overload the service. Do not try to access another brokerage's data.",
      ] },
      { h: "4. Plans and payment", p: [
        "Some features require a paid plan. Prices are shown on the pricing page. Paid plans renew until cancelled; cancellation takes effect at the end of the current billing period.",
      ] },
      { h: "5. Availability and changes", p: [
        "We work to keep the service available but do not guarantee it will be uninterrupted or error-free. We may change or discontinue features, and will give reasonable notice of significant changes.",
      ] },
      { h: "6. Disclaimer and limitation of liability", p: [
        "The service is provided \"as is\". To the extent permitted by law, we are not liable for indirect or consequential damages, or for loss of data or profits. The service does not provide legal, financial or tax advice.",
      ] },
      { h: "7. Termination", p: [
        "You may stop using the service at any time. We may suspend accounts that violate these terms. A brokerage administrator can export its data before closing its account.",
      ] },
      { h: "8. Changes and contact", p: [
        "We may update these terms and will change the date above when we do. Continued use after an update means you accept it.",
        `Questions: ${CONTACT}`,
      ] },
    ],
  },
};

const zhCN: LegalSet = {
  back: "返回首页",
  privacyLink: "隐私政策",
  termsLink: "服务条款",
  privacy: {
    title: "隐私政策",
    updated: `最后更新：${DATE}`,
    intro: "本政策说明 Real Estate CRM（以下称“本服务”或“我们”）收集哪些信息、如何使用，以及你拥有的选择。本服务是面向房产经纪公司和经纪人的客户关系管理工具。",
    sections: [
      { h: "1. 我们收集的信息", p: [
        "账户信息：姓名、邮箱、密码（只保存安全哈希值）、角色、语言和时区偏好。",
        "经纪公司录入的业务数据：客户、房产、房源、预约、交易、文档、照片和备注。这些数据由你所在的经纪公司控制，我们代其处理。",
        "技术信息：登录时间、IP 地址和浏览器类型，用于安全提醒、审计日志和防止滥用。",
      ] },
      { h: "2. 使用 Google 登录", p: [
        "如果你选择用 Google 登录，我们只从 Google 获取你的姓名、邮箱、Google 是否已验证该邮箱，以及你的 Google 账号 ID。",
        "这些信息只用于创建账户或让你登录，以及把你的 Google 账号关联到邮箱相同且已验证的现有账户。我们不会请求访问你的 Gmail、联系人、文件或任何其他 Google 数据。",
        "我们对通过 Google API 获得的信息的使用，遵守《Google API 服务用户数据政策》，包括其中的“有限使用”要求。你可以随时在“设置 → 安全”中取消关联 Google。",
      ] },
      { h: "3. 我们如何使用信息", p: [
        "用于提供和保护本服务：让你登录、向经授权的团队成员展示经纪公司数据、发送服务邮件（如重置密码、登录提醒），以及保留审计记录。",
        "我们不出售个人信息，也不会把你或你客户的数据用于广告。",
      ] },
      { h: "4. 共享与服务提供商", p: [
        "数据只对你所在经纪公司的成员按角色可见。公开房源页面只显示经纪公司选择公开的房源信息。",
        "我们使用基础设施提供商来运行本服务，包括托管、数据库、文件存储和内容分发（例如 Render、Neon、Cloudflare 和 Vercel）。它们只为向我们提供这些服务而处理数据。",
        "在法律要求或为保护用户权利与安全时，我们可能披露信息。",
      ] },
      { h: "5. 安全与保存期限", p: [
        "所有连接都经过加密（HTTPS）。密码经过哈希处理，私密文档通过短时有效的签名链接提供，并支持两步验证。",
        "经纪公司账户有效期间我们会保存数据。经纪公司管理员可以导出或删除其数据；删除的数据会在合理期限内从在用系统中移除。",
      ] },
      { h: "6. 你的选择和权利", p: [
        "你可以查看和更新个人资料、修改密码、取消关联 Google，并可请经纪公司管理员导出或删除数据。根据你所在地区的法律，你可能有权访问、更正或删除个人信息；如需行使这些权利，请联系我们。",
      ] },
      { h: "7. 变更与联系方式", p: [
        "我们可能更新本政策，并会同时修改上方的日期。",
        `如有疑问：${CONTACT}`,
      ] },
    ],
  },
  terms: {
    title: "服务条款",
    updated: `最后更新：${DATE}`,
    intro: "本条款约束你对 Real Estate CRM（以下称“本服务”）的使用。创建账户或使用本服务，即表示你同意本条款。",
    sections: [
      { h: "1. 账户", p: [
        "你必须提供真实信息并妥善保管登录凭据，并对你账户下的活动负责。",
        "经纪公司管理员负责管理公司的成员、角色和订阅，并可以停用成员账户。",
      ] },
      { h: "2. 你的数据", p: [
        "经纪公司拥有其录入的数据。你授权我们仅为提供本服务而存储和处理这些数据。你应确保有权录入客户信息，并遵守适用的房地产、隐私和反垃圾信息法律。",
      ] },
      { h: "3. 可接受的使用", p: [
        "不得将本服务用于违法目的、发送未经请求的信息、侵犯他人权利，或探测、干扰、超负荷使用本服务。不得试图访问其他经纪公司的数据。",
      ] },
      { h: "4. 套餐与付款", p: [
        "部分功能需要付费套餐，价格以定价页面为准。付费套餐会自动续订直到取消；取消在当前计费周期结束时生效。",
      ] },
      { h: "5. 可用性与变更", p: [
        "我们努力保持服务可用，但不保证服务不中断或没有错误。我们可能修改或停止某些功能，重大变更会提前合理通知。",
      ] },
      { h: "6. 免责声明与责任限制", p: [
        "本服务按“现状”提供。在法律允许的范围内，我们不对间接或后果性损失、数据或利润损失承担责任。本服务不提供法律、财务或税务建议。",
      ] },
      { h: "7. 终止", p: [
        "你可以随时停止使用本服务。对于违反本条款的账户，我们可以暂停其使用。经纪公司管理员可以在关闭账户前导出数据。",
      ] },
      { h: "8. 变更与联系方式", p: [
        "我们可能更新本条款，并会同时修改上方的日期。更新后继续使用即表示你接受更新内容。",
        `如有疑问：${CONTACT}`,
      ] },
    ],
  },
};

const zhTW: LegalSet = {
  back: "返回首頁",
  privacyLink: "隱私權政策",
  termsLink: "服務條款",
  privacy: {
    title: "隱私權政策",
    updated: `最後更新：${DATE}`,
    intro: "本政策說明 Real Estate CRM（以下稱「本服務」或「我們」）收集哪些資訊、如何使用，以及您擁有的選擇。本服務是供房產經紀公司和經紀人使用的客戶關係管理工具。",
    sections: [
      { h: "1. 我們收集的資訊", p: [
        "帳戶資訊：姓名、電子郵件、密碼（只保存安全雜湊值）、角色、語言和時區偏好。",
        "經紀公司輸入的業務資料：客戶、房產、房源、預約、交易、文件、照片和備註。這些資料由您所屬的經紀公司控制，我們代其處理。",
        "技術資訊：登入時間、IP 位址和瀏覽器類型，用於安全提醒、稽核紀錄和防止濫用。",
      ] },
      { h: "2. 使用 Google 登入", p: [
        "若您選擇使用 Google 登入，我們只從 Google 取得您的姓名、電子郵件、Google 是否已驗證該電子郵件，以及您的 Google 帳號 ID。",
        "這些資訊只用於建立帳戶或讓您登入，以及將您的 Google 帳號連結到電子郵件相同且已驗證的現有帳戶。我們不會要求存取您的 Gmail、聯絡人、檔案或任何其他 Google 資料。",
        "我們對透過 Google API 取得之資訊的使用，遵守《Google API 服務使用者資料政策》，包括其中的「有限使用」規定。您可以隨時在「設定 → 安全」中取消連結 Google。",
      ] },
      { h: "3. 我們如何使用資訊", p: [
        "用於提供和保護本服務：讓您登入、向經授權的團隊成員顯示經紀公司資料、寄送服務郵件（如重設密碼、登入提醒），以及保留稽核紀錄。",
        "我們不出售個人資訊，也不會將您或您客戶的資料用於廣告。",
      ] },
      { h: "4. 分享與服務供應商", p: [
        "資料只對您所屬經紀公司的成員依角色可見。公開房源頁面只顯示經紀公司選擇公開的房源資訊。",
        "我們使用基礎設施供應商來運行本服務，包括主機、資料庫、檔案儲存和內容傳遞（例如 Render、Neon、Cloudflare 和 Vercel）。它們只為向我們提供這些服務而處理資料。",
        "在法律要求或為保護使用者權利與安全時，我們可能揭露資訊。",
      ] },
      { h: "5. 安全與保存期間", p: [
        "所有連線皆經加密（HTTPS）。密碼經雜湊處理，私密文件透過短時效的簽名連結提供，並支援兩步驟驗證。",
        "經紀公司帳戶有效期間我們會保存資料。經紀公司管理員可以匯出或刪除其資料；刪除的資料會在合理期間內從使用中的系統移除。",
      ] },
      { h: "6. 您的選擇和權利", p: [
        "您可以查看和更新個人資料、變更密碼、取消連結 Google，並可請經紀公司管理員匯出或刪除資料。依您所在地區的法律，您可能有權存取、更正或刪除個人資訊；如需行使這些權利，請與我們聯絡。",
      ] },
      { h: "7. 變更與聯絡方式", p: [
        "我們可能更新本政策，並會同時修改上方的日期。",
        `如有疑問：${CONTACT}`,
      ] },
    ],
  },
  terms: {
    title: "服務條款",
    updated: `最後更新：${DATE}`,
    intro: "本條款規範您對 Real Estate CRM（以下稱「本服務」）的使用。建立帳戶或使用本服務，即表示您同意本條款。",
    sections: [
      { h: "1. 帳戶", p: [
        "您必須提供真實資訊並妥善保管登入憑證，並對您帳戶下的活動負責。",
        "經紀公司管理員負責管理公司的成員、角色和訂閱，並可以停用成員帳戶。",
      ] },
      { h: "2. 您的資料", p: [
        "經紀公司擁有其輸入的資料。您授權我們僅為提供本服務而儲存和處理這些資料。您應確保有權輸入客戶資訊，並遵守適用的房地產、隱私和反垃圾訊息法律。",
      ] },
      { h: "3. 可接受的使用", p: [
        "不得將本服務用於違法目的、寄送未經請求的訊息、侵害他人權利，或探測、干擾、超載本服務。不得試圖存取其他經紀公司的資料。",
      ] },
      { h: "4. 方案與付款", p: [
        "部分功能需要付費方案，價格以定價頁面為準。付費方案會自動續訂直到取消；取消於當期計費週期結束時生效。",
      ] },
      { h: "5. 可用性與變更", p: [
        "我們努力維持服務可用，但不保證服務不中斷或沒有錯誤。我們可能修改或停止某些功能，重大變更會事先合理通知。",
      ] },
      { h: "6. 免責聲明與責任限制", p: [
        "本服務依「現狀」提供。在法律允許的範圍內，我們不對間接或衍生性損失、資料或利潤損失負責。本服務不提供法律、財務或稅務建議。",
      ] },
      { h: "7. 終止", p: [
        "您可以隨時停止使用本服務。對於違反本條款的帳戶，我們可以暫停其使用。經紀公司管理員可以在關閉帳戶前匯出資料。",
      ] },
      { h: "8. 變更與聯絡方式", p: [
        "我們可能更新本條款，並會同時修改上方的日期。更新後繼續使用即表示您接受更新內容。",
        `如有疑問：${CONTACT}`,
      ] },
    ],
  },
};

const es: LegalSet = {
  back: "Volver al inicio",
  privacyLink: "Política de privacidad",
  termsLink: "Términos del servicio",
  privacy: {
    title: "Política de privacidad",
    updated: `Última actualización: ${DATE}`,
    intro: "Esta política explica qué información recopila Real Estate CRM (\"el servicio\", \"nosotros\"), cómo la usamos y qué opciones tiene usted. El servicio es una herramienta de gestión de clientes para agencias y agentes inmobiliarios.",
    sections: [
      { h: "1. Información que recopilamos", p: [
        "Información de la cuenta: nombre, correo electrónico, contraseña (guardada solo como hash seguro), rol y preferencias de idioma y zona horaria.",
        "Datos que introduce su agencia: clientes, propiedades, anuncios, citas, transacciones, documentos, fotos y notas. Su agencia controla estos datos; nosotros los tratamos en su nombre.",
        "Información técnica: horas de inicio de sesión, dirección IP y tipo de navegador, usados para alertas de seguridad, registros de auditoría y prevención de abusos.",
      ] },
      { h: "2. Iniciar sesión con Google", p: [
        "Si elige iniciar sesión con Google, recibimos de Google solo su nombre, su correo electrónico, si Google ha verificado ese correo y el ID de su cuenta de Google.",
        "Usamos esta información únicamente para crear su cuenta o iniciar su sesión, y para vincular su cuenta de Google a una cuenta existente con el mismo correo verificado. No solicitamos acceso a su Gmail, contactos, archivos ni a ningún otro dato de Google.",
        "El uso que hacemos de la información recibida de las API de Google cumple la Política de datos de usuario de los servicios de API de Google, incluidos los requisitos de Uso limitado. Puede desvincular Google en cualquier momento en Configuración → Seguridad.",
      ] },
      { h: "3. Cómo usamos la información", p: [
        "Para prestar y proteger el servicio: iniciar su sesión, mostrar los datos de su agencia a los miembros autorizados, enviar correos del servicio (como restablecer la contraseña o alertas de inicio de sesión) y conservar registros de auditoría.",
        "No vendemos información personal ni usamos sus datos o los de sus clientes con fines publicitarios.",
      ] },
      { h: "4. Divulgación y proveedores", p: [
        "Los datos solo son visibles para los miembros de su propia agencia, según su rol. Las páginas públicas de anuncios muestran solo los datos que su agencia decide publicar.",
        "Usamos proveedores de infraestructura para operar el servicio, incluidos alojamiento, base de datos, almacenamiento de archivos y distribución de contenido (por ejemplo Render, Neon, Cloudflare y Vercel). Solo tratan los datos para prestarnos esos servicios.",
        "Podemos divulgar información si la ley lo exige o para proteger los derechos y la seguridad de los usuarios.",
      ] },
      { h: "5. Seguridad y conservación", p: [
        "Las conexiones están cifradas (HTTPS). Las contraseñas se guardan con hash, los documentos privados se sirven mediante enlaces firmados de corta duración y hay verificación en dos pasos.",
        "Conservamos los datos mientras la cuenta de su agencia esté activa. Un administrador de la agencia puede exportar o eliminar sus datos; los datos eliminados se retiran de los sistemas activos en un plazo razonable.",
      ] },
      { h: "6. Sus opciones y derechos", p: [
        "Puede ver y actualizar su perfil, cambiar su contraseña, desvincular Google y pedir al administrador de su agencia que exporte o elimine datos. Según dónde viva, puede tener derecho a acceder, corregir o eliminar su información personal; contáctenos para ejercerlo.",
      ] },
      { h: "7. Cambios y contacto", p: [
        "Podemos actualizar esta política y cambiaremos la fecha indicada arriba cuando lo hagamos.",
        `Preguntas: ${CONTACT}`,
      ] },
    ],
  },
  terms: {
    title: "Términos del servicio",
    updated: `Última actualización: ${DATE}`,
    intro: "Estos términos rigen el uso de Real Estate CRM (\"el servicio\"). Al crear una cuenta o usar el servicio, usted los acepta.",
    sections: [
      { h: "1. Cuentas", p: [
        "Debe proporcionar información veraz y mantener seguras sus credenciales. Usted es responsable de la actividad de su cuenta.",
        "El administrador de la agencia gestiona los miembros, roles y la suscripción de la agencia, y puede desactivar cuentas de miembros.",
      ] },
      { h: "2. Sus datos", p: [
        "Su agencia es propietaria de los datos que introduce. Nos autoriza a almacenarlos y tratarlos solo para prestar el servicio. Usted es responsable de tener derecho a introducir la información de sus clientes y de cumplir las leyes inmobiliarias, de privacidad y contra el correo no deseado aplicables.",
      ] },
      { h: "3. Uso aceptable", p: [
        "No use el servicio con fines ilícitos, para enviar mensajes no solicitados, para infringir derechos de terceros ni para sondear, interrumpir o sobrecargar el servicio. No intente acceder a los datos de otra agencia.",
      ] },
      { h: "4. Planes y pago", p: [
        "Algunas funciones requieren un plan de pago. Los precios figuran en la página de precios. Los planes de pago se renuevan hasta que se cancelan; la cancelación surte efecto al final del periodo de facturación en curso.",
      ] },
      { h: "5. Disponibilidad y cambios", p: [
        "Procuramos mantener el servicio disponible, pero no garantizamos que funcione sin interrupciones ni errores. Podemos cambiar o retirar funciones y avisaremos con antelación razonable de los cambios importantes.",
      ] },
      { h: "6. Exención y limitación de responsabilidad", p: [
        "El servicio se ofrece \"tal cual\". En la medida permitida por la ley, no respondemos de daños indirectos o consecuentes ni de la pérdida de datos o beneficios. El servicio no ofrece asesoramiento legal, financiero ni fiscal.",
      ] },
      { h: "7. Terminación", p: [
        "Puede dejar de usar el servicio en cualquier momento. Podemos suspender cuentas que incumplan estos términos. El administrador de la agencia puede exportar sus datos antes de cerrar la cuenta.",
      ] },
      { h: "8. Cambios y contacto", p: [
        "Podemos actualizar estos términos y cambiaremos la fecha indicada arriba cuando lo hagamos. Seguir usando el servicio tras una actualización implica su aceptación.",
        `Preguntas: ${CONTACT}`,
      ] },
    ],
  },
};

export const LEGAL: Record<Language, LegalSet> = { en, "zh-CN": zhCN, "zh-TW": zhTW, es };
