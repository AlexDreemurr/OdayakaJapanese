/**
 * TypeReadingQuiz
 * 词汇练习题型二：看汉字写假名，一题 3 个单词同时作答。
 * 自包含「作答 → 结果」两个阶段，按归一化假名比对答案。
 */

import React from "react";
import styled from "styled-components";
import Button from "../Button/Button";
import KanaKeyboard from "../KanaKeyboard/KanaKeyboard";
import { updateTypeReadingPractice } from "../../services/quiz";
import { playVocabAudioSequence } from "../../services/vocabAudio";
import { normalizeKana } from "../../utility";
import { consumeRomaji, flushRomaji } from "../../romaji";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";

export default function TypeReadingQuiz({
  quizObject,
  showAnswerToast,
  hideAnswerToast,
  onContinue,
}) {
  const words = quizObject.words ?? [];
  // answers：已确定的假名；pending：当前激活格尚未转换的 romaji
  const [answers, setAnswers] = React.useState(() => words.map(() => ""));
  const [pending, setPending] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(false);

  // 评判用最终答案（把残留 romaji 一并清算）
  const finalAnswers = answers.map((kana, i) =>
    i === activeIndex ? kana + flushRomaji(pending) : kana
  );
  const results = words.map((w, i) => ({
    vocabularyId: w.vocabularyId,
    isCorrect: normalizeKana(finalAnswers[i]) === normalizeKana(w.reading),
  }));

  function setActiveAnswer(updater) {
    setAnswers((cur) => cur.map((v, i) => (i === activeIndex ? updater(v) : v)));
  }

  function handleLetter(ch) {
    if (submitted) return;
    const { kana, rest } = consumeRomaji(pending + ch);
    if (kana) setActiveAnswer((v) => v + kana);
    setPending(rest);
  }

  function handleLongVowel() {
    if (submitted) return;
    // 先清算缓冲，再补长音
    const flushed = flushRomaji(pending);
    setActiveAnswer((v) => v + flushed + "ー");
    setPending("");
  }

  function handleBackspace() {
    if (submitted) return;
    if (pending) {
      setPending((p) => p.slice(0, -1));
    } else {
      setActiveAnswer((v) => v.slice(0, -1));
    }
  }

  function selectField(i) {
    if (submitted || i === activeIndex) return;
    // 切换前清算当前缓冲到原格子
    const flushed = flushRomaji(pending);
    if (flushed) setActiveAnswer((v) => v + flushed);
    setPending("");
    setActiveIndex(i);
  }

  function handleSubmit() {
    if (submitted) return;
    // 写回清算后的最终答案，保证显示与判定一致
    setAnswers(finalAnswers);
    setPending("");
    setSubmitted(true);
    const allCorrect = results.every((r) => r.isCorrect);
    showAnswerToast(allCorrect);
    updateTypeReadingPractice(results);
    // 答完依次朗读三个单词
    playVocabAudioSequence(
      words.map((w) => ({
        path: w.audioPaths?.word,
        fallbackText: w.reading || w.word,
      }))
    );
  }

  function handleContinue() {
    hideAnswerToast();
    onContinue();
  }

  return (
    <Article>
      <Heading>看汉字，写出假名读音</Heading>

      <WordList>
        {words.map((w, i) => {
          const ok = results[i].isCorrect;
          const state = submitted ? (ok ? "correct" : "wrong") : "idle";
          const isActive = !submitted && activeIndex === i;
          const showPlaceholder = !answers[i] && !(isActive && pending);
          return (
            <Row key={i} $state={state}>
              <WordCol>
                <Word>{w.word}</Word>
                {submitted && <Meaning>{w.meaning}</Meaning>}
              </WordCol>
              <AnswerCol>
                <Field
                  type="button"
                  $state={state}
                  $active={isActive}
                  disabled={submitted}
                  onClick={() => selectField(i)}
                >
                  {showPlaceholder ? (
                    <FieldPlaceholder>ふりがな</FieldPlaceholder>
                  ) : (
                    <FieldText>
                      {answers[i]}
                      {isActive && pending && <Pending>{pending}</Pending>}
                    </FieldText>
                  )}
                  {isActive && <Caret />}
                </Field>
                {submitted && !ok && <Correct>正确：{w.reading}</Correct>}
              </AnswerCol>
            </Row>
          );
        })}
      </WordList>

      {!submitted && (
        <KanaKeyboard
          onLetter={handleLetter}
          onLongVowel={handleLongVowel}
          onBackspace={handleBackspace}
        />
      )}

      {!submitted ? (
        <WideButton type="primary" onClick={handleSubmit}>
          提交
        </WideButton>
      ) : (
        <WideButton type="primary" onClick={handleContinue}>
          继续:D
        </WideButton>
      )}
    </Article>
  );
}

const Article = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`;
const Heading = styled.h2`
  font-size: ${FONT_SIZE.default};
  font-weight: 700;
  color: var(--text);
`;
const WordList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;
const ROW_BORDER = {
  idle: "var(--border)",
  correct: "var(--green15)",
  wrong: "var(--red15)",
};
const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.9rem;
  background-color: var(--surface);
  border: 1px solid ${(p) => ROW_BORDER[p.$state]};
  border-radius: 0.7rem;
  box-shadow: var(--shadow-sm);
`;
const WordCol = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;
const Word = styled.div`
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
  word-break: break-word;
`;
const Meaning = styled.div`
  font-size: ${FONT_SIZE.tiny};
  color: var(--text-muted);
  word-break: break-word;
`;
const AnswerCol = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;
const FIELD_BORDER = {
  idle: "var(--gray60)",
  correct: "var(--green15)",
  wrong: "var(--red15)",
};
const Field = styled.button`
  display: flex;
  align-items: center;
  gap: 0.1rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 2.4rem;
  padding: 0.35rem 0.6rem;
  text-align: left;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  background-color: var(--gray95);
  border: none;
  border-bottom: 2px solid
    ${(p) => (p.$active ? "var(--accent)" : FIELD_BORDER[p.$state])};
  border-radius: 0.4rem 0.4rem 0 0;
  box-shadow: ${(p) => (p.$active ? "0 0 0 2px var(--accent-soft)" : "none")};
  transition: border-color 120ms ease, box-shadow 120ms ease;
`;
const FieldText = styled.span`
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.large};
  color: var(--text);
  word-break: break-word;
`;
const Pending = styled.span`
  color: var(--accent);
  font-family: ${FONT_FAMILY.english_primary};
  text-transform: uppercase;
  border-bottom: 1px dashed var(--accent);
`;
const FieldPlaceholder = styled.span`
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.large};
  color: var(--gray60);
`;
const Caret = styled.span`
  width: 2px;
  height: 1.3rem;
  background-color: var(--accent);
  border-radius: 1px;
  animation: blink 1s steps(1) infinite;
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
`;
const Correct = styled.span`
  font-size: ${FONT_SIZE.tiny};
  color: var(--green15);
`;
const WideButton = styled(Button)`
  max-width: none;
`;
