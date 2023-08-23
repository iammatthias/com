import { headers } from "next/headers";

import Art from "./tenants/art";
import Com from "./tenants/com";
import Posts from "./tenants/posts";
import Loader from "./components/loader";

export default function Home() {
  // we'll come back to this later
  // header values
  const headersList = headers();
  const host = headersList.get("host");

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
    <>
      <Com />
      <Posts />
      <Art />
    </>
  );
}
