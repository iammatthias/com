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

  p, blockquote, figure, pre { 
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

  pre {
    overflow-x: scroll !important;
    background: rgba(var(--grey-800), 0.05);
    padding: 1rem;
    width: calc(100vw - 4rem);
    word-wrap: normal;
    box-shadow: var(--shadow);
    border-radius: 0.5rem;
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

    pre {
      width: 100%;
    }
  }

  blockquote {
    border-left: 4px solid var(--color-secondary);
  }

  img {margin: 0}

  figure {
    grid-column: 4;
    width: 100%;
    justify-self: center;

    div {
      display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10px, 1fr));
    }

    figcaption {
      grid-area: caption;
     
      text-align: center;
      padding: 1rem 1rem 0;
      font-style: italic;
      font-family: 'Playfair Display';
    }
  }
  .figure-sm {
  grid-column: 3 / 6 !important;
}

.figure-md {
   grid-column: 2 / 7 !important;
}
.figure-lg {
  grid-column: 1 / 8 !important;
}
}

`

export default Helpers
