import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
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
@media (prefers-color-scheme: dark) {
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
}

body {
   -webkit-touch-callout: none;
   -webkit-tap-highlight-color: transparent;
   -webkit-user-select: none;
}

/* Reset */
html,
body,
div,
span,
applet,
object,
iframe,
blockquote,
pre,
a,
abbr,
acronym,
address,
big,
cite,
code,
del,
dfn,
em,
img,
ins,
kbd,
q,
s,
samp,
small,
strike,
strong,
sub,
sup,
tt,
var,
b,
u,
i,
center,
dl,
dt,
dd,
ol,
ul,
li,
fieldset,
form,
label,
legend,
table,
caption,
tbody,
tfoot,
thead,
tr,
th,
td,
article,
aside,
canvas,
details,
embed,
figure,
figcaption,
footer,
header,
hgroup,
menu,
nav,
output,
ruby,
section,
summary,
time,
mark,
audio,
video {
  margin: 0;
  padding: 0;
  border: 0;
  vertical-align: baseline;
}
article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
  display: block;
}
ol,
ul {
  list-style: none;
}
blockquote,
q {
  quotes: none;
}
blockquote::before,
blockquote::after,
q::before,
q::after {
  content: '';
  content: none;
}
table {
  border-collapse: collapse;
  border-spacing: 0;
}
* {
  box-sizing: border-box;
  text-rendering: optimizeLegibility;
}

/* Site Specific Globals */
html,
body {
  background: var(--color-base);
  color: var(--color-secondary);
  margin: 0;
  width: 100%;
  font-size: 16px;
  line-height: 1;
  font-variant-ligatures: none;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  text-shadow: var(--color-secondary-25) 0 0 1px;
}

h1,
h2,
p,
i,
a,
.first-letter,
.authorName a {
  color: var(--color-secondary);
}

h1 {
  font-family: 'Montserrat', serif;
  font-size: 3rem;
  text-align: left;
  margin-bottom: 0.5rem;
}

h2 {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.625em;
  font-weight: 700;
  padding: 0;
  margin: 3.5rem 0 -0.875rem -0.125em;
  text-align: left;
  line-height: 2rem;
}

p,
i,
a, 
ul, 
li,
form, 
textarea,
input {
  margin-top: 1.3125em;
  font-family: 'Lato';
  font-size: 1.125em;
  line-height: 1.618;
}
p {
  .gatsby-resp-image-wrapper {
    max-width: 100% !important;
  }
}
a {
  font-weight: 900;
  text-decoration: none;
  transition: all 0.3s;
  color: var(--color-secondary);
  text-shadow: 0.125em 0.125em var(--color-base);
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-base),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent);
  }
}
ul, li {
  margin: 1.3125em 2em;
  line-height: 1.382;
  list-style: circle outside;
}

@media screen and (min-width: 52em) {
	a {
  font-weight: 900;
  text-decoration: none;
  transition: all 0.3s;
  color: var(--color-secondary);
  text-shadow: 0.125em 0.125em var(--color-base);
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-base),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent);
  }
}
}

blockquote {
  font-family: 'Playfair Display', serif;
  font-size: 30px;
  font-style: italic;
  letter-spacing: -0.36px;
  line-height: 44.4px;
  overflow-wrap: break-word;
  margin: 55px 0 33px 0;
  /* text-align: center; */
  color: rgba(0, 0, 0, 0.68);
  padding: 0 0 0 50px;
}

code,
pre {
  font-family: 'Source Code Pro';
  font-size: 18px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 2px;
  padding: 3px 5px;
}

mark,
.highlighted {
  background: var(--color-highlight);
}

.first-letter {
  overflow-wrap: break-word;
  font-family: 'Playfair Display', serif;
  font-size: 60px;
  line-height: 60px;
  display: block;
  position: relative;
  float: left;
  margin: 0px 7px 0 -5px;
}

.subtitle {
  font-family: 'Lato', sans-serif;
  color: var(--color-secondary);
  margin: 0 0 1.5em 0;
}
::selection {
  background-color: var(--color-highlight);
}

/* Helper Classes */

.linkAccentReset {
  text-shadow: none !important;
  transition: all 0.3s;
  font-weight: 400 !important;
  &: hover {
    text-shadow: none !important;
  }
}
.scopedLinkAccent {
  h1,
  h2,
  h3,
  h4,
  h5 {
    text-shadow: 0.125em 0.125em var(--color-base) !important;
    transition: all 0.3s;
  }
  &:hover {
    h1,
    h2,
    h3,
    h4,
    h5 {
      text-shadow: 0.125em 0.125em var(--color-base),
        0.25em 0.25em var(--color-tertiary),
        0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent) !important;
    }
  }
}

.tag {
  padding: 0.25em 1em 0.25em 0;
  transition: all 0.3s;
}

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

body:not(.user-is-tabbing) button:focus,
body:not(.user-is-tabbing) input:focus,
body:not(.user-is-tabbing) select:focus,
body:not(.user-is-tabbing) textarea:focus,
body:not(.user-is-tabbing) a:focus {
  outline: none;
}
button,
input,
textarea,
select {
  font-family: inherit;
  font-size: inherit;
  background: none;
  border: none;
  appearance: none;
  border-radius: 0;
  resize: none;
  &: invalid {
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
.button {
  font-size: 1.25em;
  font-weight: bold;
  border: none;
  outline: none;
  cursor: pointer;
  color: var(--color-base);
  padding: 1em;
  text-decoration: none;
  text-align: center;
  background: var(--color-secondary) !important;
  color: var(--color-base) !important;
  text-shadow: 0.125em 0.125em var(--color-secondary) !important;
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-secondary),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent) !important;
  }
  z-index: 99;
  &: focus {
    outline: none;
  }
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
.marginRight {
  margin: 0 2em 0 0;
}

.gatsby-resp-image-wrapper  {
  float: right!important;
   width: 150px !important;
}


/* Menu */

.logo {
  height: 2.25em;
  width: 2.25em;
  margin: 0.25em;
  font-size: 1.25em;
}
.menuHeadroom {
  position: fixed;
  top: 0;
  right: 0;
  .headroom,
  .headroom--pinned {
    top: 0 !important;
    right: 0 !important;
    left: auto !important;
  }
  @media screen and (min-width: 52em) {
    left: 0;
    .headroom,
    .headroom--pinned {
      top: 0 !important;
      right: auto !important;
      left: 0 !important;
    }
  }
}
.bm-menu {
  background: var(--color-base);
  padding: 3em 2em;
  font-size: 1.15em;
  a {
    color: var(--color-base);
  }
}
.bm-cross {
  height: 2em !important;
  width: 0.35em !important;
  background: var(--color-secondary);
}
.bm-cross-button {
  height: 2em !important;
  width: 2em !important;
  top: 1.5em !important;
  right: 2em !important;
}
.MenuTabBarHover {
  transition: all 0.3s;
  &:hover {
    box-shadow: inset 0 0.125em 0px 0px var(--color-tertiary),
      inset 0 0.25em 0px 0px var(--color-highlight), inset 0 0.375em 0px 0px var(--color-accent) !important;
  }
}

`

export default GlobalStyle
