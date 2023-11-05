import { getPlaiceholder } from "plaiceholder";

export async function getPlaceholder(src: string) {
  const buffer = await fetch(src).then(async (res) => Buffer.from(await res.arrayBuffer()));
  const plaiceholderData = await getPlaiceholder(buffer);
  return {
    base64: plaiceholderData.base64,
    metadata: plaiceholderData.metadata,
  };
}
