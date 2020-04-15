/** @jsx jsx */

import React, { useState, useEffect } from 'react' //eslint-disable-line
import { jsx, Box, Flex, ThemeProvider } from 'theme-ui'
import SEO from '../../components/SEO'
import { Link as GatsbyLink } from 'gatsby'
import Logo from '../../components/Logo'
import theme from 'gatsby-plugin-theme-ui'
import Pullable from 'react-pullable'

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
          context.lineWidth = 1 / dpr
          context.strokeStyle = bodyColor

          var randomDisplacement = 15
          var rotateMultiplier = 20
          var offset = 0

          if (window.innerWidth < 750) {
            var squareSize = 15
          } else {
            var squareSize = 30
          }

          function draw(width, height) {
            context.beginPath()
            context.rect(-width / 2, -height / 2, width, height)
            context.stroke()
          }

          for (var i = squareSize; i <= sizeW - squareSize; i += squareSize) {
            for (var j = squareSize; j <= sizeH - squareSize; j += squareSize) {
              var plusOrMinus = Math.random() < 0.5 ? -1 : 1
              var rotateAmt =
                (((j / sizeH) * Math.PI) / 180) *
                plusOrMinus *
                Math.random() *
                rotateMultiplier

              plusOrMinus = Math.random() < 0.5 ? -1 : 1
              var translateAmt =
                (j / sizeW) * plusOrMinus * Math.random() * randomDisplacement

              context.save()
              context.translate(i + translateAmt + offset, j + offset)
              context.rotate(rotateAmt)
              draw(squareSize, squareSize)
              context.restore()
            }
          }
        })
      : null
  render() {
    return (
      <Pullable
        onRefresh={() =>
          typeof window !== `undefined` ? window.location.reload() : null
        }
      >
        <ThemeProvider theme={theme}>
          <SEO title="Cubic Disaray" />
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
      </Pullable>
    )
  }
}
export default Canvas
