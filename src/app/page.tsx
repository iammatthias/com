// import { headers } from "next/headers";

// import Art from "./tenants/art";
import Com from "./tenants/com";

export default function Home() {
  // we'll come back to this later
  // header values
  // const headersList = headers();
  // const host = headersList.get("host");

  // if (host == "iammatthias.art") {
  //   return (
  //     <>
  //       <Art />
  //     </>
  //   );
  // }

  return (
    <>
      <Com />
      {/* <Art /> */}
    </>
  );
}
