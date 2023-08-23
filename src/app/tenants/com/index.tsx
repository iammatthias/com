import styles from "./styles.module.css";
import ContactForm from "../../components/contact_form";
import Nav from "@/app/components/nav";

export default async function Com() {
  return (
    <>
      <section className={styles.section}>
        <Nav />

        <p>
          Hi, I am Matthias — a growth technologist with a penchant for harnessing advanced tools to enhance marketing
          operations for ambitious teams.
        </p>

        <p>
          My adventures have taken me to{" "}
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
          , where I&apos;ve focused on leading strategic transitions and fine-tuning systems.
        </p>

        <p>
          In a past life I was a photographer, specializing in weddings and real estate. Even today, you&apos;ll often
          find me with a camera in hand.
        </p>

        <p>Lets build build something meaningful together ✌️</p>
        <ContactForm />
      </section>
    </>
  );
}
