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
          console.log('background:', bodyBackground)
          console.log('color:', bodyColor)

          var canvas = document.querySelector('canvas')
          var context = canvas.getContext('2d')

          var dpr = window.devicePixelRatio
          var sizeW = window.innerWidth / dpr
          var sizeH = window.innerHeight / dpr
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          context.scale(dpr, dpr)
          context.lineJoin = 'bevel'
          context.strokeStyle = bodyColor
          context.lineWidth = 1 / dpr

          var line,
            dot,
            odd = false,
            lines = [],
            gap = sizeH / 15

          for (var y = gap / 2; y <= sizeH; y += gap) {
            odd = !odd
            line = []
            for (var x = gap / 4; x <= sizeW; x += gap) {
              dot = { x: x + (odd ? gap / 2 : 0), y: y }
              line.push({
                x: x + (Math.random() * 0.8 - 0.4) * gap + (odd ? gap / 2 : 0),
                y: y + (Math.random() * 0.8 - 0.4) * gap,
              })
              context.fill()
            }
            lines.push(line)
          }

          function drawTriangle(pointA, pointB, pointC) {
            context.beginPath()
            context.moveTo(pointA.x, pointA.y)
            context.lineTo(pointB.x, pointB.y)
            context.lineTo(pointC.x, pointC.y)
            context.lineTo(pointA.x, pointA.y)
            context.closePath()

            context.fillStyle = bodyBackground
            context.fill()
            context.stroke()
          }

          var dotLine
          odd = true

          for (var y = 0; y < lines.length - 1; y++) {
            odd = !odd
            dotLine = []
            for (var i = 0; i < lines[y].length; i++) {
              dotLine.push(odd ? lines[y][i] : lines[y + 1][i])
              dotLine.push(odd ? lines[y + 1][i] : lines[y][i])
            }
            for (var i = 0; i < dotLine.length - 2; i++) {
              drawTriangle(dotLine[i], dotLine[i + 1], dotLine[i + 2])
            }
          }
        })
      : null
  render() {
    return (
      <ThemeProvider theme={theme}>
        <SEO title="Triangular Mesh" />
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
