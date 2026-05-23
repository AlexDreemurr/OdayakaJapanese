import React from "react";
import styled from "styled-components";
import LinkWrapper from "../LinkWrapper/LinkWrapper";
import Button from "../Button/Button";

function StartPage() {
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
export default StartPage;
