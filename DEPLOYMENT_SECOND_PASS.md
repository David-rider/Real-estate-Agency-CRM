# 二次完善部署说明 — 需人工配置的外部服务

> 本文件列出所有**无法纯靠代码完成、需要人工在外部平台注册/配置后回填至环境变量**的功能模块。  
> 代码侧占位已全部写好，按下方步骤填入 `.env` 即可激活对应功能。

---

## 1. 数据库 — PostgreSQL 托管

**用途：** 存储所有业务数据（用户、房源、交易、佣金等）

### 推荐方案（二选一）
| 方案 | 免费额度 | 适合阶段 |
|------|---------|---------|
| [Supabase](https://supabase.com) | 500MB / 2个项目 | 开发 / 小规模上线 |
| [Railway](https://railway.app) | $5/月起 | 生产 |

### 配置步骤
1. 在 Supabase / Railway 创建 PostgreSQL 数据库
2. 复制 Connection String（格式：`postgresql://user:pass@host:5432/dbname`）
3. 填入 `backend/.env`：
```env
DATABASE_URL="postgresql://user:password@host:5432/real_estate_crm?sslmode=require"
```
4. 执行数据库迁移：
```bash
cd backend && npx prisma migrate deploy && npx prisma db seed
```

---

## 2. 邮件系统 — Transactional Email

**用途：** 注册验证、密码重置、交易节点提醒、约看通知

### 推荐方案（二选一）
| 方案 | 免费额度 | 备注 |
|------|---------|------|
| [Resend](https://resend.com) | 3,000封/月 | 开发者友好，API 简单 |
| [SendGrid](https://sendgrid.com) | 100封/天 | 企业级，功能全 |

### 配置步骤
1. 注册账号，获取 API Key
2. 验证发件域名（添加 DNS SPF / DKIM 记录）
3. 填入 `backend/.env`：
```env
EMAIL_PROVIDER="resend"          # 或 "sendgrid"
EMAIL_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="Your Brokerage Name"
```

---

## 3. 支付系统 — Stripe

**用途：** PRO / ELITE 订阅收费、自动续费、发票生成

### 配置步骤
1. 注册 [Stripe](https://stripe.com) 账号（需美国/海外银行账户收款）
2. 在 Stripe Dashboard → Developers → API Keys 获取密钥
3. 在 Stripe Dashboard → Products 创建订阅产品：
   - `PRO Monthly` → $39/月（记录 Price ID）
   - `PRO Annual` → $390/年
   - `ELITE Monthly` → $79/月
   - `ELITE Annual` → $790/年
4. 创建 Webhook：Dashboard → Webhooks → Add endpoint
   - URL：`https://yourdomain.com/api/payments/webhook`
   - 监听事件：`checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
5. 填入 `backend/.env`：
```env
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxx"
STRIPE_PRICE_PRO_MONTHLY="price_xxxxxxxxxxxx"
STRIPE_PRICE_PRO_ANNUAL="price_xxxxxxxxxxxx"
STRIPE_PRICE_ELITE_MONTHLY="price_xxxxxxxxxxxx"
STRIPE_PRICE_ELITE_ANNUAL="price_xxxxxxxxxxxx"
```
6. 填入 `frontend/.env.local`：
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxxxx"
```

---

## 4. Google OAuth 登录

**用途：** 用户使用 Google 账号一键登录

### 配置步骤
1. 访问 [Google Cloud Console](https://console.cloud.google.com)
2. 创建项目 → APIs & Services → Credentials → OAuth 2.0 Client ID
3. 应用类型选 **Web Application**
4. 添加授权来源：`https://yourdomain.com`
5. 添加重定向 URI：`https://yourdomain.com/api/oauth/google/callback`
6. 获取 Client ID 和 Client Secret
7. 填入 `backend/.env`：
```env
GOOGLE_CLIENT_ID="xxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxx"
```
8. 填入 `frontend/.env.local`：
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="xxxxxxxxxxxx.apps.googleusercontent.com"
```

---

## 5. Apple Sign In

**用途：** 用户使用 Apple 账号一键登录（iOS / macOS 用户必需）

### 配置步骤
1. 需要 [Apple Developer 账号](https://developer.apple.com)（$99/年）
2. Certificates → Identifiers → 注册 App ID，勾选 Sign In with Apple
3. 创建 Services ID，配置 Domain 和 Return URL
4. Keys → 创建 Sign In with Apple 密钥，下载 `.p8` 文件
5. 填入 `backend/.env`：
```env
APPLE_CLIENT_ID="com.yourcompany.realestate"
APPLE_TEAM_ID="XXXXXXXXXX"
APPLE_KEY_ID="XXXXXXXXXX"
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

---

## 6. 文件存储 — 房源图片 / 合同文件

**用途：** 房源图片上传、合同文件存储、导出报告

### 推荐方案（二选一）
| 方案 | 免费额度 | 备注 |
|------|---------|------|
| [Cloudflare R2](https://cloudflare.com/r2) | 10GB / 月 | 无出口流量费，推荐 |
| [AWS S3](https://aws.amazon.com/s3) | 5GB（12个月） | 行业标准 |

### Cloudflare R2 配置步骤
1. Cloudflare Dashboard → R2 → 创建 Bucket
2. Account Settings → API Tokens → 创建 R2 Token
3. 填入 `backend/.env`：
```env
STORAGE_PROVIDER="r2"            # 或 "s3"
R2_ACCOUNT_ID="xxxxxxxxxxxx"
R2_ACCESS_KEY_ID="xxxxxxxxxxxx"
R2_SECRET_ACCESS_KEY="xxxxxxxxxxxx"
R2_BUCKET_NAME="real-estate-crm"
R2_PUBLIC_URL="https://pub-xxxxxxxxxxxx.r2.dev"
```

---

## 7. AI 交互 — 房源描述生成 / 客户沟通助手

**用途：** 自动生成房源描述文案、营销文案、智能客户回复

### 推荐方案
| 方案 | 价格 | 备注 |
|------|------|------|
| [Anthropic Claude API](https://console.anthropic.com) | 按 Token 计费 | 文案质量最佳 |
| [OpenAI GPT-4o](https://platform.openai.com) | 按 Token 计费 | 生态最广 |

### 配置步骤
1. 注册 Anthropic Console，创建 API Key
2. 填入 `backend/.env`：
```env
AI_PROVIDER="anthropic"          # 或 "openai"
ANTHROPIC_API_KEY="sk-ant-xxxxxxxxxxxx"
OPENAI_API_KEY="sk-xxxxxxxxxxxx" # 备用
```

---

## 8. 电子签名 — 合同签署

**用途：** 房产买卖合同、租赁协议在线签署

### 推荐方案
| 方案 | 价格 | 备注 |
|------|------|------|
| [DocuSign](https://docusign.com) | $25/月起 | 行业标准，法律效力强 |
| [HelloSign](https://hellosign.com) | $20/月起 | Dropbox 旗下，更简单 |

### DocuSign 配置步骤
1. 注册账号 → 获取 Integration Key
2. 生成 RSA 密钥对，上传公钥到 DocuSign
3. 填入 `backend/.env`：
```env
DOCUSIGN_INTEGRATION_KEY="xxxxxxxxxxxx"
DOCUSIGN_USER_ID="xxxxxxxxxxxx"
DOCUSIGN_ACCOUNT_ID="xxxxxxxxxxxx"
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_BASE_URL="https://na4.docusign.net"
```

---

## 9. 域名 & DNS 配置

**用途：** 自定义域名访问（如 `app.yourbrokerage.com`）

### 配置步骤
1. 购买域名（[Cloudflare Registrar](https://cloudflare.com) 推荐，无附加费）
2. 在托管平台（Vercel / Railway）绑定自定义域名
3. 在 DNS 添加以下记录：

| 类型 | 名称 | 值 | 说明 |
|------|------|-----|------|
| CNAME | `app` | `cname.vercel-dns.com` | 前端 |
| CNAME | `api` | `your-railway-app.railway.app` | 后端 |
| TXT | `@` | SendGrid/Resend SPF 记录 | 邮件认证 |
| CNAME | `em` | SendGrid CNAME | 邮件 DKIM |

4. 填入 `backend/.env`：
```env
APP_URL="https://app.yourdomain.com"
API_URL="https://api.yourdomain.com"
FRONTEND_URL="https://app.yourdomain.com"
```

---

## 10. MLS 房产数据接入（纽约专项）

**用途：** 实时纽约 MLS 房源数据，避免手动录入

### 纽约主要 MLS 系统
| 系统 | 覆盖区域 | 申请方式 |
|------|---------|---------|
| [RLS（Residential Listing Service）](https://www.rebny.com/content/rebny/en/industry-resources/rls.html) | 曼哈顿 | 需 REBNY 会员资格 |
| [MLSLI](https://www.mlsli.com) | 长岛 / 昆斯 | 需经纪人执照 |
| [OneKey MLS](https://www.onekeymls.com) | 大纽约区 | 需 NAR 会员 |

### 接入步骤
1. 申请 MLS 会员资格（需持牌经纪公司）
2. 申请 RESO Web API 或 RETS 访问权限
3. 填入 `backend/.env`：
```env
MLS_PROVIDER="onekeymls"
MLS_API_URL="https://api.onekeymls.com/reso/odata"
MLS_CLIENT_ID="xxxxxxxxxxxx"
MLS_CLIENT_SECRET="xxxxxxxxxxxx"
```

---

## 11. 地图服务

**用途：** 房源地图展示、按地铁站/学区搜索

### 配置步骤
1. 注册 [Mapbox](https://mapbox.com) 账号（每月 50,000 次免费）
2. Dashboard → Tokens → 创建 Public Token（仅限 styles + tiles）
3. 填入 `frontend/.env.local`：
```env
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1Ijoixxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 12. 错误监控 — Sentry

**用途：** 生产环境错误实时告警、性能监控

### 配置步骤
1. 注册 [Sentry](https://sentry.io)（免费 5,000 errors/月）
2. 创建两个 Project：一个 Node.js（后端），一个 Next.js（前端）
3. 填入 `backend/.env`：
```env
SENTRY_DSN="https://xxxxxxxxxxxx@oxxxxxxxxxxxx.ingest.sentry.io/xxxxxxxxxxxx"
```
4. 填入 `frontend/.env.local`：
```env
NEXT_PUBLIC_SENTRY_DSN="https://xxxxxxxxxxxx@oxxxxxxxxxxxx.ingest.sentry.io/xxxxxxxxxxxx"
```

---

## 完整 `.env` 模板

完整模板已生成至 `backend/.env.example` 和 `frontend/.env.local.example`。

按以下顺序配置，每完成一项即可激活对应功能：

```
优先级 1（上线必须）：  DATABASE_URL, JWT_SECRET, APP_URL
优先级 2（用户注册）：  EMAIL_API_KEY, EMAIL_FROM
优先级 3（收费功能）：  STRIPE_SECRET_KEY 及相关 Price IDs
优先级 4（OAuth）：     GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
优先级 5（文件上传）：  R2_* 或 S3_* 相关变量
优先级 6（AI功能）：    ANTHROPIC_API_KEY
优先级 7（可选）：      DOCUSIGN_*, MLS_*, SENTRY_DSN, MAPBOX_TOKEN
```
