import React from 'react'
import styled from '@emotion/styled'

const Wrapper = styled.div`
  margin: 0 auto 2em;
  text-align: right;
  span {
    margin: 0 0.5rem;
  }
`

const Date = styled.p`
  display: inline-block;
`

const ReadingTime = styled.p`
  display: inline-block;
`

const PostDetails = props => {
  return (
    <Wrapper {...props}>
      <Date>Updated:&nbsp;&nbsp;&nbsp;📅 {props.date}</Date>
      {props.location.includes('/blog/') && (
        <ReadingTime>
          &nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;{' '}
          {`⏱️${props.timeToRead} min read `}
        </ReadingTime>
      )}
    </Wrapper>
  )
}

export default PostDetails
