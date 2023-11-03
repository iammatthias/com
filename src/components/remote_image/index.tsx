import Image from "next/image";
import { getPlaiceholder } from "plaiceholder";
import { Suspense } from "react";

export default async function RemoteImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  //  if source is just a filename we need to add the url and fetch it from the Cloudflare bucket
  src = src.includes(`http`) ? src : `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${src}`;

  const buffer = await fetch(src).then(async (res) => {
    return Buffer.from(await res.arrayBuffer());
  });

  const { base64, metadata } = await getPlaiceholder(buffer);

  const wsrv = `https://wsrv.nl/?w=900&dpr=2&n=-1&url=${src}`;

  const imageSrc = src.includes(`imgur`) || src.includes(`cdn.glass.photo`) ? src : wsrv;

  return (
    <Suspense>
      <Image
        className={className}
        src={imageSrc}
        alt={alt}
        height={metadata.height}
        width={metadata.width}
        placeholder='blur'
        blurDataURL={base64}
        priority={false}
      />
    </Suspense>
  );
}
