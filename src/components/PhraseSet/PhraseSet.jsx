import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { getUser } from "../../services/auth";
import { getVocabularySet } from "../../services/vocabularySets";
import {
  getWordsBySetId,
  getUserMembership,
  getPracticeByVocabularyIds,
} from "../../services/words";
import Message from "../Message/Message";
import { HashLoader } from "react-spinners";
import { QUERIES } from "../../constants";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import PhraseDialog, { getCompletedSentenceCount } from "../PhraseDialog/PhraseDialog";
import { useNavigate } from "react-router-dom";
import { FormModal } from "../FormModal/FormModal";
import ContributeForm from "../ContributeForm/ContributeForm";
import { SetHeader, HeaderIcon } from "../SetPageShared/SetPageShared";

function toHiraganaText(text) {
  return (text || "")
    .normalize("NFKC")
    .replace(/[\u30a1-\u30f6]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60)
    );
}

// 把片假名/浊音统统转化为对应的轻音平假名
function toHiraganaInitial(initial) {
  return toHiraganaText(initial)
    .normalize("NFD")
    .replace(/[\u3099\u309a]/g, "");
}

export function getPhraseText(phrase, showKana) {
  if (!showKana) return phrase.word;
  return toHiraganaText(phrase.reading || phrase.word);
}

function PhraseSet({ phraseSetId }) {
  const navigate = useNavigate();
  const [phrases, setPhrases] = useState([]);
  const [setInfo, setSetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showKana, setShowKana] = useState(false);
  const [sortOrder, setSortOrder] = useState("default"); // ← 新增
  const [starMode, setStarMode] = useState("hidden");
  const [showContributeForm, setShowContributeForm] = useState(false);
  const [canEditPhrases, setCanEditPhrases] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = React.useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const [setResult, phrasesResult] = await Promise.all([
        getVocabularySet(phraseSetId),
        getWordsBySetId(phraseSetId),
      ]);

      if (setResult.error || setResult.data === null) {
        setError("not_found");
      } else if (phrasesResult.error) {
        setError("fetch_error");
      } else {
        const {
          data: { user },
        } = await getUser();
        const phraseRows = phrasesResult.data ?? [];
        let practiceByVocabularyId = new Map();
        let nextCanEditPhrases = false;

        if (user) {
          const { data: membership, error: membershipError } =
            await getUserMembership(user.id, phraseSetId);

          if (!membershipError && membership) {
            nextCanEditPhrases =
              membership.role === "owner" ||
              (membership.role === "admin" && membership.can_edit_phrases);
          } else if (membershipError) {
            console.error(membershipError.message);
          }

          if (phraseRows.length > 0) {
            const phraseIds = phraseRows.map((phrase) => phrase.id);
            const { data: practiceRows, error: practiceError } =
              await getPracticeByVocabularyIds(user.id, phraseIds);

            if (!practiceError) {
              practiceByVocabularyId = new Map(
                (practiceRows ?? []).map((row) => [row.vocabulary_id, row])
              );
            } else {
              console.error(practiceError.message);
            }
          } else {
            practiceByVocabularyId = new Map();
          }
        }

        setSetInfo(setResult.data);
        setCanEditPhrases(nextCanEditPhrases);
        setPhrases(
          phraseRows.map((phrase) => ({
            ...phrase,
            practiceCorrectCounts:
              practiceByVocabularyId.get(phrase.id)?.correct_counts ?? [],
          }))
        );
      }

      if (showLoading) {
        setLoading(false);
      }
    },
    [phraseSetId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getPhraseStarCount(phrase) {
    return getCompletedSentenceCount(phrase.practiceCorrectCounts);
  }

  function compareByStars(a, b) {
    if (starMode !== "starsDesc" && starMode !== "starsAsc") {
      return 0;
    }

    const difference = getPhraseStarCount(a) - getPhraseStarCount(b);
    return starMode === "starsDesc" ? -difference : difference;
  }

  function compareByKana(a, b) {
    const aReading = a.reading || a.word || "";
    const bReading = b.reading || b.word || "";
    const comparison = aReading.localeCompare(bReading, "ja");
    return sortOrder === "asc" ? comparison : -comparison;
  }

  function getInitialKey(phrase) {
    const initial = (phrase.reading || phrase.word || "").trim().charAt(0);
    return initial ? toHiraganaInitial(initial) : "#";
  }

  function compareByInitial(a, b) {
    const comparison = getInitialKey(a).localeCompare(getInitialKey(b), "ja");
    return sortOrder === "asc" ? comparison : -comparison;
  }

  function handleSearchToggle() {
    setIsSearching((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }

  // ← 新增：派生排序列表，不污染原始数据
  const displayedPhrases = useMemo(() => {
    const isStarSorting = starMode === "starsDesc" || starMode === "starsAsc";

    if (sortOrder === "default" && !isStarSorting) {
      return phrases;
    }

    return phrases
      .map((phrase, index) => ({ phrase, index }))
      .sort((a, b) => {
        const starComparison = compareByStars(a.phrase, b.phrase);

        if (sortOrder === "default") {
          return starComparison || a.index - b.index;
        }

        return (
          compareByInitial(a.phrase, b.phrase) ||
          starComparison ||
          compareByKana(a.phrase, b.phrase) ||
          a.index - b.index
        );
      })
      .map(({ phrase }) => phrase);
  }, [phrases, sortOrder, starMode]);

  const visiblePhrases = useMemo(() => {
    if (!searchQuery.trim()) return displayedPhrases;
    const q = searchQuery.trim();
    return displayedPhrases.filter(
      (p) =>
        (p.word || "").includes(q) ||
        (p.reading || "").includes(q) ||
        (p.meaning || "").includes(q)
    );
  }, [displayedPhrases, searchQuery]);

  const groupedPhrases = useMemo(() => {
    const groups = new Map();

    visiblePhrases.forEach((phrase) => {
      const initial = (phrase.reading || phrase.word || "").trim().charAt(0);
      const key = initial ? toHiraganaInitial(initial) : "#";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(phrase);
    });

    return Array.from(groups, ([initial, items]) => ({ initial, items }));
  }, [visiblePhrases]);

  if (loading)
    return (
      <LoadingWrapper>
        <HashLoader />
      </LoadingWrapper>
    );
  if (error === "not_found")
    return <Message type="error">没有找到该词汇集哦~</Message>;
  if (error === "fetch_error")
    return <Message type="error">加载失败，请稍后重试</Message>;

  // 点击同一个按钮循环切换： default → asc → desc → default
  function handleSortToggle() {
    setSortOrder((prev) =>
      prev === "default" ? "asc" : prev === "asc" ? "desc" : "default"
    );
  }

  function handleStarModeToggle() {
    setStarMode((currentMode) => {
      if (currentMode === "hidden") return "visible";
      if (currentMode === "visible") return "starsDesc";
      if (currentMode === "starsDesc") return "starsAsc";
      return "hidden";
    });
  }

  const showStars = starMode !== "hidden";
  const starIconId = {
    hidden: "starOff",
    visible: "star",
    starsDesc: "arrowWideNarrowDown",
    starsAsc: "arrowNarrowWideDown",
  }[starMode];

  const sortLabel = { default: "默认顺序", asc: "あ→ん", desc: "ん→あ" }[
    sortOrder
  ];
  const actionItems = [
    {
      icon: "plus",
      label: "添加词语",
      onSelect: () => setShowContributeForm(true),
    },
    {
      icon: starIconId,
      label:
        starMode === "hidden"
          ? "隐藏星标"
          : starMode === "visible"
          ? "显示星标"
          : starMode === "starsDesc"
          ? "按星标降序"
          : "按星标升序",
      onSelect: handleStarModeToggle,
    },
    {
      icon:
        sortOrder === "default"
          ? "ArrowUpDown"
          : sortOrder === "asc"
          ? "ArrowDownAZ"
          : "ArrowDownZA",
      label: `排序：${sortLabel}`,
      onSelect: handleSortToggle,
    },
    {
      icon: "Languages",
      label: showKana ? "显示假名" : "显示原词",
      onSelect: () => setShowKana((prev) => !prev),
    },
  ];

  return (
    <Wrapper>
      <SetHeader
        title={setInfo.name}
        onBack={() => navigate("/phraseSetList")}
        isSearching={isSearching}
        searchValue={searchQuery}
        searchPlaceholder="搜索词汇..."
        onSearchToggle={handleSearchToggle}
        onSearchChange={(e) => setSearchQuery(e.target.value)}
        desktopActions={
          <>
            <UnstyledButton onClick={() => setShowContributeForm(true)}>
              <HeaderIcon id="plus" size="1.3rem" color="var(--gray15)" />
            </UnstyledButton>
            <UnstyledButton onClick={handleStarModeToggle}>
              <HeaderIcon id={starIconId} size="1.3rem" color="var(--gray15)" />
            </UnstyledButton>
            <UnstyledButton onClick={handleSortToggle}>
              <HeaderIcon
                id={sortOrder === "default" ? "ArrowUpDown" : sortOrder === "asc" ? "ArrowDownAZ" : "ArrowDownZA"}
                size="1.3rem"
                color="var(--gray15)"
              />
            </UnstyledButton>
            <UnstyledButton onClick={() => setShowKana((prev) => !prev)}>
              <HeaderIcon id="Languages" size="1.3rem" color="var(--gray15)" />
            </UnstyledButton>
          </>
        }
        mobileActions={actionItems}
      />


      {showContributeForm && (
        <FormModal
          open
          onOpenChange={(open) => {
            if (!open) {
              setShowContributeForm(false);
            }
          }}
          title="加词"
          titleHint={setInfo.name}
        >
          <ContributeForm
            fixedPhraseSetId={Number(phraseSetId)}
            hideTitle
            onSuccess={() => fetchData({ showLoading: false })}
          />
        </FormModal>
      )}

      {/* 当排序为默认时显示的ui */}
      <DefaultWrapper>
        {sortOrder === "default" &&
          visiblePhrases.map((phrase) => (
            <PhraseDialog
              key={phrase.id}
              phrase={phrase}
              showKana={showKana}
              showStars={showStars}
              textIndent="2rem"
              canEdit={canEditPhrases}
              onChanged={() => fetchData({ showLoading: false })}
            />
          ))}
      </DefaultWrapper>

      {/* 当排序为按假名顺序时显示的ui */}
      {sortOrder !== "default" && (
        <PhraseGroups>
          {groupedPhrases.map((group) => (
            <PhraseGroup key={group.initial}>
              <InitialLetter>{group.initial}</InitialLetter>
              <PhraseItems>
                {group.items.map((phrase, index) => (
                  <PhraseDialog
                    key={phrase.id}
                    phrase={phrase}
                    showKana={showKana}
                    showStars={showStars}
                    textIndent="3rem"
                    canEdit={canEditPhrases}
                    onChanged={() => fetchData({ showLoading: false })}
                  />
                ))}
              </PhraseItems>
            </PhraseGroup>
          ))}
        </PhraseGroups>
      )}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  width: 100%;
  max-width: 800px;
  min-height: 80dvh;
  display: flex;
  flex-direction: column;
  gap: 0rem;
  margin-top: 0.5rem;
  padding: 0 0rem;
`;
const LoadingWrapper = styled.div`
  width: 100%;
  min-height: 80dvh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const DefaultWrapper = styled.div``;
const PhraseGroups = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;
const PhraseGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;
const PhraseItems = styled.div``;

const InitialLetter = styled.h3`
  background-color: var(--gray85);
  color: var(--gray25);
  width: fit-content;
  padding: 0.1rem 0.5rem;
  margin: 0;
  margin-left: 2rem;
  border-radius: 0.5rem;
  &:first-of-type {
    margin-top: 0.5rem;
  }
`;
export default PhraseSet;
