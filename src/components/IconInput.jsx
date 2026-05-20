import React from "react";
import styled from "styled-components";

import Icon from "./Icon";
import VisuallyHidden from "./VisuallyHidden";

const STYLE = {
  small: {
    height: 24,
    iconSize: 16,
    iconTop: 0.7,
    fontSize: 14,
    borderWidth: 1,
    paddingLeft: 24,
    paddingTop: 2,
  },
  large: {
    height: 36,
    iconSize: 24,
    iconTop: 0,
    fontSize: 16,
    borderWidth: 2,
    paddingLeft: 36,
    paddingTop: 0,
  },
};
const IconInput = ({ label, icon, width = 250, size, ...delegated }) => {
  const styles = STYLE[size];
  if (!styles) {
    throw new Error(`Invalid size: ${size}, available sizes small/large.`);
  }
  return (
    <Wrapper
      style={{
        "--width": typeof width === "number" ? width + "px" : width,
        "--height": styles.height / 16 + "rem",
        "--iconSize": styles.iconSize + "px",
        "--iconTop": styles.iconTop + "rem",
        "--fontSize": styles.fontSize / 16 + "rem",
        "--borderWidth": styles.borderWidth + "px",
        "--paddingLeft": styles.paddingLeft / 16 + "rem",
        "--paddingTop": styles.paddingTop + "px",
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
      <IconWrapper>
        <Icon
          id={icon}
          size={styles.iconSize}
          strokeWidth={styles.borderWidth}
        />
      </IconWrapper>
      <Input {...delegated}></Input>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: var(--width);
  height: var(--height);
  position: relative;
  color: var(--gray15);
  &:hover {
    color: var(--gray15);
  }
  /* border: 1px black dotted; */
`;
const IconWrapper = styled.div`
  position: absolute;
  left: 0;
  top: var(--iconTop);
  bottom: 0;
  margin: auto;

  width: var(--iconSize);
  height: var(--iconSize);

  pointer-events: none;
`;
const Input = styled.input`
  background-color: var(--gray95);
  padding: 0;
  margin: 0;
  padding-top: var(--paddingTop);
  padding-left: var(--paddingLeft);
  width: var(--width);
  height: inherit;
  border: none;
  border-bottom: var(--borderWidth) var(--gray40) solid;
  outline-offset: 2px;

  font-size: var(--fontSize);
  font-weight: 700;
  color: inherit;
  &::placeholder {
    font-weight: 400;
    color: var(--gray60);
  }
`;
export default IconInput;
