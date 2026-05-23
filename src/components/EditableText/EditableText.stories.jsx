import React from "react";
import EditableText, { EditableTextInput } from "./EditableText";

function EditableTextStory(args) {
  const [value, setValue] = React.useState(args.value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        color: "var(--gray15)",
        fontSize: "1.25rem",
      }}
    >
      <EditableText
        value={value}
        displayValue={args.displayValue || value}
        placeholder={args.placeholder}
        disabled={args.disabled}
        onSave={setValue}
      />
      <p style={{ color: "var(--gray40)", fontSize: "0.9rem" }}>
        Saved value: {value || "(empty)"}
      </p>
    </div>
  );
}

export default {
  title: "Components/EditableText",
  component: EditableText,
  argTypes: {
    value: { control: "text" },
    displayValue: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
  args: {
    value: "benkyou",
    displayValue: "",
    placeholder: "Click to edit",
    disabled: false,
  },
};

export const Playground = {
  render: (args) => <EditableTextStory {...args} />,
};

export const InputOnly = {
  render: () => (
    <div style={{ color: "var(--gray15)", fontSize: "1.25rem" }}>
      <EditableTextInput value="auto width" readOnly />
    </div>
  ),
};
