/** @jsx jsx */

import React, { useState, useEffect } from 'react' //eslint-disable-line
import { jsx, Box, Flex, Styled, ThemeProvider } from 'theme-ui'
import SEO from '../../../components/SEO'
import { Link as GatsbyLink } from 'gatsby'
import Logo from '../../../components/Logo'
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
          console.log(bodyColor)

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

          var step = 10
          var lines = []

          // Create the lines
          for (var i = step; i <= sizeH - step; i += step) {
            var line = []
            for (var j = step; j <= sizeW - step; j += step) {
              var distanceToCenter = Math.abs(j - sizeW / 2)
              var variance = Math.max(sizeW / 2 - 50 - distanceToCenter, 0)
              var random = ((Math.random() * variance) / 2) * -1
              var point = { x: j, y: i + random }
              line.push(point)
            }
            lines.push(line)
          }

          if (window.innerWidth < 750) {
            var skipLines = 5
          } else {
            var skipLines = 20
          }

          // Do the drawing
          for (var i = [skipLines]; i < lines.length; i++) {
            context.beginPath()
            context.moveTo(lines[i][0].x, lines[i][0].y)

            for (var j = 0; j < lines[i].length - 2; j++) {
              var xc = (lines[i][j].x + lines[i][j + 1].x) / 2
              var yc = (lines[i][j].y + lines[i][j + 1].y) / 2
              context.quadraticCurveTo(lines[i][j].x, lines[i][j].y, xc, yc)
            }

            context.quadraticCurveTo(
              lines[i][j].x,
              lines[i][j].y,
              lines[i][j + 1].x,
              lines[i][j + 1].y
            )
            context.save()
            context.globalCompositeOperation = 'destination-out'
            context.fill()
            context.restore()
            context.stroke()
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
          <SEO title="Joy Division" />
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
