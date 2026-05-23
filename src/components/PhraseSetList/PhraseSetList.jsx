import React from "react";
import styled from "styled-components";
import { QUERIES } from "../../constants";
import Message from "../Message/Message";
import PhraseSetCard from "../PhraseSetCard/PhraseSetCard";

function PhraseSetList({
  phraseSets,
  selectionMode = false,
  selectedPhraseSetIds = [],
  onSelectionChange,
  onPhraseSetClick,
  variant = "fluid",
  cardSize = "default",
}) {
  return (
    <Wrapper $variant={variant}>
      {phraseSets.length === 0 && <Message>还没有词汇集。</Message>}
      {phraseSets.map((phraseSet) => {
        const isSelected = selectedPhraseSetIds.includes(phraseSet.id);
        const card = (
          <PhraseSetCard
            phraseSet={phraseSet}
            to={onPhraseSetClick ? undefined : `/phraseSet/${phraseSet.id}`}
            selectionMode={selectionMode}
            selected={isSelected}
            onSelectionChange={onSelectionChange}
            onOpen={onPhraseSetClick}
            size={cardSize}
          />
        );

        return <React.Fragment key={phraseSet.id}>{card}</React.Fragment>;
      })}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: ${(p) =>
    p.$variant === "fluid"
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(2, minmax(0, 1fr))"};
  gap: ${(p) => (p.$variant === "fluid" ? "0.75rem" : "0.5rem")};
  position: relative;
  width: ${(p) => (p.$variant === "fluid" ? "100%" : "auto")};

  @media ${QUERIES.tabletAndUp} {
    grid-template-columns: ${(p) =>
      p.$variant === "fluid"
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(3, minmax(0, 1fr))"};
  }

  @media ${QUERIES.laptopAndUp} {
    grid-template-columns: ${(p) =>
      p.$variant === "fluid"
        ? "repeat(4, minmax(0, 1fr))"
        : "repeat(3, minmax(0, 1fr))"};
  }
`;

export default PhraseSetList;
