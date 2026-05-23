import React from "react";
import Button from "../Button/Button";
import {
  ButtonWrapper,
  Fields,
  Form,
  FormModal,
  Input,
  Label,
  Row,
  StatusArea,
  SubmitButton,
  Textarea,
} from "./FormModal";
import Message from "../Message/Message";

function FormModalStory(args) {
  const [open, setOpen] = React.useState(args.open);

  React.useEffect(() => {
    setOpen(args.open);
  }, [args.open]);

  return (
    <FormModal
      open={open}
      onOpenChange={setOpen}
      trigger={<Button>{args.triggerText}</Button>}
      title={args.title}
      titleHint={args.titleHint}
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        {args.showMessage && (
          <StatusArea>
            <Message type={args.messageType}>{args.messageText}</Message>
          </StatusArea>
        )}

        <Fields>
          <Row>
            <Label htmlFor="storybook-modal-name">{args.firstLabel}</Label>
            <Input
              id="storybook-modal-name"
              required={args.firstRequired}
              placeholder={args.firstPlaceholder}
              disabled={args.disabled}
            />
          </Row>
          <Row>
            <Label htmlFor="storybook-modal-description">
              {args.secondLabel}
            </Label>
            <Textarea
              id="storybook-modal-description"
              placeholder={args.secondPlaceholder}
              disabled={args.disabled}
            />
          </Row>
        </Fields>

        <ButtonWrapper>
          <SubmitButton disabled={args.disabled}>{args.submitText}</SubmitButton>
        </ButtonWrapper>
      </Form>
    </FormModal>
  );
}

export default {
  title: "Components/FormModal",
  component: FormModal,
  argTypes: {
    open: {
      control: "boolean",
    },
    triggerText: {
      control: "text",
    },
    title: {
      control: "text",
    },
    titleHint: {
      control: "text",
    },
    firstLabel: {
      control: "text",
    },
    firstPlaceholder: {
      control: "text",
    },
    firstRequired: {
      control: "boolean",
    },
    secondLabel: {
      control: "text",
    },
    secondPlaceholder: {
      control: "text",
    },
    submitText: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    showMessage: {
      control: "boolean",
    },
    messageType: {
      control: "select",
      options: ["info", "success", "error"],
    },
    messageText: {
      control: "text",
    },
  },
  args: {
    open: false,
    triggerText: "打开表单",
    title: "添加词汇集",
    titleHint: "vocabulary_sets",
    firstLabel: "名称",
    firstPlaceholder: "N2 核心词汇",
    firstRequired: true,
    secondLabel: "描述",
    secondPlaceholder: "这个词汇集的用途",
    submitText: "保存",
    disabled: false,
    showMessage: true,
    messageType: "info",
    messageText: "这里是一条表单状态提示。",
  },
};

export const Playground = {
  args:{
    open:true
  },
  render:(args) => <FormModalStory {...args} />
};
