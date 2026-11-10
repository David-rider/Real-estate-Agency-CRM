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
- [ ] Two-factor authentication, login alerts and the IP whitelist show **Coming soon** and do nothing yet.
      *双因素认证、登录提醒和 IP 白名单显示“即将推出”，目前不起作用。*

Report problems with: the page, what you clicked, what you expected, what happened, and a screenshot.
