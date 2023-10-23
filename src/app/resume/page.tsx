import Link from "next/link";
import MoonSunMoon from "../../components/moon_sun_moon";
import styles from "./page.module.css";
import Nav from "../../components/nav";

export default function Resume() {
  return (
    <section className={styles.section}>
      {/* <Nav /> */}
      <Link href='/'>
        <MoonSunMoon />
      </Link>
      <p>
        <b>
          <i>2012-Current — Photographer</i>
        </b>{" "}
        Fine art & freelance
      </p>
      <p>
        <b>
          <i>2022-Current — Revance</i>
        </b>{" "}
        Design System Engineer
      </p>
      <p>
        <b>
          <i>2021-2022 — Tornado</i>
        </b>{" "}
        Growth Engineer
      </p>
      <p>
        <b>
          <i>2018-2021 — Aspiration</i>
        </b>{" "}
        CRM Architect
      </p>
      <p>
        <b>
          <i>2016-2018 — Surf Air</i>
        </b>{" "}
        Product & Marketing Coordinator
      </p>

      <p>
        <b>Education</b>
      </p>

      <p>
        <b>
          <i>2010-2014 — Brooks Institute</i>
        </b>{" "}
        Bachelors Degree, Commercial Photography
      </p>
    </section>
  );
}
