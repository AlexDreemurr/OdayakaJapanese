import styled from "styled-components";
import { FONT_SIZE } from "../../constants";

const STYLE = {
  default: {
    "--backgroundColor": "var(--surface)",
    "--hoverColor": "var(--gray85)",
    "--color": "var(--text)",
    "--borderColor": "var(--border)",
  },
  primary: {
    "--backgroundColor": "var(--accent)",
    "--hoverColor": "var(--accent-strong)",
    "--color": "hsl(40deg 36% 99%)",
    "--borderColor": "transparent",
  },
  success: {
    "--backgroundColor": "var(--gray15)",
    "--hoverColor": "hsl(26deg 16% 8%)",
    "--color": "var(--gray85)",
    "--borderColor": "transparent",
  },
  info: {
    "--backgroundColor": "var(--gray85)",
    "--hoverColor": "var(--gray75)",
    "--color": "var(--text)",
    "--borderColor": "var(--border)",
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
        default | primary | success | info
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
  padding: 0.5rem 1rem;
  font-size: ${FONT_SIZE.small};
  font-weight: 600;
  background-color: var(--backgroundColor);
  color: var(--color);
  border: 1px solid var(--borderColor);
  border-radius: 0.6rem;
  cursor: pointer;
  transition: background-color 120ms ease, box-shadow 120ms ease,
    transform 80ms ease;
  box-shadow: var(--shadow-sm);

  &:hover {
    background-color: var(--hoverColor);
  }
  &:active {
    transform: translateY(1px);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`;
