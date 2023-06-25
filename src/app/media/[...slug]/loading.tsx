import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import styles from "./page.module.scss";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <>
      <div className={`${styles.post__meta} ${styles.loading}`}>
        <h1>
          <Skeleton />
        </h1>
        <p>
          <Skeleton />
        </p>
        <p>
          <Skeleton />
        </p>
        <hr />
      </div>

      <div className={`${styles.loading}`}>
        <Skeleton count={10} containerClassName='flex-1' />
      </div>
    </>
  );
}
