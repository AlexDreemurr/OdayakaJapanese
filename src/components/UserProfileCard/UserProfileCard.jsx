import React from "react";
import styled from "styled-components";
import supabase from "../../supabaseClient";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import {
  isMissingProfileTable,
  useUserProfile,
} from "../../hooks/useUserProfile";
import AuthModal from "../AuthModal/AuthModal";
import Button from "../Button/Button";
import EditableText from "../EditableText/EditableText";
import SetAvatar from "../SetAvatar/SetAvatar";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import UserAvatar from "../UserAvatar/UserAvatar";

const DEFAULT_NICKNAME = "未设置昵称";
const GUEST_NICKNAME = "未登录";

function getMetadataDisplayName(user) {
  return user?.user_metadata?.display_name ?? "";
}

function UserProfileCard({ user, isLoggedIn, signOut, extraAction }) {
  const [displayUser, setDisplayUser] = React.useState(user);
  const { avatarPath, displayName, setAvatarPath, setDisplayName } =
    useUserProfile(user);
  const [status, setStatus] = React.useState("free");
  const [showAuth, setShowAuth] = React.useState(false);
  const [showSetAvatar, setShowSetAvatar] = React.useState(false);
  const savedProfileRef = React.useRef({
    avatar: { pending: false, value: null },
    name: { pending: false, value: "" },
  });

  React.useEffect(() => {
    setDisplayUser(user);

    if (!user?.id) {
      setAvatarPath(null);
      savedProfileRef.current = {
        avatar: { pending: false, value: null },
        name: { pending: false, value: "" },
      };
      return;
    }

    const metadataDisplayName = getMetadataDisplayName(user);

    if (metadataDisplayName === savedProfileRef.current.name.value) {
      savedProfileRef.current.name = { pending: false, value: "" };
    }
  }, [setAvatarPath, setDisplayName, user]);

  function handleAvatarClick() {
    if (isLoggedIn) {
      setShowSetAvatar(true);
    } else {
      setShowAuth(true);
    }
  }

  async function handleSignOut() {
    const { error } = await signOut();

    if (error) {
      console.error(error.message);
      return;
    }

    window.location.reload();
  }

  async function saveDisplayName(nextDisplayName) {
    if (!isLoggedIn || status === "busy") {
      return;
    }

    if (nextDisplayName === displayName) {
      return;
    }

    setStatus("busy");
    const nextUserMetadata = { ...displayUser?.user_metadata };
    nextUserMetadata.display_name = nextDisplayName;

    const { data, error } = await supabase.auth.updateUser({
      data: nextUserMetadata,
    });

    if (error) {
      console.error(error.message);
      setStatus("free");
      return;
    }

    const { error: profileError } = await supabase.from("user_profiles").upsert(
      {
        user_id: data.user.id,
        avatar_path: avatarPath,
        display_name: nextDisplayName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (profileError && !isMissingProfileTable(profileError)) {
      console.error(profileError.message);
    }

    savedProfileRef.current.name = {
      pending: true,
      value: nextDisplayName,
    };
    setDisplayUser(data.user);
    setDisplayName(nextDisplayName);
    setStatus("free");
  }

  const visibleName =
    displayName || (isLoggedIn ? DEFAULT_NICKNAME : GUEST_NICKNAME);

  return (
    <ProfileCard>
      <AvatarButton
        type="button"
        aria-label={isLoggedIn ? "设置头像" : "登录后设置头像"}
        onClick={handleAvatarClick}
      >
        <UserAvatar size="large" avatarPath={avatarPath} />
      </AvatarButton>

      <ProfileInfo>
        <NameEditable
          value={displayName}
          displayValue={visibleName}
          placeholder={DEFAULT_NICKNAME}
          disabled={!isLoggedIn || status === "busy"}
          onSave={saveDisplayName}
        />

        <EmailText>{isLoggedIn ? user.email : "登录后同步游玩记录"}</EmailText>

        <ActionWrapper>
          {isLoggedIn ? (
            <SmallButton onClick={handleSignOut}>退出</SmallButton>
          ) : (
            <SmallButton onClick={() => setShowAuth(true)}>
              登录 / 注册
            </SmallButton>
          )}
          {extraAction}
        </ActionWrapper>
      </ProfileInfo>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showSetAvatar && (
        <SetAvatar
          open
          user={{
            ...displayUser,
            user_metadata: {
              ...displayUser?.user_metadata,
              avatar_path: avatarPath,
            },
          }}
          onClose={() => setShowSetAvatar(false)}
          onSaved={(nextUser, nextAvatarPath) => {
            savedProfileRef.current.avatar = {
              pending: true,
              value: nextAvatarPath,
            };
            setDisplayUser(nextUser);
            setAvatarPath(nextAvatarPath);
          }}
        />
      )}
    </ProfileCard>
  );
}

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1.35rem;
  width: min(100%, 28rem);
`;

const AvatarButton = styled(UnstyledButton)`
  flex: 0 0 auto;
  border-radius: 50%;

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 6px;
  }
`;

const ProfileInfo = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
`;

const NameEditable = styled(EditableText)`
  max-width: 100%;
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.default};
  line-height: 1.35;
  overflow-wrap: anywhere;

  &:disabled {
    cursor: default;
  }
`;

const EmailText = styled.p`
  color: var(--gray40);
  font-size: ${FONT_SIZE.tiny};
  line-height: 1.35;
  overflow-wrap: anywhere;
`;

const ActionWrapper = styled.div`
  width: min(100%, 20rem);
  margin-top: 0.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SmallButton = styled(Button)`
  width: 9rem;
  margin: 0;
  font-size: ${FONT_SIZE.tiny};
`;

export default UserProfileCard;
