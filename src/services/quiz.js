/**
 * quiz.js
 * 共享词典测验 + 语法集测验的生成逻辑与练习记录更新。
 * 依赖：supabaseClient.js、utility.jsx（纯工具函数）、sharedDictSettings.js、grammarSettings.js
 */

import supabase from "../supabaseClient";
import {
  getSentenceTargetReading,
  splitSentence,
  extractBrackets,
  shuffle,
} from "../utility";
import {
  getStoredSharedDictSetIds,
  storeSharedDictSetIds,
} from "../sharedDictSettings";
import {
  getStoredGrammarSetIds,
  storeGrammarSetIds,
} from "../grammarSettings";
import {
  getStoredVocabSelectionWeight,
  getStoredUseAllVocab,
  pickVocabMode,
} from "../quizSelectionSettings";

const DEFAULT_PHRASE_SET_ID = 1;

// ─── 私有工具函数 ──────────────────────────────────────────────────────────────

function getPracticeCountTotal(counts) {
  if (!Array.isArray(counts)) {
    return 0;
  }

  return counts.reduce((total, count) => total + (Number(count) || 0), 0);
}

function normalizePracticeCounts(counts) {
  return Array.from({ length: 4 }, (_, index) => Number(counts?.[index]) || 0);
}

/** 找到练习次数最少的句子下标，随机打破平局。 */
function getLeastPracticedSentenceIndex(counts) {
  const normalizedCounts = normalizePracticeCounts(counts);
  const lowestCount = Math.min(...normalizedCounts);
  const candidateIndexes = normalizedCounts
    .map((count, index) => (count === lowestCount ? index : null))
    .filter((index) => index !== null);

  return candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
}

/** 句子填空/选词义题型的「做对次数」：correct_counts 之和。 */
function getCorrectTotal(row) {
  return getPracticeCountTotal(row?.correct_counts);
}

/** 看汉字写假名题型的「做对次数」：独立的 reading_correct_count。 */
function getReadingCorrectTotal(row) {
  return Number(row?.reading_correct_count) || 0;
}

/**
 * 按抽取权重从候选条目中选取一条。
 * weight 为 0 时完全随机；为 1 时完全按"做对最少优先"；
 * 介于两者之间时，以 weight 的概率执行优先选取，否则随机。
 * @param {Array<{id: number}>} items - 候选条目（含 id）
 * @param {Map} practiceById - id → 练习记录行
 * @param {number} weight - 0~1
 * @param {(row:object)=>number} getCount - 取某条记录的「做对次数」，默认按 correct_counts
 */
function selectByWeight(items, practiceById, weight, getCount = getCorrectTotal) {
  if (weight <= 0 || Math.random() >= weight) {
    return items[Math.floor(Math.random() * items.length)];
  }

  let lowestCorrect = Infinity;
  const candidates = [];

  for (const item of items) {
    const correctTotal = getCount(practiceById.get(item.id));

    if (correctTotal < lowestCorrect) {
      lowestCorrect = correctTotal;
      candidates.length = 0;
      candidates.push(item);
    } else if (correctTotal === lowestCorrect) {
      candidates.push(item);
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** 根据片假名概率决定展示假名读音还是原词。 */
function getChoiceLabel({ word, reading }, katakanaRate) {
  if (Math.random() < katakanaRate) {
    return reading || word;
  }

  return word;
}

/** 对 Supabase 查询应用词汇集过滤条件。 */
function applyPhraseSetFilter(query, phraseSetIds) {
  if (Array.isArray(phraseSetIds)) {
    if (phraseSetIds.length === 0) {
      return query.eq("set_id", -1);
    }

    return query.in("set_id", phraseSetIds);
  }

  return query;
}

// ─── 词汇集权限解析 ────────────────────────────────────────────────────────────

/**
 * 确定当前用户有权访问的词汇集 ID 列表，并同步到 localStorage。
 * 未登录时返回存储的 ID 或默认集合。
 */
async function getSafeSharedDictSetIds(user) {
  const storedIds = getStoredSharedDictSetIds();

  if (!user) {
    return storedIds ?? [DEFAULT_PHRASE_SET_ID];
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("set_members")
    .select("set_id")
    .eq("user_id", user.id);

  if (membershipError) {
    console.error(membershipError.message);
    return storedIds;
  }

  const memberSetIds = memberships.map((membership) => membership.set_id);

  // 「全部词汇」：忽略已存的子集，使用全部已加入的词汇集。
  if (getStoredUseAllVocab()) {
    return memberSetIds;
  }

  const candidateSetIds =
    storedIds === null
      ? Array.from(new Set([DEFAULT_PHRASE_SET_ID, ...memberSetIds]))
      : storedIds.filter((id) => memberSetIds.includes(id));

  if (candidateSetIds.length > 0) {
    storeSharedDictSetIds(candidateSetIds);
    return candidateSetIds;
  }

  if (memberSetIds.length > 0) {
    const fallbackSetIds = [memberSetIds[0]];
    storeSharedDictSetIds(fallbackSetIds);
    return fallbackSetIds;
  }

  if (storedIds === null) {
    const fallbackSetIds = [DEFAULT_PHRASE_SET_ID];
    storeSharedDictSetIds(fallbackSetIds);
    return fallbackSetIds;
  }

  return [];
}

// ─── 词汇抽取 ─────────────────────────────────────────────────────────────────

/**
 * 在指定词汇集中随机抽取一条词条（未登录时使用）。
 * @param {number[]|null} phraseSetIds
 * @returns {Promise<object|null>}
 */
async function getRandomVocab(phraseSetIds = null) {
  const { count } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*", { count: "exact", head: true }),
    phraseSetIds
  );

  if (!count) {
    return null;
  }

  const randomOffset = Math.floor(Math.random() * count);
  const { data, error } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*"),
    phraseSetIds
  )
    .range(randomOffset, randomOffset)
    .single();

  if (error) {
    console.error(error.message);
    return null;
  }

  return data;
}

/**
 * 按抽取权重选取词条（已登录时使用）。
 * @param {string} userId
 * @param {number[]|null} phraseSetIds
 * @param {number} selectionWeight - 0~1，0=全随机，1=全按做对最少优先
 * @returns {Promise<object|null>}
 */
async function getPracticeVocab(userId, phraseSetIds = null, selectionWeight = 1) {
  const { data: vocabularies, error } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*"),
    phraseSetIds
  );

  if (error) {
    console.error(error.message);
    return getRandomVocab(phraseSetIds);
  }

  if (!vocabularies?.length) {
    return null;
  }

  const vocabularyIds = vocabularies.map((vocab) => vocab.id);
  const { data: practiceRows, error: practiceError } = await supabase
    .from("vocab_practice")
    .select("vocabulary_id, correct_counts, attempt_counts")
    .eq("user_id", userId)
    .in("vocabulary_id", vocabularyIds);

  if (practiceError) {
    console.error(practiceError.message);
    return vocabularies[Math.floor(Math.random() * vocabularies.length)];
  }

  const practiceByVocabularyId = new Map(
    (practiceRows ?? []).map((row) => [row.vocabulary_id, row])
  );

  const selectedVocab = selectByWeight(
    vocabularies,
    practiceByVocabularyId,
    selectionWeight
  );

  return {
    ...selectedVocab,
    practiceCorrectCounts: normalizePracticeCounts(
      practiceByVocabularyId.get(selectedVocab.id)?.correct_counts
    ),
    practiceAttemptCounts: normalizePracticeCounts(
      practiceByVocabularyId.get(selectedVocab.id)?.attempt_counts
    ),
  };
}

/**
 * 随机抽取指定数量的词条（用作错误选项），排除给定的词。
 * @param {number} count
 * @param {string} avoidWord - 已在题目中使用的正确词
 * @param {number[]|null} phraseSetIds
 * @returns {Promise<Array<{word: string, reading: string}>>}
 */
async function getRandomWords(count = 3, avoidWord = "", phraseSetIds = null) {
  const { count: total } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*", { count: "exact", head: true }),
    phraseSetIds
  );

  if (!total) {
    return [];
  }

  const results = [];
  const usedWords = new Set();
  if (avoidWord) usedWords.add(avoidWord);

  let attempts = 0;
  while (results.length < count && attempts < count * 5) {
    attempts++;
    const offset = Math.floor(Math.random() * total);
    const { data } = await applyPhraseSetFilter(
      supabase.from("vocabulary").select("word, reading"),
      phraseSetIds
    )
      .range(offset, offset)
      .single();

    if (data && !usedWords.has(data.word)) {
      usedWords.add(data.word);
      results.push(data);
    }
  }

  return results;
}

/**
 * 拉取题库内全部词条及（登录用户的）练习记录。
 * @returns {Promise<{pool: Array, practiceById: Map}>}
 */
async function getVocabPoolWithPractice(user, phraseSetIds) {
  const { data: vocabularies, error } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*"),
    phraseSetIds
  );

  if (error || !vocabularies?.length) {
    if (error) console.error(error.message);
    return { pool: [], practiceById: new Map() };
  }

  let practiceById = new Map();
  if (user) {
    const ids = vocabularies.map((v) => v.id);
    const { data: rows, error: practiceError } = await supabase
      .from("vocab_practice")
      .select(
        "vocabulary_id, correct_counts, attempt_counts, reading_correct_count, reading_attempt_count"
      )
      .eq("user_id", user.id)
      .in("vocabulary_id", ids);
    if (practiceError) {
      console.error(practiceError.message);
    } else {
      practiceById = new Map((rows ?? []).map((r) => [r.vocabulary_id, r]));
    }
  }

  return { pool: vocabularies, practiceById };
}

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 从共享词典生成一道随机测验题目。
 * 题型按用户设置的比例随机：句子填空 / 看汉字写假名 / 选择词义。
 * @param {number} katakanaRate - 选项以片假名展示的概率 (0~1)
 * @returns {Promise<object|null>} 题目对象，无可用词汇时返回 null
 */
export async function fetchSharedDictQuiz(katakanaRate = 0) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const phraseSetIds = await getSafeSharedDictSetIds(user);
  const selectionWeight = getStoredVocabSelectionWeight();
  const mode = pickVocabMode();

  // 新题型可能因题库不满足条件（如无含汉字的词）返回 null，回退到句子填空。
  if (mode === "typeReading") {
    const quiz = await fetchTypeReadingQuiz(user, phraseSetIds, selectionWeight);
    if (quiz) return quiz;
  } else if (mode === "chooseMeaning") {
    const quiz = await fetchChooseMeaningQuiz(
      user,
      phraseSetIds,
      selectionWeight,
      katakanaRate
    );
    if (quiz) return quiz;
  }
  return fetchSentenceQuiz(user, phraseSetIds, selectionWeight, katakanaRate);
}

/** 题型一：句子填空（原有题型）。 */
async function fetchSentenceQuiz(user, phraseSetIds, selectionWeight, katakanaRate) {
  const vocab = user
    ? await getPracticeVocab(user.id, phraseSetIds, selectionWeight)
    : await getRandomVocab(phraseSetIds);

  if (!vocab) {
    return null;
  }

  const otherChoices = await getRandomWords(3, vocab.word, phraseSetIds);
  const sentenceIndex = user
    ? getLeastPracticedSentenceIndex(vocab.practiceAttemptCounts)
    : Math.floor(Math.random() * 4);
  const rawSentence = vocab.sentences[sentenceIndex];
  const targetReading = getSentenceTargetReading(rawSentence, vocab.reading);
  const [sentence, answer] = splitSentence(rawSentence);
  const correctChoice = extractBrackets(rawSentence);
  const choices = shuffle([
    {
      value: correctChoice,
      label: getChoiceLabel(
        { word: correctChoice, reading: targetReading },
        katakanaRate
      ),
    },
    ...otherChoices.map((v) => ({
      value: v.word,
      label: getChoiceLabel(v, katakanaRate),
    })),
  ]);

  return {
    id: Math.random(),
    mode: "sentence",
    rawSentence,
    question: sentence,
    choices: choices.map((choice) => choice.value),
    choiceLabels: choices.map((choice) => choice.label),
    answer,
    form: vocab.word,
    meaning: vocab.meaning,
    reading: targetReading,
    vocabularyReading: vocab.reading,
    vocabularyPitch: vocab.pitch,
    vocabularyId: vocab.id,
    sentenceIndex,
  };
}

/** 判断字符串是否含汉字（仅含假名的词没有「看汉字写假名」的意义）。 */
function hasKanji(text) {
  return typeof text === "string" && /[㐀-䶿一-鿿々〆ヶ]/.test(text);
}

/** 题型二：看汉字写假名，一题 3 个单词同时作答（仅限含汉字的词）。 */
async function fetchTypeReadingQuiz(user, phraseSetIds, selectionWeight) {
  const { pool, practiceById } = await getVocabPoolWithPractice(
    user,
    phraseSetIds
  );
  // 必须有读音、有汉字（纯平/片假名词不抽查）。
  const usable = pool.filter((v) => v.reading && hasKanji(v.word));
  if (!usable.length) return null;

  const count = Math.min(3, usable.length);
  const remaining = [...usable];
  const picked = [];
  for (let i = 0; i < count; i++) {
    // 用独立的「看汉字写假名」做题记录来优先调度
    const choice = selectByWeight(
      remaining,
      practiceById,
      selectionWeight,
      getReadingCorrectTotal
    );
    picked.push(choice);
    remaining.splice(remaining.indexOf(choice), 1);
  }

  return {
    id: Math.random(),
    mode: "typeReading",
    words: picked.map((v) => ({
      vocabularyId: v.id,
      word: v.word,
      reading: v.reading,
      meaning: v.meaning,
      pitch: v.pitch,
    })),
  };
}

/** 题型三：看假名/汉字选词义，最多 8 个备选。 */
async function fetchChooseMeaningQuiz(
  user,
  phraseSetIds,
  selectionWeight,
  katakanaRate
) {
  const { pool, practiceById } = await getVocabPoolWithPractice(
    user,
    phraseSetIds
  );
  const withMeaning = pool.filter((v) => v.meaning);
  const usable = withMeaning.length ? withMeaning : pool;
  if (!usable.length) return null;

  const target = selectByWeight(usable, practiceById, selectionWeight);
  const distractorMeanings = [
    ...new Set(
      usable
        .filter((v) => v.id !== target.id && v.meaning && v.meaning !== target.meaning)
        .map((v) => v.meaning)
    ),
  ];
  const distractors = shuffle(distractorMeanings).slice(0, 7);
  const choices = shuffle([target.meaning, ...distractors]);

  const showReading = !!target.reading && Math.random() < katakanaRate;

  return {
    id: Math.random(),
    mode: "chooseMeaning",
    vocabularyId: target.id,
    prompt: showReading ? target.reading : target.word,
    promptIsReading: showReading,
    word: target.word,
    reading: target.reading,
    vocabularyPitch: target.pitch,
    choices,
    choiceLabels: choices,
    answer: target.meaning,
    meaning: target.meaning,
  };
}

/**
 * 将本题的答题结果（对/错）写入 vocab_practice 表，用于练习算法优先调度。
 * 未登录时不操作。
 * @param {object} quizObject - fetchSharedDictQuiz 返回的题目对象
 * @param {boolean} isCorrect
 */
export async function updateVocabPractice(quizObject, isCorrect) {
  if (!quizObject?.vocabularyId || quizObject.sentenceIndex === undefined) {
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const sentenceIndex = Number(quizObject.sentenceIndex);
  if (
    !Number.isInteger(sentenceIndex) ||
    sentenceIndex < 0 ||
    sentenceIndex > 3
  ) {
    return;
  }

  const { data, error } = await supabase
    .from("vocab_practice")
    .select("correct_counts, attempt_counts")
    .eq("user_id", user.id)
    .eq("vocabulary_id", quizObject.vocabularyId)
    .maybeSingle();

  if (error) {
    console.error(error.message);
    return;
  }

  const correctCounts = normalizePracticeCounts(data?.correct_counts);
  const attemptCounts = normalizePracticeCounts(data?.attempt_counts);

  attemptCounts[sentenceIndex] += 1;
  if (isCorrect) {
    correctCounts[sentenceIndex] += 1;
  }

  const { error: upsertError } = await supabase.from("vocab_practice").upsert(
    {
      user_id: user.id,
      vocabulary_id: quizObject.vocabularyId,
      correct_counts: correctCounts,
      attempt_counts: attemptCounts,
    },
    { onConflict: "user_id,vocabulary_id" }
  );

  if (upsertError) {
    console.error(upsertError.message);
  }
}

/**
 * 为新题型（看汉字写假名 / 选词义）累加一条练习记录。
 * 这些题型没有 sentenceIndex，统一记到第 0 槽。
 */
async function incrementVocabPractice(userId, vocabularyId, isCorrect) {
  const { data, error } = await supabase
    .from("vocab_practice")
    .select("correct_counts, attempt_counts")
    .eq("user_id", userId)
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle();

  if (error) {
    console.error(error.message);
    return;
  }

  const correctCounts = normalizePracticeCounts(data?.correct_counts);
  const attemptCounts = normalizePracticeCounts(data?.attempt_counts);
  attemptCounts[0] += 1;
  if (isCorrect) correctCounts[0] += 1;

  const { error: upsertError } = await supabase.from("vocab_practice").upsert(
    {
      user_id: userId,
      vocabulary_id: vocabularyId,
      correct_counts: correctCounts,
      attempt_counts: attemptCounts,
    },
    { onConflict: "user_id,vocabulary_id" }
  );

  if (upsertError) console.error(upsertError.message);
}

/**
 * 「看汉字写假名」独立练习记录累加（reading_correct_count / reading_attempt_count）。
 */
async function incrementReadingPractice(userId, vocabularyId, isCorrect) {
  const { data, error } = await supabase
    .from("vocab_practice")
    .select("reading_correct_count, reading_attempt_count")
    .eq("user_id", userId)
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle();

  if (error) {
    console.error(error.message);
    return;
  }

  const readingCorrect = (Number(data?.reading_correct_count) || 0) + (isCorrect ? 1 : 0);
  const readingAttempt = (Number(data?.reading_attempt_count) || 0) + 1;

  const { error: upsertError } = await supabase.from("vocab_practice").upsert(
    {
      user_id: userId,
      vocabulary_id: vocabularyId,
      reading_correct_count: readingCorrect,
      reading_attempt_count: readingAttempt,
    },
    { onConflict: "user_id,vocabulary_id" }
  );

  if (upsertError) console.error(upsertError.message);
}

/**
 * 「看汉字写假名」练习结果写入（3 个单词分别记录，独立于句子填空）。
 * @param {Array<{vocabularyId:number, isCorrect:boolean}>} results
 */
export async function updateTypeReadingPractice(results) {
  if (!Array.isArray(results) || results.length === 0) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  for (const r of results) {
    if (r?.vocabularyId == null) continue;
    await incrementReadingPractice(user.id, r.vocabularyId, !!r.isCorrect);
  }
}

/**
 * 「选词义」练习结果写入。
 * @param {object} quizObject - fetchSharedDictQuiz 返回的题目对象
 * @param {boolean} isCorrect
 */
export async function updateChooseMeaningPractice(quizObject, isCorrect) {
  if (quizObject?.vocabularyId == null) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await incrementVocabPractice(user.id, quizObject.vocabularyId, !!isCorrect);
}

// ══════════════════════════════════════════════════════════════════════════════
// 语法集测验
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 确定当前用户有权访问的语法集 ID 列表，并同步到 localStorage。
 */
async function getSafeGrammarSetIds(user) {
  const storedIds = getStoredGrammarSetIds();

  if (!user) {
    return storedIds ?? [];
  }

  const { data: memberships, error } = await supabase
    .from("grammar_set_members")
    .select("set_id")
    .eq("user_id", user.id);

  if (error) {
    console.error(error.message);
    return storedIds ?? [];
  }

  const memberSetIds = memberships.map((m) => m.set_id);
  const candidateSetIds =
    storedIds === null
      ? memberSetIds
      : storedIds.filter((id) => memberSetIds.includes(id));

  if (candidateSetIds.length > 0) {
    storeGrammarSetIds(candidateSetIds);
    return candidateSetIds;
  }

  if (memberSetIds.length > 0) {
    storeGrammarSetIds([memberSetIds[0]]);
    return [memberSetIds[0]];
  }

  return [];
}

/** 在指定语法集中随机抽取一条语法条目。 */
async function getRandomGrammar(grammarSetIds) {
  const { count } = await applyPhraseSetFilter(
    supabase.from("grammar_items").select("*", { count: "exact", head: true }),
    grammarSetIds
  );

  if (!count) return null;

  const offset = Math.floor(Math.random() * count);
  const { data, error } = await applyPhraseSetFilter(
    supabase.from("grammar_items").select("*"),
    grammarSetIds
  )
    .range(offset, offset)
    .single();

  if (error) { console.error(error.message); return null; }
  return data;
}

/** 优先选取练习次数最少的语法条目（已登录时使用）。 */
async function getPracticeGrammar(userId, grammarSetIds) {
  const { data: items, error } = await applyPhraseSetFilter(
    supabase.from("grammar_items").select("*"),
    grammarSetIds
  );

  if (error || !items?.length) {
    console.error(error?.message);
    return getRandomGrammar(grammarSetIds);
  }

  const grammarIds = items.map((item) => item.id);
  const { data: practiceRows, error: practiceError } = await supabase
    .from("grammar_practice")
    .select("grammar_id, correct_counts, attempt_counts")
    .eq("user_id", userId)
    .in("grammar_id", grammarIds);

  if (practiceError) {
    console.error(practiceError.message);
    return items[Math.floor(Math.random() * items.length)];
  }

  const practiceById = new Map(
    (practiceRows ?? []).map((row) => [row.grammar_id, row])
  );
  let lowestTotal = Infinity;
  const candidates = [];

  for (const item of items) {
    const total = getPracticeCountTotal(practiceById.get(item.id)?.attempt_counts);
    if (total < lowestTotal) {
      lowestTotal = total;
      candidates.length = 0;
      candidates.push(item);
    } else if (total === lowestTotal) {
      candidates.push(item);
    }
  }

  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    ...selected,
    practiceCorrectCounts: normalizePracticeCounts(practiceById.get(selected.id)?.correct_counts),
    practiceAttemptCounts: normalizePracticeCounts(practiceById.get(selected.id)?.attempt_counts),
  };
}

/** 随机抽取若干语法形式作为干扰选项。 */
async function getRandomGrammarForms(count, avoidForm, grammarSetIds) {
  const { count: total } = await applyPhraseSetFilter(
    supabase.from("grammar_items").select("*", { count: "exact", head: true }),
    grammarSetIds
  );
  if (!total) return [];

  const results = [];
  const used = new Set([avoidForm]);
  let attempts = 0;

  while (results.length < count && attempts < count * 5) {
    attempts++;
    const offset = Math.floor(Math.random() * total);
    const { data } = await applyPhraseSetFilter(
      supabase.from("grammar_items").select("form"),
      grammarSetIds
    )
      .range(offset, offset)
      .single();

    if (data && !used.has(data.form)) {
      used.add(data.form);
      results.push(data.form);
    }
  }
  return results;
}

/**
 * 从语法集生成一道随机测验题目。
 * 已登录用户会优先选取练习次数最少的语法条目。
 * @returns {Promise<object|null>} 题目对象，无可用数据时返回 null
 */
export async function fetchGrammarSetQuiz() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const grammarSetIds = await getSafeGrammarSetIds(user);
  if (grammarSetIds.length === 0) return null;

  const grammar = user
    ? await getPracticeGrammar(user.id, grammarSetIds)
    : await getRandomGrammar(grammarSetIds);

  if (!grammar) return null;

  const sentences = Array.isArray(grammar.sentences) ? grammar.sentences : [];
  if (sentences.length === 0) return null;

  const maxIndex = sentences.length - 1;
  const sentenceIndex = user
    ? Math.min(getLeastPracticedSentenceIndex(grammar.practiceAttemptCounts), maxIndex)
    : Math.floor(Math.random() * sentences.length);

  const rawSentence = sentences[sentenceIndex];
  const sentenceText = typeof rawSentence === "string" ? rawSentence : rawSentence?.text ?? "";
  const [question, answer] = splitSentence(sentenceText);
  const correctChoice = extractBrackets(sentenceText) ?? grammar.form;
  const distractors = await getRandomGrammarForms(3, grammar.form, grammarSetIds);
  const choices = shuffle([correctChoice, ...distractors]);

  return {
    id: Math.random(),
    rawSentence: sentenceText,
    question,
    choices,
    choiceLabels: choices,
    answer,
    form: grammar.form,
    meaning: grammar.meaning,
    grammarId: grammar.id,
    sentenceIndex,
  };
}

/**
 * 将语法测验答题结果写入 grammar_practice 表。
 * @param {object} quizObject - fetchGrammarSetQuiz 返回的题目对象
 * @param {boolean} isCorrect
 */
export async function updateGrammarPractice(quizObject, isCorrect) {
  if (!quizObject?.grammarId || quizObject.sentenceIndex === undefined) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const sentenceIndex = Number(quizObject.sentenceIndex);
  if (!Number.isInteger(sentenceIndex) || sentenceIndex < 0 || sentenceIndex > 3) return;

  const { data, error } = await supabase
    .from("grammar_practice")
    .select("correct_counts, attempt_counts")
    .eq("user_id", user.id)
    .eq("grammar_id", quizObject.grammarId)
    .maybeSingle();

  if (error) { console.error(error.message); return; }

  const correctCounts = normalizePracticeCounts(data?.correct_counts);
  const attemptCounts = normalizePracticeCounts(data?.attempt_counts);
  attemptCounts[sentenceIndex] += 1;
  if (isCorrect) correctCounts[sentenceIndex] += 1;

  const { error: upsertError } = await supabase.from("grammar_practice").upsert(
    {
      user_id: user.id,
      grammar_id: quizObject.grammarId,
      correct_counts: correctCounts,
      attempt_counts: attemptCounts,
    },
    { onConflict: "user_id,grammar_id" }
  );

  if (upsertError) console.error(upsertError.message);
}
