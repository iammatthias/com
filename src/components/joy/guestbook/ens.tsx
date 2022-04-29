import { useEnsName } from 'wagmi';

export default function Ens({ address }: any) {
  const { data: ens, isLoading } = useEnsName({
    address: address,
  });

  return isLoading ? address : ens ? ens : address;
}
