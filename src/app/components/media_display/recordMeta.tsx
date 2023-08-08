import Squiggle from "@/app/components/squiggle";
import styles from "./styles.module.css";
import { CustomMDX } from "@/app/lib/custom_mdx";

export default function RecordMeta({ record }: any) {
  console.log(record.fields);
  return (
    <div className={styles.record__meta}>
      <div className={styles.record__meta__name}>
        <p>{record.fields.Name}</p>
        <Squiggle />
      </div>
      <div className={styles.pill__box}>
        {record.fields.Collection.map((collection: any) => (
          <p key={collection} className={styles.pill}>
            {collection}
          </p>
        ))}
      </div>

      <CustomMDX source={record.fields.Description} />
    </div>
  );
}
