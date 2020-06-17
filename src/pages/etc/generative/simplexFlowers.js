/** @jsx jsx */

import React, { useState, useEffect } from 'react' //eslint-disable-line
import { jsx, Box, Flex, ThemeProvider } from 'theme-ui'
import SEO from '../../../components/SEO'
import { Link as GatsbyLink } from 'gatsby'
import Logo from '../../../components/Logo'
import theme from 'gatsby-plugin-theme-ui'
import Pullable from 'react-pullable'

import SimplexNoise from 'simplex-noise'

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

          let canvas
          let context
          let w, h
          let m
          let simplex
          let mx, my
          let now

          function setup() {
            canvas = document.querySelector('canvas')
            context = canvas.getContext('2d')
            reset()
            window.addEventListener('resize', reset)
            canvas.addEventListener('mousemove', mousemove)
          }

          function reset() {
            simplex = new SimplexNoise()
            w = canvas.width = window.innerWidth
            h = canvas.height = window.innerHeight
            m = Math.min(w, h)
            mx = w / 2
            my = h / 2
          }

          function mousemove(event) {
            mx = event.clientX + 1
            my = event.clientY + 1
          }

          function draw(timestamp) {
            now = timestamp
            requestAnimationFrame(draw)
            context.fillStyle = bodyBackground
            context.fillRect(0, 0, w, h)
            context.strokeStyle = bodyColor
            for (let i = 10; i < m / 2 - 40; i += 10) {
              drawCircle(i)
            }
          }

          function drawCircle(r) {
            context.beginPath()
            let point, x, y
            let deltaAngle = (Math.PI * 2) / 400
            for (let angle = 0; angle < Math.PI * 2; angle += deltaAngle) {
              point = calcPoint(angle, r)
              x = point[0]
              y = point[1]
              context.lineTo(x, y)
            }
            context.closePath()
            context.stroke()
          }

          function calcPoint(angle, r) {
            let noiseFactor = (mx / w) * 50
            let zoom = (my / h) * 200
            let x = Math.cos(angle) * r + w / 2
            let y = Math.sin(angle) * r + h / 2
            let n =
              simplex.noise3D(x / zoom, y / zoom, now / 2000) * noiseFactor
            x = Math.cos(angle) * (r + n) + w / 2
            y = Math.sin(angle) * (r + n) + h / 2
            return [x, y]
          }

          setup()
          draw()
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
          <SEO title="Circle Packing" />
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
