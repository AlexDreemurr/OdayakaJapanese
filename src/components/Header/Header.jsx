import styled from "styled-components";
import LinkWrapper from "../LinkWrapper/LinkWrapper";
import SideMenu from "../SideMenu/SideMenu";
import { FONT_FAMILY, QUERIES } from "../../constants/index";
import { FONT_SIZE } from "../../constants/index";

export default function Header() {
  return (
    <Wrapper>
      <TitleDesktop to="/">
        尹の日本語
        <SpanDesktop>オンラインプラットフォーム</SpanDesktop>
      </TitleDesktop>
      <TitleMobile to="/">
        尹の日本語
        <SpanMobile>Platform</SpanMobile>
      </TitleMobile>

      <Nav>
        <LinkWrapper fontSize={FONT_SIZE.default} to="/phraseSetList">
          词汇集
        </LinkWrapper>
        <LinkWrapper fontSize={FONT_SIZE.default} to="/history">
          历史
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
  font-family: ${FONT_FAMILY.japanese_secondary};
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
    gap: 1rem;
  }
`;

const MenuWrapper = styled.div`
  display: flex;
  flex-shrink: 0;

  @media ${QUERIES.laptopAndUp} {
    display: none;
  }
`;
