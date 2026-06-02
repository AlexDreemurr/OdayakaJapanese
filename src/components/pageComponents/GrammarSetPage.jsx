/**
 * GrammarSetPage
 * 语法集列表页（/grammarSetList）与详情页（/grammarSet/:id），
 * 对应 PhraseSetPage。
 */

import React from "react";
import styled from "styled-components";
import { HashLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import GrammarSet from "../GrammarSet/GrammarSet";
import GrammarSetList from "../GrammarSetList/GrammarSetList";
import { JoinGrammarSetDialog } from "../GrammarSetActions/GrammarSetActions";
import Icon from "../Icon/Icon";
import IconInput from "../IconInput/IconInput";
import Message from "../Message/Message";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import useGrammarSets from "../../hooks/useGrammarSets";

function GrammarSetPage() {
  const { grammarSetId } = useParams();

  if (grammarSetId) {
    return <GrammarSet grammarSetId={grammarSetId} />;
  }

  return <GrammarSetIndexPage />;
}

function GrammarSetIndexPage() {
  const [viewMode, setViewMode] = React.useState("joined");
  const [draftSearch, setDraftSearch] = React.useState("");
  const [submittedSearch, setSubmittedSearch] = React.useState("");
  const [joiningGrammarSet, setJoiningGrammarSet] = React.useState(null);

  const { grammarSets, status, refetchGrammarSets } = useGrammarSets({
    scope: viewMode,
    search: submittedSearch,
  });

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") return;
    setSubmittedSearch(draftSearch.trim());
  }

  if (status === "busy") {
    return (
      <LoadingWrapper>
        <HashLoader />
      </LoadingWrapper>
    );
  }

  return (
    <Wrapper>
      <ContentFrame>
        <SearchRow>
          <IconInput
            label="搜索语法集"
            icon="search"
            size="large"
            width="100%"
            value={draftSearch}
            placeholder={viewMode === "joined" ? "搜索已加入语法集" : "搜索公开语法集"}
            enterKeyHint="search"
            onChange={(event) => setDraftSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <GlobeButton
            type="button"
            aria-label={viewMode === "joined" ? "显示全部公开语法集" : "显示已加入语法集"}
            aria-pressed={viewMode === "public"}
            onClick={() =>
              setViewMode((current) => (current === "joined" ? "public" : "joined"))
            }
            $active={viewMode === "public"}
          >
            <Icon id="public" size="1.3rem" color="black" />
          </GlobeButton>
        </SearchRow>

        {status === "error" && (
          <Message type="error">语法集加载失败，请稍后重试。</Message>
        )}
        {status === "ok" && (
          <GrammarSetList
            grammarSets={grammarSets}
            variant="fluid2"
            onGrammarSetClick={
              viewMode === "public"
                ? (grammarSet) => setJoiningGrammarSet(grammarSet)
                : undefined
            }
          />
        )}

        {joiningGrammarSet && (
          <JoinGrammarSetDialog
            grammarSet={joiningGrammarSet}
            onChanged={refetchGrammarSets}
            onClose={() => setJoiningGrammarSet(null)}
            trigger={<span />}
          />
        )}
      </ContentFrame>
    </Wrapper>
  );
}

const Wrapper = styled.div`width: 100%;`;
const ContentFrame = styled.div`
  width: 100%; max-width: 800px;
  margin-left: auto; margin-right: auto;
  margin-top: 2rem; padding: 0 2rem;
`;
const SearchRow = styled.div`display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.7rem;`;
const LoadingWrapper = styled.div`width: 100%; min-height: 80dvh; display: flex; justify-content: center; align-items: center;`;
const GlobeButton = styled(UnstyledButton)`
  flex: 0 0 auto; padding: 0.55rem; color: black; border-radius: 999px;
  background-color: ${(p) => (p.$active ? "var(--gray85)" : "transparent")};
`;

export default GrammarSetPage;
