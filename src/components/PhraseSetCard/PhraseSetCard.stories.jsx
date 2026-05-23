import React from "react";
import PhraseSetCard from "./PhraseSetCard";

function PhraseSetCardStory(args) {
  const [selected, setSelected] = React.useState(args.selected);
  const phraseSet = {
    id: 1,
    name: args.name,
    description: args.description,
    count: args.count,
    created_at: args.created_at,
  };

  React.useEffect(() => {
    setSelected(args.selected);
  }, [args.selected]);

  return (
    <div style={{ width: "min(100%, 14rem)" }}>
      <PhraseSetCard
        phraseSet={phraseSet}
        to="/phraseSetList/1"
        selectionMode={args.selectionMode}
        selected={selected}
        onSelectionChange={(_, checked) => setSelected(checked)}
      />
    </div>
  );
}

export default {
  title: "Components/PhraseSetCard",
  component: PhraseSetCard,
  argTypes: {
    name: {
      control: "text",
    },
    description: {
      control: "text",
    },
    count: {
      control: { type: "number", min: 0, step: 1 },
    },
    created_at: {
      control: "text",
    },
    selectionMode: {
      control: "boolean",
    },
    selected: {
      control: "boolean",
    },
  },
  args: {
    name: "N2 核心词汇",
    description: "适合用于语法练习和共享词汇练习的常用表达。",
    count: 128,
    created_at: "2026-05-06T10:00:00.000Z",
    selectionMode: false,
    selected: false,
  },
};

export const Playground = {
  render: (args) => <PhraseSetCardStory {...args} />,
};
