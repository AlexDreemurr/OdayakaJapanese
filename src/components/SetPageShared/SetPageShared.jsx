/**
 * SetPageShared
 * 词汇集与语法集详情页共用的 UI 原语：标题栏（SetHeader）和列表行（SetItem）。
 */

import React from "react";
import styled from "styled-components";
import { Star } from "lucide-react";
import { FONT_FAMILY, FONT_SIZE, QUERIES } from "../../constants";
import Icon from "../Icon/Icon";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import IconInput from "../IconInput/IconInput";
import IconActionDropdown from "../IconActionDropdown/IconActionDropdown";

// ── HeaderIcon ─────────────────────────────────────────────────────────────────
// 标题栏图标按钮，统一 padding
export const HeaderIcon = styled(Icon)`
  padding: 0.8rem;
`;

// ── SetHeader ──────────────────────────────────────────────────────────────────
// 词汇集/语法集详情页的顶部标题栏。
// desktopActions: ReactNode  — 搜索图标之后的桌面端操作按钮
// mobileActions:  array      — 移动端 IconActionDropdown 的 actions 数组
export function SetHeader({
  title,
  onBack,
  isSearching,
  searchValue,
  searchPlaceholder = "搜索...",
  onSearchToggle,
  onSearchChange,
  desktopActions,
  mobileActions,
}) {
  return (
    <HeaderBar>
      <UnstyledButton onClick={onBack}>
        <HeaderIcon id="arrowLeft" size="1.3rem" color="var(--gray15)" />
      </UnstyledButton>

      <TitleArea>
        {isSearching ? (
          <IconInput
            label="搜索"
            size="large"
            width="100%"
            value={searchValue}
            placeholder={searchPlaceholder}
            autoFocus
            style={{ backgroundColor: "transparent" }}
            onChange={onSearchChange}
            onKeyDown={(e) => {
              if (e.key === "Escape") onSearchToggle();
            }}
          />
        ) : (
          <TitleText>{title}</TitleText>
        )}
      </TitleArea>

      <DesktopActions>
        <UnstyledButton
          onClick={onSearchToggle}
          aria-label={isSearching ? "关闭搜索" : "搜索"}
        >
          <HeaderIcon
            id={isSearching ? "close" : "search"}
            size="1.3rem"
            color="var(--gray15)"
          />
        </UnstyledButton>
        {desktopActions}
      </DesktopActions>

      <MobileActions>
        <UnstyledButton
          onClick={onSearchToggle}
          aria-label={isSearching ? "关闭搜索" : "搜索"}
        >
          <HeaderIcon
            id={isSearching ? "close" : "search"}
            size="1.3rem"
            color="var(--gray15)"
          />
        </UnstyledButton>
        {mobileActions && <IconActionDropdown actions={mobileActions} />}
      </MobileActions>
    </HeaderBar>
  );
}

// ── StarDisplay ────────────────────────────────────────────────────────────────
// 4 颗星标显示，亮星 = 已完成（答对至少一次）
export function StarDisplay({ completedCount = 0 }) {
  return (
    <AwardWrapper aria-label="sentence completion stars">
      {Array.from({ length: 4 }, (_, i) => {
        const done = i < completedCount;
        return (
          <StarIcon
            key={i}
            color={done ? "var(--gold15)" : "var(--gray60)"}
            fill={done ? "var(--gold75)" : "none"}
            strokeWidth={1.2}
            size={18}
          />
        );
      })}
    </AwardWrapper>
  );
}

// ── SetItem ────────────────────────────────────────────────────────────────────
// 词汇集/语法集通用列表行，可作为 Radix Dialog.Trigger asChild 的目标。
//
// primary:        主文本（必填），使用 textIndent
// secondary:      副文本（可选），超出时截断
// textIndent:     主文本缩进，默认 "2rem"
// showStars:      是否显示星标
// completedCount: 已完成句子数（0-4）
// badge:          右侧徽章 ReactNode（与 showStars 互斥，showStars 优先）
export const SetItem = React.forwardRef(function SetItem(
  {
    primary,
    secondary,
    textIndent = "2rem",
    showStars,
    completedCount = 0,
    badge,
    ...delegated
  },
  ref
) {
  const hasSecondary = secondary != null && secondary !== "";
  const hasRight = showStars || badge;

  return (
    <ItemRow ref={ref} {...delegated}>
      <PrimaryText style={{ textIndent }}>{primary}</PrimaryText>

      {/* 副文本或弹性占位（保证右侧内容始终贴右） */}
      {hasSecondary ? (
        <SecondaryText>{secondary}</SecondaryText>
      ) : hasRight ? (
        <FlexSpacer />
      ) : null}

      {showStars ? (
        <StarDisplay completedCount={completedCount} />
      ) : badge ? (
        badge
      ) : null}
    </ItemRow>
  );
});

// ── Styled components ──────────────────────────────────────────────────────────

const HeaderBar = styled.div`
  position: sticky;
  top: var(--header-height);
  z-index: 5;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-left: 1rem;
  margin-right: 1rem;
  background-color: var(--bg);
  border-bottom: 1px solid var(--border);
`;
const TitleArea = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
`;
const TitleText = styled.p`
  font-size: 1.05rem;
  margin-left: 0.5rem;
  font-weight: 700;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;
const DesktopActions = styled.div`
  display: none;
  @media ${QUERIES.tabletAndUp} {
    display: flex;
  }
`;
const MobileActions = styled.div`
  display: flex;
  @media ${QUERIES.tabletAndUp} {
    display: none;
  }
`;

// SetItem styles
const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 1rem;
  padding: 0.55rem 1rem 0.45rem 0.5rem;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background-color 120ms ease;
  &:hover {
    background-color: var(--accent-soft);
  }
`;
const PrimaryText = styled.span`
  font-family: ${FONT_FAMILY.japanese_primary};
  font-size: ${FONT_SIZE.default};
  flex-shrink: 0;
  min-width: 0;
`;
const SecondaryText = styled.span`
  font-family: ${FONT_FAMILY.chinese_primary};
  font-size: ${FONT_SIZE.small};
  color: var(--gray40);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const FlexSpacer = styled.span`
  flex: 1;
`;
const AwardWrapper = styled.div`
  width: 96px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
`;
const StarIcon = styled(Star)`
  display: block;
`;
