import React from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'
import { FiTwitter, FiInstagram } from 'react-icons/fi'

const Wrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  grid-template-areas: 'Content';
  max-width: 100%;
`
const Content = styled.div`
  grid-area: Content;
  display: flex;
  height: calc(100vh);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  section {
    padding: 2rem;
    p {
      svg {
        vertical-align: middle;
      }
    }
  }
  @media screen and (min-width: 52em) {
    section {
      width: 76.4%;
    }
  }
  @media screen and (min-width: 64em) {
    section {
      width: 61.8%;
    }
  }
`

const Footer = props => {
  return (
    <Wrapper>
      <Content>
        <section>
          <h2>Colophone</h2>
          <p>
            <Link to="/">Home</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/blog">Blog</Link>&nbsp;&nbsp;&nbsp;
            <Link to="/contact">Contact</Link>
          </p>
          <p>
            <FiTwitter />{' '}
            <a href="https://twitter.com/iammatthias">@iammatthias</a>
            &nbsp;&nbsp;&nbsp;
            <FiInstagram />{' '}
            <a href="https://instagram.com/iammatthias">@iammatthias</a>
          </p>
          <p>
            <a
              href="https://www.contentful.com/"
              rel="nofollow noopener noreferrer"
              target="_blank"
              alt="Powered by Contentful"
            >
              <picture>
                <source
                  srcSet="https://images.ctfassets.net/fo9twyrwpveg/7F5pMEOhJ6Y2WukCa2cYws/398e290725ef2d3b3f0f5a73ae8401d6/PoweredByContentful_DarkBackground.svg"
                  media="(prefers-color-scheme: dark)"
                />
                <img
                  src="https://images.ctfassets.net/fo9twyrwpveg/44baP9Gtm8qE2Umm8CQwQk/c43325463d1cb5db2ef97fca0788ea55/PoweredByContentful_LightBackground.svg"
                  rel="contentful"
                  style={{ width: '100px' }}
                  alt="Powered by Contentful"
                />
              </picture>
            </a>
            &nbsp;&nbsp;&nbsp;
            <a
              href="https://www.netlify.com"
              rel="nofollow noopener noreferrer"
              target="_blank"
              alt="Netlify"
            >
              <picture>
                <source
                  srcSet="https://www.netlify.com/img/press/logos/full-logo-dark.svg"
                  media="(prefers-color-scheme: dark)"
                />
                <img
                  src="https://www.netlify.com/img/press/logos/full-logo-light.svg"
                  rel="netlify"
                  style={{ width: '100px' }}
                  alt="Netlify"
                />
              </picture>
            </a>
          </p>
          <p className="small">Made with ♡ in California, USA</p>
        </section>
      </Content>
    </Wrapper>
  )
}

export default Footer
