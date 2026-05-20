import {
  getNewQuizObject,
  fetchSharedDictQuiz,
  updateVocabPractice,
} from "../../utility";
import SingleSelect from "../SingleSelect";
import QuizAnswer from "../QuizAnswer";
import Papa from "papaparse";
import React from "react";
import styled from "styled-components";
import supabase from "../../supabaseClient";
import { HashLoader } from "react-spinners";
import { KatakanaRateContext } from "../../KatakanaRateContext";
import Message from "../Message";

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
    fetchSharedDictQuiz(supabase, katakanaRate).then((nextQuizObject) => {
      if (!nextQuizObject) {
        setStatus("empty");
        return;
      }

      setQuizObject(nextQuizObject);
      setStatus("free");
    });
  }, [katakanaRate]);

  React.useEffect(() => {
    return () => {
      hideAnswerToast();
    };
  }, [hideAnswerToast]);

  /* 初始加载csv */
  React.useEffect(() => {
    setStatus("busy");
    if (source === "grammar") {
      fetch(
        "https://raw.githubusercontent.com/AlexDreemurr/HappyJPGrammar/assets/n2_grammar_completed.csv"
      )
        .then((res) => res.text())
        .then((text) => {
          const { data } = Papa.parse(text, {
            header: true, // 第一行作为 key
            skipEmptyLines: true,
            dynamicTyping: true, // 数字自动转 number 类型
          });
          setGrammars(data);

          // 初次加载题目
          const newQuizObject = getNewQuizObject(data);
          setQuizObject(newQuizObject);
          setStatus("free");
        });
    } else {
      loadSharedDictQuiz();
    }
  }, [loadSharedDictQuiz, source]);

  /* 更新下一道题目 */
  React.useEffect(() => {
    if (curQuizNum == 1) {
      return;
    }

    if (source === "grammar") {
      const newQuizObject = getNewQuizObject(grammars);
      setQuizObject(newQuizObject);
      setUserAnswer(null);
      setStatus("free");
    } else {
      loadSharedDictQuiz();
      setUserAnswer(null);
    }
  }, [curQuizNum, grammars, loadSharedDictQuiz, source]);

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
      updateVocabPractice(
        supabase,
        quizObject,
        userAnswer === quizObject.answer
      );
    }
  }, [isChecking]);

  return (
    <Main>
      {status === "busy" && <HashLoader />}
      {status === "empty" && (
        <Message>当前没有可用的共享单词题库，请先加入一个词汇集。</Message>
      )}
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
