# Odayaka日本語

一个面向日语学习的 React Web 应用，主要提供 N2 语法选择题练习、共享词汇题库练习、词汇集管理、AI 辅助加词、句子朗读和个人练习记录等功能。

项目当前以前端单页应用为主体，数据与鉴权使用 Supabase，AI 生成能力通过 Supabase Edge Function 调用，句子朗读通过本地 Node 代理转发到 VOICEVOX Engine。

## 功能概览

- **语法练习**：从远程 CSV 题库加载 N2 语法题，生成四选一练习。
- **共享词汇练习**：从 Supabase `vocabulary` 表抽取词汇与例句，按词汇集范围生成题目。
- **词汇集系统**：支持创建、编辑、删除、加入公开词汇集，并管理词汇集成员权限。
- **AI 辅助加词**：通过 `deepseek-chat` 生成词义、读音、音调、例句和目标读音。
- **历史记录**：将练习过的题目保存到 `localStorage`。
- **个性化设置**：可配置共享词汇练习的题库范围，以及选项显示假名的比例。
- **用户系统**：通过 Supabase Auth 登录，并保存用户资料和头像。
- **句子朗读**：`SentenceSpeaker` 调用 VOICEVOX TTS 代理生成音频。
- **组件调试页**：本地回环地址下主页右下角显示“进入调试页”，路由为 `/debug`。
- **Storybook**：组件有独立 stories，可用于组件开发与视觉检查。

## 技术栈

- React 19
- Vite 8
- React Router 7
- styled-components 6
- Supabase JS 2
- Radix UI
- lucide-react / react-feather
- Storybook 10
- Express，用于本地 VOICEVOX TTS 代理
- PapaParse，用于语法 CSV 题库解析

## 目录结构

```text
.
├─ src/
│  ├─ App.jsx                         # 应用入口、路由、全局状态
│  ├─ GlobalStyles.jsx                # 全局 CSS 变量与基础样式
│  ├─ supabaseClient.js               # Supabase 客户端
│  ├─ utility.jsx                     # 题目生成、AI 调用、练习统计等工具
│  ├─ services/
│  │  └─ voicevoxTts.js               # 前端 TTS 请求封装
│  ├─ hooks/                          # 鉴权、用户资料、词汇集 hooks
│  ├─ constants/                      # 主题、角色、VOICEVOX speaker 等常量
│  └─ components/
│     ├─ pageComponents/              # 页面级组件
│     ├─ PhraseSet/                   # 词汇集详情
│     ├─ ContributeForm/              # 加词表单
│     ├─ PhraseDialog/                # 词条编辑弹窗
│     ├─ SentenceSpeaker/             # 句子朗读按钮
│     └─ ...                          # 通用 UI 组件
├─ server/
│  └─ voicevox-proxy.js               # VOICEVOX 代理服务
├─ supabase/
│  ├─ migrations/                     # 数据库迁移
│  └─ functions/                      # Supabase Edge Functions
├─ docs/                              # 用户手册与截图资源
├─ public/                            # 静态资源
└─ scripts/                           # 数据维护脚本
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 准备环境变量

复制 `.env.example` 为 `.env`，并补充 Supabase 配置：

```env
VITE_SUPABASE_URL=你的 Supabase Project URL
VITE_SUPABASE_PUBLISHABLE_KEY=你的 Supabase publishable/anon key

VITE_BASE_PATH=/
VITE_TTS_ENDPOINT=http://localhost:8787/tts
TTS_CORS_ORIGIN=http://localhost:5173
```

如果部署到 GitHub Pages 项目页，`VITE_BASE_PATH` 通常需要改为：

```env
VITE_BASE_PATH=/HappyJPGrammar/
```

### 3. 启动前端

```bash
npm run dev
```

默认访问：

```text
http://localhost:5173
```

### 4. 可选：启动 VOICEVOX 朗读

句子朗读需要同时启动 VOICEVOX Engine 和本项目的 TTS 代理。

```bash
npm run tts
```

本地代理默认监听：

```text
http://localhost:8787
```

健康检查：

```bash
curl http://localhost:8787/health
```

更多 VOICEVOX / Cloudflare Tunnel 配置见 [VOICEVOX_PROGRESS.md](./VOICEVOX_PROGRESS.md)。

## 常用脚本

```bash
npm run dev
```

启动 Vite 开发服务器。

```bash
npm run tts
```

启动本地 VOICEVOX TTS 代理。

```bash
npm run build
```

按当前 `VITE_BASE_PATH` 构建生产产物到 `dist/`。

```bash
npm run build:github
```

使用 `/HappyJPGrammar/` 作为 base path 构建 GitHub Pages 版本。

```bash
npm run preview
```

本地预览生产构建结果。

```bash
npm run lint
```

运行 ESLint。

```bash
npm run storybook
```

启动 Storybook，默认端口 `6006`。

```bash
npm run build-storybook
```

构建静态 Storybook。

```bash
npm run deploy
npm run deploy:github
```

分别部署普通构建和 GitHub Pages 构建到 `gh-pages`。

## 路由

| 路由 | 说明 |
| --- | --- |
| `/` | 首页 |
| `/quiz/grammar` | 语法练习 |
| `/quiz/sharedDict` | 共享词汇练习 |
| `/history` | 历史记录 |
| `/phraseSetList` | 词汇集列表 |
| `/phraseSet/:phraseSetId` | 词汇集详情 |
| `/settings` | 设置与词汇集管理 |
| `/debug` | 本地调试页，仅在 `localhost`、`127.0.0.1`、`::1` 下挂载 |

## 数据与 Supabase

项目依赖 Supabase 提供：

- Auth 用户登录状态
- `user_profiles` 用户资料
- `vocabulary_sets` 词汇集
- `vocabulary` 词条
- `set_members` 词汇集成员和权限
- `vocab_practice` 用户词汇练习统计
- RPC：词汇集创建、加入、删除、成员权限管理、词条更新/删除等

数据库迁移位于：

```text
supabase/migrations/
```

AI 调用通过 `utility.jsx` 中的 `deepseekAPI` 封装，实际请求发往 Supabase Edge Function：

```js
supabase.functions.invoke("deepseek-chat", ...)
```

注意：当前仓库内没有完整的 `deepseek-chat` Edge Function 源码。如果新环境需要完整复现，需要在 Supabase 项目中部署对应函数，并配置好 DeepSeek API Key。

## 加词逻辑

加词入口在 `ContributeForm`。

当前流程：

1. 先查当前词汇集是否已经存在同名词条。
2. 如果当前词汇集已有同词，直接报错，不重复添加。
3. 如果用户没有填写备注，并且 `vocabulary` 表中曾经出现过这个词，就直接复制已有词条。
4. 复制时会覆盖 `contributor_name` 和 `set_id`，并让 `id`、`create_at`、`created_at` 由数据库默认生成。
5. 如果没有可复用词条，才调用 DeepSeek 生成数据。
6. 生成结果会规范化 `pitch` 与 `sentences` 后写入数据库。

## 题目生成逻辑

### 语法练习

`QuizPage` 会从远程 CSV 加载语法数据：

```text
https://raw.githubusercontent.com/AlexDreemurr/HappyJPGrammar/assets/n2_grammar_completed.csv
```

加载后使用 `PapaParse` 解析，再通过 `getNewQuizObject` 随机生成四选一题目。

### 共享词汇练习

共享词汇练习从 Supabase `vocabulary` 表读取词条。登录用户会优先根据 `vocab_practice` 中的练习次数选择练得较少的词条和例句；未登录用户则随机抽题。

设置页可以选择共享词汇练习使用哪些词汇集，选择结果保存在 `localStorage`。

## VOICEVOX TTS

前端调用链路：

```text
SentenceSpeaker
→ VITE_TTS_ENDPOINT
→ server/voicevox-proxy.js
→ VOICEVOX Engine http://127.0.0.1:50021
→ audio/wav
→ 浏览器播放
```

本地需要：

1. 启动 VOICEVOX Engine。
2. 确认 `http://127.0.0.1:50021/docs` 可访问。
3. 启动代理：

```bash
npm run tts
```

代理支持的环境变量：

```env
TTS_PROXY_PORT=8787
VOICEVOX_ORIGIN=http://127.0.0.1:50021
TTS_CORS_ORIGIN=http://localhost:5173
```

生产环境不要直接暴露 VOICEVOX Engine 的 `50021` 端口。建议只公开 Node 代理，并用 `TTS_CORS_ORIGIN` 限制前端来源。

## 本地调试页

本地访问首页时，右下角会显示“进入调试页”按钮。判断条件是：

```js
["localhost", "127.0.0.1", "::1"].includes(window.location.hostname)
```

调试页文件：

```text
src/components/pageComponents/DebugPage.jsx
```

这里适合临时放置组件，快速查看样式、状态和交互。线上域名下不会显示入口，也不会挂载 `/debug` 路由。

## Storybook

项目中很多基础组件都带有 `.stories.jsx`，例如：

- `Header`
- `Button`
- `AlertDialog`
- `PhraseDialog`
- `PitchReading`
- `UserAvatar`
- `PhraseSetCard`

启动：

```bash
npm run storybook
```

构建：

```bash
npm run build-storybook
```

## 部署

### 普通静态部署

```bash
npm run build
```

将 `dist/` 部署到静态托管平台即可。Vercel 环境下 `vite.config.js` 会自动使用 `/` 作为 base。

### GitHub Pages

```bash
npm run build:github
npm run deploy:github
```

`build:github` 会使用：

```text
/HappyJPGrammar/
```

作为 Vite base path。

## 开发注意事项

- 新增路由时在 `src/App.jsx` 中维护。
- 全局颜色、字号、Header 高度等在 `GlobalStyles.jsx` 与 `src/constants/` 中维护。
- 通用图标统一走 `src/components/Icon/Icon.jsx`。
- 新组件优先沿用现有 `styled-components` 写法。
- 词汇相关数据库操作尽量靠近 `ContributeForm`、`PhraseDialog`、`PhraseSetActions` 和对应 Supabase RPC。
- 修改 TTS 端点后需要重新启动 Vite；生产构建中 `VITE_*` 变量是在构建时注入的。
- `localStorage` 当前保存历史题目、共享词汇集选择和假名显示比例。

## 已知限制

- `deepseek-chat` Edge Function 源码不在当前仓库中，需要在 Supabase 项目侧单独维护。
- 语法题库依赖远程 CSV，离线或 GitHub raw 不可访问时语法练习会受影响。
- VOICEVOX 朗读依赖本地或公网代理；未配置时朗读按钮会进入错误状态。
- `dist/`、`storybook-static/` 属于构建产物，通常不需要人工编辑。

