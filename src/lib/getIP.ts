import axios from 'axios';
import useSWR from 'swr';

export function GetIP() {
  const address = `https://api.ipify.org`;
  const fetcher = async (url: string) =>
    await axios.get(url).then((res) => res.data);
  const { data, error } = useSWR(address, fetcher);

  if (error) return `error`;
  if (!data) return `23.241.18.164`;

  return data;
}
