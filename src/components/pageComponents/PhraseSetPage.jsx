import React from "react";
import styled from "styled-components";
import { HashLoader } from "react-spinners";
import { useParams } from "react-router-dom";
import PhraseSet from "../PhraseSet/PhraseSet";
import PhraseSetList from "../PhraseSetList/PhraseSetList";
import { Link } from "react-router-dom";
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

        {viewMode === "joined" && (
          <AllVocabEntry to="/phraseSet/all">
            <AllVocabEntryText>
              <AllVocabEntryTitle>全部词汇</AllVocabEntryTitle>
              <AllVocabEntryHint>汇聚你已加入的所有词汇集</AllVocabEntryHint>
            </AllVocabEntryText>
            <Icon id="chevron-right" size="1.2rem" color="var(--accent)" />
          </AllVocabEntry>
        )}

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

const AllVocabEntry = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.7rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background-color: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: border-color 120ms ease, background-color 120ms ease;
  &:hover {
    border-color: var(--accent);
    background-color: var(--accent-soft);
  }
`;
const AllVocabEntryText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
`;
const AllVocabEntryTitle = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
`;
const AllVocabEntryHint = styled.span`
  font-size: 0.8rem;
  color: var(--text-muted);
`;

export default PhraseSetPage;
