/** @jsx jsx */

import React, { useState, useEffect } from 'react' //eslint-disable-line
import { jsx, Box, Flex, ThemeProvider } from 'theme-ui'
import SEO from '../../components/SEO'
import { Link as GatsbyLink } from 'gatsby'
import Logo from '../../components/Logo'
import theme from 'gatsby-plugin-theme-ui'

class Canvas extends React.Component {
  componentDidMount =
    typeof window !== `undefined`
      ? (window.onresize = () => {
          let elem = document.querySelector('body')
          let bodyColor = window
            .getComputedStyle(elem, null)
            .getPropertyValue('color')
          let bodyBackground = window
            .getComputedStyle(elem, null)
            .getPropertyValue('background-color')
          console.log(bodyBackground)

          var canvas = document.querySelector('canvas')
          var context = canvas.getContext('2d')

          var dpr = window.devicePixelRatio
          var sizeW = window.innerWidth / dpr
          var sizeH = window.innerHeight / dpr
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          context.scale(dpr, dpr)
          context.strokeStyle = bodyColor
          context.lineWidth = 1 / dpr

          var finalSize = 3
          var startSteps
          var offset = 2

          if (window.innerWidth < 750) {
            var tileStep = (sizeW - offset * 2) / 7
          } else {
            var tileStep = (sizeW - offset * 2) / 21
          }
          var startSize = tileStep
          var directions = [-1, 0, 1]

          function draw(x, y, width, height, xMovement, yMovement, steps) {
            context.beginPath()
            context.rect(x, y, width, height)
            context.stroke()

            if (steps >= 0) {
              var newSize = startSize * (steps / startSteps) + finalSize
              var newX = x + (width - newSize) / 2
              var newY = y + (height - newSize) / 2
              newX = newX - ((x - newX) / (steps + 2)) * xMovement
              newY = newY - ((y - newY) / (steps + 2)) * yMovement
              draw(
                newX,
                newY,
                newSize,
                newSize,
                xMovement,
                yMovement,
                steps - 1
              )
            }
          }

          for (var x = offset; x < sizeW - offset; x += tileStep) {
            for (var y = offset; y < sizeH - offset; y += tileStep) {
              startSteps = 2 + Math.ceil(Math.random() * 3)
              var xDirection =
                directions[Math.floor(Math.random() * directions.length)]
              var yDirection =
                directions[Math.floor(Math.random() * directions.length)]
              draw(
                x,
                y,
                startSize,
                startSize,
                xDirection,
                yDirection,
                startSteps - 1
              )
            }
          }
        })
      : null
  render() {
    return (
      <ThemeProvider theme={theme}>
        <SEO title="Hypnotic Squares" />
        <Flex
          sx={{
            minHeight: '100vh',
            height: '100%',
            pb: 5,
            position: 'relative',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              m: [3, 4, 5],
              px: 2,
              py: 3,
              zIndex: '1',
            }}
          >
            <GatsbyLink to="/">
              <Logo sx={{ stroke: 'text', fill: 'background' }} />
            </GatsbyLink>
          </Box>

          <canvas sx={{ position: 'absolute', top: '0', zIndex: '0' }} />
        </Flex>
      </ThemeProvider>
    )
  }
}
export default Canvas
