import IconInput from "./IconInput";

export default {
  title: "Components/IconInput",
  component: IconInput,
  argTypes: {
    size: { control: "select", options: ["small", "large"] },
    icon: { control: "select", options: ["search", "user", "message"] },
    label: { control: "text" },
    placeholder: { control: "text" },
    width: { control: "text" },
  },
  args: {
    size: "large",
    icon: "search",
    label: "Search",
    placeholder: "Search vocabulary",
    width: "18rem",
  },
};

export const Playground = {
  render: (args) => <IconInput {...args} />,
};

export const Sizes = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <IconInput label="Small search" icon="search" size="small" placeholder="Small" />
      <IconInput label="Large search" icon="search" size="large" placeholder="Large" />
    </div>
  ),
};
