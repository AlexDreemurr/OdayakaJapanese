import React from "react";
import styled from "styled-components";
import supabase from "../supabaseClient";
import { FONT_FAMILY, FONT_SIZE } from "../constants";
import {
  ButtonWrapper,
  Form,
  FormModal,
  StatusArea,
  SubmitButton,
} from "./FormModal";
import AlertDialog from "./AlertDialog";
import IconInput from "./IconInput";
import Icon from "./Icon";
import Message from "./Message";
import UnstyledButton from "./UnstyledButton";
import UserAvatar from "./UserAvatar";

function getRoleLabel(role) {
  if (role === "owner") return "法人";
  if (role === "admin") return "管理员";
  return "自己人";
}

function getDisplayName(profile) {
  return profile?.display_name || profile?.email || "未命名用户";
}

function PhraseSetMembersPanel({
  phraseSet,
  currentUserId,
  onClose,
  onChanged,
}) {
  const [members, setMembers] = React.useState([]);
  const [memberSearch, setMemberSearch] = React.useState("");
  const [editingRoleUserId, setEditingRoleUserId] = React.useState(null);
  const [status, setStatus] = React.useState("free");
  const [showInvite, setShowInvite] = React.useState(false);

  const canInvite = members.some(
    (member) =>
      member.user_id === currentUserId &&
      (member.role === "owner" || member.role === "admin")
  );
  const canManagePermissions = members.some(
    (member) => member.user_id === currentUserId && member.role === "owner"
  );
  const currentMember = members.find(
    (member) => member.user_id === currentUserId
  );
  const canLeaveSet = Boolean(currentMember && currentMember.role !== "owner");
  const normalizedMemberSearch = memberSearch.trim().toLowerCase();
  const filteredMembers = normalizedMemberSearch
    ? members.filter((member) => {
        const profile = member.profile;
        const searchableValues = [
          getDisplayName(profile),
          profile?.email,
          getRoleLabel(member.role),
        ];

        return searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(normalizedMemberSearch)
        );
      })
    : members;

  async function handlePermissionChange(member, changes) {
    const nextMember = { ...member, ...changes };
    const { data, error } = await supabase.rpc(
      "update_set_member_permissions",
      {
        p_set_id: phraseSet.id,
        p_user_id: member.user_id,
        p_role: nextMember.role,
        p_can_contribute: nextMember.can_contribute,
        p_can_edit_phrases: nextMember.can_edit_phrases,
        p_can_edit_set: nextMember.can_edit_set,
      }
    );

    if (error) {
      const shouldFallbackToDirectUpdate =
        error.code === "PGRST202" ||
        error.message?.includes("schema cache") ||
        error.message?.includes("Could not find the function");

      if (!shouldFallbackToDirectUpdate) {
        console.error(error.message);
        return;
      }

      const { error: updateError } = await supabase
        .from("set_members")
        .update({
          role: nextMember.role,
          can_contribute: nextMember.can_contribute,
          can_edit_phrases: nextMember.can_edit_phrases,
          can_edit_set: nextMember.can_edit_set,
        })
        .eq("set_id", phraseSet.id)
        .eq("user_id", member.user_id)
        .neq("role", "owner");

      if (updateError) {
        console.error(updateError.message);
        return;
      }
    } else if (data !== "ok") {
      console.error(data);
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.map((currentMember) =>
        currentMember.user_id === member.user_id ? nextMember : currentMember
      )
    );
  }

  function handleRoleChange(member, role) {
    const isAdmin = role === "admin";

    handlePermissionChange(member, {
      role,
      can_contribute: isAdmin,
      can_edit_phrases: isAdmin,
      can_edit_set: isAdmin,
    });
  }

  async function handleRemoveMember(member) {
    const { data, error } = await supabase.rpc("remove_set_member", {
      p_set_id: phraseSet.id,
      p_user_id: member.user_id,
    });

    if (error || data !== "ok") {
      console.error(error?.message ?? data);
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.filter(
        (currentMember) => currentMember.user_id !== member.user_id
      )
    );
  }

  async function handleLeaveSet() {
    const { data, error } = await supabase.rpc("leave_set_member", {
      p_set_id: phraseSet.id,
    });

    if (error || data !== "ok") {
      console.error(error?.message ?? data);
      return;
    }

    onChanged?.();
    onClose?.();
  }

  const fetchMembers = React.useCallback(async () => {
    if (!phraseSet?.id) return;

    setStatus("busy");
    const { data: memberships, error } = await supabase
      .from("set_members")
      .select("user_id, role, can_contribute, can_edit_phrases, can_edit_set")
      .eq("set_id", phraseSet.id)
      .order("role", { ascending: false });

    if (error) {
      setStatus("error");
      return;
    }

    const userIds = memberships.map((membership) => membership.user_id);
    const { data: profiles } = userIds.length
      ? await supabase
          .from("user_profiles")
          .select("user_id, display_name, avatar_path, email")
          .in("user_id", userIds)
      : { data: [] };
    const profileByUserId = new Map(
      (profiles ?? []).map((profile) => [profile.user_id, profile])
    );

    setMembers(
      memberships.map((membership) => ({
        ...membership,
        profile: profileByUserId.get(membership.user_id) ?? null,
      }))
    );
    setStatus("ok");
  }, [phraseSet?.id]);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  if (!phraseSet) {
    return null;
  }

  return (
    <FormModal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose?.();
        }
      }}
      title="成员"
      titleHint={phraseSet.name}
      titleAction={
        canInvite || canLeaveSet ? (
          <>
          {canInvite && (
            <InviteButton type="button" onClick={() => setShowInvite(true)}>
              邀请
            </InviteButton>
          )}
          {canLeaveSet && (
            <AlertDialog
              title="退出词汇集"
              description={`确定要退出「${phraseSet.name}」吗？如果这是私有词汇集，你将不再能够访问。`}
              confirmText="确认退出"
              onConfirm={handleLeaveSet}
              trigger={<LeaveButton type="button">退出</LeaveButton>}
            />
          )}
          </>
        ) : null
      }
    >
      <Panel>
        <HeaderRow>
          <PanelTitle>词汇集成员</PanelTitle>
          <IconInput
            label="搜索词汇集成员"
            icon="search"
            size="small"
            width="clamp(8rem, 32vw, 12rem)"
            value={memberSearch}
            placeholder="搜索成员"
            onChange={(event) => setMemberSearch(event.target.value)}
          />
        </HeaderRow>

        {status === "busy" && <SubtleText>加载成员中...</SubtleText>}
        {status === "error" && (
          <Message type="error">成员加载失败，请稍后重试。</Message>
        )}
        {status === "ok" &&
          (filteredMembers.length > 0 ? (
            <MemberList>
              {filteredMembers.map((member) => (
                <MemberItem key={member.user_id}>
                  <UserAvatar
                    size="small"
                    avatarPath={member.profile?.avatar_path ?? null}
                  />
                  <MemberInfo>
                    <MemberName>{getDisplayName(member.profile)}</MemberName>
                    {canManagePermissions && member.role !== "owner" ? (
                      editingRoleUserId === member.user_id ? (
                        <RoleSelect
                          autoFocus
                          defaultValue={member.role}
                          onBlur={() => {
                            window.setTimeout(() => {
                              setEditingRoleUserId((currentUserId) =>
                                currentUserId === member.user_id
                                  ? null
                                  : currentUserId
                              );
                            }, 150);
                          }}
                          onChange={(event) => {
                            handleRoleChange(member, event.target.value);
                            setEditingRoleUserId(null);
                          }}
                        >
                          <option value="member">自己人</option>
                          <option value="admin">管理员</option>
                        </RoleSelect>
                      ) : (
                        <RoleButton
                          type="button"
                          onClick={() => setEditingRoleUserId(member.user_id)}
                        >
                          {getRoleLabel(member.role)}
                        </RoleButton>
                      )
                    ) : (
                      <MemberRole>{getRoleLabel(member.role)}</MemberRole>
                    )}
                  </MemberInfo>
                  {canManagePermissions && member.role !== "owner" && (
                    <AlertDialog
                      title="删除成员"
                      description={`确定要将「${getDisplayName(
                        member.profile
                      )}」从这个词汇集中移除吗？如果这是私有词汇集，对方将不再能够访问。`}
                      confirmText="确认删除"
                      onConfirm={() => handleRemoveMember(member)}
                      trigger={
                        <RemoveMemberButton
                          type="button"
                          aria-label={`删除${getDisplayName(member.profile)}`}
                        >
                          <Icon id="close" size="1rem" />
                        </RemoveMemberButton>
                      }
                    />
                  )}
                </MemberItem>
              ))}
            </MemberList>
          ) : (
            <SubtleText>没有匹配的成员。</SubtleText>
          ))}

        {showInvite && (
          <InviteMemberDialog
            phraseSet={phraseSet}
            onClose={() => setShowInvite(false)}
            onChanged={fetchMembers}
          />
        )}
      </Panel>
    </FormModal>
  );
}

function InviteMemberDialog({ phraseSet, onClose, onChanged }) {
  const [query, setQuery] = React.useState("");
  const [candidates, setCandidates] = React.useState([]);
  const [selectedUserId, setSelectedUserId] = React.useState(null);
  const [status, setStatus] = React.useState("free");
  const [error, setError] = React.useState("");
  const [hasSearched, setHasSearched] = React.useState(false);

  async function handleSearch(event) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setStatus("busy");
    setError("");
    setHasSearched(true);

    const { data, error } = await supabase.rpc("search_user_profiles", {
      p_query: trimmedQuery,
    });

    if (error) {
      setStatus("error");
      setError(error.message);
      return;
    }

    setCandidates(data ?? []);
    setSelectedUserId(data?.[0]?.user_id ?? null);
    setStatus("free");
  }

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

    handleSearch(event);
  }

  async function handleInvite(event) {
    event.preventDefault();
    if (!selectedUserId) {
      setStatus("error");
      setError("请选择要邀请的用户。");
      return;
    }

    setStatus("busy");
    setError("");

    const { data, error } = await supabase.rpc("invite_set_member", {
      p_set_id: phraseSet.id,
      p_user_id: selectedUserId,
    });

    if (error || data !== "ok") {
      setStatus("error");
      setError(error?.message ?? "邀请失败。");
      return;
    }

    onChanged?.();
    onClose();
  }

  return (
    <FormModal open onOpenChange={(open) => !open && onClose()} title="邀请">
      <Form onSubmit={handleInvite}>
        <IconInput
          label="搜索用户"
          icon="search"
          size="small"
          width="100%"
          value={query}
          placeholder="昵称或邮箱"
          enterKeyHint="search"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          disabled={status === "busy"}
        />

        {candidates.length > 0 && (
          <CandidateList>
            {candidates.map((candidate) => (
              <CandidateButton
                key={candidate.user_id}
                type="button"
                data-selected={selectedUserId === candidate.user_id}
                onClick={() => setSelectedUserId(candidate.user_id)}
              >
                <UserAvatar size="small" avatarPath={candidate.avatar_path} />
                <span>{getDisplayName(candidate)}</span>
              </CandidateButton>
            ))}
          </CandidateList>
        )}
        {hasSearched && status === "free" && candidates.length === 0 && (
          <SubtleText>没有找到匹配的用户。</SubtleText>
        )}

        {error && (
          <StatusArea>
            <Message type="error">{error}</Message>
          </StatusArea>
        )}

        <ButtonWrapper>
          <SubmitButton disabled={status === "busy"}>邀请</SubmitButton>
        </ButtonWrapper>
      </Form>
    </FormModal>
  );
}

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: nowrap;
  gap: 2rem;
  padding-right: 0.75rem;
`;

const PanelTitle = styled.h2`
  flex: 0 0 auto;
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary}, ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.default};
  font-weight: 400;
  white-space: nowrap;
`;

const InviteButton = styled(UnstyledButton)`
  padding: 0;
  color: var(--gray15);
  font-size: ${FONT_SIZE.small};
  text-decoration: underline;
  white-space: nowrap;

  &:active {
    color: var(--gray40);
  }

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;

const LeaveButton = styled(UnstyledButton)`
  padding: 0;
  color: var(--red15);
  font-size: ${FONT_SIZE.small};
  text-decoration: underline;
  white-space: nowrap;

  &:active {
    color: var(--red25);
  }

  &:focus-visible {
    outline: 2px solid var(--red15);
    outline-offset: 2px;
  }
`;

const SubtleText = styled.p`
  color: var(--gray40);
  font-size: ${FONT_SIZE.small};
`;

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const MemberItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.4rem;
`;

const MemberInfo = styled.div`
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

const MemberName = styled.p`
  color: var(--gray15);
  font-size: ${FONT_SIZE.small};
`;

const MemberRole = styled.p`
  color: var(--gray40);
  font-size: ${FONT_SIZE.tiny};
`;

const RoleButton = styled.button`
  width: fit-content;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--gray40);
  font-size: ${FONT_SIZE.tiny};
  text-align: left;
  cursor: pointer;

  &:hover {
    color: var(--gray15);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--gray40);
    outline-offset: 2px;
  }
`;

const RoleSelect = styled.select`
  font-size: ${FONT_SIZE.tiny};
  color: var(--gray15);
  width: fit-content;
`;

const RemoveMemberButton = styled(UnstyledButton)`
  flex: 0 0 auto;
  padding: 0.35rem;
  color: var(--gray40);

  &:hover {
    color: var(--gray15);
  }

  &:focus-visible {
    outline: 2px solid var(--gray40);
    outline-offset: 2px;
  }
`;

const CandidateList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

const CandidateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid
    ${({ "data-selected": selected }) =>
      selected ? "var(--gray15)" : "var(--gray60)"};
  background: white;
  padding: 0.25rem 0.45rem;
`;

export default PhraseSetMembersPanel;
