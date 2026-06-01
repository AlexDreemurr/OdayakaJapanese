import React from "react";
import styled, { keyframes } from "styled-components";
import * as Toast from "@radix-ui/react-toast";
import * as Collapsible from "@radix-ui/react-collapsible";
import { getUser, onAuthStateChange } from "../../services/auth";
import {
  getAppMessages,
  getVocabularyChangeRequests,
  getVocabularySetsByIds,
} from "../../services/vocabularySets";
import { getVocabsByIds } from "../../services/words";
import { FONT_FAMILY, FONT_SIZE, QUERIES } from "../../constants";
import Icon from "../Icon/Icon";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import UserAvatar from "../UserAvatar/UserAvatar";
import { MessagesContext } from "./AppMessagesContext";

const LOCAL_MESSAGES_KEY = "appMessages";
const TOAST_DURATION = 8000;

const TYPE_STYLE = {
  info: {
    background: "hsl(0deg 0% 100%)",
    color: "var(--gray15)",
    border: "var(--gray60)",
    accent: "var(--gray25)",
  },
  success: {
    background: "var(--green85)",
    color: "var(--green15)",
    border: "var(--green75)",
    accent: "var(--green15)",
  },
  error: {
    background: "var(--red85)",
    color: "var(--red15)",
    border: "var(--red75)",
    accent: "var(--red15)",
  },
};

const REQUEST_FIELDS = [
  ["word", "单词"],
  ["reading", "读音"],
  ["pitch", "音调"],
  ["meaning", "释义"],
  ["contributor_name", "贡献者"],
];

function getTypeStyle(type) {
  return TYPE_STYLE[type] ?? TYPE_STYLE.info;
}

function normalizeMessage(message) {
  return {
    id: message.id ?? `local-${Date.now()}`,
    type: message.type ?? "info",
    senderName: message.senderName ?? message.sender_name ?? "系统",
    senderAvatarPath: message.senderAvatarPath ?? message.sender_avatar_path,
    content: message.content ?? "",
    metadata: message.metadata ?? {},
    createdAt:
      message.createdAt ?? message.created_at ?? new Date().toISOString(),
    isLocal: message.isLocal ?? false,
  };
}

function sortMessages(messages) {
  return [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function readLocalMessages() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_MESSAGES_KEY));
    return Array.isArray(parsed) ? parsed.map(normalizeMessage) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(messages) {
  window.localStorage.setItem(
    LOCAL_MESSAGES_KEY,
    JSON.stringify(messages.slice(0, 80))
  );
}

function getRequestId(metadata) {
  const requestId = Number(metadata?.request?.id ?? metadata?.request_id);
  return Number.isFinite(requestId) ? requestId : null;
}

function hasSnapshotValue(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return false;
  }

  return REQUEST_FIELDS.some(([key]) => snapshot[key] !== undefined);
}

async function enrichVocabularyRequestMessages(messages) {
  const requestIds = [
    ...new Set(
      messages
        .filter(
          (message) => message.metadata?.kind === "vocabulary_change_request"
        )
        .map((message) => getRequestId(message.metadata))
        .filter((requestId) => requestId !== null)
    ),
  ];

  if (requestIds.length === 0) {
    return messages;
  }

  const { data: requestRows, error: requestError } =
    await getVocabularyChangeRequests(requestIds);

  if (requestError) {
    console.warn("Failed to enrich vocabulary request messages.", requestError);
    return messages;
  }

  const requestsById = new Map(
    (requestRows ?? []).map((request) => [request.id, request])
  );
  const vocabularyIds = [
    ...new Set(
      (requestRows ?? [])
        .map((request) => request.vocabulary_id)
        .filter(Boolean)
    ),
  ];
  const setIds = [
    ...new Set((requestRows ?? []).map((request) => request.set_id).filter(Boolean)),
  ];

  const [vocabularyResult, setResult] = await Promise.all([
    vocabularyIds.length > 0
      ? getVocabsByIds(vocabularyIds)
      : Promise.resolve({ data: [], error: null }),
    setIds.length > 0
      ? getVocabularySetsByIds(setIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (vocabularyResult.error) {
    console.warn("Failed to load vocabulary request words.", vocabularyResult.error);
  }

  if (setResult.error) {
    console.warn("Failed to load vocabulary request sets.", setResult.error);
  }

  const vocabularyById = new Map(
    (vocabularyResult.data ?? []).map((vocabulary) => [
      vocabulary.id,
      vocabulary,
    ])
  );
  const setById = new Map((setResult.data ?? []).map((set) => [set.id, set]));

  return messages.map((message) => {
    const requestId = getRequestId(message.metadata);
    const request = requestsById.get(requestId);

    if (!request) {
      return message;
    }

    const vocabulary = vocabularyById.get(request.vocabulary_id) ?? {};
    const set = setById.get(request.set_id) ?? {};
    const messageOriginal = message.metadata.original ?? {};
    const requestOriginal = request.original_data ?? {};
    const originalSnapshot = hasSnapshotValue(messageOriginal)
      ? messageOriginal
      : hasSnapshotValue(requestOriginal)
      ? requestOriginal
      : {};
    const hasOriginalSnapshot = hasSnapshotValue(originalSnapshot);

    return {
      ...message,
      metadata: {
        ...message.metadata,
        request_id: request.id,
        request: {
          ...(message.metadata.request ?? {}),
          id: request.id,
          action: request.action ?? message.metadata.request?.action,
          status: request.status ?? message.metadata.request?.status,
        },
        vocabulary_id: request.vocabulary_id,
        set_id: request.set_id,
        vocabulary: {
          ...(message.metadata.vocabulary ?? {}),
          id: request.vocabulary_id,
          set_id: request.set_id,
          set_name:
            set.name ??
            message.metadata.vocabulary?.set_name ??
            originalSnapshot.set_name,
        },
        set_name:
          set.name ??
          message.metadata.vocabulary?.set_name ??
          originalSnapshot.set_name ??
          message.metadata.set_name ??
          "未命名词汇集",
        action:
          request.action ??
          message.metadata.request?.action ??
          message.metadata.action,
        status: request.status ?? message.metadata.status ?? "pending",
        original: hasOriginalSnapshot
          ? {
              ...originalSnapshot,
              set_name:
                originalSnapshot.set_name ??
                set.name ??
                message.metadata.vocabulary?.set_name,
            }
          : {
              set_name:
                set.name ??
                message.metadata.vocabulary?.set_name ??
                message.metadata.set_name,
              snapshot_missing: true,
            },
        current: {
          set_name: set.name,
          word: vocabulary.word,
          reading: vocabulary.reading,
          pitch: vocabulary.pitch,
          meaning: vocabulary.meaning,
          contributor_name: vocabulary.contributor_name,
        },
        changes: request.changes ?? message.metadata.changes ?? {},
      },
    };
  });
}

export function AppMessagesProvider({ children }) {
  const [localMessages, setLocalMessages] = React.useState(readLocalMessages);
  const [remoteMessages, setRemoteMessages] = React.useState([]);
  const [toasts, setToasts] = React.useState([]);
  const [status, setStatus] = React.useState("idle");

  const refreshMessages = React.useCallback(async () => {
    const {
      data: { user },
    } = await getUser();

    if (!user) {
      setRemoteMessages([]);
      setStatus("idle");
      return;
    }

    setStatus("loading");
    const { data, error } = await getAppMessages(user.id);

    if (error) {
      if (!/app_messages|schema cache|PGRST205/i.test(error.message ?? "")) {
        console.warn("Failed to load app messages.", error);
      }
      setStatus("error");
      return;
    }

    const normalizedMessages = (data ?? []).map(normalizeMessage);
    setRemoteMessages(await enrichVocabularyRequestMessages(normalizedMessages));
    setStatus("idle");
  }, []);

  React.useEffect(() => {
    Promise.resolve().then(refreshMessages);

    const {
      data: { subscription },
    } = onAuthStateChange(() => {
      refreshMessages();
    });

    return () => subscription.unsubscribe();
  }, [refreshMessages]);

  const removeToast = React.useCallback((toastId) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.toastId !== toastId)
    );
  }, []);

  const addMessage = React.useCallback((message) => {
    const nextMessage = normalizeMessage({
      ...message,
      id: message.id ?? `local-${Date.now()}-${Math.random()}`,
      isLocal: true,
    });
    const toastMessage = {
      ...nextMessage,
      toastId: `toast-${Date.now()}-${Math.random()}`,
    };

    setLocalMessages((currentMessages) => {
      const nextMessages = sortMessages([nextMessage, ...currentMessages]);
      saveLocalMessages(nextMessages);
      return nextMessages;
    });
    setToasts((currentToasts) => [...currentToasts, toastMessage]);

    return nextMessage;
  }, []);

  const removeLocalMessage = React.useCallback((messageId) => {
    setLocalMessages((currentMessages) => {
      const nextMessages = currentMessages.filter(
        (message) => message.id !== messageId
      );
      saveLocalMessages(nextMessages);
      return nextMessages;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      messages: sortMessages([...remoteMessages, ...localMessages]),
      status,
      addMessage,
      removeLocalMessage,
      refreshMessages,
    }),
    [
      addMessage,
      localMessages,
      refreshMessages,
      remoteMessages,
      removeLocalMessage,
      status,
    ]
  );

  return (
    <MessagesContext.Provider value={value}>
      <Toast.Provider swipeDirection="right" duration={TOAST_DURATION}>
        {children}
        <ToastViewport>
          {toasts.map((toast) => (
            <AppToast
              key={toast.toastId}
              message={toast}
              onClose={() => removeToast(toast.toastId)}
            />
          ))}
        </ToastViewport>
      </Toast.Provider>
    </MessagesContext.Provider>
  );
}

export function AppMessageItem({
  message,
  compact = false,
  onDeleteLocalMessage,
  onResolveRequest,
  resolvingRequestId,
}) {
  const tone = getTypeStyle(message.type);
  const [isOpen, setIsOpen] = React.useState(false);
  const requestDetails =
    message.metadata?.kind === "vocabulary_change_request"
      ? getVocabularyRequestDetails(message.metadata)
      : null;
  const canExpand = !compact && Boolean(requestDetails);
  const canDeleteLocal = !compact && message.isLocal;

  return (
    <MessageCard
      $tone={tone}
      $compact={compact}
      $hasLocalDelete={canDeleteLocal}
    >
      {canDeleteLocal && (
        <LocalDeleteButton
          type="button"
          aria-label="删除本地消息"
          onClick={() => onDeleteLocalMessage?.(message.id)}
        >
          <Icon id="close" size="0.95rem" color="currentColor" />
        </LocalDeleteButton>
      )}
      <AvatarSlot>
        <UserAvatar
          size="small"
          avatarPath={message.senderAvatarPath}
          alt={`${message.senderName} avatar`}
        />
      </AvatarSlot>
      <MessageBody>
        <MessageHeader>
          <SenderName>{message.senderName}</SenderName>
          <MessageTime dateTime={message.createdAt}>
            {formatMessageTime(message.createdAt)}
          </MessageTime>
        </MessageHeader>
        <ContentText>{message.content}</ContentText>
        {canExpand && (
          <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
            <Collapsible.Trigger asChild>
              <ExpandButton type="button" aria-label="展开消息详情">
                <Icon
                  id="chevron-down"
                  size="1rem"
                  color="currentColor"
                  data-open={isOpen}
                />
                <span>{isOpen ? "收起详情" : "查看变更详情"}</span>
              </ExpandButton>
            </Collapsible.Trigger>
            <CollapsibleContent>
              <DetailPanel>
                <StatusLine>
                  <StatusBadge $status={requestDetails.status}>
                    {getStatusText(requestDetails.status)}
                  </StatusBadge>
                  <DetailMuted>
                    {requestDetails.action === "delete" ? "删除申请" : "修改申请"}
                  </DetailMuted>
                </StatusLine>
                <DetailGrid>
                  <DetailLabel>词汇集</DetailLabel>
                  <DetailValue>{requestDetails.setName}</DetailValue>
                  <DetailLabel>原单词</DetailLabel>
                  <DetailValue>{requestDetails.original.word}</DetailValue>
                  {requestDetails.action === "delete" ? (
                    <>
                      <DetailLabel>处理内容</DetailLabel>
                      <DetailValue>删除这个词条</DetailValue>
                    </>
                  ) : (
                    requestDetails.changedFields.map((field) => (
                      <React.Fragment key={field.key}>
                        <DetailLabel>{field.label}</DetailLabel>
                        <DetailValue>
                          <BeforeValue>{field.before}</BeforeValue>
                          <ArrowText>→</ArrowText>
                          <AfterValue>{field.after}</AfterValue>
                        </DetailValue>
                      </React.Fragment>
                    ))
                  )}
                </DetailGrid>
                {requestDetails.status === "pending" && (
                  <ReviewActions>
                    <ApproveButton
                      type="button"
                      disabled={resolvingRequestId === requestDetails.requestId}
                      onClick={() =>
                        onResolveRequest?.(requestDetails.requestId, "approved")
                      }
                    >
                      同意
                    </ApproveButton>
                    <RejectButton
                      type="button"
                      disabled={resolvingRequestId === requestDetails.requestId}
                      onClick={() =>
                        onResolveRequest?.(requestDetails.requestId, "rejected")
                      }
                    >
                      拒绝
                    </RejectButton>
                  </ReviewActions>
                )}
              </DetailPanel>
            </CollapsibleContent>
          </Collapsible.Root>
        )}
      </MessageBody>
    </MessageCard>
  );
}

function getVocabularyRequestDetails(metadata) {
  const original = metadata.original ?? {};
  const changes = metadata.changes ?? {};
  const action = metadata.request?.action ?? metadata.action ?? "update";
  const changedFields = REQUEST_FIELDS.filter(([key]) =>
    Object.prototype.hasOwnProperty.call(changes, key)
  ).map(([key, label]) => ({
    key,
    label,
    before: original.snapshot_missing
      ? "缺少原始快照"
      : formatDetailValue(original[key]),
    after: formatDetailValue(changes[key]),
  }));

  return {
    requestId: getRequestId(metadata),
    setName:
      metadata.vocabulary?.set_name ??
      metadata.set_name ??
      original.set_name ??
      "未命名词汇集",
    action,
    status: metadata.status ?? metadata.request?.status ?? "pending",
    original: {
      word: original.snapshot_missing
        ? "缺少原始快照"
        : formatDetailValue(original.word),
    },
    changedFields:
      changedFields.length > 0
        ? changedFields
        : [{ key: "none", label: "变更", before: "无", after: "无" }],
  };
}

function formatDetailValue(value) {
  if (value === null || value === undefined || value === "") {
    return "未填写";
  }

  return String(value);
}

function getStatusText(status) {
  if (status === "approved") return "已同意";
  if (status === "rejected") return "已拒绝";
  return "待处理";
}

function AppToast({ message, onClose }) {
  return (
    <ToastRoot
      forceMount
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      $tone={getTypeStyle(message.type)}
    >
      <AppMessageItem message={message} compact />
      <ToastClose aria-label="关闭消息">
        <Icon id="close" size="1rem" color="currentColor" />
      </ToastClose>
    </ToastRoot>
  );
}

function formatMessageTime(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const ToastViewport = styled(Toast.Viewport)`
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 200;
  display: flex;
  width: min(calc(100vw - 2rem), 23rem);
  max-height: min(70vh, 36rem);
  flex-direction: column-reverse;
  gap: 0.55rem;
  padding: 0;
  margin: 0;
  list-style: none;
  pointer-events: none;

  @media ${QUERIES.tabletAndUp} {
    right: 1.25rem;
    bottom: 1.25rem;
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(1rem) translateY(0.35rem);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
`;

const ToastRoot = styled(Toast.Root)`
  position: relative;
  pointer-events: auto;
  border: 1px solid ${(p) => p.$tone.border};
  border-left: 5px solid ${(p) => p.$tone.accent};
  border-radius: 8px;
  background: ${(p) => p.$tone.background};
  color: ${(p) => p.$tone.color};
  box-shadow: 0 14px 30px hsl(0deg 0% 0% / 0.18);
  animation: ${slideIn} 180ms ease-out;

  &[data-swipe="move"] {
    transform: translateX(var(--radix-toast-swipe-move-x));
  }

  &[data-swipe="end"] {
    transform: translateX(var(--radix-toast-swipe-end-x));
    transition: transform 160ms ease-out;
  }
`;

const ToastClose = styled(Toast.Close).attrs({ type: "button" })`
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  display: grid;
  place-items: center;
  width: 1.45rem;
  height: 1.45rem;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  padding: 0;
  cursor: pointer;

  &:hover {
    background: hsl(0deg 0% 0% / 0.08);
  }

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

const MessageCard = styled.article`
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${(p) => (p.$compact ? "0.65rem" : "0.85rem")};
  width: 100%;
  padding: ${(p) =>
    p.$compact
      ? "0.7rem 2.35rem 0.7rem 0.75rem"
      : p.$hasLocalDelete
      ? "1rem 2.65rem 1rem 1rem"
      : "1rem"};
  border: ${(p) => (p.$compact ? "0" : `1px solid ${p.$tone.border}`)};
  border-left: ${(p) => (p.$compact ? "0" : `5px solid ${p.$tone.accent}`)};
  border-radius: 8px;
  background: ${(p) => (p.$compact ? "transparent" : p.$tone.background)};
  color: ${(p) => p.$tone.color};
`;

const LocalDeleteButton = styled(UnstyledButton)`
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  display: grid;
  place-items: center;
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 4px;
  color: var(--gray40);

  &:hover {
    background: hsl(0deg 0% 0% / 0.08);
    color: var(--gray15);
  }

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;

const AvatarSlot = styled.div`
  padding-top: 0.12rem;
`;

const MessageBody = styled.div`
  min-width: 0;
`;

const MessageHeader = styled.div`
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
`;

const SenderName = styled.p`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: inherit;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
  font-weight: 700;
  line-height: 1.35;
`;

const MessageTime = styled.time`
  flex: 0 0 auto;
  color: var(--gray40);
  font-family: ${FONT_FAMILY.english_primary};
  font-size: ${FONT_SIZE.tiny};
  line-height: 1.35;
`;

const ContentText = styled.p`
  margin-top: 0.2rem;
  color: inherit;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
  line-height: 1.55;
  overflow-wrap: anywhere;
`;

const ExpandButton = styled(UnstyledButton)`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.45rem;
  border: 1px solid var(--gray60);
  border-radius: 999px;
  background: hsl(0deg 0% 100% / 0.7);
  color: var(--gray25);
  padding: 0.12rem 0.55rem 0.12rem 0.35rem;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.tiny};
  line-height: 1.4;

  & * {
    font-size: inherit;
  }

  & svg {
    transition: transform 160ms ease;
  }

  & svg[data-open="true"] {
    transform: rotate(180deg);
  }

  &:hover {
    border-color: var(--gray25);
    color: var(--gray15);
  }

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;

const CollapsibleContent = styled(Collapsible.Content)`
  overflow: hidden;

  &[data-state="open"] {
    animation: detail-open 160ms ease-out;
  }

  @keyframes detail-open {
    from {
      opacity: 0;
      transform: translateY(-0.25rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const DetailPanel = styled.div`
  margin-top: 0.7rem;
  border-top: 1px solid var(--gray75);
  padding-top: 0.7rem;
`;

const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
`;

const StatusBadge = styled.span`
  border-radius: 999px;
  background: ${(p) =>
    p.$status === "approved"
      ? "var(--green85)"
      : p.$status === "rejected"
      ? "var(--red85)"
      : "var(--gold85)"};
  color: ${(p) =>
    p.$status === "approved"
      ? "var(--green15)"
      : p.$status === "rejected"
      ? "var(--red15)"
      : "var(--gold15)"};
  padding: 0.08rem 0.45rem;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.tiny};
  line-height: 1.4;
`;

const DetailMuted = styled.span`
  color: var(--gray40);
  font-size: ${FONT_SIZE.tiny};
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  column-gap: 0.65rem;
  row-gap: 0.35rem;
`;

const DetailLabel = styled.div`
  color: var(--gray40);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.tiny};
`;

const DetailValue = styled.div`
  min-width: 0;
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.tiny};
  overflow-wrap: anywhere;

  & * {
    font-size: inherit;
  }
`;

const BeforeValue = styled.span`
  color: var(--red15);
`;

const ArrowText = styled.span`
  color: var(--gray40);
  margin: 0 0.35rem;
`;

const AfterValue = styled.span`
  color: var(--green15);
  font-weight: 700;
`;

const ReviewActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.8rem;
`;

const ReviewButton = styled.button`
  border: 1px solid currentColor;
  border-radius: 6px;
  padding: 0.25rem 0.75rem;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.tiny};
  cursor: pointer;

  &:disabled {
    cursor: wait;
    opacity: 0.6;
  }

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;

const ApproveButton = styled(ReviewButton)`
  background: var(--green85);
  color: var(--green15);
`;

const RejectButton = styled(ReviewButton)`
  background: var(--red85);
  color: var(--red15);
`;
