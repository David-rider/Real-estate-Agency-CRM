# 同类开源经纪人平台调研（2026-10）

在 GitHub 上搜索 "real estate CRM / realtor CRM / brokerage" 等关键词，挑出与我们定位最接近的项目，
记录它们值得借鉴的做法，以及我们这次已经吸收进系统的部分。

## 调研对象

| 项目 | 技术栈 | 定位 | 许可 |
|---|---|---|---|
| [prolinkinfo/RealEstateCRM](https://github.com/prolinkinfo/RealEstateCRM) | MERN | 最受欢迎的开源经纪人 CRM（360+ stars），客户/房源/沟通管理 | MIT |
| [trybrokeros/BrokerOS](https://github.com/trybrokeros/BrokerOS) | NestJS + Next.js 16 + Expo | 面向经纪公司和渠道合作方的完整运营系统 | MIT |
| [eprobertson001/real_estate_CRM](https://github.com/eprobertson001/real_estate_CRM) | Next.js + Prisma | 交易管理、合同 AI 解析、MLS、Dotloop 签字 | 未声明 |
| [ahmedsaadawi13/splash-lead-router](https://github.com/ahmedsaadawi13/splash-lead-router) | PHP / MySQL | 多租户线索自动分配（按区域、预算、经纪人负载） | 未声明 |
| [tobywashere/open-house-intelligence-crm](https://github.com/tobywashere/open-house-intelligence-crm) | Python + React | 本地 AI 经纪人 CRM，AI 改动需人工审批 | 未声明 |
| [AmazingPhotoVideo/ai-for-realtors](https://github.com/AmazingPhotoVideo/ai-for-realtors) | Prompt / Claude Skills | 经纪人 AI 提示词与 Claude Skills 合集 | **无许可证** |

> ai-for-realtors 没有开源许可证，因此只借鉴了思路，所有提示词都是我们自己重新写的，没有复制原文。

## 值得借鉴的经验

1. **Speed-to-lead（5 分钟响应）**：多个项目都强调网站 / 开放日线索必须立即进入 CRM 并提醒经纪人。
2. **线索温度 / 评分**（BrokerOS）：Hot / Warm / Cold，让经纪人优先处理高意向客户。
3. **跟进积压（Backlog）**（BrokerOS）：没跟进的客户自动进入待办，避免线索流失。
4. **完整活动时间线**：每一次电话、邮件、带看、报价都记录在客户名下。
5. **合同到过户清单模板**（eprobertson001）：开单后自动生成标准任务和截止日期。
6. **佣金锁定与审批流程**（BrokerOS）：成交后自动计算佣金，经理审批发放。
7. **线索分配规则**（splash-lead-router）：按区域、预算、负载自动分配给经纪人。
8. **AI 技能化**（ai-for-realtors）：把常用场景做成固定“技能”——房源文案、异议处理、卖家需求访谈、
   上门挂牌演示、开放日跟进、客户跟进。注意公平住房（Fair Housing）合规用语。
9. **AI 改动需人工确认**（open-house-intelligence）：AI 只生成草稿，不直接改数据。
10. **开放日二维码签到**：无需安装 App，访客扫码即成为线索。

## 本次已落地到系统的功能

| 借鉴点 | 我们的实现 |
|---|---|
| Speed-to-lead | 公开房源详情页 + 咨询表单 → 自动创建 HOT 客户、记录留言、生成 15 分钟内回电的紧急任务、通知挂牌经纪人 |
| 开放日签到 | 房源卡片上的 “QR” 按钮复制签到链接（`?openhouse=1`），打印成二维码即可 |
| 线索温度 | 客户新增 Hot / Warm / Cold 优先级，列表可筛选并显示标签 |
| 跟进积压 | “待跟进” 筛选（14 天未联系）+ 仪表盘 “待跟进客户” 卡片；记录活动时可设定跟进提醒 |
| 活动时间线 | 电话 / 邮件 / 短信 / 会面 / 带看 / 备注全部记录，并自动更新 “最近联系” |
| 过户清单 | 新建交易或接受报价时自动生成 8–10 项清单任务（按合同日期、过户日期排期） |
| 佣金自动化 | 交易标记 “已成交” 自动生成佣金（公司默认比例 / 单笔比例 + 公司分成），经纪人申请、经理审批，并有通知 |
| 报价流程 | 报价可 接受 / 还价 / 拒绝；接受后自动开单、房源变为 In Contract |
| AI 技能 | 8 个技能：房源描述、社媒文案、新房源邮件、客户跟进、异议处理、开放日跟进、卖家需求访谈、挂牌演示提纲；全部带公平住房合规约束，只生成草稿 |
| 预约提醒 | 预约前 24 小时自动站内提醒 |

## 尚未实现、建议后续排期

- 线索自动分配规则（按区域 / 预算 / 轮询）——目前只支持经理手动指派。
- 短信 / WhatsApp / 邮件群发与收件箱（BrokerOS 的核心能力，需要接 Twilio / 邮件服务）。
- 真正的文件上传存储（目前文档和照片是填链接；需接 Cloudflare R2 或 S3）。
- Google 日历同步、DocuSign 电子签、Zillow / MLS 数据接入（目前界面上标记为 “即将推出” 或使用模拟数据）。
- 移动端 App / 一键拨号。
- 经纪人业绩目标与排行榜（已有排行榜雏形，可扩展为月度目标）。
