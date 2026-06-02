/**
 * SettingsPage
 * 设置页，包含用户资料、「词汇 | 语法」分栏，每栏各含题库范围选择和集合管理。
 */

import React from "react";
import styled from "styled-components";
import { HashLoader } from "react-spinners";
import usePhraseSets from "../../hooks/usePhraseSets";
import useGrammarSets from "../../hooks/useGrammarSets";
import Message from "../Message/Message";
import PhraseSetCard from "../PhraseSetCard/PhraseSetCard";
import GrammarSetCard from "../GrammarSetCard/GrammarSetCard";
import {
  getStoredSharedDictSetIds,
  storeSharedDictSetIds,
} from "../../sharedDictSettings";
import {
  getStoredGrammarSetIds,
  storeGrammarSetIds,
} from "../../grammarSettings";
import { FONT_SIZE, QUERIES } from "../../constants";
import ProgressBar from "../ProgressBar/ProgressBar";
import { KatakanaRateContext } from "../../KatakanaRateContext";
import { useAuth } from "../../hooks/useAuth";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
import Button from "../Button/Button";
import PhraseSetList from "../PhraseSetList/PhraseSetList";
import GrammarSetList from "../GrammarSetList/GrammarSetList";
import {
  AddPhraseSetDialog,
  DeletePhraseSetDialog,
  EditPhraseSetDialog,
} from "../PhraseSetActions/PhraseSetActions";
import {
  AddGrammarSetDialog,
  DeleteGrammarSetDialog,
  EditGrammarSetDialog,
} from "../GrammarSetActions/GrammarSetActions";
import PhraseSetMembersPanel from "../PhraseSetMembersPanel/PhraseSetMembersPanel";
import Icon from "../Icon/Icon";
import UnstyledButton from "../UnstyledButton/UnstyledButton";

// ─────────────────────────────────────────────────────────────────────────────

function SettingsPage({ resetAnswerToast }) {
  // 顶层分栏：vocabulary / grammar
  const [mainTab, setMainTab] = React.useState("vocabulary");

  const { user, isLoggedIn, signOut } = useAuth();
  const { katakanaRate, setKatakanaRate } = React.useContext(KatakanaRateContext);

  return (
    <Wrapper>
      <Title>设置</Title>

      {/* 用户资料 */}
      <FeatureBlock>
        <UserProfileCard user={user} isLoggedIn={isLoggedIn} signOut={signOut} />
      </FeatureBlock>

      {/* 主分栏切换 */}
      <TabBar>
        <TabButton
          type="button"
          $active={mainTab === "vocabulary"}
          onClick={() => setMainTab("vocabulary")}
        >
          词汇
        </TabButton>
        <TabButton
          type="button"
          $active={mainTab === "grammar"}
          onClick={() => setMainTab("grammar")}
        >
          语法
        </TabButton>
      </TabBar>

      {mainTab === "vocabulary" && (
        <VocabularySection
          user={user}
          katakanaRate={katakanaRate}
          setKatakanaRate={setKatakanaRate}
          resetAnswerToast={resetAnswerToast}
        />
      )}

      {mainTab === "grammar" && (
        <GrammarSection user={user} resetAnswerToast={resetAnswerToast} />
      )}
    </Wrapper>
  );
}

// ── 词汇分栏 ──────────────────────────────────────────────────────────────────
function VocabularySection({ user, katakanaRate, setKatakanaRate, resetAnswerToast }) {
  const { phraseSets, status, refetchPhraseSets: refetchAccessible } = usePhraseSets();
  const { phraseSets: created, status: createdStatus, refetchPhraseSets: refetchCreated } = usePhraseSets({ scope: "created" });
  const { phraseSets: joined, status: joinedStatus, refetchPhraseSets: refetchJoined } = usePhraseSets({ scope: "joined" });

  const [selectedSetIds, setSelectedSetIds] = React.useState([]);
  const [subView, setSubView] = React.useState("preferences"); // preferences | manage
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedManageIds, setSelectedManageIds] = React.useState([]);
  const [focusedSet, setFocusedSet] = React.useState(null);

  React.useEffect(() => {
    if (status !== "ok") return;
    const availableIds = phraseSets.map((ps) => ps.id);
    const storedIds = getStoredSharedDictSetIds();
    const initialIds =
      storedIds === null
        ? availableIds
        : storedIds.filter((id) => availableIds.includes(id));
    const safeIds =
      initialIds.length > 0 ? initialIds : availableIds.length > 0 ? [availableIds[0]] : [];
    setSelectedSetIds(safeIds);
    storeSharedDictSetIds(safeIds);
  }, [phraseSets, status]);

  function handleToggle(setId) {
    setSelectedSetIds((cur) => {
      const next = cur.includes(setId) ? cur.filter((id) => id !== setId) : [...cur, setId];
      if (next.length === 0) return cur;
      storeSharedDictSetIds(next);
      resetAnswerToast();
      return next;
    });
  }

  function handleManageChanged() {
    setSelectedManageIds([]);
    setFocusedSet(null);
    refetchAccessible();
    refetchCreated();
    refetchJoined();
  }

  const allManageable = [...created, ...joined].filter(
    (ps, i, arr) => arr.findIndex((item) => item.id === ps.id) === i
  );
  const selectedManage = allManageable.filter((ps) => selectedManageIds.includes(ps.id));
  const joinedOther = joined.filter((ps) => (ps.owner_id ?? ps.user_id) !== user?.id);

  return (
    <>
      {/* 子视图切换 */}
      <FeatureBlock>
        <SubViewToggle>
          <SubViewButton $active={subView === "preferences"} onClick={() => setSubView("preferences")}>偏好设置</SubViewButton>
          <SubViewButton $active={subView === "manage"} onClick={() => setSubView("manage")}>词汇集管理</SubViewButton>
        </SubViewToggle>
      </FeatureBlock>

      {subView === "preferences" ? (
        <>
          <FeatureBlock>
            <Description>切换显示假名的比例</Description>
            <RateControl>
              <ProgressBar size="small" value={katakanaRate * 100} onChange={(v) => setKatakanaRate(v / 100)} ariaLabel="切换显示假名的比例" />
              <RateValue>{Math.round(katakanaRate * 100)}%</RateValue>
            </RateControl>
          </FeatureBlock>

          <FeatureBlock>
            <Description>点击词汇集卡片来设置"共享词汇练习"的题库范围。</Description>
            {status === "busy" && <LoadingWrapper><HashLoader /></LoadingWrapper>}
            {status === "error" && <Message type="error">词汇集加载失败，请稍后重试。</Message>}
            {status === "ok" && (
              <CardGrid>
                {phraseSets.map((ps) => {
                  const isSelected = selectedSetIds.includes(ps.id);
                  return (
                    <SelectableCard
                      key={ps.id}
                      type="button"
                      size="small"
                      phraseSet={ps}
                      aria-pressed={isSelected}
                      data-selected={isSelected}
                      data-status={isSelected ? "已包含" : "未包含"}
                      onClick={() => handleToggle(ps.id)}
                    />
                  );
                })}
              </CardGrid>
            )}
          </FeatureBlock>
        </>
      ) : (
        <FeatureBlock>
          <ManageActions>
            <EditPhraseSetDialog selectedPhraseSet={selectedManage[0] ?? null} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
            <DeletePhraseSetDialog selectedPhraseSets={selectedManage} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
            <AddPhraseSetDialog onChanged={handleManageChanged} />
            <SelectModeButton type="button" aria-pressed={selectionMode} onClick={() => { setSelectionMode((c) => !c); setSelectedManageIds([]); }} $active={selectionMode}>
              <Icon id="select" size="1.3rem" color="black" />
            </SelectModeButton>
          </ManageActions>

          <Description>你创建的词汇集</Description>
          {createdStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
          {createdStatus === "error" && <Message type="error">词汇集加载失败，请稍后重试。</Message>}
          {createdStatus === "ok" && (
            <PhraseSetList phraseSets={created} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedPhraseSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} onPhraseSetClick={(ps) => setFocusedSet(ps)} />
          )}

          <Description>你加入的词汇集</Description>
          {joinedStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
          {joinedStatus === "error" && <Message type="error">词汇集加载失败，请稍后重试。</Message>}
          {joinedStatus === "ok" && (
            <PhraseSetList phraseSets={joinedOther} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedPhraseSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} onPhraseSetClick={(ps) => setFocusedSet(ps)} />
          )}

          {focusedSet && (
            <PhraseSetMembersPanel phraseSet={focusedSet} currentUserId={user?.id ?? null} onClose={() => setFocusedSet(null)} onChanged={handleManageChanged} />
          )}
        </FeatureBlock>
      )}
    </>
  );
}

// ── 语法分栏 ──────────────────────────────────────────────────────────────────
function GrammarSection({ user, resetAnswerToast }) {
  const { grammarSets, status, refetchGrammarSets: refetchAccessible } = useGrammarSets();
  const { grammarSets: created, status: createdStatus, refetchGrammarSets: refetchCreated } = useGrammarSets({ scope: "created" });
  const { grammarSets: joined, status: joinedStatus, refetchGrammarSets: refetchJoined } = useGrammarSets({ scope: "joined" });

  const [selectedSetIds, setSelectedSetIds] = React.useState([]);
  const [subView, setSubView] = React.useState("preferences");
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedManageIds, setSelectedManageIds] = React.useState([]);

  React.useEffect(() => {
    if (status !== "ok") return;
    const availableIds = grammarSets.map((gs) => gs.id);
    const storedIds = getStoredGrammarSetIds();
    const initialIds =
      storedIds === null
        ? availableIds
        : storedIds.filter((id) => availableIds.includes(id));
    const safeIds =
      initialIds.length > 0 ? initialIds : availableIds.length > 0 ? [availableIds[0]] : [];
    setSelectedSetIds(safeIds);
    storeGrammarSetIds(safeIds);
  }, [grammarSets, status]);

  function handleToggle(setId) {
    setSelectedSetIds((cur) => {
      const next = cur.includes(setId) ? cur.filter((id) => id !== setId) : [...cur, setId];
      if (next.length === 0) return cur;
      storeGrammarSetIds(next);
      resetAnswerToast();
      return next;
    });
  }

  function handleManageChanged() {
    setSelectedManageIds([]);
    refetchAccessible();
    refetchCreated();
    refetchJoined();
  }

  const allManageable = [...created, ...joined].filter(
    (gs, i, arr) => arr.findIndex((item) => item.id === gs.id) === i
  );
  const selectedManage = allManageable.filter((gs) => selectedManageIds.includes(gs.id));
  const joinedOther = joined.filter((gs) => (gs.owner_id ?? gs.user_id) !== user?.id);

  return (
    <>
      <FeatureBlock>
        <SubViewToggle>
          <SubViewButton $active={subView === "preferences"} onClick={() => setSubView("preferences")}>偏好设置</SubViewButton>
          <SubViewButton $active={subView === "manage"} onClick={() => setSubView("manage")}>语法集管理</SubViewButton>
        </SubViewToggle>
      </FeatureBlock>

      {subView === "preferences" ? (
        <FeatureBlock>
          <Description>点击语法集卡片来设置"语法练习"的题库范围。</Description>
          {status === "busy" && <LoadingWrapper><HashLoader /></LoadingWrapper>}
          {status === "error" && <Message type="error">语法集加载失败，请稍后重试。</Message>}
          {status === "ok" && grammarSets.length === 0 && (
            <Message>还没有加入任何语法集，请先加入或创建一个语法集。</Message>
          )}
          {status === "ok" && grammarSets.length > 0 && (
            <CardGrid>
              {grammarSets.map((gs) => {
                const isSelected = selectedSetIds.includes(gs.id);
                return (
                  <SelectableGrammarCard
                    key={gs.id}
                    type="button"
                    size="small"
                    grammarSet={gs}
                    aria-pressed={isSelected}
                    data-selected={isSelected}
                    data-status={isSelected ? "已包含" : "未包含"}
                    onClick={() => handleToggle(gs.id)}
                  />
                );
              })}
            </CardGrid>
          )}
        </FeatureBlock>
      ) : (
        <FeatureBlock>
          <ManageActions>
            <EditGrammarSetDialog selectedGrammarSet={selectedManage[0] ?? null} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
            <DeleteGrammarSetDialog selectedGrammarSets={selectedManage} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
            <AddGrammarSetDialog onChanged={handleManageChanged} />
            <SelectModeButton type="button" aria-pressed={selectionMode} onClick={() => { setSelectionMode((c) => !c); setSelectedManageIds([]); }} $active={selectionMode}>
              <Icon id="select" size="1.3rem" color="black" />
            </SelectModeButton>
          </ManageActions>

          <Description>你创建的语法集</Description>
          {createdStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
          {createdStatus === "error" && <Message type="error">语法集加载失败，请稍后重试。</Message>}
          {createdStatus === "ok" && (
            <GrammarSetList grammarSets={created} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedGrammarSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} />
          )}

          <Description>你加入的语法集</Description>
          {joinedStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
          {joinedStatus === "error" && <Message type="error">语法集加载失败，请稍后重试。</Message>}
          {joinedStatus === "ok" && (
            <GrammarSetList grammarSets={joinedOther} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedGrammarSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} />
          )}
        </FeatureBlock>
      )}
    </>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const Wrapper = styled.main`
  width: 100%; max-width: 800px;
  padding: 2rem;
  display: flex; flex-direction: column; align-items: stretch; gap: 1rem;
`;
const FeatureBlock = styled.section`
  width: 100%;
  display: flex; flex-direction: column; align-items: stretch; gap: 0.5rem;
`;
const Title = styled.h1`font-size: ${FONT_SIZE.giant};`;
const Description = styled.p`color: var(--gray40); font-size: ${FONT_SIZE.small};`;

const TabBar = styled.div`
  display: flex;
  border-bottom: 2px solid var(--gray60);
  gap: 0;
`;
const TabButton = styled.button`
  padding: 0.5rem 1.5rem;
  border: none;
  background: transparent;
  font-size: ${FONT_SIZE.default};
  font-weight: ${(p) => (p.$active ? "700" : "400")};
  color: ${(p) => (p.$active ? "var(--gray15)" : "var(--gray40)")};
  border-bottom: 3px solid ${(p) => (p.$active ? "var(--gray15)" : "transparent")};
  margin-bottom: -2px;
  cursor: pointer;
  transition: color 120ms ease, border-color 120ms ease;
  &:hover { color: var(--gray15); }
`;

const SubViewToggle = styled.div`display: flex; gap: 0.5rem;`;
const SubViewButton = styled(Button)`
  font-size: ${FONT_SIZE.tiny};
  width: auto;
  padding: 0.3rem 0.9rem;
  margin: 0;
  background-color: ${(p) => (p.$active ? "var(--gray15)" : "var(--gray85)")};
  color: ${(p) => (p.$active ? "var(--gray85)" : "var(--gray40)")};
  border: 1px solid ${(p) => (p.$active ? "transparent" : "var(--gray60)")};
`;

const ManageActions = styled.div`display: flex; align-items: center; justify-content: flex-start; gap: 0.25rem;`;
const SelectModeButton = styled(UnstyledButton)`
  padding: 0.8rem; color: black; border-radius: 1rem;
  background-color: ${(p) => (p.$active ? "var(--gray85)" : "transparent")};
`;
const RateControl = styled.div`
  display: grid; grid-template-columns: minmax(180px, 1fr) 3rem;
  align-items: center; gap: 0.75rem;
`;
const RateValue = styled.span`color: var(--gray15); font-size: ${FONT_SIZE.default}; font-variant-numeric: tabular-nums; text-align: right;`;

const CardGrid = styled.div`
  margin-top: 0.5rem; width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  @media ${QUERIES.tabletAndUp} { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media ${QUERIES.laptopAndUp} { grid-template-columns: repeat(4, minmax(0, 1fr)); }
`;
const LoadingWrapper = styled.div`width: 100%; display: flex; justify-content: center; padding: 1.5rem 0;`;

const selectableCardStyle = `
  width: 100%;
  font-size: ${FONT_SIZE.small};
  transition: box-shadow 120ms ease, opacity 120ms ease;
  cursor: pointer;

  &[data-selected="true"] {
    box-shadow: 0 0 0 2px var(--gray95), 0 0 0 5px var(--green15);
  }
  &[data-selected="false"] { opacity: 0.58; }
  &::after {
    content: attr(data-status);
    position: absolute; left: 0.5rem; bottom: 0.4rem;
    font-size: 0.75rem; line-height: 1.3;
    padding: 0.05rem 0.35rem; border-radius: 999px;
    background-color: var(--gray95); color: var(--gray15);
  }
`;
const SelectableCard = styled(PhraseSetCard)`${selectableCardStyle}`;
const SelectableGrammarCard = styled(GrammarSetCard)`${selectableCardStyle}`;

export default SettingsPage;
