# 安全政策 / Security Policy

## 如何报告漏洞 / How to report a vulnerability

如果你发现了安全漏洞，请**不要**在公开的 Issue、Pull Request 或讨论区里描述它。请用 GitHub 的私下报告功能：

1. 打开本仓库的 **Security** 标签页。
2. 点击 **Report a vulnerability**（报告漏洞）。
3. 写清楚：受影响的页面或接口、复现步骤、你认为的影响范围。

如果你在 Security 标签页里看不到这个按钮，说明仓库管理员还没有开启私下报告。这时请新建一个 Issue，**只写“我想私下报告一个安全问题，请联系我”**，不要写任何漏洞细节，管理员会通过 GitHub 与你联系。

If you find a security vulnerability, please **do not** describe it in a public issue, pull request or discussion. Use GitHub's private reporting instead:

1. Open the **Security** tab of this repository.
2. Click **Report a vulnerability**.
3. Include the affected page or endpoint, the steps to reproduce, and the impact you believe it has.

If you do not see that button, the repository admin has not turned on private reporting yet. In that case open an issue that says **only “I would like to report a security issue privately, please contact me”**, with no details of the vulnerability; the admin will contact you through GitHub.

## 我们会怎么处理 / What happens next

- 我们会尽快确认收到，并在评估后告诉你是否属于漏洞以及修复计划。这是一个小型项目，不承诺固定的响应时间。
  We will acknowledge your report as soon as we can and tell you after assessment whether it is a vulnerability and what the fix plan is. This is a small project and we do not promise a fixed response time.
- 修复发布之前，请不要公开漏洞细节；发布后我们会在 `CHANGELOG.md` 的“安全”部分记录，并按你的意愿署名致谢。
  Please keep the details private until a fix is released; afterwards we record it under “安全” (Security) in `CHANGELOG.md` and credit you if you wish.

## 范围 / Scope

- 在范围内：本仓库的代码（`backend/`、`frontend/`），以及按此代码部署的线上服务。
  In scope: the code in this repository (`backend/`, `frontend/`) and the live services deployed from it.
- 不在范围内：第三方服务本身（Vercel、Render、Neon、Stripe 等）的问题，请向对应的服务商报告；以及对其他客户数据的访问、拒绝服务、社会工程或物理攻击等测试。
  Out of scope: problems in third-party services themselves (Vercel, Render, Neon, Stripe, etc.), which should be reported to those providers; and testing that involves accessing other customers' data, denial of service, social engineering or physical attacks.
- 测试时请只使用你自己创建的账号和数据。
  When testing, use only accounts and data that you created yourself.

## 支持的版本 / Supported versions

只有 `main` 分支和线上正在运行的最新版本（可通过 `GET /api/health` 返回的 `version` 确认）会得到安全修复。
Only the `main` branch and the latest live version (check the `version` returned by `GET /api/health`) receive security fixes.
