import { createGlobalStyle } from 'styled-components'

const MenuStyle = createGlobalStyle`
  img.logo {
      height: 3em;
      width: 3em;
      margin: .25em;
      transition: all 1s;
    
  }
  .menuHeadroom {
    z-index: 299;
    position: fixed;
    top: 0;
  }
  .bm-menu {
      background: var (--color-secondary);
      padding: 2em;
      font-size: 1.15em;
      a {
        color: var (--color-base);
      }
      svg {
        transition: all 0.5 s;
        fill: var (--color-base);
      }
    }
    .bm-cross {
      height: 2em !important;
      width: 0.35em !important;
      background: var (--color-base);
    }
    .bm-cross-button {
      height: 2em !important;
      width: 2em !important;
      top: 1.5em !important;
      right: 2em !important;
    }
    .bm-burger-bars {
      height: 0.35em;
      position: fixed;
    }
    .bm-burger-button {
      z-index: 301 !important;
      position: fixed;
      width: 2em;
      height: 2em;
      top: 2em;
      right: 2em;

      span span {
        background: var (--color-base);
        position: fixed;
        mix-blend-mode: difference;
        transition: all 0.3s;
      } &
      : hover {
        span span {
          background: var (--color-highlight) !important;
        }
      }

`

export default MenuStyle
