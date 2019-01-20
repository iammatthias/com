import React from 'react'
import { ThemeProvider, createGlobalStyle } from 'styled-components'
import theme from '../styles/theme'
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
    text-shadow: rgba(0, 0, 0, .01) 0 0 1px;
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
`

const Typography = createGlobalStyle`
html,
body {
  margin: 0;
  width: 100%;
  font-size: 16px;
}

h1,
h2,
p,
i,
a,
.first-letter {
  color: rgba(0, 0, 0, 0.84);
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
  line-height: 34.5px;
  letter-spacing: -0.45px;
}

h3 {
  padding: 0;
  margin: 3.5em 0 0 0;
  line-height: 34.5px;
  letter-spacing: -0.45px;
}

h1, h2 {
  &:first-child {margin: 0;}}

p, i, a {
  margin: .5em 0;
  font-family: "Lato";
  font-size: 1.25em;
  letter-spacing: -0.03px;
  line-height: 1.58;
}

a {
  text-decoration: underline;
}

blockquote {
  font-family: "Montserrat", sans-serif;
  font-size: 30px;
  font-style: italic;
  letter-spacing: -0.36px;
  line-height: 44.4px;
  overflow-wrap: break-word;
  margin: 55px 0 33px 0;
  color: rgba(0, 0, 0, 0.68);
  padding: 0 0 0 50px;
  border-left: 10px solid #ccc;
}

code {
  font-size: 18px;
  background: rgba(0,0,0,.05);
  border-radius: 2px;
  padding: 3px 5px;
}

mark, .highlighted {
  background: #7DFFB3;
}

.first-letter {
  overflow-wrap: break-word;
  font-family: "Montserrat", sans-serif;
  font-size: 60px;
  line-height: 60px;
  display: block;
  position: relative;
  float: left;
  margin: 0px 7px 0 -5px;
}

.subtitle {
  font-family: "Lato", sans-serif;
  color: rgba(0, 0, 0, 0.54);
  margin: 0 0 24px 0;
}

::selection{background-color: lavender}
`

const MenuStyle = createGlobalStyle`
  .bm-menu {
  background: white;
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
      width: 1.5rem;
      height: 1.5rem;
      top: 2em;
      right: 2em;
      span span {
        background: black;
        position: fixed;
      }
`

const Layout = ({ children }) => {
  return (
    <div className="siteRoot">
      <Reset />
      <Typography />
      <MenuStyle />
      <ThemeProvider theme={theme}>
        <>
          <Menu />
          {children}
        </>
      </ThemeProvider>
    </div>
  )
}

export default Layout
