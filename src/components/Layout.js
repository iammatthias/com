import React from 'react'
import { ThemeProvider, createGlobalStyle } from 'styled-components'
import posed, { PoseGroup } from 'react-pose'
import Helmet from 'react-helmet'
import theme from '../styles/theme'
import config from '../utils/siteConfig'
import Menu from './Menu'

const Reset = createGlobalStyle`
  /* http://meyerweb.com/eric/tools/css/reset/
   v2.0 | 20110126
   License: none (public domain)
  */
  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, ol, ul, li,
  fieldset, form, label, legend,
  table, caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed,
  figure, figcaption, footer, header, hgroup,
  menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    margin: 0;
    padding: 0;
    border: 0;
    vertical-align: baseline;
  }
  article, aside, details, figcaption, figure,
  footer, header, hgroup, menu, nav, section {
    display: block;
  }
  ol, ul {
    list-style: none;
  }
  blockquote, q {
    quotes: none;
  }
  blockquote::before, blockquote::after,
  q::before, q::after {
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
  body {
    font-variant-ligatures: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  img {
    display: block;
  	width: 100%;
  	height: auto;
  }
  #outer-container {
   overflow: visible !important;
 }
 &:focus {
  outline-color: transparent;
  outline-style: none;
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
`
const ColorMode = createGlobalStyle`
  :root {
    --color-base: #E6E3E1 ;
    --color-secondary: #100B00 ;
    --color-tertiary: #223843 ;
    --color-highlight: #FE5F55 ;
    --color-accent: #F4DAD3 ;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-base: #100B00;
    --color-secondary: #E6E3E1;
    --color-tertiary: #F4DAD3;
    --color-highlight: #FE5F55;
    --color-accent: #FBF2F0; 
 }
}
`
const Paint = createGlobalStyle`
html,
body {
  margin: 0;
  width: 100%;
  font-size: 16px;
  background: var(--color-base);
  color: var(--color-secondary);
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
  line-height: 2rem;
}

h1, h2 {
  &:first-child {margin: 0;}}

p, i, a {
  margin: .5em 0;
  font-family: "Lato";
  font-size: 1.25em;
  line-height: 1.58;
}

a {
  text-decoration: underline;
  color: var(--color-tertiary);
  transition: all 0.3s;
  &:hover {
    color: var(--color-highlight);
  }
}

blockquote {
  font-family: "Montserrat", sans-serif;
  font-size: 1em;
  font-style: italic;
  line-height: 2.25em;
  overflow-wrap: break-word;
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
  overflow-wrap: break-word;
  font-family: "Montserrat", sans-serif;
  font-size: 3.75em;
  line-height: 3.75em;
  display: block;
  position: relative;
  float: left;
  margin: 0 .5em 0 -.5em;
}

.subtitle {
  font-family: "Lato", sans-serif;
  color: var(--color-secondary);
  margin: 0 0 1.5em 0;
}

::selection{background-color: lavender}
`

const MenuStyle = createGlobalStyle`
  .bm-menu {
  background: var(--color-base);
  padding: 2em;
  font-size: 1.15em;
}
    .bm-cross {
      height: 2rem !important;
      width: 0.35rem !important;
      background: black;
    }
    .bm-cross-button {
      height: 2em !important;
      width: 2em !important;
      top: 1.5em !important;
      right: 2em !important;
    }
    .bm-burger-bars {
      height: 0.35rem;
      position: fixed;
    }
    .bm-burger-button {
      position: fixed;
      width: 2rem;
      height: 2rem;
      top: 2em;
      right: 2em;
      span span {
        background: var(--color-secondary);
        position: fixed;
        border: .5px solid var(--color-base);
      }
`
const transitionDuration = 300
const transitionDelay = 350

const Transition = posed.div({
  enter: {
    opacity: 1,
    transition: { duration: transitionDuration },
    delay: transitionDelay,
    beforeChildren: true,
  },
  exit: { opacity: 0, transition: { duration: transitionDuration } },
})

const Layout = ({ children, ...props }) => {
  return (
    <div className="siteRoot">
      <Helmet>
        <html lang="en" />
        <title>{config.siteTitle}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/logos/logo-512.png" />
        <link rel="apple-touch-icon" href="/logos/logo-512.png" />
        <meta name="description" content={config.siteDescription} />
        <meta property="og:title" content={config.siteTitle} />
        <meta property="og:url" content={config.siteUrl} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={config.siteTitle} />
      </Helmet>
      <Reset />
      <ColorMode />
      <Paint />
      <MenuStyle />
      <ThemeProvider theme={theme}>
        <>
          <Menu />
          <PoseGroup>
            <Transition key={props.location.pathname}>{children}</Transition>
          </PoseGroup>
        </>
      </ThemeProvider>
    </div>
  )
}

export default Layout
