/** @jsxImportSource theme-ui */

import { useEnsLookup } from 'wagmi'

export default function Ens({ address }) {
  const [{ data: ens, loading }, lookupAddress] = useEnsLookup({
    address: address,
  })

  return loading ? address : ens ? ens : address
}
