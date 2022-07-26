import { useEnsName } from 'wagmi';

export default function GuestENS(props: any) {
  const { data, isError, isLoading } = useEnsName({
    address: props.address,
    chainId: 1,
  });

  if (isLoading) return props.address;
  if (isError) return props.address;

  return data || props.address;
}
