import React from 'react'
import styled from '@emotion/styled'
import { Link } from 'gatsby'

const List = styled.ul`
  width: 100%;
  margin: 0 auto 1em auto;
  text-align: right;
`

const Tag = styled.li`
  display: inline-block !important;
  margin: 0.5em 0 0.5em 1em !important;
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
