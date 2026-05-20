import styled from "styled-components";
import Button from "./Button";
import React from "react";
import SentenceBox from "./SentenceBox";
import { PacmanLoader } from "react-spinners";
import { deepseekAPI, getSentenceText } from "../utility";
import PitchReading from "./PitchReading";

export default function QuizAnswer({
  quizObject,
  userAnswer,
  setIsChecking,
  setCurQuizNum,
  setStatus,
  hideAnswerToast,
}) {
  /* 
     quizObject:     题目对象
     userAnswer:     用户答案state
     setIsChecking:  进入答案页state setter
     setCurQuizNum:  用户当前题号state setter
  */
  const [needTranslate, setNeedTranslate] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [translatedText, setTranslatedText] = React.useState("");
  const [translateError, setTranslateError] = React.useState(null);
  const displayReading = quizObject.vocabularyReading ?? quizObject.reading;

  async function handleTranslate() {
    setNeedTranslate(true);
    setIsLoading(true);
    setTranslateError(null);
    try {
      const result = await deepseekAPI(
        getSentenceText(quizObject.rawSentence),
        "你是一个日文翻译助手。用户会发送日文句子，你只需要回复对应的中文翻译，不要添加任何解释或多余内容。",
        "translate"
      );
      setTranslatedText(result);
    } catch (err) {
      setTranslateError("翻译失败，请重试");
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <AnswerPage>
      <TypoWrapper>
        {userAnswer === quizObject.answer ? "回答正确！" : "好像有点不太对..."}
      </TypoWrapper>
      {/* 渲染原题目及答案 */}
      <SentenceBox>{quizObject.rawSentence}</SentenceBox>
      {needTranslate && isLoading && (
        <SentenceBox type="loading">
          <PacmanLoader color="hsl(0deg 0% 95%)" />
          <TypoWrapper style={{ margin: 0 }}>翻译中</TypoWrapper>
        </SentenceBox>
      )}
      {needTranslate && !isLoading && (
        <SentenceBox type="translate">
          {translateError ?? translatedText}
        </SentenceBox>
      )}
      <TypoWrapper>
        <Grammar>
          {quizObject.form}
          {!!displayReading && (
            <>
              （
              <AnswerPitchReading
                reading={displayReading}
                pitch={quizObject.vocabularyPitch}
              />
              ）
            </>
          )}
        </Grammar>
        的含义：{quizObject.meaning}
      </TypoWrapper>
      <ButtonWrapper>
        <Button onClick={handleTranslate}>获得翻译</Button>
        <Button
          onClick={() => {
            hideAnswerToast();
            setIsChecking(false);
            setCurQuizNum((d) => d + 1);
            setStatus("busy");
          }}
        >
          继续:D
        </Button>
      </ButtonWrapper>
    </AnswerPage>
  );
}
const AnswerPage = styled.article`
  padding: 0 0.5rem;
`;

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const Grammar = styled.span`
  font-family: "BIZ UDMincho";
  display: inline-block;
  text-indent: 0;
  margin-right: 1px;
`;
const AnswerPitchReading = styled(PitchReading)`
  font-size: inherit;
`;
const TypoWrapper = styled.p`
  padding-left: 1.5rem;
  /* text-indent: 2rem; */
  margin: 0;
  margin-bottom: 0.5rem;
`;
