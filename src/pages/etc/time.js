/** @jsx jsx */

import React, { useState, useEffect } from 'react' //eslint-disable-line
import { jsx, Styled, Box, Flex } from 'theme-ui'
import SEO from '../../components/SEO'
import { Link as GatsbyLink } from 'gatsby'
import Logo from '../../components/Logo'

import styled from '@emotion/styled'
import { motion, transform } from 'framer-motion'

const GradientWrapper = styled(motion.div)`
  overflow: hidden;
  position: absolute;
  top: 0;
  z-index: -2;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Gradient = styled(motion.div)`
  position: absolute;
  top: 0;
  height: 400%;
  width: 100%;
  background: linear-gradient(
    to top,
    rgb(61, 52, 139) 0%,
    rgb(125, 122, 188) 25%,
    rgb(255, 165, 165) 50%,
    rgb(255, 180, 162) 75%,
    rgb(255, 214, 192) 100%
  );
`

const Time = () => {
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    let timerID = setInterval(() => tick(), 1000)
    return function cleanup() {
      clearInterval(timerID)
    }
  })

  function tick() {
    setDate(new Date())
  }

  const time = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  })

  const hour24 = date.toLocaleTimeString([], {
    hour: 'numeric',
    hour12: false,
  })

  const currentSeconds = date.toLocaleTimeString([], {
    second: '2-digit',
  })

  const currentMinutes = date.toLocaleTimeString([], {
    minute: '2-digit',
  })

  const exactMinute = Number(hour24) * 60 + Number(currentMinutes)
  const exactSecond = exactMinute * 60 + Number(currentSeconds)
  const gradientPosition = transform(
    exactSecond,
    [0, 43200, 86400],
    [0, -300, 0]
  )

  return (
    <>
      <SEO title="Time" />
      <Flex
        sx={{ minHeight: '100vh', height: '100%', pb: 5, position: 'relative' }}
      >
        <Box
          sx={{
            m: [3, 4, 5],
            px: 2,
            py: 3,
            width: ['100%', '61.8%', '61.8%', '38.2%'],
          }}
        >
          <GatsbyLink to="/">
            <Logo
              css={{ stroke: 'black !important', fill: 'white !important' }}
            />
          </GatsbyLink>
          <Styled.h1
            sx={{
              fontFamily: 'body',
              color: 'white',
            }}
          >
            It is {time} local time.
          </Styled.h1>
        </Box>
      </Flex>
      <GradientWrapper animate={{ opacity: [0, 1] }}>
        <Gradient style={{ top: `${gradientPosition}%` }} />
      </GradientWrapper>
    </>
  )
}

export default Time
