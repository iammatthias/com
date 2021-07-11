/** @jsx jsx */
import { jsx, Grid } from 'theme-ui';
import React from 'react'; //eslint-disable-line

import Layout from '../components/layout';
import Seo from '../components/seo';

// markup
const IndexPage = () => {
  return (
    <Layout>
      <Seo />

      <article sx={{ p: ['.5rem', '2rem'] }}>
        <h1>404</h1>
        <div
          sx={{
            width: ['100%', '50%'],
            height: '0',
            pb: ['42%', '21%'],
            position: 'relative',
          }}
        >
          <iframe
            src="https://giphy.com/embed/2t9mb0HwTVn3mHj8AZ"
            width="100%"
            height="100%"
            sx={{ position: 'absolute' }}
            frameBorder="0"
            className="giphy-embed"
            allowFullScreen
            title="gif1"
          ></iframe>
        </div>

        <div
          sx={{
            width: ['100%', '50%'],
            height: '0',
            pb: ['100%', '50%'],
            position: 'relative',
          }}
        >
          <iframe
            src="https://giphy.com/embed/1Zr9tBf3ZbPaUkjSnQ"
            width="100%"
            height="100%"
            sx={{ position: 'absolute' }}
            frameBorder="0"
            className="giphy-embed"
            allowFullScreen
            title="gif2"
          ></iframe>
        </div>

        <div
          sx={{
            width: ['100%', '50%'],
            height: '0',
            pb: ['100%', '50%'],
            position: 'relative',
          }}
        >
          <iframe
            src="https://giphy.com/embed/YrMrSUfeh5do2FISt8"
            width="100%"
            height="100%"
            sx={{ position: 'absolute' }}
            frameBorder="0"
            className="giphy-embed"
            allowFullScreen
            title="gif3"
          ></iframe>
        </div>
      </article>
    </Layout>
  );
};

export default IndexPage;
