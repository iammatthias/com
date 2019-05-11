import { createGlobalStyle } from 'styled-components'

const articleStyle = createGlobalStyle`

.article {
    display: grid;
    grid-template-columns: 1.2rem minmax(1.2rem, 1fr) minmax(auto, 57ch) minmax(1.2rem, 1fr) 1.2rem;
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
    h5, .buttonColumn {
        grid-column: 3;
    }

    figure {
        grid-column: 1 / 6;
        width: 100%;
        max-width: 150ch;
        justify-self: center;
        margin: 1.5rem 0;
        figcaption {
            text-align: center;
        }
    }
}



`

export default articleStyle
