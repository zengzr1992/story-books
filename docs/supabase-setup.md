# Supabase 账号与阅读同步

项目已配置 `storyBooks`：`qrwtlxoxwaekfoxnbgcz`。浏览器中只包含可公开的 publishable key，数据库通过 RLS 限制每个家长只能访问自己的记录。没有使用 service_role key。

## 数据库

`public.reading_state` 已在该项目建立，表权限与四项 RLS policies 已应用。2026-10-30 验证：表中有 0 条记录，Supabase 安全顾问无告警。该表为每个家长保存一份儿童档案、阅读进度、收藏及测验的 JSON 快照。[schema.sql](../supabase/schema.sql) 保留了重建所需的完整定义。

## 邮件登录

正式私有预览地址为 <https://story-books-otto-zh-en.orangespoon2048.chatgpt.site>。当前连接的管理工具不能修改 Auth URL 配置，需要在 [Auth URL Configuration](https://supabase.com/dashboard/project/qrwtlxoxwaekfoxnbgcz/auth/url-configuration) 完成以下设置：

- **Site URL**：`https://story-books-otto-zh-en.orangespoon2048.chatgpt.site/`
- **Redirect URLs** 加入：`https://story-books-otto-zh-en.orangespoon2048.chatgpt.site/`
- **Redirect URLs** 加入：`http://localhost:4173/`

应用发送邮件时会把当前站点根地址作为 `emailRedirectTo`。如果本地使用其他端口或域名，也需要加入对应地址。

Supabase 的 `signInWithOtp` 默认发送 Magic Link。点击邮件中的链接后，页面会恢复会话并读取云端记录。如果希望像原站一样直接输入邮件验证码，在 [Email Templates](https://supabase.com/dashboard/project/qrwtlxoxwaekfoxnbgcz/auth/templates) 的 Magic Link 模板中加入 `{{ .Token }}`，例如：

```html
<h2>StoryComet 登录 / Sign in</h2>
<p>验证码 / Your code: {{ .Token }}</p>
<p><a href="{{ .ConfirmationURL }}">登录 / Sign in</a></p>
```

2026-10-30 已通过只读 `/auth/v1/settings` 验证：公开 publishable key 有效，邮箱登录已启用、允许注册；Google OAuth 和匿名登录未启用。未发送真实邮件，也未创建测试用户。

内置邮件服务通常限制收件人范围和发送速率。面向真实读者前请在 [SMTP Settings](https://supabase.com/dashboard/project/qrwtlxoxwaekfoxnbgcz/auth/smtp) 配置自己的邮件服务。应用会显示服务返回的发送错误，不会假装邮件发送成功。Google OAuth 未配置，界面不展示不可用的 Google 登录。

## 同步行为

- 不登录也可阅读，记录保存在当前浏览器。
- 第一个新云账号可接收本机访客记录；同一访客记录不会再次自动转移给另一个家长。
- 现有云账号读取自己的云端记录。退出恢复原访客记录，各账号在本机也使用独立存储空间。
- 每次改动会先保存本机，稍后合并改动的记录键并上传。断网的待传改动会保留，在恢复连接时重试。
- 同时在多台设备修改同一个孩子的同一份记录时，最后成功上传的该记录键生效；不同孩子的记录键会合并。此版本不提供多人实时协同。
- 账号初始化和网络错误都不会阻塞绘本阅读。

## 开发接口

`dist/src/cloud-sync.js` 导出 `initializeCloud()`、`getCloudState()`、`sendLoginEmail(email)`、`verifyLoginCode(email, token)`、`signOutCloud()`。导入模块本身不连接后端，调用 `initializeCloud()` 才开始检查会话。

`cloudEvents` 的 `change` 和 `status` 事件 `detail` 均为：

```js
{ configured: true, ready: true, user: null, status: 'local', error: null }
```

登录后 `user` 为 `{id, email}`；`status` 可为 `local / loading / syncing / synced / error`。三个登录操作函数返回 Supabase 风格的 `{data?, error}`。SDK 固定为 `@supabase/supabase-js@2.118.0`，从 npm 包的 UMD 浏览器发行版保存在本地 `dist/vendor/supabase-2.118.0.js`，仅追加 ESM 导出。

参考：[邮件免密码登录](https://supabase.com/docs/guides/auth/auth-email-passwordless)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Auth 状态监听](https://supabase.com/docs/reference/javascript/auth-onauthstatechange)。

## 可重复验证

在项目根目录执行：

```powershell
node scripts/test-cloud-sync.mjs
```

此测试通过内存模拟 Supabase，不连接真实后端、不发送邮件、不创建用户。覆盖模块导入不联网、访客初始化、邮箱格式与重定向、首次登录迁移、账户隔离、断网待传重试，以及退出恢复访客。真实邮箱收信与登录回跳仍需要完成上面的 Dashboard 设置后，由家长使用自己的邮箱验证。
