import React from "react";
import styled from "styled-components";
import Icon from "../Icon/Icon";
import MyTooltip from "../MyTooltip/MyTooltip";
import { playStoredOrBrowser, stopVocabAudio } from "../../services/vocabAudio";
import { getSentenceText } from "../../utility";

function SentenceSpeaker({ sentence, audioPath }) {
  const [status, setStatus] = React.useState("idle");
  const isPlaying = status === "playing";

  // 卸载时停止播放
  React.useEffect(() => () => stopVocabAudio(), []);

  async function handleClick() {
    if (isPlaying) {
      stopVocabAudio();
      setStatus("idle");
      return;
    }

    setStatus("playing");
    // 优先库里音频，没有则浏览器内置朗读
    await playStoredOrBrowser({
      path: audioPath,
      text: getSentenceText(sentence).replace(/[{}｛｝]/g, ""),
    });
    setStatus("idle");
  }

  return (
    <Wrapper>
      <MyTooltip
        trigger={
          <SpeakerButton type="button" onClick={handleClick} aria-label="朗读句子">
            <Icon id={isPlaying ? "loader" : "volume"} size={18} />
          </SpeakerButton>
        }
      >
        {isPlaying ? "播放中（点击停止）" : "朗读"}
      </MyTooltip>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  /* display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: -1.5rem;
  text-indent: 0; */
`;

const SpeakerButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--gray60);
  border-radius: 999px;
  background: var(--gray95);
  color: var(--gray15);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--gray85);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.65;
  }

  &:disabled[data-error="true"] {
    cursor: not-allowed;
    opacity: 1;
  }
`;

const ErrorText = styled.span`
  color: hsl(0deg 65% 45%);
  font-family: "Noto Sans SC", sans-serif;
  font-size: 0.8rem;
`;

export default SentenceSpeaker;
