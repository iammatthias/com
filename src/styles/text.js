import { createGlobalStyle } from 'styled-components'

const TextStyle = createGlobalStyle`
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

h1, h2, h3, h4, h5 {
  margin: 2.75rem 0 1rem;
  font-family: 'Lora', serif;
  font-weight: 700;
  line-height: 1.15;
}

h1 {
  margin-top: 0;
  font-size: 4em;
}

h2 {font-size: 3.157em;}

h3 {font-size: 2.369em;}

h4 {font-size: 1.777em;}

h5 {font-size: 1.333em;}

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
  hyphens: auto;
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
  font-family: 'Lora', serif;
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

pre {
  border-radius: .5rem;
  padding: .5rem;
  background: rgba(0, 0, 0, 0.05);
  font-size: 18px;
  font-family: 'Source Code Pro', monospace;
  
  margin-bottom: 1rem;
  white-space:pre-wrap
}
code {
  background: rgba(0, 0, 0, 0.05);
  padding: .5rem;
}

pre code {
  overflow-x: scroll;
  background: rgba(0, 0, 0, 0);
  padding: 0;

}



mark,
.highlighted {
  background: var(--color-highlight);
}

.first-letter {
  overflow-wrap: break-word;
  font-family: 'Lora', serif;
  font-size: 60px;
  line-height: 60px;
  display: block;
  position: relative;
  float: left;
  margin: 0px 7px 0 -5px;
}

.subtitle {
  font-family: 'Montserrat', sans-serif;
  color: var(--color-secondary);
  margin: 0 0 1.5em 0;
}

&::selection {
  background-color: var(--color-highlight);
}

`

export default TextStyle
