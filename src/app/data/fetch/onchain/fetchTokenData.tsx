export default async function fetchTokenData(address: string, token: string) {
  const res = await fetch(
    `https://use.nifti.es/api/eip155:1/eip721:${address}/${token}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
