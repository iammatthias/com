import { createGlobalStyle } from 'styled-components'

const ArticleStyle = createGlobalStyle`

article {
    display: grid;
    grid-template-columns:1fr 1fr 10px 4fr 10px 1fr 1fr ;
}

article > * {
    grid-column: 4;
}

article > figure {
    grid-column: 1 / -1;
    margin: 20px 0;
}

article > .aside {
    grid-column: 5 / -1;
}

article > blockquote {
    grid-column: 3 / span 2;
    margin: 0;
    border-left: 3px solid black;
    padding-left: 10px;
}

article > * {
    min-width: 0;
}

article > p {    
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    margin: .618rem 0; 
}

article > .aside {
    margin: 30px 20px;
}

img {
    width: 100%;
}

.line-numbers a {
    text-decoration: none;
    padding-right: 1em;
}

code {
    padding: 2px 5px;
}

pre {
    padding: 10px 15px;
    overflow: auto;
}

pre > code {
    padding: 0;
}

figure {
    margin: 0;
}

figure figcaption {
    color: var(--color-secondary-50);
    font-style: italic;
    font-size: 0.8em;
}

`

export default ArticleStyle
