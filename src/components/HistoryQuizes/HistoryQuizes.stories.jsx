import HistoryQuizes from "./HistoryQuizes";

export default {
  title: "Components/HistoryQuizes",
  component: HistoryQuizes,
};

export const Filled = {
  render: () => (
    <HistoryQuizes
      historyQuizes={[
        { id: 1, rawSentence: "Watashi wa {nihongo} o benkyou shimasu." },
        { id: 2, rawSentence: "Ashita {toshoshitsu} e ikimasu." },
        { id: 3, rawSentence: "Kono hon wa {omoshiroi} desu." },
      ]}
    />
  ),
};

export const Empty = {
  render: () => <HistoryQuizes historyQuizes={[]} />,
};
