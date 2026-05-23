import VisuallyHidden from "./VisuallyHidden";

export default {
  title: "Components/VisuallyHidden",
  component: VisuallyHidden,
};

export const Playground = {
  render: () => (
    <button type="button">
      Visible text
      <VisuallyHidden>Screen reader only details</VisuallyHidden>
    </button>
  ),
};
