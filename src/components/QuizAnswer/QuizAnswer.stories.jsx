import QuizAnswer from "./QuizAnswer";

const quizObject = {
  id: 1,
  rawSentence: "Watashi wa {nihongo} o benkyou shimasu.",
  answer: "nihongo",
  form: "nihongo",
  reading: "nihongo",
  vocabularyReading: "nihongo",
  vocabularyPitch: 0,
  meaning: "Japanese language",
};

export default {
  title: "Components/QuizAnswer",
  component: QuizAnswer,
  argTypes: {
    userAnswer: { control: "text" },
  },
  args: {
    userAnswer: "nihongo",
  },
};

export const Playground = {
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <QuizAnswer
        quizObject={quizObject}
        userAnswer={args.userAnswer}
        setIsChecking={() => {}}
        setCurQuizNum={() => {}}
        setStatus={() => {}}
        hideAnswerToast={() => {}}
      />
    </div>
  ),
};
