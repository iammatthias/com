import React from 'react'
import styled from '@emotion/styled'

const Wrapper = styled.div`
  margin: 0 auto 2em;
  text-align: left;
  span {
    margin: 0 0.5rem;
  }
`

const Date = styled.p`
  display: inline-block;
  font-size: 14px;
`

const ReadingTime = styled.p`
  display: inline-block;
  font-size: 14px;
`

const PostDetails = props => {
  return (
    <Wrapper {...props}>
      <Date>Updated:&nbsp;&nbsp;&nbsp;📅 {props.date}</Date>

      {props.location.includes('/blog/') && (
        <ReadingTime>{`⏱️${props.timeToRead} min read `}</ReadingTime>
      )}
    </Wrapper>
  )
}

export default PostDetails
