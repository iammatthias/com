import { useEnsLookup } from 'wagmi';

export default function Ens({ address }: any) {
  const [{ data: ens, loading }] = useEnsLookup({
    address: address,
  });

  return loading ? address : ens ? ens : address;
}
