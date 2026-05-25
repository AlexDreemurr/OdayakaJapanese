import React from "react";
import styled from "styled-components";
import { HashLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import PhraseSet from "../PhraseSet/PhraseSet";
import PhraseSetList from "../PhraseSetList/PhraseSetList";
import { JoinPhraseSetDialog } from "../PhraseSetActions/PhraseSetActions";
import Icon from "../Icon/Icon";
import IconInput from "../IconInput/IconInput";
import Message from "../Message/Message";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import usePhraseSets from "../../hooks/usePhraseSets";

function PhraseSetPage() {
  const { phraseSetId } = useParams();

  if (phraseSetId) {
    return <PhraseSet phraseSetId={phraseSetId} />;
  }

  return <PhraseSetIndexPage />;
}

function PhraseSetIndexPage() {
  const [viewMode, setViewMode] = React.useState("joined");
  const [draftSearch, setDraftSearch] = React.useState("");
  const [submittedSearch, setSubmittedSearch] = React.useState("");
  const [joiningPhraseSet, setJoiningPhraseSet] = React.useState(null);
  const { phraseSets, status, refetchPhraseSets } = usePhraseSets({
    scope: viewMode,
    search: submittedSearch,
  });

  function handlePhraseSetsChanged() {
    refetchPhraseSets();
  }

  function handleSearchKeyDown(event) {
    if (event.key !== "Enter") {
      return;
    }

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
            label="搜索词汇集"
            icon="search"
            size="large"
            width="100%"
            value={draftSearch}
            placeholder={
              viewMode === "joined" ? "搜索已加入词汇集" : "搜索公开词汇集"
            }
            enterKeyHint="search"
            onChange={(event) => setDraftSearch(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <GlobeButton
            type="button"
            aria-label={
              viewMode === "joined" ? "显示全部公开词汇集" : "显示已加入词汇集"
            }
            aria-pressed={viewMode === "public"}
            onClick={() =>
              setViewMode((current) =>
                current === "joined" ? "public" : "joined"
              )
            }
            $active={viewMode === "public"}
          >
            <Icon id="public" size="1.3rem" color="black" />
          </GlobeButton>
        </SearchRow>

        {status === "error" && (
          <Message type="error">词汇集加载失败，请稍后重试。</Message>
        )}
        {status === "ok" && (
          <PhraseSetList
            phraseSets={phraseSets}
            variant="fluid2"
            onPhraseSetClick={
              viewMode === "public"
                ? (phraseSet) => setJoiningPhraseSet(phraseSet)
                : undefined
            }
          />
        )}
        {joiningPhraseSet && (
          <JoinPhraseSetDialog
            phraseSet={joiningPhraseSet}
            onChanged={handlePhraseSetsChanged}
            onClose={() => setJoiningPhraseSet(null)}
            trigger={<span />}
          />
        )}
      </ContentFrame>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
`;

const ContentFrame = styled.div`
  width: 100%;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  margin-top: 2rem;
  padding: 0 2rem;
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.7rem;
`;

const LoadingWrapper = styled.div`
  width: 100%;
  min-height: 80dvh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const GlobeButton = styled(UnstyledButton)`
  flex: 0 0 auto;
  padding: 0.55rem;
  color: black;
  border-radius: 999px;
  background-color: ${(p) => (p.$active ? "var(--gray85)" : "transparent")};
`;

export default PhraseSetPage;
