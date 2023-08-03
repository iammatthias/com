import { headers } from "next/headers";

import MoonSunMoon from "@/app/components/moon_sun_moon";
import styles from "./loading.module.css";

import Art from "./tenants/art";
import Com from "./tenants/com";
import Posts from "./tenants/posts";

export default function Home() {
  // we'll come back to this later
  // header values
  const headersList = headers();
  const host = headersList.get("host");

  if (!host) {
    return <p>loading</p>;
  }

  if (host == "localhost:3000") {
    return (
      <>
        <Com />
        <Posts />
        <Art />
      </>
    );
  }

  if (host == "iammatthias.com") {
    return (
      <>
        <Com />
      </>
    );
  }

  if (host == "iammatthias.xyz") {
    return (
      <>
        <Posts />
      </>
    );
  }

  if (host == "iammatthias.art") {
    return (
      <>
        <Art />
      </>
    );
  }

  return (
    <div className={styles.loading}>
      <MoonSunMoon />
    </div>
  );
}
