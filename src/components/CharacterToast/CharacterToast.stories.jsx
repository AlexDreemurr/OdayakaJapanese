import CharacterToast from "./CharacterToast";

const statuses = [
  "wrong",
  "correct1",
  "correct3",
  "correct5",
  "correct10",
  "correct20",
  "correct50",
];

const characters = ["default", "rin", "saber"];
const phases = ["entering", "exiting"];

export default {
  title: "Components/CharacterToast",
  component: CharacterToast,
  argTypes: {
    status: {
      control: "select",
      options: statuses,
    },
    character: {
      control: "select",
      options: characters,
    },
    phase: {
      control: "select",
      options: phases,
    },
  },
  args: {
    status: "correct1",
    character: "default",
    phase: "entering",
  },
};

export const Playground = {
  render: (args) => <CharacterToast {...args} />,
};

export const Gallery = {
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
        gap: "1rem",
        alignItems: "start",
      }}
    >
      {characters.map((character) => (
        <section
          key={character}
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <h3 style={{ color: "var(--gray15)", fontSize: "1rem" }}>
            {character}
          </h3>
          {statuses.map((status) => (
            <CharacterToast
              key={`${character}-${status}`}
              status={status}
              character={character}
              phase="entering"
            />
          ))}
        </section>
      ))}
    </div>
  ),
};
