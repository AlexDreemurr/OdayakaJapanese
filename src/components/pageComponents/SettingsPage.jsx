import React from "react";
import styled from "styled-components";
import { HashLoader } from "react-spinners";
import usePhraseSets from "../../hooks/usePhraseSets";
import Message from "../Message";
import PhraseSetCard from "../PhraseSetCard";
import {
  getStoredSharedDictSetIds,
  storeSharedDictSetIds,
} from "../../sharedDictSettings";
import { FONT_SIZE, QUERIES } from "../../constants";
import ProgressBar from "../ProgressBar";
import { KatakanaRateContext } from "../../KatakanaRateContext";
import { useAuth } from "../../hooks/useAuth";
import UserProfileCard from "../UserProfileCard";

function SettingsPage({ resetAnswerToast }) {
  const { phraseSets, status } = usePhraseSets();
  const [selectedSetIds, setSelectedSetIds] = React.useState([]);
  const { katakanaRate, setKatakanaRate } =
    React.useContext(KatakanaRateContext);

  const { user, isLoggedIn, signOut } = useAuth();

  React.useEffect(() => {
    if (status !== "ok") {
      return;
    }

    const availableIds = phraseSets.map((phraseSet) => phraseSet.id);
    const storedIds = getStoredSharedDictSetIds();
    const initialIds =
      storedIds === null
        ? availableIds
        : storedIds.filter((id) => availableIds.includes(id));
    const safeIds = initialIds.length > 0 ? initialIds : availableIds;

    setSelectedSetIds(safeIds);
    storeSharedDictSetIds(safeIds);
  }, [phraseSets, status]);

  function handleToggle(setId) {
    setSelectedSetIds((currentSetIds) => {
      const isSelected = currentSetIds.includes(setId);
      const nextSetIds = isSelected
        ? currentSetIds.filter((currentSetId) => currentSetId !== setId)
        : [...currentSetIds, setId];

      if (nextSetIds.length === 0) {
        return currentSetIds;
      }

      storeSharedDictSetIds(nextSetIds);
      resetAnswerToast();
      return nextSetIds;
    });
  }

  function handleKatakanaRateChange(nextValue) {
    setKatakanaRate(nextValue / 100);
  }

  return (
    <Wrapper>
      <Title>设置</Title>
      <FeatureBlock>
        <UserProfileCard
          user={user}
          isLoggedIn={isLoggedIn}
          signOut={signOut}
        />
      </FeatureBlock>

      <FeatureBlock>
        <Description>切换显示假名的比例</Description>
        <RateControl>
          <ProgressBar
            size="small"
            value={katakanaRate * 100}
            onChange={handleKatakanaRateChange}
            ariaLabel="切换显示假名的比例"
          />
          <RateValue>{Math.round(katakanaRate * 100)}%</RateValue>
        </RateControl>
      </FeatureBlock>

      <FeatureBlock>
        <Description>
          点击词汇集卡片来设置“共享单词练习”的题库范围。
        </Description>

        {status === "busy" && (
          <PhraseSetsLoadingWrapper>
            <HashLoader />
          </PhraseSetsLoadingWrapper>
        )}
        {status === "error" && (
          <Message type="error">词汇集加载失败，请稍后重试。</Message>
        )}
        {status === "ok" && (
          <CardGrid>
            {phraseSets.map((phraseSet) => {
              const isSelected = selectedSetIds.includes(phraseSet.id);

              return (
                <SelectableCard
                  key={phraseSet.id}
                  type="button"
                  phraseSet={phraseSet}
                  aria-pressed={isSelected}
                  data-selected={isSelected}
                  data-status={isSelected ? "已包含" : "未包含"}
                  onClick={() => handleToggle(phraseSet.id)}
                />
              );
            })}
          </CardGrid>
        )}
      </FeatureBlock>
    </Wrapper>
  );
}

const Wrapper = styled.main`
  width: 100%;
  max-width: 800px;
  padding: 2rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1rem;
`;

const FeatureBlock = styled.section`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: ${FONT_SIZE.giant};
  /* margin-bottom: 0.5rem; */
`;

const Description = styled.p`
  color: var(--gray40);
  font-size: ${FONT_SIZE.default};
`;

const RateControl = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) 3rem;
  align-items: center;
  gap: 0.75rem;
`;

const RateValue = styled.span`
  color: var(--gray15);
  font-size: ${FONT_SIZE.default};
  font-variant-numeric: tabular-nums;
  text-align: right;
`;

const CardGrid = styled.div`
  margin-top: 0.5rem;
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${QUERIES.tabletAndUp} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media ${QUERIES.laptopAndUp} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

const PhraseSetsLoadingWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
`;

const SelectableCard = styled(PhraseSetCard)`
  width: 100%;
  height: 112px;
  font-size: ${FONT_SIZE.small};
  transition: box-shadow 120ms ease, opacity 120ms ease;

  &[data-selected="true"] {
    box-shadow: 0 0 0 2px var(--gray95), 0 0 0 5px var(--green15);
  }

  &[data-selected="false"] {
    opacity: 0.58;
  }

  &::after {
    content: attr(data-status);
    position: absolute;
    left: 0.5rem;
    bottom: 0.4rem;
    font-size: 0.75rem;
    line-height: 1.3;
    padding: 0.05rem 0.35rem;
    border-radius: 999px;
    background-color: var(--gray95);
    color: var(--gray15);
  }
`;

export default SettingsPage;
