import Message from "./Message";
import { FONT_SIZE } from "../../constants/index";

export default {
  title: "Components/Message",
  component: Message,
  argTypes: {
    type: {
      control: "select",
      options: ["info", "success", "error"],
    },
    fontSize: {
      control: "select",
      options: Object.values(FONT_SIZE),
    },
    children: {
      control: "text",
    },
  },
  args: {
    type: "info",
    fontSize: FONT_SIZE.default,
    children: "这里是一条提示信息。",
  },
};

export const Playground = {
  render: (args) => <Message {...args} />,
};
