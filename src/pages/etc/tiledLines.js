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

          if (window.innerWidth < 750) {
            var step = 16
          } else {
            var step = 32
          }
          var dpr = window.devicePixelRatio
          var sizeW = window.innerWidth / dpr
          var sizeH = window.innerHeight / dpr
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          context.scale(dpr, dpr)

          context.lineCap = 'round'
          context.lineWidth = 1 / dpr
          context.strokeStyle = bodyColor

          function draw(x, y, width, height) {
            var leftToRight = Math.random() >= 0.5

            if (leftToRight) {
              context.moveTo(x, y)
              context.lineTo(x + width, y + height)
            } else {
              context.moveTo(x + width, y)
              context.lineTo(x, y + height)
            }

            context.stroke()
          }

          for (var x = 0; x < sizeW; x += step) {
            for (var y = 0; y < sizeH; y += step) {
              draw(x, y, step, step)
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
          <SEO title="Tiled Lines" />
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
