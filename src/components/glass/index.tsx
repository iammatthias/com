import { getGlassPosts } from "@/lib/glass";
import Masonry from "../masonry";
import Link from "next/link";
import RemoteImage from "../remote_image";
import styles from "./styles.module.css";

export default async function Glass({ limit = 25, offset = 0 }: { limit?: number; offset?: number }) {
  const glassPosts = await getGlassPosts({ limit, offset });

  const posts = await Promise.all(
    glassPosts.map(async (post: any) => {
      return (
        <Link href={post.post.share_url} target='_blank' key={post.post.id}>
          <RemoteImage alt={post.post.description} src={post.post.image640x640} className={styles.img} />
        </Link>
      );
    })
  );

  return <Masonry items={posts} />;
}
