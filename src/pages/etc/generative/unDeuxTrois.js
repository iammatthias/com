/** @jsx jsx */

import React, { useState, useEffect } from 'react' //eslint-disable-line
import { jsx, Box, Flex, ThemeProvider } from 'theme-ui'
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
          context.lineCap = 'square'

          if (window.innerWidth < 750) {
            var step = 10
          } else {
            var step = 20
          }
          var aThirdOfHeight = sizeH / 3

          function draw(x, y, width, height, positions) {
            context.save()
            context.translate(x + width / 2, y + height / 2)
            context.rotate(Math.random() * 5)
            context.translate(-width / 2, -height / 2)

            for (var i = 0; i <= positions.length; i++) {
              context.beginPath()
              context.moveTo(positions[i] * width, 0)
              context.lineTo(positions[i] * width, height)
              context.stroke()
            }

            context.restore()
          }

          for (var y = step; y < sizeH - step * 2; y += step) {
            for (var x = step; x < sizeW - step; x += step) {
              if (y < aThirdOfHeight) {
                draw(x, y, step, step, [0.5])
              } else if (y < aThirdOfHeight * 2) {
                draw(x, y, step, step, [0.2, 0.8])
              } else {
                draw(x, y, step, step, [0.1, 0.5, 0.9])
              }
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
          <SEO title="Un Deux Trois" />
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
