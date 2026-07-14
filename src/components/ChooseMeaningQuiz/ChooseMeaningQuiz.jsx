/**
 * ChooseMeaningQuiz
 * 词汇练习题型三：看假名 / 汉字选词义（最多 8 个备选）。
 * 自包含「作答 → 结果」两个阶段，作答后高亮正确项与误选项。
 */

import React from "react";
import styled from "styled-components";
import Button from "../Button/Button";
import PitchReading from "../PitchReading/PitchReading";
import { updateChooseMeaningPractice } from "../../services/quiz";
import { playVocabAudio } from "../../services/vocabAudio";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";

export default function ChooseMeaningQuiz({
  quizObject,
  showAnswerToast,
  hideAnswerToast,
  onContinue,
}) {
  const [selected, setSelected] = React.useState(null);
  const [submitted, setSubmitted] = React.useState(false);

  const isCorrect = selected === quizObject.answer;

  function handleSubmit() {
    if (selected == null) return;
    setSubmitted(true);
    showAnswerToast(isCorrect);
    updateChooseMeaningPractice(quizObject, isCorrect);
    // 答完自动朗读该词
    playVocabAudio({
      path: quizObject.audioPaths?.word,
      fallbackText: quizObject.reading || quizObject.word,
    });
  }

  function handleContinue() {
    hideAnswerToast();
    onContinue();
  }

  function optionState(choice) {
    if (!submitted) return choice === selected ? "selected" : "idle";
    if (choice === quizObject.answer) return "correct";
    if (choice === selected) return "wrong";
    return "idle";
  }

  return (
    <Article>
      <PromptCard>
        <PromptWord>{quizObject.prompt}</PromptWord>
        {submitted && quizObject.reading && !quizObject.promptIsReading && (
          <PromptReading
            reading={quizObject.reading}
            pitch={quizObject.vocabularyPitch}
          />
        )}
        <PromptHint>{submitted ? "正确释义已标出" : "选择正确的意思"}</PromptHint>
      </PromptCard>

      <OptionGroup>
        {quizObject.choices.map((choice, index) => (
          <Option
            key={index}
            type="button"
            $state={optionState(choice)}
            disabled={submitted}
            onClick={() => setSelected(choice)}
          >
            {choice}
          </Option>
        ))}
      </OptionGroup>

      {!submitted ? (
        <WideButton type="primary" onClick={handleSubmit} disabled={selected == null}>
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
  gap: 1.25rem;
`;
const PromptCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  box-shadow: var(--shadow-sm);
  padding: 1.5rem 1.25rem;
`;
const PromptWord = styled.div`
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  text-align: center;
  word-break: break-word;
`;
const PromptReading = styled(PitchReading)`
  font-size: ${FONT_SIZE.default};
  color: var(--text-secondary);
`;
const PromptHint = styled.p`
  font-size: ${FONT_SIZE.tiny};
  color: var(--text-muted);
`;
const OptionGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
`;
const STATE_BG = {
  idle: "var(--surface)",
  selected: "var(--accent-soft)",
  correct: "var(--green85)",
  wrong: "var(--red85)",
};
const STATE_BORDER = {
  idle: "var(--border)",
  selected: "var(--accent)",
  correct: "var(--green15)",
  wrong: "var(--red15)",
};
const STATE_COLOR = {
  idle: "var(--text)",
  selected: "var(--accent-strong)",
  correct: "var(--green15)",
  wrong: "var(--red15)",
};
const Option = styled.button`
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
  text-align: center;
  min-height: 3rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.7rem;
  cursor: pointer;
  word-break: break-word;
  background-color: ${(p) => STATE_BG[p.$state]};
  border: 1px solid ${(p) => STATE_BORDER[p.$state]};
  color: ${(p) => STATE_COLOR[p.$state]};
  font-weight: ${(p) => (p.$state === "idle" ? 400 : 600)};
  box-shadow: ${(p) => (p.$state === "selected" ? "0 0 0 1px var(--accent)" : "none")};
  transition: background-color 120ms ease, border-color 120ms ease;
  &:disabled {
    cursor: default;
  }
  &:not(:disabled):hover {
    border-color: var(--gray60);
  }
`;
const WideButton = styled(Button)`
  max-width: none;
`;
