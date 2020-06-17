/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Grid, Link as ExternalLink } from 'theme-ui'
import { Link } from 'gatsby'
import Layout from '../../../components/Layout'
import Container from '../../../components/Container'

const Posts = ({ data, pageContext, location }) => {
  return (
    <Layout location={location.pathname}>
      <Container>
        <div>
          <Styled.h2 sx={{ margin: '1em 0' }}>Generative</Styled.h2>
          <Styled.p sx={{ width: ['100%', '61.8%', '61.8%', '38.2%'], mb: 4 }}>
            Generative art is a fascinating intersection of code and art. The
            results are unpredicatble, and no two pieces will be the same. I've
            been working through some{' '}
            <ExternalLink src="https://generativeartistry.com/tutorials/">
              tutorials
            </ExternalLink>{' '}
            on the web recently, and my ever-evolving attempts are linked below.
            These will continue to evolve and develop as I explore more of the
            field.
          </Styled.p>
          <Grid gap={3} columns={[1, 2, 4]}>
            <Link
              to={`/etc/generative/simplexFlowers/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Simplex Flowers</Styled.h4>
              <Styled.p sx={{ m: 0 }}>
                Noisy flowers using simplex noise
              </Styled.p>
            </Link>
            <Link
              to={`/etc/generative/circlePacking/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Circle Packing</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Circles in tight spaces</Styled.p>
            </Link>
            <Link
              to={`/etc/generative/cubicDisaray/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Cubic Disaray</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Inspired by Georg Nees</Styled.p>
            </Link>
            <Link
              to={`/etc/generative/hypnoticSquares/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Hypnotic Squares</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Inspired by William Kolomyjec</Styled.p>
            </Link>
            <Link
              to={`/etc/generative/joyDivision/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Joy Division</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Unknown Pleasures</Styled.p>
            </Link>

            <Link
              to={`/etc/generative/mondrian/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Mondrian</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Inspired by Piet Mondrian</Styled.p>
            </Link>
            <Link
              to={`/etc/generative/tiledLines/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Tiled Lines</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Simple Beauty</Styled.p>
            </Link>
            <Link
              to={`/etc/generative/triangularMesh/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Triangular Mesh</Styled.h4>
              <Styled.p sx={{ m: 0 }}>A simple mesh layer</Styled.p>
            </Link>
            <Link
              to={`/etc/generative/unDeuxTrois/`}
              sx={{
                color: 'text',
                textDecoration: 'none',
                border: '1px solid',
                bordercolor: 'inherit',
                padding: [2, 3],
              }}
            >
              <Styled.h4>Un Deux Trois</Styled.h4>
              <Styled.p sx={{ m: 0 }}>Inspired by Vera Molnár</Styled.p>
            </Link>
          </Grid>
        </div>
      </Container>
    </Layout>
  )
}

export default Posts
