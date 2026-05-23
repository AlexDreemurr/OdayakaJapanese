import UserAvatar from "./UserAvatar";

export default {
  title: "Components/UserAvatar",
  component: UserAvatar,
  argTypes: {
    size: { control: "select", options: ["small", "default", "large"] },
    avatarPath: { control: "text" },
    selected: { control: "boolean" },
  },
  args: {
    size: "default",
    avatarPath: "",
    selected: false,
  },
};

export const Playground = {
  render: (args) => <UserAvatar {...args} />,
};

export const Gallery = {
  render: () => (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
      <UserAvatar size="small" />
      <UserAvatar size="default" />
      <UserAvatar size="large" selected />
    </div>
  ),
};
