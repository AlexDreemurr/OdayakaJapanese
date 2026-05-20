import styled from "styled-components";
import { FONT_FAMILY } from "../constants";

const SMALL_KANA = new Set(
  "ぁぃぅぇぉゃゅょゎァィゥェォャュョヮㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ"
);

function getPitchNumber(pitch) {
  if (pitch === null || pitch === undefined || pitch === "") {
    return null;
  }

  const pitchNumber = Number(pitch);
  return Number.isInteger(pitchNumber) && pitchNumber >= 0 ? pitchNumber : null;
}

export function getMoras(reading = "") {
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

function PitchReading({ reading, pitch, className }) {
  const pitchNumber = getPitchNumber(pitch);
  const moras = getMoras(reading);

  if (pitchNumber === null || moras.length === 0) {
    return <Reading className={className}>{reading}</Reading>;
  }

  const dropAfter =
    pitchNumber > 0 && pitchNumber <= moras.length ? pitchNumber - 1 : null;

  return (
    <Reading
      as="span"
      className={className}
      aria-label={`${reading}，音调型 ${pitchNumber}`}
    >
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

const Reading = styled.span`
  color: inherit;
  font-family: ${FONT_FAMILY.japanese_primary};
`;

const Mora = styled.span`
  position: relative;
  display: inline-block;
  padding-top: 0.28em;
  line-height: 1.15;

  &::before {
    content: "";
    position: absolute;
    left: -0.03em;
    right: ${({ $hasDrop }) => ($hasDrop ? "0" : "-1px")};
    top: 0.25rem;
    border-top: ${({ $isHigh }) =>
      $isHigh ? "0.05rem solid currentColor" : "0"};
  }

  &::after {
    content: "";
    position: absolute;
    display: ${({ $hasDrop }) => ($hasDrop ? "block" : "none")};
    right: calc(-1px + 0.03em);
    top: 0.25rem;
    height: 0.5rem;
    border-right: 0.05rem solid currentColor;
  }
`;

export default PitchReading;
