import abi from '@/lib/contract/abi.json';
import { BigNumber } from 'ethers';

import { useContractRead, useProvider } from 'wagmi';

export default function MaxTokens() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS;

  const provider = useProvider();

  const [{ data, loading }] = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    } as any,
    `maxTokens`,
    {
      watch: false,
    },
  );

  return loading ? null : data && BigNumber.from(data._hex).toString();
}
