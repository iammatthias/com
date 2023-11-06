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
  src = src.includes("http") ? src : `https://pub-8bcf4a42832e4273a5a34c696ccc1b55.r2.dev/${src}`;

  // Define cache key
  const cacheKey = `image-base64:${src}`;

  // Try to get cached base64 and metadata
  let base64: string, height: number, width: number;
  const cachedData: CachedData | null = await kvGet(cacheKey);

  // Check if cached data has necessary width and height
  let shouldFetchPlaceholder = !cachedData;
  console.log("shouldFetchPlaceholder:", shouldFetchPlaceholder);
  if (cachedData) {
    try {
      const data = cachedData as CachedData;
      base64 = data.base64;
      width = data.width;
      height = data.height;

      // If width or height are missing, set flag to fetch placeholder
      if (typeof width === "undefined" || typeof height === "undefined") {
        console.log("width or height are undefined");
        shouldFetchPlaceholder = true;
      }
    } catch (error) {
      console.error("Error parsing cachedData:", error);
      shouldFetchPlaceholder = true; // Set flag to fetch placeholder on error
    }
  }

  // Fetch and cache if needed
  if (shouldFetchPlaceholder) {
    console.log("Fetching placeholder");
    const placeholderData = await getPlaceholder(src);
    base64 = placeholderData.base64;
    width = placeholderData.metadata.width;
    height = placeholderData.metadata.height;

    // Cache the base64 and metadata
    await kvSet(cacheKey, {
      base64,
      width,
      height,
    });
  }

  const imageSrc =
    src.includes("imgur") || src.includes("cdn.glass.photo") ? src : `https://wsrv.nl/?w=900&dpr=2&n=-1&url=${src}`;

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
