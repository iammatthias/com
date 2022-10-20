import routeToBlock from 'react-embed/lib/routeToBlock';

export const shouldEmbed = (url) => {
  return routeToBlock([], new URL(url)) !== undefined;
};
