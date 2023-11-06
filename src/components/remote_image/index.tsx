import Image from "next/image";
import { kvGet, kvSet } from "@/lib/redis-client";
import { getPlaceholder } from "@/lib/getPlaceholder";

interface CachedData {
  base64: string;
  height: number;
  width: number;
}

export default async function RemoteImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // Adjust the source URL if needed
  src = src.includes(`http`) ? src : `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${src}`;

  // Define cache key
  const cacheKey = `image-base64:${src}`;

  // Try to get cached base64 and metadata
  let base64: string,
    height: number = 0,
    width: number = 0;
  const cachedData: CachedData | null = await kvGet(cacheKey);

  if (cachedData) {
    try {
      const data = JSON.parse(cachedData.toString()) || cachedData;

      base64 = data.base64;
      width = data.width || data.metadata.width;
      height = data.height || data.metadata.height;
    } catch (error) {
      console.error("Error parsing cachedData:", error);
    }
  } else {
    // Fetch image buffer if not cached
    const placeholderData = await getPlaceholder(src);
    base64 = placeholderData.base64;
    width = placeholderData.metadata.width;
    height = placeholderData.metadata.height;

    // Cache the base64 and metadata
    const setResult = await kvSet(cacheKey, {
      base64,
      width,
      height,
    });
  }

  const imageSrc =
    src.includes(`imgur`) || src.includes(`cdn.glass.photo`) ? src : `https://wsrv.nl/?w=900&dpr=2&n=-1&url=${src}`;

  return (
    <Image
      className={className}
      src={imageSrc}
      alt={alt}
      height={height!}
      width={width!}
      placeholder='blur'
      blurDataURL={base64!}
      priority={false}
    />
  );
}
