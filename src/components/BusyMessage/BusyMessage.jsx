import styled from "styled-components";
import { PacmanLoader } from "react-spinners";
import { FONT_SIZE } from "../../constants/index";
import Message from "../Message/Message";

function BusyMessage({ children = "请稍等...", fontSize = FONT_SIZE.default }) {
  return (
    <Message fontSize={fontSize}>
      <Wrapper>
        <PacmanLoader color="var(--gray15)" />
        <span>{children}</span>
      </Wrapper>
    </Message>
  );
}

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  font-size: ${FONT_SIZE.default};
`;

export default BusyMessage;
