/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Box, Flex, Link } from 'theme-ui'

import CovidForm from '../components/MDX/CovidForm'

const Covid = ({ location }) => {
  return (
    <>
      <Flex sx={{ background: 'black', minHeight: '100vh', height: '100%' }}>
        <Box
          sx={{
            m: [4, 5],
            width: ['100%', '61.8%', '61.8%', '38.2%'],
          }}
        >
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
            What is there to say about Covid-19 that hasn't already been said?
            We are facing a pandemic, and it is affecting life across the
            country.
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            During this time, I am offering free photography services for{' '}
            <b>
              <i>independent</i>
            </b>{' '}
            businesses in Long Beach and Lakewood that have been impacted by the
            COVID-19 outbreak, and have had to move to delivery and curb-side
            pickup.
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            No catch, no strings attached. Just looking to give back to the
            community that my family and I call home.
          </Styled.p>
          <Styled.p sx={{ fontFamily: 'monospace', color: 'white' }}>
            If this sounds good then add your details below and I'll get back to
            you as time allows. I'll try my hardest to help as many folks as I
            can over the next few months
          </Styled.p>
          <CovidForm />
        </Box>
      </Flex>
    </>
  )
}

export default Covid
