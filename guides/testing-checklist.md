# Pilot testing checklist

A short script for brokerage staff trying the CRM. Each step lists what should
happen; note anything that doesn't.

## 1. Account & team (firm admin)
- [ ] Sign up a brokerage, log in, open **Settings → Organization**, fill in details.
- [ ] Set **Commission defaults** (e.g. 3% rate, 30% firm split) and save.
- [ ] Invite an agent from **Settings → Team**; the agent accepts and logs in.
- [ ] In **Settings → Org Settings** (`1.4`), upload a **Company Logo** from device, set a **Brand Accent Color**, and change the **Custom Public URL Slug** — verify the old slug redirects to the new slug.
- [ ] In **Settings → Lead Routing** (`1.2`), create a Round-Robin rule and test it with the **Simulator (Dry-Run)**; in **Settings → Notifications** (`1.3`), save email alert preferences and verify they persist.

## 2. Clients (agent)
- [ ] **CRM → Add Client** with source and priority. Adding the same email again warns about a duplicate.
- [ ] Search by name, phone or email — results come from all pages, not just the first.
- [ ] Tick **Needs follow-up** — clients never contacted (or not in 14 days) appear.
- [ ] Open a client → **Log Activity** (call/email/text…) with a follow-up date →
      the timeline updates, "Last contact" shows today, a task appears in **Tasks**.
- [ ] **Edit Profile** → change priority/tags → saved.
- [ ] **CRM → Import CSV** (`3.3a`) → download the sample template, upload a CSV file, verify the 5-row preview, and import with **Skip existing records** or **Update existing records**.

## 3. Listings & website leads
- [ ] **Listings → Add property**, upload multiple photos directly from device (`1.1`), reorder them, and set a cover photo; also test **Listings → Import CSV** (`3.3a`).
- [ ] **Documents → Upload Document** (`1.1`), upload a private PDF contract from device, click **View**, and verify it opens via a 10-minute signed preview URL.
- [ ] Click **Public page** — the listing opens without logging in.
- [ ] **Settings → Org Settings** shows your brokerage's public listings link; it lists only your brokerage's homes.
- [ ] Submit the inquiry form from a private/incognito window →
      the agent gets a notification, a new **Hot** client with source *Website*, and an urgent call-back task.
- [ ] Click **QR** on the listing card and open the copied link — the form becomes an open-house sign-in.

## 4. Offers, deals, commission
- [ ] **Transactions → Add Offer** for a client on a listing.
- [ ] **Counter** (enter an amount), then **Accept** → a deal is created, the listing shows *In Contract*,
      and closing-checklist tasks appear in **Tasks**.
- [ ] In **Pipeline**, move the deal to **Closed** → the listing shows *Sold* and a commission appears in **Finance**.
- [ ] Agent clicks **Request payout**; a manager approves it in **Finance** → agent is notified.

## 5. Appointments & dashboard
- [ ] Schedule a showing for later today with a location — the time shown matches what you entered.
- [ ] Confirm / complete / cancel it from the list.
- [ ] **Dashboard** shows today's appointments, overdue tasks and leads needing follow-up.

## 6. AI assistant
- [ ] **Marketing** shows the AI assistant marked **In development** with its buttons disabled (not part of this pilot).

## 7. Permissions
- [ ] An agent only sees their own clients and deals; a manager sees the whole brokerage.
- [ ] Two separate brokerages never see each other's clients, deals or documents.

## 8. Security settings / 安全设置
- [ ] **Settings → Security** (as a firm admin): change the minimum password length to 12 and require a special character, save, then invite a teammate — a short or plain password on the invitation page is refused with a clear message.
      *设置 → 安全（公司管理员）：把最短密码长度改成 12 并要求特殊字符，保存后邀请一位同事——邀请页里过短或没有特殊字符的密码会被拒绝并给出清楚的提示。*
- [ ] Set the session timeout to 15 minutes, sign in, wait 16 minutes and click anything — you are sent back to sign in. Set it back to 24 hours afterwards.
      *把会话时长设成 15 分钟，登录后等 16 分钟再点任何地方——会被送回登录页。测完请改回 24 小时。*
- [ ] **Send Reset Link** emails a real reset link; after resetting the password, a session that was open on another device is signed out (with “sign out on password change” on).
      *“发送重置链接”会发出真实的重置邮件；重设密码后，另一台设备上已打开的会话会被退出（开启“改密码后退出”时）。*
- [ ] A manager or agent sees the security rules but cannot save changes.
      *经理和经纪人能看到安全规则，但不能保存修改。*
- [ ] **Login alerts** (on by default): sign in from a different browser or your phone — you receive a "New sign-in to your account" email with the device, IP and time. Signing in again from the same browser sends nothing. Turn the switch off and the alert stops.
      *登录提醒（默认开启）：换一个浏览器或用手机登录，会收到“你的账号有新的登录”邮件，写明设备、IP 和时间；同一浏览器再次登录不会发送。关闭开关后不再提醒。*
- [ ] **Two-factor authentication**: Settings → Security → Set up, scan the QR code with an authenticator app, enter the code — 10 recovery codes are shown. Sign out and back in: after the password you are asked for the 6-digit code. A wrong code is refused; a recovery code works once.
      *两步验证：设置 → 安全 → 设置，用验证器 App 扫码并输入验证码，会显示 10 个恢复码。退出后重新登录：输完密码会要求输入 6 位验证码；错误的验证码会被拒绝，恢复码只能用一次。*
- [ ] Turning 2FA off asks for your password and a code. A firm admin sees **Reset 2FA** next to a teammate who has it on (Team & Roles).
      *关闭两步验证需要输入密码和验证码。公司管理员在“团队与角色”里，会在已开启两步验证的同事旁边看到“重置两步验证”。*
- [ ] **IP whitelist** (firm admin): the row shows "Your current IP". Enter only another address (e.g. `203.0.113.7`) and save — refused, because it would lock you out. Click **Add my IP**, save — accepted. Sign in from another network (e.g. a phone on mobile data) — refused with "contact your administrator". Clear the list and save afterwards.
      *IP 白名单（公司管理员）：这一行会显示“你当前的 IP”。只填一个别的地址（如 `203.0.113.7`）并保存——会被拒绝，因为会把自己锁在外面。点“添加我的 IP”再保存——成功。用另一个网络（如手机流量）登录——被拒绝并提示联系管理员。测完把名单清空并保存。*

## 9. Settings: CRM, Properties, Finance, Appointments, Documents / 设置：CRM、房源、财务、预约、文档
- [ ] **Settings → CRM** (firm admin): make *Email* a required field, save, then add a client without an email — it is refused with a clear message; the add form shows a red asterisk on Email. Set the client limit to 1 and try adding a second open client as an agent — refused.
      *设置 → CRM（公司管理员）：把“邮箱”设为必填并保存，再添加没有邮箱的客户——会被拒绝并给出提示，表单里邮箱带红色星号。把客户上限设为 1，用经纪人账号再加第二个在跟进的客户——会被拒绝。*
- [ ] Turn on “agents can see all clients”: an agent sees everyone's clients but can only edit their own.
      *打开“经纪人可查看全部客户”：经纪人能看到所有客户，但只能修改自己的。*
- [ ] **Settings → Properties**: require 3 photos before Active. A new listing starts as *Coming soon*; upload 3 photos, then **Set Active** works. Set a photo limit of 3 — a fourth photo is refused. Set “managers only” — an agent cannot add a listing.
      *设置 → 房源：设为“上架前至少 3 张照片”。新房源先是“即将上市”；传满 3 张后“设为在售”可用。把每个房源照片上限设为 3，第四张会被拒绝。设为“仅经理可新建”，经纪人无法添加房源。*
- [ ] **Settings → Appointments**: turn on “prevent double booking” and book two overlapping showings — a confirmation asks whether to book anyway. Turn off weekends — the week view shows Monday to Friday. Set workday hours — the week and day views follow them.
      *设置 → 预约：打开“禁止重复预约”，预约两个时间重叠的看房——会弹出确认是否仍要预约。关闭周末后，周视图只显示周一到周五。设置工作时间后，周视图和日视图按此显示。*
- [ ] **Settings → Documents**: allow PDF only and 1 MB. In **Documents**, a Word file or a bigger file is refused with a clear message; the upload box lists the rules.
      *设置 → 文档：只允许 PDF，上限 1 MB。在“文档”里上传 Word 文件或超过 1 MB 的文件会被拒绝并给出提示；上传框会列出规则。*
- [ ] **Settings → Finance**: turn off “agents see colleagues' gross” — an agent's leaderboard shows “—” for others, while a manager still sees all amounts. Change the fiscal-year start month — year-to-date figures change.
      *设置 → 财务：关闭“经纪人可看同事佣金总额”——经纪人的排行榜里他人显示“—”，经理仍可见全部金额。修改财年起始月份，“年初至今”数字随之变化。*
- [ ] Personal preferences (any user) — default client type/stage, compact list, hide budget, default listing status, default appointment length, auto-confirm, hide leaderboard / dashboard income — apply on the matching pages and only for that user.
      *个人偏好（任何用户）：默认客户类型和阶段、紧凑列表、隐藏预算、新房源默认状态、预约默认时长、自动确认、隐藏排行榜和仪表盘收入——在对应页面生效，且只影响本人。*
- [ ] Marketing, Access Control and Integrations still show **Coming soon**. A manager or agent sees the company rules but cannot save them.
      *营销、访问控制、集成仍显示“即将推出”。经理和经纪人能看到公司规则，但不能保存。*

## 9. Language / 语言
- [ ] Choose **Español** on the login page, sign in, then request a password reset and invite a teammate — both emails arrive in Spanish.
      *在登录页选 Español，登录后申请重置密码、邀请一位同事——两封邮件都是西班牙语。*
- [ ] Switch the language in the top bar to 简体中文, then create an appointment — the new notification is in Chinese. Switch to 繁體中文 and check again.
      *在顶栏把语言切到简体中文，再创建一个预约——新通知是中文的；切到繁體中文再看一次。*
- [ ] Sign out, clear the browser's site data (or use another browser), sign in again — the interface opens in the language you used last.
      *退出登录，清除浏览器网站数据（或换一个浏览器），再登录——界面会使用你上次用的语言。*
- [ ] In Español, open **Settings** and click through every section, then the **Dashboard** action cards and the **Marketing** AI skills — no English is left (place names and brand names excepted).
      *切到西班牙语，逐个点开“设置”的每个栏目，再看仪表盘的待办卡片和营销页的 AI 技能——不应再有英文（地名和品牌名除外）。*
- [ ] Notifications created *before* the language was saved stay in the language they were created in.
      *在保存语言之前生成的旧通知，保持生成时的语言，不会被改写。*
- [ ] In 简体中文, sign in with a wrong password, then try to save a client without a first name — both error messages are in Chinese. Repeat in Español.
      *切到简体中文，用错误的密码登录，再试着保存一个没填名字的客户——两条错误提示都是中文；切到西班牙语再试一次。*

## 10. Open house / 开放日
- [ ] On **Listings**, click **QR** on a listing — a printable sign opens with a large QR code; print it (or save as PDF) and scan it with a phone.
      *在“房源”页点某个房源的 QR——会打开可打印的签到海报；打印（或存为 PDF）后用手机扫码。*
- [ ] On the sign-in form, try to submit without ticking "agree to be contacted" — it is refused. Tick it, answer the questions and submit.
      *在签到表单里不勾“同意被联系”直接提交——无法提交；勾选并填写问题后提交。*
- [ ] The visitor appears in **CRM** with source "Open House", the budget filled in and the answers in the notes; a "follow up within 24 hours" task appears for the listing agent.
      *访客出现在客户列表，来源为“开放日”，预算已填，回答在备注里；挂牌经纪人收到“24 小时内跟进”的任务。*

## 11. Deal details / 交易详情
- [ ] On **Transactions**, click a deal card — a panel opens with key dates, commission and the closing checklist. Change the closing date and save; the "in N days" label updates.
      *在“交易”页点一张交易卡片——会打开详情面板（关键日期、佣金、过户清单）。修改过户日期并保存，“还有 N 天”随之更新。*
- [ ] Pick a co-agent with a 40% share, then move the deal to **Closed** — **Finance** shows two commissions (60% and 40% of the agent side, each after the firm split).
      *选一位合作经纪人并设 40% 分成，再把交易移到“已成交”——财务页出现两条佣金（经纪人一方的 60% 和 40%，各自扣除公司分成）。*
- [ ] Tick a checklist task that is yours — it is marked done. Tasks assigned to someone else cannot be ticked.
      *勾选属于自己的清单任务——标记为完成；分配给别人的任务不能勾选。*

- [ ] As a manager, click **Checklist template** on **Transactions**, remove a few tasks, add "Book the moving elevator" at -7 days from closing, save, then open a new deal with a closing date — its checklist is exactly your list, with the elevator task due a week before closing. Click **Restore standard** afterwards.
      *用经理账号在“交易”页点“过户清单模板”，删掉几项，添加“预约搬家电梯”（相对过户日 -7 天）并保存，再新开一个有过户日期的交易——它的清单正好是你的清单，电梯任务在过户前一周到期。测完点“恢复标准清单”。*
- [ ] An agent does not see the **Checklist template** button.
      *经纪人看不到“过户清单模板”按钮。*

## 12. Goals & performance / 目标与业绩
- [ ] On the **Dashboard**, the commission card says "No annual goal set yet". Click **Set goal**, enter an amount — the bar and percentage reflect your paid commission against that goal.
      *仪表盘的佣金卡片显示“尚未设定年度目标”。点“设定目标”填一个金额——进度条和百分比按已发放佣金与目标对比显示。*
- [ ] **Reports → Performance** shows lead sources with conversion, deals closed, volume and average time to close; a manager also sees the agent comparison. **Export to Excel (CSV)** opens in Excel with Chinese text intact.
      *报表 → 业绩 显示线索来源及转化率、成交笔数、总额和平均成交周期；经理还能看到经纪人对比。“导出到 Excel（CSV）”用 Excel 打开时中文不乱码。*

Report problems with: the page, what you clicked, what you expected, what happened, and a screenshot.
