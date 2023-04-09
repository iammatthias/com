import styles from "./art.module.scss";

import Token from "@/ui/token";

import Link from "next/link";

export default function Art() {
  const contracts = {
    "0x3B3ee1931Dc30C1957379FAc9aba94D1C48a5405": {
      tokens: ["6157", "6160", "6161", "6162", "6181", "7186", "21324"],
    },
  };
  return (
    <>
      <div className={`${styles.entries} entries`}>
        {Object.entries(contracts).map(([contract, { tokens }]) =>
          tokens.map((token) => (
            <Link key={token} href={`/art/${contract}/${token}`}>
              {/* @ts-expect-error Async Server Component */}
              <Token address={contract} token={token} showMeta={false} />
            </Link>
          ))
        )}
      </div>
    </>
  );
}
