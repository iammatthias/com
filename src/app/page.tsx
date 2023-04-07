import { headers } from "next/headers";

import Com from "@/ui/pages/com";
import Xyz from "@/ui/pages/xyz";
import Art from "@/ui/pages/art";

export default async function Index() {
  // header values
  const headersList = headers();
  const host = headersList.get("host");

  return (
    <>
      {(host === "iammatthias.com" || host?.includes("localhost")) && <Com />}
      {/* {(host === "iammatthias.art" || host === "localhost:3000") && <Art />} */}
      {/* @ts-expect-error */}
      {(host === "iammatthias.xyz" || host?.includes("localhost")) && <Xyz />}
    </>
  );
}
