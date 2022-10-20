import axios from 'axios';
import useSWR from 'swr';

type Geo = {
  lat: number;
  lon: number;
};

export function GetWeather({ lat, lon }: Geo) {
  const address = `https://api.lil.software/weather?latitude=${lat}&longitude=${lon}`;
  const fetcher = async (url: string) =>
    await axios.get(url).then((res) => res.data);
  const { data, error } = useSWR(address, fetcher);

  if (error) return `error`;

  return data;
}
