import PhraseDialog from "./PhraseDialog";

const phrase = {
  id: 1,
  word: "benkyou",
  reading: "benkyou",
  pitch: 0,
  meaning: "study",
  contributor_name: "Storybook",
  created_at: "2026-05-06T10:00:00.000Z",
  practiceCorrectCounts: [1, 0, 2, 4],
};

export default {
  title: "Components/PhraseDialog",
  component: PhraseDialog,
  argTypes: {
    showKana: { control: "boolean" },
    showStars: { control: "boolean" },
    canEdit: { control: "boolean" },
  },
  args: {
    showKana: false,
    showStars: true,
    canEdit: false,
  },
};

export const Playground = {
  render: (args) => (
    <div style={{ maxWidth: "32rem" }}>
      <PhraseDialog phrase={phrase} textIndent="2rem" {...args} />
    </div>
  ),
};
