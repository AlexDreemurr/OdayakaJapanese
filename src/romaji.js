/**
 * 罗马字 → 平假名 转换引擎（用于屏幕 QWERTY 键盘输入）。
 * 增量式：维护尚未转换的 romaji 缓冲，逐字符贪婪匹配。
 */

// 罗马字 → 平假名映射（含常见拗音、外来音、促音小书等）
const ROMAJI = {
  a: "あ", i: "い", u: "う", e: "え", o: "お",
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ", kye: "きぇ",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",
  sa: "さ", si: "し", shi: "し", su: "す", se: "せ", so: "そ",
  sha: "しゃ", sya: "しゃ", shu: "しゅ", syu: "しゅ", sho: "しょ", syo: "しょ", she: "しぇ",
  za: "ざ", zi: "じ", ji: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  ja: "じゃ", jya: "じゃ", zya: "じゃ", ju: "じゅ", jyu: "じゅ", zyu: "じゅ", jo: "じょ", jyo: "じょ", zyo: "じょ", je: "じぇ",
  ta: "た", ti: "ち", chi: "ち", tu: "つ", tsu: "つ", te: "て", to: "と",
  cha: "ちゃ", tya: "ちゃ", chu: "ちゅ", tyu: "ちゅ", cho: "ちょ", tyo: "ちょ", che: "ちぇ",
  tsa: "つぁ", tse: "つぇ", tso: "つぉ",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  dya: "ぢゃ", dyu: "ぢゅ", dyo: "ぢょ",
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",
  ha: "は", hi: "ひ", hu: "ふ", fu: "ふ", he: "へ", ho: "ほ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  mya: "みゃ", myu: "みゅ", myo: "みょ",
  ya: "や", yu: "ゆ", yo: "よ",
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",
  wa: "わ", wi: "うぃ", we: "うぇ", wo: "を",
  va: "ゔぁ", vi: "ゔぃ", vu: "ゔ", ve: "ゔぇ", vo: "ゔぉ",
  // 小书（x / l 前缀）
  xa: "ぁ", la: "ぁ", xi: "ぃ", li: "ぃ", xu: "ぅ", lu: "ぅ", xe: "ぇ", le: "ぇ", xo: "ぉ", lo: "ぉ",
  xya: "ゃ", lya: "ゃ", xyu: "ゅ", lyu: "ゅ", xyo: "ょ", lyo: "ょ",
  xtu: "っ", ltu: "っ", xtsu: "っ", ltsu: "っ",
  xwa: "ゎ", lwa: "ゎ",
  "-": "ー",
};

const SOKUON = /[bcdfghjkmprstvwxz]/; // 可触发促音的辅音（不含 n、y）

/**
 * 尽量把 romaji 缓冲转换为假名。
 * @param {string} input - 全部待转换 romaji（小写）
 * @returns {{kana: string, rest: string}} kana=已转换部分，rest=仍需等待的余下 romaji
 */
export function consumeRomaji(input) {
  let kana = "";
  let i = 0;

  while (i < input.length) {
    let matched = false;
    for (let len = Math.min(4, input.length - i); len >= 1; len--) {
      const chunk = input.slice(i, i + len);
      if (ROMAJI[chunk]) {
        kana += ROMAJI[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const c = input[i];
    const next = input[i + 1];

    // 促音：双写辅音
    if (c === next && SOKUON.test(c)) {
      kana += "っ";
      i += 1;
      continue;
    }

    // 拨音 ん
    if (c === "n") {
      if (next === "n") {
        kana += "ん";
        i += 2;
        continue;
      }
      if (next === "'") {
        kana += "ん";
        i += 2;
        continue;
      }
      if (next && next !== "y" && !"aiueo".includes(next)) {
        kana += "ん";
        i += 1;
        continue;
      }
      break; // n 单独 / n+元音/ny… → 等待更多输入
    }

    break; // 其余未完成的辅音，保留等待
  }

  return { kana, rest: input.slice(i) };
}

/**
 * 提交时清空缓冲：把仍能转换的转换掉，末尾单独的 n 视作 ん，其余无法成形的丢弃。
 * @param {string} pending
 * @returns {string} 追加到已确定假名后的内容
 */
export function flushRomaji(pending) {
  if (!pending) return "";
  const { kana, rest } = consumeRomaji(pending);
  if (rest === "n") return kana + "ん";
  return kana;
}
