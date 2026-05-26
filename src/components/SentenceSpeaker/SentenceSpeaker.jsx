import React from "react";
import styled from "styled-components";
import Icon from "../Icon/Icon";
import MyTooltip from "../MyTooltip/MyTooltip";
import { requestVoicevoxAudio } from "../../services/voicevoxTts";
import { DEFAULT_VOICEVOX_SPEAKER } from "../../constants/voicevoxSpeakers";

function SentenceSpeaker({ sentence, speaker = DEFAULT_VOICEVOX_SPEAKER }) {
  const [status, setStatus] = React.useState("idle");
  const audioRef = React.useRef(null);
  const audioUrlRef = React.useRef(null);
  const isLoading = status === "loading";
  const isPlaying = status === "playing";
  const isBusy = isLoading || isPlaying;
  const hasError = status === "error";

  const cleanupAudio = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  React.useEffect(() => cleanupAudio, [cleanupAudio]);

  async function handleClick() {
    if (isBusy) {
      return;
    }

    cleanupAudio();
    setStatus("loading");

    try {
      const blob = await requestVoicevoxAudio(sentence, { speaker });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      audioUrlRef.current = audioUrl;

      audio.addEventListener(
        "ended",
        () => {
          cleanupAudio();
          setStatus("idle");
        },
        { once: true }
      );

      audio.addEventListener(
        "error",
        () => {
          cleanupAudio();
          setStatus("error");
        },
        { once: true }
      );

      await audio.play();
      setStatus("playing");
    } catch (error) {
      console.error(error);
      cleanupAudio();
      setStatus("error");
    }
  }

  return (
    <Wrapper>
      <MyTooltip
        trigger={
          <SpeakerButton
            type="button"
            onClick={handleClick}
            disabled={isBusy || hasError}
            data-error={hasError}
            aria-label="朗读句子"
          >
            <Icon
              id={hasError ? "ban" : isBusy ? "loader" : "volume"}
              color={hasError ? "var(--red15)" : undefined}
              size={18}
            />
          </SpeakerButton>
        }
      >
        {hasError && "错误"}
        {!hasError && isLoading && "生成中..."}
        {!hasError && isPlaying && "播放中..."}
        {!hasError && !isBusy && "朗读"}
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
