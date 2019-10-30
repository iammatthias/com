import { createGlobalStyle } from 'styled-components'

const ColorStyle = createGlobalStyle`
:root {

  --base: 251, 248, 238; /* #f5f3ea */

  --secondary: 20, 13, 0; /* #140D00 */

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

  --shadow: 0px 5px 15px rgba(var(--secondary), 0.5),
    0px 10px 25px rgba(var(--secondary), 0.25),
    0px 15px 30px rgba(var(--secondary), 0.15);
}
@media (prefers-color-scheme: dark) {
  :root {
    --base: 20, 13, 0; /* #140D00 */
    --secondary: 246, 245, 245; /* #F6F5F5 */

    --shadow: 0px 5px 15px rgba(var(--secondary), 0.5),
      0px 10px 25px rgba(var(--secondary), 0.25),
      0px 15px 30px rgba(var(--secondary), 0.15);

  }
  .logo {
    filter: invert(100%);
  }
`

export default ColorStyle
