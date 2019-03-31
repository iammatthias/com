import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
/* Colors */
 :root {
     --color-base: #F9F4ED;
     --color-secondary: #140D00;
     --color-tertiary: #131F26;
     --color-highlight: #FE5F55;
     --color-accent: #F4DAD3;
     --color-secondary-25: rgba(20, 13, 0, .25);
     --color-secondary-50: rgba(20, 13, 0, .50);
     --color-secondary-75: rgba(20, 13, 0, .75);
     --color-secondary-90: rgba(20, 13, 0, .90);
}
 @media (prefers-color-scheme: dark) {
     :root {
     --color-base: #140D00;
     --color-secondary: #F9F4ED;
     --color-tertiary: #F4DAD3;
     --color-highlight: #FE5F55;
     --color-accent:  #131F26;
     --color-secondary-25: rgba(20, 13, 0, .25);
     --color-secondary-50: rgba(20, 13, 0, .50);
     --color-secondary-75: rgba(20, 13, 0, .75);
     --color-secondary-90: rgba(20, 13, 0, .90);
    }
}
 html, body, div, span, applet, object, iframe, blockquote, pre, a, abbr, acronym, address, big, cite, code, del, dfn,em, img, ins, kbd, q, s, samp, small, strike, strong, sub, sup, tt, var, b, u, i, center, dl, dt, dd, ol, ul, li, fieldset, form, label, legend, table, caption, tbody, tfoot, thead, tr, th, td, article, aside, canvas, details,embed, figure, figcaption, footer, header, hgroup, menu, nav, output, ruby, section, summary, time, mark, audio, video {
     margin: 0;
     padding: 0;
     border: 0;
     vertical-align: baseline;
}
 article, aside, details, figcaption, figure, footer, header, hgroup, menu, nav, section {
     display: block;
}
 ol, ul {
     list-style: none;
}
 blockquote, q {
     quotes: none;
}
 blockquote::before, blockquote::after, q::before, q::after {
     content: '';
     content: none;
}
 table {
     border-collapse: collapse;
     border-spacing: 0;
}
 *{
     box-sizing: border-box;
}
/* Site Specific Globals */
 html, body {
     background: var(--color-base);
     color: var(--color-secondary);
     margin: 0;
     width: 100%;
     font-size: 16px;
     line-height: 1;
     font-variant-ligatures: none;
     -moz-osx-font-smoothing: grayscale;
     -webkit-font-smoothing: antialiased;
     text-rendering: optimizeLegibility;
     text-shadow: rgba(0, 0, 0, .01) 0 0 1px;
     font-weight: 400;
}
 h1, h2, p, i, a, .first-letter {
     text-rendering: optimizeLegibility;
}
 h1 {
     font-size: 3em;
     text-align: left;
     margin-bottom: .5em;
}
 h2 {
     font-size: 1.625em;
     font-weight: 900;
     padding: 0;
     margin: 3.5em 0 0 0;
     line-height: 2em;
}
 h3 {
     padding: 0;
     margin: 3.5em 0 0 0;
     line-height: 2 rem;
}
 h1, h2 {
     &:first-child {
         margin: 0;
    }
}
 p {
     margin: .5em 0;
     font-family: "Playfair Display";
     font-size: 1.25em;
     line-height: 1.58;
    a {
         font-weight: bold;
         font-style: italic;
         font-size: 1em;
    }
     .gatsby-resp-image-wrapper {
         max-width: 100% !important;
    }
}
 a {
     font-family: "Playfair Display";
     font-size: 1.25em;
     line-height: 1.58;
     text-decoration: underline;
     color: var(--color-tertiary);
     transition: all 0.3s;
     &:hover{
         color: var(--color-highlight);
    }
}
 blockquote {
     font-family: "Montserrat", sans-serif;
     font-size: 1em;
     font-style: italic;
     line-height: 2.25em;
     overflow-wrap: break -word;
     margin: 2em 0 2em 0;
     padding: 0 0 0 3em;
     border-left: .75em solid var(--color-tertiary);
}
 code, pre {
     font-size: 1em;
     border-radius: .25em;
     padding: .5em;
     line-height: 1.5em;
}
 mark, .highlighted {
     background: var(--color-highlight);
}
 .first-letter {
     overflow-wrap: break -word;
     font-family: "Montserrat", sans-serif;
     font-size: 3.75em;
     line-height: 3.75em;
     display: block;
     position: relative;
     float: left;
     margin: 0 .5em 0-.5em;
}
 .subtitle {
     font-family: "Playfair Display", sans-serif;
     color: var(--color-secondary);
     margin: 0 0 1.5em 0;
}
 ::selection {
     background-color: var(--color-highlight);
}
 img {
     display: block;
     width: 100%;
     height: auto;
}
.tag {
    border: 2px solid var(--color-accent);
    padding: .25em 2em;
}

.tag:hover {
    border: 2px solid var(--color-highlight);
}
/* Utilities */
 .noUnderline {
     text-decoration: none;
}
 .hide {
     display: none;
     @media screen and (min-width: 52em) {
         display: block;
    }
}
 .changeDirection {
     flex-direction: column-reverse;
     @media screen and (min-width: 52em) {
         flex-direction: row;
    }
}
/* NProgress stles */
 .nprogress-busy {
     cursor: wait;
}
 #nprogress .peg {
     display: none !important;
}
 #nprogress .bar {
     height: 4px !important;
}
/* Web Accessibility Stuff */
 body:not(.user-is-tabbing) button:focus, body:not(.user-is-tabbing) input:focus, body:not(.user-is-tabbing) select:focus, body:not(.user-is-tabbing) textarea:focus, body:not(.user-is-tabbing) a:focus {
     outline: none;
}
 button, input, textarea, select {
     font-family: inherit;
     font-size: inherit;
     background: none;
     border: none;
     appearance: none;
     border-radius: 0;
     resize: none;
     &:invalid {
         box-shadow: none;
    }
     &:focus {
         outline: 3px solid #497ecb;
    }
}
 a:focus {
     outline: 3px solid #497ecb;
}

/* Etc */
 .headroom-wrapper {
     position: relative;
     z-index: 300;
}
@media screen and (min-width: 52em) {
    .headroom-wrapper {
        position: fixed;
    }
}
 .relativeHeadroom {
     position: relative;
     z-index: 300;
}

/* Menu */
 img.logo {
     height: 2.25em;
     width: 2.25em;
     margin: .25em;
     transition: all 1s;
     font-size: 1.25em;
}
 .menuHeadroom {
     z-index: 299;
     position: fixed;
     top: 0;
}
 .bm-menu {
     background: var(--color-secondary);
     padding: 2em;
     font-size: 1.15em;
     a {
         color: var(--color-base);
    }
}
 .bm-cross {
     height: 2em !important;
     width: 0.35em !important;
     background: var(--color-base);
}
 .bm-cross-button {
     height: 2em !important;
     width: 2em !important;
     top: 1.5em !important;
     right: 2em !important;
}
`

export default GlobalStyle
