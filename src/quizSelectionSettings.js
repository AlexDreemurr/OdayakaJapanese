export const VOCAB_SELECTION_WEIGHT_STORAGE_KEY = "vocabSelectionWeight";

/** 抽取权重默认值：1 表示完全按"做对最少优先"，0 表示完全随机。 */
const DEFAULT_VOCAB_SELECTION_WEIGHT = 1;

function clampWeight(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_VOCAB_SELECTION_WEIGHT;
  }
  return Math.min(Math.max(value, 0), 1);
}

/**
 * 读取单词抽取权重。
 * @returns {number} 0~1，0=全随机，1=全按做对最少优先
 */
export function getStoredVocabSelectionWeight() {
  const rawValue = window.localStorage.getItem(
    VOCAB_SELECTION_WEIGHT_STORAGE_KEY
  );

  if (rawValue === null) {
    return DEFAULT_VOCAB_SELECTION_WEIGHT;
  }

  const parsedValue = Number(rawValue);
  if (Number.isNaN(parsedValue)) {
    return DEFAULT_VOCAB_SELECTION_WEIGHT;
  }

  return clampWeight(parsedValue);
}

/**
 * 保存单词抽取权重。
 * @param {number} weight - 0~1
 */
export function storeVocabSelectionWeight(weight) {
  window.localStorage.setItem(
    VOCAB_SELECTION_WEIGHT_STORAGE_KEY,
    String(clampWeight(weight))
  );
}

// ─── 全部词汇（汇聚所有已加入词汇集）──────────────────────────────────────────

export const USE_ALL_VOCAB_STORAGE_KEY = "vocabUseAllVocab";

/**
 * 是否把「全部已加入词汇集」作为练习题库范围。
 * @returns {boolean}
 */
export function getStoredUseAllVocab() {
  return window.localStorage.getItem(USE_ALL_VOCAB_STORAGE_KEY) === "1";
}

/** @param {boolean} value */
export function storeUseAllVocab(value) {
  window.localStorage.setItem(USE_ALL_VOCAB_STORAGE_KEY, value ? "1" : "0");
}

// ─── 词汇练习题型比例 ────────────────────────────────────────────────────────

export const VOCAB_MODE_WEIGHTS_STORAGE_KEY = "vocabModeWeights";

/** 三种题型：句子填空 / 看汉字写假名 / 选择词义。 */
export const VOCAB_MODES = ["sentence", "typeReading", "chooseMeaning"];

/** 默认比例（0~100 量级）：句子填空为主，两种新题型适当混入。 */
const DEFAULT_MODE_WEIGHTS = { sentence: 40, typeReading: 30, chooseMeaning: 30 };

function clampNonNegative(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * 读取三种题型的权重（原始值，非归一化）。
 * @returns {{sentence:number, typeReading:number, chooseMeaning:number}}
 */
export function getStoredVocabModeWeights() {
  const raw = window.localStorage.getItem(VOCAB_MODE_WEIGHTS_STORAGE_KEY);
  if (!raw) return { ...DEFAULT_MODE_WEIGHTS };

  try {
    const parsed = JSON.parse(raw);
    const weights = {};
    for (const mode of VOCAB_MODES) {
      weights[mode] = clampNonNegative(parsed?.[mode]);
    }
    // 全为 0 时回退到默认，避免无题可出
    if (VOCAB_MODES.every((m) => weights[m] === 0)) {
      return { ...DEFAULT_MODE_WEIGHTS };
    }
    return weights;
  } catch {
    return { ...DEFAULT_MODE_WEIGHTS };
  }
}

/** @param {{sentence:number, typeReading:number, chooseMeaning:number}} weights */
export function storeVocabModeWeights(weights) {
  const safe = {};
  for (const mode of VOCAB_MODES) {
    safe[mode] = clampNonNegative(weights?.[mode]);
  }
  window.localStorage.setItem(
    VOCAB_MODE_WEIGHTS_STORAGE_KEY,
    JSON.stringify(safe)
  );
}

/**
 * 按权重随机挑选一种题型。
 * @returns {"sentence"|"typeReading"|"chooseMeaning"}
 */
export function pickVocabMode() {
  const weights = getStoredVocabModeWeights();
  const total = VOCAB_MODES.reduce((sum, m) => sum + weights[m], 0);
  if (total <= 0) return "sentence";

  let r = Math.random() * total;
  for (const mode of VOCAB_MODES) {
    r -= weights[mode];
    if (r < 0) return mode;
  }
  return "sentence";
}
