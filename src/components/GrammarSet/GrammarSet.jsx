/**
 * GrammarSet
 * 单个语法集的内容页，展示其下所有语法条目。
 * 对应 PhraseSet，依赖：grammarSets.js
 */

import React from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { HashLoader } from "react-spinners";
import { getGrammarSet, getGrammarItemsBySetId, deleteGrammarItem, getPracticeByGrammarIds } from "../../services/grammarSets";
import { getUser } from "../../services/auth";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import Message from "../Message/Message";
import Icon from "../Icon/Icon";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import AlertDialog from "../AlertDialog/AlertDialog";
import { FormModal } from "../FormModal/FormModal";
import SentenceHistoryGrid, { getCompletedCount } from "../SentenceHistoryGrid/SentenceHistoryGrid";
import GrammarContributeForm from "../GrammarContributeForm/GrammarContributeForm";
import { SetHeader, SetItem, HeaderIcon } from "../SetPageShared/SetPageShared";
import SetItemDialog, { DeleteIconButton } from "../SetItemDialog/SetItemDialog";

// ── 语法条目详情 Dialog ────────────────────────────────────────────────────────
function GrammarItemDialog({ item, canEdit, showStars, onDeleted }) {
  const sentences = Array.isArray(item.sentences) ? item.sentences : [];
  const quizSentences = sentences.slice(0, 4);

  // sentences[4] 新格式：{ text, translation }；兼容旧格式（纯字符串）
  const rawExample = sentences[4];
  const exampleText = !rawExample ? null
    : typeof rawExample === "string" ? rawExample
    : rawExample?.text ?? null;
  const exampleTranslation = rawExample && typeof rawExample === "object"
    ? rawExample?.translation ?? null
    : null;

  const completedCount = getCompletedCount(item.practiceCorrectCounts);

  async function handleDelete() {
    const { error } = await deleteGrammarItem(item.id);
    if (error) { console.error(error.message); return; }
    onDeleted?.();
  }

  return (
    <SetItemDialog
      trigger={
        <SetItem
          primary={item.form}
          secondary={item.meaning || undefined}
          textIndent="2rem"
          showStars={showStars}
          completedCount={completedCount}
        />
      }
      title={<ItemDialogForm>{item.form}</ItemDialogForm>}
      detailsContent={
        <LineBoxWrapper>
          <LineBox>
            <DialogIcon id="Languages" size={20} color="black" />
            <DialogInfo>{item.meaning || "---"}</DialogInfo>
          </LineBox>
          {exampleText && (
            <LineBox>
              <DialogIcon id="message" size={20} color="black" />
              <ExampleWrapper>
                <ExampleItem>
                  <DialogInfo>{exampleText}</DialogInfo>
                  {exampleTranslation && (
                    <ExampleTranslation>{exampleTranslation}</ExampleTranslation>
                  )}
                </ExampleItem>
              </ExampleWrapper>
            </LineBox>
          )}
        </LineBoxWrapper>
      }
      historyContent={
        <SentenceHistoryGrid
          sentences={quizSentences}
          practiceCorrectCounts={item.practiceCorrectCounts}
        />
      }
      desktopDeleteButton={
        canEdit ? (
          <AlertDialog
            title="删除语法条目"
            description={`确定要删除「${item.form}」吗？这个操作不能撤销。`}
            confirmText="确认删除"
            onConfirm={handleDelete}
            trigger={
              <DeleteIconButton type="button" aria-label="删除语法条目">
                <Icon id="remove" size="1.3rem" />
              </DeleteIconButton>
            }
          />
        ) : null
      }
      mobileMenuItems={
        canEdit
          ? [{ icon: "remove", label: "删除语法条目", onSelect: handleDelete }]
          : []
      }
    />
  );
}


// ── 主组件 ────────────────────────────────────────────────────────────────────
function GrammarSet({ grammarSetId }) {
  const navigate = useNavigate();
  const [items, setItems] = React.useState([]);
  const [setInfo, setSetInfo] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [canEditItems, setCanEditItems] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState("default"); // default | asc | desc
  const [starMode, setStarMode] = React.useState("hidden");   // hidden | visible | starsDesc | starsAsc

  const fetchData = React.useCallback(async ({ showLoading = true } = {}) => {
    if (showLoading) setLoading(true);
    setError(null);

    const [setResult, itemsResult] = await Promise.all([
      getGrammarSet(grammarSetId),
      getGrammarItemsBySetId(grammarSetId),
    ]);

    if (setResult.error || setResult.data === null) {
      setError("not_found");
    } else if (itemsResult.error) {
      setError("fetch_error");
    } else {
      const { data: { user } } = await getUser();
      const rawItems = itemsResult.data ?? [];

      if (user) {
        const { getGrammarSetMembers } = await import("../../services/grammarSets");
        const { data: members } = await getGrammarSetMembers(grammarSetId);
        const member = (members ?? []).find((m) => m.user_id === user.id);
        setCanEditItems(
          member?.role === "owner" ||
          (member?.role === "admin" && member?.can_edit_items)
        );

        if (rawItems.length > 0) {
          const grammarIds = rawItems.map((item) => item.id);
          const { data: practiceRows } = await getPracticeByGrammarIds(user.id, grammarIds);
          const practiceById = new Map(
            (practiceRows ?? []).map((row) => [row.grammar_id, row])
          );
          setItems(rawItems.map((item) => ({
            ...item,
            practiceCorrectCounts: practiceById.get(item.id)?.correct_counts ?? [],
          })));
        } else {
          setItems([]);
        }
      } else {
        setItems(rawItems.map((item) => ({ ...item, practiceCorrectCounts: [] })));
      }

      setSetInfo(setResult.data);
    }

    if (showLoading) setLoading(false);
  }, [grammarSetId]);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearchToggle() {
    setIsSearching((prev) => {
      if (prev) setSearch("");
      return !prev;
    });
  }

  function handleSortToggle() {
    setSortOrder((prev) =>
      prev === "default" ? "asc" : prev === "asc" ? "desc" : "default"
    );
  }

  function handleStarModeToggle() {
    setStarMode((prev) => {
      if (prev === "hidden") return "visible";
      if (prev === "visible") return "starsDesc";
      if (prev === "starsDesc") return "starsAsc";
      return "hidden";
    });
  }

  const displayedItems = React.useMemo(() => {
    const isStarSorting = starMode === "starsDesc" || starMode === "starsAsc";

    // 先搜索过滤
    const searched = search.trim()
      ? items.filter((item) =>
          item.form?.includes(search) || item.meaning?.includes(search)
        )
      : items;

    if (sortOrder === "default" && !isStarSorting) return searched;

    return [...searched].sort((a, b) => {
      // 星标排序优先
      if (isStarSorting) {
        const diff = getCompletedCount(a.practiceCorrectCounts) - getCompletedCount(b.practiceCorrectCounts);
        if (diff !== 0) return starMode === "starsDesc" ? -diff : diff;
      }
      // 再按语法形式排序（去掉前置波浪号后比较）
      if (sortOrder !== "default") {
        const aForm = (a.form || "").replace(/^[〜～]/g, "");
        const bForm = (b.form || "").replace(/^[〜～]/g, "");
        const cmp = aForm.localeCompare(bForm, "ja");
        return sortOrder === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }, [items, search, sortOrder, starMode]);

  if (loading) return <LoadingWrapper><HashLoader /></LoadingWrapper>;
  if (error === "not_found") return <Message type="error">没有找到该语法集哦~</Message>;
  if (error === "fetch_error") return <Message type="error">加载失败，请稍后重试</Message>;

  const showStars = starMode !== "hidden";
  const starIconId = {
    hidden: "starOff",
    visible: "star",
    starsDesc: "arrowWideNarrowDown",
    starsAsc: "arrowNarrowWideDown",
  }[starMode];
  const sortLabel = { default: "默认顺序", asc: "あ→ん", desc: "ん→あ" }[sortOrder];

  const actionItems = [
    {
      icon: "plus",
      label: "添加语法条目",
      onSelect: () => setShowAddForm(true),
    },
    {
      icon: starIconId,
      label:
        starMode === "hidden" ? "隐藏星标"
        : starMode === "visible" ? "显示星标"
        : starMode === "starsDesc" ? "按星标降序"
        : "按星标升序",
      onSelect: handleStarModeToggle,
    },
    {
      icon: sortOrder === "default" ? "ArrowUpDown" : sortOrder === "asc" ? "ArrowDownAZ" : "ArrowDownZA",
      label: `排序：${sortLabel}`,
      onSelect: handleSortToggle,
    },
  ].filter(Boolean);

  return (
    <Wrapper>
      <SetHeader
        title={setInfo.name}
        onBack={() => navigate("/grammarSetList")}
        isSearching={isSearching}
        searchValue={search}
        searchPlaceholder="搜索语法形式或含义..."
        onSearchToggle={handleSearchToggle}
        onSearchChange={(e) => setSearch(e.target.value)}
        desktopActions={
          <>
            <UnstyledButton onClick={() => setShowAddForm(true)} aria-label="添加语法条目">
              <HeaderIcon id="plus" size="1.3rem" color="var(--gray15)" />
            </UnstyledButton>
            <UnstyledButton onClick={handleStarModeToggle} aria-label="切换星标模式">
              <HeaderIcon id={starIconId} size="1.3rem" color="var(--gray15)" />
            </UnstyledButton>
            <UnstyledButton onClick={handleSortToggle} aria-label={`排序：${sortLabel}`}>
              <HeaderIcon
                id={sortOrder === "default" ? "ArrowUpDown" : sortOrder === "asc" ? "ArrowDownAZ" : "ArrowDownZA"}
                size="1.3rem"
                color="var(--gray15)"
              />
            </UnstyledButton>
          </>
        }
        mobileActions={actionItems}
      />

      {showAddForm && (
        <FormModal open onOpenChange={(open) => { if (!open) setShowAddForm(false); }} title="加语法" titleHint={setInfo.name}>
          <GrammarContributeForm
            fixedGrammarSetId={Number(grammarSetId)}
            hideTitle
            onSuccess={() => { fetchData({ showLoading: false }); }}
          />
        </FormModal>
      )}

      <ItemList>
        {displayedItems.length === 0 && (
          <EmptyWrapper>
            <Message>{search ? "没有匹配的语法条目。" : "这个语法集还没有条目。"}</Message>
          </EmptyWrapper>
        )}
        {displayedItems.map((item) => (
          <GrammarItemDialog
            key={item.id}
            item={item}
            canEdit={canEditItems}
            showStars={showStars}
            onDeleted={() => fetchData({ showLoading: false })}
          />
        ))}
      </ItemList>
    </Wrapper>
  );
}

/* ── styles ── */
const Wrapper = styled.div`width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 0; margin-top: 0.5rem;`;
const LoadingWrapper = styled.div`width: 100%; min-height: 80dvh; display: flex; justify-content: center; align-items: center;`;
const ItemList = styled.div`display: flex; flex-direction: column;`;
const EmptyWrapper = styled.div`margin: 0.5rem 1rem;`;
// Dialog body styles — 与词汇集 PhraseDialog 保持一致
const ItemDialogForm = styled.h2`font-family: ${FONT_FAMILY.japanese_primary}; font-size: ${FONT_SIZE.default}; font-weight: 700; color: var(--gray15); margin: 0;`;
const LineBoxWrapper = styled.div`display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem;`;
const LineBox = styled.div`display: flex; gap: 1rem; align-items: flex-start;`;
const DialogIcon = styled(Icon)`transform: translateY(4px);`;
const DialogInfo = styled.p`font-family: ${FONT_FAMILY.japanese_primary}, ${FONT_FAMILY.chinese_primary}; font-size: 0.9rem;`;
const ExampleWrapper = styled.div`display: flex; flex-direction: column; gap: 0; width: 100%;`;
const ExampleItem = styled.div`display: flex; flex-direction: column;`;
const ExampleTranslation = styled.p`color: var(--gray40); font-size: 0.8rem;`;


export default GrammarSet;
