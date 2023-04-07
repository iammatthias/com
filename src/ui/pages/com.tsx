// import styles from "./com.module.scss";

import Link from "next/link";

export default function Com() {
  return (
    <>
      <p>
        This site is my digital garden, of sorts. A free form collection of
        thoughts, projects, art, and memes.
      </p>
      <p>
        Day to day I architect growth sytems, and have worked with wonderful
        teams at <Link href='https://opul.com/'>Revance (Opul)</Link>,{` `}
        <Link href='https://tornado.com/'>Tornado</Link>,{` `}
        <Link href='https://www.aspiration.com/'>Aspiration</Link>,{` `}
        <Link href='https://www.surfair.com/'>Surf Air</Link>, and{` `}
        <Link href='https://generalassemb.ly/'>General Assembly</Link>.
      </p>

      <p>
        Want to collaborate? Reach out ⇝{` `}
        <Link href='mailto:hey@iammatthias.com?subject=Collab&body=Hey%20Matthias%2C%0D%0A%0D%0A...'>
          hey@iammatthias.com
        </Link>
      </p>
    </>
  );
}
