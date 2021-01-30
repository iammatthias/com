/** @jsx jsx */

import React from 'react'; //eslint-disable-line
import { jsx } from 'theme-ui';
import PropTypes from 'prop-types';
import { Link as GatsbyLink } from 'gatsby';

// Checks against absolute URLs that share 👇 so we can still pass it along to Gatsby's internal link component
const domainRegex = /http[s]*:\/\/[www.]*iammatthias\.com[/]?/;

const MarkdownLink = ({ props, href, ...rest }) => {
  const sameDomain = domainRegex.test(href);

  if (sameDomain) {
    href = href.replace(domainRegex, '/');
  }

  if (href.startsWith('/')) {
    return <GatsbyLink data-link-internal to={href} {...rest} />;
  }

  // Treat urls that aren't web protocols as "normal" links
  if (!href.startsWith('http')) {
    return <a href={href} {...rest} />; // eslint-disable-line jsx-a11y/anchor-has-content
  }

  return (
    <a //eslint-disable-line
      data-link-external
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      {...rest}
      {...props}
    />
  );
};

MarkdownLink.propTypes = {
  href: PropTypes.string.isRequired,
};

export default MarkdownLink;
