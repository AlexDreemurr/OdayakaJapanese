import Header from "./Header";
import { CharacterToastOverlay } from "../CharacterToast/CharacterToast";

const statuses = [
  "none",
  "wrong",
  "correct1",
  "correct3",
  "correct5",
  "correct10",
  "correct20",
  "correct50",
];

function getAnswerToast(status) {
  if (status === "none") {
    return null;
  }

  return {
    id: status,
    status,
  };
}

function HeaderStory(args) {
  return (
    <div style={{ minHeight: "8rem", position: "relative", overflow: "hidden" }}>
      <style>{`header { position: static !important; }`}</style>
      <Header />
      <CharacterToastOverlay
        answerToast={getAnswerToast(args.status)}
        position="absolute"
      />
    </div>
  );
}

export default {
  title: "Components/Header",
  component: Header,
  argTypes: {
    status: {
      control: "select",
      options: statuses,
    },
  },
  args: {
    status: "correct1",
  },
};

export const ToastState = {
  render: (args) => <HeaderStory {...args} />,
};

export const Gallery = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "5rem" }}>
      <style>{`header { position: static !important; }`}</style>
      {statuses.map((status) => (
        <section
          key={status}
          style={{ position: "relative", minHeight: "8rem", overflow: "hidden" }}
        >
          <p
            style={{
              color: "var(--gray15)",
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            {status}
          </p>
          <Header />
          <CharacterToastOverlay
            answerToast={getAnswerToast(status)}
            position="absolute"
          />
        </section>
      ))}
    </div>
  ),
};
