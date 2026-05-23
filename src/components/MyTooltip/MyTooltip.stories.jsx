import MyTooltip from "./MyTooltip";
import Icon from "../Icon/Icon";

export default {
  title: "Components/MyTooltip",
  component: MyTooltip,
};

export const Playground = {
  render: () => (
    <div style={{ minHeight: "8rem", display: "grid", placeItems: "center" }}>
      <MyTooltip trigger={<button type="button">Hover me</button>}>
        Extra details for this action.
      </MyTooltip>
    </div>
  ),
};

export const IconTrigger = {
  render: () => (
    <div style={{ minHeight: "8rem", display: "grid", placeItems: "center" }}>
      <MyTooltip trigger={<Icon id="info" size={20} />}>
        Description shown in a compact tooltip.
      </MyTooltip>
    </div>
  ),
};
