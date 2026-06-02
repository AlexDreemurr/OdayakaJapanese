/**
 * GrammarSetActions
 * 语法集的增删改、加入对话框，对应 PhraseSetActions。
 */

import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import { getUser } from "../../services/auth";
import {
  createGrammarSet,
  joinGrammarSet,
  deleteGrammarSet,
  updateGrammarSet,
} from "../../services/grammarSets";
import BusyMessage from "../BusyMessage/BusyMessage";
import AlertDialog from "../AlertDialog/AlertDialog";
import Icon from "../Icon/Icon";
import Message from "../Message/Message";
import Select from "../Select/Select";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import {
  ButtonWrapper,
  CompactRow,
  Fields,
  FormModal,
  Form,
  Input,
  Label,
  Row,
  StatusArea,
  SubmitButton,
  Textarea,
  TwoColumnRow,
} from "../FormModal/FormModal";

// ── 添加语法集 ────────────────────────────────────────────────────────────────
function AddGrammarSetDialog({ onChanged }) {
  const nameInputId = React.useId();
  const descriptionInputId = React.useId();
  const creatorInputId = React.useId();
  const statusSelectId = React.useId();
  const privacySelectId = React.useId();

  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creator, setCreator] = React.useState("");
  const [openStatus, setOpenStatus] = React.useState("open");
  const [privacy, setPrivacy] = React.useState("public");
  const [status, setStatus] = React.useState("free");
  const [errorMsg, setErrorMsg] = React.useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) {
      setStatus("error");
      setErrorMsg("语法集名称不能为空。");
      return;
    }
    setStatus("busy");
    setErrorMsg("");

    const { data: { user } } = await getUser();
    if (!user) {
      setStatus("error");
      setErrorMsg("请先登录后再创建语法集。");
      return;
    }

    const { error } = await createGrammarSet({
      name: name.trim(),
      description: description.trim() || null,
      status: openStatus,
      creator: creator.trim() || null,
      privacy,
      userId: user.id,
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setName(""); setDescription(""); setCreator("");
    setOpenStatus("open"); setPrivacy("public");
    setStatus("success");
    onChanged?.();
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <TriggerButton type="button" aria-label="添加新的语法集">
          <Icon id="folderPlus" size="1.3rem" color="black" />
        </TriggerButton>
      }
      title="添加语法集"
      titleHint="grammar_sets"
    >
      <Form onSubmit={handleSubmit}>
        <StatusArea>
          {status === "busy" && <BusyMessage>请稍等</BusyMessage>}
          {status === "error" && <Message fontSize={FONT_SIZE.default} type="error">发生错误: {errorMsg}</Message>}
          {status === "success" && <Message fontSize={FONT_SIZE.default} type="success">添加成功。</Message>}
        </StatusArea>
        <Fields>
          <Row>
            <Label htmlFor={nameInputId}>名称</Label>
            <Input id={nameInputId} value={name} onChange={(e) => setName(e.target.value)} required disabled={status === "busy"} />
          </Row>
          <Row>
            <Label htmlFor={descriptionInputId}>描述</Label>
            <Textarea id={descriptionInputId} value={description} onChange={(e) => setDescription(e.target.value)} disabled={status === "busy"} />
          </Row>
          <TwoColumnRow>
            <CompactRow>
              <Label htmlFor={privacySelectId}>权限</Label>
              <Select id={privacySelectId} value={privacy} onChange={(e) => setPrivacy(e.target.value)} disabled={status === "busy"} fontSize={FONT_SIZE.small}>
                <option value="public">public</option>
                <option value="private">private</option>
              </Select>
            </CompactRow>
            <CompactRow>
              <Label htmlFor={statusSelectId}>状态</Label>
              <Select id={statusSelectId} value={openStatus} onChange={(e) => setOpenStatus(e.target.value)} disabled={status === "busy"} fontSize={FONT_SIZE.small}>
                <option value="open">open</option>
                <option value="close">close</option>
              </Select>
            </CompactRow>
          </TwoColumnRow>
          <Row>
            <Label htmlFor={creatorInputId}>创建者</Label>
            <Input id={creatorInputId} value={creator} onChange={(e) => setCreator(e.target.value)} disabled={status === "busy"} />
          </Row>
        </Fields>
        <ButtonWrapper>
          <SubmitButton disabled={status === "busy"}>添加</SubmitButton>
        </ButtonWrapper>
      </Form>
    </FormModal>
  );
}

// ── 加入语法集 ────────────────────────────────────────────────────────────────
function JoinGrammarSetDialog({ grammarSet, trigger, onChanged, onClose }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [status, setStatus] = React.useState("free");
  const [message, setMessage] = React.useState("");
  const [messageType, setMessageType] = React.useState("info");

  function handleOpenChange(nextIsOpen) {
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) onClose?.();
    if (nextIsOpen) { setStatus("free"); setMessage(""); setMessageType("info"); }
  }

  React.useEffect(() => {
    if (grammarSet) {
      setIsOpen(true);
      setStatus("free"); setMessage(""); setMessageType("info");
    }
  }, [grammarSet]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!grammarSet?.id) {
      setStatus("error"); setMessageType("error"); setMessage("没有选择语法集。");
      return;
    }
    setStatus("busy"); setMessage(""); setMessageType("info");

    const { data, error } = await joinGrammarSet(grammarSet.id);

    if (error) {
      setStatus("error"); setMessageType("error"); setMessage("请先登录或检查网络后重试。");
      return;
    }

    if (data === "ok") {
      setStatus("success"); setMessageType("success"); setMessage("加入成功");
      onChanged?.();
      return;
    }

    setStatus("error"); setMessageType("error");
    if (data === "private_requires_invite") setMessage("私有语法集需要管理员邀请。");
    else if (data === "not_authenticated") setMessage("请先登录后再加入语法集。");
    else if (data === "not_found") setMessage("未找到该语法集。");
    else setMessage("加入失败，请稍后重试。");
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      trigger={trigger ?? (
        <TriggerButton type="button" aria-label="加入公开语法集">
          <Icon id="public" size="1.3rem" color="black" />
        </TriggerButton>
      )}
      title="加入语法集"
      titleHint="grammar_set_members"
    >
      <Form onSubmit={handleSubmit}>
        <StatusArea>
          {status === "busy" && <BusyMessage>加入中</BusyMessage>}
          {(status === "error" || status === "success") && (
            <Message fontSize={FONT_SIZE.default} type={messageType}>{message}</Message>
          )}
        </StatusArea>
        <PermissionMessage>加入公开语法集「{grammarSet?.name ?? "---"}」？</PermissionMessage>
        <ButtonWrapper>
          <SubmitButton disabled={status === "busy"}>加入</SubmitButton>
        </ButtonWrapper>
      </Form>
    </FormModal>
  );
}

// ── 删除语法集 ────────────────────────────────────────────────────────────────
function DeleteGrammarSetDialog({ selectedGrammarSets, currentUserId, onChanged }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [status, setStatus] = React.useState("free");
  const [errorMsg, setErrorMsg] = React.useState("");

  const hasSelection = selectedGrammarSets.length > 0;
  const canDeleteSelection =
    hasSelection &&
    selectedGrammarSets.every(
      (gs) => (gs.owner_id ?? gs.user_id) && (gs.owner_id ?? gs.user_id) === currentUserId
    );

  function handleOpenChange(nextIsOpen) {
    setIsOpen(nextIsOpen);
    if (nextIsOpen) { setStatus("free"); setErrorMsg(""); }
  }

  async function handleDelete() {
    if (!hasSelection) { setStatus("error"); setErrorMsg("请先选择要删除的语法集。"); return; }
    if (!canDeleteSelection) { setStatus("error"); setErrorMsg("只有创建者才能删除语法集。"); return; }

    setStatus("busy"); setErrorMsg("");

    for (const gs of selectedGrammarSets) {
      const { data, error } = await deleteGrammarSet(gs.id);
      if (error) { setStatus("error"); setErrorMsg(error.message); return; }
      if (data === "not_found") { setStatus("error"); setErrorMsg("没有删除权限或语法集不存在。"); return; }
      if (data !== "ok") { setStatus("error"); setErrorMsg("删除失败，请稍后重试。"); return; }
    }

    setStatus("success");
    onChanged?.();
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      trigger={
        <TriggerButton type="button" aria-label="删除已选语法集">
          <Icon id="remove" size="1.3rem" color="black" />
        </TriggerButton>
      }
      title="删除语法集"
      titleHint={`${selectedGrammarSets.length} 个已选`}
    >
      <Form>
        <StatusArea>
          {status === "busy" && <BusyMessage>删除中</BusyMessage>}
          {status === "error" && <Message fontSize={FONT_SIZE.default} type="error">发生错误: {errorMsg}</Message>}
          {status === "success" && <Message fontSize={FONT_SIZE.default} type="success">删除成功。</Message>}
        </StatusArea>
        {hasSelection && !canDeleteSelection ? (
          <PermissionMessage>只有语法集创建者才能删除语法集。</PermissionMessage>
        ) : (
          <>
            <Fields>
              <SelectedList>
                {hasSelection
                  ? selectedGrammarSets.map((gs) => <SelectedItem key={gs.id}>{gs.name}</SelectedItem>)
                  : "还没有选择语法集。"}
              </SelectedList>
            </Fields>
            <ButtonWrapper>
              <AlertDialog
                title="删除语法集"
                description={`确定要删除已选择的 ${selectedGrammarSets.length} 个语法集吗？这个操作不能撤销。`}
                confirmText="确认删除"
                confirmDisabled={status === "busy" || !hasSelection}
                onConfirm={handleDelete}
                trigger={
                  <SubmitButton nativeType="button" disabled={status === "busy" || !hasSelection}>删除</SubmitButton>
                }
              />
            </ButtonWrapper>
          </>
        )}
      </Form>
    </FormModal>
  );
}

// ── 编辑语法集 ────────────────────────────────────────────────────────────────
function EditGrammarSetDialog({ selectedGrammarSet, currentUserId, onChanged }) {
  const nameInputId = React.useId();
  const descriptionInputId = React.useId();
  const creatorInputId = React.useId();
  const statusSelectId = React.useId();
  const privacySelectId = React.useId();

  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [creator, setCreator] = React.useState("");
  const [openStatus, setOpenStatus] = React.useState("open");
  const [privacy, setPrivacy] = React.useState("public");
  const [status, setStatus] = React.useState("free");
  const [errorMsg, setErrorMsg] = React.useState("");

  const canEdit =
    !!(selectedGrammarSet?.owner_id ?? selectedGrammarSet?.user_id) &&
    (selectedGrammarSet?.owner_id ?? selectedGrammarSet?.user_id) === currentUserId;

  function handleOpenChange(nextIsOpen) {
    setIsOpen(nextIsOpen);
    if (nextIsOpen) {
      setName(selectedGrammarSet?.name ?? "");
      setDescription(selectedGrammarSet?.description ?? "");
      setCreator(selectedGrammarSet?.creator ?? "");
      setOpenStatus(selectedGrammarSet?.status ?? "open");
      setPrivacy(selectedGrammarSet?.privacy ?? "public");
      setStatus("free"); setErrorMsg("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedGrammarSet) { setStatus("error"); setErrorMsg("请先选择要编辑的语法集。"); return; }
    if (!canEdit) { setStatus("error"); setErrorMsg("只有创建者才能编辑语法集。"); return; }

    const changes = {};
    if (name.trim() !== (selectedGrammarSet.name ?? "")) changes.name = name.trim();
    if (description.trim() !== (selectedGrammarSet.description ?? "")) changes.description = description.trim();
    if (creator.trim() !== (selectedGrammarSet.creator ?? "")) changes.creator = creator.trim();
    if (openStatus !== (selectedGrammarSet.status ?? "open")) changes.status = openStatus;
    if (privacy !== (selectedGrammarSet.privacy ?? "public")) changes.privacy = privacy;

    if (Object.keys(changes).length === 0) {
      setStatus("error"); setErrorMsg("没有需要修改的内容。"); return;
    }

    setStatus("busy"); setErrorMsg("");
    const { error } = await updateGrammarSet(selectedGrammarSet.id, changes, currentUserId);

    if (error) { setStatus("error"); setErrorMsg(error.message); return; }

    setStatus("success");
    onChanged?.();
  }

  return (
    <FormModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      trigger={
        <TriggerButton type="button" aria-label="编辑语法集">
          <Icon id="edit" size="1.3rem" color="black" />
        </TriggerButton>
      }
      title="编辑语法集"
      titleHint={selectedGrammarSet?.name ?? "未选择"}
    >
      <Form onSubmit={handleSubmit}>
        <StatusArea>
          {status === "busy" && <BusyMessage>修改中</BusyMessage>}
          {status === "error" && <Message fontSize={FONT_SIZE.default} type="error">发生错误: {errorMsg}</Message>}
          {status === "success" && <Message fontSize={FONT_SIZE.default} type="success">修改成功。</Message>}
        </StatusArea>
        {selectedGrammarSet && !canEdit ? (
          <PermissionMessage>只有语法集创建者才能编辑语法集。</PermissionMessage>
        ) : (
          <>
            <Fields>
              <Row>
                <Label htmlFor={nameInputId}>名称</Label>
                <Input id={nameInputId} value={name} onChange={(e) => setName(e.target.value)} disabled={status === "busy"} />
              </Row>
              <Row>
                <Label htmlFor={descriptionInputId}>描述</Label>
                <Textarea id={descriptionInputId} value={description} onChange={(e) => setDescription(e.target.value)} disabled={status === "busy"} />
              </Row>
              <TwoColumnRow>
                <CompactRow>
                  <Label htmlFor={privacySelectId}>权限</Label>
                  <Select id={privacySelectId} value={privacy} onChange={(e) => setPrivacy(e.target.value)} disabled={status === "busy"} fontSize={FONT_SIZE.small}>
                    <option value="public">public</option>
                    <option value="private">private</option>
                  </Select>
                </CompactRow>
                <CompactRow>
                  <Label htmlFor={statusSelectId}>状态</Label>
                  <Select id={statusSelectId} value={openStatus} onChange={(e) => setOpenStatus(e.target.value)} disabled={status === "busy"} fontSize={FONT_SIZE.small}>
                    <option value="open">open</option>
                    <option value="close">close</option>
                  </Select>
                </CompactRow>
              </TwoColumnRow>
              <Row>
                <Label htmlFor={creatorInputId}>作者</Label>
                <Input id={creatorInputId} value={creator} onChange={(e) => setCreator(e.target.value)} disabled={status === "busy"} />
              </Row>
            </Fields>
            <ButtonWrapper>
              <SubmitButton disabled={status === "busy"}>保存</SubmitButton>
            </ButtonWrapper>
          </>
        )}
      </Form>
    </FormModal>
  );
}

/* ── shared styles ── */
const TriggerButton = styled(UnstyledButton)`padding: 0.8rem; color: black;`;
const SelectedList = styled.div`
  display: flex; flex-direction: column; gap: 0.25rem;
  max-height: 8rem; overflow: auto; color: var(--gray40);
  font-family: ${FONT_FAMILY.chinese_primary}, ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.default};
`;
const SelectedItem = styled.p`color: var(--gray15);`;
const PermissionMessage = styled.p`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary}, ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.default};
  line-height: 1.5; text-align: center;
`;

export { AddGrammarSetDialog, JoinGrammarSetDialog, DeleteGrammarSetDialog, EditGrammarSetDialog };
