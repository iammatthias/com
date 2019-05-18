import React, { Component } from 'react'
import { Link } from 'gatsby'
import styled from 'styled-components'

require('../../styles/prism.css')

const Buttons = styled.div`
  grid-column: 3;
  margin-bottom: 5rem;
`

class Article extends Component {
  zoom = null

  componentDidMount() {
    import('medium-zoom').then(mediumZoom => {
      this.zoom = mediumZoom.default('img')
    })
  }

  componentWillUnmount() {
    if (this.zoom) {
      this.zoom.detach()
    }
  }
  render() {
    return (
      <>
        <article
          className="article"
          dangerouslySetInnerHTML={{
            __html: this.props.body.childMarkdownRemark.html,
          }}
        />
        <Buttons className="article buttonColumn">
          {this.props.previous && (
            <Link className="button" to={`/blog/${this.props.previous.slug}/`}>
              Prev Post
            </Link>
          )}
          {this.props.next && (
            <Link className="button" to={`/blog/${this.props.next.slug}/`}>
              Next Post
            </Link>
          )}
          <a className="button" color="" href={this.props.discussUrl}>
            Discuss on Twitter
          </a>
        </Buttons>
      </>
    )
  }
}

export default Article
