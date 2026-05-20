import React from "react";
import styled, { css } from "styled-components";
import * as Dialog from "@radix-ui/react-dialog";
import { FONT_FAMILY, FONT_SIZE, QUERIES } from "../constants";
import Button from "./Button";
import Icon from "./Icon";
import UnstyledButton from "./UnstyledButton";

function FormModal({
  children,
  open,
  onOpenChange,
  trigger,
  title,
  titleHint,
  titleAction,
  closeButtonProps = {},
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <FormModalOverlay />
        <FormModalContent>
          <Dialog.Close asChild>
            <FormModalCloseButton
              type="button"
              aria-label="关闭"
              {...closeButtonProps}
            >
              <FormModalCloseIcon />
            </FormModalCloseButton>
          </Dialog.Close>

          {titleAction && (
            <FormModalTitleAction>{titleAction}</FormModalTitleAction>
          )}

          {(title || titleHint) && (
            <FormModalTitle>
              {title && <FormModalTitleWord>{title}</FormModalTitleWord>}
              {titleHint && (
                <FormModalTitleHint>{titleHint}</FormModalTitleHint>
              )}
            </FormModalTitle>
          )}

          {children}
        </FormModalContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function FormModalPasswordInput({ disabled, ...delegated }) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <FormModalPasswordInputWrapper>
      <FormModalInput
        {...delegated}
        type={isVisible ? "text" : "password"}
        disabled={disabled}
      />
      <FormModalPasswordToggle
        type="button"
        aria-label={isVisible ? "隐藏密码" : "显示密码"}
        title={isVisible ? "隐藏密码" : "显示密码"}
        onClick={() => setIsVisible((current) => !current)}
        disabled={disabled}
      >
        <Icon
          id={isVisible ? "eyeOff" : "eye"}
          size="1rem"
          color="currentColor"
        />
      </FormModalPasswordToggle>
    </FormModalPasswordInputWrapper>
  );
}

const FormModalOverlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background-color: var(--transparentGray15);
`;

const FormModalContent = styled(Dialog.Content)`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  width: 90%;
  max-width: ${400 / 16}rem;
  max-height: calc(50% + 10rem);
  height: fit-content;
  border-radius: 1rem;
  background-color: var(--gray95);
  padding: 1.1rem 1.5rem;
`;

const FormModalCloseButton = styled(UnstyledButton)`
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;
  padding: 0.8rem;
  color: var(--gray15);

  @media ${QUERIES.tabletAndUp} {
    top: 0.3rem;
    right: 0.35rem;
  }
`;

const FormModalCloseIcon = styled(Icon).attrs({
  id: "close",
  size: "1.3rem",
})`
  transform: translateY(5px);
`;

const FormModalTitleAction = styled.div`
  position: absolute;
  top: 1.2rem;
  right: 3.5rem;
`;

const FormModalTitle = styled(Dialog.Title)`
  display: flex;
  width: 90%;
  column-gap: 1rem;
  flex-wrap: wrap;
`;

const FormModalTitleText = styled.span`
  font-size: ${FONT_SIZE.default};
  font-family: ${FONT_FAMILY.chinese_primary};
`;

const FormModalTitleWord = styled(FormModalTitleText)``;

const FormModalTitleHint = styled(FormModalTitleText)`
  color: var(--gray40);
`;

const FormModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormModalStatusArea = styled.div`
  min-height: 0;
`;

const FormModalFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0rem;
`;

const FormModalLabel = styled.label`
  width: 4rem;
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};

  &::after {
    content: " *";
    font-size: 2rem;
    font-family: ${FONT_FAMILY.english_primary};
    visibility: hidden;
    line-height: 1.5;
  }
`;

const FormModalRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  min-width: 0;

  &:has(input:required)
    ${FormModalLabel}::after,
    &[data-required]
    ${FormModalLabel}::after {
    color: red;
    visibility: visible;
  }
`;

const FormModalTwoColumnRow = styled.div`
  display: flex;
  gap: 0rem;
  align-items: baseline;
  min-width: 0;
`;

const FormModalCompactRow = styled(FormModalRow)`
  flex: 1 1 0;
`;

const formModalInputStyles = css`
  font-size: ${FONT_SIZE.small};
  display: block;
  min-width: 0;
  flex: 1 100000 0;
  outline: none;

  &:focus {
    outline: 2px solid var(--gray15);
    border-radius: 1px;
    outline-offset: 2px;
  }
`;

const FormModalInput = styled.input`
  ${formModalInputStyles}
`;

const FormModalPasswordInputWrapper = styled.div`
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1 100000 0;
  gap: 0.35rem;
`;

const FormModalPasswordToggle = styled(UnstyledButton)`
  flex: 0 0 auto;
  color: var(--gray40);
  padding: 0.2rem;
  border-radius: 2px;

  &:hover:not(:disabled) {
    color: var(--gray15);
  }

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const FormModalTextarea = styled.textarea`
  ${formModalInputStyles}
  min-height: 4rem;
  max-height: 10rem;
  resize: vertical;
`;

const FormModalButtonWrapper = styled.div`
  padding: 0 1rem;
`;

const FormModalSubmitButton = styled(Button)`
  font-size: ${FONT_SIZE.small};
`;

export {
  FormModal,
  FormModalOverlay as Overlay,
  FormModalContent as Content,
  FormModalCloseButton as CloseButton,
  FormModalCloseIcon as CloseIcon,
  FormModalTitle as Title,
  FormModalTitleWord as TitleWord,
  FormModalTitleHint as TitleHint,
  FormModalForm as Form,
  FormModalStatusArea as StatusArea,
  FormModalFields as Fields,
  FormModalRow as Row,
  FormModalTwoColumnRow as TwoColumnRow,
  FormModalCompactRow as CompactRow,
  FormModalLabel as Label,
  FormModalInput as Input,
  FormModalPasswordInput as PasswordInput,
  FormModalTextarea as Textarea,
  FormModalButtonWrapper as ButtonWrapper,
  FormModalSubmitButton as SubmitButton,
};
