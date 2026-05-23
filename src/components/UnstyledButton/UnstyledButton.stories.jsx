import UnstyledButton from "./UnstyledButton";
import Icon from "../Icon/Icon";

export default {
  title: "Components/UnstyledButton",
  component: UnstyledButton,
};

export const Text = {
  render: () => <UnstyledButton>Plain button reset</UnstyledButton>,
};

export const IconOnly = {
  render: () => (
    <UnstyledButton aria-label="Menu">
      <Icon id="menu" size="1.3rem" />
    </UnstyledButton>
  ),
};
