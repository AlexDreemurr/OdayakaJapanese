import React from "react";
import AlertDialog from "./AlertDialog";
import Button from "../Button/Button";

function AlertDialogStory(args) {
  const [confirmed, setConfirmed] = React.useState(false);

  return (
    <div style={{ minHeight: "12rem", display: "grid", placeItems: "center" }}>
      <AlertDialog
        title={args.title}
        description={args.description}
        cancelText={args.cancelText}
        confirmText={args.confirmText}
        confirmDisabled={args.confirmDisabled}
        onConfirm={() => setConfirmed(true)}
        trigger={<Button>{args.triggerText}</Button>}
      />
      {confirmed && <p style={{ marginTop: "1rem" }}>Confirmed</p>}
    </div>
  );
}

export default {
  title: "Components/AlertDialog",
  component: AlertDialog,
  argTypes: {
    triggerText: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
    cancelText: { control: "text" },
    confirmText: { control: "text" },
    confirmDisabled: { control: "boolean" },
  },
  args: {
    triggerText: "Open alert",
    title: "Delete item",
    description: "This action cannot be undone.",
    cancelText: "Cancel",
    confirmText: "Delete",
    confirmDisabled: false,
  },
};

export const Playground = {
  render: (args) => <AlertDialogStory {...args} />,
};
