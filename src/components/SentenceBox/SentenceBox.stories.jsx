import { PacmanLoader } from "react-spinners";
import SentenceBox from "./SentenceBox";

export default {
  title: "Components/SentenceBox",
  component: SentenceBox,
  argTypes: {
    children: { control: "text" },
    type: { control: "select", options: ["sentence", "translate", "loading"] },
  },
  args: {
    children: "Watashi wa {nihongo} o benkyou shimasu.",
    type: "sentence",
  },
};

export const Playground = {
  render: (args) => <SentenceBox {...args} />,
};

export const Gallery = {
  render: () => (
    <div style={{ maxWidth: "34rem" }}>
      <SentenceBox>Watashi wa {"{nihongo}"} o benkyou shimasu.</SentenceBox>
      <SentenceBox type="translate">I study Japanese.</SentenceBox>
      <SentenceBox type="loading">
        <PacmanLoader color="hsl(0deg 0% 95%)" />
        <span>Loading</span>
      </SentenceBox>
    </div>
  ),
};
