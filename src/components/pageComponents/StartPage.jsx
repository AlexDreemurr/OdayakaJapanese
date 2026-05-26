import React from "react";
import styled from "styled-components";
import LinkWrapper from "../LinkWrapper/LinkWrapper";
import Button from "../Button/Button";

function StartPage() {
  const isLocalLoopback = ["localhost", "127.0.0.1", "::1"].includes(
    window.location.hostname
  );

  return (
    <Wrapper>
      <ImgWrapper>
        <Img src={`${import.meta.env.BASE_URL}study_nihongo.png`} />
      </ImgWrapper>
      <LinkGroup>
        <LinkWrapper to="/quiz/grammar" style={{ textDecoration: "none" }}>
          <Button as="div">原语法练习</Button>
        </LinkWrapper>
        <LinkWrapper to="/quiz/sharedDict" style={{ textDecoration: "none" }}>
          <Button as="div">共享词汇练习</Button>
        </LinkWrapper>
      </LinkGroup>
      {isLocalLoopback && (
        <DebugEntry to="/debug" aria-label="进入调试页">
          进入调试页
        </DebugEntry>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;
const ImgWrapper = styled.div`
  width: 8rem;
`;
const Img = styled.img`
  width: 100%;
`;
const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 150px;
`;

const DebugEntry = styled(LinkWrapper)`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 20;
  width: auto;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--gray60);
  border-radius: 8px;
  background-color: var(--gray15);
  color: var(--gray85);
  font-size: 0.875rem;
  line-height: 1;
  text-decoration: none;
  box-shadow: 0 6px 18px hsl(0deg 0% 0% / 0.18);

  &:hover {
    background-color: var(--gray25);
  }
`;
export default StartPage;
