import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
/* Colors */

:root {
	--color-base: #F6F5F5;
	--color-secondary: #140D00;
	--color-tertiary: #62BBC1;
	--color-highlight: #FE4A49;
	--color-accent: #FCBA04;
	--color-secondary-25: rgba(20, 13, 0, .25);
	--color-secondary-50: rgba(20, 13, 0, .50);
	--color-secondary-75: rgba(20, 13, 0, .75);
	--color-secondary-90: rgba(20, 13, 0, .90);
}
@media (prefers-color-scheme: dark) {
	:root {
		--color-base: #140D00;
		--color-secondary: #E1DCDC;
		--color-tertiary: #62BBC1;
		--color-highlight: #FE4A49;
		--color-accent: #FCBA04;
		--color-secondary-25: rgba(225, 220, 220, .25);
		--color-secondary-50: rgba(225, 220, 220, .50);
		--color-secondary-75: rgba(225, 220, 220, .75);
		--color-secondary-90: rgba(225, 220, 220, .90);
	}
}

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
	text-rendering: optimizeLegibility;
	text-shadow: var(--color-secondary-25) 0 0 1px;
	font-weight: 400;
}
h1,
h2,
p,
i,
a,
.first-letter {
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
h1,
h2 {
	&: first-child {
		margin: 0;
	}
}
p {
	margin: .5em 0 1.25em;
	font-family: "Lato";
	font-size: 1.25em;
	line-height: 1.6;
	a {
		font-weight: bold;
		font-size: 1em;
	}
	.gatsby-resp-image-wrapper {
		max-width: 100% !important;
	}
	&:last-child {
		margin-bottom: 0;
	}
}
a {
	font-family: "Lato";
	font-size: 1.25em;
	line-height: 1.6;
	text-decoration: none;
	color: var(--color-secondary);
    text-shadow: .125em .125em var(--color-base);
    transition: all 0.3s;
	&: hover {
		text-shadow: .125em .125em var(--color-base), .25em .25em var(--color-tertiary), .375em .375em var(--color-highlight), .5em .5em var(--color-accent);
	}
}

a.invert {
	color: var(--color-base);
    text-shadow: .125em .125em var(--color-secondary);
    transition: all 0.3s;
	&: hover {
		text-shadow: .125em .125em var(--color-secondary), .25em .25em var(--color-tertiary), .375em .375em var(--color-highlight), .5em .5em var(--color-accent);
	}
}
.noLinkAccent {
    text-shadow: none !important;
    transition: all 0.3s;
	&: hover {
		text-shadow: none !important;
	}
}
.scopedLinkAccent {
	h1, h2, h3, h4, h5 {
        text-shadow: .125em .125em var(--color-base) !important;
        transition: all 0.3s;
    }
	&:hover {
		h1, h2, h3, h4, h5 {
			text-shadow: .125em .125em var(--color-base), .25em .25em var(--color-tertiary), .375em .375em var(--color-highlight), .5em .5em var(--color-accent) !important;
		}
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
code,
pre {
	font-size: 1em;
	border-radius: .25em;
	padding: .5em;
	line-height: 1.5em;
}
mark,
.highlighted {
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
	font-family: "Lato", sans-serif;
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
    padding: .25em 1em .25em 0;
    transition: all 0.3s;
}
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
/* Article Styles */

.postArticle {
	margin: 0 0 3em;
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
/* Menu */

.logo {
	height: 2.25em;
	width: 2.25em;
	margin: .25em;
	font-size: 1.25em;
}
.menuHeadroom {
	position: fixed;
	top: 0;
	right: 0;
	.headroom, .headroom--pinned {
		top: 0 !important;
		right: 0 !important;
		left:  auto !important;
	}
	@media screen and (min-width: 52em) {
		left: 0;
		.headroom, .headroom--pinned {
			top: 0 !important;
			right: auto !important;
			left:  0 !important;
		}
	}
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
.MenuTabBarHover {
    transition: all 0.3s;
	&: hover {
		box-shadow: inset 0 4px 0px 0px var(--color-highlight), inset 0 8px 0px 0px var(--color-accent) !important
	}
}
`

export default GlobalStyle
