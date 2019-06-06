import { createGlobalStyle } from 'styled-components'

const ColorStyle = createGlobalStyle`

/* Colors */

:root {
    --color-base: #f6f5f5;
    --color-secondary: #140d00;
    --color-tertiary: #62bbc1;
    --color-highlight: #fe4a49;
    --color-accent: #fcba04;
    --color-base-25: rgba(246, 245, 245, .25);
    --color-base-50: rgba(246, 245, 245, .50);
    --color-base-75: rgba(246, 245, 245, .75);
    --color-base-90: rgba(246, 245, 245, .90);
    --color-base-95: rgba(246, 245, 245, .95);
    --color-secondary-25: rgba(20, 13, 0, 0.25);
    --color-secondary-50: rgba(20, 13, 0, 0.5);
    --color-secondary-75: rgba(20, 13, 0, 0.75);
    --color-secondary-90: rgba(20, 13, 0, 0.9);
    --color-secondary-95: rgba(20, 13, 0, 0.95);
}
@media(prefers-color-scheme: dark) {
  :root {
        --color-base: #140d00;
        --color-secondary: #f6f5f5;
        --color-tertiary: #62bbc1;
        --color-highlight: #fe4a49;
        --color-accent: #fcba04;
        --color-base-25: rgba(20, 13, 0, 0.25);
        --color-base-50: rgba(20, 13, 0, 0.5);
        --color-base-75: rgba(20, 13, 0, 0.75);
        --color-base-90: rgba(20, 13, 0, 0.9);
        --color-base-95: rgba(20, 13, 0, 0.95);
        --color-secondary-25: rgba(246, 245, 245, .25);
        --color-secondary-50: rgba(246, 245, 245, .50);
        --color-secondary-75: rgba(246, 245, 245, .75);
        --color-secondary-90: rgba(246, 245, 245, .90);
        --color-secondary-95: rgba(246, 245, 245, .95);
    }
.logo {
filter: invert(100%);
}

`

export default ColorStyle
