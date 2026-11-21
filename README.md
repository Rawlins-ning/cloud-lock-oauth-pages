# Cloud Lock OAuth Pages

这是 **公开的 OAuth 用户授权网页**，供未来的 WorkBuddy 云端连接器进行登录及授权确认。

- 前端源代码可公开，但**不包含** Supabase Secret Key、锁令牌、业务资料或飞书配置。
- 后端锁服务在独立 Supabase 项目，且正式业务写入继续保持关闭。
- 页面必须先完成 HTTPS 部署和真实 OAuth 测试，才能用于生产登录。

## 首次启用 GitHub Pages

1. 前往仓库 **Settings → Secrets and variables → Actions**，新增 Repository Secret：
   `SUPABASE_PUBLISHABLE_KEY` = Supabase Settings → API Keys 中的 **`sb_publishable_...`**（不能使用 `sb_secret_`）。
2. 前往 **Settings → Pages → Build and deployment**，将 Source 改为 **GitHub Actions**。
3. 前往 **Actions → Deploy OAuth Consent UI to GitHub Pages → Run workflow**，选择 `main`。
4. 验证主页及授权路径（前提是 Actions 显示 Success）：
   - https://rawlins-ning.github.io/cloud-lock-oauth-pages/
   - https://rawlins-ning.github.io/cloud-lock-oauth-pages/oauth/consent/
5. 在成功部署**之后**，回到 Supabase Authentication → URL Configuration，考虑将 Site URL 设置为 `https://rawlins-ning.github.io/cloud-lock-oauth-pages`，OAuth Authorization Path 建议设置为 `/oauth/consent/`（需实测重定向 `authorization_id` 未丢失）。
6. 再进行真实 OAuth 同意/拒绝测试；未验收前保持 Dynamic OAuth Apps 关闭、飞书业务写入暂停。

## 开发与构建

使用 Node 22+；`npm install` 与 `npm run build` 生成静态文件。由 Vite 将 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_PUBLISHABLE_KEY` 编入公开 JavaScript 产物。

本仓库 GitHub Actions 工作流现支持 **main 分支代码提交自动部署**及手工触发。构建、上传和发布分成两个作业；上传文件包按运行 ID/尝试次数单独命名，避免因重新运行相同任务出现重名冲突。首次部署仍需在 Settings → Pages 中选择 GitHub Actions，并配置 SUPABASE_PUBLISHABLE_KEY。

安全提醒：公开网页的登录表单直接通过 `@supabase/supabase-js` 与 Supabase Auth 通信，密码不发送到我们的 GitHub Actions 或共享锁服务。以后其他成员仍需各自独立授权。
