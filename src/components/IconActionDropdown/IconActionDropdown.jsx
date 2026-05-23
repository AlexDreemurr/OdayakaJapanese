import styled from "styled-components";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { FONT_FAMILY, FONT_SIZE } from "../../constants/index";
import Icon from "../Icon/Icon";
import UnstyledButton from "../UnstyledButton/UnstyledButton";

function IconActionDropdown({ label = "更多操作", actions }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Trigger type="button" aria-label={label}>
          <Icon id="menu" size="1.3rem" color="var(--gray15)" />
        </Trigger>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <Content align="end" sideOffset={6}>
          {actions.map((action) => (
            <Item
              key={action.label}
              onSelect={(event) => {
                event.preventDefault();
                action.onSelect?.();
              }}
            >
              <Icon id={action.icon} size="1.15rem" color="currentColor" />
              <ItemText>{action.label}</ItemText>
            </Item>
          ))}
        </Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

const Trigger = styled(UnstyledButton)`
  padding: 0.8rem;
  color: var(--gray15);
`;

const Content = styled(DropdownMenu.Content)`
  min-width: 10rem;
  border: 1px solid var(--gray60);
  border-radius: 0.5rem;
  background-color: var(--gray95);
  padding: 0.35rem;
`;

const Item = styled(DropdownMenu.Item)`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.45rem 0.55rem;
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
  outline: none;
  cursor: pointer;

  &[data-highlighted] {
    background-color: var(--gray85);
  }
`;

const ItemText = styled.span`
  font-size: ${FONT_SIZE.small};
`;

export default IconActionDropdown;
