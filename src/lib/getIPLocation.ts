import axios from 'axios';
import useSWR from 'swr';

export function GetIPLocation(ip: string) {
  const address = `http://ip-api.com/json/${ip}?fields=lat,lon`;
  const fetcher = async (url: string) =>
    await axios.get(url).then((res) => res.data);
  const { data, error } = useSWR(address, fetcher);

  if (error) return `error`;
  if (!data) return `loading`;

  return data;
}
