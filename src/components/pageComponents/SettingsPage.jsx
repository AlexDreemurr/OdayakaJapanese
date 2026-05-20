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
import Button from "../Button";
import PhraseSetList from "../PhraseSetList";
import {
  AddPhraseSetDialog,
  DeletePhraseSetDialog,
  EditPhraseSetDialog,
} from "../PhraseSetActions";
import PhraseSetMembersPanel from "../PhraseSetMembersPanel";
import Icon from "../Icon";
import UnstyledButton from "../UnstyledButton";

function SettingsPage({ resetAnswerToast }) {
  const {
    phraseSets,
    status,
    refetchPhraseSets: refetchAccessiblePhraseSets,
  } = usePhraseSets();
  const {
    phraseSets: createdPhraseSets,
    status: createdStatus,
    refetchPhraseSets: refetchCreatedPhraseSets,
  } = usePhraseSets({ scope: "created" });
  const {
    phraseSets: joinedPhraseSets,
    status: joinedStatus,
    refetchPhraseSets: refetchJoinedPhraseSets,
  } = usePhraseSets({ scope: "joined" });
  const [selectedSetIds, setSelectedSetIds] = React.useState([]);
  const [settingsView, setSettingsView] = React.useState("preferences");
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedManageSetIds, setSelectedManageSetIds] = React.useState([]);
  const [focusedManageSet, setFocusedManageSet] = React.useState(null);
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
    const safeIds =
      initialIds.length > 0
        ? initialIds
        : availableIds.length > 0
        ? [availableIds[0]]
        : [];

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

  function handleManageChanged() {
    setSelectedManageSetIds([]);
    setFocusedManageSet(null);
    refetchAccessiblePhraseSets();
    refetchCreatedPhraseSets();
    refetchJoinedPhraseSets();
  }

  const manageablePhraseSets = [...createdPhraseSets, ...joinedPhraseSets]
    .filter(
      (phraseSet, index, allPhraseSets) =>
        allPhraseSets.findIndex((item) => item.id === phraseSet.id) === index
    );
  const selectedManagePhraseSets = manageablePhraseSets.filter((phraseSet) =>
    selectedManageSetIds.includes(phraseSet.id)
  );
  const joinedOtherPhraseSets = joinedPhraseSets.filter((phraseSet) => {
    const ownerId = phraseSet.owner_id ?? phraseSet.user_id;
    return ownerId !== user?.id;
  });

  return (
    <Wrapper>
      <Title>设置</Title>
      <FeatureBlock>
        <UserProfileCard
          user={user}
          isLoggedIn={isLoggedIn}
          signOut={signOut}
          extraAction={
            <ManageButton
              onClick={() =>
                setSettingsView((current) =>
                  current === "preferences" ? "phraseSet" : "preferences"
                )
              }
            >
              {settingsView === "preferences" ? "词汇集管理" : "偏好设置"}
            </ManageButton>
          }
        />
      </FeatureBlock>

      {settingsView === "preferences" ? (
        <>
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
                      size="small"
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
        </>
      ) : (
        <FeatureBlock>
          <ManageActions>
            <EditPhraseSetDialog
              selectedPhraseSet={selectedManagePhraseSets[0] ?? null}
              currentUserId={user?.id ?? null}
              onChanged={handleManageChanged}
            />
            <DeletePhraseSetDialog
              selectedPhraseSets={selectedManagePhraseSets}
              currentUserId={user?.id ?? null}
              onChanged={handleManageChanged}
            />
            <AddPhraseSetDialog onChanged={handleManageChanged} />
            <SelectModeButton
              type="button"
              aria-label={selectionMode ? "退出选择模式" : "进入选择模式"}
              aria-pressed={selectionMode}
              onClick={() => {
                setSelectionMode((current) => !current);
                setSelectedManageSetIds([]);
              }}
              $active={selectionMode}
            >
              <Icon id="select" size="1.3rem" color="black" />
            </SelectModeButton>
          </ManageActions>

          <Description>你创建的词汇集</Description>
          {createdStatus === "busy" && (
            <PhraseSetsLoadingWrapper>
              <HashLoader size={32} />
            </PhraseSetsLoadingWrapper>
          )}
          {createdStatus === "error" && (
            <Message type="error">词汇集加载失败，请稍后重试。</Message>
          )}
          {createdStatus === "ok" && (
            <PhraseSetList
              phraseSets={createdPhraseSets}
              variant="fluid"
              cardSize="small"
              selectionMode={selectionMode}
              selectedPhraseSetIds={selectedManageSetIds}
              onSelectionChange={(phraseSetId, checked) =>
                setSelectedManageSetIds(checked ? [phraseSetId] : [])
              }
              onPhraseSetClick={(phraseSet) => setFocusedManageSet(phraseSet)}
            />
          )}

          <Description>你加入的词汇集</Description>
          {joinedStatus === "busy" && (
            <PhraseSetsLoadingWrapper>
              <HashLoader size={32} />
            </PhraseSetsLoadingWrapper>
          )}
          {joinedStatus === "error" && (
            <Message type="error">词汇集加载失败，请稍后重试。</Message>
          )}
          {joinedStatus === "ok" && (
            <PhraseSetList
              phraseSets={joinedOtherPhraseSets}
              variant="fluid"
              cardSize="small"
              selectionMode={selectionMode}
              selectedPhraseSetIds={selectedManageSetIds}
              onSelectionChange={(phraseSetId, checked) =>
                setSelectedManageSetIds(checked ? [phraseSetId] : [])
              }
              onPhraseSetClick={(phraseSet) => setFocusedManageSet(phraseSet)}
            />
          )}

          {focusedManageSet && (
            <PhraseSetMembersPanel
              phraseSet={focusedManageSet}
              currentUserId={user?.id ?? null}
              onClose={() => setFocusedManageSet(null)}
              onChanged={handleManageChanged}
            />
          )}
        </FeatureBlock>
      )}
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

const ManageButton = styled(Button)`
  width: 9rem;
  margin: 0;
  font-size: ${FONT_SIZE.small};
`;

const ManageActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.25rem;
`;

const SelectModeButton = styled(UnstyledButton)`
  padding: 0.8rem;
  color: black;
  border-radius: 1rem;
  background-color: ${(p) => (p.$active ? "var(--gray85)" : "transparent")};
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
  padding: 1.5rem 0;
`;

const SelectableCard = styled(PhraseSetCard)`
  width: 100%;
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
