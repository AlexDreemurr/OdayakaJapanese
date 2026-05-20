import React from "react";
import styled from "styled-components";
import {
  getStoredSharedDictSetIds,
  storeSharedDictSetIds,
} from "./sharedDictSettings";
import supabase from "./supabaseClient";

const DEFAULT_PHRASE_SET_ID = 1;

export function getSentenceText(sentence) {
  return typeof sentence === "string" ? sentence : sentence?.text ?? "";
}

export function getSentenceTargetReading(sentence, wordReading = "") {
  return typeof sentence === "string"
    ? wordReading
    : sentence?.target_reading ?? wordReading;
}

export function normalizeSentences(sentences, wordReading = "") {
  if (!Array.isArray(sentences)) {
    return [];
  }

  return sentences.map((sentence) =>
    typeof sentence === "string"
      ? { text: sentence, target_reading: wordReading }
      : {
          text: sentence?.text ?? "",
          target_reading: sentence?.target_reading ?? wordReading,
        }
  );
}

export function splitSentence(sentence) {
  const inners = [];
  const text = getSentenceText(sentence);
  const replaced = text.replace(/[{｛]([^{｛}｝]*)[}｝]/g, (_, inner) => {
    inners.push(inner);
    return "@";
  });
  return [replaced, inners.join("~")];
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function randomPicker(list, num) {
  const unique = [...new Set(list)];
  return shuffle(unique).slice(0, num);
}

function getPracticeCountTotal(counts) {
  if (!Array.isArray(counts)) {
    return 0;
  }

  return counts.reduce((total, count) => total + (Number(count) || 0), 0);
}

function normalizePracticeCounts(counts) {
  return Array.from({ length: 4 }, (_, index) => Number(counts?.[index]) || 0);
}

function getLeastPracticedSentenceIndex(counts) {
  const normalizedCounts = normalizePracticeCounts(counts);
  const lowestCount = Math.min(...normalizedCounts);
  const candidateIndexes = normalizedCounts
    .map((count, index) => (count === lowestCount ? index : null))
    .filter((index) => index !== null);

  return candidateIndexes[Math.floor(Math.random() * candidateIndexes.length)];
}

export function renderQuestion(question) {
  return question.split("@").map((part, index, arr) => (
    <React.Fragment key={index}>
      {part}
      {index < arr.length - 1 && <Blank>?</Blank>}
    </React.Fragment>
  ));
}

export function getNewQuizObject(grammars) {
  // 生成新题目！
  const itemNum = parseInt(Math.random() * grammars.length);
  const sentenceNum = parseInt(Math.random() * 4) + 1;
  const rawSentence = grammars[itemNum][`sentence${sentenceNum}`];
  const [sentence, answer] = splitSentence(rawSentence);
  const placeholders = randomPicker(grammars, 3).map((d) => d.form);

  const newQuizObject = {
    id: Math.random(),
    rawSentence: rawSentence,
    question: sentence,
    choices: shuffle([answer, ...placeholders]),
    answer: answer,
    form: grammars[itemNum].form,
    meaning: grammars[itemNum].meaning,
  };
  return newQuizObject;
}
function getChoiceLabel({ word, reading }, katakanaRate) {
  if (Math.random() < katakanaRate) {
    return reading || word;
  }

  return word;
}

export async function fetchSharedDictQuiz(supabase, katakanaRate = 0) {
  // 访问supabase共享数据库并生成一道随机题目
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const phraseSetIds = await getSafeSharedDictSetIds(supabase, user);
  const vocab = user
    ? await getPracticeVocab(supabase, user.id, phraseSetIds)
    : await getRandomVocab(supabase, phraseSetIds);
  const otherChoices = await getRandomWords(
    3,
    vocab.word,
    supabase,
    phraseSetIds
  );
  const sentenceIndex = user
    ? getLeastPracticedSentenceIndex(vocab.practiceAttemptCounts)
    : parseInt(Math.random() * 4);
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

async function getSafeSharedDictSetIds(supabase, user) {
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

export async function updateVocabPractice(supabase, quizObject, isCorrect) {
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
export async function deepseekAPI(text, prompt, type = "translate") {
  const { data, error } = await supabase.functions.invoke("deepseek-chat", {
    body: {
      type,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: text },
      ],
    },
  });

  if (error) throw new Error(`请求失败：${error.message}`);

  return data.choices[0].message.content.trim();
}

function applyPhraseSetFilter(query, phraseSetIds) {
  if (Array.isArray(phraseSetIds)) {
    if (phraseSetIds.length === 0) {
      return query.eq("set_id", -1);
    }

    return query.in("set_id", phraseSetIds);
  }

  return query;
}

export async function getRandomVocab(supabase, phraseSetIds = null) {
  // 先查总数
  const { count } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*", { count: "exact", head: true }),
    phraseSetIds
  );
  if (!count) {
    return null;
  }
  // 随机偏移
  const randomOffset = Math.floor(Math.random() * count);
  // 取那一条
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

export async function getPracticeVocab(supabase, userId, phraseSetIds = null) {
  const { data: vocabularies, error } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*"),
    phraseSetIds
  );

  if (error) {
    console.error(error.message);
    return getRandomVocab(supabase, phraseSetIds);
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

export async function getRandomWords(
  count = 3,
  avoid_word = "",
  supabase,
  phraseSetIds = null
) {
  const { count: total } = await applyPhraseSetFilter(
    supabase.from("vocabulary").select("*", { count: "exact", head: true }),
    phraseSetIds
  );
  if (!total) {
    return [];
  }

  const results = [];
  const usedWords = new Set();
  if (avoid_word) usedWords.add(avoid_word); // 提前加入黑名单

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

export function extractBrackets(str) {
  const match = getSentenceText(str).match(/\{(.+?)\}/);
  return match ? match[1] : null;
}

export function getThreeParts(str) {
  const text = getSentenceText(str);
  // 查找第一个左括号（支持全角 ｛ 和半角 {）
  let leftIndex = -1;
  let leftChar = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{" || ch === "｛") {
      leftIndex = i;
      leftChar = ch;
      break;
    }
  }

  // 没有左括号，直接返回纯文本段落
  if (leftIndex === -1) {
    return <p>{text}</p>;
  }

  // 确定匹配的右括号类型
  const expectedRight = leftChar === "{" ? "}" : "｝";
  let rightIndex = -1;
  for (let i = leftIndex + 1; i < text.length; i++) {
    if (text[i] === expectedRight) {
      rightIndex = i;
      break;
    }
  }

  // 没有找到右括号，返回原文本段落
  if (rightIndex === -1) {
    return <p>{text}</p>;
  }

  // 提取三部分
  const before = text.slice(0, leftIndex); // 括号前的文本
  const inside = text.slice(leftIndex + 1, rightIndex); // 括号内的内容（语法点）
  const after = text.slice(rightIndex + 1); // 括号后的文本

  return { before, inside, after };
}

// 将世界时间戳诸如
// 2026-04-25T08:36:51.511087+00:00
// 转化成中国大陆时间，并以 26/04/25 这样的格式输出
export function formatToChinaTime(isoString) {
  const date = new Date(isoString);

  const chinaDate = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  );

  const year = String(chinaDate.getFullYear()).slice(2);
  const month = String(chinaDate.getMonth() + 1).padStart(2, "0");
  const day = String(chinaDate.getDate()).padStart(2, "0");

  return `${year}/${month}/${day}`;
}
const Blank = styled.span`
  border: 1px black solid;
  padding: 0px 1.5rem;
  margin: 0 5px;
`;
