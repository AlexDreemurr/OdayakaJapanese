import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "../../constants";
import * as Dialog from "@radix-ui/react-dialog";
import { getPhraseText } from "../PhraseSet/PhraseSet";
import { QUERIES } from "../../constants";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import Icon from "../Icon/Icon";
import { Star } from "lucide-react";
import { BarLoader } from "react-spinners";
import { formatToChinaTime } from "../../utility";
import PitchReading, { getMoras } from "../PitchReading/PitchReading";
import supabase from "../../supabaseClient";
import AlertDialog from "../AlertDialog/AlertDialog";
import { FormModal } from "../FormModal/FormModal";
import EditableText, { EditableTextInput } from "../EditableText/EditableText";

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
  const [editingField, setEditingField] = React.useState(null);
  const [draftReading, setDraftReading] = React.useState("");
  const [draftPitch, setDraftPitch] = React.useState("");
  const [showReviewNotice, setShowReviewNotice] = React.useState(false);
  const [draftPhrase, setDraftPhrase] = React.useState(phrase);
  const completedSentenceCount = getCompletedSentenceCount(
    draftPhrase.practiceCorrectCounts
  );

  React.useEffect(() => {
    setDraftPhrase(phrase);
  }, [phrase]);

  React.useEffect(() => {
    if (!isOpen) return;
    setStatus("busy");

    const base = `https://baedcqmxejvjzyvynqrp.supabase.co/functions/v1/tatoeba-proxy`;
    const encodedQuery = encodeURIComponent(draftPhrase.word);

    Promise.all([
      fetch(`${base}?query=${encodedQuery}&trans_to=cmn`).then((r) => r.json()),
      fetch(`${base}?query=${encodedQuery}`).then((r) => r.json()),
    ])
      .then(([cmnData, allData]) => {
        const cmnResults = (cmnData.results ?? [])
          .filter((item) => item.text.length <= 80)
          .filter((item) => item.text.includes(draftPhrase.word))
          .map((item) => {
            const trans = item.translations
              .flat()
              .find((t) => t.lang === "cmn");
            return {
              sentence: item.text,
              translation: trans?.text ?? "（无翻译）",
            };
          });

        const seenSentences = new Set(cmnResults.map((r) => r.sentence));

        const restResults = (allData.results ?? [])
          .filter((item) => item.text.length <= 80)
          .filter((item) => item.text.includes(draftPhrase.word))
          .filter((item) => !seenSentences.has(item.text))
          .map((item) => {
            const engTrans = item.translations
              .flat()
              .find((t) => t.lang === "eng");
            return {
              sentence: item.text,
              translation: engTrans?.text ?? "（无翻译）",
            };
          });

        setExamples([...cmnResults, ...restResults]);
        setStatus("free");
      })
      .catch(() => setStatus("free"));
  }, [draftPhrase.word, isOpen]);

  function requestEdit(field) {
    if (!canEdit) {
      setShowReviewNotice(true);
      return;
    }

    setEditingField(field);
    setDraftReading(draftPhrase.reading ?? "");
    setDraftPitch(
      draftPhrase.pitch === null || draftPhrase.pitch === undefined
        ? ""
        : String(draftPhrase.pitch)
    );
  }

  function getPitchOptions(reading) {
    const moraCount = getMoras(reading).length;
    return Array.from({ length: moraCount + 1 }, (_, index) => index);
  }

  async function savePhraseChanges(changes) {
    const nextPhrase = { ...draftPhrase, ...changes };
    const { data, error } = await supabase.rpc("update_vocabulary_item", {
      p_vocabulary_id: draftPhrase.id,
      p_word: nextPhrase.word,
      p_reading: nextPhrase.reading,
      p_pitch:
        nextPhrase.pitch === null || nextPhrase.pitch === ""
          ? null
          : Number(nextPhrase.pitch),
      p_meaning: nextPhrase.meaning,
      p_contributor_name: nextPhrase.contributor_name,
    });

    if (error || data !== "ok") {
      console.error(error?.message ?? data);
      setEditingField(null);
      return;
    }

    setDraftPhrase(nextPhrase);
    setEditingField(null);
    onChanged?.();
  }

  function handleTextKeyDown(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    }

    if (event.key === "Escape") {
      setEditingField(null);
    }
  }

  function requestInlineEdit() {
    if (!canEdit) {
      setShowReviewNotice(true);
      return false;
    }

    return true;
  }

  function saveReadingField() {
    const nextReading = draftReading.trim();
    const nextPitch = draftPitch === "" ? null : Number(draftPitch);

    if (
      nextReading === (draftPhrase.reading ?? "") &&
      nextPitch === (draftPhrase.pitch ?? null)
    ) {
      setEditingField(null);
      return;
    }

    savePhraseChanges({ reading: nextReading, pitch: nextPitch });
  }

  async function handleDeletePhrase() {
    const { data, error } = await supabase.rpc("delete_vocabulary_item", {
      p_vocabulary_id: draftPhrase.id,
    });

    if (error || data !== "ok") {
      console.error(error?.message ?? data);
      return;
    }

    setIsOpen(false);
    onChanged?.();
  }

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
          <TitleActions>
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
                onClick={() => setShowReviewNotice(true)}
              >
                <IconWrapper id="remove" size="1.3rem" />
              </DeleteIconButton>
            )}
          </TitleActions>
          <Close asChild>
            <XWrapper>
              <IconWrapper id="close" size="1.3rem" />
            </XWrapper>
          </Close>
          <Title>
            <EditableWord
              value={draftPhrase.word}
              onBeforeEdit={requestInlineEdit}
              onSave={(nextValue) => savePhraseChanges({ word: nextValue })}
            />
            {editingField === "reading" ? (
              <ReadingEditGroup
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    saveReadingField();
                  }
                }}
              >
                <ReadingEditInput
                  autoFocus
                  value={draftReading}
                  onChange={(event) => {
                    const nextReading = event.target.value;
                    setDraftReading(nextReading);
                    const maxPitch = getMoras(nextReading).length;
                    if (draftPitch !== "" && Number(draftPitch) > maxPitch) {
                      setDraftPitch(String(maxPitch));
                    }
                  }}
                  onKeyDown={handleTextKeyDown}
                />
                <PitchSelect
                  value={draftPitch}
                  onChange={(event) => setDraftPitch(event.target.value)}
                >
                  <option value="">-</option>
                  {getPitchOptions(draftReading).map((pitch) => (
                    <option key={pitch} value={pitch}>
                      {pitch}
                    </option>
                  ))}
                </PitchSelect>
              </ReadingEditGroup>
            ) : (
              <ReadingButton
                type="button"
                onClick={() => requestEdit("reading")}
              >
                <DialogPitchReading
                  reading={draftPhrase.reading}
                  pitch={draftPhrase.pitch}
                />
              </ReadingButton>
            )}
          </Title>

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
          {showReviewNotice && (
            <FormModal
              open
              onOpenChange={(open) => {
                if (!open) {
                  setShowReviewNotice(false);
                }
              }}
              title="需要审核"
            >
              <ReviewNotice>
                普通用户提交修改需要审核。审核机制还没有开放，请先联系词汇集管理员。
              </ReviewNotice>
            </FormModal>
          )}
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
  position: absolute;
  top: 0.2rem;
  right: 0.2rem;

  padding: 0.8rem;

  @media ${QUERIES.tabletAndUp} {
    top: 0.3rem;
    right: 0.35rem;
  }
`;
const XWrapper = styled(UnstyledButton)`
  color: var(--gray15);
`;
const TitleActions = styled.div`
  position: absolute;
  top: 0.2rem;
  right: 3rem;
  padding: 0.8rem;

  @media ${QUERIES.tabletAndUp} {
    top: 0.3rem;
    right: 3.15rem;
  }
`;
const DeleteIconButton = styled(UnstyledButton)`
  color: var(--gray15);

  &:focus-visible {
    outline: 2px solid var(--gray15);
    outline-offset: 2px;
  }
`;
const Title = styled(Dialog.Title)`
  display: flex;
  width: 90%;
  column-gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;
const Text = styled.p`
  font-size: 0.9rem;
  font-family: ${FONT_FAMILY.japanese_primary};
`;
const Word = styled(Text)`
  font-size: 1.1rem;
`;
const EditableWord = styled(EditableText)`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: 1.1rem;
`;
const DialogPitchReading = styled(PitchReading)`
  color: var(--gray40);
  font-size: 1.1rem;
`;
const ReadingButton = styled(UnstyledButton)`
  color: var(--gray40);
`;
const ReadingEditGroup = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
`;
const ReadingEditInput = styled(EditableTextInput)`
  color: var(--gray40);
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: 1.1rem;
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
const ReviewNotice = styled.p`
  color: var(--gray15);
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.default};
  line-height: 1.6;
`;
const ExampleWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0rem;
  max-height: 200px;
  overflow: auto;
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
