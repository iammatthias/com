import BackButton from "@/ui/backButton";
import styles from "./page.module.scss";

import Token from "@/ui/token";

export default function OnchainArt({
  params,
}: {
  params: { contract: string; id: string };
}) {
  return (
    <>
      <BackButton />
      <div className={`${styles.art} art`}>
        {/* @ts-expect-error Async Server Component */}
        <Token address={params.contract} token={params.id} showMeta={true} />
      </div>
    </>
  );
}
