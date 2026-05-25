import styled from "styled-components";
import { FONT_SIZE } from "../../constants";

const STYLE = {
  default: {
    "--backgroundColor": "var(--gray85)",
    "--hoverColor": "hsl(0deg 0% 75%)",
    "--color": "black",
  },
  success: {
    "--backgroundColor": "hsl(0 0% 15%)",
    "--hoverColor": "hsl(0deg 0% 0%)",
    "--color": "var(--gray85)",
  },
  info: {
    "--backgroundColor": "hsl(200deg 5% 95%)",
    "--hoverColor": "hsl(0deg 0% 85%)",
    "--color": "var(--gray95)",
  },
};
export default function Button({
  as = "",
  type = "default",
  nativeType,
  children,
  ...delegated
}) {
  /* type: 
        default | success | info 
  */

  return (
    <Wrapper
      as={as || "button"}
      type={nativeType}
      style={STYLE[type]}
      {...delegated}
    >
      {children}
    </Wrapper>
  );
}

const Wrapper = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  font-size: ${FONT_SIZE.small};
  background-color: var(--backgroundColor);
  color: var(--color);
  border: none;
  border: 1px var(--gray60) solid;
  &:hover {
    background-color: var(--hoverColor);
  }
`;
