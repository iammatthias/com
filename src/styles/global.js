import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
html,
body {
  margin: 0;
  width: 100%;
  background: var(--color-base);
  color: var(--color-secondary);
  font-size: 16px;
  line-height: 1;
  text-shadow: var(--color-secondary-25) 0 0 1px;
  font-variant-ligatures: none;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
p,
i,
a {
  color: var(--color-secondary);
}

h1,
h2,
h3,
h4,
h5 {
  margin: 2.75rem 0 1rem;
  font-family: 'Lora', serif;
  font-weight: 700;
  line-height: 1.15;
}

h1 {
  margin-top: 0;
  font-size: 3rem;
}

h2 {
  font-size: 2.5rem;
}

h3 {
  font-size: 2rem;
}

h4 {
  font-size: 1.5rem;
}

h5 {
  font-size: 1.25rem;
}
.small {
  font-size: 0.75rem;
}

p,
i,
a,
ul,
li,
form,
textarea,
input {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  line-height: 1.618;
  hyphens: none;
}
b,
strong {
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
ul,
li {
  margin: 0.382rem 0.618rem;
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
  padding: 0 0 0 1rem;
}

button,
input,
textarea,
select {
  background: none;
  border: none;
  appearance: none;
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  resize: none;
  &:focus {
    outline: 1px solid var(--color-highlight);
  }
}

button,
.button {
  font-family: 'Lora', sans-serif;
  font-weight: bold;
  font-size: 1.25em !important;
  padding: 1.382rem 1.618rem;
  cursor: pointer;
  transition: 0.2s;
  width: 100%;
  text-align: center;
  white-space: nowrap;
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

mark,
.highlighted {
  background: var(--color-highlight);
}

&::selection {
  background-color: var(--color-highlight);
}
`

export default GlobalStyle
