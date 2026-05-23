import React from "react";
import AuthModal from "./AuthModal";
import Button from "../Button/Button";

function AuthModalStory(args) {
  const [open, setOpen] = React.useState(args.open);

  return (
    <div style={{ minHeight: "22rem" }}>
      <Button onClick={() => setOpen(true)}>Open auth modal</Button>
      {open && <AuthModal onClose={() => setOpen(false)} />}
    </div>
  );
}

export default {
  title: "Components/AuthModal",
  component: AuthModal,
  argTypes: {
    open: { control: "boolean" },
  },
  args: {
    open: true,
  },
};

export const Playground = {
  render: (args) => <AuthModalStory {...args} />,
};
