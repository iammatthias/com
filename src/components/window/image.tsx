import Img from 'next/image';

export default function Image({ image }: any) {
  function contentfulLoader({ src, width, quality }: any) {
    return `${src}?w=${width || 1200}&q=${quality || 60}`;
  }

  return (
    <Img
      key={image.index}
      src={image.url}
      alt={image.title}
      layout="fill"
      height={image.height}
      width={image.width}
      placeholder="blur"
      blurDataURL={contentfulLoader({
        src: image.url,
        width: 5,
        quality: 1,
      })}
      objectFit="cover"
      loader={contentfulLoader}
    />
  );
}
