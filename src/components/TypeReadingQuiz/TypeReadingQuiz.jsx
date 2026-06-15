/**
 * TypeReadingQuiz
 * 词汇练习题型二：看汉字写假名，一题 3 个单词同时作答。
 * 自包含「作答 → 结果」两个阶段，按归一化假名比对答案。
 */

import React from "react";
import styled from "styled-components";
import Button from "../Button/Button";
import { updateTypeReadingPractice } from "../../services/quiz";
import { normalizeKana } from "../../utility";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";

export default function TypeReadingQuiz({
  quizObject,
  showAnswerToast,
  hideAnswerToast,
  onContinue,
}) {
  const words = quizObject.words ?? [];
  const [answers, setAnswers] = React.useState(() => words.map(() => ""));
  const [submitted, setSubmitted] = React.useState(false);
  const inputsRef = React.useRef([]);

  React.useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const results = words.map((w, i) => ({
    vocabularyId: w.vocabularyId,
    isCorrect: normalizeKana(answers[i]) === normalizeKana(w.reading),
  }));

  function handleChange(index, value) {
    setAnswers((cur) => cur.map((v, i) => (i === index ? value : v)));
  }

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    const allCorrect = results.every((r) => r.isCorrect);
    showAnswerToast(allCorrect);
    updateTypeReadingPractice(results);
  }

  function handleContinue() {
    hideAnswerToast();
    onContinue();
  }

  function handleKeyDown(event, index) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (index < words.length - 1) {
      inputsRef.current[index + 1]?.focus();
    } else if (!submitted) {
      handleSubmit();
    }
  }

  return (
    <Article>
      <Heading>看汉字，写出假名读音</Heading>

      <WordList>
        {words.map((w, i) => {
          const ok = results[i].isCorrect;
          return (
            <Row key={i} $state={submitted ? (ok ? "correct" : "wrong") : "idle"}>
              <WordCol>
                <Word>{w.word}</Word>
                {submitted && <Meaning>{w.meaning}</Meaning>}
              </WordCol>
              <AnswerCol>
                <ReadingInput
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text"
                  inputMode="kana"
                  autoComplete="off"
                  autoCapitalize="off"
                  placeholder="ふりがな"
                  value={answers[i]}
                  disabled={submitted}
                  $state={submitted ? (ok ? "correct" : "wrong") : "idle"}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                />
                {submitted && !ok && <Correct>正确：{w.reading}</Correct>}
              </AnswerCol>
            </Row>
          );
        })}
      </WordList>

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
const INPUT_BORDER = {
  idle: "var(--gray60)",
  correct: "var(--green15)",
  wrong: "var(--red15)",
};
const ReadingInput = styled.input`
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 0.4rem 0.6rem;
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.large};
  color: var(--text);
  background-color: var(--gray95);
  border: none;
  border-bottom: 2px solid ${(p) => INPUT_BORDER[p.$state]};
  border-radius: 0.4rem 0.4rem 0 0;
  outline-offset: 2px;
  &::placeholder {
    color: var(--gray60);
    font-weight: 400;
  }
  &:focus {
    border-bottom-color: var(--accent);
  }
`;
const Correct = styled.span`
  font-size: ${FONT_SIZE.tiny};
  color: var(--green15);
`;
const WideButton = styled(Button)`
  max-width: none;
`;
