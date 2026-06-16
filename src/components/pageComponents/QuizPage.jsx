import { getNewQuizObject } from "../../utility";
import {
  fetchSharedDictQuiz,
  updateVocabPractice,
  fetchGrammarSetQuiz,
  updateGrammarPractice,
} from "../../services/quiz";
import SingleSelect from "../SingleSelect/SingleSelect";
import QuizAnswer from "../QuizAnswer/QuizAnswer";
import TypeReadingQuiz from "../TypeReadingQuiz/TypeReadingQuiz";
import ChooseMeaningQuiz from "../ChooseMeaningQuiz/ChooseMeaningQuiz";
import Papa from "papaparse";
import React from "react";
import styled from "styled-components";
import { HashLoader } from "react-spinners";
import { KatakanaRateContext } from "../../KatakanaRateContext";
import Message from "../Message/Message";

function QuizPage({
  source,
  historyQuizes,
  setHistoryQuizes,
  showAnswerToast,
  hideAnswerToast,
}) {
  /* source: grammar | sharedDict */
  const { katakanaRate } = React.useContext(KatakanaRateContext);
  const [grammars, setGrammars] = React.useState([]);
  const [quizObject, setQuizObject] = React.useState({
    rawSentence: "",
    question: "",
    choices: [],
    answer: "",
    form: "",
    meaning: "",
  });
  const [isChecking, setIsChecking] = React.useState(false);
  const [curQuizNum, setCurQuizNum] = React.useState(1);
  const [userAnswer, setUserAnswer] = React.useState("");
  const [status, setStatus] = React.useState("free");

  const loadSharedDictQuiz = React.useCallback(() => {
    fetchSharedDictQuiz(katakanaRate).then((nextQuizObject) => {
      if (!nextQuizObject) { setStatus("empty"); return; }
      setQuizObject(nextQuizObject);
      setStatus("free");
    });
  }, [katakanaRate]);

  const loadGrammarSetQuiz = React.useCallback(() => {
    fetchGrammarSetQuiz().then((nextQuizObject) => {
      if (!nextQuizObject) { setStatus("empty"); return; }
      setQuizObject(nextQuizObject);
      setStatus("free");
    });
  }, []);

  React.useEffect(() => {
    return () => { hideAnswerToast(); };
  }, [hideAnswerToast]);

  /* 初始加载 */
  React.useEffect(() => {
    setStatus("busy");
    if (source === "grammar") {
      fetch(
        "https://raw.githubusercontent.com/AlexDreemurr/HappyJPGrammar/assets/n2_grammar_completed.csv"
      )
        .then((res) => res.text())
        .then((text) => {
          const { data } = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
          });
          setGrammars(data);
          setQuizObject(getNewQuizObject(data));
          setStatus("free");
        });
    } else if (source === "grammarSet") {
      loadGrammarSetQuiz();
    } else {
      loadSharedDictQuiz();
    }
  }, [loadSharedDictQuiz, loadGrammarSetQuiz, source]);

  /* 下一道题目 */
  React.useEffect(() => {
    if (curQuizNum == 1) return;

    if (source === "grammar") {
      setQuizObject(getNewQuizObject(grammars));
      setUserAnswer(null);
      setStatus("free");
    } else if (source === "grammarSet") {
      loadGrammarSetQuiz();
      setUserAnswer(null);
    } else {
      loadSharedDictQuiz();
      setUserAnswer(null);
    }
  }, [curQuizNum, grammars, loadSharedDictQuiz, loadGrammarSetQuiz, source]);

  /* 用户提交本题后，将该题储存至localStorage */
  React.useEffect(() => {
    if (!isChecking) {
      return;
    }
    const newHistoryQuizes = [...historyQuizes, quizObject];
    setHistoryQuizes(newHistoryQuizes);
    window.localStorage.setItem(
      "historyQuizes",
      JSON.stringify(newHistoryQuizes)
    );

    if (source === "sharedDict") {
      updateVocabPractice(quizObject, userAnswer === quizObject.answer);
    }
    if (source === "grammarSet") {
      updateGrammarPractice(quizObject, userAnswer === quizObject.answer);
    }
  }, [isChecking]);

  const emptyMessage =
    source === "grammarSet"
      ? "当前没有可用的语法题库，请先加入一个语法集。"
      : "当前没有可用的共享单词题库，请先加入一个词汇集。";

  // 新题型（看汉字写假名 / 选词义）自包含作答与结果，不走 isChecking 两段式。
  const isStandaloneMode =
    quizObject.mode === "typeReading" || quizObject.mode === "chooseMeaning";

  function goToNextQuiz() {
    setCurQuizNum((d) => d + 1);
    setStatus("busy");
  }

  return (
    <Main>
      {status === "busy" && (
        <LoaderWrapper>
          <HashLoader color="hsl(223deg 56% 48%)" />
        </LoaderWrapper>
      )}
      {status === "empty" && <Message>{emptyMessage}</Message>}

      {status === "free" && quizObject.mode === "typeReading" && (
        <TypeReadingQuiz
          quizObject={quizObject}
          showAnswerToast={showAnswerToast}
          hideAnswerToast={hideAnswerToast}
          onContinue={goToNextQuiz}
        />
      )}
      {status === "free" && quizObject.mode === "chooseMeaning" && (
        <ChooseMeaningQuiz
          quizObject={quizObject}
          showAnswerToast={showAnswerToast}
          hideAnswerToast={hideAnswerToast}
          onContinue={goToNextQuiz}
        />
      )}

      {status === "free" && !isStandaloneMode && !isChecking && (
        <SingleSelect
          source={quizObject}
          userAnswer={userAnswer}
          setUserAnswer={setUserAnswer}
          setIsSubmit={setIsChecking}
          onSubmitAnswer={() => {
            showAnswerToast(userAnswer === quizObject.answer);
          }}
        />
      )}
      {status === "free" && !isStandaloneMode && isChecking && (
        <QuizAnswer
          quizObject={quizObject}
          userAnswer={userAnswer}
          setIsChecking={setIsChecking}
          setCurQuizNum={setCurQuizNum}
          setStatus={setStatus}
          hideAnswerToast={hideAnswerToast}
        />
      )}
    </Main>
  );
}

const Main = styled.main`
  width: 100%;
  max-width: 640px;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
`;
const LoaderWrapper = styled.div`
  width: 100%;
  min-height: 50dvh;
  display: flex;
  align-items: center;
  justify-content: center;
`;
export default QuizPage;
