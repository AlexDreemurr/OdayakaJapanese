/**
 * SetItemDialog
 * 词汇集与语法集条目详情弹窗的共用壳组件。
 * 管理 open 状态和 details/history 视图切换，内容由调用方通过 props 传入。
 */

import React from "react";
import styled from "styled-components";
import * as Dialog from "@radix-ui/react-dialog";
import { QUERIES } from "../../constants";
import Icon from "../Icon/Icon";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import IconActionDropdown from "../IconActionDropdown/IconActionDropdown";

/**
 * @param {object} props
 * @param {ReactNode} props.trigger         - Dialog 触发元素（asChild 包裹）
 * @param {ReactNode} props.title           - Dialog 标题区（Dialog.Title 内容）
 * @param {ReactNode} props.detailsContent  - 详情视图内容
 * @param {ReactNode} props.historyContent  - 做题历史视图内容
 * @param {ReactNode} props.desktopDeleteButton - 桌面端删除按钮/AlertDialog
 * @param {Array}     props.mobileMenuItems - 移动端下拉额外菜单项
 * @param {ReactNode} props.extraContent    - 渲染在 Content 内的额外内容（如受控 AlertDialog）
 * @param {Function}  props.onOpenChange    - 弹窗开关回调，用于触发副作用
 */
function SetItemDialog({
  trigger,
  title,
  detailsContent,
  historyContent,
  desktopDeleteButton,
  mobileMenuItems = [],
  extraContent,
  onOpenChange,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [contentView, setContentView] = React.useState("details");

  function handleOpenChange(open) {
    setIsOpen(open);
    if (!open) setContentView("details");
    onOpenChange?.(open);
  }

  function toggleView() {
    setContentView((v) => (v === "history" ? "details" : "history"));
  }

  const mobileItems = [
    {
      icon: "bookOpen",
      label: contentView === "history" ? "查看详情" : "查看做题历史",
      onSelect: toggleView,
    },
    ...mobileMenuItems,
  ];

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <Content>
          <TopArea>
            <Actions>
              <Dialog.Close asChild>
                <XWrapper>
                  <Icon id="close" size="1.3rem" />
                </XWrapper>
              </Dialog.Close>
              <TitleActions>
                <DesktopTitleActions>
                  <TitleIconButton
                    type="button"
                    aria-label={contentView === "history" ? "查看详情" : "查看做题历史"}
                    onClick={toggleView}
                  >
                    <Icon id="bookOpen" size="1.3rem" />
                  </TitleIconButton>
                  {desktopDeleteButton}
                </DesktopTitleActions>
                <MobileTitleActions>
                  <MobileActionDropdown actions={mobileItems} closeOnSelect />
                </MobileTitleActions>
              </TitleActions>
            </Actions>
            <Dialog.Title asChild>
              <TitleSlot>{title}</TitleSlot>
            </Dialog.Title>
          </TopArea>

          <Body>
            {contentView === "details" && detailsContent}
            {contentView === "history" && historyContent}
          </Body>

          {extraContent}
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Shared styles（与 PhraseDialog 保持完全一致）── */
const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background-color: var(--transparentGray15);
  z-index: 100;
`;
const Content = styled(Dialog.Content)`
  position: fixed;
  top: 0; bottom: 0; left: 0; right: 0;
  margin: auto;
  z-index: 101;
  width: 80%;
  max-width: ${400 / 16}rem;
  max-height: calc(50% + 10rem);
  height: fit-content;
  border-radius: 1rem;
  background-color: var(--gray95);
  padding: 1.1rem 1.5rem;
  overflow-y: auto;
`;
const TopArea = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 0.75rem;
`;
const Actions = styled.div`
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  height: fit-content;
`;
const XWrapper = styled(UnstyledButton)`
  color: var(--gray15);
  padding: 0.8rem;
  position: relative;
  top: -1rem;
  right: -1rem;
`;
const TitleActions = styled.div`
  position: relative;
  top: -1rem;
  right: -1rem;
`;
const DesktopTitleActions = styled.div`
  display: none;
  @media ${QUERIES.tabletAndUp} {
    display: flex;
  }
`;
const MobileTitleActions = styled.div`
  display: block;
  @media ${QUERIES.tabletAndUp} {
    display: none;
  }
`;
export const MobileActionDropdown = styled(IconActionDropdown)``;
export const TitleIconButton = styled(UnstyledButton)`
  color: var(--gray15);
  padding: 0.8rem;
  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;
export const DeleteIconButton = styled(TitleIconButton)``;
const TitleSlot = styled.div`
  display: flex;
  column-gap: 1rem;
  row-gap: 0.15rem;
  flex-wrap: wrap;
`;
const Body = styled.div`
  margin-top: 0.35rem;
`;

export default SetItemDialog;
