import React from "react";
import styled from "styled-components";
import {
  SABER,
  RIN,
  DEFAULT,
  FONT_FAMILY,
  FONT_SIZE,
  QUERIES,
} from "../../constants/index";

const GOOD_HINT_1 = [
  "すげぇー！",
  "完璧な答え！",
  "パーフェクトアンサー",
  "その通り！",
  "",
];

const STYLE = {
  default: {
    "--color": "var(--gray75)",
    "--backgroundColor": "var(--gray15)",
  },
  correct: {
    "--color": "var(--green75)",
    "--backgroundColor": "var(--green30)",
  },
  wrong: {
    "--color": "var(--red75)",
    "--backgroundColor": "var(--red30)",
  },
  continuousCorrect: {
    "--color": "var(--gold75)",
    "--backgroundColor": "var(--gold30)",
  },
};

const CHARACTER = {
  rin: RIN,
  saber: SABER,
  default: DEFAULT,
};

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function CharacterToast({
  status,
  character = "default",
  phase = "entering",
  onAnimationEnd,
}) {
  const Sentence = React.useMemo(
    () => randomChoice(CHARACTER[character][status]),
    [character, status]
  );
  let Style = STYLE.default;
  switch (status) {
    case "wrong":
      Style = STYLE.wrong;
      break;
    case "correct1":
      Style = STYLE.correct;
      break;
    default:
      Style = STYLE.continuousCorrect;
      break;
  }

  return (
    <Wrapper $phase={phase} onAnimationEnd={onAnimationEnd} style={Style}>
      {Sentence}
    </Wrapper>
  );
}

export function CharacterToastOverlay({ answerToast, position = "fixed" }) {
  const answerToastStatus = answerToast?.status ?? null;
  const [renderedToastStatus, setRenderedToastStatus] =
    React.useState(answerToastStatus);
  const [toastPhase, setToastPhase] = React.useState(
    answerToastStatus === null ? "idle" : "entering"
  );
  const shouldRenderToast = renderedToastStatus !== null;

  React.useEffect(() => {
    if (answerToastStatus !== null) {
      setRenderedToastStatus(answerToastStatus);
      setToastPhase("entering");
      return;
    }

    if (renderedToastStatus !== null) {
      setToastPhase("exiting");
    }
  }, [answerToast?.id, answerToastStatus, renderedToastStatus]);

  if (!shouldRenderToast) {
    return null;
  }

  return (
    <Overlay $position={position}>
      <CharacterToast
        status={renderedToastStatus}
        phase={toastPhase}
        onAnimationEnd={() => {
          if (toastPhase === "exiting") {
            setRenderedToastStatus(null);
            setToastPhase("idle");
          }
        }}
      />
    </Overlay>
  );
}

const Wrapper = styled.div`
  width: 100%;
  height: 4rem;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
  color: var(--color);
  background-color: var(--backgroundColor);
  white-space: nowrap;
  border-bottom-left-radius: 3rem;
  border-bottom-right-radius: 3rem;
  padding: 0.2rem 0.75rem;
  font-family: ${FONT_FAMILY.japanese_tertiary};
  font-size: ${FONT_SIZE.small};
  transition: background-color 260ms ease, color 260ms ease;
  animation: ${(p) =>
      p.$phase === "exiting" ? "toast-disappear" : "toast-appear"}
    ${(p) => (p.$phase === "exiting" ? "420ms" : "160ms")} ease-out both;

  @media ${QUERIES.tabletAndUp} {
    height: 5rem;
  }
  @media ${QUERIES.laptopAndUp} {
    height: 6rem;
  }
  @keyframes toast-appear {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes toast-disappear {
    from {
      opacity: 1;
      transform: translateY(0);
    }

    to {
      opacity: 0;
      transform: translateY(-100%);
    }
  }
`;

const Overlay = styled.div`
  position: ${(p) => p.$position};
  top: ${(p) => (p.$position === "fixed" ? "var(--header-height)" : "0")};
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 20;
`;

export default CharacterToast;
