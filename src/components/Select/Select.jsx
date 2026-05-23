import React from "react";
import styled from "styled-components";

import Icon from "../Icon/Icon";
import { FONT_SIZE } from "../../constants";

function getDisplayedValue(value, children) {
  const childArray = React.Children.toArray(children);
  const selectedChild = childArray.find((child) => child.props.value === value);

  return selectedChild?.props.children ?? value;
}

const Select = ({
  value,
  onChange,
  children,
  fontSize = FONT_SIZE.default,
  ...delegated
}) => {
  const displayedValue = getDisplayedValue(value, children);

  return (
    <Wrapper>
      <NativeSelect value={value} onChange={onChange} {...delegated}>
        {children}
      </NativeSelect>
      <SelectWrapper>
        <SelectedText $fontSize={fontSize}>{displayedValue}</SelectedText>
        <SelectIcon style={{ "--size": 24 + "px" }}>
          <Icon id="chevron-down" size={24} strokeWidth={2} />
        </SelectIcon>
      </SelectWrapper>
    </Wrapper>
  );
};
const Wrapper = styled.div`
  position: relative;
  width: fit-content;
`;
const NativeSelect = styled.select`
  opacity: 0;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: 2px;
  cursor: pointer;
`;
const SelectWrapper = styled.div`
  height: 35px;
  background-color: white;
  border: 1px var(--gray40) solid;
  color: var(--gray15);
  padding: 6px 52px 10px 16px;
  border-radius: 2px;
  pointer-events: none;
  ${NativeSelect}:hover + & {
    color: black;
  }
  ${NativeSelect}:focus + & {
    outline: 1px dotted #212121;
    outline: 5px auto -webkit-focus-ring-color;
  }
`;
const SelectedText = styled.p`
  font-size: ${(p) => p.$fontSize};
  margin-top: -0.3rem;
`;
const SelectIcon = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  right: 10px;
  width: var(--size);
  height: var(--size);
  pointer-events: none;
`;
export default Select;
