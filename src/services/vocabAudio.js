/**
 * vocabAudio.js
 * 词条音频：用本地 VoiceVox TTS 生成「单词 + 4 个例句」音频，存入 Supabase Storage，
 * 并把路径/状态记入 vocabulary。TTS 不可用时把词条标记为缺失，可在调试页统一补生成。
 * 依赖：supabaseClient、voicevoxTts（本地 TTS）、words（RPC）、utility。
 */

import supabase from "../supabaseClient";
import { requestVoicevoxAudio } from "./voicevoxTts";
import { setVocabularyAudio } from "./words";
import { getSentenceText } from "../utility";

export const VOCAB_AUDIO_BUCKET = "vocab_audio";

/** 取 storage 内音频文件的公开 URL。 */
export function getAudioPublicUrl(path) {
  if (!path) return undefined;
  return supabase.storage.from(VOCAB_AUDIO_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

function extFor(blob) {
  const type = blob?.type || "";
  if (type.includes("wav")) return "wav";
  if (type.includes("ogg")) return "ogg";
  return "mp3";
}

/** 把 Blob 转成纯 base64（去掉 data: 前缀）。 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function generateAndUpload(vocabId, key, text) {
  let blob;
  try {
    blob = await requestVoicevoxAudio(text); // TTS 不可用会抛错
  } catch (e) {
    throw new Error(`[TTS] ${e?.message || e}`);
  }

  const path = `${vocabId}/${key}.${extFor(blob)}`;
  const dataBase64 = await blobToBase64(blob);

  // 经 Edge Function 用 service_role 上传，绕过 storage 写策略
  const { data, error } = await supabase.functions.invoke("vocab-audio-upload", {
    body: { path, contentType: blob.type || "audio/mpeg", dataBase64 },
  });
  if (error) throw new Error(`[上传] ${error.message}`);
  if (data?.error) throw new Error(`[上传] ${data.error}`);
  return path;
}

/**
 * 为一个词条生成并存储全部音频（单词 + 例句）。
 * 任一步失败则把该词条标记为缺失，不抛出。
 * @param {{id:number, word:string, sentences:Array}} vocab
 * @returns {Promise<{status:"ready"|"missing", paths?:object, error?:Error}>}
 */
export async function generateAndStoreVocabAudio(vocab) {
  if (!vocab?.id || !vocab?.word) {
    return { status: "missing" };
  }
  const sentences = Array.isArray(vocab.sentences) ? vocab.sentences : [];

  // 单词音频用假名读音生成（避免 VoiceVox 念错汉字），无读音才退回词形
  const wordText = vocab.reading || vocab.word;

  try {
    // 单词 + 各例句并行生成/上传（大幅提速），空例句跳过但保留下标对齐
    const [wordPath, ...sentencePaths] = await Promise.all([
      generateAndUpload(vocab.id, "word", wordText),
      ...sentences.map((s, i) => {
        const text = getSentenceText(s);
        return text ? generateAndUpload(vocab.id, `s${i}`, text) : Promise.resolve(null);
      }),
    ]);
    const paths = { word: wordPath, sentences: sentencePaths };
    const { data: rpcResult, error: rpcError } = await setVocabularyAudio(
      vocab.id,
      "ready",
      paths
    );
    if (rpcError) throw new Error(`[RPC] ${rpcError.message}`);
    if (rpcResult && rpcResult !== "ok") throw new Error(`[RPC] ${rpcResult}`);
    return { status: "ready", paths };
  } catch (error) {
    console.warn("音频生成失败，标记为缺失：", error?.message);
    await setVocabularyAudio(vocab.id, "missing", null);
    return { status: "missing", error };
  }
}

// ── 播放：优先库里已存音频，否则用浏览器内置朗读（不再依赖本地 VoiceVox）──
// 用 playToken 保证同一时刻只有一个播放在进行，杜绝"浏览器朗读 + 库音频"重叠。

let currentAudio = null;
let playToken = 0;

/** 停止当前所有播放（库音频 + 浏览器朗读），并使所有进行中的播放序列失效。 */
export function stopVocabAudio() {
  playToken += 1;
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      /* ignore */
    }
    currentAudio = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** 用浏览器 Web Speech API 朗读日文文本，resolve 于结束。 */
function speakWithBrowser(rawText) {
  return new Promise((resolve) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    const text = String(rawText || "").replace(/[{}｛｝]/g, "").trim();
    if (!text || !synth) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    const voices = synth.getVoices?.() || [];
    const jpVoice =
      voices.find((v) => /ja[-_]?JP/i.test(v.lang)) ||
      voices.find((v) => /japan/i.test(v.name));
    if (jpVoice) utterance.voice = jpVoice;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    synth.speak(utterance);
  });
}

/** 播放某个 URL，resolve {played} 表示是否成功播出。 */
function playUrl(url) {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    currentAudio = audio;
    const finish = (played) => {
      if (currentAudio === audio) currentAudio = null;
      resolve({ played });
    };
    audio.addEventListener("ended", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false), { once: true });
    audio.play().catch(() => finish(false));
  });
}

/**
 * 先检查库里是否有音频：有就播库音频；确认没有/播不出再用浏览器朗读。
 * 全程用 token 防止与后续调用重叠。resolve 于播放结束。
 * @param {{path?:string, text?:string}} options
 */
export async function playStoredOrBrowser({ path, text } = {}) {
  stopVocabAudio(); // 递增 token，停掉之前的一切播放
  const myToken = playToken;

  const url = getAudioPublicUrl(path);
  if (url) {
    const { played } = await playUrl(url);
    if (myToken !== playToken) return; // 已被新的播放取代
    if (played) return; // 库里有且已播完，绝不再走浏览器朗读
    // 仅当库文件确实播不出（404/解码失败）才回退
  }

  if (myToken !== playToken) return;
  await speakWithBrowser(text);
}

/**
 * 播放词条音频（不等待结束）。优先库音频，回退浏览器朗读。
 * @param {{path?:string, fallbackText?:string}} options
 */
export async function playVocabAudio(options) {
  try {
    await playStoredOrBrowser({ path: options?.path, text: options?.fallbackText });
  } catch {
    /* 静默 */
  }
}

/**
 * 依次播放多段音频（前一段结束后再播下一段）。
 * @param {Array<{path?:string, fallbackText?:string}>} items
 */
export async function playVocabAudioSequence(items) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    await playStoredOrBrowser({ path: item?.path, text: item?.fallbackText });
  }
}
