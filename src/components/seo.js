import React from 'react';
import Helmet from 'react-helmet';

const SEO = () => {
  return (
    <Helmet
      htmlAttributes={{
        lang: `en`,
      }}
      title="I AM MATTHIAS"
    >
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content="A personal portfolio project"></meta>
    </Helmet>
  );
};

export default SEO;
