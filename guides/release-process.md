# 发版流程（Release process）

每次功能迭代或修复都按这个流程走，确保**改了什么、什么时候上线、线上是哪个版本**都有据可查。

## 记录放在哪里

| 记录 | 位置 | 什么时候更新 |
|---|---|---|
| 每次改动的说明 | `CHANGELOG.md` 的 **[未发布]** 部分 | 每个 PR 合并前 |
| 版本号 | `backend/package.json`、`frontend/package.json` 的 `appVersion`（`version` 保留前 3 段供 npm/Prisma 解析） | 发版时 |
| 功能计划与进度 | `guides/roadmap.md` 的“进度跟踪”表 | 开始做 / 做完一项时 |
| 线上版本 | `GET https://real-estate-agency-crm.onrender.com/api/health` 返回的 `version` | 部署后核对 |
| 版本标签 | git tag `vX.Y.Z.W`，对应 `main` 上的合并提交 | 发版时 |
| 试用测试清单 | `guides/testing-checklist.md` | 新功能需要客户验证时 |

## 版本号规则（四段式版本号 `X.Y.Z.W`）

项目采用 **四段式版本号**（`主版本.次版本.修订号.构建/微调号`，例如 `1.0.1.0`）：
- **第 4 段（构建 / 微调号）** `1.0.1.x`：日常小修补、文案/样式微调、CI 或配置调整，不涉及功能或数据库变更。
- **第 3 段（修订号）** `1.0.x.0`：只修 bug 或安全加固，不加功能，数据库不变。
- **第 2 段（次版本）** `1.x.0.0`：新增功能；数据库只新增表或字段（迁移必须幂等）。
- **第 1 段（主版本）** `x.0.0.0`：不兼容的改动（删除或重命名字段、改接口、需要人工处理数据），必须提前通知客户。

## 日常开发（每个改动）

1. 从最新的 `main` 开分支。
2. 写代码；数据库改动要加**幂等**迁移（`IF NOT EXISTS`），部署时会自动执行。
3. 在 `backend/tests/smoke.ts` 增加对应的检查。
4. 在 `CHANGELOG.md` 的 **[未发布]** 下按“新增 / 修复 / 安全 / 变更 / 移除”分类写一两句话，说清楚用户能感受到的变化。
5. 如果做的是 roadmap 上的事项，更新 `guides/roadmap.md` 进度表里的状态。
6. 自检：
   ```bash
   cd backend && npx tsc --skipLibCheck --noEmit && API_URL=http://localhost:4000 npm run test:smoke
   cd ../frontend && npx tsc --noEmit -p . && npx next build
   ```
7. 提 PR，描述里列出改动和测试结果。

## 发版（把若干改动正式上线）

1. 确定版本号（按上面的规则）。
2. 修改 `backend/package.json` 和 `frontend/package.json` 的 `appVersion`（4 段式 `X.Y.Z.W`）及 `version`（前 3 段 `X.Y.Z`）。`package-lock.json` 里只改 `version`（3 段），不要重新生成整个文件。
3. 在 `CHANGELOG.md` 中把 **[未发布]** 改成 `## [X.Y.Z.W] — YYYY-MM-DD · 一句话概括`，再在上面新建一个空的 **[未发布]**。
4. 合并 PR 到 `main`：
   - 前端由 GitHub Action 触发 Vercel 部署；
   - 后端由 Render 自动部署，启动前会自动完成数据库迁移。
5. 核对线上版本：
   ```bash
   curl https://real-estate-agency-crm.onrender.com/api/health   # version 应为 X.Y.Z.W
   ```
   在 Render 日志里搜索 `[release]`，确认迁移成功。
6. 打版本标签（在本地执行）：
   ```bash
   git checkout main && git pull
   git tag -a vX.Y.Z.W -m "vX.Y.Z.W — 一句话概括"
   git push origin vX.Y.Z.W
   ```
   可选：在 GitHub 的 Releases 页面用这个标签创建 Release，正文复制 CHANGELOG 中该版本的内容。
7. 在 `CHANGELOG.md` 该版本下补一行“已部署，线上已确认”（可以放进下一个 PR）。

## 出问题时回滚

- **前端**：在 Vercel 控制台把上一次部署设为 Production（Promote）。
- **后端**：在 Render 控制台选择上一次部署，点 Rollback。
  - 迁移只新增、不删除，所以旧版本代码可以直接运行在新的数据库上。
- 回滚后在 CHANGELOG 里记录原因，修复后发一个修订版本。

## 版本历史

| 版本 | 日期 | 概括 | git 标签 |
|---|---|---|---|
| 1.1.0.0 | 2026-10-26 | 核心痛点闭环（文件直传、线索自动分配、邮件提醒、品牌短链、CSV 批量导入）与安全加固（httpOnly Cookie/CSRF、CSP、CI、Sentry） | `v1.1.0.0` |
| 1.0.1.0 | 2026-10-22 | 安全加固（依赖升级、密码重置令牌哈希、安全响应头等）与版本管理 | `v1.0.1.0`（原 `1.0.1`） |
| 1.0.0.0 | 2026-10-22 | 试用版首发：安全修复、自动迁移、网站获客、交易自动化 | `v1.0.0.0` → `a892a82`（原 `1.0.0`） |
