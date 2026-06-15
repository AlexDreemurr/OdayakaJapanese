import Button from "../Button/Button";
import React from "react";
import styled from "styled-components";
import { renderQuestion } from "../../utility";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";

export default function SingleSelect({
  source,
  userAnswer,
  setUserAnswer,
  setIsSubmit,
  onSubmitAnswer,
}) {
  /* 
     source:     资源对象
      { question: 'balabala@bala', 
        choices: ['asd', 'efw', 'wef', 'ewg']
      }
      其中question中可插入@字符，会被替代为问号框

     userAnswer:     用户答案state
     setUserAnswer:  用户答案state setter    -> 对应的choice值
     setIsSubmit:    用户是否提交state setter -> true
  */
  const QuizId = React.useId();

  return (
    <Article>
      <Fieldset>
        <Legend>问题</Legend>
        <Prompt>{renderQuestion(source.question)}</Prompt>
        <OptionGroup role="radiogroup">
          {source.choices.map((choice, index) => {
            const choiceLabel = source.choiceLabels?.[index] ?? choice;

            const selected = userAnswer === choice;
            return (
              <Option key={index}>
                <Radio
                  type="radio"
                  id={`${QuizId}-choice${index + 1}`}
                  name={QuizId}
                  value={choice}
                  checked={selected}
                  onChange={(event) => {
                    setUserAnswer(event.target.value);
                  }}
                />
                <Label htmlFor={`${QuizId}-choice${index + 1}`} $selected={selected}>
                  {choiceLabel}
                </Label>
              </Option>
            );
          })}
        </OptionGroup>
      </Fieldset>
      <SubmitButton
        type="primary"
        onClick={() => {
          onSubmitAnswer?.();
          setIsSubmit(true);
        }}
        disabled={!userAnswer}
      >
        提交
      </SubmitButton>
    </Article>
  );
}
const Article = styled.article`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;
const Fieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  font-family: ${FONT_FAMILY.japanese_primary};
`;
const Legend = styled.legend`
  padding: 0;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.tiny};
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
`;
const Prompt = styled.p`
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  box-shadow: var(--shadow-sm);
  padding: 1.1rem 1.25rem;
  font-size: ${FONT_SIZE.large};
  line-height: 1.9;
  color: var(--text);
`;
const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;
// 选中态由 React 经 $selected 驱动，聚焦态由容器 :focus-within 处理，
// 不依赖 styled-components 的组件选择器（本项目 babel 下不稳定）。
const Option = styled.div`
  position: relative;

  &:focus-within > label {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
`;
const Radio = styled.input`
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
`;
const Label = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  border: 1px solid ${(p) => (p.$selected ? "var(--accent)" : "var(--border)")};
  border-radius: 0.7rem;
  background-color: ${(p) => (p.$selected ? "var(--accent-soft)" : "var(--surface)")};
  box-shadow: ${(p) => (p.$selected ? "0 0 0 1px var(--accent)" : "none")};
  color: var(--text);
  cursor: pointer;
  transition: border-color 120ms ease, background-color 120ms ease,
    box-shadow 120ms ease;

  &::before {
    content: "";
    flex-shrink: 0;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 50%;
    border: 2px solid ${(p) => (p.$selected ? "var(--accent)" : "var(--gray60)")};
    box-shadow: ${(p) => (p.$selected ? "inset 0 0 0 3px var(--accent)" : "none")};
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }

  &:hover {
    border-color: ${(p) => (p.$selected ? "var(--accent)" : "var(--gray60)")};
    background-color: ${(p) => (p.$selected ? "var(--accent-soft)" : "var(--gray95)")};
  }
`;
const SubmitButton = styled(Button)`
  max-width: none;
`;
