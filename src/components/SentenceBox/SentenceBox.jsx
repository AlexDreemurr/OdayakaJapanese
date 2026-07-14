import React from "react";
import styled from "styled-components";
import { getSentenceText, getThreeParts } from "../../utility";
import SentenceSpeaker from "../SentenceSpeaker/SentenceSpeaker";

function SentenceBox({ children, type = "sentence", className, audioPath }) {
  /* 
    type: sentence | translate | loading
  */
  const sentenceParts = type === "sentence" ? getThreeParts(children) : null;
  const hasAnswerPart =
    sentenceParts &&
    typeof sentenceParts === "object" &&
    "inside" in sentenceParts &&
    sentenceParts.inside !== undefined;

  let Component;
  switch (type) {
    case "sentence":
      Component = SentenceWrapper;
      break;
    case "translate":
      Component = TranslateWrapper;
      break;
    case "loading":
      Component = LoadingWrapper;
      break;
  }

  // 返回 JSX：括号位置用 <span> 替换
  return (
    <Component className={className}>
      {type !== "sentence" && children}
      {type === "sentence" && (
        <>
          <SentenceText>
            {hasAnswerPart ? (
              <>
                {sentenceParts.before}
                <Answer>{sentenceParts.inside}</Answer>
                {sentenceParts.after}
              </>
            ) : (
              getSentenceText(children)
            )}
          </SentenceText>
          <SentenceSpeaker sentence={children} audioPath={audioPath} />
        </>
      )}
    </Component>
  );
}

const SentenceText = styled.div`
  font-size: inherit;
  text-indent: 2rem;
`;

const Answer = styled.span`
  background-color: var(--accent);
  color: hsl(40deg 36% 99%);
  border-radius: 0.45rem;
  padding: 0rem 0.45rem;
  margin-left: 0.1rem;
  margin-right: 0.1rem;
  display: inline-block;
  font-size: inherit;
  font-weight: 400;
  text-indent: 0;
`;
const SentenceWrapper = styled.div`
  position: relative;
  background-color: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 1rem 1.5rem;
  margin: 0;
  border-radius: 1rem;
  font-family: "BIZ UDMincho";
`;
const TranslateWrapper = styled(SentenceWrapper)`
  text-indent: 2rem;
  background-color: var(--accent-soft);
  color: var(--text);
  border-color: var(--accent);
  font-family: "Noto Serif SC", serif;
`;
const LoadingWrapper = styled(TranslateWrapper)`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;
export default SentenceBox;
