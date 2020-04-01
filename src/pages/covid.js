/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Box, Flex, Link } from 'theme-ui'

import { Link as GatsbyLink } from 'gatsby'

import CovidForm from '../components/MDX/CovidForm'

import Logo from '../components/Logo'

const Covid = ({ location }) => {
  return (
    <>
      <Flex sx={{ background: 'black', minHeight: '100vh', height: '100%' }}>
        <Box
          sx={{
            m: [3, 4, 5],
            width: ['100%', '61.8%', '61.8%', '38.2%'],
          }}
        >
          <GatsbyLink to="/">
            <Logo
              css={{ stroke: 'white !important', fill: 'black !important' }}
            />
          </GatsbyLink>
          <Styled.h1 sx={{ fontFamily: 'monospace', color: 'white' }}>
            Covid-19
          </Styled.h1>
          <Styled.p
            sx={{
              fontFamily: 'monospace',
              color: 'white',
            }}
          >
            <Link
              sx={{
                textDecoration: 'underline',
              }}
              href="https://www.cdc.gov/coronavirus/2019-ncov/index.html"
            >
              CDC Information Site
            </Link>{' '}
            &{' '}
            <Link
              sx={{
                textDecoration: 'underline',
              }}
              href="https://coronavirus.jhu.edu/"
            >
              Johns Hopkins Resource Center
            </Link>
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            We are facing a pandemic, and it is affecting people across the
            country.
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            During this time, I am offering free photography services for{' '}
            <b>
              <i>independent</i>
            </b>{' '}
            businesses in Long Beach and Lakewood that have been impacted by the
            COVID-19 outbreak, and have moved to delivery and curb-side pickup.
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            No catch, no strings attached. If you need help producing new images
            for your online presence I would love to help. Just looking to give
            back to the community that my family and I call home.
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            All I ask is that you treat me, my time (work and family need to
            come first), and my equipment with respect (and maybe feed me, if
            you want).
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            If this sounds good then add your details below and I'll get back to
            you as time allows. I'll try my hardest to help as many folks as I
            can over the next few months.
          </Styled.p>
          <CovidForm />
        </Box>
      </Flex>
    </>
  )
}

export default Covid
