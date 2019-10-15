import { createGlobalStyle } from 'styled-components'

const ColorStyle = createGlobalStyle`

/* Colors */
:root {
    --grey-100: 246, 245, 245; /* #F6F5F5 */
    --grey-200: 223, 222, 221; /* #DFDEDD */
    --grey-300: 198, 196, 194; /* #C6C4C2 */
    --grey-400: 174, 171, 168; /* #AEABA8 */
    --grey-500: 149, 145, 142; /* #95918E */
    --grey-600: 124, 120, 116; /* #7C7874 */
    --grey-700: 98, 94, 91; /* #625E5B */
    --grey-800: 71, 69, 67; /* #474543 */
    --grey-900: 20, 13, 0;  /* #140D00 */


    --blue-100: #F4FAFB;
    --blue-200: #CFEAEC;
    --blue-300: #ABDBDE;
    --blue-400: #86CBCF;
    --blue-500: #62BBC1;
    --blue-600: #44A5AC;
    --blue-700: #358287;
    --blue-800: #275F63;
    --blue-900: #0E2325;

    --red-100: #FFE1E1;
    --red-200: #FFAEAE;
    --red-300: #FE7C7B;
    --red-400: #FE4A49;
    --red-500: #FE1716;
    --red-600: #DF0201;
    --red-700: #AC0201;
    --red-800: #7A0101;
    --red-900: #470100;

    --yellow-100: #FEF1CD;
    --yellow-200: #FEE39A;
    --yellow-300: #FDD568;
    --yellow-400: #FDC835;
    --yellow-500: #FCBA04;
    --yellow-600: #CA9502;
    --yellow-700: #976F02;
    --yellow-800: #654A01;
    --yellow-900: #322501;


    --color-base: rgba(var(--grey-100), 1);
    --color-secondary: rgba(var(--grey-900), 1);
    --color-tertiary: var(--blue-500);
    --color-highlight: var(--red-400);
    --color-accent: var(--yellow-500);

    --shadow: 0px 5px 15px rgba(var(--grey-900), .5),
    0px 10px 25px rgba(var(--grey-900), .25),
    0px 15px 30px rgba(var(--grey-900), .15);

    --color-base-5: rgba(246, 245, 245, .05);
    --color-base-15: rgba(246, 245, 245, .15);
    --color-base-25: rgba(246, 245, 245, .25);
    --color-base-35: rgba(246, 245, 245, .35);
    --color-base-50: rgba(246, 245, 245, .50);
    --color-base-75: rgba(246, 245, 245, .75);
    --color-base-90: rgba(246, 245, 245, .90);
    --color-base-95: rgba(246, 245, 245, .95);
    --color-secondary-5: rgba(20, 13, 0, 0.05);
    --color-secondary-15: rgba(20, 13, 0, 0.15);
    --color-secondary-25: rgba(20, 13, 0, 0.25);
    --color-secondary-35: rgba(20, 13, 0, 0.35);
    --color-secondary-50: rgba(20, 13, 0, 0.5);
    --color-secondary-75: rgba(20, 13, 0, 0.75);
    --color-secondary-90: rgba(20, 13, 0, 0.9);
    --color-secondary-95: rgba(20, 13, 0, 0.95);

}
@media(prefers-color-scheme: dark) {
  :root {
        --color-base: rgba(var(--grey-900), 1);
        --color-secondary: rgba(var(--grey-100), 1);
        --color-tertiary: var(--blue-500);
        --color-highlight: var(--red-400);
        --color-accent: var(--yellow-500);

        --shadow: 0px 5px 15px rgba(var(--grey-800), .5),
        0px 10px 25px rgba(var(--grey-800), .25),
        0px 15px 30px rgba(var(--grey-800), .15);



        --color-base-5: rgba(20, 13, 0, 0.05);
        --color-base-15: rgba(20, 13, 0, 0.15);
        --color-base-25: rgba(20, 13, 0, 0.25);
        --color-base-35: rgba(20, 13, 0, 0.35);
        --color-base-50: rgba(20, 13, 0, 0.5);
        --color-base-75: rgba(20, 13, 0, 0.75);
        --color-base-90: rgba(20, 13, 0, 0.9);
        --color-base-95: rgba(20, 13, 0, 0.95);
        --color-secondary-5: rgba(246, 245, 245, .05);
        --color-secondary-15: rgba(246, 245, 245, .15);
        --color-secondary-25: rgba(246, 245, 245, .25);
        --color-secondary-35: rgba(246, 245, 245, .35);
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
