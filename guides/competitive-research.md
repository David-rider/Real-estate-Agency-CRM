# 同类开源经纪人平台调研（2026-10） / Open-source brokerage platform research (2026-10)

在 GitHub 上搜索 "real estate CRM / realtor CRM / brokerage" 等关键词，挑出与我们定位最接近的项目，
记录它们值得借鉴的做法，以及我们这次已经吸收进系统的部分。

We searched GitHub for “real estate CRM / realtor CRM / brokerage” and picked the projects closest to our positioning, recording what is worth borrowing and what we have already absorbed into the system.

## 调研对象 / Projects surveyed

| 项目<br>*Project* | 技术栈<br>*Stack* | 定位<br>*Positioning* | 许可<br>*License* |
|---|---|---|---|
| [prolinkinfo/RealEstateCRM](https://github.com/prolinkinfo/RealEstateCRM) | MERN | 最受欢迎的开源经纪人 CRM（360+ stars），客户/房源/沟通管理<br>*Most popular open-source brokerage CRM (360+ stars); client / listing / communication management* | MIT |
| [trybrokeros/BrokerOS](https://github.com/trybrokeros/BrokerOS) | NestJS + Next.js 16 + Expo | 面向经纪公司和渠道合作方的完整运营系统<br>*Full operations system for brokerages and channel partners* | MIT |
| [eprobertson001/real_estate_CRM](https://github.com/eprobertson001/real_estate_CRM) | Next.js + Prisma | 交易管理、合同 AI 解析、MLS、Dotloop 签字<br>*Deal management, AI contract parsing, MLS, Dotloop signing* | 未声明<br>*Not stated* |
| [ahmedsaadawi13/splash-lead-router](https://github.com/ahmedsaadawi13/splash-lead-router) | PHP / MySQL | 多租户线索自动分配（按区域、预算、经纪人负载）<br>*Multi-tenant automatic lead routing (by area, budget, agent load)* | 未声明<br>*Not stated* |
| [tobywashere/open-house-intelligence-crm](https://github.com/tobywashere/open-house-intelligence-crm) | Python + React | 本地 AI 经纪人 CRM，AI 改动需人工审批<br>*Local AI agent CRM; AI changes need human approval* | 未声明<br>*Not stated* |
| [AmazingPhotoVideo/ai-for-realtors](https://github.com/AmazingPhotoVideo/ai-for-realtors) | Prompt / Claude Skills | 经纪人 AI 提示词与 Claude Skills 合集<br>*Collection of AI prompts and Claude Skills for realtors* | **无许可证**<br>***No license*** |

> ai-for-realtors 没有开源许可证，因此只借鉴了思路，所有提示词都是我们自己重新写的，没有复制原文。
> *ai-for-realtors has no open-source license, so we only borrowed ideas; every prompt was rewritten by us, nothing was copied.*

## 值得借鉴的经验 / Lessons worth borrowing

1. **Speed-to-lead（5 分钟响应）**：多个项目都强调网站 / 开放日线索必须立即进入 CRM 并提醒经纪人。
   *Speed-to-lead (5-minute response): several projects stress that website / open-house leads must enter the CRM instantly and alert the agent.*
2. **线索温度 / 评分**（BrokerOS）：Hot / Warm / Cold，让经纪人优先处理高意向客户。
   *Lead temperature / scoring (BrokerOS): Hot / Warm / Cold, so agents handle high-intent clients first.*
3. **跟进积压（Backlog）**（BrokerOS）：没跟进的客户自动进入待办，避免线索流失。
   *Follow-up backlog (BrokerOS): clients not followed up land in a to-do list automatically, so leads are not lost.*
4. **完整活动时间线**：每一次电话、邮件、带看、报价都记录在客户名下。
   *Full activity timeline: every call, email, showing and offer is logged under the client.*
5. **合同到过户清单模板**（eprobertson001）：开单后自动生成标准任务和截止日期。
   *Contract-to-close checklist template (eprobertson001): standard tasks and deadlines are generated when a deal opens.*
6. **佣金锁定与审批流程**（BrokerOS）：成交后自动计算佣金，经理审批发放。
   *Commission lock and approval flow (BrokerOS): commission is computed on closing and a manager approves payout.*
7. **线索分配规则**（splash-lead-router）：按区域、预算、负载自动分配给经纪人。
   *Lead routing rules (splash-lead-router): leads are assigned to agents by area, budget and load.*
8. **AI 技能化**（ai-for-realtors）：把常用场景做成固定“技能”——房源文案、异议处理、卖家需求访谈、
   上门挂牌演示、开放日跟进、客户跟进。注意公平住房（Fair Housing）合规用语。
   *AI as skills (ai-for-realtors): common scenarios become fixed skills — listing copy, objection handling, seller-needs interview, listing presentation, open-house follow-up, client follow-up. Mind Fair Housing compliant wording.*
9. **AI 改动需人工确认**（open-house-intelligence）：AI 只生成草稿，不直接改数据。
   *AI changes need human confirmation (open-house-intelligence): AI only drafts and never edits data directly.*
10. **开放日二维码签到**：无需安装 App，访客扫码即成为线索。
    *Open-house QR sign-in: no app needed — a visitor scans the code and becomes a lead.*

## 本次已落地到系统的功能 / Implemented in the system

| 借鉴点<br>*Idea* | 我们的实现<br>*Our implementation* |
|---|---|
| Speed-to-lead | 公开房源详情页 + 咨询表单 → 自动创建 HOT 客户、记录留言、生成 15 分钟内回电的紧急任务、通知挂牌经纪人<br>*Public listing page + inquiry form → auto-creates a HOT client, logs the message, creates an urgent task to call back within 15 minutes and notifies the listing agent* |
| 开放日签到 | 房源卡片上的 “QR” 按钮复制签到链接（`?openhouse=1`），打印成二维码即可<br>*The “QR” button on a listing card copies the sign-in link (`?openhouse=1`); print it as a QR code* |
| 线索温度 | 客户新增 Hot / Warm / Cold 优先级，列表可筛选并显示标签<br>*Clients get a Hot / Warm / Cold priority; the list can filter by it and shows a badge* |
| 跟进积压 | “待跟进” 筛选（14 天未联系）+ 仪表盘 “待跟进客户” 卡片；记录活动时可设定跟进提醒<br>*“Needs follow-up” filter (no contact in 14 days) + a dashboard card; a follow-up reminder can be set when logging an activity* |
| 活动时间线 | 电话 / 邮件 / 短信 / 会面 / 带看 / 备注全部记录，并自动更新 “最近联系”<br>*Calls / emails / SMS / meetings / showings / notes are all logged and “last contacted” updates automatically* |
| 过户清单 | 新建交易或接受报价时自动生成 8–10 项清单任务（按合同日期、过户日期排期）<br>*Creating a deal or accepting an offer auto-generates 8–10 checklist tasks, scheduled from the contract and closing dates* |
| 佣金自动化 | 交易标记 “已成交” 自动生成佣金（公司默认比例 / 单笔比例 + 公司分成），经纪人申请、经理审批，并有通知<br>*Marking a deal “closed” auto-creates commissions (company default rate / per-deal rate + company split); the agent requests, a manager approves, with notifications* |
| 报价流程 | 报价可 接受 / 还价 / 拒绝；接受后自动开单、房源变为 In Contract<br>*Offers can be accepted / countered / rejected; accepting auto-opens a deal and sets the listing to In Contract* |
| AI 技能 | 8 个技能：房源描述、社媒文案、新房源邮件、客户跟进、异议处理、开放日跟进、卖家需求访谈、挂牌演示提纲；全部带公平住房合规约束，只生成草稿。**目前标注为“正在开发”，暂未开放**，上线计划见 roadmap 阶段 4<br>*8 skills: listing description, social copy, new-listing email, client follow-up, objection handling, open-house follow-up, seller-needs interview, listing-presentation outline; all carry Fair Housing constraints and only draft. **Currently marked “in development” and not open**; see roadmap stage 4* |
| 预约提醒 | 预约前 24 小时自动站内提醒<br>*Automatic in-app reminder 24 hours before an appointment* |

## 尚未实现、建议后续排期 / Not yet built, suggested next

详细的执行计划（数据结构、接口、页面、验收标准、工作量和需要准备的账号）见 [`roadmap.md`](roadmap.md)。
See [`roadmap.md`](roadmap.md) for the detailed plans (data model, APIs, pages, acceptance criteria, effort and accounts needed).

- 线索自动分配规则（按区域 / 预算 / 轮询）——目前只支持经理手动指派。
  *Automatic lead routing rules (by area / budget / round-robin) — currently only manual assignment by a manager.*
- 短信 / WhatsApp / 邮件群发与收件箱（BrokerOS 的核心能力，需要接 Twilio / 邮件服务）。
  *SMS / WhatsApp / email blasts and an inbox (BrokerOS's core capability; needs Twilio / an email service).*
- 真正的文件上传存储（目前文档和照片是填链接；需接 Cloudflare R2 或 S3）。
  *Real file-upload storage (documents and photos are links today; needs Cloudflare R2 or S3).*
- Google 日历同步、DocuSign 电子签、Zillow / MLS 数据接入（目前界面上标记为 “即将推出” 或使用模拟数据）。
  *Google Calendar sync, DocuSign e-signature, Zillow / MLS data (marked “coming soon” in the UI or using mock data today).*
- 移动端 App / 一键拨号。
  *Mobile app / one-tap dialing.*
- 经纪人业绩目标与排行榜（已有排行榜雏形，可扩展为月度目标）。
  *Agent performance goals and leaderboards (a leaderboard prototype exists; extend to monthly goals).*
