# 安全检查报告（2026-10-22）

## 结论

- **网站不是用 PHP 写的**：仓库里没有一个 PHP 文件，最近大量爆出的 PHP 网站漏洞（PHP 本身、WordPress、Laravel 等）都不影响本系统。
- **技术栈**：
  - 前端：TypeScript + Next.js 16.4.1 + React 19（部署在 Vercel）
  - 后端：TypeScript + Node.js 22 + Express 5.2 + Prisma 4.16 + PostgreSQL（部署在 Render）
- **线上环境没有已知的可利用漏洞**：
  - 2026 年披露的 Next.js / React / Express 相关漏洞逐项核对过，要么已经修复，要么我们的用法不受影响。
  - 这次又补上了 7 处加固（见下文“本次修复”）。

## 1. 第三方依赖

`npm audit --omit=dev`（线上实际运行的依赖）：前端、后端都是 **0 个漏洞**。

### 逐项核对 2026 年公开漏洞

| 组件 | 漏洞 | 我们的情况 |
|---|---|---|
| Next.js | GHSA-673q-mjm6-r5xr：`use cache` 远程代码执行（严重） | 16.4.1 已修复 ✅ |
| Next.js | CVE-2026-96889：SVG 图片处理（sharp）远程代码执行（严重） | 16.4.1 已修复；同时已强制 sharp ≥ 0.35.5 ✅ |
| Next.js | GHSA-p3m5-59mp-jv5r：Server Actions 拒绝服务 | 16.4.1 已修复；本项目也没用 Server Actions ✅ |
| Next.js | CVE-2026-75604（Windows 路径穿越）、CVE-2026-44580（XSS） | 早已修复 ✅ |
| React | CVE-2025-55182 “React2Shell” 远程代码执行（严重，已被大规模利用） | 不受影响 ✅ |
| React | CVE-2026-23864 / CVE-2026-23870：Server Components 拒绝服务 | Next.js 内置的 React 是 2026-10 版本，不受影响。项目自身声明的 `react` 原为 19.2.3（在受影响范围内），**已升级到 19.2.9** ✅ |
| Express 生态 | CVE-2026-90711：`proxy-addr`（严重，影响识别真实 IP） | 已是修复版 2.0.8 ✅ |
| Express 生态 | compression / cookies / morgan / multiparty / hbs | 项目没有使用这些库 ✅ |
| multer（文件上传） | CVE-2026-113872 等多个拒绝服务漏洞 | 原 2.4.0，**已升级到 2.5.0** ✅ |
| 开发工具 | `braces`（经 nodemon / eslint 引入，高危） | 只在开发电脑上运行，不进入线上环境；上游暂未发布修复版，持续观察 |

## 2. 代码审查

| 检查项 | 结果 |
|---|---|
| SQL 注入 | ✅ 全部通过 Prisma 参数化查询；仅有的几处原生 SQL 都使用带参数的模板写法 |
| XSS（跨站脚本） | ✅ React 默认会转义输出；唯一的 `dangerouslySetInnerHTML` 输出的是固定的 SEO 数据。本次修复了房源“虚拟看房”链接可以填 `javascript:` 的问题 |
| 跨公司数据隔离 | ✅ 所有查询都按公司限定；引用其他记录时会校验归属（自动化测试覆盖） |
| 登录与令牌 | ✅ bcrypt 存储密码；登录有频率限制；账号停用后最多 30 秒失效。本次进一步限定 JWT 只接受 HS256 签名算法 |
| 权限提升 | ✅ 经理不能授予管理员角色；任何人都不能修改同级或更高级别用户的角色；邀请的角色由服务器决定 |
| 密码重置 | ⚠️→✅ 原来重置令牌以明文存在数据库里，**已改为只存哈希值**；令牌 1 小时过期，用过即失效 |
| 注册密码强度 | ⚠️→✅ 原来注册时任何密码都能用（1 位也行），**已要求至少 8 位** |
| 错误信息泄露 | ⚠️→✅ 支付相关的 3 个接口原来会把 Stripe 的内部错误原文返回给用户，**已改为通用提示** |
| 安全响应头 | ⚠️→✅ API 新增 nosniff、禁止被嵌入页面、CSP、HSTS 等响应头，并隐藏 `X-Powered-By`；前端新增 HSTS |
| 公开表单 | ✅ 有频率限制和反机器人字段 |
| Stripe Webhook | ✅ 校验签名；生产环境没配置密钥时直接拒绝 |
| 社交登录 | ✅ 上一轮已修复（Apple 登录关闭；Google 登录必须校验身份；新用户不会被加入他人公司） |
| 密钥泄露 | ✅ 扫描了全部 git 历史，只有 `xxxx` 这样的占位符，从未提交过 `.env` 文件。泄露的默认账号已在 1.0.0 删除 |

## 3. 本次修复（随下一个版本上线）

1. `react` / `react-dom` 19.2.3 → 19.2.9
2. `multer` 2.4.0 → 2.5.0
3. 注册时密码至少 8 位
4. 密码重置令牌改为哈希存储
5. JWT 只接受 HS256 签名
6. 支付接口不再返回内部错误详情
7. API 和前端增加安全响应头；房源链接只允许 http/https

自动化测试新增“安全基础”检查（密码强度、危险链接、响应头、伪造令牌），共 18 项全部通过。

## 4. 剩余风险与后续计划

已列入 `guides/roadmap.md`：

| 风险 | 说明 | 建议 |
|---|---|---|
| 登录令牌存在浏览器 localStorage | 如果将来出现 XSS 漏洞，令牌可能被窃取。目前没有发现 XSS | 改为 httpOnly Cookie + CSRF 防护（1.1.0） |
| 前端没有完整的 CSP | 少了一层防 XSS 的保护 | 先以只报告模式上线，观察后再正式启用（1.1.0） |
| Prisma 4.16 版本较老 | 目前没有已知漏洞，但官方已不再维护 | 规划升级到当前版本（需要单独测试，1.2.0） |
| 开发工具依赖 `braces` | 只影响开发电脑 | 上游发布修复后升级 |
| 没有自动依赖巡检 | 新漏洞要靠人工发现 | 开启 GitHub Dependabot 和安全告警（几分钟就能设置好，建议马上开） |

## 参考来源

- [Next.js 16.4.1 安全更新（Netlify 汇总）](https://www.netlify.com/changelog/2026-10-14-nextjs-react-security-vulnerabilities/)
- [The Hacker News：Next.js 两个严重 RCE 漏洞](https://thehackernews.com/2026/10/nextjs-ships-out-of-band-patch-for-two.html)
- [React Server Components 拒绝服务漏洞（Fastly）](https://www.fastly.com/blog/what-is-cve-2026-23869-react-server-components-security-alert)
- [React2Shell（React 官方公告）](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components)
- [Express 2026 年 9 月安全公告](https://expressjs.com/en/blog/2026-09-30-security-releases/)
- [multer CVE-2026-113872](https://www.strix.ai/cve/CVE-2026-113872)
