import React from "react";
import styled from "styled-components";
import Button from "../Button/Button";
import { FONT_SIZE } from "../../constants";
import {
  getAllVocabularyForClassification,
  updateVocabularyCategories,
} from "../../services/words";
import { classifyWordCategories } from "../../services/ai";
import { normalizeCategories } from "../../constants/wordCategories";

const BATCH_SIZE = 25;

function DebugPage() {
  const [running, setRunning] = React.useState(false);
  const [redoAll, setRedoAll] = React.useState(false);
  const [log, setLog] = React.useState([]);
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  function appendLog(line) {
    setLog((cur) => [...cur, line]);
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
