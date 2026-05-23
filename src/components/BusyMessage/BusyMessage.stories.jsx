import BusyMessage from "./BusyMessage";
import { FONT_SIZE } from "../../constants/index";

export default {
  title: "Components/BusyMessage",
  component: BusyMessage,
  argTypes: {
    children: {
      control: "text",
    },
    fontSize: {
      control: "select",
      options: Object.values(FONT_SIZE),
    },
  },
  args: {
    children: "请稍等...",
    fontSize: FONT_SIZE.default,
  },
};

export const Playground = {
  render: (args) => <BusyMessage {...args} />,
};
