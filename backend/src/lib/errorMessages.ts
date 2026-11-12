import { Request } from 'express';
import { Lang, isLang } from './messages';

/*
 * Translations of the API's user-facing error messages. Routes keep writing English;
 * the localizeErrors middleware swaps `error` for the caller's language just before sending.
 * Developer-facing messages (DEV_ONLY) intentionally stay English.
 * The smoke test fails if a route adds a fixed message that is in neither list.
 */

type T3 = [string, string, string]; // zh-CN, zh-TW, es

export const ERROR_TEXT: Record<string, T3> = {
    "A valid date is required": ["请填写有效的日期", "請填寫有效的日期", "Se requiere una fecha válida"],
    "A valid http(s) link is required": ["请填写有效的 http(s) 链接", "請填寫有效的 http(s) 連結", "Se requiere un enlace http(s) válido"],
    "A valid offer amount is required": ["请填写有效的报价金额", "請填寫有效的出價金額", "Se requiere un monto de oferta válido"],
    "A valid price is required": ["请填写有效的价格", "請填寫有效的價格", "Se requiere un precio válido"],
    "A valid role is required": ["请选择有效的角色", "請選擇有效的角色", "Se requiere un rol válido"],
    "Access from this network isn't allowed by your brokerage. Contact your administrator.": ["你的经纪公司不允许从这个网络访问，请联系管理员。", "你的經紀公司不允許從這個網路存取，請聯絡管理員。", "Su correduría no permite el acceso desde esta red. Comuníquese con su administrador."],
    "Add a subject or some notes": ["请填写主题或备注", "請填寫主旨或備註", "Agregue un asunto o algunas notas"],
    "Agent not found": ["找不到该经纪人", "找不到該經紀人", "No se encontró el agente"],
    "An account with this email already exists. Please log in with your password and link Google from account settings.": ["这个邮箱已经注册过账号。请用密码登录，再在账号设置里关联 Google。", "這個信箱已經註冊過帳號。請用密碼登入，再在帳號設定裡連結 Google。", "Ya existe una cuenta con este correo. Inicie sesión con su contraseña y vincule Google desde la configuración de la cuenta."],
    "An account with this email already exists. Please log in.": ["这个邮箱已经注册过账号，请直接登录。", "這個信箱已經註冊過帳號，請直接登入。", "Ya existe una cuenta con este correo. Inicie sesión."],
    "Apple sign-in is not available yet.": ["Apple 登录暂未开放。", "Apple 登入尚未開放。", "El inicio de sesión con Apple aún no está disponible."],
    "Appointment not found": ["找不到该预约", "找不到該預約", "No se encontró la cita"],
    "Assigned agent not found": ["找不到指定的经纪人", "找不到指定的經紀人", "No se encontró el agente asignado"],
    "Authentication required": ["请先登录", "請先登入", "Debe iniciar sesión"],
    "Beds and baths are required": ["请填写卧室和浴室数量", "請填寫臥室和浴室數量", "Se requieren dormitorios y baños"],
    "Brokerage not found": ["找不到该经纪公司", "找不到該經紀公司", "No se encontró la correduría"],
    "Brokerage not specified": ["没有指定经纪公司", "沒有指定經紀公司", "No se especificó la correduría"],
    "Cannot deactivate superadmin": ["不能停用超级管理员", "不能停用超級管理員", "No se puede desactivar al superadministrador"],
    "Cannot deactivate your own account": ["不能停用自己的账号", "不能停用自己的帳號", "No puede desactivar su propia cuenta"],
    "Checkout failed. Please try again or contact support.": ["结账失败，请重试或联系客服。", "結帳失敗，請重試或聯絡客服。", "El pago falló. Inténtelo de nuevo o contacte a soporte."],
    "Choose a client": ["请选择客户", "請選擇客戶", "Elija un cliente"],
    "Choose an agent to refer to": ["请选择要转介的经纪人", "請選擇要轉介的經紀人", "Elija un agente al que referir"],
    "Client not found": ["找不到该客户", "找不到該客戶", "No se encontró el cliente"],
    "Client not found or access denied": ["找不到该客户，或你没有权限", "找不到該客戶，或你沒有權限", "No se encontró el cliente o no tiene acceso"],
    "Closed deals with commissions cannot be deleted. Mark it as fallen through instead.": ["已成交且有佣金的交易不能删除，请改为标记“交易失败”。", "已成交且有佣金的交易不能刪除，請改為標記「交易失敗」。", "Las operaciones cerradas con comisiones no se pueden eliminar. Márquela como caída."],
    "Co-agent not found": ["找不到该合作经纪人", "找不到該合作經紀人", "No se encontró el coagente"],
    "Co-agent share must be between 0 and 100": ["合作经纪人分成必须在 0 到 100 之间", "合作經紀人分成必須在 0 到 100 之間", "La participación del coagente debe estar entre 0 y 100"],
    "Commission is already paid": ["这笔佣金已经发放", "這筆佣金已經發放", "La comisión ya fue pagada"],
    "Commission not found": ["找不到该佣金", "找不到該佣金", "No se encontró la comisión"],
    "Commission not found or unauthorized": ["找不到该佣金，或你没有权限", "找不到該佣金，或你沒有權限", "No se encontró la comisión o no tiene permiso"],
    "Commission rate must be between 0 and 100": ["佣金比例必须在 0 到 100 之间", "佣金比例必須在 0 到 100 之間", "La tasa de comisión debe estar entre 0 y 100"],
    "Company name cannot be empty": ["公司名称不能为空", "公司名稱不能為空", "El nombre de la empresa no puede estar vacío"],
    "Could not read the CSV file. Expected columns: Name, Email, Role": ["无法读取 CSV 文件。需要的列：Name、Email、Role", "無法讀取 CSV 檔案。需要的欄位：Name、Email、Role", "No se pudo leer el archivo CSV. Columnas esperadas: Name, Email, Role"],
    "Counter amount is required": ["请填写还价金额", "請填寫還價金額", "Se requiere el monto de la contraoferta"],
    "Custom Tone of Voice requires an ELITE subscription.": ["自定义语气需要 ELITE 套餐。", "自訂語氣需要 ELITE 方案。", "El tono de voz personalizado requiere una suscripción ELITE."],
    "Days must be a whole number between -365 and 365": ["天数必须是 -365 到 365 之间的整数", "天數必須是 -365 到 365 之間的整數", "Los días deben ser un número entero entre -365 y 365"],
    "Document name is required": ["请填写文档名称", "請填寫文件名稱", "Se requiere el nombre del documento"],
    "Document not found": ["找不到该文档", "找不到該文件", "No se encontró el documento"],
    "Each item is due relative to the contract date or the closing date": ["每一项都要相对签约日或过户日设定到期时间", "每一項都要相對簽約日或過戶日設定到期時間", "Cada elemento vence en relación con la fecha del contrato o del cierre"],
    "Email already in use": ["这个邮箱已被使用", "這個信箱已被使用", "El correo ya está en uso"],
    "Email and password are required": ["请填写邮箱和密码", "請填寫信箱和密碼", "Se requieren el correo y la contraseña"],
    "Email is required": ["请填写邮箱", "請填寫信箱", "Se requiere el correo"],
    "Every item needs a title": ["每一项都需要标题", "每一項都需要標題", "Cada elemento necesita un título"],
    "Failed to approve payout": ["批准放款失败", "核准撥款失敗", "No se pudo aprobar el pago"],
    "Failed to create property": ["创建房源失败", "建立房源失敗", "No se pudo crear la propiedad"],
    "Failed to create task": ["创建任务失败", "建立任務失敗", "No se pudo crear la tarea"],
    "Failed to deactivate user": ["停用用户失败", "停用使用者失敗", "No se pudo desactivar al usuario"],
    "Failed to delete property": ["删除房源失败", "刪除房源失敗", "No se pudo eliminar la propiedad"],
    "Failed to delete task": ["删除任务失败", "刪除任務失敗", "No se pudo eliminar la tarea"],
    "Failed to export audit log": ["导出审计日志失败", "匯出稽核日誌失敗", "No se pudo exportar el registro de auditoría"],
    "Failed to export organization data": ["导出公司数据失败", "匯出公司資料失敗", "No se pudieron exportar los datos de la organización"],
    "Failed to export users": ["导出用户失败", "匯出使用者失敗", "No se pudieron exportar los usuarios"],
    "Failed to fetch commissions": ["加载佣金失败", "載入佣金失敗", "No se pudieron cargar las comisiones"],
    "Failed to fetch finance metrics": ["加载财务数据失败", "載入財務資料失敗", "No se pudieron cargar las métricas financieras"],
    "Failed to fetch notifications": ["加载通知失败", "載入通知失敗", "No se pudieron cargar las notificaciones"],
    "Failed to fetch payout requests": ["加载放款申请失败", "載入撥款申請失敗", "No se pudieron cargar las solicitudes de pago"],
    "Failed to fetch projections": ["加载收益预测失败", "載入收益預測失敗", "No se pudieron cargar las proyecciones"],
    "Failed to fetch properties": ["加载房源失败", "載入房源失敗", "No se pudieron cargar las propiedades"],
    "Failed to fetch property": ["加载房源失败", "載入房源失敗", "No se pudo cargar la propiedad"],
    "Failed to fetch tasks": ["加载任务失败", "載入任務失敗", "No se pudieron cargar las tareas"],
    "Failed to fetch users": ["加载用户失败", "載入使用者失敗", "No se pudieron cargar los usuarios"],
    "Failed to generate content": ["生成内容失败", "產生內容失敗", "No se pudo generar el contenido"],
    "Failed to import properties": ["导入房源失败", "匯入房源失敗", "No se pudieron importar las propiedades"],
    "Failed to load brokerage policies": ["加载公司策略失败", "載入公司政策失敗", "No se pudieron cargar las políticas de la correduría"],
    "Failed to load organization": ["加载公司信息失败", "載入公司資訊失敗", "No se pudo cargar la organización"],
    "Failed to load preferences": ["加载偏好设置失败", "載入偏好設定失敗", "No se pudieron cargar las preferencias"],
    "Failed to load profile": ["加载个人资料失败", "載入個人資料失敗", "No se pudo cargar el perfil"],
    "Failed to load security settings": ["加载安全设置失败", "載入安全設定失敗", "No se pudo cargar la configuración de seguridad"],
    "Failed to mark all read": ["全部标为已读失败", "全部標為已讀失敗", "No se pudo marcar todo como leído"],
    "Failed to mark notification read": ["标为已读失败", "標為已讀失敗", "No se pudo marcar la notificación como leída"],
    "Failed to open the billing portal. Please try again.": ["无法打开账单页面，请重试。", "無法開啟帳單頁面，請重試。", "No se pudo abrir el portal de facturación. Inténtelo de nuevo."],
    "Failed to reactivate user": ["恢复用户失败", "恢復使用者失敗", "No se pudo reactivar al usuario"],
    "Failed to reject payout": ["退回放款失败", "退回撥款失敗", "No se pudo rechazar el pago"],
    "Failed to request payout": ["申请放款失败", "申請撥款失敗", "No se pudo solicitar el pago"],
    "Failed to send invitation": ["发送邀请失败", "傳送邀請失敗", "No se pudo enviar la invitación"],
    "Failed to update brokerage policies": ["保存公司策略失败", "儲存公司政策失敗", "No se pudieron actualizar las políticas de la correduría"],
    "Failed to update organization": ["保存公司信息失败", "儲存公司資訊失敗", "No se pudo actualizar la organización"],
    "Failed to update preferences": ["保存偏好设置失败", "儲存偏好設定失敗", "No se pudieron actualizar las preferencias"],
    "Failed to update profile": ["保存个人资料失败", "儲存個人資料失敗", "No se pudo actualizar el perfil"],
    "Failed to update property": ["保存房源失败", "儲存房源失敗", "No se pudo actualizar la propiedad"],
    "Failed to update security settings": ["保存安全设置失败", "儲存安全設定失敗", "No se pudo actualizar la configuración de seguridad"],
    "Failed to update task": ["保存任务失败", "儲存任務失敗", "No se pudo actualizar la tarea"],
    "Failed to update user": ["保存用户失败", "儲存使用者失敗", "No se pudo actualizar al usuario"],
    "Failed to update user role": ["修改用户角色失败", "修改使用者角色失敗", "No se pudo actualizar el rol del usuario"],
    "File is too large (maximum 20 MB)": ["文件太大（最大 20 MB）", "檔案太大（最大 20 MB）", "El archivo es demasiado grande (máximo 20 MB)"],
    "File not found": ["找不到该文件", "找不到該檔案", "No se encontró el archivo"],
    "First name cannot be empty": ["名字不能为空", "名字不能為空", "El nombre no puede estar vacío"],
    "First name is required": ["请填写名字", "請填寫名字", "Se requiere el nombre"],
    "Forbidden": ["没有权限", "沒有權限", "Acceso denegado"],
    "Forbidden: Admins only": ["没有权限：仅限管理员", "沒有權限：僅限管理員", "Acceso denegado: solo administradores"],
    "Gift item is required": ["请选择礼品", "請選擇禮品", "Se requiere el artículo de regalo"],
    "Gift order not found": ["找不到该礼品订单", "找不到該禮品訂單", "No se encontró el pedido de regalo"],
    "Google ID token is required": ["缺少 Google 身份令牌", "缺少 Google 身分權杖", "Se requiere el token de Google"],
    "Google sign-in is not available yet.": ["Google 登录暂未开放。", "Google 登入尚未開放。", "El inicio de sesión con Google aún no está disponible."],
    "Image is too large (maximum 15 MB)": ["图片太大（最大 15 MB）", "圖片太大（最大 15 MB）", "La imagen es demasiado grande (máximo 15 MB)"],
    "Insufficient permissions": ["权限不足", "權限不足", "Permisos insuficientes"],
    "Insufficient permissions to assign this role": ["你没有权限分配这个角色", "你沒有權限指派這個角色", "No tiene permiso para asignar este rol"],
    "Insufficient permissions to invite this role": ["你没有权限邀请这个角色", "你沒有權限邀請這個角色", "No tiene permiso para invitar a este rol"],
    "Internal server error": ["服务器出错了，请稍后重试", "伺服器發生錯誤，請稍後重試", "Error interno del servidor. Inténtelo más tarde."],
    "Invalid Google token": ["Google 身份令牌无效", "Google 身分權杖無效", "Token de Google no válido"],
    "Invalid credentials": ["邮箱或密码不正确", "信箱或密碼不正確", "Correo o contraseña incorrectos"],
    "Invalid email address": ["邮箱地址无效", "信箱地址無效", "Dirección de correo no válida"],
    "Invalid invite link. Please ask your admin to send a new invitation.": ["邀请链接无效，请让管理员重新发送邀请。", "邀請連結無效，請讓管理員重新傳送邀請。", "El enlace de invitación no es válido. Pida a su administrador una nueva invitación."],
    "Invalid or expired document link": ["文档链接无效或已过期", "文件連結無效或已過期", "El enlace del documento no es válido o venció"],
    "Invalid or expired reset token": ["重置链接无效或已过期", "重設連結無效或已過期", "El enlace de restablecimiento no es válido o venció"],
    "Invalid or expired token": ["登录已失效，请重新登录", "登入已失效，請重新登入", "Sesión no válida o vencida. Inicie sesión de nuevo."],
    "Invalid plan ID": ["套餐无效", "方案無效", "Plan no válido"],
    "Invalid priority": ["优先级无效", "優先順序無效", "Prioridad no válida"],
    "Invalid status": ["状态无效", "狀態無效", "Estado no válido"],
    "Invalid verification token": ["验证链接无效", "驗證連結無效", "Enlace de verificación no válido"],
    "Listing not found": ["找不到该房源", "找不到該房源", "No se encontró la propiedad"],
    "Maximum 500 rows per import batch": ["每次最多导入 500 行", "每次最多匯入 500 列", "Máximo 500 filas por importación"],
    "Media not found": ["找不到该素材", "找不到該素材", "No se encontró el archivo multimedia"],
    "Minimum password length must be between 8 and 32": ["最短密码长度必须在 8 到 32 之间", "最短密碼長度必須在 8 到 32 之間", "La longitud mínima de la contraseña debe estar entre 8 y 32"],
    "Name cannot be empty": ["姓名不能为空", "姓名不能為空", "El nombre no puede estar vacío"],
    "Name, email, and password are required": ["请填写姓名、邮箱和密码", "請填寫姓名、信箱和密碼", "Se requieren nombre, correo y contraseña"],
    "Name, email, password, and invite token are required": ["请填写姓名、邮箱、密码，并使用邀请链接", "請填寫姓名、信箱、密碼，並使用邀請連結", "Se requieren nombre, correo, contraseña y la invitación"],
    "No file provided": ["没有选择文件", "沒有選擇檔案", "No se proporcionó ningún archivo"],
    "No rows provided": ["没有可导入的数据行", "沒有可匯入的資料列", "No hay filas para importar"],
    "Not found": ["找不到", "找不到", "No encontrado"],
    "Note content is required": ["请填写备注内容", "請填寫備註內容", "Se requiere el contenido de la nota"],
    "Nothing to update": ["没有需要保存的修改", "沒有需要儲存的修改", "No hay nada que actualizar"],
    "Offer not found": ["找不到该报价", "找不到該出價", "No se encontró la oferta"],
    "Only a platform administrator can assign SUPERADMIN": ["只有平台管理员可以分配超级管理员", "只有平台管理員可以指派超級管理員", "Solo un administrador de la plataforma puede asignar SUPERADMIN"],
    "Only an administrator can do this": ["只有管理员可以执行此操作", "只有管理員可以執行此操作", "Solo un administrador puede hacer esto"],
    "Only management can mark referrals paid": ["只有管理层可以把转介标记为已付", "只有管理層可以把轉介標記為已付", "Solo la gerencia puede marcar referidos como pagados"],
    "Only managers can assign clients to other agents": ["只有经理可以把客户分配给其他经纪人", "只有經理可以把客戶指派給其他經紀人", "Solo los gerentes pueden asignar clientes a otros agentes"],
    "Only managers can reassign clients": ["只有经理可以重新分配客户", "只有經理可以重新指派客戶", "Solo los gerentes pueden reasignar clientes"],
    "Only your Firm Admin can manage the subscription. Please contact them to upgrade.": ["只有公司管理员可以管理订阅，请联系他们升级。", "只有公司管理員可以管理訂閱，請聯絡他們升級。", "Solo el administrador de la firma puede gestionar la suscripción. Contáctelo para actualizar."],
    "Organization / firm name is required": ["请填写公司名称", "請填寫公司名稱", "Se requiere el nombre de la firma"],
    "Organization not found": ["找不到该公司", "找不到該公司", "No se encontró la organización"],
    "Password expiry must be 0 (never) or between 30 and 365 days": ["密码有效期必须是 0（永不过期）或 30 到 365 天", "密碼有效期必須是 0（永不過期）或 30 到 365 天", "El vencimiento de la contraseña debe ser 0 (nunca) o entre 30 y 365 días"],
    "Password must be at least 8 characters": ["密码至少需要 8 个字符", "密碼至少需要 8 個字元", "La contraseña debe tener al menos 8 caracteres"],
    "Password must include at least one special character": ["密码至少需要包含一个特殊字符", "密碼至少需要包含一個特殊字元", "La contraseña debe incluir al menos un carácter especial"],
    "Payment service not configured": ["支付服务尚未配置", "付款服務尚未設定", "El servicio de pago no está configurado"],
    "Payout already requested — awaiting admin approval": ["已经申请过放款，正在等待管理员审批", "已經申請過撥款，正在等待管理員審核", "Ya se solicitó el pago; pendiente de aprobación"],
    "Photos required before Active cannot be more than the maximum photos per listing": ["上架所需照片数不能多于每个房源的照片上限", "上架所需照片數不能多於每個房源的照片上限", "Las fotos requeridas para activar no pueden superar el máximo por propiedad"],
    "Please agree to be contacted": ["请勾选同意被联系", "請勾選同意被聯絡", "Acepte ser contactado"],
    "Please enter an email or phone number": ["请填写邮箱或电话", "請填寫信箱或電話", "Ingrese un correo o un teléfono"],
    "Please enter your name": ["请填写你的姓名", "請填寫你的姓名", "Ingrese su nombre"],
    "Please login using your linked social account": ["请使用已关联的社交账号登录", "請使用已連結的社群帳號登入", "Inicie sesión con su cuenta social vinculada"],
    "Please upload a CSV file": ["请上传 CSV 文件", "請上傳 CSV 檔案", "Suba un archivo CSV"],
    "Please verify your email address before logging in. Check your inbox, or request a new link.": ["请先验证邮箱再登录。请查看收件箱，或重新获取验证链接。", "請先驗證信箱再登入。請查看收件匣，或重新取得驗證連結。", "Verifique su correo antes de iniciar sesión. Revise su bandeja de entrada o solicite un nuevo enlace."],
    "Property and client are required": ["请选择房源和客户", "請選擇房源和客戶", "Se requieren la propiedad y el cliente"],
    "Property is required": ["请选择房源", "請選擇房源", "Se requiere la propiedad"],
    "Property not found": ["找不到该房源", "找不到該房源", "No se encontró la propiedad"],
    "Public listing uploads must be JPG, PNG, WebP, or GIF images": ["公开房源照片必须是 JPG、PNG、WebP 或 GIF 图片", "公開房源照片必須是 JPG、PNG、WebP 或 GIF 圖片", "Las fotos públicas deben ser imágenes JPG, PNG, WebP o GIF"],
    "Public page slug must be 3–48 lowercase letters, numbers, or hyphens": ["公开页面地址必须是 3–48 个小写字母、数字或连字符", "公開頁面網址必須是 3–48 個小寫字母、數字或連字號", "La dirección pública debe tener 3–48 letras minúsculas, números o guiones"],
    "Referral not found": ["找不到该转介", "找不到該轉介", "No se encontró el referido"],
    "Request payload too large": ["请求内容太大", "請求內容太大", "La solicitud es demasiado grande"],
    "Routing rule not found": ["找不到该分配规则", "找不到該分配規則", "No se encontró la regla de asignación"],
    "Rule name is required": ["请填写规则名称", "請填寫規則名稱", "Se requiere el nombre de la regla"],
    "Search failed": ["搜索失败", "搜尋失敗", "La búsqueda falló"],
    "Social and Email generation require a PRO subscription.": ["社交媒体和邮件内容生成需要 PRO 套餐。", "社群與郵件內容產生需要 PRO 方案。", "La generación de redes sociales y correo requiere una suscripción PRO."],
    "Start the setup first": ["请先开始设置", "請先開始設定", "Primero inicie la configuración"],
    "Target agent not found in your organization": ["在你的公司里找不到目标经纪人", "在你的公司裡找不到目標經紀人", "No se encontró el agente en su organización"],
    "Task not found": ["找不到该任务", "找不到該任務", "No se encontró la tarea"],
    "That code is not correct": ["验证码不正确", "驗證碼不正確", "El código no es correcto"],
    "That code is not correct.": ["验证码不正确。", "驗證碼不正確。", "El código no es correcto."],
    "That code is not correct. Check the time on your phone and try again.": ["验证码不正确。请检查手机时间后重试。", "驗證碼不正確。請檢查手機時間後重試。", "El código no es correcto. Revise la hora de su teléfono e inténtelo de nuevo."],
    "That code was already used. Wait for the next one.": ["这个验证码已经用过了，请等下一个。", "這個驗證碼已經用過了，請等下一個。", "Ese código ya se usó. Espere el siguiente."],
    "The AI assistant is temporarily unavailable. Please try again.": ["AI 助手暂时不可用，请稍后重试。", "AI 助理暫時無法使用，請稍後重試。", "El asistente de IA no está disponible temporalmente. Inténtelo de nuevo."],
    "The checklist must be a list of items": ["清单必须是由任务组成的列表", "清單必須是由任務組成的列表", "La lista debe estar formada por elementos"],
    "The checklist needs between 1 and 40 items": ["清单需要 1 到 40 项", "清單需要 1 到 40 項", "La lista necesita entre 1 y 40 elementos"],
    "The co-agent must be a different person": ["合作经纪人必须是另一个人", "合作經紀人必須是另一個人", "El coagente debe ser otra persona"],
    "The goal must be a positive amount": ["目标必须是正数金额", "目標必須是正數金額", "La meta debe ser un monto positivo"],
    "The password is not correct": ["密码不正确", "密碼不正確", "La contraseña no es correcta"],
    "The sign-in took too long. Please enter your password again.": ["登录时间过长，请重新输入密码。", "登入時間過長，請重新輸入密碼。", "El inicio de sesión tardó demasiado. Ingrese su contraseña de nuevo."],
    "This account has been deactivated.": ["这个账号已被停用。", "這個帳號已被停用。", "Esta cuenta fue desactivada."],
    "This account has been deactivated. Contact your administrator.": ["这个账号已被停用，请联系管理员。", "這個帳號已被停用，請聯絡管理員。", "Esta cuenta fue desactivada. Comuníquese con su administrador."],
    "This account is no longer active": ["这个账号已不再有效", "這個帳號已不再有效", "Esta cuenta ya no está activa"],
    "This client belongs to another agent": ["这个客户属于其他经纪人", "這個客戶屬於其他經紀人", "Este cliente pertenece a otro agente"],
    "This email is already a member of your organization": ["这个邮箱已经是公司成员", "這個信箱已經是公司成員", "Este correo ya es miembro de su organización"],
    "This email is already registered": ["这个邮箱已经注册过", "這個信箱已經註冊過", "Este correo ya está registrado"],
    "This invitation has already been used.": ["这个邀请已经用过了。", "這個邀請已經用過了。", "Esta invitación ya se usó."],
    "This invitation has expired. Please ask your admin to send a new one.": ["这个邀请已过期，请让管理员重新发送。", "這個邀請已過期，請讓管理員重新傳送。", "Esta invitación venció. Pida a su administrador una nueva."],
    "This invitation was sent to a different email address.": ["这个邀请是发给另一个邮箱的。", "這個邀請是寄給另一個信箱的。", "Esta invitación se envió a otro correo."],
    "This public page address is already reserved": ["这个公开页面地址已被保留", "這個公開頁面網址已被保留", "Esta dirección pública ya está reservada"],
    "This public page address is already taken": ["这个公开页面地址已被使用", "這個公開頁面網址已被使用", "Esta dirección pública ya está en uso"],
    "This request was already processed": ["这个申请已经处理过了", "這個申請已經處理過了", "Esta solicitud ya fue procesada"],
    "This team has reached its plan seat limit. Ask your admin to upgrade the plan.": ["团队已达到套餐的席位上限，请让管理员升级套餐。", "團隊已達到方案的席位上限，請讓管理員升級方案。", "El equipo alcanzó el límite de puestos del plan. Pida a su administrador que lo actualice."],
    "Title cannot be empty": ["标题不能为空", "標題不能為空", "El título no puede estar vacío"],
    "Title is required": ["请填写标题", "請填寫標題", "Se requiere el título"],
    "Token and password are required": ["缺少链接令牌或密码", "缺少連結權杖或密碼", "Se requieren el token y la contraseña"],
    "Token is required": ["缺少链接令牌", "缺少連結權杖", "Se requiere el token"],
    "Too many authentication attempts from this IP, please try again after 15 minutes": ["这个 IP 的登录尝试次数过多，请 15 分钟后再试", "這個 IP 的登入嘗試次數過多，請 15 分鐘後再試", "Demasiados intentos desde esta IP. Inténtelo de nuevo en 15 minutos."],
    "Too many requests, please try again later.": ["请求过于频繁，请稍后再试。", "請求過於頻繁，請稍後再試。", "Demasiadas solicitudes. Inténtelo más tarde."],
    "Too many sign-in attempts from this IP, please try again later": ["这个 IP 的登录尝试次数过多，请稍后再试", "這個 IP 的登入嘗試次數過多，請稍後再試", "Demasiados intentos de inicio de sesión desde esta IP. Inténtelo más tarde."],
    "Transaction not found": ["找不到该交易", "找不到該交易", "No se encontró la operación"],
    "Two-factor authentication is already on": ["两步验证已经开启", "兩步驟驗證已經開啟", "La verificación en dos pasos ya está activada"],
    "Two-factor authentication is not on": ["两步验证尚未开启", "兩步驟驗證尚未開啟", "La verificación en dos pasos no está activada"],
    "Type the objection you want to answer": ["请输入你要回应的异议", "請輸入你要回應的異議", "Escriba la objeción que quiere responder"],
    "Unauthorized": ["请先登录", "請先登入", "No autorizado"],
    "Unknown skill": ["未知的技能", "未知的技能", "Habilidad desconocida"],
    "Unsupported document format. Allowed: PDF, JPG, PNG, WebP, DOC, DOCX": ["不支持的文档格式。允许：PDF、JPG、PNG、WebP、DOC、DOCX", "不支援的文件格式。允許：PDF、JPG、PNG、WebP、DOC、DOCX", "Formato no admitido. Permitidos: PDF, JPG, PNG, WebP, DOC, DOCX"],
    "Unsupported language": ["不支持的语言", "不支援的語言", "Idioma no admitido"],
    "User is already active": ["该用户已经是启用状态", "該使用者已經是啟用狀態", "El usuario ya está activo"],
    "User not found": ["找不到该用户", "找不到該使用者", "No se encontró el usuario"],
    "User not found in your organization": ["在你的公司里找不到该用户", "在你的公司裡找不到該使用者", "No se encontró el usuario en su organización"],
    "Virtual tour link must start with http:// or https://": ["虚拟看房链接必须以 http:// 或 https:// 开头", "虛擬看屋連結必須以 http:// 或 https:// 開頭", "El enlace del recorrido virtual debe empezar con http:// o https://"],
    "Workday start must be earlier than workday end": ["工作开始时间必须早于结束时间", "工作開始時間必須早於結束時間", "El inicio de la jornada debe ser anterior al final"],
    "You cannot approve your own payout request": ["你不能批准自己的放款申请", "你不能核准自己的撥款申請", "No puede aprobar su propia solicitud de pago"],
    "You cannot change the role of a user at or above your own level": ["你不能修改与你同级或更高级用户的角色", "你不能修改與你同級或更高級使用者的角色", "No puede cambiar el rol de un usuario de su nivel o superior"],
    "You cannot refer to yourself": ["不能转介给自己", "不能轉介給自己", "No puede referirse a sí mismo"],
    "You cannot review your own payout request": ["你不能审批自己的放款申请", "你不能審核自己的撥款申請", "No puede revisar su propia solicitud de pago"],
    "Your brokerage only lets managers create listings": ["你的公司只允许经理创建房源", "你的公司只允許經理建立房源", "Su correduría solo permite que los gerentes creen propiedades"],
    "Your password has expired. Use \"Forgot password\" to choose a new one.": ["你的密码已过期，请用“忘记密码”设置新密码。", "你的密碼已過期，請用「忘記密碼」設定新密碼。", "Su contraseña venció. Use \"Olvidé mi contraseña\" para elegir una nueva."],
    "Your password was changed. Please sign in again.": ["你的密码已修改，请重新登录。", "你的密碼已修改，請重新登入。", "Su contraseña cambió. Inicie sesión de nuevo."],
    "Your role cannot create clients": ["你的角色不能创建客户", "你的角色不能建立客戶", "Su rol no puede crear clientes"],
    "Your role cannot create deals": ["你的角色不能创建交易", "你的角色不能建立交易", "Su rol no puede crear operaciones"],
    "Your role cannot create listings": ["你的角色不能创建房源", "你的角色不能建立房源", "Su rol no puede crear propiedades"],
    "Your role cannot edit clients": ["你的角色不能编辑客户", "你的角色不能編輯客戶", "Su rol no puede editar clientes"],
    "Your role cannot import clients": ["你的角色不能导入客户", "你的角色不能匯入客戶", "Su rol no puede importar clientes"],
    "Your role cannot import listings": ["你的角色不能导入房源", "你的角色不能匯入房源", "Su rol no puede importar propiedades"],
    "Your role cannot log activities": ["你的角色不能记录活动", "你的角色不能記錄活動", "Su rol no puede registrar actividades"],
    "Your role cannot submit offers": ["你的角色不能提交报价", "你的角色不能提交出價", "Su rol no puede enviar ofertas"],
    "Your role does not have CRM access": ["你的角色没有 CRM 访问权限", "你的角色沒有 CRM 存取權限", "Su rol no tiene acceso al CRM"],
    "Your role has no access to deals": ["你的角色没有交易访问权限", "你的角色沒有交易存取權限", "Su rol no tiene acceso a las operaciones"],
    "Your session has expired. Please sign in again.": ["登录已过期，请重新登录。", "登入已過期，請重新登入。", "Su sesión venció. Inicie sesión de nuevo."],
};

// Messages that carry values: the English pattern and translations with $1, $2 … placeholders
export const ERROR_PATTERNS: [RegExp, T3][] = [
    [/^Password must be at least (\d+) characters$/, ["密码至少需要 $1 个字符", "密碼至少需要 $1 個字元", "La contraseña debe tener al menos $1 caracteres"]],
    [/^This feature requires a (\w+) subscription\.$/, ["此功能需要 $1 套餐。", "此功能需要 $1 方案。", "Esta función requiere una suscripción $1."]],
    [/^A client with this email or phone already exists: (.+) \(agent: (.+)\)$/, ["已有相同邮箱或电话的客户：$1（经纪人：$2）", "已有相同信箱或電話的客戶：$1（經紀人：$2）", "Ya existe un cliente con este correo o teléfono: $1 (agente: $2)"]],
    [/^Not a valid IP address or range: (.+)$/, ["不是有效的 IP 地址或网段：$1", "不是有效的 IP 位址或網段：$1", "No es una dirección IP o rango válido: $1"]],
    [/^Your current IP \((.+)\) is not in the list\. Add it first so you don't lock yourself out\.$/, ["你当前的 IP（$1）不在名单里。请先加上，以免把自己锁在外面。", "你目前的 IP（$1）不在名單裡。請先加上，以免把自己鎖在外面。", "Su IP actual ($1) no está en la lista. Agréguela primero para no quedarse sin acceso."]],
    [/^At most (\d+) entries$/, ["最多 $1 条", "最多 $1 筆", "Como máximo $1 entradas"]],
    [/^This listing already has (\d+) photos; your brokerage allows at most (\d+) per listing$/, ["这个房源已有 $1 张照片；你的公司规定每个房源最多 $2 张", "這個房源已有 $1 張照片；你的公司規定每個房源最多 $2 張", "Esta propiedad ya tiene $1 fotos; su correduría permite como máximo $2"]],
    [/^The description can have at most (\d+) characters \(it has (\d+)\)$/, ["描述最多 $1 个字符（当前 $2 个）", "描述最多 $1 個字元（目前 $2 個）", "La descripción puede tener como máximo $1 caracteres (tiene $2)"]],
    [/^(.+) is required by your brokerage's CRM policy$/, ["公司的 CRM 规定必须填写：$1", "公司的 CRM 規定必須填寫：$1", "La política de CRM de su correduría exige: $1"]],
    [/^(.+) is required by your brokerage's listing policy$/, ["公司的房源规定必须填写：$1", "公司的房源規定必須填寫：$1", "La política de propiedades de su correduría exige: $1"]],
    [/^Cannot approve a commission in (\w+) status$/, ["不能批准状态为 $1 的佣金", "不能核准狀態為 $1 的佣金", "No se puede aprobar una comisión en estado $1"]],
    [/^Cannot reject a commission in (\w+) status$/, ["不能退回状态为 $1 的佣金", "不能退回狀態為 $1 的佣金", "No se puede rechazar una comisión en estado $1"]],
    [/^(.+) integration is not available yet\.$/, ["$1 集成暂未开放。", "$1 整合尚未開放。", "La integración con $1 aún no está disponible."]],
];

export const DEV_ONLY_ERRORS: string[] = [
    "CSRF validation failed: missing X-CSRF-Protection header",
    "Dev mode: email and googleId required",
    "Invalid webhook signature",
    "Malformed JSON in request body",
    "Origin not allowed",
    "Payment service not configured. Set STRIPE_SECRET_KEY.",
    "Send an object such as { \"crm\": { ... } }",
    "Webhook signature verification not configured",
    "brandColor must be a 6-digit hex color (e.g. #B8977E)",
    "ipAllowlist must be a list",
    "propertyId and orderedIds array are required",
    "targetAgentId is required for SPECIFIC_AGENT strategy",
];

const IDX: Record<Exclude<Lang, 'en'>, number> = { 'zh-CN': 0, 'zh-TW': 1, es: 2 };

export function translateError(message: string, lang: Lang): string {
    if (lang === 'en' || typeof message !== 'string') return message;
    const i = IDX[lang];
    const hit = ERROR_TEXT[message];
    if (hit) return hit[i];
    for (const [rx, t] of ERROR_PATTERNS) {
        const m = message.match(rx);
        if (m) return t[i].replace(/\$(\d)/g, (_, n) => m[Number(n)] ?? '');
    }
    return message;
}

/** Browser Accept-Language → one of our languages (zh-TW/zh-HK/zh-Hant → zh-TW, other zh → zh-CN). */
export function langFromAcceptLanguage(header: string | undefined): Lang | null {
    if (!header) return null;
    for (const part of header.split(',')) {
        const tag = part.split(';')[0].trim().toLowerCase();
        if (/^zh-(tw|hk|mo|hant)/.test(tag)) return 'zh-TW';
        if (tag.startsWith('zh')) return 'zh-CN';
        if (tag.startsWith('es')) return 'es';
        if (tag.startsWith('en')) return 'en';
    }
    return null;
}

/**
 * The language to answer in: the X-Lang header the frontend sends, then a `language` field in the body,
 * then the language saved on the signed-in account, then the browser's Accept-Language, then English.
 */
export function requestLang(req: Request): Lang {
    const header = req.headers['x-lang'];
    if (isLang(header)) return header;
    const bodyLang = (req.body as { language?: unknown } | undefined)?.language;
    if (isLang(bodyLang)) return bodyLang;
    const userLang = (req as Request & { user?: { lang?: unknown } }).user?.lang;
    if (isLang(userLang)) return userLang;
    return langFromAcceptLanguage(req.headers['accept-language'] as string | undefined) ?? 'en';
}
