import React from "react";
import styled from "styled-components";
import { Link } from "react-router-dom";

function LinkWrapper({ children, fontSize = "1.125rem", ...delegated }) {
  return (
    <Wrapper $fontSize={fontSize} {...delegated}>
      {children}
    </Wrapper>
  );
}

const Wrapper = styled(Link)`
  padding: 0;
  color: inherit;
  font-size: ${(p) => p.$fontSize};
  background-color: inherit;
  text-decoration: underline;
  cursor: pointer;

  &:active {
    color: var(--gray40);
  }
`;

export default LinkWrapper;
