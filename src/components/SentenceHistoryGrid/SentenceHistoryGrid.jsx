import React from "react";
import styled from "styled-components";
import { FONT_SIZE } from "../../constants";
import Icon from "../Icon/Icon";
import SentenceBox from "../SentenceBox/SentenceBox";

/** 计算已完成（至少答对一次）的句子数量，上限 4。 */
export function getCompletedCount(correctCounts) {
  if (!Array.isArray(correctCounts)) return 0;
  return Math.min(
    4,
    correctCounts.slice(0, 4).filter((c) => Number(c) > 0).length
  );
}

/**
 * 展示最多 4 个练习句子格子：已完成的显示内容，未完成的显示锁定状态。
 * sentences 中的元素可以是字符串或 { text: string } 对象。
 * SentenceBox 会自动解析 {answer} 括号并高亮显示。
 */
function SentenceHistoryGrid({
  sentences = [],
  practiceCorrectCounts = [],
  audioPaths = [],
}) {
  return (
    <Grid>
      {Array.from({ length: 4 }, (_, index) => {
        const isCompleted = Number(practiceCorrectCounts?.[index]) > 0;
        const sentence = sentences?.[index];

        return isCompleted && sentence ? (
          <StyledSentenceBox key={index} audioPath={audioPaths?.[index]}>
            {sentence}
          </StyledSentenceBox>
        ) : (
          <LockedSlot key={index}>
            <Icon id="private" size="1.4rem" color="var(--gray95)" />
          </LockedSlot>
        );
      })}
    </Grid>
  );
}

const Grid = styled.div`
  display: grid;
  gap: 0.5rem;
  max-height: min(52vh, 24rem);
  overflow: auto;
  padding-right: 0.15rem;
  margin-top: 0.85rem;
  border-top: 1px solid var(--gray75);
  padding-top: 0.75rem;
`;
const StyledSentenceBox = styled(SentenceBox)`
  width: calc(100% - 0.5rem);
  box-sizing: border-box;
  font-size: ${FONT_SIZE.default};
  margin-bottom: 0;
`;
const LockedSlot = styled.div`
  width: calc(100% - 0.5rem);
  box-sizing: border-box;
  min-height: 4.6rem;
  display: grid;
  place-items: center;
  margin-bottom: 0;
  border-radius: 1rem;
  background-color: var(--gray15);
`;

export default SentenceHistoryGrid;
