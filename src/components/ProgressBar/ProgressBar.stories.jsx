import React from "react";
import ProgressBar from "./ProgressBar";

function ProgressBarStory(args) {
  const [value, setValue] = React.useState(args.value);

  React.useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <div style={{ width: "min(100%, 32rem)" }}>
      <ProgressBar
        {...args}
        value={value}
        onChange={args.interactive ? setValue : undefined}
      />
    </div>
  );
}

export default {
  title: "Components/ProgressBar",
  component: ProgressBar,
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    size: {
      control: "select",
      options: ["small", "medium", "large"],
    },
    interactive: {
      control: "boolean",
    },
    ariaLabel: {
      control: "text",
    },
  },
  args: {
    value: 45,
    size: "small",
    interactive: true,
    ariaLabel: "进度",
  },
};

export const Playground = {
  render: (args) => <ProgressBarStory {...args} />,
};
