import { createGlobalStyle } from 'styled-components'

const ColorStyle = createGlobalStyle`
:root {
  --grey-100: 246, 245, 245; /* #F6F5F5 */
  --grey-200: 223, 222, 221; /* #DFDEDD */
  --grey-300: 198, 196, 194; /* #C6C4C2 */
  --grey-400: 174, 171, 168; /* #AEABA8 */
  --grey-500: 149, 145, 142; /* #95918E */
  --grey-600: 124, 120, 116; /* #7C7874 */
  --grey-700: 98, 94, 91; /* #625E5B */
  --grey-800: 71, 69, 67; /* #474543 */
  --grey-900: 20, 13, 0; /* #140D00 */

  --blue-100: #f4fafb;
  --blue-200: #cfeaec;
  --blue-300: #abdbde;
  --blue-400: #86cbcf;
  --blue-500: #62bbc1;
  --blue-600: #44a5ac;
  --blue-700: #358287;
  --blue-800: #275f63;
  --blue-900: #0e2325;

  --red-100: #ffe1e1;
  --red-200: #ffaeae;
  --red-300: #fe7c7b;
  --red-400: #fe4a49;
  --red-500: #fe1716;
  --red-600: #df0201;
  --red-700: #ac0201;
  --red-800: #7a0101;
  --red-900: #470100;

  --yellow-100: #fef1cd;
  --yellow-200: #fee39a;
  --yellow-300: #fdd568;
  --yellow-400: #fdc835;
  --yellow-500: #fcba04;
  --yellow-600: #ca9502;
  --yellow-700: #976f02;
  --yellow-800: #654a01;
  --yellow-900: #322501;

  --color-base: rgba(var(--grey-100), 1);
  --color-secondary: rgba(var(--grey-900), 1);
  --color-tertiary: var(--blue-500);
  --color-highlight: var(--red-400);
  --color-accent: var(--yellow-500);

  --shadow: 0px 5px 15px rgba(var(--grey-900), 0.5),
    0px 10px 25px rgba(var(--grey-900), 0.25),
    0px 15px 30px rgba(var(--grey-900), 0.15);

  --color-base-5: rgba(246, 245, 245, 0.05);
  --color-base-15: rgba(246, 245, 245, 0.15);
  --color-base-25: rgba(246, 245, 245, 0.25);
  --color-base-35: rgba(246, 245, 245, 0.35);
  --color-base-50: rgba(246, 245, 245, 0.5);
  --color-base-75: rgba(246, 245, 245, 0.75);
  --color-base-90: rgba(246, 245, 245, 0.9);
  --color-base-95: rgba(246, 245, 245, 0.95);
  --color-secondary-5: rgba(20, 13, 0, 0.05);
  --color-secondary-15: rgba(20, 13, 0, 0.15);
  --color-secondary-25: rgba(20, 13, 0, 0.25);
  --color-secondary-35: rgba(20, 13, 0, 0.35);
  --color-secondary-50: rgba(20, 13, 0, 0.5);
  --color-secondary-75: rgba(20, 13, 0, 0.75);
  --color-secondary-90: rgba(20, 13, 0, 0.9);
  --color-secondary-95: rgba(20, 13, 0, 0.95);
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-base: rgba(var(--grey-900), 1);
    --color-secondary: rgba(var(--grey-100), 1);
    --color-tertiary: var(--blue-500);
    --color-highlight: var(--red-400);
    --color-accent: var(--yellow-500);

    --shadow: 0px 5px 15px rgba(var(--grey-800), 0.5),
      0px 10px 25px rgba(var(--grey-800), 0.25),
      0px 15px 30px rgba(var(--grey-800), 0.15);

    --color-base-5: rgba(20, 13, 0, 0.05);
    --color-base-15: rgba(20, 13, 0, 0.15);
    --color-base-25: rgba(20, 13, 0, 0.25);
    --color-base-35: rgba(20, 13, 0, 0.35);
    --color-base-50: rgba(20, 13, 0, 0.5);
    --color-base-75: rgba(20, 13, 0, 0.75);
    --color-base-90: rgba(20, 13, 0, 0.9);
    --color-base-95: rgba(20, 13, 0, 0.95);
    --color-secondary-5: rgba(246, 245, 245, 0.05);
    --color-secondary-15: rgba(246, 245, 245, 0.15);
    --color-secondary-25: rgba(246, 245, 245, 0.25);
    --color-secondary-35: rgba(246, 245, 245, 0.35);
    --color-secondary-50: rgba(246, 245, 245, 0.5);
    --color-secondary-75: rgba(246, 245, 245, 0.75);
    --color-secondary-90: rgba(246, 245, 245, 0.9);
    --color-secondary-95: rgba(246, 245, 245, 0.95);
  }
  .logo {
    filter: invert(100%);
  }
`

export default ColorStyle
