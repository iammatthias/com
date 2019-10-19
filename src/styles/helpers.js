import { createGlobalStyle } from 'styled-components'

const Helpers = createGlobalStyle`

.linkAccentReset { 
  text-shadow: none !important;
  transition: all 0.3s;
  font-weight: 400;
  &:hover {
    text-shadow: none !important;
  }
}

.hide {
  display: none;
  @media screen and (min-width: 52em) {
    display: block;
  }
}

.hide-inline {
  display: none;
  @media screen and (min-width: 52em) {
    display: inline-block;
  }
}

.article {

  p, blockquote, figure { 
    margin: 2rem 0 0;
  }
  blockquote p {
      margin: 0;
    }
  
  article,
  div,
  p,
  i,
  a,
  ul,
  li,
  h1,
  h2,
  h3,
  h4,
  h5,
  blockquote,
  .buttons {
    grid-column: 2 / 6;
  }
  @media screen and (min-width: 52em) {
    div,
    p,
    i,
    a,
    ul,
    li,
    h1,
    h2,
    h3,
    h4,
    h5,
    blockquote,
    .buttons {
      grid-column: 4;
    }
  }

  blockquote {
    border-left: 4px solid var(--color-secondary);
  }

  img {margin: 0}

  figure {
    grid-column: 2 / 6;
    width: 100%;
    justify-self: center;

    figcaption {
      text-align: right;
      padding: 1rem 1rem 0;
      font-style: italic;
      font-family: 'Playfair Display';
    }
  }
}

`

export default Helpers
