import styled from "styled-components";
import Button from "../Button/Button";
import { FONT_SIZE } from "../../constants";
import SentenceBox from "../SentenceBox/SentenceBox";

function DebugPage() {
  return (
    <Wrapper>
      <Panel>
        <Title>开发者调试页</Title>
        <Description>
          这里可以临时放组件、状态和交互，用来快速检查页面效果。
        </Description>

        <PreviewArea>
          {/* 这里面放测试组件哦！ */}
          {/* 这里面放测试组件哦！ */}
          {/* 这里面放测试组件哦！ */}
          {/* 重要的事情说三遍:) */}
          <SentenceBox>dsd</SentenceBox>
        </PreviewArea>
      </Panel>
    </Wrapper>
  );
}

const Wrapper = styled.main`
  width: 100%;
  min-height: calc(100vh - var(--header-height) * 2);
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;

const Panel = styled.section`
  width: min(100%, 960px);
  display: grid;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: ${FONT_SIZE.large};
  color: var(--gray15);
`;

const Description = styled.p`
  color: var(--gray40);
  font-size: ${FONT_SIZE.default};
`;

const PreviewArea = styled.div`
  min-height: 320px;
  padding: 1rem;
  border: 1px dashed var(--gray60);
  border-radius: 8px;
  background: white;
  display: grid;
  align-content: start;
  gap: 1rem;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  color: var(--gray25);
`;

export default DebugPage;
