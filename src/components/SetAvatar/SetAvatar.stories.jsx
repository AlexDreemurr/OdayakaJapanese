import React from "react";
import SetAvatar from "./SetAvatar";
import Button from "../Button/Button";

const user = {
  id: "user-1",
  email: "student@example.com",
  user_metadata: {
    display_name: "Student",
    avatar_path: "male/male_1.png",
  },
};

function SetAvatarStory(args) {
  const [open, setOpen] = React.useState(args.open);

  return (
    <div style={{ minHeight: "28rem" }}>
      <Button onClick={() => setOpen(true)}>Open avatar picker</Button>
      <SetAvatar
        open={open}
        user={user}
        onClose={() => setOpen(false)}
        onSaved={() => {}}
      />
    </div>
  );
}

export default {
  title: "Components/SetAvatar",
  component: SetAvatar,
  argTypes: {
    open: { control: "boolean" },
  },
  args: {
    open: true,
  },
};

export const Playground = {
  render: (args) => <SetAvatarStory {...args} />,
};
