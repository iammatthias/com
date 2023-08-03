import MoonSunMoon from "@/app/components/moon_sun_moon";
import styles from "./loading.module.css";

export default function Loading() {
  return (
    <div className={styles.loading}>
      <MoonSunMoon />
    </div>
  );
}
