import React from "react";
import styled from "styled-components";

export function getSentenceText(sentence) {
  return typeof sentence === "string" ? sentence : sentence?.text ?? "";
}

/**
 * 归一化假名，用于「看汉字输入假名」练习的答案比对。
 * 片假名转平假名，去除空白、中点、长音线等装饰字符。
 * @param {string} value
 * @returns {string}
 */
export function normalizeKana(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[\s　・･ー―‐-]/g, "")
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    );
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
  display: inline-block;
  min-width: 3rem;
  text-align: center;
  color: var(--accent);
  font-weight: 700;
  background-color: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: 0.4rem;
  padding: 0 0.9rem;
  margin: 0 0.3rem;
`;
