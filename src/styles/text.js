import { createGlobalStyle } from 'styled-components'

const TextStyle = createGlobalStyle`
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

h1, h2, h3, h4, h5 {
  margin: 2.75rem 0 1rem;
  font-family: 'Lora', serif;
  font-weight: 700;
  line-height: 1.15;
}

h1 {
  margin-top: 0;
  font-size: 3rem;
}

h2 {font-size: 2.5rem;}

h3 {font-size: 2rem;}

h4 {font-size: 1.5rem;}

h5 {font-size: 1.25rem;}

p,
i,
a, 
ul, 
li,
form, 
textarea,
input {
  font-family: 'Montserrat', sans-serif;
  font-size: 1.125rem;
  line-height: 1.618;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: none;
}
.small {
  font-size: .75rem;
}

pre {
    width: calc(100vw - 4rem);
    overflow-x: scroll;
}

p .gatsby-resp-image-wrapper {
    max-width: 100% !important;
}

b, strong {
  font-weight: 700;
}

a {
  font-family: 'Lora', sans-serif;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.3s;
  color: var(--color-secondary);

  &:hover {
    text-shadow: 0.125em 0.125em var(--color-base),
      0.25em 0.25em var(--color-tertiary),
      0.375em 0.375em var(--color-highlight), 0.5em 0.5em var(--color-accent);
  }
}
ul, li {
  margin: .382rem .618rem ;
  line-height: 1.382;
  list-style: circle outside;
}

blockquote {
  font-family: 'Lora', serif;
  font-size: 30px;
  font-style: italic;
  letter-spacing: -0.36px;
  line-height: 44.4px;
  overflow-wrap: break-word;
  color: rgba(0, 0, 0, 0.68);
  margin: 2rem 0 ;
  padding: 0 0 0 1rem;
}

button, .button {
  font-family: 'Lora', sans-serif;
  font-weight: bold;
}

mark,
.highlighted {
  background: var(--color-highlight);
}

&::selection {
  background-color: var(--color-highlight);
}


@media screen and (min-width: 52em) {

h1 {
  margin-top: 0;
  font-size: 5.653em;
}

h2 {font-size: 3.998em;}

h3 {font-size: 2.827em;}

h4 {font-size: 1.999em;}

h5 {font-size: 1.414em;}

blockquote {
  margin: 2rem 0 ;
  padding: 0 0 0 2rem;
}

pre {
    width: 100%;
    overflow: auto;
    background: rgba(var(--grey-800), 0.15);
    color: var(--color-secondary);
    box-shadow: var(--shadow);
    padding: .5rem;
    border-radius: .5rem;
}
}

article {
    display: grid;
    grid-template-columns: 1.2rem minmax(1.2rem, 1fr) minmax(auto, 75ch) minmax(1.2rem, 1fr) 1.2rem;
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
    blockquote, .buttons {
        grid-column: 1 / 6;
        
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
    blockquote, .buttons {
        grid-column: 3;
        
    }
    }

    blockquote {
        border-left: 4px solid var(--color-secondary);
    }

    figure {
        grid-column: 1 / 6;
        width: 100%;
        max-width: 150ch;
        justify-self: center;
        margin: 1.5rem 0;
        figcaption {
            text-align: center;
            padding: 1rem;
            font-style: italic;
            font-family: 'Playfair Display';
        }
    }
    .gatsbyRemarkImagesGrid-grid {
        margin: 0 auto;
    }
}

`

export default TextStyle
