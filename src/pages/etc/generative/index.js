/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx } from 'theme-ui'

import Layout from '../../../components/Layout'
import Container from '../../../components/Container'
import CardList from '../../../components/CardList'
import Card from '../../../components/Card'

const Posts = ({ data, pageContext, location }) => {
  return (
    <Layout
      title="Generative"
      blurb="Generative art is the fascinating intersection between code and art.
            The results are unpredicatble, and no two pieces will be the same."
      location={location.pathname}
    >
      <Container>
        <div>
          <CardList location={location.pathname}>
            <Card
              to={`/etc/generative/simplexFlowers/`}
              title="Simplex Flowers"
              time="Noisy flowers using simplex noise"
            />
            <Card
              to={`/etc/generative/circlePacking/`}
              title="Circle Packing"
              time="Circles in tight spaces"
            />
            <Card
              to={`/etc/generative/cubicDisaray/`}
              title="Cubic Disaray"
              time="Inspired by Georg Nees"
            />
            <Card
              to={`/etc/generative/hypnoticSquares/`}
              title="Hypnotic Squares"
              time="Inspired by William Kolomyjec"
            />
            <Card
              to={`/etc/generative/joyDivision/`}
              title="Joy Division"
              time="Unknown Pleasures"
            />
            <Card
              to={`/etc/generative/mondrian/`}
              title="Mondrian"
              time="Inspired by Piet Mondrian"
            />
            <Card
              to={`/etc/generative/tiledLines/`}
              title="Tiled Lines"
              time="Simple Beauty"
            />
            <Card
              to={`/etc/generative/triangularMesh/`}
              title="Triangular Mesh"
              time="A simple mesh layer"
            />
            <Card
              to={`/etc/generative/unDeuxTrois/`}
              title="Un Deux Trois"
              time="Inspired by Vera Molnár"
            />
          </CardList>
        </div>
      </Container>
    </Layout>
  )
}

export default Posts
