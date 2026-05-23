import Button from "./Button";

export default {
  title: "Components/Button",
  component: Button,
  argTypes: {
    type: {
      control: "select",
      options: ["default", "success", "info"],
    },
    disabled: {
      control: "boolean",
    },
    children: {
      control: "text",
    },
  },
  args: {
    type: "default",
    disabled: false,
    children: "按钮",
  },
};

export const Playground = {
  render: (args) => <Button {...args} />,
};
