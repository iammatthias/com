import arweave from "@/app/lib/arweave";

export default async function fetchArweaveEntry(slug: string) {
  // get data from Arweave API
  const arweaveData = JSON.parse(
    (await arweave.transactions.getData(slug, {
      decode: true,
      string: true,
    })) as string
  );

  return arweaveData;
}
