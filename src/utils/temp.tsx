import useSWR from 'swr';

export default function Temp() {
  const fetcher = (url: any) => fetch(url).then((res) => res.json());

  // get ip address
  const { data: ipData } = useSWR(`/api/ip`, fetcher);
  const ip = ipData?.ip;

  // get location
  const location = `https://ipwho.is/${ip}`;
  const { data: locData } = useSWR(location, fetcher);

  // set lat and lon
  const lat = locData?.latitude;
  const lon = locData?.longitude;

  // get weather
  const weather = `https://api.lil.software/weather?latitude=${lat}&longitude=${lon}`;
  const { data: weatherData } = useSWR(weather, fetcher);

  const currentWeather = weatherData?.forecast[0];
  const currentTemp = currentWeather?.temperature;

  if (currentTemp !== undefined) {
    return <span>{currentTemp}°</span>;
  }

  return null;
}
