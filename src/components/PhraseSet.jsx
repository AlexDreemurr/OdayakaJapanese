import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import supabase from "../supabaseClient";
import Message from "./Message";
import { HashLoader } from "react-spinners";
import { FONT_FAMILY } from "../constants";
import Icon from "./Icon";
import UnstyledButton from "./UnstyledButton";
import PhraseDialog, { getCompletedSentenceCount } from "./PhraseDialog";
import { useNavigate } from "react-router-dom";
import { FormModal } from "./FormModal";
import ContributeForm from "./ContributeForm";

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

  const fetchData = React.useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    const [setResult, phrasesResult] = await Promise.all([
      supabase
        .from("vocabulary_sets")
        .select("*")
        .eq("id", phraseSetId)
        .single(),
      supabase.from("vocabulary").select("*").eq("set_id", phraseSetId),
    ]);

    if (setResult.error || setResult.data === null) {
      setError("not_found");
    } else if (phrasesResult.error) {
      setError("fetch_error");
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const phraseRows = phrasesResult.data ?? [];
      let practiceByVocabularyId = new Map();

      if (user && phraseRows.length > 0) {
        const phraseIds = phraseRows.map((phrase) => phrase.id);
        const { data: practiceRows, error: practiceError } = await supabase
          .from("vocab_practice")
          .select("vocabulary_id, correct_counts")
          .eq("user_id", user.id)
          .in("vocabulary_id", phraseIds);

        if (!practiceError) {
          practiceByVocabularyId = new Map(
            (practiceRows ?? []).map((row) => [row.vocabulary_id, row])
          );
        } else {
          console.error(practiceError.message);
        }
      }

      setSetInfo(setResult.data);
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
  }, [phraseSetId]);

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

  const groupedPhrases = useMemo(() => {
    const groups = new Map();

    displayedPhrases.forEach((phrase) => {
      const initial = (phrase.reading || phrase.word || "").trim().charAt(0);
      const key = initial ? toHiraganaInitial(initial) : "#";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key).push(phrase);
    });

    return Array.from(groups, ([initial, items]) => ({ initial, items }));
  }, [displayedPhrases]);

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

  return (
    <Wrapper>
      <ButtonGroup>
        <UnstyledButton onClick={() => navigate("/phraseSetList")}>
          <IconWrapper id="arrowLeft" size="1.3rem" color="var(--gray15)" />
        </UnstyledButton>
        <TitleWrapper>{setInfo.name}</TitleWrapper>
        <UnstyledButton onClick={() => setShowContributeForm(true)}>
          <IconWrapper id="plus" size="1.3rem" color="var(--gray15)" />
        </UnstyledButton>
        <UnstyledButton onClick={handleStarModeToggle}>
          <IconWrapper id={starIconId} size="1.3rem" color="var(--gray15)" />
        </UnstyledButton>
        <UnstyledButton onClick={handleSortToggle}>
          <IconWrapper
            id={
              sortOrder === "default"
                ? "ArrowUpDown"
                : sortOrder === "asc"
                ? "ArrowDownAZ"
                : "ArrowDownZA"
            }
            size="1.3rem"
            color="var(--gray15)"
          />
        </UnstyledButton>
        <UnstyledButton onClick={() => setShowKana((prev) => !prev)}>
          <IconWrapper id="Languages" size="1.3rem" color="var(--gray15)" />
        </UnstyledButton>
      </ButtonGroup>

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
          displayedPhrases.map((phrase) => (
            <PhraseDialog
              key={phrase.id}
              phrase={phrase}
              showKana={showKana}
              showStars={showStars}
              textIndent="2rem"
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
  padding: 0 0rem;
`;
const LoadingWrapper = styled.div`
  width: 100%;
  min-height: 80dvh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const IconWrapper = styled(Icon)`
  padding: 0.8rem;
`;
const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  /* padding: 0 2rem; */
  margin-left: 1rem;
  margin-right: 1rem;
  margin-bottom: 0rem;
  background-color: var(--gray85);
  border-bottom: 1px var(--gray60) solid;
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
const TitleWrapper = styled.p`
  margin-right: auto;
  font-size: 1rem;
  margin-left: 1rem;
  margin-top: -0.04rem;
  font-weight: 500;
  color: var(--gray15);
  overflow: auto;
  white-space: nowrap;
`;
export default PhraseSet;
