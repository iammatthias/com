import { getGlassPosts } from "@/lib/glass";
import Masonry from "../masonry";
import Link from "next/link";
import RemoteImage from "../remote_image";
import styles from "./styles.module.css";
import { Suspense } from "react";

export default async function Glass({ limit = 25, offset = 0 }: { limit?: number; offset?: number }) {
  const glassPosts = await getGlassPosts({ limit, offset });

  const posts = await Promise.all(
    glassPosts.map(async (post: any) => {
      return (
        <Suspense key={post.post.id}>
          {/* <Link href={post.post.share_url} target='_blank'>
            <RemoteImage alt={post.post.description} src={post.post.image640x640} className={styles.img} />
          </Link> */}
          <RemoteImage alt={post.post.description} src={post.post.image640x640} className={styles.img} />
        </Suspense>
      );
    })
  );

  return <Masonry items={posts} />;
}
