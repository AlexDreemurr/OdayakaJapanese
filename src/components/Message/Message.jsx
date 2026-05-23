import React from "react";
import styled from "styled-components";
import { FONT_SIZE } from "../../constants/index";

const STYLE = {
  error: {
    "--BackgroundColor": "var(--red85)",
    "--Color": "var(--red15)",
  },
  success: {
    "--BackgroundColor": "var(--green85)",
    "--Color": "var(--green15)",
  },
  info: {
    "--BackgroundColor": "var(--gray85)",
    "--Color": "var(--gray15)",
  },
};

function Message({ type = "info", fontSize = FONT_SIZE.default, children }) {
  return (
    <Wrapper style={STYLE[type]} $fontSize={fontSize}>
      {children}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  /* border: 1px black solid; */
  border-radius: 0.5rem;
  background-color: var(--BackgroundColor);
  color: var(--Color);
  padding: 0.5rem 1rem;
  font-size: ${(p) => p.$fontSize};
`;

export default Message;
