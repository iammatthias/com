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

          context.lineWidth = 1

          var circles = []
          var minRadius = 2
          var maxRadius = 100
          var totalCircles = 500
          var createCircleAttempts = 500

          function createAndDrawCircle() {
            var newCircle
            var circleSafeToDraw = false
            for (var tries = 0; tries < createCircleAttempts; tries++) {
              newCircle = {
                x: Math.floor(Math.random() * sizeW),
                y: Math.floor(Math.random() * sizeH),
                radius: minRadius,
              }

              if (doesCircleHaveACollision(newCircle)) {
                continue
              } else {
                circleSafeToDraw = true
                break
              }
            }

            if (!circleSafeToDraw) {
              return
            }

            for (
              var radiusSize = minRadius;
              radiusSize < maxRadius;
              radiusSize++
            ) {
              newCircle.radius = radiusSize
              if (doesCircleHaveACollision(newCircle)) {
                newCircle.radius--
                break
              }
            }

            circles.push(newCircle)
            context.beginPath()
            context.arc(
              newCircle.x,
              newCircle.y,
              newCircle.radius,
              0,
              2 * Math.PI
            )
            context.stroke()
          }

          function doesCircleHaveACollision(circle) {
            for (var i = 0; i < circles.length; i++) {
              var otherCircle = circles[i]
              var a = circle.radius + otherCircle.radius
              var x = circle.x - otherCircle.x
              var y = circle.y - otherCircle.y

              if (a >= Math.sqrt(x * x + y * y)) {
                return true
              }
            }

            if (
              circle.x + circle.radius >= sizeW ||
              circle.x - circle.radius <= 0
            ) {
              return true
            }

            if (
              circle.y + circle.radius >= sizeH ||
              circle.y - circle.radius <= 0
            ) {
              return true
            }

            return false
          }

          for (var i = 0; i < totalCircles; i++) {
            createAndDrawCircle()
          }
        })
      : null
  render() {
    return (
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
    )
  }
}
export default Canvas
