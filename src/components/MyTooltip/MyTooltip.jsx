import * as Tooltip from "@radix-ui/react-tooltip";
import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "../../constants/index";

function MyTooltip({ trigger, children }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{trigger}</Tooltip.Trigger>
        <Portal>
          <Content>
            {children}
            <Tooltip.Arrow />
          </Content>
        </Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
const Portal = styled(Tooltip.Portal)``;
const Content = styled(Tooltip.Content)`
  z-index: 1000;
  background-color: var(--gray85);
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_secondary};
  font-size: ${FONT_SIZE.tiny};
  line-height: 1.5;
  padding: 0.5rem 1rem;
  border: 2px var(--gray15) solid;
  border-radius: 0.5rem;

  max-width: 200px;
`;

export default MyTooltip;
