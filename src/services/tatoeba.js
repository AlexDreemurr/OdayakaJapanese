/**
 * tatoeba.js
 * 通过 Supabase Edge Function 代理请求 Tatoeba 例句。
 */

const PROXY_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tatoeba-proxy`;

/**
 * 获取指定单词的 Tatoeba 例句，优先返回带中文翻译的结果，补充英文翻译结果。
 * @param {string} word - 日语单词
 * @returns {Promise<Array<{sentence: string, translation: string}>>}
 */
export async function fetchTatoebaExamples(word) {
  const encodedQuery = encodeURIComponent(word);

  const [cmnData, allData] = await Promise.all([
    fetch(`${PROXY_BASE}?query=${encodedQuery}&trans_to=cmn`).then((r) =>
      r.json()
    ),
    fetch(`${PROXY_BASE}?query=${encodedQuery}`).then((r) => r.json()),
  ]);

  const cmnResults = (cmnData.results ?? [])
    .filter((item) => item.text.length <= 80)
    .filter((item) => item.text.includes(word))
    .map((item) => {
      const trans = item.translations.flat().find((t) => t.lang === "cmn");
      return {
        sentence: item.text,
        translation: trans?.text ?? "（无翻译）",
      };
    });

  const seenSentences = new Set(cmnResults.map((r) => r.sentence));

  const restResults = (allData.results ?? [])
    .filter((item) => item.text.length <= 80)
    .filter((item) => item.text.includes(word))
    .filter((item) => !seenSentences.has(item.text))
    .map((item) => {
      const engTrans = item.translations.flat().find((t) => t.lang === "eng");
      return {
        sentence: item.text,
        translation: engTrans?.text ?? "（无翻译）",
      };
    });

  return [...cmnResults, ...restResults];
}
