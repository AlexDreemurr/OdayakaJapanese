import React from "react";
import styled from "styled-components";
import { QUERIES } from "../../constants";
import Message from "../Message/Message";
import GrammarSetCard from "../GrammarSetCard/GrammarSetCard";

function GrammarSetList({
  grammarSets,
  selectionMode = false,
  selectedGrammarSetIds = [],
  onSelectionChange,
  onGrammarSetClick,
  variant = "fluid",
  cardSize = "default",
}) {
  return (
    <Wrapper $variant={variant}>
      {grammarSets.length === 0 && <Message>还没有语法集。</Message>}
      {grammarSets.map((grammarSet) => {
        const isSelected = selectedGrammarSetIds.includes(grammarSet.id);

        return (
          <React.Fragment key={grammarSet.id}>
            <GrammarSetCard
              grammarSet={grammarSet}
              to={onGrammarSetClick ? undefined : `/grammarSet/${grammarSet.id}`}
              selectionMode={selectionMode}
              selected={isSelected}
              onSelectionChange={onSelectionChange}
              onOpen={onGrammarSetClick}
              size={cardSize}
            />
          </React.Fragment>
        );
      })}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${(p) => (p.$variant === "fluid" ? "0.75rem" : "0.5rem")};
  position: relative;
  width: 100%;

  @media ${QUERIES.tabletAndUp} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media ${QUERIES.laptopAndUp} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

export default GrammarSetList;
