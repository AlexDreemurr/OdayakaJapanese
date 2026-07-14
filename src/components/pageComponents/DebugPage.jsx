import React from "react";
import styled from "styled-components";
import Button from "../Button/Button";
import { FONT_SIZE } from "../../constants";
import {
  getAllVocabularyForClassification,
  updateVocabularyCategories,
  getVocabularyMissingAudio,
} from "../../services/words";
import { classifyWordCategories } from "../../services/ai";
import { generateAndStoreVocabAudio } from "../../services/vocabAudio";
import { normalizeCategories } from "../../constants/wordCategories";
import supabase from "../../supabaseClient";

const BATCH_SIZE = 25;

function DebugPage() {
  const [running, setRunning] = React.useState(false);
  const [redoAll, setRedoAll] = React.useState(false);
  const [log, setLog] = React.useState([]);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  // 音频批量生成
  const [audioRunning, setAudioRunning] = React.useState(false);
  const [audioLog, setAudioLog] = React.useState([]);
  const [audioProgress, setAudioProgress] = React.useState({ done: 0, total: 0 });

  // 当前登录状态（storage 写入必须为已登录用户）
  const [authInfo, setAuthInfo] = React.useState("（检查中…）");
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthInfo(
        data?.user ? `已登录：${data.user.email ?? data.user.id}` : "未登录"
      );
    });
  }, []);

  function appendLog(line) {
    setLog((cur) => [...cur, line]);
  }
  function appendAudioLog(line) {
    setAudioLog((cur) => [...cur, line]);
  }

  async function runAudioGeneration() {
    if (audioRunning) return;
    setAudioRunning(true);
    setAudioLog([]);
    setAudioProgress({ done: 0, total: 0 });

    try {
      // 上传需要登录态（storage 写策略仅允许 authenticated）
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        appendAudioLog("未登录：storage 写策略仅允许已登录用户，请先登录再运行。");
        setAudioRunning(false);
        return;
      }

      const { data, error } = await getVocabularyMissingAudio();
      if (error) {
        appendAudioLog(`读取缺失音频的词条失败：${error.message}`);
        setAudioRunning(false);
        return;
      }

      const targets = data ?? [];
      appendAudioLog(`需要生成音频的词条：${targets.length} 个。`);
      setAudioProgress({ done: 0, total: targets.length });

      // 并发处理多个词条（每个词条内部 5 段音频也是并行的），大幅提速
      const CONCURRENCY = 4;
      let ready = 0;
      let failed = 0;
      let done = 0;
      let nextIndex = 0;
      let aborted = false;

      async function worker() {
        while (!aborted) {
          const i = nextIndex++;
          if (i >= targets.length) break;

          const result = await generateAndStoreVocabAudio(targets[i]);
          if (result.status === "ready") {
            ready += 1;
          } else {
            failed += 1;
            if (failed <= 3 && result.error) {
              appendAudioLog(
                `失败：「${targets[i].word}」— ${result.error.message || result.error}`
              );
            }
          }

          done += 1;
          setAudioProgress({ done, total: targets.length });
          if (done % 10 === 0 || done === targets.length) {
            appendAudioLog(`进度 ${done}/${targets.length} · 成功 ${ready} · 失败 ${failed}`);
          }
          // 开头就连续失败，多半是 TTS 未启动 / 桶未建好，提前中止
          if (!aborted && done >= 5 && ready === 0) {
            aborted = true;
            appendAudioLog("连续失败，疑似 VoiceVox/TTS 未启动或桶未建好，已中止。");
          }
        }
      }

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker)
      );

      appendAudioLog(`完成！成功 ${ready}，失败/缺失 ${failed}。`);
    } catch (err) {
      appendAudioLog(`运行出错：${err.message}`);
    } finally {
      setAudioRunning(false);
    }
  }

  async function runClassification() {
    if (running) return;
    setRunning(true);
    setLog([]);
    setProgress({ done: 0, total: 0 });

    try {
      const { data, error } = await getAllVocabularyForClassification();
      if (error) {
        appendLog(`读取词条失败：${error.message}`);
        setRunning(false);
        return;
      }

      const all = data ?? [];
      const targets = redoAll
        ? all
        : all.filter((v) => normalizeCategories(v.categories).length === 0);

      appendLog(
        `共 ${all.length} 个词条，需要分类 ${targets.length} 个（${
          redoAll ? "全部重做" : "仅未分类"
        }）。`
      );
      setProgress({ done: 0, total: targets.length });

      let okCount = 0;
      let forbiddenCount = 0;
      let errorCount = 0;

      for (let i = 0; i < targets.length; i += BATCH_SIZE) {
        const batch = targets.slice(i, i + BATCH_SIZE);
        let classified;
        try {
          classified = await classifyWordCategories(batch);
        } catch (err) {
          errorCount += batch.length;
          appendLog(`第 ${i / BATCH_SIZE + 1} 批分类失败：${err.message}`);
          setProgress({ done: Math.min(i + batch.length, targets.length), total: targets.length });
          continue;
        }

        for (const item of batch) {
          const cats = classified[String(item.id)];
          if (!cats || cats.length === 0) {
            errorCount += 1;
            continue;
          }
          const { data: rpcResult, error: rpcError } =
            await updateVocabularyCategories(item.id, cats);
          if (rpcError) {
            errorCount += 1;
          } else if (rpcResult === "ok") {
            okCount += 1;
          } else if (rpcResult === "forbidden") {
            forbiddenCount += 1;
          } else {
            errorCount += 1;
          }
        }

        setProgress({
          done: Math.min(i + batch.length, targets.length),
          total: targets.length,
        });
        appendLog(
          `进度 ${Math.min(i + batch.length, targets.length)}/${targets.length} · 成功 ${okCount} · 无权限 ${forbiddenCount} · 失败 ${errorCount}`
        );
      }

      appendLog(
        `完成！成功 ${okCount}，无权限跳过 ${forbiddenCount}，失败 ${errorCount}。`
      );
    } catch (err) {
      appendLog(`运行出错：${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;
  const audioPct =
    audioProgress.total > 0
      ? Math.round((audioProgress.done / audioProgress.total) * 100)
      : 0;

  return (
    <Wrapper>
      <Panel>
        <Title>开发者调试页</Title>
        <Description>仅本地可见。这里可以放一次性维护脚本。</Description>

        <PreviewArea>
          <SectionTitle>批量生成词性分类（DeepSeek）</SectionTitle>
          <Description>
            读取数据库全部词条，调用 DeepSeek 生成词性分类并写回。需先在 SQL
            editor 运行 categories 迁移；只会写入你有编辑权限的词汇集。
          </Description>

          <CheckRow>
            <input
              id="redo-all"
              type="checkbox"
              checked={redoAll}
              disabled={running}
              onChange={(e) => setRedoAll(e.target.checked)}
            />
            <label htmlFor="redo-all">重新分类全部（否则只处理未分类的）</label>
          </CheckRow>

          <ButtonRow>
            <Button type="primary" onClick={runClassification} disabled={running}>
              {running ? `分类中… ${pct}%` : "开始批量分类"}
            </Button>
          </ButtonRow>

          {progress.total > 0 && (
            <ProgressTrack>
              <ProgressFill style={{ width: `${pct}%` }} />
            </ProgressTrack>
          )}

          <LogBox>
            {log.length === 0 ? (
              <LogLine $muted>暂无输出</LogLine>
            ) : (
              log.map((line, i) => <LogLine key={i}>{line}</LogLine>)
            )}
          </LogBox>
        </PreviewArea>

        <PreviewArea>
          <SectionTitle>批量生成音频（VoiceVox）</SectionTitle>
          <Description>
            为缺少音频的词条生成「单词 + 4 例句」音频并存入 storage。需先运行
            vocab_audio 迁移并本地启动 VoiceVox / TTS 服务；只会写入你有编辑权限的词汇集。
          </Description>
          <Description>
            当前登录状态：<strong>{authInfo}</strong>（storage 写入策略仅允许已登录用户）
          </Description>

          <ButtonRow>
            <Button type="primary" onClick={runAudioGeneration} disabled={audioRunning}>
              {audioRunning ? `生成中… ${audioPct}%` : "开始批量生成音频"}
            </Button>
          </ButtonRow>

          {audioProgress.total > 0 && (
            <ProgressTrack>
              <ProgressFill style={{ width: `${audioPct}%` }} />
            </ProgressTrack>
          )}

          <LogBox>
            {audioLog.length === 0 ? (
              <LogLine $muted>暂无输出</LogLine>
            ) : (
              audioLog.map((line, i) => <LogLine key={i}>{line}</LogLine>)
            )}
          </LogBox>
        </PreviewArea>
      </Panel>
    </Wrapper>
  );
}

const Wrapper = styled.main`
  width: 100%;
  min-height: calc(100vh - var(--header-height) * 2);
  padding: 2rem 1rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
`;
const Panel = styled.section`
  width: min(100%, 960px);
  display: grid;
  gap: 0.5rem;
`;
const Title = styled.h1`
  font-size: ${FONT_SIZE.large};
  color: var(--text);
`;
const Description = styled.p`
  color: var(--text-secondary);
  font-size: ${FONT_SIZE.small};
`;
const PreviewArea = styled.div`
  min-height: 320px;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 0.85rem;
  background: var(--surface);
  display: grid;
  align-content: start;
  gap: 0.75rem;
`;
const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
`;
const CheckRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: ${FONT_SIZE.small};
  color: var(--text-secondary);
`;
const ButtonRow = styled.div`
  max-width: 240px;
`;
const ProgressTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background-color: var(--gray85);
  overflow: hidden;
`;
const ProgressFill = styled.div`
  height: 100%;
  background-color: var(--accent);
  transition: width 200ms ease;
`;
const LogBox = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  background-color: var(--gray95);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;
const LogLine = styled.p`
  font-size: ${FONT_SIZE.tiny};
  font-family: monospace;
  color: ${(p) => (p.$muted ? "var(--text-muted)" : "var(--text)")};
`;

export default DebugPage;
