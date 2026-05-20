import React from "react";
import styled from "styled-components";
import { getThreeParts } from "../utility";

function SentenceBox({ children, type = "sentence" }) {
  /* 
    type: sentence | translate | loading
  */
  const { before, inside, after } =
    type === "sentence" ? getThreeParts(children) : {};

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
    <Component>
      {type !== "sentence" && children}
      {type === "sentence" && (
        <>
          {before}
          <Answer>{inside}</Answer>
          {after}
        </>
      )}
    </Component>
  );
}

const Answer = styled.span`
  background-color: var(--gray15);
  color: var(--gray85);
  border-radius: 0.5rem;
  padding: 0rem 0.4rem 0rem 0.4rem;
  margin-left: 0.1rem;
  margin-right: 0.1rem;
  /* border: 1px black solid; */
  display: inline-block;
  text-indent: 0;
`;
const SentenceWrapper = styled.div`
  background-color: var(--gray85);
  padding: 1rem 1.5rem;
  margin: 0;
  margin-bottom: 0.5rem;
  text-indent: 2rem;
  border-radius: 1rem;
  font-family: "BIZ UDMincho";
`;
const TranslateWrapper = styled(SentenceWrapper)`
  background-color: var(--gray15);
  color: var(--gray85);
  font-family: "Noto Serif SC", serif;
`;
const LoadingWrapper = styled(TranslateWrapper)`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;
export default SentenceBox;
