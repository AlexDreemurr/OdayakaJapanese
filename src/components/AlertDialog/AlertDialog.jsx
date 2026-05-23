import React from "react";
import styled, { css } from "styled-components";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { FONT_FAMILY, FONT_SIZE } from "../../constants/index";

function AlertDialog({
  trigger,
  title,
  description,
  cancelText = "取消",
  confirmText = "确认删除",
  onConfirm,
  confirmDisabled = false,
}) {
  return (
    <AlertDialogPrimitive.Root>
      {trigger && (
        <AlertDialogPrimitive.Trigger asChild>
          {trigger}
        </AlertDialogPrimitive.Trigger>
      )}
      <AlertDialogPrimitive.Portal>
        <Overlay />
        <Content>
          <Title>{title}</Title>
          <Description>{description}</Description>
          <Actions>
            <Cancel>{cancelText}</Cancel>
            <Action disabled={confirmDisabled} onClick={onConfirm}>
              {confirmText}
            </Action>
          </Actions>
        </Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

const Overlay = styled(AlertDialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  background-color: var(--transparentGray15);
`;

const Content = styled(AlertDialogPrimitive.Content)`
  position: fixed;
  inset: 0;
  width: min(90%, 24rem);
  height: fit-content;
  margin: auto;
  border-radius: 1rem;
  background-color: var(--gray95);
  padding: 1.25rem 1.5rem;
`;

const Title = styled(AlertDialogPrimitive.Title)`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.default};
  font-weight: 600;
`;

const Description = styled(AlertDialogPrimitive.Description)`
  margin-top: 0.65rem;
  color: var(--gray40);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1.2rem;
`;

const buttonStyles = css`
  border: 1px solid var(--gray60);
  padding: 0.35rem 0.85rem;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;

const Cancel = styled(AlertDialogPrimitive.Cancel)`
  ${buttonStyles}
  background-color: var(--gray85);
  color: var(--gray15);

  &:hover {
    background-color: var(--gray75);
  }
`;

const Action = styled(AlertDialogPrimitive.Action)`
  ${buttonStyles}
  background-color: var(--red85);
  border-color: var(--red15);
  color: var(--red15);

  &:hover:not(:disabled) {
    background-color: var(--red15);
    color: var(--gray95);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }
`;

export default AlertDialog;
