import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import { resolveVocabularyChangeRequest } from "../../services/vocabularySets";
import { AppMessageItem } from "../AppMessages/AppMessages";
import { useAppMessages } from "../AppMessages/AppMessagesContext";
import Message from "../Message/Message";

function MessagesPage() {
  const {
    messages,
    status,
    addMessage,
    removeLocalMessage,
    refreshMessages,
  } = useAppMessages();
  const [resolvingRequestId, setResolvingRequestId] = React.useState(null);

  React.useEffect(() => {
    refreshMessages();
  }, [refreshMessages]);

  async function handleResolveRequest(requestId, resolution) {
    if (!Number.isFinite(requestId)) {
      addMessage({
        type: "error",
        senderName: "系统",
        content: "这条申请缺少有效的 request_id，无法处理。",
      });
      return;
    }

    setResolvingRequestId(requestId);

    const { data, error } = await resolveVocabularyChangeRequest(
      requestId,
      resolution
    );

    setResolvingRequestId(null);

    if (error || data !== "ok") {
      if (error) {
        console.error("resolve_vocabulary_change_request failed", error);
      }

      const content =
        data === "already_resolved"
          ? "这条申请已经处理过了。"
          : data === "forbidden"
          ? "你没有处理这条申请的权限。"
          : data === "not_found"
          ? "没有找到这条申请。"
          : "处理申请失败，请稍后重试。";

      addMessage({
        type: "error",
        senderName: "系统",
        content,
      });
      return;
    }

    addMessage({
      type: "success",
      senderName: "系统",
      content: resolution === "approved" ? "已同意申请。" : "已拒绝申请。",
    });
    refreshMessages();
  }

  return (
    <Main>
      <HeaderArea>
        <Title>消息</Title>
      </HeaderArea>

      {status === "error" && (
        <Message type="error">消息加载失败，请稍后重试。</Message>
      )}

      {messages.length === 0 ? (
        <EmptyState>现在还没有消息。</EmptyState>
      ) : (
        <MessageList>
          {messages.map((message) => (
            <AppMessageItem
              key={`${message.isLocal ? "local" : "remote"}-${message.id}`}
              message={message}
              resolvingRequestId={resolvingRequestId}
              onDeleteLocalMessage={removeLocalMessage}
              onResolveRequest={handleResolveRequest}
            />
          ))}
        </MessageList>
      )}
    </Main>
  );
}

const Main = styled.main`
  width: min(100%, 800px);
  min-height: 80dvh;
  padding: 2rem 1.5rem;
`;

const HeaderArea = styled.header`
  margin-bottom: 1rem;
`;

const Title = styled.h1`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.giant};
  line-height: 1.35;
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const EmptyState = styled.p`
  border: 1px solid var(--gray60);
  border-radius: 8px;
  background: white;
  color: var(--gray40);
  padding: 1rem;
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.default};
`;

export default MessagesPage;
