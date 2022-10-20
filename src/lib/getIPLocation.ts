import axios from 'axios';
import useSWR from 'swr';

export function GetIPLocation(ip: string) {
  // fetcher
  const fetcher = async (url: string) =>
    await axios.get(url).then((res) => res.data);

  const address = `https://ipapi.co/${ip}/latlong`;

  const { data, error } = useSWR(address, fetcher);

  if (error) return `error`;
  if (!data) return `loading`;

  return data;
}
