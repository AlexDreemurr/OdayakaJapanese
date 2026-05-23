import React from "react";
import styled from "styled-components";
import UnstyledButton from "../UnstyledButton/UnstyledButton";

export function EditableTextInput({
  value,
  className,
  extraWidth = 12,
  measureText = value,
  style,
  ...delegated
}) {
  const measureRef = React.useRef(null);
  const [inputWidth, setInputWidth] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!measureRef.current) {
      return;
    }

    measureRef.current.textContent = measureText || " ";
    setInputWidth(Math.ceil(measureRef.current.offsetWidth) + extraWidth);
  }, [extraWidth, measureText]);

  return (
    <>
      <Input
        className={className}
        value={value}
        style={inputWidth > 0 ? { ...style, width: `${inputWidth}px` } : style}
        {...delegated}
      />
      <Measure ref={measureRef} className={className} aria-hidden="true" />
    </>
  );
}

function EditableText({
  value,
  displayValue = value,
  placeholder,
  disabled = false,
  className,
  inputClassName,
  buttonClassName,
  onBeforeEdit,
  onSave,
  onCancel,
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [draftValue, setDraftValue] = React.useState(value ?? "");

  React.useEffect(() => {
    if (!isEditing) {
      setDraftValue(value ?? "");
    }
  }, [isEditing, value]);

  function startEditing() {
    if (disabled) {
      return;
    }

    if (onBeforeEdit?.() === false) {
      return;
    }

    setDraftValue(value ?? "");
    setIsEditing(true);
  }

  async function saveDraft() {
    if (disabled) {
      setIsEditing(false);
      return;
    }

    const nextValue = draftValue.trim();
    if (nextValue !== (value ?? "")) {
      await onSave?.(nextValue);
    }

    setIsEditing(false);
  }

  function cancelEditing() {
    setDraftValue(value ?? "");
    setIsEditing(false);
    onCancel?.();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      cancelEditing();
    }
  }

  if (isEditing) {
    return (
      <EditableTextInput
        autoFocus
        value={draftValue}
        className={inputClassName ?? className}
        placeholder={placeholder}
        disabled={disabled}
        onBlur={saveDraft}
        onChange={(event) => setDraftValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <TextButton
      type="button"
      className={buttonClassName ?? className}
      disabled={disabled}
      onClick={startEditing}
    >
      {displayValue || placeholder}
    </TextButton>
  );
}

const Input = styled.input`
  --edit-underline-color: var(--gray40);

  min-width: 0;
  max-width: min(14rem, 100%);
  border: 0;
  background-color: transparent;
  background-image: linear-gradient(
    var(--edit-underline-color),
    var(--edit-underline-color)
  );
  background-position: 0 calc(100% - 0.1rem);
  background-repeat: no-repeat;
  background-size: 100% 1px;
  color: inherit;
  font: inherit;
  font-weight: inherit;
  line-height: inherit;
  padding: 0;
  outline: none;

  &:focus {
    --edit-underline-color: var(--gray15);
  }
`;

const Measure = styled.span`
  position: absolute;
  visibility: hidden;
  white-space: pre;
  pointer-events: none;
  font: inherit;
  font-weight: inherit;
`;

const TextButton = styled(UnstyledButton)`
  color: inherit;
  font: inherit;
  overflow-wrap: anywhere;

  &:disabled {
    cursor: default;
  }
`;

export default EditableText;
