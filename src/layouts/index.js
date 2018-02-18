import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { injectGlobal } from 'styled-components';

import Header from '../components/Header';
import Footer from '../components/Footer';

/* eslint no-unused-expressions: off */
injectGlobal`
  :root {
    font-size: 16px;
    padding: .5rem;
    background: #dddddd;
  }
  body {
    background: #efefef;
    padding: 1rem;
    color: #999999;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  a {
    color: #999999;
    transition: color .5s;
    text-decoration: none;
  }
  a:hover {
    text-decoration: none;
    color: #457457;
  }
  .gatsby-resp-image-wrapper {
    margin: 2.75rem 0;
  }
`;

const TemplateWrapper = ({ children }) => (
  <div>
    <Helmet
      title="I AM MATTHIAS"
      meta={[
        { name: 'description', content: 'Sample' },
        { name: 'keywords', content: 'sample, something' },
      ]}
    />
    <Header />
      {children()}
      <Footer />
  </div>
)

TemplateWrapper.propTypes = {
  children: PropTypes.func,
}

export default TemplateWrapper
