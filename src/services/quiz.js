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
 * 优先选取练习次数最少的词条（已登录时使用）。
 * @param {string} userId
 * @param {number[]|null} phraseSetIds
 * @returns {Promise<object|null>}
 */
async function getPracticeVocab(userId, phraseSetIds = null) {
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
  let lowestTotal = Infinity;
  const candidates = [];

  for (const vocab of vocabularies) {
    const total = getPracticeCountTotal(
      practiceByVocabularyId.get(vocab.id)?.attempt_counts
    );

    if (total < lowestTotal) {
      lowestTotal = total;
      candidates.length = 0;
      candidates.push(vocab);
    } else if (total === lowestTotal) {
      candidates.push(vocab);
    }
  }

  const selectedVocab =
    candidates[Math.floor(Math.random() * candidates.length)];

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

// ─── 公共 API ─────────────────────────────────────────────────────────────────

/**
 * 从共享词典生成一道随机测验题目。
 * 已登录用户会优先选取练习次数最少的词条。
 * @param {number} katakanaRate - 选项以片假名展示的概率 (0~1)
 * @returns {Promise<object|null>} 题目对象，无可用词汇时返回 null
 */
export async function fetchSharedDictQuiz(katakanaRate = 0) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const phraseSetIds = await getSafeSharedDictSetIds(user);
  const vocab = user
    ? await getPracticeVocab(user.id, phraseSetIds)
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
