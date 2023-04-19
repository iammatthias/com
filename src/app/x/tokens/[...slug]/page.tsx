import Comments from "@/app/components/Comments";
import Token from "@/app/components/Token";
import fetchTokenData from "@/app/data/fetch/onchain/fetchTokenData";

export interface Props {
  params?: any;
  searchParams?: any;
}

export default async function TokenPage({ params }: Props) {
  if (!params.slug) {
    return <>Loading...</>;
  }

  const data = await fetchTokenData(params.slug[0], params.slug[1]).then(
    (tokenData) => ({
      tokenType: tokenData.tokenType,
      name: tokenData.name,
      description: tokenData.description,
      contentUrl: tokenData.contentURL.replace(
        "ipfs://",
        "https://gateway.ipfs.io/ipfs/"
      ),
      contentUrlMimeType: tokenData.contentURLMimeType,
    })
  );

  return (
    <>
      <Token tokenData={data} showCaption />
      {params.slug[0] !== "0xa6bf594bbb86fa36ea9b835a50c4cacc3c0e3288" && (
        <>
          {/* @ts-expect-error Server Component */}
          <Comments slug={`${params.slug[0]}`} />
        </>
      )}
    </>
  );
}
