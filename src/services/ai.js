/**
 * ai.js
 * 通过 Supabase Edge Function 调用 DeepSeek AI，API Key 仅存于服务端。
 */

import supabase from "../supabaseClient";
import { WORD_CATEGORIES } from "../constants/wordCategories";

/**
 * 调用 DeepSeek AI，返回模型回复的文本内容。
 * @param {string} userText - 用户输入的文本
 * @param {string} systemPrompt - 系统提示词
 * @param {"translate"|"generate"} type - 调用类型
 * @returns {Promise<string>}
 */
export async function callDeepseek(userText, systemPrompt, type = "translate") {
  const { data, error } = await supabase.functions.invoke("deepseek-chat", {
    body: {
      type,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
    },
  });

  if (error) throw new Error(`请求失败：${error.message}`);

  return data.choices[0].message.content.trim();
}

/** 从模型回复里宽松地解析 JSON（容忍 ```json 代码块包裹）。 */
function parseJsonLoose(text) {
  const cleaned = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

const CLASSIFY_SYSTEM_PROMPT = `你是日语词性分类助手。请把每个词分到以下固定类别中的一个或多个（绝大多数只有一个）：${WORD_CATEGORIES.join(
  "、"
)}。
分类规则：
- 动词：训读和语动词归「和语动词」；汉语サ变动词（する动词）归「汉字词」。
- 名词：纯假名/训读和语名词归「和语名词」；汉字音读词归「汉字词」；片假名外来词归「外来语」。
- 形容词：以い结尾的形容词归「い形容词」；な形容词归「な形容词」。
- 副词归「副词」；拟声拟态词归「拟声词」。
- 实在无法归类时用「其他」。
只输出 JSON 对象：键为词的 id（字符串），值为类别字符串数组（只能用上面列出的类别）。不要输出任何多余文字。`;

/**
 * 批量对词条做词性分类。
 * @param {Array<{id:number|string, word:string, reading?:string, meaning?:string}>} items
 * @returns {Promise<Record<string, string[]>>} id → 类别数组
 */
export async function classifyWordCategories(items) {
  if (!Array.isArray(items) || items.length === 0) return {};

  const payload = JSON.stringify(
    items.map((i) => ({
      id: String(i.id),
      word: i.word,
      reading: i.reading ?? "",
      meaning: i.meaning ?? "",
    }))
  );

  const text = await callDeepseek(payload, CLASSIFY_SYSTEM_PROMPT, "generate");
  const parsed = parseJsonLoose(text);

  // 只保留合法类别
  const allowed = new Set(WORD_CATEGORIES);
  const result = {};
  for (const [id, cats] of Object.entries(parsed)) {
    const valid = (Array.isArray(cats) ? cats : [cats]).filter((c) =>
      allowed.has(c)
    );
    result[id] = valid.length ? valid : ["其他"];
  }
  return result;
}
