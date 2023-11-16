function fetchFigmaFile() {
  const data = fetch(`https://api.figma.com/v1/files/VXPXDshaN3pmPK1lhxfNV0`, {
    headers: { "X-Figma-Token": "" },
  }).then((response) => response.json());
  return data;
}

async function fetchFigmaNodes({ node }: { node: string }) {
  const uri = `https://api.figma.com/v1/files/VXPXDshaN3pmPK1lhxfNV0/nodes?ids=${node}`;
  const response = await fetch(uri, {
    headers: { "X-Figma-Token": "" },
  });
  const data = await response.json();
  const nodes = data.nodes;

  // Get the first node's document object
  const document = Object.values(nodes as { [key: string]: { document: any } })[0].document;
  // console.log(document, document.type, document.name, document.style, document.fills);

  return document;
}

export default async function figmaStyles() {
  const figmaFile = await fetchFigmaFile();
  const nodes = figmaFile.styles;

  const nodeData = await Promise.all(
    Object.keys(nodes).map(async (node) => {
      return fetchFigmaNodes({ node });
    })
  );

  // console.log(nodeData);
  return;
}
