import { Suspense } from "react";
import Link from "next/link";
import AllPostsList from "@/components/all_posts_list";
import Glass from "@/components/glass";

export default function Home() {
  return (
    <>
      <section>
        <h1>Hi, I am Matthias</h1>

        <p>I am a photographer and growth technologist based in Southern California.</p>

        <p>
          My work has taken me to{" "}
          <b>
            <i>Revance (Opul)</i>
          </b>
          ,{" "}
          <b>
            <i>Tornado</i>
          </b>
          ,{" "}
          <b>
            <i>Aspiration</i>
          </b>
          , and{" "}
          <b>
            <i>Surf Air</i>
          </b>
          , where I&apos;ve worked on design systems, led strategic growth initiatives, and built marketing operations.
        </p>

        {/* <p>
          Let&apos;s work together ~{" "}
          <Link href='ma&#105;lto&#58;&#37;&#54;&#56;%65&#121;%40i%61mm&#97;&#116;%7&#52;hias&#46;&#99;om'>
            h&#101;y&#64;&#105;amm&#97;&#116;thias&#46;com
          </Link>
        </p> */}
      </section>
      <section>
        <Glass limit={6} />
      </section>
      {/* <Suspense fallback={<section>Loading...</section>}>
        <AllPostsList />
      </Suspense> */}
      <section>
        <Glass limit={6} offset={6} />
      </section>
    </>
  );
}
