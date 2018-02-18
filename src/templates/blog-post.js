import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Img from "gatsby-image"

class BlogPost extends Component {
    render() {
        console.log(this.props)
        const { title, createdAt, featuredImage, content } = this.props.data.contentfulBlog
        return (
            <div>
                <h1 style={{
                    borderBottom: '1px solid #ccc',
                    paddingBottom: '0.5rem'
                }}>
                    {title}
                </h1>
                <p>{createdAt}</p>
                <div>
                    <Img sizes={featuredImage.sizes}/>
                </div>
                <hr />
                <div dangerouslySetInnerHTML={{__html:content.childMarkdownRemark.html}} />
            </div>
        )
    }
}

BlogPost.PropTypes = {
    data: PropTypes.object.isRequired
}

export default BlogPost

export const pageQuery = graphql`
    query blogPostQuery($slug: String!){
        contentfulBlog(slug: {eq: $slug}) {
            title
            createdAt(formatString: "MMMM DD, YYYY")
            featuredImage {
                sizes(maxWidth: 800) {
                    ...GatsbyContentfulSizes
                }
            }
            content {
                childMarkdownRemark {
                    html
                }
            }
        }
    }
`
