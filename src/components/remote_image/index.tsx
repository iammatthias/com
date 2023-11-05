import Image from "next/image";
import { redisClient } from "@/lib/redis-client";
import { getPlaceholder } from "@/lib/getPlaceholder";

export default async function RemoteImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // Adjust the source URL if needed
  src = src.includes(`http`) ? src : `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${src}`;

  // Define cache key
  const cacheKey = `image-base64:${src}`;

  // Try to get cached base64 and metadata
  let base64, metadata;
  const cachedData = await redisClient.get(cacheKey);

  if (cachedData && typeof cachedData === "string") {
    try {
      const parsedData = JSON.parse(cachedData);
      base64 = parsedData.base64;
      metadata = parsedData.metadata;
    } catch (error) {
      console.error("Error parsing cachedData:", error);
    }
  } else {
    // Fetch image buffer if not cached
    const placeholderData = await getPlaceholder(src);
    base64 = placeholderData.base64;
    metadata = placeholderData.metadata;

    // Cache the base64 and metadata
    await redisClient.set(cacheKey, JSON.stringify({ base64, metadata }), { ex: 60 * 60 * 24 }); // Expires in 24 hours
  }

  const imageSrc =
    src.includes(`imgur`) || src.includes(`cdn.glass.photo`) ? src : `https://wsrv.nl/?w=900&dpr=2&n=-1&url=${src}`;

  return (
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
  );
}
