# 数据库结构

> 最后更新：2026-06-01
> 如果改了表结构，同步更新这个文件。

---

## 表关系总览

```
vocabulary_sets
├── vocabulary          (set_id → vocabulary_sets.id, ON DELETE SET NULL)
│   ├── vocab_practice          (vocabulary_id → vocabulary.id, ON DELETE CASCADE)
│   └── vocabulary_change_requests (vocabulary_id → vocabulary.id, ON DELETE SET NULL)
├── set_members         (set_id → vocabulary_sets.id, ON DELETE CASCADE)
└── vocabulary_change_requests (set_id → vocabulary_sets.id, ON DELETE CASCADE)

grammar_points
└── grammar_practice    (grammar_id → grammar_points.id, ON DELETE CASCADE)

auth.users
├── user_profiles       (user_id → auth.users，无显式 FK)
├── app_messages        (recipient_id, sender_id → auth.users)
└── set_members         (user_id, invited_by → auth.users)
```

---

## vocabulary_sets — 词汇集

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | — | 主键 |
| created_at | timestamptz | NO | now() | |
| name | text | YES | — | 词汇集名称 |
| description | text | YES | — | 简介 |
| status | text | YES | — | 状态（具体值待确认） |
| creator | text | YES | — | 创建者展示名（冗余字段） |
| privacy | text | YES | `'public'` | 可见性：`public` / `private` 等 |
| password_hash | text | YES | — | bcrypt 哈希，privacy 为加密时使用 |
| user_id | uuid | YES | — | 创建者（旧字段，逐步被 owner_id 替代） |
| owner_id | uuid | YES | — | 当前所有者，关联 auth.users |

> ⚠️ `user_id` 和 `owner_id` 并存，注意代码里统一用哪个。

---

## vocabulary — 词汇/短语

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | — | 主键 |
| created_at | timestamptz | NO | now() | |
| word | text | YES | — | 日语单词/短语 |
| reading | text | YES | — | 假名读音 |
| meaning | text | YES | — | 中文释义 |
| notation | text | YES | — | 书写形式备注 |
| pitch | integer | YES | — | 声调数字标记 |
| level | text | YES | — | JLPT 等级等 |
| sentences | jsonb | YES | — | 例句，JSON 数组 |
| contributor_name | text | YES | — | 贡献者展示名（冗余） |
| set_id | integer | YES | — | FK → vocabulary_sets.id，**ON DELETE SET NULL** |

> ⚠️ 删除词汇集后，该集合的词汇 set_id 变为 null，词汇本身不删除。

---

## set_members — 词汇集成员

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| set_id | bigint | NO | — | FK → vocabulary_sets.id，**ON DELETE CASCADE** |
| user_id | uuid | NO | — | 关联 auth.users |
| role | text | NO | `'member'` | `owner` / `member` 等 |
| can_contribute | boolean | NO | false | 可否添加词汇 |
| can_edit_phrases | boolean | NO | false | 可否编辑词汇内容 |
| can_edit_set | boolean | NO | false | 可否编辑集合设置 |
| invited_by | uuid | YES | — | 邀请人，关联 auth.users |
| joined_at | timestamptz | YES | now() | |
| created_at | timestamptz | NO | now() | |

> 删除词汇集时，成员记录一并级联删除。

---

## vocabulary_change_requests — 词汇变更申请

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | — | 主键 |
| set_id | bigint | NO | — | FK → vocabulary_sets.id，**ON DELETE CASCADE** |
| vocabulary_id | bigint | YES | — | FK → vocabulary.id，**ON DELETE SET NULL** |
| requester_id | uuid | NO | — | 申请人，关联 auth.users |
| action | text | NO | — | 操作类型：`add` / `edit` / `delete` 等 |
| changes | jsonb | NO | `{}` | 变更内容 |
| original_data | jsonb | NO | `{}` | 变更前的原始数据快照 |
| status | text | NO | `'pending'` | `pending` / `approved` / `rejected` |
| created_at | timestamptz | NO | now() | |
| resolved_at | timestamptz | YES | — | 处理时间 |
| resolved_by | uuid | YES | — | 处理人，关联 auth.users |

> 词汇集删除时申请记录级联删除；词汇本身删除时 vocabulary_id 置为 null（历史记录保留）。

---

## vocab_practice — 词汇练习记录

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | auto | 主键 |
| user_id | uuid | NO | — | 关联 auth.users |
| vocabulary_id | bigint | NO | — | FK → vocabulary.id，**ON DELETE CASCADE** |
| correct_counts | integer[] | NO | `{}` | 各题型正确次数数组 |
| attempt_counts | integer[] | NO | `{}` | 各题型尝试次数数组 |
| updated_at | timestamptz | NO | now() | |

> 词汇删除时练习记录级联删除。

---

## grammar_points — 语法点

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | auto | 主键 |
| form | text | NO | — | 语法形式，如 `〜てしまう` |
| meaning | text | NO | — | 中文含义 |
| katakana | text | YES | — | 片假名标注（可选） |
| sentence1 | text | NO | — | 例句 1 |
| sentence2 | text | NO | — | 例句 2 |
| sentence3 | text | NO | — | 例句 3 |
| sentence4 | text | NO | — | 例句 4 |

---

## grammar_practice — 语法练习记录

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | auto | 主键 |
| user_id | uuid | NO | — | 关联 auth.users |
| grammar_id | bigint | NO | — | FK → grammar_points.id，**ON DELETE CASCADE** |
| correct_counts | integer[] | NO | `{}` | 各题型正确次数数组 |
| attempt_counts | integer[] | NO | `{}` | 各题型尝试次数数组 |
| updated_at | timestamptz | NO | now() | |

---

## user_profiles — 用户资料

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| user_id | uuid | NO | — | 主键，关联 auth.users |
| display_name | text | YES | — | 展示名 |
| email | text | YES | — | 邮箱（冗余，auth.users 已有） |
| avatar_path | text | YES | — | Storage 里的文件路径（非完整 URL） |
| updated_at | timestamptz | NO | now() | |

> avatar 完整 URL 拼接方式：
> `${VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${avatar_path}`

---

## app_messages — 站内消息

| 列名 | 类型 | 可空 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint | NO | — | 主键 |
| recipient_id | uuid | NO | — | 收件人，关联 auth.users |
| sender_id | uuid | YES | — | 发件人，null 表示系统消息 |
| sender_name | text | NO | `'系统'` | 发件人展示名 |
| sender_avatar_path | text | YES | — | 发件人头像路径 |
| type | text | NO | `'info'` | 消息类型：`info` / `warning` / `invite` 等 |
| content | text | NO | — | 消息正文 |
| metadata | jsonb | NO | `{}` | 附加数据（如邀请的 set_id） |
| read_at | timestamptz | YES | — | 已读时间，null 表示未读 |
| created_at | timestamptz | NO | now() | |

---

## Storage

**Bucket：`avatars`**（public）

- 存放用户头像图片
- 文件路径存在 `user_profiles.avatar_path`
- 不需要 API 调用，直接拼接 URL 访问
