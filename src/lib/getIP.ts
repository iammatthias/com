import axios from 'axios';
import useSWR from 'swr';

export function GetIP() {
  // fetcher
  const fetcher = async (url: string) =>
    await axios.get(url).then((res) => res.data);

  const address = `https://api.ipify.org`;
  const { data, error } = useSWR(address, fetcher);

  if (error) return `23.241.18.168`;
  if (!data) return `23.241.18.162`;

  return data;
}
