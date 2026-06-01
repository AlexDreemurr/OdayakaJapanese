# HappyJPGrammar — Claude Code 上下文

> 把这个文件放到项目根目录，每次启动 Claude Code 时说："请先读取 CLAUDE.md"

---

## 项目简介

**HappyJPGrammar** 是一个日语学习 Web App，部署在 `odayaka.me`（Vercel）。

- **前端**：React + Vite + styled-components v6
- **数据库**：Supabase（PostgreSQL + RLS + Storage）
- **AI**：DeepSeek API，通过 Supabase Edge Function 调用（保护 API Key）
- **第三方**：Tatoeba API（通过代理获取例句）
- **UI 库**：Radix UI 组件

---

## 目录结构约定

```
happyjpgrammar/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase 客户端（唯一实例）
│   ├── services/                # ← 重构目标：所有数据库操作集中在此
│   │   ├── vocabularySets.js
│   │   ├── words.js
│   │   ├── auth.js
│   │   ├── storage.js
│   │   ├── ai.js
│   │   └── tatoeba.js
│   ├── pages/
│   └── components/
├── supabase/                    # ← Supabase 本地管理目录（见下方说明）
│   ├── config.toml
│   ├── migrations/              # 数据库迁移文件（版本控制表结构）
│   │   ├── 20240101000000_init.sql
│   │   └── ...
│   ├── functions/               # Edg、e Function 源码
│   │   └── deepseek-proxy/
│   │       └── index.ts
│   └── seed.sql                 # 可选，测试数据
├── .env.local                   # 本地环境变量（不提交 git）
├── .env.example                 # 提交 git 的模板，不含真实值
└── CLAUDE.md
```

---

## Supabase 本地同步方案

### 为什么需要这个

直接在 Supabase Dashboard 手点建表、部署 Edge Function，代码和云端很快就会不同步。
正确做法：**本地的 `supabase/` 目录是唯一真相来源**，通过 CLI 推送到云端。

### 初始化（只做一次）

```bash
# 安装 Supabase CLI
npm install -g supabase

# 在项目根目录登录并关联远程项目
supabase login
supabase link --project-ref <你的项目 ref>
# project-ref 在 Supabase Dashboard → Project Settings → General 里找
```

### 数据库迁移（表结构变更）

**从云端拉取现有结构到本地**（第一次同步）：

```bash
supabase db pull
# 会在 supabase/migrations/ 生成一个 .sql 文件，包含当前所有表结构
```

**以后每次改表结构**，不要直接在 Dashboard 操作，而是：

```bash
# 1. 新建迁移文件
supabase migration new <描述性名称>
# 例：supabase migration new add_furigana_to_words

# 2. 编辑生成的 sql 文件，写 ALTER TABLE / CREATE TABLE 等

# 3. 推送到云端
supabase db push
```

**查看本地和云端的差异**：

```bash
supabase db diff
```

### Edge Functions

**从云端拉取已有函数到本地**：

```bash
supabase functions download <函数名>
# 例：supabase functions download deepseek-proxy
```

**修改本地函数后推送**：

```bash
supabase functions deploy <函数名>
# 例：supabase functions deploy deepseek-proxy
```

**本地测试函数**（不需要真的部署）：

```bash
supabase functions serve
```

### Secrets（API Key 等）

Secrets **不能**同步到本地文件（否则 API Key 会进 git）。约定如下：

| 位置                                          | 用途                                          |
| --------------------------------------------- | --------------------------------------------- |
| Supabase Dashboard → Edge Functions → Secrets | 云端运行时读取，是真实值                      |
| `.env.local`（不提交 git）                    | 本地开发时，`supabase functions serve` 会读取 |
| `.env.example`（提交 git）                    | 只写变量名，不写值，让其他人知道需要哪些变量  |

`.env.example` 示例：

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
DEEPSEEK_API_KEY=
```

### 常用命令速查

```bash
supabase db pull              # 从云端拉取表结构到本地
supabase db push              # 将本地迁移推送到云端
supabase db diff              # 查看本地和云端的差异
supabase migration new <名>   # 新建迁移文件
supabase functions deploy <名> # 部署某个 Edge Function
supabase functions download <名> # 从云端拉取函数到本地
supabase functions serve      # 本地启动 Edge Function 测试环境
supabase status               # 查看链接状态和项目信息
```

---

## 数据库结构

数据库结构详见 supabase/SCHEMA.md

### Supabase Storage

- Bucket：`avatars`（public bucket）
- 存放用户头像 PNG 文件
- URL 直接拼接，**不需要 API 调用**：
  ```js
  `${
    import.meta.env.VITE_SUPABASE_URL
  }/storage/v1/object/public/avatars/${filename}`;
  ```

---

## 环境变量

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

DeepSeek API Key **只存在 Supabase Edge Function Secrets 里**，不在前端环境变量中。

---

## Supabase 客户端

所有 service 文件统一从 `src/lib/supabase.js` 导入，不要重复创建实例：

```js
// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

---

## DeepSeek AI 调用方式

通过 Supabase Edge Function 调用，前端不直接请求 DeepSeek：

```js
const { data, error } = await supabase.functions.invoke("deepseek-proxy", {
  body: { prompt: "..." },
});
```

`src/services/ai.js` 封装这个调用。

---

## styled-components 配置

使用 styled-components v6 + `@rolldown/plugin-babel`，生产环境 className 可读（`sc-ComponentName` 风格）。
重构时**不要改动这个配置**，保持 styled-components 用法不变。

---

## 当前重构任务

**目标：将所有数据库操作从页面/组件中分离出来，集中到 `src/services/`，并补充注释。**

### 要创建的 service 文件

| 文件                | 负责内容                          |
| ------------------- | --------------------------------- |
| `vocabularySets.js` | 词汇集的 CRUD、权限检查           |
| `words.js`          | 单词/短语的 CRUD                  |
| `auth.js`           | 用户登录、注册、登出、会话        |
| `storage.js`        | Supabase Storage（头像读取）      |
| `ai.js`             | 调用 deepseek-proxy Edge Function |
| `tatoeba.js`        | Tatoeba 例句代理请求              |

### 注释规范

service 函数用 JSDoc：

```js
/**
 * 获取当前用户的所有词汇集
 * @param {string} userId - 用户 ID
 * @returns {Promise<{data: Array, error: object|null}>}
 */
export async function getVocabularySets(userId) { ... }
```

页面文件顶部加块注释：

```js
/**
 * SetDetailPage
 * 词汇集详情页，展示某个集合内的所有单词。
 * 依赖：vocabularySets.js（getSetById），words.js（getWordsBySetId）
 */
```

---

## 开始工作的步骤

1. 读取这个文件
2. `ls src/` 查看实际目录结构
3. 搜索现有的 Supabase 查询散落在哪些文件（`grep -r "supabase\." src/ --include="*.jsx" -l`）
4. 按 service 文件列表逐个迁移，**每完成一个停下来汇报**，再继续下一个
5. 最后更新页面/组件，将直接查询替换为 service 函数调用

> 不要一次性改动太多文件，每个模块完成后确认无误再继续。
