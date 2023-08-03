import styles from "./styles.module.css";
import MoonSunMoon from "../moon_sun_moon";

export default function Loader() {
  return (
    <div className={styles.loading}>
      <MoonSunMoon />
    </div>
  );
}
