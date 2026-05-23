import {
  AddPhraseSetDialog,
  DeletePhraseSetDialog,
  EditPhraseSetDialog,
  JoinPhraseSetDialog,
} from "./PhraseSetActions";

const phraseSet = {
  id: 12,
  name: "N2 core vocabulary",
  description: "Shared practice set",
  creator: "Storybook",
  status: "open",
  privacy: "public",
  owner_id: "user-1",
  user_id: "user-1",
};

export default {
  title: "Components/PhraseSetActions",
};

export const Actions = {
  render: () => (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
      <AddPhraseSetDialog />
      <EditPhraseSetDialog selectedPhraseSet={phraseSet} currentUserId="user-1" />
      <DeletePhraseSetDialog selectedPhraseSets={[phraseSet]} currentUserId="user-1" />
      <JoinPhraseSetDialog phraseSet={phraseSet} />
    </div>
  ),
};
