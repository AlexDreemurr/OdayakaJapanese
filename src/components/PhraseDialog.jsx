import React from "react";
import styled from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "../constants";
import * as Dialog from "@radix-ui/react-dialog";
import { getPhraseText } from "./PhraseSet";
import { QUERIES } from "../constants";
import UnstyledButton from "./UnstyledButton";
import Icon from "./Icon";
import { Star } from "lucide-react";
import { BarLoader } from "react-spinners";
import { formatToChinaTime } from "../utility";
import VisuallyHidden from "./VisuallyHidden";

const SMALL_KANA = new Set(
  "ぁぃぅぇぉゃゅょゎァィゥェォャュョヮㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ"
);

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

function getPitchNumber(pitch) {
  if (pitch === null || pitch === undefined || pitch === "") {
    return null;
  }

  const pitchNumber = Number(pitch);
  return Number.isInteger(pitchNumber) && pitchNumber >= 0 ? pitchNumber : null;
}

function getMoras(reading = "") {
  return Array.from(String(reading).trim()).reduce((moras, character) => {
    if (SMALL_KANA.has(character) && moras.length > 0) {
      moras[moras.length - 1] += character;
    } else {
      moras.push(character);
    }

    return moras;
  }, []);
}

function getMoraTone(index, pitch) {
  if (pitch === 0) {
    return index === 0 ? "low" : "high";
  }

  if (pitch === 1) {
    return index === 0 ? "high" : "low";
  }

  return index > 0 && index < pitch ? "high" : "low";
}

function PitchReading({ reading, pitch }) {
  const pitchNumber = getPitchNumber(pitch);
  const moras = getMoras(reading);

  if (pitchNumber === null || moras.length === 0) {
    return <Reading>{reading}</Reading>;
  }

  const dropAfter =
    pitchNumber > 0 && pitchNumber <= moras.length ? pitchNumber - 1 : null;

  return (
    <Reading as="span" aria-label={`${reading}，音调型 ${pitchNumber}`}>
      {moras.map((mora, index) => (
        <Mora
          key={`${mora}-${index}`}
          $isHigh={getMoraTone(index, pitchNumber) === "high"}
          $hasDrop={dropAfter === index}
        >
          {mora}
        </Mora>
      ))}
    </Reading>
  );
}

function PhraseDialog({
  phrase,
  showKana,
  showStars = false,
  textIndent = "2rem",
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [examples, setExamples] = React.useState([]);
  const [status, setStatus] = React.useState("free");
  const completedSentenceCount = getCompletedSentenceCount(
    phrase.practiceCorrectCounts
  );

  React.useEffect(() => {
    if (!isOpen) return;
    setStatus("busy");

    const base = `https://baedcqmxejvjzyvynqrp.supabase.co/functions/v1/tatoeba-proxy`;
    const encodedQuery = encodeURIComponent(phrase.word);

    Promise.all([
      fetch(`${base}?query=${encodedQuery}&trans_to=cmn`).then((r) => r.json()),
      fetch(`${base}?query=${encodedQuery}`).then((r) => r.json()),
    ])
      .then(([cmnData, allData]) => {
        const cmnResults = (cmnData.results ?? [])
          .filter((item) => item.text.length <= 80)
          .filter((item) => item.text.includes(phrase.word))
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
          .filter((item) => item.text.includes(phrase.word))
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
  }, [isOpen]);

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={() => {
        setIsOpen(!isOpen);
      }}
    >
      <Dialog.Trigger asChild>
        <PhraseItem key={phrase.id}>
          <PhraseText $textIndent={textIndent}>
            {getPhraseText(phrase, showKana)}
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
          <Close asChild>
            <XWrapper>
              <IconWrapper id="close" size="1.3rem" />
            </XWrapper>
          </Close>
          <Title>
            <Word>{phrase.word}</Word>
            <PitchReading reading={phrase.reading} pitch={phrase.pitch} />
          </Title>

          <LineBoxWrapper>
            <LineBox>
              <IconWrapper id="Languages" size={20} color="black" />
              <Info>{phrase.meaning}</Info>
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
              <Info>{phrase.contributor_name}</Info>
            </LineBox>
            <LineBox>
              <IconWrapper id="clock" size={20} color="black" />
              <Info style={{ fontFamily: FONT_FAMILY.english_primary }}>
                {formatToChinaTime(phrase.created_at)}
              </Info>
            </LineBox>
          </LastLineWrapper>
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
const Reading = styled(Text)`
  color: var(--gray40);
  font-size: 1.1rem;
`;
const Mora = styled.span`
  position: relative;
  display: inline-block;
  padding-top: 0.28em;
  line-height: 1.15;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    right: ${({ $hasDrop }) => ($hasDrop ? "0" : "-1px")};
    top: 0.2rem;
    border-top: ${({ $isHigh }) =>
      $isHigh ? "0.1rem solid var(--gray40)" : "0"};
  }

  &::after {
    content: "";
    position: absolute;
    display: ${({ $hasDrop }) => ($hasDrop ? "block" : "none")};
    right: -1px;
    top: 0.2rem;
    height: 0.5rem;
    border-right: 0.1rem solid var(--gray40);
  }
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
