# Story Books · 奥托和害羞的月亮

基于 StoryComet 公开提供的前端模块与第一本免费绘本资源制作的独立复刻版。保留原版 Three.js 立体书架、翻页、场景互动、角色动画、音乐、逐词朗读与高亮、词语卡片、五枚隐藏徽章和五题测验。

本版仅包含《Otto and the Shy Moon / 奥托和害羞的月亮》，支持英文和简体中文。已移除支付、会员购买、其他书籍入口、跨站课程入口和原站统计脚本。

## 本地启动

需要 Node.js 22 或更新版本，无需安装运行依赖。

```powershell
cd D:\tk_games\story-books
npm start
```

打开 <http://localhost:4173>。`PORT` 环境变量可以修改端口。`dist/` 是可以直接托管的静态站点；请通过 HTTP 服务访问，不能双击 HTML 使用 `file://` 打开。

## 已实现

- 一整本 10 页故事及结尾页，立体模型、插画和动画均已保存在项目内。
- 中英文界面、故事、封面、真人音频、音频时间轴、逐词高亮和测验。
- 听读与自主阅读、放大、场景拖动、自动翻页、音量和文字大小设置。
- 最多三个儿童档案，各自保留进度、星星、徽章和测验记录。
- 无需登录的本地保存、账号数据隔离、阅读数据备份下载。
- 可选 Supabase 邮件登录和跨设备同步，已连接用户的 `storyBooks` 项目；数据库与 RLS 已创建。
- Three.js `0.170.0` 和 Supabase SDK `2.118.0` 本地托管；阅读资源不依赖原站或第三方 CDN。

邮件回跳地址及 SMTP 需要在 Supabase 控制台设置，详见 [Supabase 配置](docs/supabase-setup.md)。未配置 Google OAuth，因此不显示无效的 Google 登录入口。无需登录即可体验完整绘本。

## 验证

```powershell
npm run check
node scripts/test-cloud-sync.mjs
python scripts/browser_qa.py
```

浏览器验证使用当前 Windows 中的 Edge 与 Python Playwright；截图和检查结果保存在 `artifacts/`。该目录不提交到源码仓库。浏览器验证不发送真实登录邮件。

## 目录

- `dist/src/`：立体绘本、阅读、界面、声音、账号与同步逻辑。
- `dist/books/otto-shy-moon/`：第一本书的插画、模型、英文和中文故事及音频。
- `dist/public/`：共享字体、纸张与木纹、按钮、装饰玩具及音效。
- `dist/vendor/`：固定版本的浏览器依赖。
- `scripts/serve.mjs`：本地静态服务器，支持音频 Range 请求。
- `supabase/schema.sql`：已部署的数据表、权限与 RLS 定义。
- `reference/`：原站公开页面、模块及资源清单的调查记录。
- `docs/reconstruction.md`：观察依据与本版范围。

资源采集脚本用于此次调查，日常修改直接编辑 `dist/`，不需要重新采集原站。
