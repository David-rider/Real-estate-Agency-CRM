# 安全检查报告（2026-10-22） / Security audit report (2026-10-22)

## 结论 / Conclusions

- **网站不是用 PHP 写的**：仓库里没有一个 PHP 文件，最近大量爆出的 PHP 网站漏洞（PHP 本身、WordPress、Laravel 等）都不影响本系统。
  **The site is not written in PHP**: there is not a single PHP file in the repo, so the recent wave of PHP vulnerabilities (PHP itself, WordPress, Laravel, etc.) does not affect this system.
- **技术栈 / Stack**：
  - 前端：TypeScript + Next.js 16.4.1 + React 19（部署在 Vercel）
    *Frontend: TypeScript + Next.js 16.4.1 + React 19 (on Vercel)*
  - 后端：TypeScript + Node.js 22 + Express 5.2 + Prisma 4.16 + PostgreSQL（部署在 Render）
    *Backend: TypeScript + Node.js 22 + Express 5.2 + Prisma 4.16 + PostgreSQL (on Render)*
- **线上环境没有已知的可利用漏洞 / No known exploitable vulnerability in production**：
  - 2026 年披露的 Next.js / React / Express 相关漏洞逐项核对过，要么已经修复，要么我们的用法不受影响。
    *The 2026 Next.js / React / Express disclosures were checked one by one: each is either fixed or does not affect how we use the library.*
  - 这次又补上了 7 处加固（见下文“本次修复”）。
    *This round adds 7 more hardening fixes (see “Fixes in this round” below).*

## 1. 第三方依赖 / Third-party dependencies

`npm audit --omit=dev`（线上实际运行的依赖）：前端、后端都是 **0 个漏洞**。
`npm audit --omit=dev` (the dependencies that actually run in production): **0 vulnerabilities** in both frontend and backend.

### 逐项核对 2026 年公开漏洞 / 2026 public vulnerabilities, checked one by one

| 组件<br>*Component* | 漏洞<br>*Vulnerability* | 我们的情况<br>*Our status* |
|---|---|---|
| Next.js | GHSA-673q-mjm6-r5xr：`use cache` 远程代码执行（严重）<br>*`use cache` remote code execution (critical)* | 16.4.1 已修复 ✅<br>*Fixed in 16.4.1* |
| Next.js | CVE-2026-96889：SVG 图片处理（sharp）远程代码执行（严重）<br>*RCE in SVG image handling (sharp) (critical)* | 16.4.1 已修复；同时已强制 sharp ≥ 0.35.5 ✅<br>*Fixed in 16.4.1; sharp ≥ 0.35.5 also enforced* |
| Next.js | GHSA-p3m5-59mp-jv5r：Server Actions 拒绝服务<br>*Server Actions denial of service* | 16.4.1 已修复；本项目也没用 Server Actions ✅<br>*Fixed in 16.4.1; this project does not use Server Actions anyway* |
| Next.js | CVE-2026-75604（Windows 路径穿越）、CVE-2026-44580（XSS）<br>*CVE-2026-75604 (Windows path traversal), CVE-2026-44580 (XSS)* | 早已修复 ✅<br>*Fixed long ago* |
| React | CVE-2025-55182 “React2Shell” 远程代码执行（严重，已被大规模利用）<br>*“React2Shell” RCE (critical, exploited at scale)* | 不受影响 ✅<br>*Not affected* |
| React | CVE-2026-23864 / CVE-2026-23870：Server Components 拒绝服务<br>*Server Components denial of service* | Next.js 内置的 React 是 2026-10 版本，不受影响。项目自身声明的 `react` 原为 19.2.3（在受影响范围内），**已升级到 19.2.9** ✅<br>*The React bundled with Next.js is the 2026-10 build and is not affected. The project's own `react` was 19.2.3 (in the affected range) and is **now upgraded to 19.2.9*** |
| Express 生态<br>*Express ecosystem* | CVE-2026-90711：`proxy-addr`（严重，影响识别真实 IP）<br>*`proxy-addr` (critical, affects real-IP detection)* | 已是修复版 2.0.8 ✅<br>*Already on the fixed 2.0.8* |
| Express 生态<br>*Express ecosystem* | compression / cookies / morgan / multiparty / hbs | 项目没有使用这些库 ✅<br>*The project does not use these libraries* |
| multer（文件上传）<br>*multer (file upload)* | CVE-2026-113872 等多个拒绝服务漏洞<br>*CVE-2026-113872 and other denial-of-service flaws* | 原 2.4.0，**已升级到 2.5.0** ✅<br>*Was 2.4.0, **upgraded to 2.5.0*** |
| 开发工具<br>*Dev tooling* | `braces`（经 nodemon / eslint 引入，高危）<br>*`braces` (via nodemon / eslint, high severity)* | 只在开发电脑上运行，不进入线上环境；上游暂未发布修复版，持续观察<br>*Runs only on developer machines, never in production; upstream has no fix yet, keep watching* |

## 2. 代码审查 / Code review

| 检查项<br>*Check* | 结果<br>*Result* |
|---|---|
| SQL 注入<br>*SQL injection* | ✅ 全部通过 Prisma 参数化查询；仅有的几处原生 SQL 都使用带参数的模板写法<br>*All queries go through Prisma's parameterized API; the few raw SQL statements use parameterized template literals* |
| XSS（跨站脚本）<br>*XSS (cross-site scripting)* | ✅ React 默认会转义输出；唯一的 `dangerouslySetInnerHTML` 输出的是固定的 SEO 数据。本次修复了房源“虚拟看房”链接可以填 `javascript:` 的问题<br>*React escapes output by default; the only `dangerouslySetInnerHTML` renders fixed SEO data. This round also fixed the listing “virtual tour” link accepting `javascript:`* |
| 跨公司数据隔离<br>*Cross-company data isolation* | ✅ 所有查询都按公司限定；引用其他记录时会校验归属（自动化测试覆盖）<br>*Every query is scoped by company; referenced records are ownership-checked (covered by automated tests)* |
| 登录与令牌<br>*Login & tokens* | ✅ bcrypt 存储密码；登录有频率限制；账号停用后最多 30 秒失效。本次进一步限定 JWT 只接受 HS256 签名算法<br>*Passwords stored with bcrypt; login is rate-limited; a deactivated account stops working within 30 seconds. This round also restricts JWT to the HS256 algorithm* |
| 权限提升<br>*Privilege escalation* | ✅ 经理不能授予管理员角色；任何人都不能修改同级或更高级别用户的角色；邀请的角色由服务器决定<br>*Managers cannot grant the admin role; nobody can change the role of a peer or higher-level user; the invited role is decided by the server* |
| 密码重置<br>*Password reset* | ⚠️→✅ 原来重置令牌以明文存在数据库里，**已改为只存哈希值**；令牌 1 小时过期，用过即失效<br>*Reset tokens used to be stored in plain text; they are **now stored hashed only**; tokens expire after 1 hour and are single-use* |
| 注册密码强度<br>*Sign-up password strength* | ⚠️→✅ 原来注册时任何密码都能用（1 位也行），**已要求至少 8 位**<br>*Any password (even 1 character) used to be accepted; **at least 8 characters is now required*** |
| 错误信息泄露<br>*Error leakage* | ⚠️→✅ 支付相关的 3 个接口原来会把 Stripe 的内部错误原文返回给用户，**已改为通用提示**<br>*Three payment endpoints used to return Stripe's raw internal error to users; they **now return a generic message*** |
| 安全响应头<br>*Security headers* | ⚠️→✅ API 新增 nosniff、禁止被嵌入页面、CSP、HSTS 等响应头，并隐藏 `X-Powered-By`；前端新增 HSTS<br>*The API now sends nosniff, anti-framing, CSP and HSTS headers and hides `X-Powered-By`; the frontend gains HSTS* |
| 公开表单<br>*Public forms* | ✅ 有频率限制和反机器人字段<br>*Rate-limited, with an anti-bot field* |
| Stripe Webhook | ✅ 校验签名；生产环境没配置密钥时直接拒绝<br>*Signature is verified; in production it is rejected outright if no secret is configured* |
| 社交登录<br>*Social login* | ✅ 上一轮已修复（Apple 登录关闭；Google 登录必须校验身份；新用户不会被加入他人公司）<br>*Fixed in the previous round (Apple login off; Google login must verify identity; new users are never added to someone else's company)* |
| 密钥泄露<br>*Secret leakage* | ✅ 扫描了全部 git 历史，只有 `xxxx` 这样的占位符，从未提交过 `.env` 文件。泄露的默认账号已在 1.0.0 删除<br>*The whole git history was scanned: only placeholders like `xxxx`, and no `.env` file was ever committed. The leaked default accounts were deleted in 1.0.0* |

## 3. 本次修复（随下一个版本上线） / Fixes in this round (shipping with the next version)

1. `react` / `react-dom` 19.2.3 → 19.2.9
2. `multer` 2.4.0 → 2.5.0
3. 注册时密码至少 8 位 / Passwords must be at least 8 characters at sign-up
4. 密码重置令牌改为哈希存储 / Password-reset tokens are stored hashed
5. JWT 只接受 HS256 签名 / JWT accepts HS256 signatures only
6. 支付接口不再返回内部错误详情 / Payment endpoints no longer return internal error details
7. API 和前端增加安全响应头；房源链接只允许 http/https / Security headers added to the API and frontend; listing links allow only http/https

自动化测试新增“安全基础”检查（密码强度、危险链接、响应头、伪造令牌），共 18 项全部通过。
The automated tests gained “security basics” checks (password strength, dangerous links, headers, forged tokens); all 18 pass.

## 4. 剩余风险与后续计划 / Remaining risks and next steps

已列入 `guides/roadmap.md`：
Tracked in `guides/roadmap.md`:

| 风险<br>*Risk* | 说明<br>*Description* | 建议<br>*Recommendation* |
|---|---|---|
| 登录令牌存在浏览器 localStorage<br>*Login token kept in browser localStorage* | 如果将来出现 XSS 漏洞，令牌可能被窃取。目前没有发现 XSS<br>*If an XSS flaw ever appears, the token could be stolen. No XSS has been found so far* | 改为 httpOnly Cookie + CSRF 防护（1.1.0）<br>*Switch to an httpOnly cookie + CSRF protection (1.1.0)* |
| 前端没有完整的 CSP<br>*No full CSP on the frontend* | 少了一层防 XSS 的保护<br>*One layer of XSS defense is missing* | 先以只报告模式上线，观察后再正式启用（1.1.0）<br>*Ship in report-only mode first, enforce after observation (1.1.0)* |
| Prisma 4.16 版本较老<br>*Prisma 4.16 is old* | 目前没有已知漏洞，但官方已不再维护<br>*No known vulnerability, but it is no longer maintained upstream* | 规划升级到当前版本（需要单独测试，1.2.0）<br>*Plan an upgrade to the current version (needs separate testing, 1.2.0)* |
| 开发工具依赖 `braces`<br>*Dev-tool dependency `braces`* | 只影响开发电脑<br>*Affects developer machines only* | 上游发布修复后升级<br>*Upgrade once upstream ships a fix* |
| 没有自动依赖巡检<br>*No automatic dependency scanning* | 新漏洞要靠人工发现<br>*New vulnerabilities must be found by hand* | 开启 GitHub Dependabot 和安全告警（几分钟就能设置好，建议马上开）<br>*Enable GitHub Dependabot and security alerts (a few minutes to set up — do it now)* |

## 参考来源 / References

- [Next.js 16.4.1 安全更新（Netlify 汇总）](https://www.netlify.com/changelog/2026-10-14-nextjs-react-security-vulnerabilities/) — *Next.js 16.4.1 security update (Netlify summary)*
- [The Hacker News：Next.js 两个严重 RCE 漏洞](https://thehackernews.com/2026/10/nextjs-ships-out-of-band-patch-for-two.html) — *The Hacker News: two critical Next.js RCE flaws*
- [React Server Components 拒绝服务漏洞（Fastly）](https://www.fastly.com/blog/what-is-cve-2026-23869-react-server-components-security-alert) — *React Server Components denial of service (Fastly)*
- [React2Shell（React 官方公告）](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components) — *React2Shell (official React advisory)*
- [Express 2026 年 9 月安全公告](https://expressjs.com/en/blog/2026-09-30-security-releases/) — *Express September 2026 security releases*
- [multer CVE-2026-113872](https://www.strix.ai/cve/CVE-2026-113872)
