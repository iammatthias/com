import Link from 'next/link';
import { txMeta } from './txMeta.css';

type Props = {
  tx: string;
  contributor: string;
};

export default function TxMeta({ tx, contributor }: Props) {
  return (
    <div className={`${txMeta}`}>
      <p>
        <small>
          Tx:{` `}
          <Link href={`https://viewblock.io/arweave/tx/${tx}`} target="_blank">
            {tx}
          </Link>
        </small>
      </p>
      <p>
        <small>
          Contributor:{` `}
          <Link
            href={`https://etherscan.io/address/${contributor}`}
            target="_blank"
          >
            {contributor}
          </Link>
        </small>
      </p>
    </div>
  );
}
