import { getSentenceText } from "../utility";
import { DEFAULT_VOICEVOX_SPEAKER } from "../constants/voicevoxSpeakers";

const DEFAULT_TTS_ENDPOINT =
  import.meta.env.VITE_TTS_ENDPOINT || "http://localhost:8787/tts";
const MAX_TEXT_LENGTH = 200;

function cleanSentenceText(sentence) {
  return getSentenceText(sentence).replace(/[{}]/g, "").trim();
}

export async function requestVoicevoxAudio(
  sentence,
  { speaker = DEFAULT_VOICEVOX_SPEAKER } = {}
) {
  const text = cleanSentenceText(sentence);

  if (!text) {
    throw new Error("朗读文本不能为空");
  }

  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`朗读文本不能超过 ${MAX_TEXT_LENGTH} 字`);
  }

  const response = await fetch(DEFAULT_TTS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, speaker }),
  });

  if (!response.ok) {
    throw new Error("朗读生成失败");
  }

  return response.blob();
}
