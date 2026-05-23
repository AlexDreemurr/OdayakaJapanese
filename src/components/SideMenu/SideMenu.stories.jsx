import SideMenu from "./SideMenu";

export default {
  title: "Components/SideMenu",
  component: SideMenu,
};

export const Playground = {
  render: () => (
    <div
      style={{
        minHeight: "18rem",
        display: "flex",
        justifyContent: "end",
        background: "var(--gray15)",
        padding: "1rem",
      }}
    >
      <SideMenu />
    </div>
  ),
};
