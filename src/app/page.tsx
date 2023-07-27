import { headers } from "next/headers";

import Art from "./tenants/art";
import Com from "./tenants/com";
import Posts from "./tenants/posts";

export default function Home() {
  // we'll come back to this later
  // header values
  const headersList = headers();
  const host = headersList.get("host");

  return (
    <>
      {/* Show if on localhost or iammatthias.com */}
      {(host == "localhost:3000" || host == "iammatthias.com") && <Com />}
      {/* Show if on localhost or iammatthias.xyz */}
      {(host == "localhost:3000" || host == "iammatthias.xyz") && <Posts />}
      {/* Show if on localhost or iammatthias.art */}
      {(host == "localhost:3000" || host == "iammatthias.art") && <Art />}
    </>
  );
}
