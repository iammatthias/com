import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.section}>
        <h1>Privacy Policy</h1>

        <p>Last updated: July 20, 2023</p>

        <p>
          We only gather your name, email, and the message you send. We may use
          this to reply to your message or, if you give us permission, to
          occasionally send you updates or newsletters. Your information won't
          be shared with anyone else or sold. We keep it only for as long as
          necessary. You can ask us for your info, request changes to it, or ask
          for it to be deleted at any time. We don't use any third-party
          tracking tools right now. If that ever changes, we'll make sure to
          update this policy. To use the form on our site, you must agree to
          this policy. When you do this, it means you're okay with receiving
          replies and occasional updates or newsletters from us.
        </p>
      </section>
    </main>
  );
}
