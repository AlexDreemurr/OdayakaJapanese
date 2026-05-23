import Button from "../Button/Button";
import React from "react";
import styled from "styled-components";
import { renderQuestion } from "../../utility";
import { FONT_FAMILY } from "../../constants";

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
        <Legend>{renderQuestion(source.question)}</Legend>
        <OptionGroup>
          {source.choices.map((choice, index) => {
            const choiceLabel = source.choiceLabels?.[index] ?? choice;

            return (
              <SingleOption key={index}>
                <input
                  type="radio"
                  id={`${QuizId}-choice${index + 1}`}
                  name={QuizId}
                  value={choice}
                  checked={userAnswer === choice}
                  onChange={(event) => {
                    setUserAnswer(event.target.value);
                  }}
                />
                <Label htmlFor={`${QuizId}-choice${index + 1}`}>
                  {choiceLabel}
                </Label>
              </SingleOption>
            );
          })}
        </OptionGroup>
      </Fieldset>
      <Button
        onClick={() => {
          onSubmitAnswer?.();
          setIsSubmit(true);
        }}
        disabled={!userAnswer}
      >
        提交
      </Button>
    </Article>
  );
}
const Article = styled.article``;
const Fieldset = styled.fieldset`
  margin-bottom: 0.5rem;
  font-family: ${FONT_FAMILY.japanese_primary};
`;
const Legend = styled.legend`
  /* background-color: hsl(70deg 5% 90%); */
  border: 1px var(--gray60) solid;
  text-indent: 1rem;
`;
const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const SingleOption = styled.div`
  padding-left: 1rem;
  display: flex;
  gap: 1rem;
  align-items: baseline;
  &:first-of-type {
    margin-top: 0.5rem;
  }
`;
const Label = styled.label``;
