import Span from '@/components/primitives/text/Span'
import abi from '@/lib/contracts/abi.json'
import BigNumber from 'bignumber.js'

import { useContractRead, useProvider } from 'wagmi'

export default function TokenCount() {
  const contractAddress = process.env.NEXT_PUBLIC_TARGET_CONTRACT_ADDRESS

  const provider = useProvider()

  const [{ data, loading }, read] = useContractRead(
    {
      addressOrName: contractAddress,
      contractInterface: abi.abi,
      signerOrProvider: provider,
    } as any,
    'tokenCount',
    {
      watch: false,
    },
  )

  return loading ? null : data && new BigNumber(data._hex).toString()
}
