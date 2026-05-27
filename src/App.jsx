import React from "react";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import GlobalStyles from "./GlobalStyles";

/* Page Components */
import QuizPage from "./components/pageComponents/QuizPage";
import StartPage from "./components/pageComponents/StartPage";
import MessagesPage from "./components/pageComponents/MessagesPage";
import PhraseSetPage from "./components/pageComponents/PhraseSetPage";
import SettingsPage from "./components/pageComponents/SettingsPage";
import DebugPage from "./components/pageComponents/DebugPage";

/* Components */
import Header from "./components/Header/Header";
import { CharacterToastOverlay } from "./components/CharacterToast/CharacterToast";
import { AppMessagesProvider } from "./components/AppMessages/AppMessages";
import styled from "styled-components";
import { KatakanaRateContext } from "./KatakanaRateContext";
import { TOAST_DELAY } from "./constants/index";

const CORRECT_TOAST_MILESTONES = [50, 20, 10, 5, 3];

function getCorrectToastStatus(streak) {
  const milestone = CORRECT_TOAST_MILESTONES.find((value) => streak === value);
  return milestone ? `correct${milestone}` : "correct1";
}

function App() {
  const isLocalLoopback = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname
  );

  const [historyQuizes, setHistoryQuizes] = React.useState(() => {
    return JSON.parse(window.localStorage.getItem("historyQuizes") ?? "[]");
  });
  const [katakanaRate, setKatakanaRate] = React.useState(() => {
    const storedRate = parseFloat(
      window.localStorage.getItem("katakanaRate") ?? 0.5
    );

    if (Number.isNaN(storedRate)) {
      return 0.5;
    }

    return Math.min(Math.max(storedRate, 0), 1);
  });
  const [answerToast, setAnswerToast] = React.useState(null);
  const correctStreakRef = React.useRef(0);
  const answerToastTimerRef = React.useRef(null);
  const answerToastIdRef = React.useRef(0);

  const showAnswerToast = React.useCallback((isCorrect) => {
    window.clearTimeout(answerToastTimerRef.current);
    answerToastIdRef.current += 1;

    if (!isCorrect) {
      correctStreakRef.current = 0;
      setAnswerToast({ id: answerToastIdRef.current, status: "wrong" });
    } else {
      correctStreakRef.current += 1;
      setAnswerToast({
        id: answerToastIdRef.current,
        status: getCorrectToastStatus(correctStreakRef.current),
      });
    }

    answerToastTimerRef.current = window.setTimeout(() => {
      setAnswerToast(null);
    }, TOAST_DELAY);
  }, []);

  const hideAnswerToast = React.useCallback(() => {
    window.clearTimeout(answerToastTimerRef.current);
    setAnswerToast(null);
  }, []);

  const resetAnswerToast = React.useCallback(() => {
    window.clearTimeout(answerToastTimerRef.current);
    correctStreakRef.current = 0;
    setAnswerToast(null);
  }, []);

  React.useEffect(() => {
    window.localStorage.setItem("katakanaRate", String(katakanaRate));
  }, [katakanaRate]);

  React.useEffect(() => {
    return () => {
      window.clearTimeout(answerToastTimerRef.current);
    };
  }, []);

  return (
    <KatakanaRateContext.Provider value={{ katakanaRate, setKatakanaRate }}>
      <AppMessagesProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Root>
            <CharacterToastOverlay answerToast={answerToast} />
            <HelperBox />
            <Routes>
              <Route path="/" element={<StartPage />} />
              <Route
                path="/quiz/grammar"
                element={
                  <QuizPage
                    source="grammar"
                    historyQuizes={historyQuizes}
                    setHistoryQuizes={setHistoryQuizes}
                    showAnswerToast={showAnswerToast}
                    hideAnswerToast={hideAnswerToast}
                  />
                }
              />
              <Route
                path="/quiz/sharedDict"
                element={
                  <QuizPage
                    source="sharedDict"
                    historyQuizes={historyQuizes}
                    setHistoryQuizes={setHistoryQuizes}
                    showAnswerToast={showAnswerToast}
                    hideAnswerToast={hideAnswerToast}
                  />
                }
              />
              <Route path="/messages" element={<MessagesPage />} />
              <Route
                path="/history"
                element={<Navigate to="/messages" replace />}
              />
              <Route path="/phraseSetList" element={<PhraseSetPage />} />
              <Route path="/phraseSet/:phraseSetId" element={<PhraseSetPage />} />
              <Route
                path="/settings"
                element={<SettingsPage resetAnswerToast={resetAnswerToast} />}
              />
              {isLocalLoopback && <Route path="/debug" element={<DebugPage />} />}
            </Routes>
            <HelperBox />
            <Header />
          </Root>

          <GlobalStyles />
        </BrowserRouter>
      </AppMessagesProvider>
    </KatakanaRateContext.Provider>
  );
}

const HelperBox = styled.div`
  flex: 1;
  width: 100%;
  min-height: var(--header-height);
`;
const Root = styled.div`
  position: relative;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

export default App;
