# VOICEVOX TTS 开发进度

## 当前目标
为日语学习网站添加句子朗读功能：用户点击句子下方按钮后，实时请求 VOICEVOX 生成语音并播放。

## 当前架构
用户浏览器
→ 前端按钮 SentenceSpeaker
→ VITE_TTS_ENDPOINT
→ Node 代理 server/voicevox-proxy.js
→ 本机 VOICEVOX Engine http://127.0.0.1:50021
→ 返回 audio/wav
→ 前端播放

公网化后架构：
用户浏览器
→ https://tts.你的域名.com/tts
→ Cloudflare Tunnel
→ localhost:8787 Node 代理
→ 127.0.0.1:50021 VOICEVOX Engine

## 已完成
- 本地 VOICEVOX 朗读 MVP 已跑通
- /health 可用
- /tts POST 可用
- /tts 非 POST 返回 405 JSON
- 文本为空和超过 200 字会返回 400
- speaker 有默认值
- 前端可通过 VITE_TTS_ENDPOINT 配置 TTS 地址
- 没有 VITE_TTS_ENDPOINT 时 fallback 到 http://localhost:8787/tts
- SentenceSpeaker 有 loading / playing 状态
- 播放期间按钮禁用
- object URL 已做清理
- 未暴露 VOICEVOX 50021 端口

## 本地启动步骤
1. 启动 VOICEVOX Engine
2. 确认 http://127.0.0.1:50021/docs 可访问
3. 启动 Node 代理：
   ```bash
   npm run tts
   ```
4. 启动前端：
   ```bash
   npm run dev
   ```
5. 打开包含日文句子的页面，点击朗读按钮

## 本地测试命令
```powershell
curl -X POST http://localhost:8787/tts ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"今日はいい天気ですね。\",\"speaker\":3}" ^
  --output test.wav
```

## 公网化计划
使用 Cloudflare Tunnel，把固定子域名映射到本机 Node 代理：

https://tts.你的域名.com
→ Cloudflare Tunnel
→ http://localhost:8787

注意：
不要把 Cloudflare Tunnel 指向 http://127.0.0.1:50021
不要把 VOICEVOX Engine 直接暴露到公网
公网只允许访问 Node 代理

## Cloudflare Tunnel 配置
Public Hostname:
- Subdomain: tts
- Domain: 你的域名.com
- Path: 留空

Service:
- Type: HTTP
- URL: localhost:8787

## 前端环境变量
本地：
```env
VITE_TTS_ENDPOINT=http://localhost:8787/tts
```

公网：
```env
VITE_TTS_ENDPOINT=https://tts.你的域名.com/tts
```

注意：
VITE_TTS_ENDPOINT 是 Vite 构建时变量。
修改后需要重新 build / deploy 前端。

## Node 代理环境变量
本地开发：
```env
TTS_CORS_ORIGIN=http://localhost:5173
```

公网生产：
```env
TTS_CORS_ORIGIN=https://你的前端域名.com
```

如果有 www 和非 www 两个前端域名，当前文档示例只填写一个 origin。先填用户实际打开页面时使用的那个完整 origin，包括协议。

## 公网测试命令
```powershell
curl -X POST https://tts.你的域名.com/tts ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"今日はいい天気ですね。\",\"speaker\":3}" ^
  --output public-test.wav
```

## 常见问题
### 1. https://tts.你的域名.com/health 打不开
检查：
- cloudflared 是否正在运行
- Tunnel 是否 Healthy
- Public Hostname 是否指向 localhost:8787
- Node 代理是否已启动

### 2. /tts 返回 502
通常说明 Cloudflare Tunnel 连到了本机，但本机 localhost:8787 没有服务。
检查 npm run tts 是否正在运行。

### 3. /tts 返回 500
通常说明 Node 代理能访问，但 VOICEVOX Engine 没启动。
检查 http://127.0.0.1:50021/docs。

### 4. 前端仍然请求 localhost:8787
说明 VITE_TTS_ENDPOINT 没有在部署环境里正确设置，或者设置后没有重新构建。

### 5. 浏览器 CORS 报错
检查 TTS_CORS_ORIGIN 是否等于真实前端域名。
注意协议和域名必须一致，例如 https://example.com 和 https://www.example.com 是两个不同 origin。

### 6. Windows build 时 dist 被占用
关闭浏览器预览、Live Server、旧 node 进程后再删除 dist 或重新 build。

## 下一步
1. 完成 Cloudflare Tunnel 配置
2. 访问 https://tts.你的域名.com/health 测试
3. curl 测试公网 /tts
4. 前端部署环境设置 VITE_TTS_ENDPOINT
5. 重新构建并部署前端
6. 浏览器实际点击句子朗读按钮测试

## 声优 / 角色风格选择
VOICEVOX 的 `speaker` 参数使用的是 `/speakers` 返回的 `styles[].id`。

当前前端手动维护常用 speaker 列表：
```js
// src/constants/voicevoxSpeakers.js
export const VOICEVOX_SPEAKERS = [
  { label: "ずんだもん / ノーマル", speaker: 3 },
  { label: "四国めたん / ノーマル", speaker: 2 },
];
```

默认 speaker 是 `DEFAULT_VOICEVOX_SPEAKER`，目前为 `3`。

如果需要临时切换全站默认声音，修改 `src/constants/voicevoxSpeakers.js` 中 `DEFAULT_VOICEVOX_SPEAKER` 指向的 speaker id。

如果未来某个页面需要单独指定声音，可以给 `SentenceSpeaker` 传入：
```jsx
<SentenceSpeaker sentence={sentence} speaker={2} />
```

暂时没有在每个句子旁边显示下拉框，避免页面变乱。后续如果要做用户级偏好，可以在设置页选择 speaker，再传给 `SentenceSpeaker`。
