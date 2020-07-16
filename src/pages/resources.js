/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Grid, Link } from 'theme-ui'

import Layout from '../components/Layout'
import Container from '../components/Container'

const Posts = ({ data, pageContext, location }) => {
  return (
    <Layout
      title="Resources"
      blurb="Tools and platforms that I've found useful."
      location={location.pathname}
    >
      <Container>
        <Styled.h2 sx={{ margin: '1em 0' }}>Site Tooling</Styled.h2>
        <Grid gap={3} columns={[1, 2, 4]}>
          <Link
            href="http://gatsbyjs.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Gatsby</Styled.h4>
            <Styled.p sx={{ m: 0 }}>
              React powered static site generator
            </Styled.p>
          </Link>
          <Link
            href="https://theme-ui.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Theme-UI</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Flexible, themeable magic</Styled.p>
          </Link>
          <Link
            href="http://contentful.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Contentful</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Content management</Styled.p>
          </Link>
          <Link
            href="http://netlify.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Netlify</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Static site hosting</Styled.p>
          </Link>
          <Link
            href="http://segment.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Segment</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Analytics and data management</Styled.p>
          </Link>
          <Link
            href="http://amplitude.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Amplitude</Styled.h4>
            <Styled.p sx={{ m: 0 }}>
              Analytics dashboards and visualization
            </Styled.p>
          </Link>
        </Grid>
        <Styled.h2 sx={{ margin: '1em 0' }}>Creative</Styled.h2>
        <Grid gap={3} columns={[1, 2, 4]}>
          <Link
            href="http://figma.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Figma</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Browser based design magic</Styled.p>
          </Link>
          <Link
            href="https://lightroom.adobe.com"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Lightroom</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Cloud based photo DAM</Styled.p>
          </Link>
          <Link
            href="https://darkroom.co"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Darkroom</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Image edits on the go</Styled.p>
          </Link>
          <Link
            href="https://www.usa.canon.com/internet/portal/us/home/explore/product-showcases/cameras-and-lenses/full-frame-mirrorless-system/eos-r-system/eos-r-camera"
            sx={{
              color: 'text',
              textDecoration: 'none',
              border: '1px solid',
              bordercolor: 'inherit',
              padding: [2, 3],
            }}
          >
            <Styled.h4>Canon EOS R</Styled.h4>
            <Styled.p sx={{ m: 0 }}>Current camera of choice</Styled.p>
          </Link>
        </Grid>
      </Container>
    </Layout>
  )
}

export default Posts
