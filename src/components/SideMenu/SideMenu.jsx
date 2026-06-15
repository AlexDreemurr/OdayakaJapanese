import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styled from "styled-components";
import { FONT_SIZE, QUERIES } from "../../constants";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import Icon from "../Icon/Icon";
import LinkWrapper from "../LinkWrapper/LinkWrapper";

function SideMenu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <MenuWrapper>
          <Icon id="menu" size="1.3rem" />
        </MenuWrapper>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <Content>
          <Close asChild>
            <XWrapper>
              <Icon id="close" size="1.3rem" />
            </XWrapper>
          </Close>

          <MagicBox />
          <Nav>
            <Dialog.Close asChild>
              <LinkWrapper fontSize={FONT_SIZE.default} to="/phraseSetList">
                词汇集
              </LinkWrapper>
            </Dialog.Close>
            <Dialog.Close asChild>
              <LinkWrapper fontSize={FONT_SIZE.default} to="/grammarSetList">
                语法集
              </LinkWrapper>
            </Dialog.Close>
            <Dialog.Close asChild>
              <LinkWrapper fontSize={FONT_SIZE.default} to="/messages">
                消息
              </LinkWrapper>
            </Dialog.Close>
            <Dialog.Close asChild>
              <LinkWrapper fontSize={FONT_SIZE.default} to="/settings">
                设置
              </LinkWrapper>
            </Dialog.Close>
          </Nav>
          <MagicBox>
            <Footer>
              <FooterText>Made By Alexdreemurr® 2026.</FooterText>
              <FooterText>All Rights Reserved.</FooterText>
            </Footer>
          </MagicBox>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const MenuWrapper = styled(UnstyledButton)`
  color: var(--gray85);
  padding: 0.8rem;
  margin-right: -0.9rem;
`;

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background-color: var(--transparentGray15);
  z-index: 100;
`;

const Content = styled(Dialog.Content)`
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  width: 300px;
  padding: 1.1rem;
  background-color: var(--surface);
  color: var(--text);
  border-left: 1px solid var(--border);
  box-shadow: -8px 0 30px hsl(26deg 16% 15% / 0.12);
  z-index: 101;

  display: flex;
  flex-direction: column;
`;

const XWrapper = styled(UnstyledButton)`
  color: var(--gray15);
`;

const Close = styled(Dialog.Close)`
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;

  padding: 0.8rem;

  @media ${QUERIES.tabletAndUp} {
    top: 0.3rem;
    right: 0.35rem;
  }
`;

const MagicBox = styled.div`
  flex: 1;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.15rem;
  margin-top: 1.5rem;

  font-weight: 600;

  a {
    text-decoration: none;
    color: var(--text);
    padding: 0.6rem 0.7rem;
    border-radius: 0.55rem;
    transition: background-color 120ms ease, color 120ms ease;

    &:hover {
      background-color: var(--accent-soft);
      color: var(--accent);
    }
  }
`;

const Footer = styled.footer`
  height: 100%;

  display: flex;
  gap: 0.5rem;
  flex-direction: column;
  justify-content: flex-end;
`;

const FooterText = styled.p`
  font-size: 0.8rem;
  line-height: 1;
  padding: 0;
  margin: 0;
  color: var(--gray40);
  font-family: Raleway;
`;

export default SideMenu;
