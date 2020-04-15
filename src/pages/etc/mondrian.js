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
          var step = sizeW / 7
          var white = '#F2F5F1'
          var colors = ['#D40920', '#1356A2', '#F7D842']

          var squares = [
            {
              x: 0,
              y: 0,
              width: sizeW,
              height: sizeH,
            },
          ]

          function splitSquaresWith(coordinates) {
            const { x, y } = coordinates

            for (var i = squares.length - 1; i >= 0; i--) {
              const square = squares[i]

              if (x && x > square.x && x < square.x + square.width) {
                if (Math.random() > 0.5) {
                  squares.splice(i, 1)
                  splitOnX(square, x)
                }
              }

              if (y && y > square.y && y < square.y + square.height) {
                if (Math.random() > 0.5) {
                  squares.splice(i, 1)
                  splitOnY(square, y)
                }
              }
            }
          }

          function splitOnX(square, splitAt) {
            var squareA = {
              x: square.x,
              y: square.y,
              width: square.width - (square.width - splitAt + square.x),
              height: square.height,
            }

            var squareB = {
              x: splitAt,
              y: square.y,
              width: square.width - splitAt + square.x,
              height: square.height,
            }

            squares.push(squareA)
            squares.push(squareB)
          }

          function splitOnY(square, splitAt) {
            var squareA = {
              x: square.x,
              y: square.y,
              width: square.width,
              height: square.height - (square.height - splitAt + square.y),
            }

            var squareB = {
              x: square.x,
              y: splitAt,
              width: square.width,
              height: square.height - splitAt + square.y,
            }

            squares.push(squareA)
            squares.push(squareB)
          }

          for (var i = 0; i < sizeW; i += step) {
            splitSquaresWith({ y: i })
            splitSquaresWith({ x: i })
          }

          function draw() {
            for (var i = 0; i < colors.length; i++) {
              squares[Math.floor(Math.random() * squares.length)].color =
                colors[i]
            }
            for (var i = 0; i < squares.length; i++) {
              context.beginPath()
              context.rect(
                squares[i].x,
                squares[i].y,
                squares[i].width,
                squares[i].height
              )
              if (squares[i].color) {
                context.fillStyle = squares[i].color
              } else {
                context.fillStyle = white
              }
              context.fill()
              context.stroke()
            }
          }

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
          <SEO title="Mondrian" />
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
                <Logo
                  css={{ stroke: 'black !important', fill: 'white !important' }}
                />
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
