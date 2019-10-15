import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`



/* Helper Classes */

.linkAccentReset { 
  text-shadow: none !important;
  transition: all 0.3s;
  font-weight: 400;
  &:hover {
    text-shadow: none !important;
  }
}
.linkAccentReset-bold {
  text-shadow: none !important;
  transition: all 0.3s;
  font-weight: 800;
  &:hover {
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
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  resize: none;

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
  padding: 1.25rem 2rem;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  font-size: 1.25em !important;
  text-align: center;
  background: var(--color-secondary) !important;
  color: var(--color-base) !important;
  text-shadow: 0.125em 0.125em var(--color-secondary) !important;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  &:hover {
    text-shadow: 0.125em 0.125em var(--color-secondary),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent) !important;
  }
  &:only-of-type {
    margin-right: 0;
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
