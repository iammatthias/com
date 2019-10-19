import styled from 'styled-components'

export const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'Content';
  max-width: 100%;
`

export const Content = styled.div`
  grid-area: Content;

  height: calc(100vh - 7rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    margin: auto 0;
    padding: 2rem;
  }
  @media screen and (min-width: 52rem) {
    height: calc(100vh);
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64rem) {
    section {
      width: 61.8%;
    }
  }
`

export const Galleries = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  section {
    padding: 2rem;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    grid-gap: 2rem;
    width: 100%;
  }
  @media screen and (min-width: 52rem) {
    section {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      grid-template-rows: repeate(1fr);

      width: 76.4%;
      a {
        &:nth-child(1n + 1) {
          grid-column-end: span 3;
        }
        &:nth-child(1n + 2) {
          grid-column-end: span 2;
        }
        &:nth-child(1n + 3) {
          grid-column-end: span 2;
        }
        &:nth-child(1n + 4) {
          grid-column-end: span 3;
        }
        &:nth-child(1n + 5) {
          grid-column-end: span 3;
        }
        &:nth-child(1n + 6) {
          grid-column-end: span 2;
        }
        &:nth-child(1n + 7) {
          grid-column-end: span 2;
        }
        &:nth-child(1n + 8) {
          grid-column-end: span 3;
        }
      }
    }
  }
  @media screen and (min-width: 64rem) {
    section {
      width: 61.8%;
    }
  }
`

export const About = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    padding: 2rem;
  }
  @media screen and (min-width: 52rem) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64rem) {
    section {
      width: 61.8%;
    }
  }
`

export const BlogPosts = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    padding: 2rem;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    grid-gap: 2rem;
    width: 100%;
  }
  @media screen and (min-width: 52rem) {
    section {
      display: grid;
      grid-template-columns: 1fr;
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64rem) {
    section {
      width: 61.8%;
    }
  }
`

export const ExtendedGallery = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    width: 100%;
    padding: 2rem;
  }
  @media screen and (min-width: 52rem) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64rem) {
    section {
      width: 61.8%;
    }
  }
`

export const BlogContent = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    width: 100%;
    padding: 2rem;
    article {
      margin: 5rem 0;
    }
  }
  @media screen and (min-width: 52rem) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64rem) {
    section {
      width: 61.8%;
    }
  }
`

export const Buttons = styled.div`
  margin: 3rem auto 0;
  .button {
    display: block;
    margin: 0 0 1rem;
  }
  @media screen and (min-width: 52rem) {
    .button {
      display: inline;
      margin: 0 1rem 0 0;
    }
  }
`
