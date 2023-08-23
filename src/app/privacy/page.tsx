import styles from "./page.module.css";
import Nav from "../components/nav";

export default function Privacy() {
  return (
    <section className={styles.section}>
      <Nav />
      <h1>Privacy Policy</h1>

      <p>Last updated: August 20, 2023</p>

      <p>
        By submitting the form on our site, you agree to these terms, which means you&apos;re okay with receiving
        replies and occasional updates or newsletters from us. We only gather your name, email, and the message you send
        at the time of submission. Your information won&apos;t be shared with anyone else or sold. You can ask us for
        your info, request changes to it, or ask for it to be deleted at any time. We don&apos;t use any third-party
        tracking tools right now. If that ever changes, we&apos;ll make sure to update this policy.
      </p>
    </section>
  );
}
