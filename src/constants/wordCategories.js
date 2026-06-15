/**
 * 词性分类（与数据库 vocabulary.categories 对应）。
 * 一个词可有多种分类，绝大多数只有一种。
 */
export const WORD_CATEGORIES = [
  "和语动词",
  "和语名词",
  "汉字词",
  "い形容词",
  "な形容词",
  "副词",
  "外来语",
  "拟声词",
  "其他",
];

/** 未分类的占位分组名。 */
export const UNCATEGORIZED = "未分类";

/** 每个分类的配色（柔和底 + 深色文字）。 */
export const CATEGORY_STYLE = {
  和语动词: { bg: "hsl(223deg 50% 93%)", fg: "hsl(224deg 52% 35%)" },
  和语名词: { bg: "hsl(150deg 35% 90%)", fg: "hsl(152deg 42% 26%)" },
  汉字词: { bg: "hsl(42deg 70% 89%)", fg: "hsl(38deg 65% 30%)" },
  い形容词: { bg: "hsl(8deg 62% 92%)", fg: "hsl(6deg 55% 38%)" },
  な形容词: { bg: "hsl(280deg 40% 93%)", fg: "hsl(281deg 38% 40%)" },
  副词: { bg: "hsl(192deg 45% 89%)", fg: "hsl(196deg 55% 28%)" },
  外来语: { bg: "hsl(25deg 72% 91%)", fg: "hsl(22deg 65% 36%)" },
  拟声词: { bg: "hsl(330deg 50% 93%)", fg: "hsl(332deg 45% 40%)" },
  其他: { bg: "hsl(36deg 18% 88%)", fg: "hsl(30deg 9% 40%)" },
  [UNCATEGORIZED]: { bg: "hsl(36deg 18% 90%)", fg: "hsl(33deg 11% 55%)" },
};

/** 取某分类的配色，缺省回退到「其他」。 */
export function categoryStyle(category) {
  return CATEGORY_STYLE[category] ?? CATEGORY_STYLE["其他"];
}

/** 规范化词条 categories 字段为字符串数组。 */
export function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.filter((c) => typeof c === "string" && c.trim() !== "");
}
