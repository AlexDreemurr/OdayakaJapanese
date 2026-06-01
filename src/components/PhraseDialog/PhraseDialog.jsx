import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE, QUERIES } from "../../constants";
import * as Dialog from "@radix-ui/react-dialog";
import { getPhraseText } from "../PhraseSet/PhraseSet";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import Icon from "../Icon/Icon";
import { Star } from "lucide-react";
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
import SentenceBox from "../SentenceBox/SentenceBox";
import IconActionDropdown from "../IconActionDropdown/IconActionDropdown";
import { useAppMessages } from "../AppMessages/AppMessagesContext";

function getCorrectCounts(correctCounts) {
  if (!Array.isArray(correctCounts)) {
    return [];
  }

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
  const [isOpen, setIsOpen] = React.useState(false);
  const [examples, setExamples] = React.useState([]);
  const [status, setStatus] = React.useState("free");
  const [draftPitch, setDraftPitch] = React.useState("");
  const [contentView, setContentView] = React.useState("details");
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
    if (!isOpen) return;
    setStatus("busy");

    fetchTatoebaExamples(draftPhrase.word)
      .then((results) => {
        setExamples(results);
        setStatus("free");
      })
      .catch(() => setStatus("free"));
  }, [draftPhrase.word, isOpen]);

  function getPitchOptions(reading) {
    const moraCount = getMoras(reading).length;
    return Array.from({ length: moraCount + 1 }, (_, index) => index);
  }

  async function savePhraseChanges(changes) {
    const nextPhrase = { ...draftPhrase, ...changes };
    if (!canEdit) {
      await submitPhraseChangeRequest("update", changes);
      return;
    }

    const { data, error } = await updateVocabularyItem({
      vocabularyId: draftPhrase.id,
      word: nextPhrase.word,
      reading: nextPhrase.reading,
      pitch: nextPhrase.pitch,
      meaning: nextPhrase.meaning,
      contributorName: nextPhrase.contributor_name,
    });

    if (error || data !== "ok") {
      console.error(error?.message ?? data);
      return;
    }

    setDraftPhrase(nextPhrase);
    onChanged?.();
  }

  function requestInlineEdit() {
    return true;
  }

  function requestReadingEdit() {
    if (!requestInlineEdit()) {
      return false;
    }

    setDraftPitch(
      draftPhrase.pitch === null || draftPhrase.pitch === undefined
        ? ""
        : String(draftPhrase.pitch)
    );
    return true;
  }

  function handleReadingDraftChange(nextReading) {
    const maxPitch = getMoras(nextReading).length;
    if (draftPitch !== "" && Number(draftPitch) > maxPitch) {
      setDraftPitch(String(maxPitch));
    }
  }

  function hasReadingFieldChanges(nextValue) {
    const nextReading = nextValue.trim();
    const nextPitch = draftPitch === "" ? null : Number(draftPitch);

    return (
      nextReading !== (draftPhrase.reading ?? "") ||
      nextPitch !== (draftPhrase.pitch ?? null)
    );
  }

  function saveReadingField(nextValue) {
    const nextReading = nextValue.trim();
    const nextPitch = draftPitch === "" ? null : Number(draftPitch);

    if (
      nextReading === (draftPhrase.reading ?? "") &&
      nextPitch === (draftPhrase.pitch ?? null)
    ) {
      return;
    }

    savePhraseChanges({ reading: nextReading, pitch: nextPitch });
  }

  async function handleDeletePhrase() {
    if (!canEdit) {
      await submitPhraseChangeRequest("delete", {});
      setShowDeleteConfirm(false);
      return;
    }

    const { data, error } = await deleteVocabularyItem(draftPhrase.id);

    if (error || data !== "ok") {
      console.error(error?.message ?? data);
      return;
    }

    setIsOpen(false);
    onChanged?.();
  }

  function requestDeletePhrase() {
    setShowDeleteConfirm(true);
  }

  async function submitPhraseChangeRequest(action, changes) {
    const { data, error } = await requestVocabularyItemChange({
      vocabularyId: draftPhrase.id,
      action,
      changes,
    });

    if (error || data !== "ok") {
      const content =
        data === "not_authenticated"
          ? "请先登录后再提交词条修改申请。"
          : data === "forbidden"
          ? "你需要先加入这个词汇集，才能提交修改申请。"
          : data === "already_allowed"
          ? "你已经有直接编辑权限，请刷新后重试。"
          : "申请提交失败，请稍后重试。";

      console.error(error?.message ?? data);
      addMessage({
        type: "error",
        senderName: "系统",
        content,
      });
      return false;
    }

    addMessage({
      type: "success",
      senderName: "系统",
      content:
        action === "delete"
          ? `已提交删除「${draftPhrase.word}」的申请。`
          : `已提交修改「${draftPhrase.word}」的申请，等待管理员处理。`,
    });
    return true;
  }

  function toggleHistoryView() {
    setContentView((currentView) =>
      currentView === "history" ? "details" : "history"
    );
  }

  const actionItems = [
    {
      icon: "bookOpen",
      label: contentView === "history" ? "查看详情" : "查看做题历史",
      onSelect: toggleHistoryView,
    },
    {
      icon: "remove",
      label: canEdit ? "删除词条" : "申请删除词条",
      onSelect: requestDeletePhrase,
    },
  ];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={() => {
        setIsOpen(!isOpen);
      }}
    >
      <Dialog.Trigger asChild>
        <PhraseItem key={draftPhrase.id}>
          <PhraseText $textIndent={textIndent}>
            {getPhraseText(draftPhrase, showKana)}
          </PhraseText>
          {showStars && (
            <AwardWrapper aria-label="sentence completion stars">
              {Array.from({ length: 4 }, (_, index) => {
                const isCompleted = index < completedSentenceCount;

                return (
                  <StarIcon
                    key={index}
                    color={isCompleted ? "var(--gold15)" : "var(--gray60)"}
                    fill={isCompleted ? "var(--gold75)" : "none"}
                    strokeWidth={1.2}
                    size={18}
                  />
                );
              })}
            </AwardWrapper>
          )}
        </PhraseItem>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Overlay />
        <Content>
          <TopArea>
            <Actions>
              <Close asChild>
                <XWrapper>
                  <IconWrapper id="close" size="1.3rem" />
                </XWrapper>
              </Close>
              <TitleActions>
                <DesktopTitleActions>
                  <TitleIconButton
                    type="button"
                    aria-label="查看做题历史"
                    onClick={toggleHistoryView}
                  >
                    <IconWrapper id="bookOpen" size="1.3rem" />
                  </TitleIconButton>
                  {canEdit ? (
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
                    <DeleteIconButton
                      type="button"
                      aria-label="申请删除词条"
                      onClick={requestDeletePhrase}
                    >
                      <IconWrapper id="remove" size="1.3rem" />
                    </DeleteIconButton>
                  )}
                </DesktopTitleActions>
                <MobileTitleActions>
                  <MobileActionDropdown actions={actionItems} closeOnSelect />
                </MobileTitleActions>
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
                {/*
                  title="鍒犻櫎璇嶆潯"
                  description={`纭畾瑕佸垹闄ゃ€?{draftPhrase.word}銆嶅悧锛熻繖涓搷浣滀笉鑳芥挙閿€銆俙}
                  confirmText="纭鍒犻櫎"
                  onConfirm={handleDeletePhrase}
                />
                */}
              </TitleActions>
            </Actions>
            <Title>
              <EditableWord
                value={draftPhrase.word}
                onBeforeEdit={requestInlineEdit}
                onSave={(nextValue) => savePhraseChanges({ word: nextValue })}
              />
              <EditableReading
                value={draftPhrase.reading}
                displayValue={
                  <DialogPitchReading
                    reading={draftPhrase.reading}
                    pitch={draftPhrase.pitch}
                  />
                }
                onBeforeEdit={requestReadingEdit}
                onDraftChange={handleReadingDraftChange}
                shouldSave={hasReadingFieldChanges}
                onSave={saveReadingField}
                editAccessory={({ draftValue }) => (
                  <PitchSelect
                    value={draftPitch}
                    onChange={(event) => setDraftPitch(event.target.value)}
                  >
                    <option value="">-</option>
                    {getPitchOptions(draftValue).map((pitch) => (
                      <option key={pitch} value={pitch}>
                        {pitch}
                      </option>
                    ))}
                  </PitchSelect>
                )}
              />
            </Title>
          </TopArea>

          <Body>
            {contentView === "details" && (
              <>
                <LineBoxWrapper>
                  <LineBox>
                    <IconWrapper id="Languages" size={20} color="black" />
                    <EditableInfo
                      value={draftPhrase.meaning}
                      onBeforeEdit={requestInlineEdit}
                      onSave={(nextValue) =>
                        savePhraseChanges({ meaning: nextValue })
                      }
                    />
                  </LineBox>
                  <LineBox>
                    <IconWrapper id="message" size={20} color="black" />
                    {status === "busy" && (
                      <BarLoaderWrapper>
                        <BarLoader />
                      </BarLoaderWrapper>
                    )}
                    {status === "free" && (
                      <ExampleWrapper>
                        {examples.length === 0 && <Info>---</Info>}
                        {examples.length !== 0 &&
                          examples.map((example) => (
                            <Example>
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
                      onSave={(nextValue) =>
                        savePhraseChanges({ contributor_name: nextValue })
                      }
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
            )}
            {contentView === "history" && (
              <SentenceHistoryGrid>
                {Array.from({ length: 4 }, (_, index) => {
                  const isCompleted =
                    Number(draftPhrase.practiceCorrectCounts?.[index]) > 0;
                  const sentence = draftPhrase.sentences?.[index];

                  return isCompleted && sentence ? (
                    <HistorySentenceBox key={index}>
                      {sentence}
                    </HistorySentenceBox>
                  ) : (
                    <LockedSentenceSlot key={index}>
                      <Icon id="private" size="1.4rem" color="var(--gray95)" />
                    </LockedSentenceSlot>
                  );
                })}
              </SentenceHistoryGrid>
            )}
          </Body>
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
const PhraseItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0;
  margin-left: 1rem;
  margin-right: 1rem;
  padding: 0.45rem 1rem 0.35rem 0.4rem;
  /* background-color: var(--gray85); */
  border-bottom: 1px var(--gray60) solid;
  font-family: ${FONT_FAMILY.japanese_primary};
  &:hover {
    background-color: var(--gray85);
    cursor: pointer;
  }
`;
const PhraseText = styled.span`
  font-size: ${FONT_SIZE.default};
  min-width: 0;
  text-indent: ${(p) => p.$textIndent};
`;
const AwardWrapper = styled.div`
  width: 96px;
  /* border: 1px black solid; */
  display: flex;
  justify-content: center;
  flex-shrink: 0;
  /* gap: 4px; */
`;
const StarIcon = styled(Star)`
  display: block;
`;
const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background-color: var(--transparentGray15);
`;
const Content = styled(Dialog.Content)`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  width: 80%;
  max-width: ${400 / 16}rem;

  max-height: calc(50% + 10rem);
  height: fit-content;
  border-radius: 1rem;
  background-color: var(--gray95);
  padding: 1.1rem 1.5rem 1.1rem 1.5rem;
`;
const Close = styled(Dialog.Close)`
  padding: 0.8rem;
  position: relative;
  top: -1rem;
  right: -1rem;
`;
const XWrapper = styled(UnstyledButton)`
  color: var(--gray15);
`;
const Actions = styled.div`
  display: flex;
  flex-direction: row-reverse;
  height: fit-content;
`;
const TitleActions = styled.div`
  position: relative;
  top: -1rem;
  right: -1rem;
`;
const DesktopTitleActions = styled.div`
  display: none;

  @media ${QUERIES.tabletAndUp} {
    display: flex;
  }
`;
const MobileTitleActions = styled.div`
  display: block;

  @media ${QUERIES.tabletAndUp} {
    display: none;
  }
`;
const MobileActionDropdown = styled(IconActionDropdown)`
  transform: translateY(4px);
`;
const TitleIconButton = styled(UnstyledButton)`
  color: var(--gray15);
  padding: 0.8rem;
  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;
const DeleteIconButton = styled(TitleIconButton)``;
const TopArea = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 0.75rem;
`;
const Title = styled(Dialog.Title)`
  display: flex;
  /* width: 100%; */
  column-gap: 1rem;
  row-gap: 0.15rem;
  flex-wrap: wrap;
`;
const EditableWord = styled(EditableText)`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.default};
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
const Body = styled.div`
  margin-top: 0.35rem;
`;
const SentenceHistoryGrid = styled.div`
  --speaker-overhang-room: 0.5rem;

  display: grid;
  gap: 0.5rem;
  max-height: min(52vh, 24rem);
  overflow: auto;
  padding-right: 0.15rem;
`;
const HistorySentenceBox = styled(SentenceBox)`
  width: calc(100% - var(--speaker-overhang-room));
  box-sizing: border-box;
  font-size: ${FONT_SIZE.default};
  margin-bottom: 0;
`;
const LockedSentenceSlot = styled.div`
  width: calc(100% - var(--speaker-overhang-room));
  box-sizing: border-box;
  min-height: 4.6rem;
  display: grid;
  place-items: center;
  margin-bottom: 0;
  border-radius: 1rem;
  background-color: var(--gray15);
  font-size: ${FONT_SIZE.default};
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
  gap: 0rem;
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
