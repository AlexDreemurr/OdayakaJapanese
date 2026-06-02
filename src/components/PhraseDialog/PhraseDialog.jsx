import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import { getPhraseText } from "../PhraseSet/PhraseSet";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import Icon from "../Icon/Icon";
import { BarLoader } from "react-spinners";
import { formatToChinaTime } from "../../utility";
import PitchReading, { getMoras } from "../PitchReading/PitchReading";
import { fetchTatoebaExamples } from "../../services/tatoeba";
import {
  updateVocabularyItem,
  deleteVocabularyItem,
  requestVocabularyItemChange,
} from "../../services/words";
import AlertDialog from "../AlertDialog/AlertDialog";
import EditableText from "../EditableText/EditableText";
import SentenceHistoryGrid from "../SentenceHistoryGrid/SentenceHistoryGrid";
import { SetItem } from "../SetPageShared/SetPageShared";
import SetItemDialog, { DeleteIconButton } from "../SetItemDialog/SetItemDialog";
import { useAppMessages } from "../AppMessages/AppMessagesContext";

function getCorrectCounts(correctCounts) {
  if (!Array.isArray(correctCounts)) return [];
  return correctCounts.slice(0, 4);
}

export function getCompletedSentenceCount(correctCounts) {
  return Math.min(
    4,
    getCorrectCounts(correctCounts).filter((count) => Number(count) > 0).length
  );
}

function PhraseDialog({
  phrase,
  showKana,
  showStars = false,
  textIndent = "2rem",
  canEdit = false,
  onChanged,
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [examples, setExamples] = React.useState([]);
  const [status, setStatus] = React.useState("free");
  const [draftPitch, setDraftPitch] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [draftPhrase, setDraftPhrase] = React.useState(phrase);
  const { addMessage } = useAppMessages();
  const completedSentenceCount = getCompletedSentenceCount(
    draftPhrase.practiceCorrectCounts
  );

  React.useEffect(() => {
    setDraftPhrase(phrase);
  }, [phrase]);

  React.useEffect(() => {
    if (!dialogOpen) return;
    setStatus("busy");
    fetchTatoebaExamples(draftPhrase.word)
      .then((results) => { setExamples(results); setStatus("free"); })
      .catch(() => setStatus("free"));
  }, [draftPhrase.word, dialogOpen]);

  function getPitchOptions(reading) {
    const moraCount = getMoras(reading).length;
    return Array.from({ length: moraCount + 1 }, (_, i) => i);
  }

  async function savePhraseChanges(changes) {
    const nextPhrase = { ...draftPhrase, ...changes };
    if (!canEdit) { await submitPhraseChangeRequest("update", changes); return; }

    const { data, error } = await updateVocabularyItem({
      vocabularyId: draftPhrase.id,
      word: nextPhrase.word,
      reading: nextPhrase.reading,
      pitch: nextPhrase.pitch,
      meaning: nextPhrase.meaning,
      contributorName: nextPhrase.contributor_name,
    });

    if (error || data !== "ok") { console.error(error?.message ?? data); return; }
    setDraftPhrase(nextPhrase);
    onChanged?.();
  }

  function requestInlineEdit() { return true; }

  function requestReadingEdit() {
    if (!requestInlineEdit()) return false;
    setDraftPitch(
      draftPhrase.pitch === null || draftPhrase.pitch === undefined
        ? "" : String(draftPhrase.pitch)
    );
    return true;
  }

  function handleReadingDraftChange(nextReading) {
    const maxPitch = getMoras(nextReading).length;
    if (draftPitch !== "" && Number(draftPitch) > maxPitch) setDraftPitch(String(maxPitch));
  }

  function hasReadingFieldChanges(nextValue) {
    const nextReading = nextValue.trim();
    const nextPitch = draftPitch === "" ? null : Number(draftPitch);
    return nextReading !== (draftPhrase.reading ?? "") || nextPitch !== (draftPhrase.pitch ?? null);
  }

  function saveReadingField(nextValue) {
    const nextReading = nextValue.trim();
    const nextPitch = draftPitch === "" ? null : Number(draftPitch);
    if (nextReading === (draftPhrase.reading ?? "") && nextPitch === (draftPhrase.pitch ?? null)) return;
    savePhraseChanges({ reading: nextReading, pitch: nextPitch });
  }

  async function handleDeletePhrase() {
    if (!canEdit) {
      await submitPhraseChangeRequest("delete", {});
      setShowDeleteConfirm(false);
      return;
    }
    const { data, error } = await deleteVocabularyItem(draftPhrase.id);
    if (error || data !== "ok") { console.error(error?.message ?? data); return; }
    onChanged?.();
  }

  function requestDeletePhrase() { setShowDeleteConfirm(true); }

  async function submitPhraseChangeRequest(action, changes) {
    const { data, error } = await requestVocabularyItemChange({
      vocabularyId: draftPhrase.id,
      action,
      changes,
    });

    if (error || data !== "ok") {
      const content =
        data === "not_authenticated" ? "请先登录后再提交词条修改申请。"
        : data === "forbidden" ? "你需要先加入这个词汇集，才能提交修改申请。"
        : data === "already_allowed" ? "你已经有直接编辑权限，请刷新后重试。"
        : "申请提交失败，请稍后重试。";
      console.error(error?.message ?? data);
      addMessage({ type: "error", senderName: "系统", content });
      return false;
    }

    addMessage({
      type: "success",
      senderName: "系统",
      content: action === "delete"
        ? `已提交删除「${draftPhrase.word}」的申请。`
        : `已提交修改「${draftPhrase.word}」的申请，等待管理员处理。`,
    });
    return true;
  }

  return (
    <SetItemDialog
      onOpenChange={setDialogOpen}
      trigger={
        <SetItem
          primary={getPhraseText(draftPhrase, showKana)}
          textIndent={textIndent}
          showStars={showStars}
          completedCount={completedSentenceCount}
        />
      }
      title={
        <>
          <EditableWord
            value={draftPhrase.word}
            onBeforeEdit={requestInlineEdit}
            onSave={(nextValue) => savePhraseChanges({ word: nextValue })}
          />
          <EditableReading
            value={draftPhrase.reading}
            displayValue={
              <DialogPitchReading reading={draftPhrase.reading} pitch={draftPhrase.pitch} />
            }
            onBeforeEdit={requestReadingEdit}
            onDraftChange={handleReadingDraftChange}
            shouldSave={hasReadingFieldChanges}
            onSave={saveReadingField}
            editAccessory={({ draftValue }) => (
              <PitchSelect value={draftPitch} onChange={(e) => setDraftPitch(e.target.value)}>
                <option value="">-</option>
                {getPitchOptions(draftValue).map((pitch) => (
                  <option key={pitch} value={pitch}>{pitch}</option>
                ))}
              </PitchSelect>
            )}
          />
        </>
      }
      detailsContent={
        <>
          <LineBoxWrapper>
            <LineBox>
              <IconWrapper id="Languages" size={20} color="black" />
              <EditableInfo
                value={draftPhrase.meaning}
                onBeforeEdit={requestInlineEdit}
                onSave={(nextValue) => savePhraseChanges({ meaning: nextValue })}
              />
            </LineBox>
            <LineBox>
              <IconWrapper id="message" size={20} color="black" />
              {status === "busy" && <BarLoaderWrapper><BarLoader /></BarLoaderWrapper>}
              {status === "free" && (
                <ExampleWrapper>
                  {examples.length === 0 && <Info>---</Info>}
                  {examples.map((example) => (
                    <Example key={example.sentence}>
                      <Info>{example.sentence}</Info>
                      <Translation>{example.translation}</Translation>
                    </Example>
                  ))}
                </ExampleWrapper>
              )}
            </LineBox>
          </LineBoxWrapper>
          <LastLineWrapper>
            <LineBox>
              <IconWrapper id="user" size={20} color="black" />
              <EditableInfo
                value={draftPhrase.contributor_name}
                onBeforeEdit={requestInlineEdit}
                onSave={(nextValue) => savePhraseChanges({ contributor_name: nextValue })}
              />
            </LineBox>
            <RightMeta>
              <LineBox>
                <IconWrapper id="clock" size={20} color="black" />
                <Info style={{ fontFamily: FONT_FAMILY.english_primary }}>
                  {formatToChinaTime(draftPhrase.created_at)}
                </Info>
              </LineBox>
            </RightMeta>
          </LastLineWrapper>
        </>
      }
      historyContent={
        <SentenceHistoryGrid
          sentences={draftPhrase.sentences}
          practiceCorrectCounts={draftPhrase.practiceCorrectCounts}
        />
      }
      desktopDeleteButton={
        canEdit ? (
          <AlertDialog
            title="删除词条"
            description={`确定要删除「${draftPhrase.word}」吗？这个操作不能撤销。`}
            confirmText="确认删除"
            onConfirm={handleDeletePhrase}
            trigger={
              <DeleteIconButton type="button" aria-label="删除词条">
                <IconWrapper id="remove" size="1.3rem" />
              </DeleteIconButton>
            }
          />
        ) : (
          <DeleteIconButton type="button" aria-label="申请删除词条" onClick={requestDeletePhrase}>
            <IconWrapper id="remove" size="1.3rem" />
          </DeleteIconButton>
        )
      }
      mobileMenuItems={[{
        icon: "remove",
        label: canEdit ? "删除词条" : "申请删除词条",
        onSelect: requestDeletePhrase,
      }]}
      extraContent={
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={canEdit ? "删除词条" : "申请删除词条"}
          description={
            canEdit
              ? `确定要删除「${draftPhrase.word}」吗？这个操作不能撤销。`
              : `提交删除「${draftPhrase.word}」的申请，等待管理员处理？`
          }
          confirmText={canEdit ? "确认删除" : "提交申请"}
          onConfirm={handleDeletePhrase}
        />
      }
    />
  );
}

const EditableWord = styled(EditableText)`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.default};
  font-weight: 700;
`;
const DialogPitchReading = styled(PitchReading)`
  color: var(--gray40);
  font-size: ${FONT_SIZE.default};
`;
const EditableReading = styled(EditableWord)`
  color: var(--gray40);
`;
const PitchSelect = styled.select`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
`;
const LineBoxWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;
const LastLineWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
`;
const LineBox = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;
const IconWrapper = styled(Icon)`
  transform: translateY(4px);
`;
const Info = styled.p`
  font-family: ${FONT_FAMILY.japanese_primary}, ${FONT_FAMILY.chinese_primary};
  font-size: 0.9rem;
`;
const EditableInfo = styled(EditableText)`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.japanese_primary}, ${FONT_FAMILY.chinese_primary};
  font-size: 0.9rem;
`;
const RightMeta = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
`;
const ExampleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 200px;
  overflow: auto;
  width: 100%;
`;
const Example = styled.div`
  display: flex;
  flex-direction: column;
`;
const Translation = styled.p`
  color: var(--gray40);
  font-size: 0.8rem;
`;
const BarLoaderWrapper = styled.div`
  align-self: center;
  transform: translateY(4px) translateX(1px);
`;

export default PhraseDialog;
