import { createGlobalStyle } from "styled-components";
import { FONT_FAMILY, FONT_SIZE } from "./constants";

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    line-height: 1.75;
    font-size: ${FONT_SIZE.large};
    font-family: inherit;
    /* margin: 0;
    padding: 0; */
  }

  html {
    font-family: ${FONT_FAMILY.chinese_primary}, serif;
    --gray95: hsl(0deg 0% 95%);
    --gray85: hsl(0deg 0% 85%);
    --gray75: hsl(0deg 0% 75%);
    --gray60: hsl(0deg 0% 60%);
    --gray40: hsl(0deg 0% 40%);
    --gray25: hsl(0deg 0% 25%);
    --gray15: hsl(0deg 0% 15%);

    --transparentGray15: hsl(0deg 0% 15% / 0.5);
    
    --green85: hsl(150deg 20% 85%);
    --green75: hsl(150deg 20% 75%);
    --green30: hsl(150deg 40% 15%);
    --green25: hsl(150deg 20% 25%);
    --green15: hsl(150deg 20% 15%);

    --red85: hsl(0deg 20% 85%);
    --red75: hsl(0deg 20% 75%);
    --red30: hsl(0deg 40% 15%);
    --red25: hsl(0deg 20% 25%);
    --red15: hsl(0deg 20% 15%);

    --gold85: hsl(50deg 60% 85%);
    --gold75: hsl(50deg 60% 75%);
    --gold30: hsl(50deg 60% 30%);
    --gold25: hsl(50deg 60% 25%);
    --gold15: hsl(50deg 20% 15%);

    --header-height: 3.5rem;
  }

  body {
    background-color: var(--gray95);
    margin: 0;
  }
  html, body {
    height: 100%;
  }

  #root {
    height: 100%;
  }

  h1, h2, h3, h4, h5, h6, p{
    margin: 0;
    padding: 0;
  }
`;

export default GlobalStyles;
