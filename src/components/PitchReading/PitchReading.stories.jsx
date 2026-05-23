import PitchReading from "./PitchReading";

export default {
  title: "Components/PitchReading",
  component: PitchReading,
  argTypes: {
    reading: { control: "text" },
    pitch: { control: { type: "number", min: 0, step: 1 } },
  },
  args: {
    reading: "hashi",
    pitch: 1,
  },
};

export const Playground = {
  render: (args) => (
    <p style={{ color: "var(--gray15)", fontSize: "2rem" }}>
      <PitchReading {...args} />
    </p>
  ),
};

export const Gallery = {
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        color: "var(--gray15)",
        fontSize: "1.5rem",
      }}
    >
      {[0, 1, 2, 3].map((pitch) => (
        <p key={pitch}>
          {pitch}: <PitchReading reading="nihongo" pitch={pitch} />
        </p>
      ))}
      <p>
        plain: <PitchReading reading="unknown" pitch="" />
      </p>
    </div>
  ),
};
