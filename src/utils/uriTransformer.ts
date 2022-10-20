const allowedLinkProtocols = [
  `http`,
  `https`,
  `mailto`,
  `tel`,
  `ethereum`,
  `crowdfund`,
];

export default function uriTransformer(uri: any) {
  const url = (uri || ``).trim();
  const first = url.charAt(0);

  if (first === `#` || first === `/`) {
    return url;
  }

  const colon = url.indexOf(`:`);
  if (colon === -1) {
    return url;
  }

  const length = allowedLinkProtocols.length;
  let index = -1;

  while (++index < length) {
    const protocol = allowedLinkProtocols[index];

    if (
      colon === protocol.length &&
      url.slice(0, protocol.length).toLowerCase() === protocol
    ) {
      return url;
    }
  }

  index = url.indexOf(`?`);
  if (index !== -1 && colon > index) {
    return url;
  }

  index = url.indexOf(`#`);
  if (index !== -1 && colon > index) {
    return url;
  }

  return `#`;
}
