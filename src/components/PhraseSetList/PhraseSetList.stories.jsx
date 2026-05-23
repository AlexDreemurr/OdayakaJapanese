import PhraseSetList from "./PhraseSetList";

const phraseSets = [
  {
    id: 1,
    name: "N5 basics",
    description: "Starter words and expressions.",
    count: 48,
    created_at: "2026-05-06T10:00:00.000Z",
    privacy: "public",
  },
  {
    id: 2,
    name: "N2 core",
    description: "Common words for reading practice.",
    count: 128,
    created_at: "2026-05-08T10:00:00.000Z",
    privacy: "private",
  },
  {
    id: 3,
    name: "Travel",
    description: "Useful words for stations, hotels, and restaurants.",
    count: 72,
    created_at: "2026-05-10T10:00:00.000Z",
    privacy: "public",
  },
];

export default {
  title: "Components/PhraseSetList",
  component: PhraseSetList,
  argTypes: {
    selectionMode: { control: "boolean" },
    variant: { control: "select", options: ["fluid", "compact"] },
    cardSize: { control: "select", options: ["default", "small"] },
  },
  args: {
    selectionMode: false,
    variant: "fluid",
    cardSize: "default",
  },
};

export const Playground = {
  render: (args) => (
    <PhraseSetList
      {...args}
      phraseSets={phraseSets}
      selectedPhraseSetIds={[2]}
      onSelectionChange={() => {}}
      onPhraseSetClick={args.selectionMode ? undefined : () => {}}
    />
  ),
};

export const Empty = {
  render: () => <PhraseSetList phraseSets={[]} />,
};
