import React from 'react'
import styled from '@emotion/styled'
import { Link } from 'gatsby'

const List = styled.ul`
  width: 100%;
  margin: 1em auto 0 auto;
  text-align: left;
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    text-align: right;
  }
`

const Tag = styled.li`
  display: inline-block !important;
  margin: 0.5em 1em 0.5em 0 !important;
  a {
    transition: 0.2s;
    background: ${props => props.theme.colors.secondary};
    padding: 0.5em;
    border-radius: 2px;
    text-transform: capitalize;
    text-decoration: none;
    color: ${props => props.theme.colors.text};
    border: 1px solid ${props => props.theme.colors.text};
    &:hover {
      background: ${props => props.theme.colors.highlight};
    }
  }
  @media screen and (min-width: ${props => props.theme.responsive.small}) {
    margin: 0.5em 0 1em 1.5em !important;
  }
`

const TagList = props => {
  return (
    <List {...props}>
      {props.tags.map(tag => (
        <Tag key={tag.id}>
          <Link to={`/tag/${tag.slug}/`}>{tag.title}</Link>
        </Tag>
      ))}
    </List>
  )
}

export default TagList
