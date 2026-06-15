/**
 * SettingsPage
 * 设置页。采用「侧边栏导航 + 内容区」的专业软件式布局：
 * 侧边栏把「词汇 / 语法」两组与各自的「偏好设置 / 集合管理」合并为统一导航，
 * 右侧内容区根据所选项渲染对应面板。
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
import {
  getStoredVocabSelectionWeight,
  storeVocabSelectionWeight,
  getStoredUseAllVocab,
  storeUseAllVocab,
  getStoredVocabModeWeights,
  storeVocabModeWeights,
} from "../../quizSelectionSettings";
import { FONT_SIZE, QUERIES } from "../../constants";
import ProgressBar from "../ProgressBar/ProgressBar";
import { KatakanaRateContext } from "../../KatakanaRateContext";
import { useAuth } from "../../hooks/useAuth";
import UserProfileCard from "../UserProfileCard/UserProfileCard";
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

// 侧边栏导航结构：两个分组，每组含若干面板。
const NAV_GROUPS = [
  {
    domain: "vocabulary",
    label: "词汇",
    items: [
      { view: "preferences", label: "偏好设置" },
      { view: "manage", label: "词汇集管理" },
    ],
  },
  {
    domain: "grammar",
    label: "语法",
    items: [
      { view: "preferences", label: "偏好设置" },
      { view: "manage", label: "语法集管理" },
    ],
  },
];

function SettingsPage({ resetAnswerToast }) {
  // 当前选中的面板：domain + view。
  const [active, setActive] = React.useState({
    domain: "vocabulary",
    view: "preferences",
  });

  const { user, isLoggedIn, signOut } = useAuth();
  const { katakanaRate, setKatakanaRate } = React.useContext(KatakanaRateContext);

  return (
    <Wrapper>
      <Title>设置</Title>

      <UserProfileCard user={user} isLoggedIn={isLoggedIn} signOut={signOut} />

      <Layout>
        <Sidebar>
          {NAV_GROUPS.map((group) => (
            <NavGroup key={group.domain}>
              <NavGroupLabel>{group.label}</NavGroupLabel>
              {group.items.map((item) => {
                const isActive =
                  active.domain === group.domain && active.view === item.view;
                return (
                  <NavItem
                    key={item.view}
                    type="button"
                    $active={isActive}
                    aria-current={isActive ? "page" : undefined}
                    onClick={() =>
                      setActive({ domain: group.domain, view: item.view })
                    }
                  >
                    {item.label}
                  </NavItem>
                );
              })}
            </NavGroup>
          ))}
        </Sidebar>

        <Content>
          {active.domain === "vocabulary" ? (
            <VocabularySection
              view={active.view}
              user={user}
              katakanaRate={katakanaRate}
              setKatakanaRate={setKatakanaRate}
              resetAnswerToast={resetAnswerToast}
            />
          ) : (
            <GrammarSection
              view={active.view}
              user={user}
              resetAnswerToast={resetAnswerToast}
            />
          )}
        </Content>
      </Layout>
    </Wrapper>
  );
}

// ── 词汇分栏 ──────────────────────────────────────────────────────────────────
function VocabularySection({
  view,
  user,
  katakanaRate,
  setKatakanaRate,
  resetAnswerToast,
}) {
  const { phraseSets, status, refetchPhraseSets: refetchAccessible } = usePhraseSets();
  const { phraseSets: created, status: createdStatus, refetchPhraseSets: refetchCreated } = usePhraseSets({ scope: "created" });
  const { phraseSets: joined, status: joinedStatus, refetchPhraseSets: refetchJoined } = usePhraseSets({ scope: "joined" });

  const [selectedSetIds, setSelectedSetIds] = React.useState([]);
  const [selectionWeight, setSelectionWeight] = React.useState(
    getStoredVocabSelectionWeight
  );
  const [useAllVocab, setUseAllVocab] = React.useState(getStoredUseAllVocab);
  const [modeWeights, setModeWeights] = React.useState(getStoredVocabModeWeights);
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

  function handleSelectionWeightChange(value) {
    const clamped = Math.min(Math.max(value, 0), 1);
    setSelectionWeight(clamped);
    storeVocabSelectionWeight(clamped);
  }

  function handleUseAllVocabChange(next) {
    setUseAllVocab(next);
    storeUseAllVocab(next);
    resetAnswerToast();
  }

  function handleModeWeightChange(mode, value) {
    const next = { ...modeWeights, [mode]: Math.max(0, Math.round(value)) };
    setModeWeights(next);
    storeVocabModeWeights(next);
  }

  const modeTotal =
    modeWeights.sentence + modeWeights.typeReading + modeWeights.chooseMeaning;
  function modePercent(mode) {
    if (modeTotal <= 0) return 0;
    return Math.round((modeWeights[mode] / modeTotal) * 100);
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

  if (view === "preferences") {
    return (
      <Panel>
        <PanelHeader>偏好设置</PanelHeader>

        <Field>
          <FieldLabel>切换显示假名的比例</FieldLabel>
          <RateControl>
            <ProgressBar size="small" value={katakanaRate * 100} onChange={(v) => setKatakanaRate(v / 100)} ariaLabel="切换显示假名的比例" />
            <RateValue>{Math.round(katakanaRate * 100)}%</RateValue>
          </RateControl>
        </Field>

        <Field>
          <FieldLabel>单词抽取方式</FieldLabel>
          <FieldHint>
            0% 为完全随机抽取，100% 为完全按"做对最少的单词优先"。
          </FieldHint>
          <RateControl>
            <ProgressBar size="small" value={selectionWeight * 100} onChange={(v) => handleSelectionWeightChange(v / 100)} ariaLabel="单词抽取方式" />
            <RateValue>{Math.round(selectionWeight * 100)}%</RateValue>
          </RateControl>
          <ScaleRow>
            <span>随机</span>
            <span>做对最少优先</span>
          </ScaleRow>
        </Field>

        <Field>
          <FieldLabel>练习题型比例</FieldLabel>
          <FieldHint>
            决定词汇练习中三种题型出现的相对比例（按比例随机出题）。
          </FieldHint>
          <ModeGrid>
            <ModeRow>
              <ModeName>句子填空</ModeName>
              <ProgressBar size="small" value={modeWeights.sentence} onChange={(v) => handleModeWeightChange("sentence", v)} ariaLabel="句子填空比例" />
              <RateValue>{modePercent("sentence")}%</RateValue>
            </ModeRow>
            <ModeRow>
              <ModeName>看汉字写假名</ModeName>
              <ProgressBar size="small" value={modeWeights.typeReading} onChange={(v) => handleModeWeightChange("typeReading", v)} ariaLabel="看汉字写假名比例" />
              <RateValue>{modePercent("typeReading")}%</RateValue>
            </ModeRow>
            <ModeRow>
              <ModeName>看词选义</ModeName>
              <ProgressBar size="small" value={modeWeights.chooseMeaning} onChange={(v) => handleModeWeightChange("chooseMeaning", v)} ariaLabel="看词选义比例" />
              <RateValue>{modePercent("chooseMeaning")}%</RateValue>
            </ModeRow>
          </ModeGrid>
        </Field>

        <Field>
          <FieldLabel>共享词汇练习题库范围</FieldLabel>
          <ToggleRow>
            <ToggleText>
              <ToggleTitle>使用「全部词汇」</ToggleTitle>
              <FieldHint>汇聚你已加入的所有词汇集，作为统一题库。</FieldHint>
            </ToggleText>
            <Switch
              type="button"
              role="switch"
              aria-checked={useAllVocab}
              $on={useAllVocab}
              onClick={() => handleUseAllVocabChange(!useAllVocab)}
            >
              <SwitchKnob $on={useAllVocab} />
            </Switch>
          </ToggleRow>

          {!useAllVocab && (
            <>
              <FieldHint>点击词汇集卡片来设置参与练习的范围。</FieldHint>
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
            </>
          )}
        </Field>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader>词汇集管理</PanelHeader>

      <ManageActions>
        <EditPhraseSetDialog selectedPhraseSet={selectedManage[0] ?? null} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
        <DeletePhraseSetDialog selectedPhraseSets={selectedManage} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
        <AddPhraseSetDialog onChanged={handleManageChanged} />
        <SelectModeButton type="button" aria-pressed={selectionMode} onClick={() => { setSelectionMode((c) => !c); setSelectedManageIds([]); }} $active={selectionMode}>
          <Icon id="select" size="1.3rem" color="black" />
        </SelectModeButton>
      </ManageActions>

      <Field>
        <FieldLabel>你创建的词汇集</FieldLabel>
        {createdStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
        {createdStatus === "error" && <Message type="error">词汇集加载失败，请稍后重试。</Message>}
        {createdStatus === "ok" && (
          <PhraseSetList phraseSets={created} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedPhraseSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} onPhraseSetClick={(ps) => setFocusedSet(ps)} />
        )}
      </Field>

      <Field>
        <FieldLabel>你加入的词汇集</FieldLabel>
        {joinedStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
        {joinedStatus === "error" && <Message type="error">词汇集加载失败，请稍后重试。</Message>}
        {joinedStatus === "ok" && (
          <PhraseSetList phraseSets={joinedOther} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedPhraseSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} onPhraseSetClick={(ps) => setFocusedSet(ps)} />
        )}
      </Field>

      {focusedSet && (
        <PhraseSetMembersPanel phraseSet={focusedSet} currentUserId={user?.id ?? null} onClose={() => setFocusedSet(null)} onChanged={handleManageChanged} />
      )}
    </Panel>
  );
}

// ── 语法分栏 ──────────────────────────────────────────────────────────────────
function GrammarSection({ view, user, resetAnswerToast }) {
  const { grammarSets, status, refetchGrammarSets: refetchAccessible } = useGrammarSets();
  const { grammarSets: created, status: createdStatus, refetchGrammarSets: refetchCreated } = useGrammarSets({ scope: "created" });
  const { grammarSets: joined, status: joinedStatus, refetchGrammarSets: refetchJoined } = useGrammarSets({ scope: "joined" });

  const [selectedSetIds, setSelectedSetIds] = React.useState([]);
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

  if (view === "preferences") {
    return (
      <Panel>
        <PanelHeader>偏好设置</PanelHeader>
        <Field>
          <FieldLabel>语法练习题库范围</FieldLabel>
          <FieldHint>点击语法集卡片来设置参与练习的范围。</FieldHint>
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
        </Field>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader>语法集管理</PanelHeader>

      <ManageActions>
        <EditGrammarSetDialog selectedGrammarSet={selectedManage[0] ?? null} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
        <DeleteGrammarSetDialog selectedGrammarSets={selectedManage} currentUserId={user?.id ?? null} onChanged={handleManageChanged} />
        <AddGrammarSetDialog onChanged={handleManageChanged} />
        <SelectModeButton type="button" aria-pressed={selectionMode} onClick={() => { setSelectionMode((c) => !c); setSelectedManageIds([]); }} $active={selectionMode}>
          <Icon id="select" size="1.3rem" color="black" />
        </SelectModeButton>
      </ManageActions>

      <Field>
        <FieldLabel>你创建的语法集</FieldLabel>
        {createdStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
        {createdStatus === "error" && <Message type="error">语法集加载失败，请稍后重试。</Message>}
        {createdStatus === "ok" && (
          <GrammarSetList grammarSets={created} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedGrammarSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} />
        )}
      </Field>

      <Field>
        <FieldLabel>你加入的语法集</FieldLabel>
        {joinedStatus === "busy" && <LoadingWrapper><HashLoader size={32} /></LoadingWrapper>}
        {joinedStatus === "error" && <Message type="error">语法集加载失败，请稍后重试。</Message>}
        {joinedStatus === "ok" && (
          <GrammarSetList grammarSets={joinedOther} variant="fluid" cardSize="small" selectionMode={selectionMode} selectedGrammarSetIds={selectedManageIds} onSelectionChange={(id, checked) => setSelectedManageIds(checked ? [id] : [])} />
        )}
      </Field>
    </Panel>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
// 移动端优先：默认采用更小字号、更紧凑的间距；平板及以上再放宽。
const Wrapper = styled.main`
  /* 复用全站语义令牌（主色＝藍 indigo），仅补充本页用到的别名。 */
  --line: var(--border);
  --text-strong: var(--text);

  width: 100%; max-width: 960px;
  padding: 0.85rem;
  display: flex; flex-direction: column; align-items: stretch; gap: 0.75rem;

  @media ${QUERIES.tabletAndUp} {
    padding: 2rem;
    gap: 1.25rem;
  }
`;
const Title = styled.h1`
  font-size: ${FONT_SIZE.large};
  font-weight: 700;
  color: var(--text-strong);
  @media ${QUERIES.tabletAndUp} { font-size: ${FONT_SIZE.giant}; }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  align-items: start;

  @media ${QUERIES.tabletAndUp} {
    grid-template-columns: 190px minmax(0, 1fr);
    gap: 1.25rem;
  }
`;

const Sidebar = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.5rem;
  background-color: var(--surface-sunken);
  border: 1px solid var(--line);
  border-radius: 0.75rem;

  @media ${QUERIES.tabletAndUp} {
    gap: 0.85rem;
    padding: 0.65rem;
    position: sticky;
    top: calc(var(--header-height) + 1rem);
  }
`;
// 移动端：每组横向排布（组名 + 横向滑动的标签），节省竖向空间。
const NavGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;

  @media ${QUERIES.tabletAndUp} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.15rem;
  }
`;
const NavGroupLabel = styled.div`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: ${FONT_SIZE.tiny};
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  width: 1.9rem;

  @media ${QUERIES.tabletAndUp} {
    width: auto;
    padding: 0.2rem 0.4rem;
    letter-spacing: 0.08em;
  }
`;
const NavItem = styled.button`
  flex: 1;
  text-align: center;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border-radius: 0.5rem;
  line-height: 1.4;
  font-size: ${FONT_SIZE.tiny};
  font-weight: ${(p) => (p.$active ? "700" : "400")};
  color: ${(p) => (p.$active ? "var(--accent)" : "var(--text-secondary)")};
  background-color: ${(p) => (p.$active ? "var(--accent-soft)" : "var(--surface)")};
  transition: background-color 120ms ease, color 120ms ease;

  &:hover { color: var(--text-strong); }

  @media ${QUERIES.tabletAndUp} {
    flex: initial;
    text-align: left;
    padding: 0.4rem 0.65rem;
    font-size: ${FONT_SIZE.small};
    background-color: ${(p) => (p.$active ? "var(--accent-soft)" : "transparent")};
    &:hover { background-color: ${(p) => (p.$active ? "var(--accent-soft)" : "var(--surface)")}; }
  }
`;

const Content = styled.div`min-width: 0;`;
const Panel = styled.section`
  display: flex; flex-direction: column; align-items: stretch; gap: 0.85rem;
  padding: 0.9rem;
  background-color: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px hsl(0deg 0% 0% / 0.04);

  @media ${QUERIES.tabletAndUp} {
    gap: 1.25rem;
    padding: 1.5rem;
  }
`;
const PanelHeader = styled.h2`
  font-size: ${FONT_SIZE.default};
  line-height: 1.4;
  font-weight: 700;
  color: var(--text-strong);
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--accent);

  @media ${QUERIES.tabletAndUp} {
    font-size: ${FONT_SIZE.large};
    padding-bottom: 0.6rem;
  }
`;

const Field = styled.div`display: flex; flex-direction: column; align-items: stretch; gap: 0.3rem;`;
const FieldLabel = styled.h3`
  font-size: ${FONT_SIZE.small};
  line-height: 1.4;
  font-weight: 700;
  color: var(--text-strong);
  @media ${QUERIES.tabletAndUp} { font-size: ${FONT_SIZE.default}; }
`;
// 附属提示：更小、更弱（muted），与主文字拉开层次。
const FieldHint = styled.p`
  color: var(--text-muted);
  font-size: ${FONT_SIZE.tiny};
  font-weight: 400;
  line-height: 1.4;
`;

const ManageActions = styled.div`display: flex; align-items: center; justify-content: flex-start; gap: 0.25rem;`;
const SelectModeButton = styled(UnstyledButton)`
  padding: 0.55rem; color: black; border-radius: 0.85rem;
  background-color: ${(p) => (p.$active ? "var(--gray85)" : "transparent")};
  @media ${QUERIES.tabletAndUp} { padding: 0.8rem; border-radius: 1rem; }
`;
// 滑块整体收窄，不再铺满整行；右侧百分比数字也更小更弱。
const RateControl = styled.div`
  width: 100%; max-width: 320px;
  display: grid; grid-template-columns: minmax(0, 1fr) 2.2rem;
  align-items: center; gap: 0.5rem;
`;
const RateValue = styled.span`
  color: var(--text-secondary);
  font-size: ${FONT_SIZE.tiny};
  font-weight: 600;
  font-variant-numeric: tabular-nums; text-align: right;
`;
const ScaleRow = styled.div`
  max-width: 320px;
  display: flex; justify-content: space-between;
  line-height: 1.3;

  /* 全局 * 选择器会把 span 强制成 large，这里显式覆盖，保持提示文字小而弱。 */
  & > span {
    font-size: ${FONT_SIZE.tiny};
    color: var(--text-muted);
  }
`;

const ModeGrid = styled.div`
  display: flex; flex-direction: column; gap: 0.6rem;
  margin-top: 0.25rem;
`;
const ModeRow = styled.div`
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr) 2.4rem;
  align-items: center; gap: 0.6rem;
  @media ${QUERIES.tabletAndUp} {
    grid-template-columns: 7.5rem minmax(0, 1fr) 2.6rem;
  }
`;
const ModeName = styled.span`
  font-size: ${FONT_SIZE.tiny};
  color: var(--text-secondary);
  @media ${QUERIES.tabletAndUp} { font-size: ${FONT_SIZE.small}; }
`;

const ToggleRow = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
`;
const ToggleText = styled.div`
  display: flex; flex-direction: column; gap: 0.15rem; min-width: 0;
`;
const ToggleTitle = styled.span`
  font-size: ${FONT_SIZE.small};
  font-weight: 600;
  color: var(--text);
`;
const Switch = styled.button`
  flex-shrink: 0;
  width: 2.6rem; height: 1.5rem;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  padding: 0.15rem;
  display: flex;
  justify-content: ${(p) => (p.$on ? "flex-end" : "flex-start")};
  background-color: ${(p) => (p.$on ? "var(--accent)" : "var(--gray60)")};
  transition: background-color 140ms ease;
`;
const SwitchKnob = styled.span`
  width: 1.2rem; height: 1.2rem;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 1px 2px hsl(0deg 0% 0% / 0.25);
`;

const CardGrid = styled.div`
  margin-top: 0.35rem; width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  @media ${QUERIES.tabletAndUp} { gap: 0.75rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media ${QUERIES.laptopAndUp} { grid-template-columns: repeat(4, minmax(0, 1fr)); }
`;
const LoadingWrapper = styled.div`width: 100%; display: flex; justify-content: center; padding: 1rem 0;`;

const selectableCardStyle = `
  width: 100%;
  font-size: ${FONT_SIZE.small};
  transition: box-shadow 120ms ease, opacity 120ms ease;
  cursor: pointer;

  &[data-selected="true"] {
    box-shadow: 0 0 0 2px var(--surface), 0 0 0 5px var(--accent);
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
