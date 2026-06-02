import { getNewQuizObject } from "../../utility";
import {
  fetchSharedDictQuiz,
  updateVocabPractice,
  fetchGrammarSetQuiz,
  updateGrammarPractice,
} from "../../services/quiz";
import SingleSelect from "../SingleSelect/SingleSelect";
import QuizAnswer from "../QuizAnswer/QuizAnswer";
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

  return (
    <Main>
      {status === "busy" && <HashLoader />}
      {status === "empty" && <Message>{emptyMessage}</Message>}
      {status === "free" && !isChecking && (
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
      {status === "free" && isChecking && (
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
  padding: 2rem 1.5rem;
  max-width: 800px;
`;
export default QuizPage;
