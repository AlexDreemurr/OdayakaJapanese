import IconActionDropdown from "./IconActionDropdown";

export default {
  title: "Components/IconActionDropdown",
  component: IconActionDropdown,
};

export const Playground = {
  render: () => (
    <div style={{ minHeight: "12rem", display: "flex", justifyContent: "end" }}>
      <IconActionDropdown
        label="More actions"
        actions={[
          { icon: "plus", label: "Add", onSelect: () => {} },
          { icon: "edit", label: "Edit", onSelect: () => {} },
          { icon: "remove", label: "Delete", onSelect: () => {} },
        ]}
      />
    </div>
  ),
};
