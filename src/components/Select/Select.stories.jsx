import React from "react";
import Select from "./Select";
import { FONT_SIZE } from "../../constants";

const optionItems = [
  { value: "grammar", label: "语法练习" },
  { value: "sharedDict", label: "共享词汇练习" },
  { value: "history", label: "历史记录" },
];

function SelectStory(args) {
  const [value, setValue] = React.useState(args.value);

  React.useEffect(() => {
    setValue(args.value);
  }, [args.value]);

  return (
    <Select
      {...args}
      value={value}
      onChange={(event) => setValue(event.target.value)}
    >
      {optionItems.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  );
}

export default {
  title: "Components/Select",
  component: Select,
  argTypes: {
    value: {
      control: "select",
      options: optionItems.map((option) => option.value),
    },
    fontSize: {
      control: "select",
      options: Object.values(FONT_SIZE),
    },
    disabled: {
      control: "boolean",
    },
  },
  args: {
    value: "grammar",
    fontSize: FONT_SIZE.default,
    disabled: false,
  },
};

export const Playground = {
  render: (args) => <SelectStory {...args} />,
};
