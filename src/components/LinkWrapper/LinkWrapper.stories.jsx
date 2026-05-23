import LinkWrapper from "./LinkWrapper";

export default {
  title: "Components/LinkWrapper",
  component: LinkWrapper,
  argTypes: {
    children: { control: "text" },
    fontSize: { control: "text" },
    to: { control: "text" },
  },
  args: {
    children: "Open phrase sets",
    fontSize: "1.125rem",
    to: "/phraseSetList",
  },
};

export const Playground = {
  render: (args) => <LinkWrapper {...args} />,
};
