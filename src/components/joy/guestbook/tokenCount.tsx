import abi from '@/lib/contract/abi.json';
import { BigNumber } from 'ethers';

import { useContractRead, useProvider } from 'wagmi';

export default function TokenCount() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const provider = useProvider();

  const { data, isLoading } = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    } as any,
    `tokenCount`,
    {
      watch: false,
    },
  );

  return isLoading ? null : data && BigNumber.from(data._hex).toString();
}
