import styles from "./styles.module.css";
import MoonSunMoon from "../../components/moon_sun_moon";
import ContactForm from "../../components/contact_form";

export default async function Com() {
  return (
    <>
      <section className={styles.section}>
        <MoonSunMoon />
        <p>
          Hi, I am Matthias — a growth technologist with a focus on the
          practical application of AI and LLMs for novel marketing operations
          and audacious teams.
        </p>

        <p>
          Previously I have worked with{" "}
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
          .
        </p>

        <p>
          In a past life I was a photographer who shot a lot of weddings and
          real estate. I can still be found with a camera in my hand most days.
        </p>

        <p>Lets build together ✌️</p>
        <ContactForm />
      </section>
    </>
  );
}
