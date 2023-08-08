import Image from "next/image";
import Video from "@/app/components/video";

export default function MediaComponent({ media, record, index }: any) {
  if (media.type.includes("image")) {
    return (
      <Image
        key={index}
        src={`https://wsrv.nl/?url=${media.thumbnails.full.url}`}
        alt={record.fields.Name + " " + index}
        width={media.thumbnails.full.width}
        height={media.thumbnails.full.height}
        priority={true}
      />
    );
  } else if (media.type.includes("video")) {
    return <Video key={index} src={media.url} />;
  }
  return null;
}
