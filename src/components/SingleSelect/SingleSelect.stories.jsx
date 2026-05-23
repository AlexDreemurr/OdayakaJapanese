import React from "react";
import SingleSelect from "./SingleSelect";

function SingleSelectStory() {
  const [userAnswer, setUserAnswer] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <div style={{ maxWidth: "34rem" }}>
      <SingleSelect
        source={{
          question: "Watashi wa @ o benkyou shimasu.",
          choices: ["nihongo", "eigo", "suugaku", "rekishi"],
        }}
        userAnswer={userAnswer}
        setUserAnswer={setUserAnswer}
        setIsSubmit={setSubmitted}
      />
      {submitted && <p style={{ marginTop: "1rem" }}>Submitted: {userAnswer}</p>}
    </div>
  );
}

export default {
  title: "Components/SingleSelect",
  component: SingleSelect,
};

export const Playground = {
  render: () => <SingleSelectStory />,
};
