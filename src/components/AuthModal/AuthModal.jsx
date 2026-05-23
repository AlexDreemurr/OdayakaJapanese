import React from "react";
import styled from "styled-components";
import supabase from "../../supabaseClient";
import { FONT_SIZE } from "../../constants/index";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import {
  ButtonWrapper,
  Fields,
  FormModal,
  Form,
  Input,
  Label,
  PasswordInput,
  Row,
  StatusArea,
  SubmitButton,
} from "../FormModal/FormModal";

function AuthModal({ onClose }) {
  const emailInputId = React.useId();
  const passwordInputId = React.useId();

  const [mode, setMode] = React.useState("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState(null);
  const [message, setMessage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  async function syncUserProfile(user) {
    if (!user?.id) {
      return;
    }

    await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        email: user.email,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === "signin") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        await syncUserProfile(data.user);
        window.location.reload();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setError(error.message);
      } else {
        await syncUserProfile(data.user);
        setMessage("注册成功！请查收确认邮件。");
      }
    }

    setLoading(false);
  }

  function handleModeChange() {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setMessage(null);
  }

  return (
    <FormModal
      open
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) {
          onClose();
        }
      }}
      title={mode === "signin" ? "登录" : "注册"}
      titleHint="account"
    >
      <Form onSubmit={handleSubmit}>
        <Fields>
          <Row>
            <Label htmlFor={emailInputId}>邮箱</Label>
            <Input
              id={emailInputId}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={loading}
            />
          </Row>

          <Row>
            <Label htmlFor={passwordInputId}>密码</Label>
            <PasswordInput
              id={passwordInputId}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
            />
          </Row>
        </Fields>

        {(!!error || !!message) && (
          <StatusArea>
            {error && <ErrorText>发生错误: {error}</ErrorText>}
            {message && <SuccessText>{message}</SuccessText>}
          </StatusArea>
        )}

        <ButtonWrapper>
          <SubmitButton disabled={loading}>
            {loading ? "请稍等..." : mode === "signin" ? "登录" : "注册"}
          </SubmitButton>
        </ButtonWrapper>
      </Form>

      <SwitchText>
        {mode === "signin" ? "没有账号？" : "已有账号？"}
        <SwitchButton type="button" onClick={handleModeChange}>
          {mode === "signin" ? "点击注册" : "点击登录"}
        </SwitchButton>
      </SwitchText>
    </FormModal>
  );
}

const SwitchText = styled.p`
  text-align: center;
  color: var(--gray40);
  font-size: ${FONT_SIZE.small};
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
`;

const SwitchButton = styled(UnstyledButton)`
  color: var(--green15);
  font-size: ${FONT_SIZE.small};
  margin-left: 0.25rem;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorText = styled.p`
  color: var(--red15);
  font-size: ${FONT_SIZE.small};
`;

const SuccessText = styled.p`
  color: var(--green15);
  font-size: ${FONT_SIZE.small};
`;

export default AuthModal;
