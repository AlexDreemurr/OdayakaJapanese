import React from "react";
import styled from "styled-components";
import { updateUserMetadata, upsertUserProfile } from "../../services/auth";
import {
  AVATAR_SECTIONS,
  DEFAULT_SELECTABLE_AVATAR_VALUE,
  FALLBACK_AVATAR_VALUE,
} from "../../constants/avatarOptions";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import Button from "../Button/Button";
import { FormModal } from "../FormModal/FormModal";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import UserAvatar from "../UserAvatar/UserAvatar";

function SetAvatar({ open, onClose, user, onSaved }) {
  const currentAvatarPath = user?.user_metadata?.avatar_path;
  const currentAvatarValue = currentAvatarPath ?? FALLBACK_AVATAR_VALUE;
  const [selectedAvatarPath, setSelectedAvatarPath] = React.useState(
    currentAvatarValue
  );
  const [status, setStatus] = React.useState("free");
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (open) {
      setSelectedAvatarPath(
        currentAvatarValue ?? DEFAULT_SELECTABLE_AVATAR_VALUE
      );
      setStatus("free");
      setError(null);
    }
  }, [currentAvatarValue, open]);

  async function handleSave(event) {
    event.preventDefault();
    setStatus("busy");
    setError(null);
    const avatarPath =
      selectedAvatarPath === FALLBACK_AVATAR_VALUE ? null : selectedAvatarPath;
    const nextUserMetadata = { ...user?.user_metadata };
    nextUserMetadata.avatar_path = avatarPath;

    const { data, error } = await updateUserMetadata(nextUserMetadata);

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    const { error: profileError } = await upsertUserProfile({
      user_id: data.user.id,
      avatar_path: avatarPath,
    });

    if (profileError) {
      const missingProfileTable = /user_profiles|schema cache|PGRST205/i.test(
        profileError.message
      );

      if (!missingProfileTable) {
        setStatus("error");
        setError(profileError.message);
        return;
      }

      console.warn("user_profiles table is not ready yet.", profileError);
    }

    onSaved?.(data.user, avatarPath);
    setStatus("free");
    onClose();
  }

  return (
    <FormModal
      open={open}
      onOpenChange={(nextIsOpen) => {
        if (!nextIsOpen) {
          onClose();
        }
      }}
      title="头像"
      titleHint="avatar"
    >
      <Form onSubmit={handleSave}>
        <Sections>
          {AVATAR_SECTIONS.map((section) => (
            <Section key={section.id}>
              <SectionTitle>{section.title}</SectionTitle>
              <AvatarGrid>
                {section.avatars.map((avatar) => {
                  const avatarValue = avatar.path ?? FALLBACK_AVATAR_VALUE;
                  const isSelected = selectedAvatarPath === avatarValue;

                  return (
                    <AvatarButton
                      key={avatar.id}
                      type="button"
                      aria-label={
                        avatar.path ? `选择 ${section.title} 头像` : "选择默认头像"
                      }
                      aria-pressed={isSelected}
                      onClick={() => setSelectedAvatarPath(avatarValue)}
                    >
                      <UserAvatar
                        size="default"
                        avatarPath={avatar.path}
                        selected={isSelected}
                      />
                    </AvatarButton>
                  );
                })}
              </AvatarGrid>
            </Section>
          ))}
        </Sections>

        {error && <ErrorText>发生错误: {error}</ErrorText>}

        <ButtonWrapper>
          <Button type="success" disabled={status === "busy"}>
            {status === "busy" ? "保存中..." : "确认"}
          </Button>
        </ButtonWrapper>
      </Form>
    </FormModal>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: min(58vh, 25rem);
  overflow: auto;
  padding: 0.35rem 0.25rem 0.25rem;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const SectionTitle = styled.h3`
  color: var(--gray40);
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.small};
  font-weight: 400;
`;

const AvatarGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const AvatarButton = styled(UnstyledButton)`
  border-radius: 50%;

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 5px;
  }
`;

const ErrorText = styled.p`
  color: var(--red15);
  font-size: ${FONT_SIZE.small};
`;

const ButtonWrapper = styled.div`
  padding: 0 1rem;
`;

export default SetAvatar;
