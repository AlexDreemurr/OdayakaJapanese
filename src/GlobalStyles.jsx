import { createGlobalStyle } from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "./constants";

/**
 * GlobalStyles
 * 全站设计令牌（颜色 / 排版）。整体走「おだやか —— 纸与墨」的安静质感：
 * 暖白纸张底色、暖黑墨色文字，藍(indigo) 作为品牌 / 交互主色；
 * 绿 / 红 / 金保留语义（正确 / 错误 / 连击），并做了统一调和。
 *
 * 旧变量名（gray / green / red / gold）全部保留，只重新取值，
 * 因此所有引用这些变量的组件都会随之换肤；新增 indigo 与一组语义别名。
 */
const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    line-height: 1.6;
    font-size: ${FONT_SIZE.large};
    font-family: inherit;
  }

  html {
    font-family: ${FONT_FAMILY.chinese_primary}, serif;

    /* ── 中性色：暖纸 → 墨 ────────────────────────────────── */
    --gray95: hsl(38deg 30% 96.5%);  /* 纸张底色 */
    --gray85: hsl(36deg 22% 90%);    /* 浅表面 / 柔和按钮 / 描边 */
    --gray75: hsl(35deg 16% 81%);
    --gray60: hsl(33deg 11% 64%);    /* 次级描边 / 图标 */
    --gray40: hsl(30deg 9% 44%);     /* 次级文字 */
    --gray25: hsl(28deg 12% 25%);
    --gray15: hsl(26deg 16% 15%);    /* 墨色：页眉 / 主文字 / 深色按钮 */

    --transparentGray15: hsl(26deg 16% 12% / 0.5);

    /* ── 藍 indigo：品牌 / 交互主色 ───────────────────────── */
    --ai90: hsl(222deg 44% 92%);     /* 主色浅底 */
    --ai75: hsl(222deg 42% 80%);
    --ai45: hsl(223deg 56% 48%);     /* 主色：链接 / 选中 / 重点 */
    --ai30: hsl(224deg 52% 33%);     /* 主色加深：悬停 */
    --ai15: hsl(226deg 46% 20%);

    /* ── 绿：正确 / 成功 ─────────────────────────────────── */
    --green85: hsl(146deg 30% 88%);
    --green75: hsl(146deg 28% 74%);
    --green30: hsl(150deg 35% 28%);
    --green25: hsl(150deg 30% 24%);
    --green15: hsl(152deg 36% 18%);

    /* ── 红：错误 / 危险 ─────────────────────────────────── */
    --red85: hsl(6deg 55% 90%);
    --red75: hsl(6deg 50% 78%);
    --red30: hsl(6deg 50% 36%);
    --red25: hsl(6deg 48% 30%);
    --red15: hsl(6deg 50% 24%);

    /* ── 金：连击 / 成就 ─────────────────────────────────── */
    --gold85: hsl(43deg 70% 86%);
    --gold75: hsl(42deg 72% 70%);
    --gold30: hsl(38deg 65% 38%);
    --gold25: hsl(38deg 60% 30%);
    --gold15: hsl(36deg 45% 18%);

    /* ── 语义别名（推荐新代码使用）──────────────────────── */
    --bg: var(--gray95);
    --surface: hsl(40deg 36% 99%);   /* 卡片 / 内容面 */
    --surface-sunken: var(--gray95); /* 下沉面 */
    --border: hsl(36deg 18% 86%);
    --text: var(--gray15);
    --text-secondary: var(--gray40);
    --text-muted: var(--gray60);
    --accent: var(--ai45);
    --accent-soft: var(--ai90);
    --accent-strong: var(--ai30);

    --shadow-sm: 0 1px 2px hsl(26deg 16% 15% / 0.06);
    --shadow-md: 0 1px 2px hsl(26deg 16% 15% / 0.05), 0 6px 20px hsl(26deg 16% 15% / 0.06);

    --header-height: 3.5rem;

    background-color: var(--bg);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  body {
    background-color: var(--bg);
    color: var(--text);
    margin: 0;
  }
  html, body {
    height: 100%;
  }

  #root {
    height: 100%;
  }

  ::selection {
    background-color: var(--ai90);
    color: var(--ai15);
  }

  h1, h2, h3, h4, h5, h6, p {
    margin: 0;
    padding: 0;
  }
`;

export default GlobalStyles;
