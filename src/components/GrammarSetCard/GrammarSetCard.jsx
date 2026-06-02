/**
 * GrammarSetCard
 * 语法集卡片，对应 PhraseSetCard，链接到 /grammarSet/:id。
 */

import React from "react";
import styled from "styled-components";
import { formatToChinaTime } from "../../utility";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import Icon from "../Icon/Icon";
import LinkWrapper from "../LinkWrapper/LinkWrapper";
import MyTooltip from "../MyTooltip/MyTooltip";
import { FONT_SIZE, QUERIES } from "../../constants";

function GrammarSetCard({
  grammarSet,
  to,
  selectionMode = false,
  selected = false,
  onSelectionChange,
  onOpen,
  size = "default",
  ...delegated
}) {
  const checkboxId = React.useId();
  const [showDescription, setShowDescription] = React.useState(false);
  const shouldShowDescription = !selectionMode && showDescription;
  const descriptionContent = (
    <DescriptionContent
      description={grammarSet.description}
      grammarSetId={grammarSet.id}
    />
  );

  function handleSelectionChange(checked) {
    onSelectionChange?.(grammarSet.id, checked);
  }

  function handleCardClick() {
    if (selectionMode) {
      handleSelectionChange(!selected);
      return;
    }
    if (onOpen) {
      onOpen(grammarSet);
    }
  }

  function handleCardKeyDown(event) {
    if (!selectionMode && !onOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (selectionMode) {
        handleSelectionChange(!selected);
      } else {
        onOpen(grammarSet);
      }
    }
  }

  return (
    <Wrapper
      role={selectionMode || onOpen ? "button" : undefined}
      tabIndex={selectionMode || onOpen ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      $selectionMode={selectionMode}
      $selected={selected}
      $showDescription={shouldShowDescription}
      $size={size}
      {...delegated}
    >
      {!selectionMode && to && (
        <CardLink to={to} aria-label={`打开${grammarSet.name}`} />
      )}
      <InfoWrapper $hidden={shouldShowDescription}>
        <Info>{formatToChinaTime(grammarSet.created_at)}</Info>
        <Info>{grammarSet.count}</Info>
      </InfoWrapper>

      <CardText $showDescription={shouldShowDescription}>
        {shouldShowDescription ? descriptionContent : grammarSet.name}
      </CardText>

      {grammarSet.privacy === "private" && (
        <PrivacyBadge aria-label="私有语法集">
          <Icon id="private" size={16} />
        </PrivacyBadge>
      )}

      {selectionMode ? (
        <Checkbox
          id={checkboxId}
          type="checkbox"
          checked={selected}
          aria-label={`选择${grammarSet.name}`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => handleSelectionChange(event.target.checked)}
        />
      ) : (
        <>
          <DesktopInfo>
            <MyTooltip trigger={<IconWrapper id="info" size={16} />}>
              {descriptionContent}
            </MyTooltip>
          </DesktopInfo>
          <MobileInfoButton
            type="button"
            aria-label={showDescription ? "返回语法集名称" : "查看语法集介绍"}
            onClick={(event) => {
              event.stopPropagation();
              setShowDescription((c) => !c);
            }}
          >
            <Icon id={showDescription ? "undo" : "info"} size={16} />
          </MobileInfoButton>
        </>
      )}
    </Wrapper>
  );
}

function DescriptionContent({ description, grammarSetId }) {
  return (
    <>
      <DescriptionText>{description || "---"}</DescriptionText>
      <DescriptionId>ID: {grammarSetId}</DescriptionId>
    </>
  );
}

/* ── styles ── */
const Wrapper = styled.div`
  width: 100%;
  height: ${(p) => (p.$size === "small" ? "112px" : "135px")};
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 1rem;
  background-color: var(--gray15);
  color: var(--gray85);
  &:hover { background-color: var(--gray25); }
  &:active { background-color: var(--gray40); }

  ${(p) =>
    p.$selectionMode &&
    `cursor: pointer;
     outline: ${p.$selected ? "3px solid var(--gray40)" : "none"};
     outline-offset: -3px;`}

  &:nth-of-type(2n) {
    background-color: var(--gray85);
    color: var(--gray15);
    &:hover { background-color: var(--gray75); }
    &:active { background-color: var(--gray60); }
  }

  @media ${QUERIES.tabletAndUp} {
    height: ${(p) => (p.$size === "small" ? "112px" : "150px")};
  }
`;
const CardLink = styled(LinkWrapper)`
  position: absolute; inset: 0;
  border-radius: inherit;
  background-color: transparent;
  text-decoration: none;
`;
const IconWrapper = styled(Icon)`display: block;`;
const DesktopInfo = styled.div`
  display: none;
  position: absolute; right: 0.5rem; bottom: 0.45rem;
  @media (hover: hover) and (pointer: fine) { display: block; }
`;
const MobileInfoButton = styled(UnstyledButton)`
  position: absolute; right: 0.5rem; bottom: 0.45rem;
  padding: 0.45rem;
  transform: translate(0.45rem, 0.45rem);
  @media (hover: hover) and (pointer: fine) { display: none; }
`;
const PrivacyBadge = styled.div`
  position: absolute; right: 0.9rem; bottom: 0.45rem;
  padding: 0.45rem;
  transform: translate(-0.45rem, 0.45rem);
  pointer-events: none;
`;
const CardText = styled.p`
  position: relative;
  width: 100%;
  max-height: ${(p) => (p.$showDescription ? "calc(100% - 2rem)" : "none")};
  box-sizing: border-box;
  padding: ${(p) => (p.$showDescription ? "0 1.5rem" : "0 1.25rem")};
  overflow-x: hidden;
  overflow-y: ${(p) => (p.$showDescription ? "auto" : "visible")};
  overscroll-behavior: contain;
  text-align: center;
  font-size: ${FONT_SIZE.small};
  line-height: 1.5;
  overflow-wrap: anywhere;
  pointer-events: ${(p) => (p.$showDescription ? "auto" : "none")};
`;
const DescriptionText = styled.span`display: block; font-size: inherit; line-height: inherit;`;
const DescriptionId = styled.strong`display: block; font-size: inherit; line-height: inherit; font-weight: 700;`;
const Checkbox = styled.input`
  position: absolute; right: 0.55rem; bottom: 0.5rem;
  width: 1rem; height: 1rem; margin: 0; cursor: pointer;
`;
const InfoWrapper = styled.div`
  width: 100%; position: absolute;
  padding: 0.4rem 0.6rem; top: 0; left: 0;
  display: ${(p) => (p.$hidden ? "none" : "flex")};
  justify-content: space-between;
  pointer-events: none;
`;
const Info = styled.p`font-size: 0.8rem;`;

export default GrammarSetCard;
