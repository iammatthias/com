/** @jsx jsx */

import React from 'react' //eslint-disable-line
import { jsx, Styled, Box } from 'theme-ui'
import { Link } from 'gatsby'
import styled from '@emotion/styled'
import Img from 'gatsby-image'
import { Tooltip } from 'react-tippy'

const Item = styled(Link)`
  color: ${props => props.theme.colors.text};
  background: ${props => props.theme.colors.secondary};
  box-shadow: -5px -5px 35px ${props => props.theme.colors.background},
    5px 5px 35px ${props => props.theme.colors.shadow};
  border: 1px solid;
  border-color: inherit;
  border-radius: 4px;
  text-decoration: none;
  overflow: hidden;
`

const Card = ({ key, to, thumbnail, heroImage, title, time }) => {
  return (
    <>
      {thumbnail ? (
        <Item
          key={key}
          to={to}
          sx={{
            padding: [2, 3],
          }}
        >
          <Tooltip
            // options
            position="bottom"
            followCursor="true"
            html={
              <div
                style={{
                  width: '200px',
                  border: '1px solid',
                  bordercolor: 'inherit',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <Img
                  fluid={{
                    ...thumbnail,
                    aspectRatio: 4 / 3,
                  }}
                />
              </div>
            }
          >
            <Box>
              <Styled.h4>{title}</Styled.h4>
              <Styled.p sx={{ m: 0 }}>{time}</Styled.p>
            </Box>
          </Tooltip>
        </Item>
      ) : heroImage ? (
        <Item key={key} to={to}>
          <Img
            fluid={{
              ...heroImage,
              aspectRatio: 4 / 3,
            }}
            backgroundColor={'#eeeeee'}
            sx={{
              mb: 3,
              borderBottom: '1px solid',
              bordercolor: 'inherit',
            }}
          />

          <Box
            sx={{
              padding: [2, 3],
            }}
          >
            <Styled.h4>{title}</Styled.h4>
            <Styled.p sx={{ m: 0 }}>{time}</Styled.p>
          </Box>
        </Item>
      ) : (
        <Item key={key} to={to}>
          <Box
            sx={{
              padding: [2, 3],
            }}
          >
            <Styled.h4>{title}</Styled.h4>
            <Styled.p sx={{ m: 0 }}>{time}</Styled.p>
          </Box>
        </Item>
      )}
    </>
  )
}

export default Card
