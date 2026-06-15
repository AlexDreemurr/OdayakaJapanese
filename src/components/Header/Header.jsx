import styled from "styled-components";
import LinkWrapper from "../LinkWrapper/LinkWrapper";
import SideMenu from "../SideMenu/SideMenu";
import { FONT_FAMILY, FONT_SIZE, QUERIES } from "../../constants/index";

export default function Header() {
  return (
    <Wrapper>
      <TitleDesktop to="/">
        おだやか日本語
        <SpanDesktop>プラットフォーム</SpanDesktop>
      </TitleDesktop>
      <TitleMobile to="/">
        おだやか日本語
        {/* <SpanMobile>Platform</SpanMobile> */}
      </TitleMobile>

      <Nav>
        <LinkWrapper fontSize={FONT_SIZE.default} to="/phraseSetList">
          词汇集
        </LinkWrapper>
        <LinkWrapper fontSize={FONT_SIZE.default} to="/grammarSetList">
          语法集
        </LinkWrapper>
        <LinkWrapper fontSize={FONT_SIZE.default} to="/messages">
          消息
        </LinkWrapper>
        <LinkWrapper fontSize={FONT_SIZE.default} to="/settings">
          设置
        </LinkWrapper>
      </Nav>
      <MenuWrapper>
        <SideMenu />
      </MenuWrapper>
    </Wrapper>
  );
}

const Wrapper = styled.header`
  background-color: var(--gray15);
  color: var(--gray85);
  left: 0;
  right: 0;
  margin: auto;
  position: fixed;
  top: 0;
  height: var(--header-height);
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0 1rem;
  isolation: isolate;
  z-index: 30;
  overflow: hidden;
  border-bottom: 1px solid hsl(26deg 16% 24%);
  box-shadow: 0 2px 12px hsl(26deg 16% 8% / 0.18);

  @media ${QUERIES.tabletAndUp} {
    padding-left: 1.3rem;
    padding-right: 1.3rem;
  }
`;

const TitleDesktop = styled(LinkWrapper)`
  font-size: 1.1rem;
  color: var(--gray85);
  text-decoration: none;
  letter-spacing: 0;
  line-height: 1;
  font-family: ${FONT_FAMILY.japanese_tertiary};
  margin: 0;
  margin-right: auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  display: none;
  @media ${QUERIES.tabletAndUp} {
    display: revert;
  }
`;

const SpanDesktop = styled.span`
  font-size: inherit;
  letter-spacing: -3px;
`;

const TitleMobile = styled(TitleDesktop)`
  font-size: 1rem;
  display: block;
  @media ${QUERIES.tabletAndUp} {
    display: none;
  }
`;

const SpanMobile = styled.span`
  font-size: inherit;
  letter-spacing: 1px;
`;

const Nav = styled.nav`
  font-size: 1.1rem;
  flex-shrink: 0;
  display: none;

  @media ${QUERIES.laptopAndUp} {
    display: flex;
    gap: 0.35rem;
  }

  a {
    text-decoration: none;
    color: var(--gray60);
    padding: 0.35rem 0.7rem;
    border-radius: 0.5rem;
    transition: color 120ms ease, background-color 120ms ease;

    &:hover {
      color: var(--gray95);
      background-color: hsl(26deg 16% 22%);
    }
  }
`;

const MenuWrapper = styled.div`
  display: flex;
  flex-shrink: 0;

  @media ${QUERIES.laptopAndUp} {
    display: none;
  }
`;
