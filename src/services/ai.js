/**
 * ai.js
 * 通过 Supabase Edge Function 调用 DeepSeek AI，API Key 仅存于服务端。
 */

import supabase from "../supabaseClient";

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
